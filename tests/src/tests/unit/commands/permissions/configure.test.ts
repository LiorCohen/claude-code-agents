/**
 * Unit Tests: Permissions Configure Command
 *
 * WHY: The permissions configure command must work in directories without
 * an existing SDD project (e.g., during init before structure is created).
 * It should fall back to cwd when no project root markers are found.
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rmdir, fileExists, PLUGIN_DIR } from '@/lib';
import { runCommand } from '@/lib';
import { join } from 'node:path';

const CLI_PATH = join(PLUGIN_DIR, 'system', 'dist', 'cli.js');

type ConfigureResult = {
  readonly success: boolean;
  readonly message?: string;
  readonly error?: string;
  readonly data?: {
    readonly settingsPath: string;
    readonly backupPath: string | null;
    readonly permissionsAdded: number;
  };
};

const runPermissionsConfigure = async (
  cwd: string,
): Promise<{ readonly result: ConfigureResult; readonly code: number }> => {
  const cmdResult = await runCommand('node', ['--enable-source-maps', CLI_PATH, 'permissions', 'configure', '--json'], {
    cwd,
    timeout: 30000,
  });
  const result = (() => {
    try {
      return JSON.parse(cmdResult.stdout) as ConfigureResult;
    } catch {
      return { success: false, error: cmdResult.stderr || cmdResult.stdout } as ConfigureResult;
    }
  })();
  return { result, code: cmdResult.exitCode };
};

describe('Permissions Configure Command', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp('sdd-permissions-configure-');
  });

  afterEach(async () => {
    await rmdir(testDir, { recursive: true });
  });

  it('falls back to cwd when no project root markers exist', async () => {
    // testDir is under /tmp/ — no package.json or .sdd/ in its parent chain
    // The command should succeed by falling back to cwd
    const { result, code } = await runPermissionsConfigure(testDir);

    expect(code).toBe(0);
    expect(result.success).toBe(true);
    expect(result.message).toContain('Permissions configured');

    // Verify .claude/settings.local.json was created in testDir
    const settingsPath = join(testDir, '.claude', 'settings.local.json');
    expect(await fileExists(settingsPath)).toBe(true);
  });

  it('still uses project root when found', async () => {
    // Create project root markers so findProjectRoot finds them
    await writeFile(join(testDir, 'package.json'), '{"name": "test-project"}');

    const { result, code } = await runPermissionsConfigure(testDir);

    expect(code).toBe(0);
    expect(result.success).toBe(true);

    // Settings should be in the project root's .claude/ directory
    const settingsPath = join(testDir, '.claude', 'settings.local.json');
    expect(await fileExists(settingsPath)).toBe(true);
  });

  it('creates .claude directory when missing', async () => {
    // No .claude directory exists yet
    const claudeDir = join(testDir, '.claude');
    expect(await fileExists(claudeDir)).toBe(false);

    const { result, code } = await runPermissionsConfigure(testDir);

    expect(code).toBe(0);
    expect(result.success).toBe(true);
    expect(await fileExists(claudeDir)).toBe(true);
  });
});
