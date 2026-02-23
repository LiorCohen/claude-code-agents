/**
 * Agent frontmatter extraction command.
 *
 * Reads an agent .md file, parses YAML frontmatter, and returns
 * structured JSON metadata. Never returns the markdown body.
 *
 * Usage:
 *   sdd-system agent frontmatter --path <agent-path>
 */

import * as path from 'node:path';
import { readText, exists } from '@/lib/fs';
import type { CommandResult } from '@/lib/args';
import YAML from 'yaml';

/** Extract YAML frontmatter from markdown content. */
const extractFrontmatter = (content: string): Record<string, unknown> | undefined => {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match?.[1]) return undefined;
  return YAML.parse(match[1]) as Record<string, unknown>;
};

export const agentFrontmatter = async (agentPath: string): Promise<CommandResult> => {
  const resolvedPath = path.resolve(agentPath);

  if (!(await exists(resolvedPath))) {
    return { success: false, error: `Agent file not found: ${resolvedPath}` };
  }

  const content = await readText(resolvedPath);
  const frontmatter = extractFrontmatter(content);

  if (!frontmatter) {
    return { success: false, error: `No YAML frontmatter found in ${resolvedPath}` };
  }

  // Extract only the structured metadata fields
  const data: Record<string, unknown> = {};

  if (frontmatter['name']) data['name'] = frontmatter['name'];
  if (frontmatter['model']) data['model'] = frontmatter['model'];
  if (frontmatter['tools']) data['tools'] = frontmatter['tools'];
  if (frontmatter['skills']) data['skills'] = frontmatter['skills'];
  if (frontmatter['description']) data['description'] = frontmatter['description'];

  return {
    success: true,
    data,
  };
};
