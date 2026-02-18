/**
 * Unit Tests: json-schema.ts (centralized AJV 2020-12 wrapper)
 *
 * WHY: The json-schema lib is the ONLY place in the system CLI that imports AJV
 * directly. All schema validation flows through it. These tests verify the lib
 * works correctly at runtime.
 */

import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { PLUGIN_DIR, runCommand } from '@/lib';

const PLUGIN_SYSTEM_DIR = join(PLUGIN_DIR, 'system');

describe('JSON Schema Lib', () => {
  describe('runtime behavior', () => {
    it('compileSchema returns a validate function', async () => {
      const result = await runCommand('node', [
        '--input-type=module',
        '-e',
        [
          "import { compileSchema } from './dist/lib/json-schema.js';",
          "const validate = compileSchema({ type: 'object' });",
          "console.log(typeof validate === 'function' ? 'PASS' : 'FAIL');",
        ].join('\n'),
      ], { cwd: PLUGIN_SYSTEM_DIR, timeout: 10000 });
      expect(result.stdout.trim()).toBe('PASS');
    });

    it('validateAgainstSchema returns valid for conforming data', async () => {
      const result = await runCommand('node', [
        '--input-type=module',
        '-e',
        [
          "import { validateAgainstSchema } from './dist/lib/json-schema.js';",
          "const r = validateAgainstSchema(",
          "  { name: 'test' },",
          "  { type: 'object', properties: { name: { type: 'string' } } }",
          ");",
          "console.log(r.valid === true ? 'PASS' : 'FAIL');",
        ].join('\n'),
      ], { cwd: PLUGIN_SYSTEM_DIR, timeout: 10000 });
      expect(result.stdout.trim()).toBe('PASS');
    });

    it('validateAgainstSchema returns errors for non-conforming data', async () => {
      const result = await runCommand('node', [
        '--input-type=module',
        '-e',
        [
          "import { validateAgainstSchema } from './dist/lib/json-schema.js';",
          "const r = validateAgainstSchema(",
          "  { name: 42 },",
          "  { type: 'object', properties: { name: { type: 'string' } } }",
          ");",
          "console.log(r.valid === false && r.errors.length > 0 ? 'PASS' : 'FAIL');",
        ].join('\n'),
      ], { cwd: PLUGIN_SYSTEM_DIR, timeout: 10000 });
      expect(result.stdout.trim()).toBe('PASS');
    });

    it('compileSchema accepts 2020-12 $schema without error', async () => {
      const result = await runCommand('node', [
        '--input-type=module',
        '-e',
        [
          "import { compileSchema } from './dist/lib/json-schema.js';",
          "try {",
          "  const validate = compileSchema({",
          "    $schema: 'https://json-schema.org/draft/2020-12/schema',",
          "    type: 'object',",
          "    properties: { port: { type: 'number' } }",
          "  });",
          "  console.log(typeof validate === 'function' ? 'PASS' : 'FAIL');",
          "} catch (e) {",
          "  console.log('FAIL: ' + e.message);",
          "}",
        ].join('\n'),
      ], { cwd: PLUGIN_SYSTEM_DIR, timeout: 10000 });
      expect(result.stdout.trim()).toBe('PASS');
    });
  });
});
