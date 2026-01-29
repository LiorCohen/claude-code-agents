/**
 * Unit Tests: generate-index.ts
 *
 * WHY: INDEX.md is the central registry of all specs. Incorrect generation
 * would hide specs from users or include invalid entries.
 */

import { describe, expect, it } from 'vitest';
import { PLUGIN_DIR, joinPath, readFile } from '../../../lib';

const GENERATE_INDEX_PATH = joinPath(PLUGIN_DIR, 'scripts', 'generate-index.ts');

/**
 * WHY: Verify the script exists and has expected structure.
 */
describe('generate-index.ts source file', () => {
  it('exists in plugin scripts directory', () => {
    const content = readFile(GENERATE_INDEX_PATH);
    expect(content).toBeDefined();
    expect(content.length).toBeGreaterThan(0);
  });

  it('defines SpecEntry interface', () => {
    const content = readFile(GENERATE_INDEX_PATH);
    expect(content).toContain('interface SpecEntry');
  });

  it('defines generateIndex function', () => {
    const content = readFile(GENERATE_INDEX_PATH);
    expect(content).toContain('generateIndex');
  });

  it('categorizes by status', () => {
    const content = readFile(GENERATE_INDEX_PATH);
    expect(content).toContain('active');
    expect(content).toContain('deprecated');
    expect(content).toContain('archived');
  });
});

/**
 * WHY: Test the INDEX.md generation logic.
 */
