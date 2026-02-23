/**
 * Database teardown command.
 *
 * Remove PostgreSQL database from Kubernetes cluster.
 *
 * Usage:
 *   sdd-system database teardown <component-name>
 */

import { execSync } from 'node:child_process';
import type { CommandResult } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';

export const teardown = async (
  componentName: string,
  args: readonly string[],
  env: string = 'local'
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);

  const namespace = named['namespace'] ?? process.env['DB_NAMESPACE'] ?? env;
  const releaseName = named['release-name'] ?? process.env['DB_RELEASE_NAME'] ?? `${componentName}-db`;

  console.log(`Removing PostgreSQL release: ${releaseName} from namespace: ${namespace}`);

  try {
    execSync(`helm uninstall "${releaseName}" --namespace "${namespace}"`, {
      stdio: 'inherit',
    });

    console.log('');
    console.log('PostgreSQL removed successfully!');

    return {
      success: true,
      message: 'PostgreSQL removed successfully',
      data: { namespace, releaseName },
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Failed to remove PostgreSQL: ${errorMessage}`,
    };
  }
};
