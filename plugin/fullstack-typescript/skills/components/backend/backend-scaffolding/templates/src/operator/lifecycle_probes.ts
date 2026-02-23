// Lifecycle Probes: Kubernetes-style health check endpoints
// Runs on separate port from main API server for infrastructure monitoring
import express, { type Express, type Request, type Response } from "express";
import type { Server } from "node:http";

export type LifecycleProbesDependencies = Readonly<{
    readonly getAppState: () => string;
}>;

export type LifecycleProbes = Readonly<{
    readonly start: (port: number) => Promise<void>;
    readonly stop: () => Promise<void>;
}>;

export const createLifecycleProbes = (
    deps: LifecycleProbesDependencies
): LifecycleProbes => {
    const { getAppState } = deps;

    let server: Server | null = null;
    const app: Express = express();

    // Health probe (use for startupProbe and livenessProbe)
    // If the server responds, the process is alive
    app.get("/health", (_req: Request, res: Response) => {
        res.json({ status: "ok" });
    });

    // Readiness probe (use for readinessProbe)
    // Only ready when app is fully running and can serve traffic
    app.get("/readiness", (_req: Request, res: Response) => {
        const state = getAppState();
        if (state === "RUNNING") {
            res.json({ status: "ready" });
        } else {
            res.status(503).json({ status: "not_ready", state });
        }
    });

    const start = async (port: number): Promise<void> => {
        await new Promise<void>((resolve, reject) => {
            server = app.listen(port, () => {
                resolve();
            });
            server.on("error", reject);
        });
    };

    const stop = async (): Promise<void> => {
        if (!server) {
            return;
        }

        await new Promise<void>((resolve, reject) => {
            server!.close((err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
        server = null;
    };

    return { start, stop };
};