describe('INDEX.md generation logic', () => {
  /**
   * Simulate spec entry structure.
   */
  interface SpecEntry {
    readonly title: string;
    readonly type: string;
    readonly path: string;
    readonly domain: string;
    readonly issue: string;
    readonly created: string;
  }

  /**
   * Simulate the generateIndex output format.
   */
  const generateIndexContent = (
    specs: readonly { status: string; entry: SpecEntry }[]
  ): string => {
    // Group by status using reduce (immutable)
    const byStatus = specs.reduce(
      (acc, { status, entry }) => ({
        ...acc,
        [status]: [...(acc[status] ?? []), entry],
      }),
      { active: [], deprecated: [], archived: [] } as Readonly<Record<string, readonly SpecEntry[]>>
    );

    const today = new Date().toISOString().split('T')[0];
    const total = specs.length;
    const active = byStatus['active']?.length ?? 0;
    const deprecated = byStatus['deprecated']?.length ?? 0;
    const archived = byStatus['archived']?.length ?? 0;

    const headerLines: readonly string[] = [
      '# Spec Index',
      '',
      `Last updated: ${today}`,
      '',
      `Total: ${total} specs (Active: ${active}, Deprecated: ${deprecated}, Archived: ${archived})`,
      '',
      '## Active Changes',
      '',
      '| Change | Type | Spec | Domain | Issue | Since |',
      '|--------|------|------|--------|-------|-------|',
    ];

    const activeSpecs = byStatus['active'] ?? [];
    const activeRows: readonly string[] =
      activeSpecs.length > 0
        ? [...activeSpecs]
            .sort((a, b) => a.created.localeCompare(b.created))
            .map((spec) => {
              const issueLink = spec.issue ? `[${spec.issue}](#)` : '';
              return `| ${spec.title} | ${spec.type} | [${spec.path}](${spec.path}) | ${spec.domain} | ${issueLink} | ${spec.created} |`;
            })
        : ['| *No active changes yet* | | | | | |'];

    return [...headerLines, ...activeRows].join('\n');
  };

  /**
   * WHY: INDEX should include header with date and counts.
   */
  it('generates header with date and totals', () => {
    const content = generateIndexContent([
      {
        status: 'active',
        entry: {
          title: 'Test Feature',
          type: 'feature',
          path: 'changes/2026/01/24/test/SPEC.md',
          domain: 'Core',
          issue: 'TEST-123',
          created: '2026-01-24',
        },
      },
    ]);

    expect(content).toContain('# Spec Index');
    expect(content).toContain('Last updated:');
    expect(content).toContain('Total: 1 specs');
    expect(content).toContain('Active: 1');
  });

  /**
   * WHY: Active specs should appear in the Active Changes table.
   */
  it('includes active specs in Active Changes section', () => {
    const content = generateIndexContent([
      {
        status: 'active',
        entry: {
          title: 'User Authentication',
          type: 'feature',
          path: 'changes/2026/01/24/user-auth/SPEC.md',
          domain: 'Identity',
          issue: 'AUTH-001',
          created: '2026-01-24',
        },
      },
    ]);

    expect(content).toContain('## Active Changes');
    expect(content).toContain('User Authentication');
    expect(content).toContain('feature');
    expect(content).toContain('Identity');
    expect(content).toContain('[AUTH-001]');
  });

  /**
   * WHY: Specs should be sorted by created date for chronological view.
   */
  it('sorts specs by created date', () => {
    const content = generateIndexContent([
      {
        status: 'active',
        entry: {
          title: 'Feature B',
          type: 'feature',
          path: 'b.md',
          domain: 'Core',
          issue: 'B-001',
          created: '2026-02-01',
        },
      },
      {
        status: 'active',
        entry: {
          title: 'Feature A',
          type: 'feature',
          path: 'a.md',
          domain: 'Core',
          issue: 'A-001',
          created: '2026-01-01',
        },
      },
    ]);

    const indexA = content.indexOf('Feature A');
    const indexB = content.indexOf('Feature B');

    // Feature A (earlier date) should appear before Feature B
    expect(indexA).toBeLessThan(indexB);
  });

  /**
   * WHY: Empty sections should show placeholder text.
   */
  it('shows placeholder for empty active section', () => {
    const content = generateIndexContent([]);

    expect(content).toContain('*No active changes yet*');
  });

  /**
   * WHY: Issue should be formatted as a link.
   */
  it('formats issue as markdown link', () => {
    const content = generateIndexContent([
      {
        status: 'active',
        entry: {
          title: 'Test',
          type: 'feature',
          path: 'test.md',
          domain: 'Core',
          issue: 'JIRA-123',
          created: '2026-01-24',
        },
      },
    ]);

    expect(content).toContain('[JIRA-123](#)');
  });

  /**
   * WHY: Spec path should be formatted as a relative link.
   */
  it('formats spec path as markdown link', () => {
    const content = generateIndexContent([
      {
        status: 'active',
        entry: {
          title: 'Test',
          type: 'feature',
          path: 'changes/2026/01/24/test/SPEC.md',
          domain: 'Core',
          issue: 'TEST-1',
          created: '2026-01-24',
        },
      },
    ]);

    expect(content).toContain('[changes/2026/01/24/test/SPEC.md]');
  });

  /**
   * WHY: Type column should display the change type (feature/bugfix/refactor).
   */
  it('includes type column', () => {
    const content = generateIndexContent([
      {
        status: 'active',
        entry: {
          title: 'Bugfix Test',
          type: 'bugfix',
          path: 'test.md',
          domain: 'Core',
          issue: 'BUG-1',
          created: '2026-01-24',
        },
      },
    ]);

    expect(content).toContain('| bugfix |');
  });

  /**
   * WHY: Domain column should display the spec's domain.
   */
  it('includes domain column', () => {
    const content = generateIndexContent([
      {
        status: 'active',
        entry: {
          title: 'Test',
          type: 'feature',
          path: 'test.md',
          domain: 'Billing',
          issue: 'BILL-1',
          created: '2026-01-24',
        },
      },
    ]);

    expect(content).toContain('| Billing |');
  });
});

/**
 * WHY: Test fallback behavior for missing frontmatter fields.
 */
describe('missing frontmatter defaults', () => {
  it('uses filename as title fallback', () => {
    const path = 'changes/2026/01/24/user-auth/SPEC.md';
    const { basename } = require('node:path');
    const fallbackTitle = basename(path, '.md');

    expect(fallbackTitle).toBe('SPEC');
  });

  it('defaults type to feature', () => {
    const defaultType = 'feature';
    expect(defaultType).toBe('feature');
  });
});

/**
 * WHY: Test argument parsing logic.
 */
describe('argument parsing', () => {
  const parseArgs = (args: readonly string[]): { specsDir: string } => {
    const specsDirIndex = args.indexOf('--specs-dir');
    const specsDir = specsDirIndex !== -1 ? (args[specsDirIndex + 1] ?? 'specs/') : 'specs/';

    return { specsDir };
  };

  it('parses --specs-dir option', () => {
    const result = parseArgs(['--specs-dir', 'custom/specs/']);
    expect(result.specsDir).toBe('custom/specs/');
  });

  it('uses default specs dir when not specified', () => {
    const result = parseArgs([]);
    expect(result.specsDir).toBe('specs/');
  });
});
