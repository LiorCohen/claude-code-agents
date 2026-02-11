/**
 * Database migrate command.
 *
 * Run all database migrations in order.
 *
 * Usage:
 *   sdd-system database migrate <component-name>
 */

import { execSync } from 'node:child_process';
import * as path from 'node:path';
import type { CommandResult } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { exists, walkDir } from '@/lib/fs';
import { findProjectRoot } from '@/lib/config';

export const migrate = async (
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
  const migrationsDir = path.join(componentDir, 'migrations');

  if (!(await exists(migrationsDir))) {
    return {
      success: false,
      error: `Migrations directory not found: ${migrationsDir}`,
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

  // Find all migration files
  const migrationFiles = [...(await walkDir(migrationsDir, (entry) => entry.name.endsWith('.sql')))]
    .sort();

  if (migrationFiles.length === 0) {
    console.log('No migration files found');
    return {
      success: true,
      message: 'No migration files found',
      data: { migrationsRun: 0 },
    };
  }

  console.log('Running migrations...');

  const runMigrations = (
    files: ReadonlyArray<string>,
    completed: ReadonlyArray<string>
  ): { readonly completed: ReadonlyArray<string>; readonly error?: string } => {
    const migrationFile = files[0];
    if (migrationFile === undefined) return { completed };
    const rest = files.slice(1);
    const fileName = path.basename(migrationFile);
    console.log(`  ${fileName}`);
    try {
      execSync(`psql -f "${migrationFile}"`, { stdio: 'inherit', env });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { completed, error: errorMessage };
    }
    return runMigrations(rest, [...completed, fileName]);
  };

  const result = runMigrations(migrationFiles, []);

  if (result.error) {
    return {
      success: false,
      error: `Migration failed: ${result.error}`,
      data: { migrationsRun: result.completed },
    };
  }

  console.log('');
  console.log('Migrations complete');

  return {
    success: true,
    message: `Ran ${result.completed.length} migrations`,
    data: { migrationsRun: result.completed },
  };
};
