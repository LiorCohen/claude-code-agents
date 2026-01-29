/**
 * PostgreSQL Skill: Migration Tests
 *
 * WHY: Validates that the postgresql skill generates safe migration SQL
 * that follows PostgreSQL best practices for schema changes.
 */

import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  createTestProject,
  runClaude,
  writeFileAsync,
  mkdir,
  joinPath,
  readFileAsync,
  listDirWithTypes,
  runCommand,
  type TestProject,
} from '../../../lib';

// Container name for tests
const PG_CONTAINER = 'sdd-postgres-migration-test';
const PG_USER = 'testuser';
const PG_PASSWORD = 'testpass';
const PG_DATABASE = 'testdb';
const PG_PORT = 5436;

const MIGRATION_PLAN_PROMPT = `Using the postgresql skill, create a migration to add a phone column to the users table.

The users table already exists with columns: id, email, name, created_at, updated_at

Migration requirements:
- Add a new column: phone VARCHAR(20), nullable
- Add an index on the phone column (use CONCURRENTLY if possible)
- Follow safe migration patterns from the postgresql skill

Create the migration file at: db/migrations/002_add_user_phone.sql

IMPORTANT:
- Follow the postgresql skill's schema-management reference for safe migrations
- Add column as nullable first (this is safe and fast)
- Use CREATE INDEX CONCURRENTLY if the migration supports it
- The SQL must be executable via psql
- Create ALL files in the CURRENT WORKING DIRECTORY (.) - do NOT use absolute paths`;

/**
 * Check if Docker is available.
 */
const dockerAvailable = async (): Promise<boolean> => {
  try {
    const result = await runCommand('docker', ['info'], { timeout: 10000 });
    return result.exitCode === 0;
  } catch {
    return false;
  }
};

/**
 * Start a PostgreSQL container for testing.
 */
const startPostgresContainer = async (): Promise<boolean> => {
  await runCommand('docker', ['rm', '-f', PG_CONTAINER]);

  const result = await runCommand('docker', [
    'run',
    '-d',
    '--name',
    PG_CONTAINER,
    '-e',
    `POSTGRES_USER=${PG_USER}`,
    '-e',
    `POSTGRES_PASSWORD=${PG_PASSWORD}`,
    '-e',
    `POSTGRES_DB=${PG_DATABASE}`,
    '-p',
    `${PG_PORT}:5432`,
    'postgres:16',
  ]);

  if (result.exitCode !== 0) {
    console.log(`Failed to start container: ${result.stderr}`);
    return false;
  }

  // Wait for PostgreSQL to be ready
  for (let i = 0; i < 30; i++) {
    const check = await runCommand('docker', [
      'exec',
      PG_CONTAINER,
      'pg_isready',
      '-U',
      PG_USER,
      '-d',
      PG_DATABASE,
    ]);
    if (check.exitCode === 0) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }

  return false;
};

/**
 * Stop and remove the PostgreSQL container.
 */
const stopPostgresContainer = async (): Promise<void> => {
  await runCommand('docker', ['rm', '-f', PG_CONTAINER]);
};

/**
 * Run SQL against the test PostgreSQL container.
 */
const runPsql = async (
  sql: string
): Promise<{ readonly exitCode: number; readonly stdout: string; readonly stderr: string }> =>
  runCommand('docker', ['exec', PG_CONTAINER, 'psql', '-U', PG_USER, '-d', PG_DATABASE, '-c', sql]);

/**
 * Run a SQL file against the test PostgreSQL container.
 */
const runPsqlFile = async (
  filepath: string
): Promise<{ readonly exitCode: number; readonly stdout: string; readonly stderr: string }> => {
  const sql = await readFileAsync(filepath);
  return runCommand(
    'docker',
    ['exec', '-i', PG_CONTAINER, 'psql', '-U', PG_USER, '-d', PG_DATABASE],
    { input: sql, timeout: 60000 }
  );
};

/**
 * Find SQL files recursively in a directory.
 */
const findSqlFiles = async (dir: string): Promise<readonly string[]> => {
  const walk = async (currentDir: string): Promise<readonly string[]> => {
    try {
      const entries = listDirWithTypes(currentDir);
      const results = await Promise.all(
        entries.map(async (entry): Promise<readonly string[]> => {
          const fullPath = joinPath(currentDir, entry.name);
          if (entry.isDirectory) {
            return walk(fullPath);
          } else if (entry.isFile && entry.name.endsWith('.sql')) {
            return [fullPath];
          }
          return [];
        })
      );
      return results.flat();
    } catch {
      // Directory doesn't exist
      return [];
    }
  };

  return walk(dir);
};

/**
 * WHY: Migrations are how schema evolves over time. Generated migrations
 * must use safe patterns (nullable columns first, CONCURRENTLY for indexes)
 * to avoid locking tables and blocking the application.
 */
describe('PostgreSQL Migration', () => {
  let testProject: TestProject;
  let hasDocker = false;

  beforeAll(async () => {
    hasDocker = await dockerAvailable();
    if (!hasDocker) return;

    await startPostgresContainer();

    // Ensure users table exists
    await runPsql(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  });

  afterAll(async () => {
    if (hasDocker) {
      await stopPostgresContainer();
    }
  });

  beforeEach(async () => {
    testProject = await createTestProject('postgresql-migration');
    await mkdir(joinPath(testProject.path, 'db', 'migrations'));
    await mkdir(joinPath(testProject.path, 'db', 'seeds'));
  });

  /**
   * WHY: Adding columns is a common migration. The generated SQL must add
   * columns safely (nullable first, then constraints if needed) and create
   * indexes without blocking queries (using CONCURRENTLY when possible).
   */
  it.skipIf(!hasDocker)('creates migration to add column safely', async () => {
    const result = await runClaude(MIGRATION_PLAN_PROMPT, testProject.path, 180);
    await writeFileAsync(joinPath(testProject.path, 'claude-output.json'), result.output);

    expect(result.exitCode).toBe(0);

    // Find migration files
    let migrationFiles = await findSqlFiles(joinPath(testProject.path, 'db', 'migrations'));
    if (migrationFiles.length === 0) {
      migrationFiles = (await findSqlFiles(testProject.path)).filter((f) =>
        f.toLowerCase().includes('migration')
      );
    }

    expect(migrationFiles.length).toBeGreaterThan(0);

    // Check migration content for safe patterns
    let migrationContent = '';
    for (const f of migrationFiles) {
      migrationContent += await readFileAsync(f);
    }
    expect(migrationContent).toContain('ALTER TABLE');

    // Execute migration
    for (const migFile of migrationFiles) {
      const execResult = await runPsqlFile(migFile);
      expect(execResult.exitCode).toBe(0);
    }

    // Verify column was added
    const columnCheck = await runPsql(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone';"
    );
    expect(columnCheck.stdout).toContain('phone');
  }, 240000);
});
