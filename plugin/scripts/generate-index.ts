#!/usr/bin/env npx ts-node --esm
/**
 * Generate specs/INDEX.md from all spec files.
 *
 * Usage: npx ts-node --esm generate-index.ts --specs-dir specs/
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { findSpecFiles, directoryExists } from './lib/spec-utils.js';

interface SpecEntry {
  readonly title: string;
  readonly type: string;
  readonly path: string;
  readonly domain: string;
  readonly issue: string;
  readonly created: string;
  readonly status: string;
}

/**
 * Format a spec entry as a table row.
 */
const formatTableRow = (spec: SpecEntry): string => {
  const issueLink = spec.issue ? `[${spec.issue}](#)` : '';
  return `| ${spec.title} | ${spec.type} | [${spec.path}](${spec.path}) | ${spec.domain} | ${issueLink} | ${spec.created} |`;
};

/**
 * Generate INDEX.md content.
 */
const generateIndex = async (specsDir: string): Promise<string> => {
  const specs = await findSpecFiles(specsDir);

  // Transform specs to entries with status
  const entries: readonly SpecEntry[] = specs.map((spec) => {
    const fm = spec.frontmatter ?? {};
    return {
      title: fm['title'] ?? path.basename(spec.path, '.md'),
      type: fm['type'] ?? 'feature',
      path: spec.relativePath,
      domain: fm['domain'] ?? 'Unknown',
      issue: fm['issue'] ?? '',
      created: fm['created'] ?? '',
      status: fm['status'] ?? 'active',
    };
  });

  // Group by status using reduce
  const byStatus = entries.reduce(
    (acc, entry) => ({
      ...acc,
      [entry.status]: [...(acc[entry.status] ?? []), entry],
    }),
    {} as Readonly<Record<string, readonly SpecEntry[]>>
  );

  const activeSpecs = byStatus['active'] ?? [];
  const deprecatedSpecs = byStatus['deprecated'] ?? [];
  const archivedSpecs = byStatus['archived'] ?? [];

  // Count totals
  const total = specs.length;
  const active = activeSpecs.length;
  const deprecated = deprecatedSpecs.length;
  const archived = archivedSpecs.length;

  const today = new Date().toISOString().split('T')[0];

  // Generate active section rows
  const activeRows =
    activeSpecs.length > 0
      ? [...activeSpecs].sort((a, b) => a.created.localeCompare(b.created)).map(formatTableRow)
      : ['| *No active changes yet* | | | | | |'];

  // Generate deprecated section
  const deprecatedSection =
    deprecatedSpecs.length > 0
      ? [
          '| Change | Type | Spec | Domain | Issue | Deprecated |',
          '|--------|------|------|--------|-------|------------|',
          ...[...deprecatedSpecs].sort((a, b) => a.created.localeCompare(b.created)).map(formatTableRow),
        ]
      : ['*None*'];

  // Generate archived section
  const archivedSection =
    archivedSpecs.length > 0
      ? [
          '| Change | Type | Spec | Domain | Issue | Archived |',
          '|--------|------|------|--------|-------|----------|',
          ...[...archivedSpecs].sort((a, b) => a.created.localeCompare(b.created)).map(formatTableRow),
        ]
      : ['*None*'];

  // Combine all sections
  const lines: readonly string[] = [
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
    ...activeRows,
    '',
    '## Deprecated',
    '',
    ...deprecatedSection,
    '',
    '## Archived',
    '',
    ...archivedSection,
  ];

  return lines.join('\n') + '\n';
};

/**
 * Parse command line arguments.
 */
const parseArgs = (args: readonly string[]): { specsDir: string } => {
  const specsDirIndex = args.indexOf('--specs-dir');
  const specsDir = specsDirIndex !== -1 ? (args[specsDirIndex + 1] ?? 'specs/') : 'specs/';

  return { specsDir };
};

const main = async (): Promise<number> => {
  const args = parseArgs(process.argv.slice(2));

  if (!(await directoryExists(args.specsDir))) {
    console.error(`Error: Specs directory not found: ${args.specsDir}`);
    return 1;
  }

  const indexContent = await generateIndex(args.specsDir);
  const indexPath = path.join(args.specsDir, 'INDEX.md');
  await fs.writeFile(indexPath, indexContent);

  console.log(`✓ Generated ${indexPath}`);
  return 0;
};

main()
  .then(process.exit)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
