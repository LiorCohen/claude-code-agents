/**
 * Unit Tests: JSON Schema 2020-12 Conformance
 *
 * WHY: Ensures the entire codebase consistently uses JSON Schema 2020-12.
 * Catches regressions: stale draft-07 references, direct AJV imports outside
 * the centralized lib, or legacy type imports.
 */

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { PLUGIN_DIR, REPO_ROOT, readFile } from '@/lib';

const PLUGIN_SRC = join(PLUGIN_DIR, 'system', 'src');
const SCAFFOLD_SCHEMA = join(PLUGIN_SRC, 'commands', 'scaffolding', 'scaffold-spec.schema.json');
const SETTINGS_SCHEMA = join(PLUGIN_SRC, 'settings', 'schema.ts');

// Files allowed to import AJV directly:
// - json-schema.ts: the centralized wrapper itself
// - load_config.ts: backend template scaffolded into user projects (cannot use @/lib)
const AJV_DIRECT_IMPORT_ALLOWED = new Set(['json-schema.ts', 'load_config.ts']);

const walkTs = (dir: string): readonly string[] => {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      return walkTs(fullPath);
    }
    if (entry.isFile() && entry.name.endsWith('.ts')) {
      return [fullPath];
    }
    return [];
  });
};

describe('JSON Schema 2020-12 Conformance', () => {
  describe('settings schema', () => {
    it('has 2020-12 $schema URI', () => {
      const content = readFile(SETTINGS_SCHEMA);
      expect(content).toContain("$schema: 'https://json-schema.org/draft/2020-12/schema'");
    });
  });

  describe('scaffold-spec.schema.json', () => {
    it('has $schema field', () => {
      const content = JSON.parse(readFile(SCAFFOLD_SCHEMA)) as Record<string, unknown>;
      expect(content['$schema']).toBe('https://json-schema.org/draft/2020-12/schema');
    });

    it('uses $defs (not definitions)', () => {
      const content = readFile(SCAFFOLD_SCHEMA);
      expect(content).toContain('"$defs"');
      expect(content).not.toContain('"definitions"');
    });
  });

  describe('no draft-07 references', () => {
    const allTsFiles = walkTs(PLUGIN_SRC);

    it('no draft-07 URI in TypeScript source', () => {
      const violations: string[] = [];

      for (const file of allTsFiles) {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (line.includes('draft-07') || line.includes('json-schema.org/draft-07')) {
            violations.push(`${relative(REPO_ROOT, file)}:${idx + 1}: ${line.trim()}`);
          }
        });
      }

      expect(violations, `Files with draft-07 references:\n${violations.join('\n')}`).toHaveLength(0);
    });
  });

  describe('no JSONSchema7 type import', () => {
    const allTsFiles = walkTs(PLUGIN_SRC);

    it('no import of JSONSchema7 from @types/json-schema', () => {
      const violations: string[] = [];

      for (const file of allTsFiles) {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          // Match actual imports/usages, not comments mentioning the old type
          if (line.match(/\bJSONSchema7\b/) && !line.trim().startsWith('*') && !line.trim().startsWith('//')) {
            violations.push(`${relative(REPO_ROOT, file)}:${idx + 1}: ${line.trim()}`);
          }
        });
      }

      expect(violations, `Files with JSONSchema7 usage:\n${violations.join('\n')}`).toHaveLength(0);
    });
  });

  describe('no direct AJV imports outside lib', () => {
    const allTsFiles = walkTs(PLUGIN_SRC);

    it('no import from \'ajv\' or "ajv" outside allowed files', () => {
      const violations: string[] = [];

      for (const file of allTsFiles) {
        const fileName = file.split('/').pop()!;
        if (AJV_DIRECT_IMPORT_ALLOWED.has(fileName)) continue;

        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (line.match(/^\s*(import|export).*from\s+['"]ajv/)) {
            violations.push(`${relative(REPO_ROOT, file)}:${idx + 1}: ${line.trim()}`);
          }
        });
      }

      expect(
        violations,
        `Files with direct AJV imports (use @/lib/json-schema instead):\n${violations.join('\n')}`
      ).toHaveLength(0);
    });
  });

  describe('no @types/json-schema dependency', () => {
    it('not in plugin/system/package.json', () => {
      const content = readFile(join(PLUGIN_DIR, 'system', 'package.json'));
      expect(content).not.toContain('@types/json-schema');
    });
  });
});
