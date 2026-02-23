/**
 * Archive Store Command Tests
 *
 * WHY: The archive store command is the centralized way to archive files
 * and directories to .sdd/archive/<type>/ with datetime-prefix naming.
 * It must correctly copy files, lowercase names, handle directories,
 * and return structured results.
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, fileExists, dirExists, rmdir, listDir } from '@/lib';
import { join } from 'node:path';
import { runCommand } from '@/lib';

const PLUGIN_SYSTEM_DIR = join(process.cwd(), '..', 'plugin', 'core', 'system');

type ArchiveResult = {
  readonly success: boolean;
  readonly message?: string;
  readonly error?: string;
  readonly data?: {
    readonly archived_path: string;
    readonly original_path: string;
    readonly type: string;
    readonly is_directory: boolean;
    readonly file_count?: number;
  };
};

const runArchiveStore = async (
  args: readonly string[],
): Promise<{ result: ArchiveResult; stdout: string; stderr: string; code: number }> => {
  const cmdResult = await runCommand('npx', ['tsx', 'src/cli.ts', 'archive', 'store', ...args, '--json'], {
    cwd: PLUGIN_SYSTEM_DIR,
    timeout: 30000,
  });
  const result = cmdResult.exitCode === 0
    ? JSON.parse(cmdResult.stdout) as ArchiveResult
    : (() => {
        try { return JSON.parse(cmdResult.stdout) as ArchiveResult; }
        catch { return { success: false, error: cmdResult.stderr || cmdResult.stdout } as ArchiveResult; }
      })();
  return {
    result,
    stdout: cmdResult.stdout,
    stderr: cmdResult.stderr,
    code: cmdResult.exitCode,
  };
};

describe('Archive Store Command', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp('sdd-archive-store-');
    // Create .sdd directory so it looks like a project root
    await mkdir(join(testDir, '.sdd'), { recursive: true });
    // Create package.json so findProjectRoot detects it
    await writeFile(join(testDir, 'package.json'), '{"name": "test-project"}');
  });

  afterEach(async () => {
    if (testDir) {
      await rmdir(testDir, { recursive: true });
    }
  });

  describe('File archiving', () => {
    it('copies file with datetime prefix and lowercased name', async () => {
      const sourceFile = join(testDir, 'MySpec.md');
      await writeFile(sourceFile, '# Test Spec\n');

      const { result, code } = await runArchiveStore([
        '--source', sourceFile,
        '--type', 'external-spec',
        '--root', testDir,
      ]);

      expect(code).toBe(0);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.is_directory).toBe(false);
      expect(result.data!.type).toBe('external-spec');

      // Verify archived path has datetime prefix and lowercased name
      const archivedPath = result.data!.archived_path;
      expect(archivedPath).toMatch(/^\.sdd\/archive\/external-specs\/\d{8}-\d{4}-myspec\.md$/);

      // Verify file actually exists
      const fullArchivedPath = join(testDir, archivedPath);
      expect(await fileExists(fullArchivedPath)).toBe(true);

      // Verify content was copied
      const content = await readFile(fullArchivedPath);
      expect(content).toBe('# Test Spec\n');
    });

    it('preserves file extension', async () => {
      const sourceFile = join(testDir, 'data.yaml');
      await writeFile(sourceFile, 'key: value\n');

      const { result } = await runArchiveStore([
        '--source', sourceFile,
        '--type', 'external-spec',
        '--root', testDir,
      ]);

      expect(result.success).toBe(true);
      expect(result.data!.archived_path).toMatch(/\.yaml$/);
    });

    it('lowercases filename with mixed case', async () => {
      const sourceFile = join(testDir, 'Feature-SPEC.MD');
      await writeFile(sourceFile, 'content');

      const { result } = await runArchiveStore([
        '--source', sourceFile,
        '--type', 'external-spec',
        '--root', testDir,
      ]);

      expect(result.success).toBe(true);
      expect(result.data!.archived_path).toMatch(/feature-spec\.md$/);
    });

    it('creates target directory if it does not exist', async () => {
      const sourceFile = join(testDir, 'spec.md');
      await writeFile(sourceFile, 'content');

      // Verify archive dir doesn't exist yet
      expect(await dirExists(join(testDir, '.sdd', 'archive', 'external-specs'))).toBe(false);

      const { result } = await runArchiveStore([
        '--source', sourceFile,
        '--type', 'external-spec',
        '--root', testDir,
      ]);

      expect(result.success).toBe(true);
      expect(await dirExists(join(testDir, '.sdd', 'archive', 'external-specs'))).toBe(true);
    });

    it('returns archived_path in result data', async () => {
      const sourceFile = join(testDir, 'spec.md');
      await writeFile(sourceFile, 'content');

      const { result } = await runArchiveStore([
        '--source', sourceFile,
        '--type', 'external-spec',
        '--root', testDir,
      ]);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('archived_path');
      expect(result.data).toHaveProperty('original_path');
      expect(result.data).toHaveProperty('type', 'external-spec');
      expect(result.data).toHaveProperty('is_directory', false);
    });
  });

  describe('Directory archiving', () => {
    it('copies directory with all files preserving structure', async () => {
      const sourceDir = join(testDir, 'SpecBundle');
      await mkdir(join(sourceDir, 'sub'), { recursive: true });
      await writeFile(join(sourceDir, 'main.md'), '# Main');
      await writeFile(join(sourceDir, 'sub', 'detail.md'), '# Detail');

      const { result } = await runArchiveStore([
        '--source', sourceDir,
        '--type', 'external-spec',
        '--root', testDir,
      ]);

      expect(result.success).toBe(true);
      expect(result.data!.is_directory).toBe(true);
      expect(result.data!.file_count).toBe(2);

      // Verify directory name is lowercased with datetime prefix
      expect(result.data!.archived_path).toMatch(/^\.sdd\/archive\/external-specs\/\d{8}-\d{4}-specbundle\/$/);

      // Verify files exist with structure preserved
      const archivedDir = join(testDir, result.data!.archived_path);
      expect(await fileExists(join(archivedDir, 'main.md'))).toBe(true);
      expect(await fileExists(join(archivedDir, 'sub', 'detail.md'))).toBe(true);
    });
  });

  describe('Type mapping', () => {
    it('maps external-spec to external-specs directory', async () => {
      const sourceFile = join(testDir, 'spec.md');
      await writeFile(sourceFile, 'content');

      const { result } = await runArchiveStore([
        '--source', sourceFile,
        '--type', 'external-spec',
        '--root', testDir,
      ]);

      expect(result.success).toBe(true);
      expect(result.data!.archived_path).toContain('external-specs/');
    });

    it('maps revised-spec to revised-specs directory', async () => {
      const sourceFile = join(testDir, 'spec.md');
      await writeFile(sourceFile, 'content');

      const { result } = await runArchiveStore([
        '--source', sourceFile,
        '--type', 'revised-spec',
        '--root', testDir,
      ]);

      expect(result.success).toBe(true);
      expect(result.data!.archived_path).toContain('revised-specs/');
    });

    it('maps workflow-regression to workflow-regressions directory', async () => {
      const sourceFile = join(testDir, 'spec.md');
      await writeFile(sourceFile, 'content');

      const { result } = await runArchiveStore([
        '--source', sourceFile,
        '--type', 'workflow-regression',
        '--root', testDir,
      ]);

      expect(result.success).toBe(true);
      expect(result.data!.archived_path).toContain('workflow-regressions/');
    });
  });

  describe('Error handling', () => {
    it('fails on missing source path', async () => {
      const { result, code } = await runArchiveStore([
        '--source', join(testDir, 'nonexistent.md'),
        '--type', 'external-spec',
        '--root', testDir,
      ]);

      expect(code).toBe(1);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Source path not found');
    });

    it('fails on invalid archive type', async () => {
      const sourceFile = join(testDir, 'spec.md');
      await writeFile(sourceFile, 'content');

      const { result, code } = await runArchiveStore([
        '--source', sourceFile,
        '--type', 'invalid-type',
        '--root', testDir,
      ]);

      expect(code).toBe(1);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
