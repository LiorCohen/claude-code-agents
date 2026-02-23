/**
 * Database port-forward command.
 *
 * Port forward PostgreSQL to local machine.
 *
 * Usage:
 *   sdd-system database port-forward <component-name>
 */

import { spawn } from 'node:child_process';
import type { CommandResult } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';

export const portForward = async (
  componentName: string,
  args: readonly string[],
  env: string = 'local'
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);

  const namespace = named['namespace'] ?? process.env['DB_NAMESPACE'] ?? env;
  const releaseName = named['release-name'] ?? process.env['DB_RELEASE_NAME'] ?? `${componentName}-db`;
  const localPort = named['local-port'] ?? '5432';
  const remotePort = named['remote-port'] ?? '5432';

  const service = `svc/${releaseName}-postgresql`;

  console.log(`Port forwarding ${service} to localhost:${localPort}`);
  console.log('Press Ctrl+C to stop');
  console.log('');

  return new Promise((resolve) => {
    const child = spawn(
      'kubectl',
      ['port-forward', service, `${localPort}:${remotePort}`, '-n', namespace],
      { stdio: 'inherit' }
    );

    child.on('error', (err) => {
      resolve({
        success: false,
        error: `Port forward failed: ${err.message}`,
      });
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          message: 'Port forward stopped',
        });
      } else {
        resolve({
          success: false,
          error: `Port forward exited with code ${code}`,
        });
      }
    });

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      child.kill('SIGINT');
    });
  });
};
