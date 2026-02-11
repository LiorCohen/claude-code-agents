/**
 * Database seed command.
 *
 * Run database seed files.
 *
 * Usage:
 *   sdd-system database seed <component-name>
 */

import { execSync } from 'node:child_process';
import * as path from 'node:path';
import type { CommandResult } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { exists, walkDir } from '@/lib/fs';
import { findProjectRoot } from '@/lib/config';

export const seed = async (
  componentName: string,
  args: readonly string[]
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);

  // Find project root
  const projectRootResult = await findProjectRoot();
  if (!projectRootResult.found) {
    return {
      success: false,
      error: 'Could not find project root (no package.json found)',
    };
  }

  const projectRoot = projectRootResult.path;

  // Find component directory
  const componentDir = path.join(projectRoot, 'components', componentName);
  const seedsDir = path.join(componentDir, 'seeds');

  if (!(await exists(seedsDir))) {
    return {
      success: false,
      error: `Seeds directory not found: ${seedsDir}`,
    };
  }

  // Default connection settings (assumes port-forward is running)
  const pgHost = named['host'] ?? process.env['PGHOST'] ?? 'localhost';
  const pgPort = named['port'] ?? process.env['PGPORT'] ?? '5432';
  const pgDatabase = named['database'] ?? process.env['PGDATABASE'] ?? componentName;
  const pgUser = named['user'] ?? process.env['PGUSER'] ?? componentName;
  const pgPassword = named['password'] ?? process.env['PGPASSWORD'] ?? `${componentName}-local`;

  // Set environment for psql
  const env = {
    ...process.env,
    PGHOST: pgHost,
    PGPORT: pgPort,
    PGDATABASE: pgDatabase,
    PGUSER: pgUser,
    PGPASSWORD: pgPassword,
  };

  // Verify PostgreSQL connection
  try {
    execSync('psql -c "SELECT 1"', { stdio: 'pipe', env });
  } catch {
    return {
      success: false,
      error: `Cannot connect to PostgreSQL at ${pgHost}:${pgPort}. Make sure port-forward is running: sdd-system database port-forward ${componentName}`,
    };
  }

  // Find all seed files
  const seedFiles = [...(await walkDir(seedsDir, (entry) => entry.name.endsWith('.sql')))].sort();

  if (seedFiles.length === 0) {
    console.log('No seed files found');
    return {
      success: true,
      message: 'No seed files found',
      data: { seedsRun: 0 },
    };
  }

  console.log('Running seeds...');

  const runSeeds = (
    files: ReadonlyArray<string>,
    completed: ReadonlyArray<string>
  ): { readonly completed: ReadonlyArray<string>; readonly error?: string } => {
    const seedFile = files[0];
    if (seedFile === undefined) return { completed };
    const rest = files.slice(1);
    const fileName = path.basename(seedFile);
    console.log(`  ${fileName}`);
    try {
      execSync(`psql -f "${seedFile}"`, { stdio: 'inherit', env });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { completed, error: errorMessage };
    }
    return runSeeds(rest, [...completed, fileName]);
  };

  const result = runSeeds(seedFiles, []);

  if (result.error) {
    return {
      success: false,
      error: `Seeding failed: ${result.error}`,
      data: { seedsRun: result.completed },
    };
  }

  console.log('');
  console.log('Seeding complete');

  return {
    success: true,
    message: `Ran ${result.completed.length} seed files`,
    data: { seedsRun: result.completed },
  };
};
