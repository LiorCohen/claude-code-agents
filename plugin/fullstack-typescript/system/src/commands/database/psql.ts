/**
 * Database psql command.
 *
 * Open interactive psql shell.
 *
 * Usage:
 *   sdd-system database psql <component-name>
 */

import { spawn } from 'node:child_process';
import type { CommandResult } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';

export const psql = async (
  componentName: string,
  args: readonly string[],
  env: string = 'local'
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);

  // Default connection settings (assumes port-forward is running)
  const pgHost = named['host'] ?? process.env['PGHOST'] ?? 'localhost';
  const pgPort = named['port'] ?? process.env['PGPORT'] ?? '5432';
  const pgDatabase = named['database'] ?? process.env['PGDATABASE'] ?? componentName;
  const pgUser = named['user'] ?? process.env['PGUSER'] ?? componentName;
  const pgPassword = named['password'] ?? process.env['PGPASSWORD'] ?? `${componentName}-local`;

  console.log(`Connecting to ${pgDatabase}@${pgHost}:${pgPort} (env: ${env})...`);
  console.log('');

  return new Promise((resolve) => {
    const child = spawn('psql', [], {
      stdio: 'inherit',
      env: {
        ...process.env,
        PGHOST: pgHost,
        PGPORT: pgPort,
        PGDATABASE: pgDatabase,
        PGUSER: pgUser,
        PGPASSWORD: pgPassword,
      },
    });

    child.on('error', (err) => {
      resolve({
        success: false,
        error: `Failed to start psql: ${err.message}`,
      });
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          message: 'psql session ended',
        });
      } else {
        resolve({
          success: false,
          error: `psql exited with code ${code}`,
        });
      }
    });
  });
};
