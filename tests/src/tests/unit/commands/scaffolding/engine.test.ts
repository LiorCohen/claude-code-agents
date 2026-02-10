/**
 * Scaffolding Engine Pure Function Tests
 *
 * WHY: The scaffolding engine's pure functions (variable substitution, condition
 * evaluation, file extension detection) are core to all declarative operations.
 * Testing them in isolation ensures correctness independent of filesystem state.
 *
 * Note: Functions are copied from engine.ts to test the algorithm in isolation,
 * following the project pattern (see deep-merge.test.ts).
 */

import { describe, expect, it } from 'vitest';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Copies of pure functions from engine.ts for isolated testing
// ---------------------------------------------------------------------------

const SUBSTITUTABLE_EXTENSIONS: ReadonlySet<string> = new Set([
  '.md', '.json', '.yaml', '.yml', '.ts', '.tsx', '.html', '.css', '.js', '.sql',
]);

const isSubstitutableFile = (filePath: string): boolean =>
  SUBSTITUTABLE_EXTENSIONS.has(path.extname(filePath).toLowerCase());

const substituteVariables = (
  content: string,
  variables: Readonly<Record<string, string>>
): string => {
  const now = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');

  const merged: Readonly<Record<string, string>> = {
    DATE: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    DATE_TIME: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
    ...variables,
  };

  return Object.entries(merged).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
    content
  );
};

interface EqualsCondition {
  readonly key: string;
  readonly equals: unknown;
}

interface NotEmptyCondition {
  readonly key: string;
  readonly not_empty: true;
}

type SingleCondition = EqualsCondition | NotEmptyCondition;
type WhenCondition = SingleCondition | readonly SingleCondition[];

