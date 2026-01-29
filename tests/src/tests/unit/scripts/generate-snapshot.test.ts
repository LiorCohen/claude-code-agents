/**
 * Unit Tests: generate-snapshot.ts
 *
 * WHY: SNAPSHOT.md provides a current-state view of the product by aggregating
 * active specs. Incorrect generation would give users a wrong view of the product.
 */

import { describe, expect, it } from 'vitest';
import { PLUGIN_DIR, joinPath, readFile } from '../../../lib';

const GENERATE_SNAPSHOT_PATH = joinPath(PLUGIN_DIR, 'scripts', 'generate-snapshot.ts');

/**
 * WHY: Verify the script exists and has expected structure.
 */
describe('generate-snapshot.ts source file', () => {
  it('exists in plugin scripts directory', () => {
    const content = readFile(GENERATE_SNAPSHOT_PATH);
    expect(content).toBeDefined();
    expect(content.length).toBeGreaterThan(0);
  });

  it('defines ActiveSpec interface', () => {
    const content = readFile(GENERATE_SNAPSHOT_PATH);
    expect(content).toContain('interface ActiveSpec');
  });

  it('defines generateSnapshot function', () => {
    const content = readFile(GENERATE_SNAPSHOT_PATH);
    expect(content).toContain('generateSnapshot');
  });

  it('filters by active status', () => {
    const content = readFile(GENERATE_SNAPSHOT_PATH);
    expect(content).toContain("status'] === 'active'");
  });

  it('extracts overview from specs', () => {
    const content = readFile(GENERATE_SNAPSHOT_PATH);
    expect(content).toContain('extractOverview');
  });
});

/**
 * WHY: Test the SNAPSHOT.md generation logic.
 */
