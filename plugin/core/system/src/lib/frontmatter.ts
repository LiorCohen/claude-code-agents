/**
 * Frontmatter parsing utilities for spec files.
 */

export type Frontmatter = {
  readonly [key: string]: string | undefined;
};

export type FrontmatterResult =
  | { readonly found: true; readonly data: Frontmatter }
  | { readonly found: false };

export type ParsedSpec = {
  readonly frontmatter?: Frontmatter;
  readonly content: string;
};

/**
 * Extract YAML frontmatter from markdown content.
 */
export const parseFrontmatter = (content: string): FrontmatterResult => {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match?.[1]) return { found: false };

  const frontmatter: Readonly<Record<string, string>> = Object.fromEntries(
    match[1]
      .split('\n')
      .map((line) => {
        const colonIndex = line.indexOf(':');
        return colonIndex > 0
          ? [line.slice(0, colonIndex).trim(), line.slice(colonIndex + 1).trim()]
          : undefined;
      })
      .filter((entry): entry is [string, string] => entry !== undefined)
  );
  return { found: true, data: frontmatter };
};

/**
 * Parse spec file returning frontmatter and body content.
 */
export const parseSpec = (content: string): ParsedSpec => {
  const result = parseFrontmatter(content);
  const bodyContent = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');
  return result.found
    ? { frontmatter: result.data, content: bodyContent }
    : { content: bodyContent };
};

/**
 * Extract the overview section from spec content (after frontmatter).
 */
export const extractOverview = (content: string): string => {
  // Remove frontmatter
  const withoutFrontmatter = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');

  // Find overview section
  const match = withoutFrontmatter.match(/## Overview\s*\n([\s\S]*?)(?=\n##|$)/);
  return match?.[1]?.trim() ?? '';
};