const evaluateCondition = (
  when: WhenCondition | undefined,
  context: Readonly<Record<string, unknown>>
): boolean => {
  if (when === undefined) return true;

  const conditions: readonly SingleCondition[] = Array.isArray(when)
    ? (when as readonly SingleCondition[])
    : [when as SingleCondition];

  return conditions.every((cond) => {
    const value = context[cond.key];
    if (value === undefined) return false;

    if ('equals' in cond) {
      return value === cond.equals;
    }

    if ('not_empty' in cond) {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.length > 0;
      return false;
    }

    return false;
  });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('substituteVariables', () => {
  it('replaces placeholders with values', () => {
    const result = substituteVariables('Hello {{NAME}}!', { NAME: 'World' });
    expect(result).toBe('Hello World!');
  });

  it('replaces multiple occurrences of the same variable', () => {
    const result = substituteVariables('{{A}} and {{A}}', { A: 'x' });
    expect(result).toBe('x and x');
  });

  it('replaces multiple different variables', () => {
    const result = substituteVariables('{{A}}-{{B}}', { A: 'hello', B: 'world' });
    expect(result).toBe('hello-world');
  });

  it('leaves unknown placeholders untouched', () => {
    const result = substituteVariables('{{KNOWN}} {{UNKNOWN}}', { KNOWN: 'yes' });
    expect(result).toBe('yes {{UNKNOWN}}');
  });

  it('adds built-in DATE variable (YYYY-MM-DD)', () => {
    const result = substituteVariables('today: {{DATE}}', {});
    expect(result).toMatch(/^today: \d{4}-\d{2}-\d{2}$/);
  });

  it('adds built-in DATE_TIME variable', () => {
    const result = substituteVariables('now: {{DATE_TIME}}', {});
    expect(result).toMatch(/^now: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });

  it('user variables override built-ins', () => {
    const result = substituteVariables('{{DATE}}', { DATE: 'custom-date' });
    expect(result).toBe('custom-date');
  });

  it('handles empty content', () => {
    const result = substituteVariables('', { NAME: 'test' });
    expect(result).toBe('');
  });

  it('handles content with no placeholders', () => {
    const result = substituteVariables('no vars here', { NAME: 'test' });
    expect(result).toBe('no vars here');
  });
});

describe('evaluateCondition', () => {
  it('returns true when when is undefined', () => {
    expect(evaluateCondition(undefined, {})).toBe(true);
  });

  it('equals: returns true on boolean match', () => {
    expect(evaluateCondition({ key: 'flag', equals: true }, { flag: true })).toBe(true);
  });

  it('equals: returns false on boolean mismatch', () => {
    expect(evaluateCondition({ key: 'flag', equals: true }, { flag: false })).toBe(false);
  });

  it('equals: works with string values', () => {
    expect(evaluateCondition({ key: 'mode', equals: 'api' }, { mode: 'api' })).toBe(true);
    expect(evaluateCondition({ key: 'mode', equals: 'api' }, { mode: 'worker' })).toBe(false);
  });

  it('not_empty: true for non-empty array', () => {
    expect(evaluateCondition({ key: 'items', not_empty: true }, { items: ['a'] })).toBe(true);
  });

  it('not_empty: false for empty array', () => {
    expect(evaluateCondition({ key: 'items', not_empty: true }, { items: [] })).toBe(false);
  });

  it('not_empty: true for non-empty string', () => {
    expect(evaluateCondition({ key: 'name', not_empty: true }, { name: 'hello' })).toBe(true);
  });

  it('not_empty: false for empty string', () => {
    expect(evaluateCondition({ key: 'name', not_empty: true }, { name: '' })).toBe(false);
  });

  it('returns false when key is missing from context', () => {
    expect(evaluateCondition({ key: 'missing', equals: true }, {})).toBe(false);
  });

  it('array AND: all true → true', () => {
    expect(
      evaluateCondition(
        [
          { key: 'a', equals: true },
          { key: 'b', equals: true },
        ],
        { a: true, b: true }
      )
    ).toBe(true);
  });

  it('array AND: one false → false', () => {
    expect(
      evaluateCondition(
        [
          { key: 'a', equals: true },
          { key: 'b', equals: true },
        ],
        { a: true, b: false }
      )
    ).toBe(false);
  });

  it('array AND: missing key in one condition → false', () => {
    expect(
      evaluateCondition(
        [
          { key: 'a', equals: true },
          { key: 'missing', equals: true },
        ],
        { a: true }
      )
    ).toBe(false);
  });
});

describe('isSubstitutableFile', () => {
  it('returns true for .ts files', () => {
    expect(isSubstitutableFile('index.ts')).toBe(true);
  });

  it('returns true for .tsx files', () => {
    expect(isSubstitutableFile('App.tsx')).toBe(true);
  });

  it('returns true for .json files', () => {
    expect(isSubstitutableFile('package.json')).toBe(true);
  });

  it('returns true for .sql files', () => {
    expect(isSubstitutableFile('001_init.sql')).toBe(true);
  });

  it('returns true for .md files', () => {
    expect(isSubstitutableFile('README.md')).toBe(true);
  });

  it('returns true for .yaml files', () => {
    expect(isSubstitutableFile('config.yaml')).toBe(true);
  });

  it('returns true for .yml files', () => {
    expect(isSubstitutableFile('ci.yml')).toBe(true);
  });

  it('returns true for .html files', () => {
    expect(isSubstitutableFile('index.html')).toBe(true);
  });

  it('returns true for .css files', () => {
    expect(isSubstitutableFile('styles.css')).toBe(true);
  });

  it('returns true for .js files', () => {
    expect(isSubstitutableFile('script.js')).toBe(true);
  });

  it('returns false for .png files', () => {
    expect(isSubstitutableFile('logo.png')).toBe(false);
  });

  it('returns false for .woff2 files', () => {
    expect(isSubstitutableFile('font.woff2')).toBe(false);
  });

  it('returns false for extensionless files', () => {
    expect(isSubstitutableFile('Makefile')).toBe(false);
  });

  it('returns false for .exe files', () => {
    expect(isSubstitutableFile('app.exe')).toBe(false);
  });
});
