/**
 * Spec file utilities for finding and processing spec files.
 */

import { walkDir, readText, isDirectory } from './fs';
import { parseFrontmatter } from './frontmatter';
import type { Frontmatter } from './frontmatter';
import * as path from 'node:path';

export const EXCLUDED_FILES = ['INDEX.md', 'SNAPSHOT.md', 'glossary.md'] as const;

export type SpecFile = {
  readonly path: string;
  readonly relativePath: string;
  readonly content: string;
  readonly frontmatter?: Frontmatter;
};

/**
 * Check if a file should be excluded from spec processing.
 */
export const isExcludedFile = (filename: string): boolean =>
  (EXCLUDED_FILES as readonly string[]).includes(filename);

/**
 * Find all spec files in a directory, excluding known non-spec files.
 */
export const findSpecFiles = async (specsDir: string): Promise<readonly SpecFile[]> => {
  const allFiles = await walkDir(specsDir, (entry) => entry.name.endsWith('.md'));

  const specPromises = allFiles
    .filter((filePath) => !isExcludedFile(path.basename(filePath)))
    .map(async (filePath): Promise<SpecFile> => {
      const content = await readText(filePath);
      const fmResult = parseFrontmatter(content);
      return {
        path: filePath,
        relativePath: path.relative(specsDir, filePath),
        content,
        ...(fmResult.found ? { frontmatter: fmResult.data } : {}),
      };
    });

  return Promise.all(specPromises);
};

/**
 * Check if a directory exists.
 */
export const directoryExists = async (dirPath: string): Promise<boolean> => {
  return isDirectory(dirPath);
};