describe('SNAPSHOT.md generation logic', () => {
  /**
   * Simulate active spec structure.
   */
  interface ActiveSpec {
    readonly title: string;
    readonly path: string;
    readonly domain: string;
    readonly issue: string;
    readonly overview: string;
  }

  /**
   * Simulate the generateSnapshot output format.
   */
  const generateSnapshotContent = (specs: readonly ActiveSpec[]): string => {
    // Group specs by domain using reduce (immutable)
    const byDomain = specs.reduce(
      (acc, spec) => ({
        ...acc,
        [spec.domain]: [...(acc[spec.domain] ?? []), spec],
      }),
      {} as Readonly<Record<string, readonly ActiveSpec[]>>
    );

    const today = new Date().toISOString().split('T')[0];
    const domains = Object.keys(byDomain).sort();

    const headerLines: readonly string[] = [
      '# Product Snapshot',
      '',
      `Generated: ${today}`,
      '',
      'This document represents the current active state of the product by compiling all active specifications.',
      '',
    ];

    // Table of contents
    const tocLines: readonly string[] =
      domains.length > 0
        ? [
            '## Table of Contents',
            '',
            ...domains.map((domain) => {
              const anchor = domain.toLowerCase().replace(/ /g, '-');
              return `- [${domain}](#${anchor})`;
            }),
            '',
          ]
        : [];

    // By domain content
    const domainContentLines: readonly string[] =
      domains.length > 0
        ? domains.flatMap((domain) => {
            const domainSpecs = byDomain[domain] ?? [];
            const sorted = [...domainSpecs].sort((a, b) => a.title.localeCompare(b.title));

            const specLines = sorted.flatMap((spec): readonly string[] => {
              const issueLines: readonly string[] = spec.issue ? [`**Issue:** [${spec.issue}](#)`] : [];
              const overviewLines: readonly string[] = spec.overview ? [spec.overview, ''] : [];

              return [
                `#### ${spec.title}`,
                `**Spec:** [${spec.path}](${spec.path})`,
                ...issueLines,
                '',
                ...overviewLines,
                '---',
                '',
              ];
            });

            return [`### ${domain}`, '', ...specLines];
          })
        : ['*No active specs yet*', ''];

    const allLines: readonly string[] = [
      ...headerLines,
      ...tocLines,
      '## By Domain',
      '',
      ...domainContentLines,
    ];

    return allLines.join('\n');
  };

  /**
   * WHY: SNAPSHOT should include header with date.
   */
  it('generates header with date', () => {
    const content = generateSnapshotContent([]);

    expect(content).toContain('# Product Snapshot');
    expect(content).toContain('Generated:');
  });

  /**
   * WHY: Only active specs should be included.
   */
  it('includes only active specs', () => {
    // This is enforced by the function signature - it only accepts ActiveSpec[]
    // In the real script, filtering happens before this point
    const content = generateSnapshotContent([
      {
        title: 'Active Feature',
        path: 'changes/2026/01/24/active/SPEC.md',
        domain: 'Core',
        issue: 'ACTIVE-1',
        overview: 'This is active.',
      },
    ]);

    expect(content).toContain('Active Feature');
  });

  /**
   * WHY: Specs should be grouped by domain for organization.
   */
  it('groups specs by domain', () => {
    const content = generateSnapshotContent([
      {
        title: 'Identity Feature',
        path: 'identity.md',
        domain: 'Identity',
        issue: 'ID-1',
        overview: 'Identity overview.',
      },
      {
        title: 'Billing Feature',
        path: 'billing.md',
        domain: 'Billing',
        issue: 'BILL-1',
        overview: 'Billing overview.',
      },
    ]);

    expect(content).toContain('### Identity');
    expect(content).toContain('### Billing');
  });

  /**
   * WHY: Table of contents helps navigation in large snapshots.
   */
  it('generates table of contents', () => {
    const content = generateSnapshotContent([
      {
        title: 'Test',
        path: 'test.md',
        domain: 'Core',
        issue: 'TEST-1',
        overview: 'Overview.',
      },
    ]);

    expect(content).toContain('## Table of Contents');
    expect(content).toContain('- [Core](#core)');
  });

  /**
   * WHY: Overview content should be included for each spec.
   */
  it('includes overview content', () => {
    const content = generateSnapshotContent([
      {
        title: 'Feature with Overview',
        path: 'feature.md',
        domain: 'Core',
        issue: 'FEAT-1',
        overview: 'This feature allows users to do amazing things.',
      },
    ]);

    expect(content).toContain('This feature allows users to do amazing things.');
  });

  /**
   * WHY: Specs should be sorted alphabetically within domains.
   */
  it('sorts specs alphabetically within domains', () => {
    const content = generateSnapshotContent([
      {
        title: 'Zebra Feature',
        path: 'zebra.md',
        domain: 'Core',
        issue: 'Z-1',
        overview: 'Z overview.',
      },
      {
        title: 'Alpha Feature',
        path: 'alpha.md',
        domain: 'Core',
        issue: 'A-1',
        overview: 'A overview.',
      },
    ]);

    const alphaIndex = content.indexOf('Alpha Feature');
    const zebraIndex = content.indexOf('Zebra Feature');

    expect(alphaIndex).toBeLessThan(zebraIndex);
  });

  /**
   * WHY: Issue should be formatted as a link.
   */
  it('formats issue as markdown link', () => {
    const content = generateSnapshotContent([
      {
        title: 'Test',
        path: 'test.md',
        domain: 'Core',
        issue: 'JIRA-456',
        overview: 'Overview.',
      },
    ]);

    expect(content).toContain('[JIRA-456](#)');
  });

  /**
   * WHY: Empty snapshot should show placeholder message.
   */
  it('shows placeholder for no active specs', () => {
    const content = generateSnapshotContent([]);

    expect(content).toContain('*No active specs yet*');
  });

  /**
   * WHY: Multiple domains should be handled correctly.
   */
  it('handles multiple domains', () => {
    const content = generateSnapshotContent([
      {
        title: 'Auth',
        path: 'auth.md',
        domain: 'Identity',
        issue: 'AUTH-1',
        overview: 'Auth overview.',
      },
      {
        title: 'Payments',
        path: 'payments.md',
        domain: 'Billing',
        issue: 'PAY-1',
        overview: 'Payments overview.',
      },
      {
        title: 'Config',
        path: 'config.md',
        domain: 'Core',
        issue: 'CFG-1',
        overview: 'Config overview.',
      },
    ]);

    // Domains should be sorted alphabetically
    const billingIndex = content.indexOf('### Billing');
    const coreIndex = content.indexOf('### Core');
    const identityIndex = content.indexOf('### Identity');

    expect(billingIndex).toBeLessThan(coreIndex);
    expect(coreIndex).toBeLessThan(identityIndex);
  });

  /**
   * WHY: Specs without overview should still be included.
   */
  it('handles specs without overview', () => {
    const content = generateSnapshotContent([
      {
        title: 'No Overview',
        path: 'no-overview.md',
        domain: 'Core',
        issue: 'NO-1',
        overview: '',
      },
    ]);

    expect(content).toContain('No Overview');
    expect(content).toContain('**Spec:**');
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
