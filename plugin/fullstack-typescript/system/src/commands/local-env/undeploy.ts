/**
 * Undeploy application from local Kubernetes environment.
 *
 * Removes deployed Helm charts (keeps infrastructure and databases).
 *
 * Usage:
 *   sdd-system env undeploy [chart-name] [--namespace=<app-name>]
 */

import { execSync } from 'node:child_process';
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
    };
  }>;
}

export const undeploy = async (
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const { positional, named } = parseNamedArgs(args);
  const specificChart = positional[0];

  const rootResult = await findProjectRoot();
  if (!rootResult.found) {
    return { success: false, error: 'Could not find project root (no package.json found)' };
  }
  const projectRoot = rootResult.path;
  const settingsPath = path.join(projectRoot, '.sdd', 'sdd-settings.yaml');

  try {
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

    const helmComponents = settings.components?.filter((c) => c.type === 'helm') ?? [];

    const toUndeploy = specificChart
      ? helmComponents.filter((c) => c.name === specificChart)
      : helmComponents;

    if (specificChart && toUndeploy.length === 0) {
      return {
        success: false,
        error: `Helm chart '${specificChart}' not found in settings`,
      };
    }

    const undeployed: ReadonlyArray<string> = toUndeploy.reduce<ReadonlyArray<string>>(
      (acc, component) => {
        console.log(`Undeploying ${component.name}...`);
        try {
          execSync(`helm uninstall ${component.name} -n ${namespace}`, { stdio: 'inherit' });
          return [...acc, component.name];
        } catch {
          console.warn(`Warning: ${component.name} was not deployed or already removed`);
          return acc;
        }
      },
      []
    );

    return {
      success: true,
      message: `Undeployed ${undeployed.length} chart(s)`,
      data: { undeployed, namespace },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Undeploy failed: ${message}` };
  }
};
