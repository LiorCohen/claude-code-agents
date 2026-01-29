/**
 * Spec file utilities for finding and processing spec files.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { parseFrontmatter, type Frontmatter } from './frontmatter.js';

export const EXCLUDED_FILES = ['INDEX.md', 'SNAPSHOT.md', 'glossary.md'] as const;

export interface SpecFile {
  readonly path: string;
  readonly relativePath: string;
  readonly content: string;
  readonly frontmatter: Frontmatter | null;
}

/**
 * Check if a file should be excluded from spec processing.
 */
export const isExcludedFile = (filename: string): boolean =>
  (EXCLUDED_FILES as readonly string[]).includes(filename);

/**
 * Recursively find all markdown files in a directory.
 */
const walkDir = async (dir: string): Promise<readonly string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const results = await Promise.all(
    entries.map(async (entry): Promise<readonly string[]> => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return walkDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        return [fullPath];
      }
      return [];
    })
  );

  return results.flat();
};

/**
 * Find all spec files in a directory, excluding known non-spec files.
 */
export const findSpecFiles = async (specsDir: string): Promise<readonly SpecFile[]> => {
  const allFiles = await walkDir(specsDir);

  const specPromises = allFiles
    .filter((filePath) => !isExcludedFile(path.basename(filePath)))
    .map(async (filePath): Promise<SpecFile> => {
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        path: filePath,
        relativePath: path.relative(specsDir, filePath),
        content,
        frontmatter: parseFrontmatter(content),
      };
    });

  return Promise.all(specPromises);
};

/**
 * Check if a directory exists.
 */
export const directoryExists = async (dirPath: string): Promise<boolean> => {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
};
