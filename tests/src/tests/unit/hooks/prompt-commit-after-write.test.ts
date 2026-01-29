/**
 * Unit Tests: prompt-commit-after-write.sh hook
 *
 * WHY: This PostToolUse hook ensures no file changes are lost by prompting
 * Claude to commit after writes to SDD-managed directories. Incorrect behavior
 * could either spam users with unnecessary prompts or fail to remind them
 * about important uncommitted changes.
 */

import { describe, expect, it } from 'vitest';
import { runCommand, PLUGIN_DIR, joinPath } from '../../../lib';

const HOOK_PATH = joinPath(PLUGIN_DIR, 'hooks', 'prompt-commit-after-write.sh');

/**
 * Helper to run the hook with given input JSON.
 */
const runHook = async (input: object) => {
  return runCommand('bash', [HOOK_PATH], {
    input: JSON.stringify(input),
    timeout: 5000,
  });
};

/**
 * WHY: SDD-managed directories should trigger commit prompts to prevent data loss.
 */
describe('SDD-managed directories trigger commit prompts', () => {
  /**
   * WHY: changes/ contains specs and plans that are critical to preserve.
   */
  it('triggers for Write to changes/', async () => {
    const result = await runHook({
      tool: 'Write',
      tool_input: { file_path: 'changes/2026/01/29/test-feature/SPEC.md' },
    });

    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput.message).toContain('Created SPEC.md');
    expect(output.hookSpecificOutput.message).toContain('changes/2026/01/29/test-feature');
    expect(output.hookSpecificOutput.message).toContain('Consider committing');
  });

  /**
   * WHY: specs/ contains domain knowledge and architecture docs.
   */
  it('triggers for Write to specs/', async () => {
    const result = await runHook({
      tool: 'Write',
      tool_input: { file_path: 'specs/domain/glossary.md' },
    });

    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput.message).toContain('Created glossary.md');
    expect(output.hookSpecificOutput.message).toContain('specs');
  });

  /**
   * WHY: components/ contains all generated code.
   */
  it('triggers for Write to components/', async () => {
    const result = await runHook({
      tool: 'Write',
      tool_input: { file_path: 'components/backend/src/index.ts' },
    });

    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput.message).toContain('Created index.ts');
    expect(output.hookSpecificOutput.message).toContain('components');
  });

  /**
   * WHY: config/ contains project configuration.
   */
  it('triggers for Write to config/', async () => {
    const result = await runHook({
      tool: 'Write',
      tool_input: { file_path: 'config/database.yaml' },
    });

    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput.message).toContain('Created database.yaml');
    expect(output.hookSpecificOutput.message).toContain('config');
  });

  /**
   * WHY: tests/ contains test files that should be committed.
   */
  it('triggers for Write to tests/', async () => {
    const result = await runHook({
      tool: 'Write',
      tool_input: { file_path: 'tests/unit/auth.test.ts' },
    });

    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput.message).toContain('Created auth.test.ts');
    expect(output.hookSpecificOutput.message).toContain('tests');
  });
});

/**
 * WHY: Edit tool should also trigger prompts since modifications can be lost too.
 */
describe('Edit tool triggers commit prompts', () => {
  it('triggers for Edit with "Modified" message', async () => {
    const result = await runHook({
      tool: 'Edit',
      tool_input: { file_path: 'components/backend/src/index.ts' },
    });

    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput.message).toContain('Modified index.ts');
    expect(output.hookSpecificOutput.message).not.toContain('Created');
  });
});

/**
 * WHY: Non-SDD directories should not trigger prompts to avoid noise.
 */
describe('Non-SDD directories are silent', () => {
  /**
   * WHY: docs/ is not an SDD-managed directory.
   */
  it('does not trigger for docs/', async () => {
    const result = await runHook({
      tool: 'Write',
      tool_input: { file_path: 'docs/README.md' },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('');
  });

  /**
   * WHY: Root files are not in SDD-managed directories.
   */
  it('does not trigger for root package.json', async () => {
    const result = await runHook({
      tool: 'Write',
      tool_input: { file_path: 'package.json' },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('');
  });

  /**
   * WHY: node_modules should never trigger (and is blocked by PreToolUse anyway).
   */
  it('does not trigger for node_modules/', async () => {
    const result = await runHook({
      tool: 'Write',
      tool_input: { file_path: 'node_modules/some-package/index.js' },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('');
  });
});

/**
 * WHY: Only Write and Edit tools should trigger prompts.
 */
describe('Non-write tools are silent', () => {
  it('does not trigger for Read tool', async () => {
    const result = await runHook({
      tool: 'Read',
      tool_input: { file_path: 'components/backend/src/index.ts' },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('');
  });

  it('does not trigger for Bash tool', async () => {
    const result = await runHook({
      tool: 'Bash',
      tool_input: { command: 'ls -la' },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('');
  });
});

/**
 * WHY: The hook output must follow Claude Code's PostToolUse format.
 */
describe('Output format is correct', () => {
  it('has correct hookSpecificOutput structure', async () => {
    const result = await runHook({
      tool: 'Write',
      tool_input: { file_path: 'specs/domain/entities.md' },
    });

    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout);

    expect(output).toHaveProperty('hookSpecificOutput');
    expect(output.hookSpecificOutput).toHaveProperty('hookEventName', 'PostToolUse');
    expect(output.hookSpecificOutput).toHaveProperty('message');
    expect(typeof output.hookSpecificOutput.message).toBe('string');
  });
});

/**
 * WHY: changes/ paths should show the full change directory for context.
 */
describe('changes/ path extraction', () => {
  it('extracts change directory from deep path', async () => {
    const result = await runHook({
      tool: 'Write',
      tool_input: { file_path: 'changes/2026/01/29/user-auth/PLAN.md' },
    });

    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput.message).toContain('changes/2026/01/29/user-auth');
  });

  it('handles nested files in change directory', async () => {
    const result = await runHook({
      tool: 'Write',
      tool_input: { file_path: 'changes/2026/01/29/user-auth/docs/notes.md' },
    });

    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout);
    // Should still reference the change directory, not the nested path
    expect(output.hookSpecificOutput.message).toContain('changes/2026/01/29/user-auth');
  });
});
