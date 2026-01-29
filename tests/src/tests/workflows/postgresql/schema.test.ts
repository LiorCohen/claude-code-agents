/**
 * PostgreSQL Skill: Schema Creation Tests
 *
 * WHY: Validates that the postgresql skill generates correct table schemas
 * with proper constraints, indexes, and PostgreSQL best practices.
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
const PG_CONTAINER = 'sdd-postgres-schema-test';
const PG_USER = 'testuser';
const PG_PASSWORD = 'testpass';
const PG_DATABASE = 'testdb';
const PG_PORT = 5434;

const CREATE_SCHEMA_PROMPT = `Using the postgresql skill, create a database schema for a users table.

Requirements:
- Table name: users
- Columns:
  - id: auto-incrementing primary key (use IDENTITY)
  - email: unique, not null, varchar(255)
  - name: not null, varchar(100)
  - created_at: timestamptz, not null, default now()
  - updated_at: timestamptz, not null, default now()
- Add an index on email column
- Follow postgresql skill best practices for table creation

Create the SQL file at: db/migrations/001_create_users.sql

IMPORTANT:
- Use BIGINT GENERATED ALWAYS AS IDENTITY for the primary key
- Include all appropriate constraints
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
 * WHY: Schema creation is fundamental to any PostgreSQL application.
 * Generated schemas must be valid SQL, include proper constraints,
 * and follow PostgreSQL best practices (IDENTITY over SERIAL, etc.).
 */
describe('PostgreSQL Schema Creation', () => {
  let testProject: TestProject;
  let hasDocker = false;

  beforeAll(async () => {
    hasDocker = await dockerAvailable();
    if (hasDocker) {
      await startPostgresContainer();
    }
  });

  afterAll(async () => {
    if (hasDocker) {
      await stopPostgresContainer();
    }
  });

  beforeEach(async () => {
    testProject = await createTestProject('postgresql-schema');
  });

  /**
   * WHY: The users table is a common pattern. The generated SQL must be
   * executable and create a table with proper primary key (IDENTITY),
   * unique constraints on email, and appropriate indexes.
   */
  it.skipIf(!hasDocker)('creates users table with proper constraints', async () => {
    const result = await runClaude(CREATE_SCHEMA_PROMPT, testProject.path, 180);
    await writeFileAsync(joinPath(testProject.path, 'claude-output.json'), result.output);

    expect(result.exitCode).toBe(0);

    // Find the generated SQL file
    const sqlFiles = await findSqlFiles(testProject.path);
    expect(sqlFiles.length).toBeGreaterThan(0);

    // Execute the SQL
    for (const sqlFile of sqlFiles) {
      if (sqlFile.toLowerCase().includes('schema') || sqlFile.toLowerCase().includes('create')) {
        const execResult = await runPsqlFile(sqlFile);
        expect(execResult.exitCode).toBe(0);
      }
    }

    // Verify table was created
    const tableCheck = await runPsql(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users';"
    );
    expect(tableCheck.stdout).toContain('users');

    // Verify constraints exist
    const constraintCheck = await runPsql(
      "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'users';"
    );
    expect(
      constraintCheck.stdout.toLowerCase().includes('pkey') ||
        constraintCheck.stdout.toLowerCase().includes('primary')
    ).toBe(true);
  }, 240000);
});
