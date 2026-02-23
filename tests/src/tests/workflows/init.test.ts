/**
 * Workflow Test: /sdd-run init command
 *
 * WHY: Verifies that init creates the expected minimal project structure.
 * This is a workflow test that runs Claude with a predefined prompt
 * and validates the generated output deterministically.
 *
 * The new init command creates MINIMAL structure:
 * - sdd/sdd-settings.yaml (config component only)
 * - specs/INDEX.md (empty registry)
 * - components/config/ (only config scaffolded)
 * - README.md, CLAUDE.md, .gitignore
 *
 * Full component scaffolding happens on-demand via /sdd-run change create.
 */

import { describe, expect, it, beforeAll } from 'vitest';
import {
  createTestProject,
  runClaude,
  projectIsDir,
  projectIsFile,
  projectFileContains,
  projectFileDoesNotExist,
  writeFileAsync,
  joinPath,
  type TestProject,
} from '@/lib';

const EXISTING_PROJECT_PROMPT = `Run /sdd-run init on this existing project.

AUTOMATED TEST MODE - SKIP ALL INTERACTIVE PHASES:
- This is an existing SDD project (sdd-settings.yaml already exists)
- Skip environment verification: Assume all tools are installed
- Skip permissions check: Assume permissions are configured
- The project name should be loaded from sdd-settings.yaml (test-existing-project)
- DO NOT ask for the project name — it's already configured

CRITICAL INSTRUCTIONS:
1. DO NOT ask any questions - all input is provided above
2. DO NOT wait for user approval - consider everything pre-approved
3. Since sdd-settings.yaml exists, detect this is an existing project
4. Load the project name from settings (do NOT prompt for it)
5. Complete the workflow without stopping`;

const MINIMAL_INIT_PROMPT = `Run /sdd-run init to create a new project.

AUTOMATED TEST MODE - SKIP ALL INTERACTIVE PHASES:
- The current directory is named "test-minimal-project"
- Skip environment verification: Assume all tools are installed
- Skip permissions check: Assume permissions are configured
- Skip component selection: Use "I don't know yet" (skip - add components later)
- Execute Phase 3: Create minimal structure

CRITICAL INSTRUCTIONS:
1. DO NOT ask any questions - all input is provided above
2. DO NOT wait for user approval - consider everything pre-approved
3. Create files in CURRENT WORKING DIRECTORY (not a subdirectory)
4. Create ONLY minimal structure:
   - sdd/sdd-settings.yaml (with config component only)
   - specs/INDEX.md (empty registry)
   - components/config/ (config component scaffolded)
   - README.md, CLAUDE.md, .gitignore
5. DO NOT create: changes/, specs/domain/, server, webapp, contract, database
6. Complete the entire workflow without stopping`;

/**
 * WHY: init is the primary entry point for new projects. If it doesn't
 * create the correct minimal structure, the change-driven workflow is broken.
 */
