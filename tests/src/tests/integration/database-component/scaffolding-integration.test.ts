/**
 * Database Component Scaffolding Integration Tests
 *
 * WHY: End-to-end scaffolding tests verify that the scaffolding script
 * actually produces working output. Unit tests on templates aren't enough -
 * we need to run the actual scaffolding to catch integration issues.
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
   * WHY: This is the critical test - does scaffolding actually create
   * the expected file structure? Failures here mean users get incomplete
   * or broken database components.
   */
  it('creates correct database structure', async () => {
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

    // Verify database structure (pluralized type: databases/<name>)
    const dbDir = joinPath(targetDir, 'components', 'databases', 'database');
    expect(fileExists(dbDir)).toBe(true);
    expect(fileExists(joinPath(dbDir, 'package.json'))).toBe(true);
    expect(fileExists(joinPath(dbDir, 'README.md'))).toBe(true);
    expect(isDirectory(joinPath(dbDir, 'migrations'))).toBe(true);
    expect(isDirectory(joinPath(dbDir, 'seeds'))).toBe(true);
    // Note: scripts/ directory no longer created - commands use sdd-system CLI
  });

  /**
   * WHY: Variable substitution is critical for generating unique projects.
   * If {{PROJECT_NAME}} isn't replaced, package.json will have the literal
   * string, causing npm conflicts and confusion.
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

    // Check variable substitution (pluralized type: databases/<name>)
    const packageJson = joinPath(targetDir, 'components', 'databases', 'database', 'package.json');
    const content = readFile(packageJson);

    expect(content).toContain('@my-app/database');
    expect(content).not.toContain('{{PROJECT_NAME}}');
  });
});
