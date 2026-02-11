/**
 * Generate changes/INDEX.md from all change spec files.
 *
 * Usage:
 *   sdd-system spec index --changes-dir changes/
 */

import * as path from 'node:path';
import type { CommandResult } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { findSpecFiles, directoryExists } from '@/lib/spec-utils';
import { writeText } from '@/lib/fs';
import type { SpecEntry } from '@/types/spec';

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
const generateIndexContent = async (specsDir: string): Promise<string> => {
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
  const byStatus = entries.reduce<Readonly<Record<string, ReadonlyArray<SpecEntry>>>>(
    (acc, entry) => ({
      ...acc,
      [entry.status]: [...(acc[entry.status] ?? []), entry],
    }),
    {}
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
          ...[...deprecatedSpecs]
            .sort((a, b) => a.created.localeCompare(b.created))
            .map(formatTableRow),
        ]
      : ['*None*'];

  // Generate archived section
  const archivedSection =
    archivedSpecs.length > 0
      ? [
          '| Change | Type | Spec | Domain | Issue | Archived |',
          '|--------|------|------|--------|-------|----------|',
          ...[...archivedSpecs]
            .sort((a, b) => a.created.localeCompare(b.created))
            .map(formatTableRow),
        ]
      : ['*None*'];

  // Combine all sections
  const lines: readonly string[] = [
    '# Change Index',
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

export const generateIndex = async (args: readonly string[]): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);
  // Support both --changes-dir (new) and --specs-dir (legacy) for backwards compatibility
  const changesDir = named['changes-dir'] ?? named['specs-dir'] ?? 'changes/';

  if (!(await directoryExists(changesDir))) {
    return {
      success: false,
      error: `Changes directory not found: ${changesDir}`,
    };
  }

  const indexContent = await generateIndexContent(changesDir);
  const indexPath = path.join(changesDir, 'INDEX.md');
  await writeText(indexPath, indexContent);

  return {
    success: true,
    message: `Generated ${indexPath}`,
    data: { path: indexPath },
  };
};
