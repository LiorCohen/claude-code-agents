/**
 * Workflow Test: /sdd-init command
 *
 * WHY: Verifies that sdd-init creates the expected minimal project structure.
 * This is a workflow test that runs Claude with a predefined prompt
 * and validates the generated output deterministically.
 *
 * The new sdd-init creates MINIMAL structure:
 * - .sdd/sdd-settings.yaml (config component only)
 * - specs/INDEX.md (empty registry)
 * - components/config/ (only config scaffolded)
 * - README.md, CLAUDE.md, .gitignore
 *
 * Full component scaffolding happens on-demand via /sdd-change new.
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

const MINIMAL_INIT_PROMPT = `Run /sdd-init to create a new project.

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
   - .sdd/sdd-settings.yaml (with config component only)
   - specs/INDEX.md (empty registry)
   - components/config/ (config component scaffolded)
   - README.md, CLAUDE.md, .gitignore
5. DO NOT create: changes/, specs/domain/, server, webapp, contract, database
6. Complete the entire workflow without stopping`;

/**
 * WHY: sdd-init is the primary entry point for new projects. If it doesn't
 * create the correct minimal structure, the change-driven workflow is broken.
 */
describe('sdd-init command', () => {
  let testProject: TestProject;

  beforeAll(async () => {
    testProject = await createTestProject('test-minimal-project');
  });

  /**
   * WHY: This test validates that sdd-init creates a minimal, functional
   * project structure. Only config component should be scaffolded.
   * Other components are scaffolded on-demand by /sdd-change new.
   */
  it('creates minimal project structure', async () => {
    console.log(`\nTest directory: ${testProject.path}\n`);
    console.log('Running /sdd-init (minimal mode)...');

    // sdd-init minimal should be faster than full scaffolding
    const result = await runClaude(MINIMAL_INIT_PROMPT, testProject.path, 180);

    // Save output for debugging
    await writeFileAsync(joinPath(testProject.path, 'claude-output.json'), result.output);

    console.log('\nVerifying minimal project structure...\n');

    // Use test directory directly (no subdirectory in new workflow)
    const project = testProject;

    // === SHOULD EXIST (minimal structure) ===

    // SDD settings directory and file
    expect(projectIsDir(project, '.sdd')).toBe(true);
    expect(projectIsFile(project, '.sdd', 'sdd-settings.yaml')).toBe(true);

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
    expect(projectFileContains(project, '.sdd/sdd-settings.yaml', 'name: config')).toBe(true);
    expect(projectFileContains(project, '.sdd/sdd-settings.yaml', 'type: config')).toBe(true);

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
  }, 240000); // 4 minute timeout for minimal scaffolding
});
