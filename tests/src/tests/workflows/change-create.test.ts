/**
 * Workflow Test: /sdd-run change create command
 *
 * WHY: Verifies that change create correctly creates SPEC.md
 * with proper structure and content. This ensures the SDD workflow produces
 * valid specifications. Plans are created via separate approval step.
 */

import { describe, expect, it, beforeAll } from 'vitest';
import {
  createTestProject,
  runClaude,
  projectFindDir,
  writeFileAsync,
  mkdir,
  joinPath,
  statAsync,
  readFileAsync,
  type TestProject,
} from '@/lib';

const NEW_CHANGE_PROMPT = `Run /sdd-run change create --type feature --name user-auth to create a new change specification.

Change name: user-auth
Change type: feature
Issue reference: TEST-001
Domain: Core
Description: User authentication with email and password

When prompted, provide these answers:
- Change name: user-auth
- Type: feature
- Issue: TEST-001
- Domain: Core
- Description: Basic user authentication allowing users to sign up, log in, and log out using email and password credentials.

IMPORTANT:
- Do not ask any questions. Use the values provided above.
- Complete the SPEC.md before finishing (PLAN.md is created via /sdd-run change approve spec).
- Create ALL files in the CURRENT WORKING DIRECTORY (.) - do NOT use absolute paths or navigate elsewhere.
- The changes/ directory already exists in the current directory.`;

/**
 * WHY: change create is the primary workflow for creating new feature specs.
 * If the workflow fails, specifications will be malformed or missing critical
 * information, breaking the entire SDD process.
 */
describe('change create command', () => {
  let testProject: TestProject;

  beforeAll(async () => {
    testProject = await createTestProject('change-create');

    // Create minimal project structure that /sdd-run change create expects
    await mkdir(joinPath(testProject.path, 'changes'));
    await mkdir(joinPath(testProject.path, 'specs', 'domain'));
    await mkdir(joinPath(testProject.path, 'components', 'contract'));

    // Create minimal glossary
    await writeFileAsync(
      joinPath(testProject.path, 'specs', 'domain', 'glossary.md'),
      `# Glossary

## Domains

### Core
The primary business domain.

## Terms

(No terms defined yet)
`
    );

    // Create minimal INDEX.md in changes/ (not specs/)
    await writeFileAsync(
      joinPath(testProject.path, 'changes', 'INDEX.md'),
      `# Change Index

## Active Changes

(No changes yet)
`
    );
  });

  /**
   * WHY: The change-creation workflow must create SPEC.md with
   * proper structure and content. PLAN.md is created via spec approval.
   */
  it('creates SPEC.md with proper structure', async () => {
    console.log(`\nTest project directory: ${testProject.path}\n`);
    console.log('Created minimal project structure\n');
    console.log('Running /sdd-run change create...');

    const result = await runClaude(NEW_CHANGE_PROMPT, testProject.path, 420);

    // Save output for debugging
    await writeFileAsync(joinPath(testProject.path, 'claude-output.json'), result.output);

    console.log('\nVerifying generated files...\n');

    // Find the generated spec directory
    const specDir = projectFindDir(testProject, 'user-auth');

    expect(specDir).not.toBeNull();
    console.log(`Found spec directory: ${specDir}`);

    // Verify SPEC.md exists and has correct content
    const specFile = joinPath(specDir!, 'SPEC.md');
    const specStat = await statAsync(specFile);
    expect(specStat?.isFile()).toBe(true);

    const specContent = await readFileAsync(specFile);
    expect(specContent).toContain('sdd_version:');
    expect(specContent).toContain('issue:');
    expect(specContent).toContain('type:');

    // Note: PLAN.md is now created via /sdd-run change approve spec
    // This test only verifies spec creation

    console.log('\nAll assertions passed!');
  }, 480000); // 8 minute timeout
});
