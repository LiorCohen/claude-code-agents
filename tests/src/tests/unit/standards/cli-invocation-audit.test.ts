/**
 * Unit Tests: CLI Invocation Audit
 *
 * WHY: Ensures all prompt files (.md) under plugin/ reference CLI commands
 * that actually exist, and that no prompt files use the broken
 * ${CLAUDE_PLUGIN_ROOT} notation (replaced with <plugin-root>).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { PLUGIN_DIR, REPO_ROOT } from '@/lib';

const SYSTEM_SRC = join(PLUGIN_DIR, 'system', 'src');
const COMMANDS_DIR = join(SYSTEM_SRC, 'commands');

/**
 * Recursively walk a directory and return all files matching a predicate.
 */
const walkFiles = (dir: string, predicate: (name: string) => boolean): readonly string[] => {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      return walkFiles(fullPath, predicate);
    }
    if (entry.isFile() && predicate(entry.name)) {
      return [fullPath];
    }
    return [];
  });
};

/**
 * Build the namespace → actions registry from schema.ts files.
 */
const buildCommandRegistry = (): ReadonlyMap<string, readonly string[]> => {
  const namespaces = readdirSync(COMMANDS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const registry = new Map<string, readonly string[]>();

  for (const ns of namespaces) {
    const schemaPath = join(COMMANDS_DIR, ns, 'schema.ts');
    try {
      const content = readFileSync(schemaPath, 'utf-8');
      const match = content.match(/ACTIONS\s*=\s*\[([^\]]+)\]/);
      if (match) {
        const actions = match[1]
          .split(',')
          .map((s) => s.trim().replace(/['"]/g, ''))
          .filter((s) => s.length > 0);
        registry.set(ns, actions);
      }
    } catch {
      // No schema.ts for this namespace — skip
    }
  }

  return registry;
};

/**
 * Find all system-run.sh invocations in .md files under plugin/.
 */
const findCliReferences = (
  mdFiles: readonly string[]
): readonly { readonly file: string; readonly line: number; readonly namespace: string; readonly action: string }[] => {
  const references: { readonly file: string; readonly line: number; readonly namespace: string; readonly action: string }[] = [];
  const pattern = /system-run\.sh\s+(\w+)\s+(\w[\w-]*)/g;

  for (const file of mdFiles) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((lineContent, idx) => {
      let match: RegExpExecArray | null;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(lineContent)) !== null) {
        references.push({
          file: relative(REPO_ROOT, file),
          line: idx + 1,
          namespace: match[1],
          action: match[2],
        });
      }
    });
  }

  return references;
};

describe('CLI Invocation Audit', () => {
  const allMdFiles = walkFiles(PLUGIN_DIR, (name) => name.endsWith('.md'));
  const registry = buildCommandRegistry();

  it('all prompt CLI references match existing commands', () => {
    const references = findCliReferences(allMdFiles);
    expect(references.length).toBeGreaterThan(0);

    const invalid: string[] = [];

    for (const ref of references) {
      const actions = registry.get(ref.namespace);
      if (!actions) {
        invalid.push(`${ref.file}:${ref.line} — unknown namespace "${ref.namespace}" (${ref.namespace} ${ref.action})`);
        continue;
      }
      if (!actions.includes(ref.action)) {
        invalid.push(`${ref.file}:${ref.line} — unknown action "${ref.action}" in namespace "${ref.namespace}" (valid: ${actions.join(', ')})`);
      }
    }

    expect(invalid, `Invalid CLI references:\n${invalid.join('\n')}`).toEqual([]);
  });

  it('no prompt files use ${CLAUDE_PLUGIN_ROOT} in invocation or path contexts', () => {
    const pattern = /\$\{CLAUDE_PLUGIN_ROOT\}/g;

    // Allowlist: files where the env var name is the subject of explanatory prose
    const allowlist = new Set([
      'plugin/hooks/hooks.json', // Claude Code interpolates this in JSON configs
    ]);

    const violations: string[] = [];

    for (const file of allMdFiles) {
      const relPath = relative(REPO_ROOT, file);
      if (allowlist.has(relPath)) continue;

      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((lineContent, idx) => {
        if (pattern.test(lineContent)) {
          violations.push(`${relPath}:${idx + 1}: ${lineContent.trim()}`);
        }
        pattern.lastIndex = 0;
      });
    }

    expect(violations, `Files still using \${CLAUDE_PLUGIN_ROOT}:\n${violations.join('\n')}`).toEqual([]);
  });

  it('system-run.sh does not reference CLAUDE_PLUGIN_ROOT', () => {
    const content = readFileSync(join(PLUGIN_DIR, 'system', 'system-run.sh'), 'utf-8');
    expect(content).not.toContain('CLAUDE_PLUGIN_ROOT');
  });

  it('hook-runner.sh does not reference CLAUDE_PLUGIN_ROOT', () => {
    const content = readFileSync(join(PLUGIN_DIR, 'hooks', 'hook-runner.sh'), 'utf-8');
    expect(content).not.toContain('CLAUDE_PLUGIN_ROOT');
  });
});
