#!/usr/bin/env npx ts-node --esm
/**
 * Generate specs/SNAPSHOT.md from all active spec files.
 *
 * Usage: npx ts-node --esm generate-snapshot.ts --specs-dir specs/
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { extractOverview } from './lib/frontmatter.js';
import { findSpecFiles, directoryExists } from './lib/spec-utils.js';

interface ActiveSpec {
  readonly title: string;
  readonly path: string;
  readonly domain: string;
  readonly issue: string;
  readonly overview: string;
}

/**
 * Generate SNAPSHOT.md content.
 */
const generateSnapshot = async (specsDir: string): Promise<string> => {
  const allSpecs = await findSpecFiles(specsDir);

  // Filter to active specs only and transform
  const specs: readonly ActiveSpec[] = allSpecs
    .filter((spec) => spec.frontmatter?.['status'] === 'active')
    .map((spec) => {
      const fm = spec.frontmatter ?? {};
      return {
        title: fm['title'] ?? path.basename(spec.path, '.md'),
        path: spec.relativePath,
        domain: fm['domain'] ?? 'Unknown',
        issue: fm['issue'] ?? '',
        overview: extractOverview(spec.content),
      };
    });

  // Group by domain using reduce
  const byDomain: Readonly<Record<string, readonly ActiveSpec[]>> = specs.reduce(
    (acc, spec) => ({
      ...acc,
      [spec.domain]: [...(acc[spec.domain] ?? []), spec],
    }),
    {} as Record<string, readonly ActiveSpec[]>
  );

  const today = new Date().toISOString().split('T')[0];
  const domains = Object.keys(byDomain).sort();

  // Generate markdown using array methods
  const header: readonly string[] = [
    '# Product Snapshot',
    '',
    `Generated: ${today}`,
    '',
    'This document represents the current active state of the product by compiling all active specifications.',
    '',
  ];

  // Table of contents
  const toc: readonly string[] =
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
  const domainContent: readonly string[] =
    domains.length > 0
      ? [
          '## By Domain',
          '',
          ...domains.flatMap((domain) => {
            const domainSpecs = byDomain[domain] ?? [];
            const sorted = [...domainSpecs].sort((a, b) => a.title.localeCompare(b.title));

            return [
              `### ${domain}`,
              '',
              ...sorted.flatMap((spec) => [
                `#### ${spec.title}`,
                `**Spec:** [${spec.path}](${spec.path})`,
                ...(spec.issue ? [`**Issue:** [${spec.issue}](#)`] : []),
                '',
                ...(spec.overview ? [spec.overview, ''] : []),
                '---',
                '',
              ]),
            ];
          }),
        ]
      : ['## By Domain', '', '*No active specs yet*', ''];

  return [...header, ...toc, ...domainContent].join('\n');
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

  const snapshotContent = await generateSnapshot(args.specsDir);
  const snapshotPath = path.join(args.specsDir, 'SNAPSHOT.md');
  await fs.writeFile(snapshotPath, snapshotContent);

  console.log(`✓ Generated ${snapshotPath}`);
  return 0;
};

main()
  .then(process.exit)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
