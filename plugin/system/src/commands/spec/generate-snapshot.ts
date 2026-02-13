/**
 * Generate specs/SNAPSHOT.md from all active spec files.
 *
 * Usage:
 *   sdd-system spec snapshot --specs-dir specs/
 */

import * as path from 'node:path';
import type { CommandResult } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { extractOverview } from '@/lib/frontmatter';
import { findSpecFiles, directoryExists } from '@/lib/spec-utils';
import { writeText } from '@/lib/fs';
import type { ActiveSpec } from '@/types/spec';

/**
 * Generate SNAPSHOT.md content.
 */
const generateSnapshotContent = async (specsDir: string): Promise<string> => {
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
  const byDomain: Readonly<Record<string, ReadonlyArray<ActiveSpec>>> = specs.reduce<Readonly<Record<string, ReadonlyArray<ActiveSpec>>>>(
    (acc, spec) => ({
      ...acc,
      [spec.domain]: [...(acc[spec.domain] ?? []), spec],
    }),
    {}
  );

  const today = new Date().toISOString().split('T')[0];
  const domains = [...Object.keys(byDomain)].sort();

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

export const generateSnapshot = async (args: readonly string[]): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);
  const specsDir = named['specs-dir'] ?? 'specs/';

  if (!(await directoryExists(specsDir))) {
    return {
      success: false,
      error: `Specs directory not found: ${specsDir}`,
    };
  }

  const snapshotContent = await generateSnapshotContent(specsDir);
  const snapshotPath = path.join(specsDir, 'SNAPSHOT.md');
  await writeText(snapshotPath, snapshotContent);

  return {
    success: true,
    message: `Generated ${snapshotPath}`,
    data: { path: snapshotPath },
  };
};
