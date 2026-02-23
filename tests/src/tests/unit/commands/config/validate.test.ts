/**
 * Config Validate Command Tests
 *
 * WHY: The validate command catches config errors before runtime.
 * It must correctly validate configs against JSON Schema and report errors clearly.
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rmdir } from '@/lib';
import { join } from 'node:path';
import { runCommand } from '@/lib';

// Plugin system directory (where tsconfig.json lives for path alias resolution)
const PLUGIN_SYSTEM_DIR = join(process.cwd(), '..', 'plugin', 'fullstack-typescript', 'system');

const runValidate = async (
  args: string[],
  _cwd: string
): Promise<{ success: boolean; stdout: string; stderr: string; code: number }> => {
  // Run tsx from plugin/system so path aliases resolve correctly
  const result = await runCommand('npx', ['tsx', 'src/cli.ts', 'config', 'validate', ...args], {
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

describe('Config Validate Command', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp('config-validate-');
    await mkdir(join(testDir, 'components', 'config', 'envs', 'default'), { recursive: true });
    await mkdir(join(testDir, 'components', 'config', 'envs', 'local'), { recursive: true });
    await mkdir(join(testDir, 'components', 'config', 'envs', 'staging'), { recursive: true });
    await mkdir(join(testDir, 'components', 'config', 'schemas'), { recursive: true });
  });

  afterEach(async () => {
    if (testDir) {
      await rmdir(testDir, { recursive: true });
    }
  });

  describe('Valid configurations', () => {
    it('passes when config matches schema', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `server:
  port: 3000
  host: localhost
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'local', 'config.yaml'),
        `server:
  port: 8080
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'staging', 'config.yaml'),
        `server:
  port: 9000
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'schemas', 'config.schema.json'),
        JSON.stringify({
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          properties: {
            server: {
              type: 'object',
              properties: {
                port: { type: 'number' },
                host: { type: 'string' },
              },
            },
          },
        })
      );

      const result = await runValidate(['--config-dir', testDir], testDir);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Valid');
    });

    it('validates specific environment with --env', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `port: 3000`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'local', 'config.yaml'),
        `port: 8080`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'staging', 'config.yaml'),
        `port: "invalid"`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'schemas', 'config.schema.json'),
        JSON.stringify({
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          properties: {
            port: { type: 'number' },
          },
        })
      );

      // Validating just local should pass (staging is invalid but not checked)
      const result = await runValidate(['--env', 'local', '--config-dir', testDir], testDir);

      expect(result.success).toBe(true);
    });
  });

  describe('Invalid configurations', () => {
    it('fails when config violates schema', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `server:
  port: "not-a-number"
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'schemas', 'config.schema.json'),
        JSON.stringify({
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          properties: {
            server: {
              type: 'object',
              properties: {
                port: { type: 'number' },
              },
            },
          },
        })
      );

      const result = await runValidate(['--env', 'default', '--config-dir', testDir], testDir);

      expect(result.success).toBe(false);
      expect(result.stdout + result.stderr).toContain('Invalid');
    });

    it('reports multiple validation errors', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `server:
  port: "not-a-number"
  host: 12345
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'schemas', 'config.schema.json'),
        JSON.stringify({
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          properties: {
            server: {
              type: 'object',
              properties: {
                port: { type: 'number' },
                host: { type: 'string' },
              },
            },
          },
        })
      );

      const result = await runValidate(['--env', 'default', '--config-dir', testDir], testDir);

      expect(result.success).toBe(false);
      // Should report errors for both port and host
      const output = result.stdout + result.stderr;
      expect(output).toContain('port');
      expect(output).toContain('host');
    });

    it('fails on missing required properties', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `server:
  host: localhost
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'schemas', 'config.schema.json'),
        JSON.stringify({
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          properties: {
            server: {
              type: 'object',
              properties: {
                port: { type: 'number' },
                host: { type: 'string' },
              },
              required: ['port'],
            },
          },
        })
      );

      const result = await runValidate(['--env', 'default', '--config-dir', testDir], testDir);

      expect(result.success).toBe(false);
      expect(result.stdout + result.stderr).toContain('port');
    });
  });

  describe('Validating all environments', () => {
    it('validates all environments when no --env specified', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `port: 3000`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'local', 'config.yaml'),
        `port: 8080`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'staging', 'config.yaml'),
        `port: 9000`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'schemas', 'config.schema.json'),
        JSON.stringify({
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          properties: {
            port: { type: 'number' },
          },
        })
      );

      const result = await runValidate(['--config-dir', testDir], testDir);

      expect(result.success).toBe(true);
      const output = result.stdout;
      expect(output).toContain('default');
      expect(output).toContain('local');
      expect(output).toContain('staging');
    });

    it('fails if any environment is invalid', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `port: 3000`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'local', 'config.yaml'),
        `port: 8080`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'staging', 'config.yaml'),
        `port: "invalid"`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'schemas', 'config.schema.json'),
        JSON.stringify({
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          properties: {
            port: { type: 'number' },
          },
        })
      );

      const result = await runValidate(['--config-dir', testDir], testDir);

      expect(result.success).toBe(false);
      expect(result.stdout).toContain('staging');
      expect(result.stdout).toContain('Invalid');
    });
  });

  describe('Error handling', () => {
    it('fails when schema file is missing', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `port: 3000`
      );

      const result = await runValidate(['--env', 'default', '--config-dir', testDir], testDir);

      expect(result.success).toBe(false);
      expect(result.stdout + result.stderr).toContain('schema');
    });

    it('fails when config file is missing', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'schemas', 'config.schema.json'),
        JSON.stringify({
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
        })
      );

      const result = await runValidate(['--env', 'default', '--config-dir', testDir], testDir);

      expect(result.success).toBe(false);
      expect(result.stdout + result.stderr).toContain('not found');
    });

    it('fails on invalid YAML syntax', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `invalid: yaml: [broken`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'schemas', 'config.schema.json'),
        JSON.stringify({
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
        })
      );

      const result = await runValidate(['--env', 'default', '--config-dir', testDir], testDir);

      expect(result.success).toBe(false);
    });

    it('fails on invalid JSON schema', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `port: 3000`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'schemas', 'config.schema.json'),
        `{invalid json`
      );

      const result = await runValidate(['--env', 'default', '--config-dir', testDir], testDir);

      expect(result.success).toBe(false);
    });
  });
});
