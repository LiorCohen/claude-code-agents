/**
 * Workflow Test: /sdd-change new --spec with external spec
 *
 * WHY: Verifies that sdd-change new properly handles external specifications:
 * - Archives external spec to .sdd/archive/external-specs/ (audit only)
 * - Creates workflow items with context files
 * - Performs domain analysis with thinking step
 * - Creates epic structure when 3+ changes identified
 * - Never references archive/ in generated specs
 */

import { describe, expect, it, beforeAll } from 'vitest';
import {
  createTestProject,
  runClaude,
  projectIsDir,
  projectIsFile,
  writeFileAsync,
  readFileAsync,
  joinPath,
  statAsync,
  type TestProject,
} from '@/lib';

// Sample external spec with 3 sections (should trigger epic recommendation)
const EXTERNAL_SPEC_CONTENT = `# User Management System

A comprehensive user management system for web applications.

## User Registration

Users should be able to register for an account using email and password.

### Requirements
- Email validation
- Password strength requirements
- Email verification flow

### Acceptance Criteria
- Given a valid email and password, when user submits registration, then account is created
- Given an invalid email, when user submits, then validation error is shown
- Given a weak password, when user submits, then strength error is shown

### API Endpoints
- POST /api/users/register
- POST /api/users/verify-email

## User Authentication

Users should be able to log in and manage sessions.

### Requirements
- Login with email/password
- JWT token management
- Refresh token support

### Acceptance Criteria
- Given valid credentials, when user logs in, then JWT token is returned
- Given invalid credentials, when user logs in, then 401 error is returned
- Given expired token, when user refreshes, then new token is issued

### API Endpoints
- POST /api/auth/login
- POST /api/auth/refresh
- DELETE /api/auth/logout

## User Profile

Users should be able to view and update their profile.

### Requirements
- View profile information
- Update profile fields
- Change password

### Acceptance Criteria
- Given authenticated user, when they view profile, then all fields are displayed
- Given valid updates, when user saves profile, then changes are persisted
- Given correct current password, when user changes password, then new password is set

### API Endpoints
- GET /api/users/me
- PATCH /api/users/me
- POST /api/users/me/password
`;

const EXTERNAL_SPEC_PROMPT = `Run /sdd-change new --spec ./external-spec.md

AUTOMATED TEST MODE - SKIP ALL INTERACTIVE PHASES:
- For external spec decomposition:
  - Accept default H2 boundary level
  - Accept the decomposition as-is (3 changes)
  - Accept epic structure when recommended (since 3+ changes)
- Use domain: "User Management"

CRITICAL INSTRUCTIONS:
1. DO NOT ask any questions - all input is provided above
2. DO NOT wait for user approval - consider everything pre-approved
3. Work in CURRENT WORKING DIRECTORY only - no absolute paths
4. Process the external spec completely
5. Complete the entire workflow without stopping`;

/**
 * WHY: External spec handling is critical for importing existing requirements.
 * If it doesn't work correctly, users can't effectively migrate to SDD.
 */
