/**
 * Config Generate Command Tests
 *
 * WHY: The generate command is the primary way users get merged config files.
 * It must correctly merge configs, validate against schemas, and handle errors.
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, fileExists, rmdir, joinPath } from '@/lib';
import { join } from 'node:path';
import { parse } from 'yaml';

// Import the generate function for direct testing
// Since we can't import directly due to path aliases, we'll test via CLI
import { runCommand } from '@/lib';

// Plugin system directory (where tsconfig.json lives for path alias resolution)
const PLUGIN_SYSTEM_DIR = join(process.cwd(), '..', 'plugin', 'system');

const runGenerate = async (
  args: string[],
  _cwd: string
): Promise<{ success: boolean; stdout: string; stderr: string; code: number }> => {
  // Run tsx from plugin/system so path aliases resolve correctly
  const result = await runCommand('npx', ['tsx', 'src/cli.ts', 'config', 'generate', ...args], {
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

describe('Config Generate Command', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp('config-generate-');
    // Create config component structure
    await mkdir(join(testDir, 'components', 'config', 'envs', 'default'), { recursive: true });
    await mkdir(join(testDir, 'components', 'config', 'envs', 'local'), { recursive: true });
    await mkdir(join(testDir, 'components', 'config', 'schemas'), { recursive: true });
  });

  afterEach(async () => {
    if (testDir) {
      await rmdir(testDir, { recursive: true });
    }
  });

  describe('Basic merging', () => {
    it('merges default and env configs', async () => {
      // Setup
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `server:
  port: 3000
  host: 0.0.0.0
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'local', 'config.yaml'),
        `server:
  host: localhost
`
      );

      // Execute
      const result = await runGenerate(['--env', 'local', '--config-dir', testDir], testDir);

      // Verify
      expect(result.success).toBe(true);
      const output = parse(result.stdout) as { server: { port: number; host: string } };
      expect(output.server.port).toBe(3000);
      expect(output.server.host).toBe('localhost');
    });

    it('preserves nested values during merge', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `database:
  host: db.internal
  port: 5432
  pool: 10
  timeout: 30000
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'local', 'config.yaml'),
        `database:
  host: localhost
`
      );

      const result = await runGenerate(['--env', 'local', '--config-dir', testDir], testDir);

      expect(result.success).toBe(true);
      const output = parse(result.stdout) as {
        database: { host: string; port: number; pool: number; timeout: number };
      };
      expect(output.database.host).toBe('localhost');
      expect(output.database.port).toBe(5432);
      expect(output.database.pool).toBe(10);
      expect(output.database.timeout).toBe(30000);
    });

    it('replaces arrays entirely', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `features:
  - feature1
  - feature2
  - feature3
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'local', 'config.yaml'),
        `features:
  - localFeature
`
      );

      const result = await runGenerate(['--env', 'local', '--config-dir', testDir], testDir);

      expect(result.success).toBe(true);
      const output = parse(result.stdout) as { features: string[] };
      expect(output.features).toEqual(['localFeature']);
    });

    it('removes keys with null values', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `server:
  port: 3000
  debug: true
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'local', 'config.yaml'),
        `server:
  debug: null
`
      );

      const result = await runGenerate(['--env', 'local', '--config-dir', testDir], testDir);

      expect(result.success).toBe(true);
      const output = parse(result.stdout) as { server: { port: number; debug?: boolean } };
      expect(output.server.port).toBe(3000);
      expect(output.server).not.toHaveProperty('debug');
    });
  });

  describe('Component extraction', () => {
    it('extracts specific component section', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `server-api:
  port: 3000
server-worker:
  concurrency: 5
webapp:
  apiUrl: /api
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'local', 'config.yaml'),
        ``
      );

      const result = await runGenerate(
        ['--env', 'local', '--component', 'server-api', '--config-dir', testDir],
        testDir
      );

      expect(result.success).toBe(true);
      const output = parse(result.stdout) as { port: number };
      // Should output section contents only, no wrapper key
      expect(output.port).toBe(3000);
      expect(output).not.toHaveProperty('server-api');
    });

    it('fails when component does not exist', async () => {
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

      const result = await runGenerate(
        ['--env', 'local', '--component', 'nonexistent', '--config-dir', testDir],
        testDir
      );

      expect(result.success).toBe(false);
      expect(result.stderr + result.stdout).toContain('not found');
    });
  });

  describe('Error handling', () => {
    it('fails when --env is missing', async () => {
      const result = await runGenerate(['--config-dir', testDir], testDir);

      expect(result.success).toBe(false);
      expect(result.stderr + result.stdout).toContain('--env');
    });

    it('fails when environment directory does not exist', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `server:
  port: 3000
`
      );

      const result = await runGenerate(['--env', 'staging', '--config-dir', testDir], testDir);

      expect(result.success).toBe(false);
      expect(result.stderr + result.stdout).toContain('not found');
    });

    it('fails when default config does not exist', async () => {
      // Remove the default config
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'local', 'config.yaml'),
        `server:
  port: 8080
`
      );

      const result = await runGenerate(['--env', 'local', '--config-dir', testDir], testDir);

      expect(result.success).toBe(false);
      expect(result.stderr + result.stdout).toContain('not found');
    });

    it('fails on invalid YAML', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `server:
  port: 3000
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'local', 'config.yaml'),
        `invalid: yaml: content: [broken`
      );

      const result = await runGenerate(['--env', 'local', '--config-dir', testDir], testDir);

      expect(result.success).toBe(false);
    });
  });

  describe('Schema validation', () => {
    it('validates against schema when present', async () => {
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
              required: ['port'],
            },
          },
        })
      );

      const result = await runGenerate(['--env', 'local', '--config-dir', testDir], testDir);

      expect(result.success).toBe(true);
    });

    it('fails when config violates schema', async () => {
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'default', 'config.yaml'),
        `server:
  port: "not-a-number"
`
      );
      await writeFile(
        join(testDir, 'components', 'config', 'envs', 'local', 'config.yaml'),
        ``
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

      const result = await runGenerate(['--env', 'local', '--config-dir', testDir], testDir);

      expect(result.success).toBe(false);
      expect(result.stderr + result.stdout).toContain('validation');
    });
  });

  describe('Output to file', () => {
    it('writes output to file with --output', async () => {
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

      const outputPath = join(testDir, 'output-config.yaml');
      const result = await runGenerate(
        ['--env', 'local', '--output', outputPath, '--config-dir', testDir],
        testDir
      );

      expect(result.success).toBe(true);
      expect(fileExists(outputPath)).toBe(true);
      const content = parse(readFile(outputPath)) as { server: { port: number } };
      expect(content.server.port).toBe(3000);
    });
  });
});
