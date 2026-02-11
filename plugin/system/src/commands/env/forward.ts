/**
 * Port forwarding for local Kubernetes environment.
 *
 * Manages port forwards for local access to services.
 *
 * Usage:
 *   sdd-system env forward [start|stop|list] [--namespace=<app-name>]
 */

import { spawn, execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { findProjectRoot } from '@/lib/config';

type SddSettings = {
  readonly name?: string;
  readonly components?: ReadonlyArray<{
    readonly name: string;
    readonly type: string;
    readonly settings?: {
      readonly deploys?: string;
      readonly deploy_type?: string;
      readonly ingress?: boolean;
    };
  }>;
}

type ForwardConfig = {
  readonly service: string;
  readonly namespace: string;
  readonly localPort: number;
  readonly remotePort: number;
}

export const forward = async (
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const { positional, named } = parseNamedArgs(args);
  const action = positional[0] ?? 'start'; // start | stop | list

  try {
    if (action === 'list') {
      return listForwards();
    }

    if (action === 'stop') {
      return stopForwards();
    }

    // action === 'start' - read settings and start port forwards
    const rootResult = await findProjectRoot();
    if (!rootResult.found) {
      return { success: false, error: 'Could not find project root (no package.json found)' };
    }
    const projectRoot = rootResult.path;

    const settingsPath = path.join(projectRoot, '.sdd', 'sdd-settings.yaml');
    if (!fs.existsSync(settingsPath)) {
      return {
        success: false,
        error: 'No .sdd/sdd-settings.yaml found. Is this an SDD project?',
      };
    }

    const settings = yaml.parse(fs.readFileSync(settingsPath, 'utf-8')) as SddSettings;

    // Use app name from settings as namespace (can be overridden with --namespace)
    const namespace = named['namespace'] ?? settings.name;
    if (!namespace) {
      return {
        success: false,
        error: 'No app name in sdd-settings.yaml and no --namespace provided',
      };
    }

    const databaseComponents =
      settings.components?.filter((c) => c.type === 'database') ?? [];
    const helmComponents = settings.components?.filter((c) => c.type === 'helm') ?? [];

    // Build forward configs

    // Database forwards (for hybrid local development)
    // Service name follows setup.ts convention: ${componentName}-db-postgresql
    const dbForwards: ReadonlyArray<ForwardConfig> = databaseComponents.map((db, index) => ({
      service: `${db.name}-db-postgresql`, // bitnami chart service name
      namespace,
      localPort: 5432 + index,
      remotePort: 5432,
    }));

    // Helm service forwards
    const helmForwards: ReadonlyArray<ForwardConfig> = helmComponents.reduce<ReadonlyArray<ForwardConfig>>(
      (acc, component) => {
        const helmSettings = component.settings;
        const nextPort = 8080 + acc.length;
        if (helmSettings?.deploy_type === 'server' && helmSettings?.ingress) {
          // API servers get port forward
          return [
            ...acc,
            {
              service: component.name,
              namespace,
              localPort: nextPort,
              remotePort: 3000,
            },
          ];
        }
        if (helmSettings?.deploy_type === 'webapp' && helmSettings?.ingress) {
          // Webapps get port forward
          return [
            ...acc,
            {
              service: component.name,
              namespace,
              localPort: nextPort,
              remotePort: 80,
            },
          ];
        }
        return acc;
      },
      []
    );

    // Telemetry forwards
    const telemetryForwards: ReadonlyArray<ForwardConfig> = [
      {
        service: 'vmstack-victoria-metrics-k8s-stack',
        namespace: 'telemetry',
        localPort: 9090,
        remotePort: 9090,
      },
      {
        service: 'vls-victoria-logs-single-server',
        namespace: 'telemetry',
        localPort: 9428,
        remotePort: 9428,
      },
    ];

    const forwards: ReadonlyArray<ForwardConfig> = [
      ...dbForwards,
      ...helmForwards,
      ...telemetryForwards,
    ];

    // Start port forwards
    const started: ReadonlyArray<string> = forwards.reduce<ReadonlyArray<string>>(
      (acc, fwd) => {
        try {
          // Check if service exists
          execSync(`kubectl get svc ${fwd.service} -n ${fwd.namespace}`, { stdio: 'pipe' });

          // Start port-forward in background
          const child = spawn(
            'kubectl',
            [
              'port-forward',
              `svc/${fwd.service}`,
              `${fwd.localPort}:${fwd.remotePort}`,
              '-n',
              fwd.namespace,
            ],
            {
              detached: true,
              stdio: 'ignore',
            }
          );
          child.unref();

          return [...acc, `${fwd.service} -> localhost:${fwd.localPort}`];
        } catch {
          console.warn(`Warning: Service ${fwd.service} not found, skipping`);
          return acc;
        }
      },
      []
    );

    const message = `Port forwards started:\n${started.map((s) => `  ${s}`).join('\n')}\n`;

    return {
      success: true,
      message,
      data: { forwards: started },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Port forward failed: ${message}` };
  }
};

const listForwards = (): CommandResult => {
  try {
    const result = execSync('pgrep -af "kubectl port-forward"', { encoding: 'utf-8' });
    return {
      success: true,
      message: `Active port forwards:\n${result}`,
    };
  } catch {
    return {
      success: true,
      message: 'No active port forwards',
    };
  }
};

const stopForwards = (): CommandResult => {
  try {
    execSync('pkill -f "kubectl port-forward"', { stdio: 'pipe' });
    return {
      success: true,
      message: 'All port forwards stopped',
    };
  } catch {
    return {
      success: true,
      message: 'No port forwards were running',
    };
  }
};
