/**
 * Config Diff Command Tests
 *
 * WHY: The diff command helps developers understand what differs between
 * environments. It must correctly identify additions, removals, and changes.
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rmdir } from '@/lib';
import { join } from 'node:path';
import { runCommand } from '@/lib';

// Plugin system directory (where tsconfig.json lives for path alias resolution)
const PLUGIN_SYSTEM_DIR = join(process.cwd(), '..', 'plugin', 'fullstack-typescript', 'system');

const runDiff = async (
  args: string[],
  _cwd: string
): Promise<{ success: boolean; stdout: string; stderr: string; code: number }> => {
  // Run tsx from plugin/system so path aliases resolve correctly
  const result = await runCommand('npx', ['tsx', 'src/cli.ts', 'config', 'diff', ...args], {
    cwd: PLUGIN_SYSTEM_DIR,
    timeout: 30000,
  });
  return {
    success: result.exitCode === 0,
    stdout: result.stdout,
    stderr: result.stderr,
    code: result.exitCode,
  };
};

describe('Config Diff Command', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp('config-diff-');
    await mkdir(join(testDir, 'components', 'config', 'envs', 'default'), { recursive: true });
    await mkdir(join(testDir, 'components', 'config', 'envs', 'local'), { recursive: true });
    await mkdir(join(testDir, 'components', 'config', 'envs', 'production'), { recursive: true });
    await mkdir(join(testDir, 'components', 'config', 'schemas'), { recursive: true });
  });

  afterEach(async () => {
    if (testDir) {
      await rmdir(testDir, { recursive: true });
    }
  });

  describe('Detecting differences', () => {
    it('shows changed values', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `server:
  port: 3000
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'local', 'config.yaml'),
        `server:
  port: 8080
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'production', 'config.yaml'),
        `server:
  port: 80
`
      );

      const result = await runDiff(['local', 'production', '--config-dir', testDir], testDir);

      expect(result.success).toBe(true);
      const output = result.stdout;
      expect(output).toContain('port');
      expect(output).toContain('Changed');
    });

    it('shows added keys', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `server:
  port: 3000
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'local', 'config.yaml'),
        ``
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'production', 'config.yaml'),
        `server:
  host: prod.example.com
`
      );

      const result = await runDiff(['local', 'production', '--config-dir', testDir], testDir);

      expect(result.success).toBe(true);
      const output = result.stdout;
      expect(output).toContain('host');
      expect(output).toContain('Added');
    });

    it('shows removed keys', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `server:
  port: 3000
  debug: true
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'local', 'config.yaml'),
        ``
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'production', 'config.yaml'),
        `server:
  debug: null
`
      );

      const result = await runDiff(['local', 'production', '--config-dir', testDir], testDir);

      expect(result.success).toBe(true);
      const output = result.stdout;
      expect(output).toContain('debug');
      expect(output).toContain('Removed');
    });

    it('shows no differences when configs are identical', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `server:
  port: 3000
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'local', 'config.yaml'),
        ``
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'production', 'config.yaml'),
        ``
      );

      const result = await runDiff(['local', 'production', '--config-dir', testDir], testDir);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('No differences');
    });
  });

  describe('Nested differences', () => {
    it('shows nested path for deep changes', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `database:
  connection:
    host: localhost
    port: 5432
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'local', 'config.yaml'),
        ``
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'production', 'config.yaml'),
        `database:
  connection:
    host: db.production.internal
`
      );

      const result = await runDiff(['local', 'production', '--config-dir', testDir], testDir);

      expect(result.success).toBe(true);
      const output = result.stdout;
      expect(output).toContain('database.connection.host');
    });

    it('handles multiple nested differences', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `server:
  port: 3000
database:
  host: localhost
  pool: 10
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'local', 'config.yaml'),
        ``
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'production', 'config.yaml'),
        `server:
  port: 80
database:
  host: db.prod
  pool: 50
`
      );

      const result = await runDiff(['local', 'production', '--config-dir', testDir], testDir);

      expect(result.success).toBe(true);
      const output = result.stdout;
      expect(output).toContain('server.port');
      expect(output).toContain('database.host');
      expect(output).toContain('database.pool');
    });
  });

  describe('Error handling', () => {
    it('fails when first environment does not exist', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `port: 3000`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'production', 'config.yaml'),
        `port: 80`
      );

      const result = await runDiff(['nonexistent', 'production', '--config-dir', testDir], testDir);

      expect(result.success).toBe(false);
      expect(result.stdout + result.stderr).toContain('not found');
    });

    it('fails when second environment does not exist', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `port: 3000`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'local', 'config.yaml'),
        `port: 8080`
      );

      const result = await runDiff(['local', 'nonexistent', '--config-dir', testDir], testDir);

      expect(result.success).toBe(false);
      expect(result.stdout + result.stderr).toContain('not found');
    });

    it('fails when missing required arguments', async () => {
      const result = await runDiff(['--config-dir', testDir], testDir);

      expect(result.success).toBe(false);
      expect(result.stdout + result.stderr).toContain('Usage');
    });

    it('fails with only one environment argument', async () => {
      const result = await runDiff(['local', '--config-dir', testDir], testDir);

      expect(result.success).toBe(false);
    });
  });

  describe('JSON output mode', () => {
    it('outputs JSON with --json flag', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `server:
  port: 3000
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'local', 'config.yaml'),
        `server:
  port: 8080
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'production', 'config.yaml'),
        `server:
  port: 80
`
      );

      const result = await runDiff(['local', 'production', '--json', '--config-dir', testDir], testDir);

      expect(result.success).toBe(true);
      const output = JSON.parse(result.stdout) as {
        success: boolean;
        data: {
          env1: string;
          env2: string;
          differences: Array<{ path: string; type: string }>;
        };
      };
      expect(output.success).toBe(true);
      expect(output.data.env1).toBe('local');
      expect(output.data.env2).toBe('production');
      expect(output.data.differences.length).toBeGreaterThan(0);
    });
  });

  describe('Real-world scenarios', () => {
    it('compares local vs production with typical differences', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `server-api:
  port: 3000
  logLevel: info
  database:
    host: db.internal
    port: 5432
    pool: 10
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'local', 'config.yaml'),
        `server-api:
  logLevel: debug
  database:
    host: localhost
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'production', 'config.yaml'),
        `server-api:
  port: 80
  database:
    host: db.production.internal
    pool: 50
`
      );

      const result = await runDiff(['local', 'production', '--config-dir', testDir], testDir);

      expect(result.success).toBe(true);
      const output = result.stdout;
      // Should show differences
      expect(output).toContain('port');
      expect(output).toContain('logLevel');
      expect(output).toContain('host');
      expect(output).toContain('pool');
    });
  });
});
