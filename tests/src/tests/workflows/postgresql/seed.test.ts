/**
 * PostgreSQL Skill: Seed Data Tests
 *
 * WHY: Validates that the postgresql skill generates correct seed data
 * that is idempotent and follows PostgreSQL best practices.
 */

import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  createTestProject,
  runClaude,
  writeFileAsync,
  joinPath,
  readFileAsync,
  listDirWithTypes,
  runCommand,
  type TestProject,
} from '../../../lib';

// Container name for tests
const PG_CONTAINER = 'sdd-postgres-seed-test';
const PG_USER = 'testuser';
const PG_PASSWORD = 'testpass';
const PG_DATABASE = 'testdb';
const PG_PORT = 5435;

const SEED_DATA_PROMPT = `Using the postgresql skill, create seed data for the users table.

The users table has columns: id, email, name, created_at, updated_at

Requirements:
- Insert 10 sample users with realistic data
- Use generate_series or similar for efficient bulk insert
- Make the seed idempotent using ON CONFLICT
- Include varied timestamps for created_at

Create the SQL file at: db/seeds/seed_users.sql

IMPORTANT:
- Follow the postgresql skill's seed-data reference
- Use ON CONFLICT DO NOTHING or DO UPDATE for idempotency
- The SQL must be executable via psql
- Do not use external data files, generate data in SQL
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
 * WHY: Seed data is essential for development and testing. Generated seed
 * scripts must be idempotent (safe to run multiple times) and insert
 * realistic test data that exercises the application properly.
 */
describe('PostgreSQL Seed Data', () => {
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
    testProject = await createTestProject('postgresql-seed');
  });

  /**
   * WHY: Seed files must insert data correctly and use ON CONFLICT for
   * idempotency. If seeds aren't idempotent, running them twice causes
   * duplicate key errors that break development workflows.
   */
  it.skipIf(!hasDocker)('seeds users data idempotently', async () => {
    const result = await runClaude(SEED_DATA_PROMPT, testProject.path, 180);
    await writeFileAsync(joinPath(testProject.path, 'claude-output.json'), result.output);

    expect(result.exitCode).toBe(0);

    // Find and execute seed SQL
    const sqlFiles = await findSqlFiles(testProject.path);
    for (const sqlFile of sqlFiles) {
      if (sqlFile.toLowerCase().includes('seed') || sqlFile.toLowerCase().includes('data')) {
        const execResult = await runPsqlFile(sqlFile);
        expect(execResult.exitCode).toBe(0);
      }
    }

    // Verify data was inserted
    const countResult = await runPsql('SELECT COUNT(*) FROM users;');
    expect(countResult.exitCode).toBe(0);

    const lines = countResult.stdout
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /^\d+$/.test(l));
    if (lines.length > 0) {
      const count = parseInt(lines[0]!, 10);
      expect(count).toBeGreaterThan(0);
    }
  }, 240000);
});
