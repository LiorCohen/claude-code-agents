/**
 * Generate local environment configuration.
 *
 * Creates `components/config/envs/local/config.yaml` with localhost URLs
 * matching port-forwarded services.
 *
 * Usage:
 *   sdd-system env config
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import type { CommandResult, GlobalOptions } from '@/lib/args';
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
      readonly database?: string;
      readonly user?: string;
      readonly password?: string;
    };
  }>;
}

type LocalConfigUrls = {
  readonly databases: Readonly<Record<string, { host: string; port: number }>>;
  readonly services: Readonly<Record<string, string>>;
}

export const config = async (
  _args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const rootResult = await findProjectRoot();
  if (!rootResult.found) {
    return { success: false, error: 'Could not find project root (no package.json found)' };
  }
  const projectRoot = rootResult.path;

  const settingsPath = path.join(projectRoot, '.sdd', 'sdd-settings.yaml');
  const localEnvDir = path.join(projectRoot, 'components', 'config', 'envs', 'local');
  const localConfigPath = path.join(localEnvDir, 'config.yaml');

  try {
    if (!fs.existsSync(settingsPath)) {
      return {
        success: false,
        error: 'No .sdd/sdd-settings.yaml found. Is this an SDD project?',
      };
    }

    const settings = yaml.parse(fs.readFileSync(settingsPath, 'utf-8')) as SddSettings;
    const databaseComponents =
      settings.components?.filter((c) => c.type === 'database') ?? [];
    const helmComponents = settings.components?.filter((c) => c.type === 'helm') ?? [];

    // Build local URLs based on port forward assignments

    // Database URLs (ports start at 5432)
    const databases: Readonly<Record<string, { host: string; port: number }>> =
      Object.fromEntries(
        databaseComponents.map((db, index) => [
          db.name,
          { host: 'localhost', port: 5432 + index },
        ])
      );

    // Service URLs (ports start at 8080)
    const services: Readonly<Record<string, string>> = Object.fromEntries(
      helmComponents
        .filter((component) => {
          const helmSettings = component.settings;
          return helmSettings?.deploy_type === 'server' || helmSettings?.deploy_type === 'webapp';
        })
        .map((component, index) => {
          const serviceName = component.settings?.deploys ?? component.name;
          return [serviceName, `http://localhost:${8080 + index}`];
        })
    );

    const urls: LocalConfigUrls = { databases, services };

    // Build the local config overlay
    const dbEntries: ReadonlyArray<readonly [string, unknown]> = Object.entries(urls.databases).map(
      ([dbName, dbConfig]) => {
        const db = databaseComponents.find((c) => c.name === dbName);
        const dbSettings = db?.settings ?? {};
        return [
          dbName,
          {
            host: dbConfig.host,
            port: dbConfig.port,
            database: dbSettings.database ?? dbName.replace(/-/g, '_'),
            user: dbSettings.user ?? 'postgres',
            password: dbSettings.password ?? 'postgres',
          },
        ] as const;
      }
    );

    const svcEntries: ReadonlyArray<readonly [string, unknown]> = Object.entries(urls.services).map(
      ([serviceName, url]) => [serviceName, { url }] as const
    );

    const localConfig: Readonly<Record<string, unknown>> = Object.fromEntries([
      ...dbEntries,
      ...svcEntries,
      ['telemetry', {
        metrics_url: 'http://localhost:9090',
        logs_url: 'http://localhost:9428',
      }],
    ]);

    // Ensure directory exists
    if (!fs.existsSync(localEnvDir)) {
      fs.mkdirSync(localEnvDir, { recursive: true });
    }

    // Write or update local config
    const yamlOutput = yaml.stringify(localConfig);
    fs.writeFileSync(localConfigPath, yamlOutput, 'utf-8');

    console.log('Generated local environment config:');
    console.log(yamlOutput);

    return {
      success: true,
      message: `Local config written to: ${localConfigPath}`,
      data: { path: localConfigPath, config: localConfig },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Config generation failed: ${message}` };
  }
};
