/**
 * Project Scaffolding Integration Tests
 *
 * WHY: End-to-end scaffolding tests verify that the core scaffolding command
 * produces the generic project skeleton. Component-specific scaffolding is
 * handled by tech pack systems, not the core project command.
 */

import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import {
  TECH_SKILLS_DIR,
  joinPath,
  fileExists,
  isDirectory,
  readFile,
  mkdtemp,
  rmdir,
  mkdir,
  writeFileAsync,
  runScaffolding,
} from '@/lib';

describe('Scaffolding Integration', () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await mkdtemp('sdd-test-');
  });

  afterAll(async () => {
    if (tmpDir) {
      await rmdir(tmpDir);
    }
  });

  /**
   * WHY: The core scaffolding project command creates the generic project
   * skeleton — root files, spec directories, architecture overview.
   * Component-specific scaffolding is handled separately by the tech pack.
   */
  it('creates generic project skeleton', async () => {
    const targetDir = joinPath(tmpDir, 'test-project');
    await mkdir(targetDir);

    const config = {
      project_name: 'test-project',
      project_description: 'Test project',
      primary_domain: 'Testing',
      target_dir: targetDir,
      components: [{ type: 'database', name: 'database' }],
      skills_dir: TECH_SKILLS_DIR,
    };

    const configFile = joinPath(tmpDir, 'config.json');
    await writeFileAsync(configFile, JSON.stringify(config));

    const result = await runScaffolding(configFile, tmpDir);

    expect(result.exitCode).toBe(0);

    // Verify generic project skeleton
    expect(fileExists(joinPath(targetDir, '.gitignore'))).toBe(true);
    expect(fileExists(joinPath(targetDir, '.claudeignore'))).toBe(true);

    // Verify spec directories
    expect(isDirectory(joinPath(targetDir, 'specs', 'domain', 'definitions'))).toBe(true);
    expect(isDirectory(joinPath(targetDir, 'specs', 'domain', 'use-cases'))).toBe(true);
    expect(isDirectory(joinPath(targetDir, 'specs', 'architecture'))).toBe(true);

    // Verify architecture overview was generated
    expect(fileExists(joinPath(targetDir, 'specs', 'architecture', 'overview.md'))).toBe(true);
  });

  /**
   * WHY: Variable substitution is critical for generating unique projects.
   * If {{PROJECT_NAME}} isn't replaced, template files will have the literal
   * string, causing confusion.
   */
  it('substitutes {{PROJECT_NAME}} in templates', async () => {
    const targetDir = joinPath(tmpDir, 'my-app');
    await mkdir(targetDir);

    const config = {
      project_name: 'my-app',
      project_description: 'My application',
      primary_domain: 'Testing',
      target_dir: targetDir,
      components: [{ type: 'database', name: 'database' }],
      skills_dir: TECH_SKILLS_DIR,
    };

    const configFile = joinPath(tmpDir, 'config2.json');
    await writeFileAsync(configFile, JSON.stringify(config));

    const result = await runScaffolding(configFile, tmpDir);

    expect(result.exitCode).toBe(0);

    // Check variable substitution in architecture overview
    const overview = joinPath(targetDir, 'specs', 'architecture', 'overview.md');
    const content = readFile(overview);

    expect(content).toContain('my-app');
    expect(content).not.toContain('{{PROJECT_NAME}}');
  });
});
