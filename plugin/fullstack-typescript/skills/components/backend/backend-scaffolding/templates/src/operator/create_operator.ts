// Operator: Provides raw I/O capabilities and orchestrates application lifecycle
// NO domain knowledge - only infrastructure (DB, HTTP clients, cache, etc.)
// Telemetry is initialized here as the first thing before other modules
import { createBaseLogger, createLogger } from "./logger";
import { createController } from "../controller";
import { findGreetingById, insertGreeting } from "../dal";
import { createDatabase } from "./create_database";
import { createHttpServer } from "./create_http_server";
import { createLifecycleProbes } from "./lifecycle_probes";
import { createStateMachine } from "./state_machine";

import type { Config } from "../config";

type OperatorDependencies = Readonly<{
    readonly config: Config;
}>;

type Operator = Readonly<{
    readonly start: () => Promise<void>;
    readonly stop: () => Promise<void>;
}>;

// Unix signals handled by the operator
type UnixSignal = "SIGTERM" | "SIGINT" | "SIGHUP";

// Operator lifecycle states (substates use colon convention: "PARENT:SUBSTATE")
type OperatorState =
    | "IDLE"
    | "STARTING:PROBES"
    | "STARTING:DATABASE"
    | "STARTING:HTTP_SERVER"
    | "RUNNING"
    | "STOPPING:HTTP_SERVER"
    | "STOPPING:DATABASE"
    | "STOPPING:PROBES"
    | "STOPPED"
    | "FAILED";

export const createOperator = (deps: OperatorDependencies): Operator => {
    const { config } = deps;

    // Initialize telemetry first - logger is created here before any other modules
    const baseLogger = createBaseLogger(config);
    const logger = createLogger(baseLogger, "operator");

    // Create raw I/O capabilities (no domain knowledge)
    const db = createDatabase({ config, logger });

    // Bind DAL functions with database
    const dal = {
        findGreetingById: findGreetingById.bind(null, { db }),
        insertGreeting: insertGreeting.bind(null, { db }),
    };

    // Create controller, passing raw I/O + DAL + config
    const controller = createController({ dal });

    // State machine for operator lifecycle
    const stateMachine = createStateMachine<OperatorState>({
        initial: "IDLE",
        transitions: {
            IDLE: ["STARTING:PROBES"],
            "STARTING:PROBES": ["STARTING:DATABASE", "FAILED"],
            "STARTING:DATABASE": ["STARTING:HTTP_SERVER", "FAILED"],
            "STARTING:HTTP_SERVER": ["RUNNING", "FAILED"],
            RUNNING: ["STOPPING:HTTP_SERVER"],
            "STOPPING:HTTP_SERVER": ["STOPPING:DATABASE", "FAILED"],
            "STOPPING:DATABASE": ["STOPPING:PROBES", "FAILED"],
            "STOPPING:PROBES": ["STOPPED", "FAILED"],
            STOPPED: ["STARTING:PROBES"], // Allow restart
            FAILED: ["STARTING:PROBES"], // Allow retry
        },
    });

    // Create lifecycle probes server (health/readiness)
    const lifecycleProbes = createLifecycleProbes({
        getAppState: stateMachine.getState,
    });

    // Create HTTP server with controller
    const httpServer = createHttpServer({ controller });

    // Handle all state transitions
    stateMachine.onTransition(async (from, to) => {
        logger.info({ from, to }, "State transition");
        switch (to) {
            case "IDLE":
                // Initial state, nothing to do
                break;
            case "STARTING:PROBES":
                await lifecycleProbes.start(config.probesPort);
                logger.info(
                    { port: config.probesPort },
                    "Lifecycle probes listening",
                );
                await stateMachine.transition("STARTING:DATABASE");
                break;
            case "STARTING:DATABASE":
                await db.connect();
                await stateMachine.transition("STARTING:HTTP_SERVER");
                break;
            case "STARTING:HTTP_SERVER":
                await httpServer.start(config.port);
                await stateMachine.transition("RUNNING");
                break;
            case "RUNNING":
                logger.info({ port: config.port }, "Operator listening");
                break;
            case "STOPPING:HTTP_SERVER":
                await httpServer.stop();
                await stateMachine.transition("STOPPING:DATABASE");
                break;
            case "STOPPING:DATABASE":
                await db.close();
                await stateMachine.transition("STOPPING:PROBES");
                break;
            case "STOPPING:PROBES":
                await lifecycleProbes.stop();
                await stateMachine.transition("STOPPED");
                break;
            case "STOPPED":
                logger.info("Operator stopped");
                break;
            case "FAILED":
                logger.error("Operator entered failed state");
                break;
            default: {
                const exhaustiveCheck: never = to;
                throw new Error(`Unhandled state: ${exhaustiveCheck}`);
            }
        }
    });

    const start = async (): Promise<void> => {
        const state = stateMachine.getState();
        if (state === "RUNNING") {
            logger.warn("Operator already running");
            return;
        }
        if (state !== "IDLE" && state !== "STOPPED" && state !== "FAILED") {
            throw new Error(`Cannot start operator in state: ${state}`);
        }
        try {
            await stateMachine.transition("STARTING" as OperatorState);
        } catch (err) {
            await stateMachine.transition("FAILED");
            throw err;
        }
    };

    const stop = async (): Promise<void> => {
        const state = stateMachine.getState();

        // Idempotent: already stopped or never started
        if (state === "STOPPED" || state === "IDLE") {
            return;
        }

        // Already stopping, wait for completion
        if (state.startsWith("STOPPING:")) {
            return;
        }

        if (state !== "RUNNING") {
            throw new Error(`Cannot stop operator in state: ${state}`);
        }

        try {
            await stateMachine.transition("STOPPING" as OperatorState);
        } catch (err) {
            await stateMachine.transition("FAILED");
            throw err;
        }
    };

    // Signal handler for graceful shutdown
    const handleSignal = (signal: UnixSignal): void => {
        logger.info({ signal }, "Received signal, initiating graceful shutdown");
        stop()
            .then(() => {
                logger.info({ signal }, "Graceful shutdown complete");
                process.exit(0);
            })
            .catch((err) => {
                logger.error({ signal, err }, "Error during graceful shutdown");
                process.exit(1);
            });
    };

    // Register signal handlers
    // SIGTERM: Kubernetes sends this for graceful shutdown (preStop hook, pod termination)
    // SIGINT: Ctrl+C from terminal (local development)
    // SIGHUP: Terminal hangup (optional, used for graceful restart in some systems)
    const signals: ReadonlyArray<UnixSignal> = ["SIGTERM", "SIGINT", "SIGHUP"];
    signals.forEach((signal) => {
        process.on(signal, () => handleSignal(signal));
    });

    logger.debug({ signals }, "Signal handlers registered");

    return { start, stop };
};