describe('init command', () => {
  let testProject: TestProject;

  beforeAll(async () => {
    testProject = await createTestProject('test-minimal-project');
  });

  /**
   * WHY: This test validates that init creates a minimal, functional
   * project structure. Only config component should be scaffolded.
   * Other components are scaffolded on-demand by /sdd-run change create.
   */
  it('creates minimal project structure', async () => {
    console.log(`\nTest directory: ${testProject.path}\n`);
    console.log('Running /sdd-run init (minimal mode)...');

    // init minimal should be faster than full scaffolding
    const result = await runClaude(MINIMAL_INIT_PROMPT, testProject.path, 300);

    // Save output for debugging
    await writeFileAsync(joinPath(testProject.path, 'claude-output.json'), result.output);

    console.log('\nVerifying minimal project structure...\n');

    // Use test directory directly (no subdirectory in new workflow)
    const project = testProject;

    // === SHOULD EXIST (minimal structure) ===

    // SDD settings directory and file
    expect(projectIsDir(project, 'sdd')).toBe(true);
    expect(projectIsFile(project, 'sdd', 'sdd-settings.yaml')).toBe(true);

    // Specs directory with INDEX.md
    expect(projectIsDir(project, 'specs')).toBe(true);
    expect(projectIsFile(project, 'specs', 'INDEX.md')).toBe(true);

    // Components directory with only config
    expect(projectIsDir(project, 'components')).toBe(true);
    expect(projectIsDir(project, 'components', 'config')).toBe(true);
    expect(projectIsFile(project, 'components', 'config', 'package.json')).toBe(true);
    expect(projectIsDir(project, 'components', 'config', 'envs')).toBe(true);
    expect(projectIsDir(project, 'components', 'config', 'envs', 'default')).toBe(true);

    // Root files
    expect(projectIsFile(project, 'README.md')).toBe(true);
    expect(projectIsFile(project, 'CLAUDE.md')).toBe(true);
    expect(projectIsFile(project, '.gitignore')).toBe(true);

    // sdd-settings.yaml should contain only config component
    expect(projectFileContains(project, 'sdd/sdd-settings.yaml', 'name: config')).toBe(true);
    expect(projectFileContains(project, 'sdd/sdd-settings.yaml', 'type: config')).toBe(true);

    // === SHOULD NOT EXIST (deferred to first change) ===

    // Changes directory
    expect(projectFileDoesNotExist(project, 'changes')).toBe(true);

    // Domain specs
    expect(projectFileDoesNotExist(project, 'specs', 'domain')).toBe(true);
    expect(projectFileDoesNotExist(project, 'specs', 'domain', 'glossary.md')).toBe(true);

    // Architecture specs
    expect(projectFileDoesNotExist(project, 'specs', 'architecture')).toBe(true);

    // Other components (scaffolded on-demand)
    expect(projectFileDoesNotExist(project, 'components', 'server')).toBe(true);
    expect(projectFileDoesNotExist(project, 'components', 'webapp')).toBe(true);
    expect(projectFileDoesNotExist(project, 'components', 'contract')).toBe(true);
    expect(projectFileDoesNotExist(project, 'components', 'database')).toBe(true);

    console.log('\nAll assertions passed!');
  }, 360000); // 6 minute timeout for minimal scaffolding
});

/**
 * WHY: When init runs on an existing project, it should detect the
 * existing settings and NOT prompt for project name.
 */
describe('init existing project detection', () => {
  let testProject: TestProject;

  beforeAll(async () => {
    testProject = await createTestProject('test-existing-project');

    // Set up a pre-existing SDD project with old-format settings
    const { execSync } = await import('child_process');
    execSync(`mkdir -p "${joinPath(testProject.path, '.sdd')}"`, { encoding: 'utf-8' });
    execSync(`mkdir -p "${joinPath(testProject.path, 'specs')}"`, { encoding: 'utf-8' });
    execSync(`mkdir -p "${joinPath(testProject.path, 'components', 'config')}"`, { encoding: 'utf-8' });

    // Write old-format settings (pre-reconciliation)
    await writeFileAsync(
      joinPath(testProject.path, '.sdd', 'sdd-settings.yaml'),
      `sdd:
  plugin_version: "5.0.0"
  initialized_at: "2026-01-01"
  last_updated: "2026-01-15"
project:
  name: test-existing-project
  description: Test project for upgrade detection
  domain: Testing
  type: fullstack
components:
  - name: config
    type: config
    path: components/config
    settings: {}
`
    );

    // Write empty specs INDEX
    await writeFileAsync(
      joinPath(testProject.path, 'specs', 'INDEX.md'),
      '# Spec Index\n\n(empty)\n'
    );

    // Initialize git so the project looks valid
    execSync('git init', {
      cwd: testProject.path,
      encoding: 'utf-8',
    });
  });

  it('detects existing project and skips name prompt', async () => {
    console.log(`\nTest directory: ${testProject.path}\n`);
    console.log('Running /sdd-run init on existing project...');

    const result = await runClaude(EXISTING_PROJECT_PROMPT, testProject.path, 180);

    // Save output for debugging
    await writeFileAsync(joinPath(testProject.path, 'claude-output.json'), result.output);

    // The existing .sdd/sdd-settings.yaml should still exist
    expect(projectIsFile(testProject, '.sdd', 'sdd-settings.yaml')).toBe(true);

    // Settings should still contain the project name (not overwritten)
    expect(projectFileContains(testProject, '.sdd/sdd-settings.yaml', 'test-existing-project')).toBe(true);

    console.log('✓ Existing project detected, name preserved');
    console.log('\nAll assertions passed!');
  }, 240000);
});
