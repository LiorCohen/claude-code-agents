/**
 * File system utilities for the CLI.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Check if a file or directory exists.
 */
export const exists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if a path is a directory.
 */
export const isDirectory = async (dirPath: string): Promise<boolean> => {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
};

/**
 * Check if a path is a file.
 */
export const isFile = async (filePath: string): Promise<boolean> => {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
};

/**
 * Recursively find all files in a directory matching a filter.
 */
export const walkDir = async (
  dir: string,
  filter?: (entry: { name: string; path: string }) => boolean
): Promise<readonly string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const results = await Promise.all(
    entries.map(async (entry): Promise<readonly string[]> => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return walkDir(fullPath, filter);
      } else if (entry.isFile()) {
        if (!filter || filter({ name: entry.name, path: fullPath })) {
          return [fullPath];
        }
      }
      return [];
    })
  );

  return results.flat();
};

/**
 * Read a file as text.
 */
export const readText = async (filePath: string): Promise<string> => {
  return fs.readFile(filePath, 'utf-8');
};

/**
 * Read a file as JSON.
 */
export const readJson = async <T>(filePath: string): Promise<T> => {
  const content = await readText(filePath);
  return JSON.parse(content) as T;
};

/**
 * Write text to a file, creating parent directories if needed.
 */
export const writeText = async (filePath: string, content: string): Promise<string> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
  return filePath;
};

/**
 * Write JSON to a file, creating parent directories if needed.
 */
export const writeJson = async (filePath: string, data: unknown): Promise<string> => {
  return writeText(filePath, JSON.stringify(data, null, 2) + '\n');
};

/**
 * Copy a file, creating parent directories if needed.
 */
export const copyFile = async (src: string, dest: string): Promise<string> => {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
  return dest;
};

/**
 * Ensure a directory exists.
 */
export const ensureDir = async (dirPath: string): Promise<string> => {
  await fs.mkdir(dirPath, { recursive: true });
  return dirPath;
};

/**
 * Get the relative path from one path to another.
 */
export const relativePath = (from: string, to: string): string => {
  return path.relative(from, to);
};

/**
 * Join path segments.
 */
export const joinPath = (...segments: readonly string[]): string => {
  return path.join(...segments);
};

/**
 * Get the directory name of a path.
 */
export const dirname = (filePath: string): string => {
  return path.dirname(filePath);
};

/**
 * Get the base name of a path.
 */
export const basename = (filePath: string, ext?: string): string => {
  return path.basename(filePath, ext);
};

/**
 * Get the extension of a path.
 */
export const extname = (filePath: string): string => {
  return path.extname(filePath);
};
