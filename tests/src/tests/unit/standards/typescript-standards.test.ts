/**
 * Unit Tests: TypeScript Standards Conformance
 *
 * WHY: Ensures all TypeScript code in the repo follows the documented
 * typescript-standards skill. Catches violations before they're committed.
 */

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { PLUGIN_DIR, REPO_ROOT } from '@/lib';

const PLUGIN_SRC = join(PLUGIN_DIR, 'system', 'src');
const TESTS_SRC = join(REPO_ROOT, 'tests', 'src');

// Files to exclude from CommonJS checks (this test file checks for these patterns)
const SELF_FILE = 'typescript-standards.test.ts';

// AJV wrapper requires .js extension for Node.js ESM subpath resolution (ajv/dist/2020.js)
const JS_EXTENSION_ALLOWED = new Set(['json-schema.ts']);

const walkTs = (dir: string): readonly string[] => {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      return walkTs(fullPath);
    }
    if (entry.isFile() && entry.name.endsWith('.ts')) {
      return [fullPath];
    }
    return [];
  });
};

describe('TypeScript Standards Conformance', () => {
  const allTsFiles = [...walkTs(PLUGIN_SRC), ...walkTs(TESTS_SRC)];

  describe('No file extensions in imports', () => {
    it('no .js extensions in import statements', () => {
      const violations: string[] = [];

      for (const file of allTsFiles) {
        if (JS_EXTENSION_ALLOWED.has(file.split('/').pop()!)) continue;
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (line.match(/^\s*(import|export).*from\s+['"].*\.js['"]/)) {
            violations.push(`${relative(REPO_ROOT, file)}:${idx + 1}`);
          }
        });
      }

      expect(violations, `Files with .js imports:\n${violations.join('\n')}`).toHaveLength(0);
    });

    it('no .ts extensions in import statements', () => {
      const violations: string[] = [];

      for (const file of allTsFiles) {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (line.match(/^\s*(import|export).*from\s+['"].*\.ts['"]/)) {
            violations.push(`${relative(REPO_ROOT, file)}:${idx + 1}`);
          }
        });
      }

      expect(violations, `Files with .ts imports:\n${violations.join('\n')}`).toHaveLength(0);
    });
  });

  describe('No deep relative imports', () => {
    it('no imports with 3+ levels of ../)', () => {
      const violations: string[] = [];

      for (const file of allTsFiles) {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          // Match imports with 3 or more ../
          if (line.match(/^\s*(import|export).*from\s+['"]\.\.\/\.\.\/\.\.\//)) {
            violations.push(`${relative(REPO_ROOT, file)}:${idx + 1}: ${line.trim()}`);
          }
        });
      }

      expect(violations, `Deep relative imports (use @/ alias):\n${violations.join('\n')}`).toHaveLength(0);
    });
  });

  describe('typescript-standards skill sync', () => {
    it('.claude and plugin versions have identical content', () => {
      const claudeVersion = readFileSync(
        join(REPO_ROOT, '.claude/skills/typescript-standards/SKILL.md'),
        'utf-8'
      );
      const pluginVersion = readFileSync(
        join(REPO_ROOT, 'plugin/skills/typescript-standards/SKILL.md'),
        'utf-8'
      );

      // Strip plugin-only frontmatter attributes before comparing
      const normalized = pluginVersion.replace(/^user-invocable:.*\n/m, '');

      expect(claudeVersion).toBe(normalized);
    });
  });

  describe('No default exports', () => {
    it('no export default statements', () => {
      const violations: string[] = [];

      for (const file of allTsFiles) {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (line.match(/^\s*export\s+default\b/)) {
            violations.push(`${relative(REPO_ROOT, file)}:${idx + 1}`);
          }
        });
      }

      expect(violations, `Files with default exports:\n${violations.join('\n')}`).toHaveLength(0);
    });
  });

  describe('No CommonJS', () => {
    // Filter out this test file which contains these patterns in its regex checks
    const filesForCommonJsCheck = allTsFiles.filter((f) => !f.endsWith(SELF_FILE));

    it('no require() calls', () => {
      const violations: string[] = [];

      for (const file of filesForCommonJsCheck) {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (line.match(/[^\/]\brequire\s*\(/) && !line.trim().startsWith('//')) {
            violations.push(`${relative(REPO_ROOT, file)}:${idx + 1}`);
          }
        });
      }

      expect(violations, `Files with require():\n${violations.join('\n')}`).toHaveLength(0);
    });

    it('no module.exports', () => {
      const violations: string[] = [];

      for (const file of filesForCommonJsCheck) {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (line.match(/\bmodule\.exports\b/) && !line.trim().startsWith('//')) {
            violations.push(`${relative(REPO_ROOT, file)}:${idx + 1}`);
          }
        });
      }

      expect(violations, `Files with module.exports:\n${violations.join('\n')}`).toHaveLength(0);
    });
  });
});