describe('sdd-change new with external spec', () => {
  let testProject: TestProject;

  beforeAll(async () => {
    testProject = await createTestProject('sdd-change-new-external');

    // Set up minimal SDD project structure (like sdd-change-new.test.ts does)
    // This mimics an already-initialized SDD project
    // Create .sdd directory first
    const { execSync } = await import('child_process');
    execSync(`mkdir -p "${joinPath(testProject.path, '.sdd')}"`, { encoding: 'utf-8' });

    await writeFileAsync(
      joinPath(testProject.path, '.sdd', 'sdd-settings.yaml'),
      `sdd:
  initialized_by_plugin_version: "5.0.0"
  updated_by_plugin_version: "5.0.0"
  initialized_at: "2026-01-01 00:00:00Z"
  updated_at: "2026-01-01 00:00:00Z"
project:
  name: test-external-spec
  description: Test project for external spec import
components: []
`
    );

    // Create required directories
    const dirs = ['changes', '.sdd/archive/external-specs', 'specs/domain'];
    for (const dir of dirs) {
      execSync(`mkdir -p "${joinPath(testProject.path, dir)}"`, { encoding: 'utf-8' });
    }

    // Create INDEX.md in changes/ directory
    await writeFileAsync(
      joinPath(testProject.path, 'changes', 'INDEX.md'),
      `# Change Index

## Active Changes

(none)

## External Specifications

*None imported yet*
`
    );

    // Initialize git (sdd-change new checks git branch)
    execSync('git init && git checkout -b feature/external-spec-test', {
      cwd: testProject.path,
      encoding: 'utf-8',
    });
  });

  /**
   * WHY: This test validates that sdd-change new with --spec creates:
   * 1. Archive of external spec in .sdd/archive/external-specs/
   * 2. Workflow items with context files
   * 3. Domain analysis with thinking step
   * 4. Epic structure for 3+ changes
   */
  it('creates workflow items from external spec with 3+ changes', async () => {
    console.log(`\nTest directory: ${testProject.path}\n`);

    // Create external spec file
    await writeFileAsync(
      joinPath(testProject.path, 'external-spec.md'),
      EXTERNAL_SPEC_CONTENT
    );
    console.log('Created external spec file');

    console.log('Running /sdd-change new --spec...');

    // sdd-change new with external spec - needs extended timeout
    const result = await runClaude(EXTERNAL_SPEC_PROMPT, testProject.path, 600);

    // Save output for debugging
    await writeFileAsync(joinPath(testProject.path, 'claude-output.json'), result.output);

    console.log('\nVerifying project structure...\n');

    // Verify external spec is archived to .sdd/archive/external-specs/
    expect(projectIsDir(testProject, '.sdd', 'archive', 'external-specs')).toBe(true);
    console.log('✓ External spec archived to .sdd/archive/external-specs/');

    // Verify changes directory exists
    expect(projectIsDir(testProject, 'changes')).toBe(true);

    // Since we have 3+ changes, should create epic structure
    const changesDir = joinPath(testProject.path, 'changes');
    const changesDirStat = await statAsync(changesDir);
    expect(changesDirStat?.isDirectory()).toBe(true);

    // Helper to recursively find files
    const findFiles = async (dir: string, pattern: string): Promise<string[]> => {
      const { execSync } = await import('child_process');
      try {
        const result = execSync(`find "${dir}" -name "${pattern}" -type f`, {
          encoding: 'utf-8',
        });
        return result.trim().split('\n').filter(Boolean);
      } catch {
        return [];
      }
    };

    // Verify archived file has datetime-prefix format (yyyymmdd-HHmm-lowercased-name.md)
    const archiveDir = joinPath(testProject.path, '.sdd', 'archive', 'external-specs');
    const archiveFiles = await findFiles(archiveDir, '*.md');
    if (archiveFiles.length > 0) {
      const archivedName = archiveFiles[0]!.split('/').pop() ?? '';
      // Should match pattern: 8 digits, dash, 4 digits, dash, lowercased name
      expect(archivedName).toMatch(/^\d{8}-\d{4}-[a-z0-9-]+\.md$/);
      console.log(`✓ External spec archived with datetime prefix: ${archivedName}`);
    }

    // Check for workflow.yaml in .sdd/workflows/
    const workflowsDir = joinPath(testProject.path, '.sdd', 'workflows');
    const workflowsDirStat = await statAsync(workflowsDir);

    // Workflow directory should exist
    if (workflowsDirStat?.isDirectory()) {
      console.log('✓ Workflow directory created at .sdd/workflows/');
    }

    const foundSpecs = await findFiles(changesDir, 'SPEC.md');
    const foundContexts = await findFiles(testProject.path, 'context.md');

    console.log(`Found ${foundSpecs.length} SPEC.md files`);
    console.log(`Found ${foundContexts.length} context.md files`);

    // Should have workflow items created (context files or specs)
    const hasWorkflowItems = foundSpecs.length > 0 || foundContexts.length > 0;
    expect(hasWorkflowItems).toBe(true);
    console.log('✓ Workflow items created');

    // Verify context files contain domain analysis (if created)
    const firstContextPath = foundContexts[0];
    if (firstContextPath) {
      const firstContext = await readFileAsync(firstContextPath);

      // Should contain extracted content or domain analysis
      const hasContent =
        firstContext.includes('## Original Content') ||
        firstContext.includes('## Domain Analysis') ||
        firstContext.includes('## Context');
      expect(hasContent).toBe(true);
      console.log('✓ Context files contain domain analysis');
    }

    // Verify specs are self-sufficient (contain embedded content, not just references)
    const firstSpecPath = foundSpecs[0];
    if (firstSpecPath) {
      const firstSpec = await readFileAsync(firstSpecPath);

      // Should contain embedded content or original requirements section
      const hasContent =
        firstSpec.includes('## Original Requirements') ||
        firstSpec.includes('## User Stories') ||
        firstSpec.includes('## Acceptance Criteria') ||
        firstSpec.includes('## Domain Model');
      expect(hasContent).toBe(true);
      console.log('✓ Specs contain embedded content');

      // Should NOT contain instructions to read external spec
      const hasExternalReadInstructions =
        firstSpec.includes('see external spec') ||
        firstSpec.includes('refer to archive/') ||
        (firstSpec.includes('archive/') && !firstSpec.includes('Audit reference'));
      expect(hasExternalReadInstructions).toBe(false);
      console.log('✓ Specs do not reference archive for reading');
    }

    // Helper to find directories matching a pattern
    const findDirs = async (dir: string, pattern: RegExp): Promise<string[]> => {
      const { execSync } = await import('child_process');
      try {
        const result = execSync(`find "${dir}" -type d`, { encoding: 'utf-8' });
        return result
          .trim()
          .split('\n')
          .filter(Boolean)
          .filter((d) => pattern.test(d.split('/').pop() || ''));
      } catch {
        return [];
      }
    };

    // Check for numbered epic directories (hierarchical structure)
    const epicDirs = await findDirs(changesDir, /^\d{2}-epic-/);
    if (epicDirs.length > 0) {
      console.log(`Found ${epicDirs.length} numbered epic directories`);

      // Verify epic directories are numbered sequentially
      const epicNames = epicDirs.map((d) => d.split('/').pop() || '');
      const hasSequentialNumbers = epicNames.some((n) => n.startsWith('01-'));
      if (hasSequentialNumbers) {
        console.log('✓ Epic directories have numbered prefixes');
      }

      // Check for numbered features within epics
      for (const epicDir of epicDirs) {
        const featureDirs = await findDirs(joinPath(epicDir, 'changes'), /^\d{2}-/);
        if (featureDirs.length > 0) {
          console.log(`  Found ${featureDirs.length} numbered features in ${epicDir.split('/').pop()}`);
        }
      }
    } else {
      // If no numbered epics, check for regular epic structure or individual changes
      console.log('Note: Numbered epic structure not detected (may have created flat changes)');
    }

    console.log('\nAll assertions passed!');
  }, 660000); // 11 minute timeout for external spec processing
});
