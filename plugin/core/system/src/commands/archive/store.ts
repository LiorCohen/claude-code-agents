/**
 * Archive store action.
 *
 * Copies a file or directory to sdd/archive/<type>/ with a datetime-prefix
 * and lowercased filename.
 */

import * as path from 'node:path';
import type { CommandResult } from '@/lib/args';
import { exists, isDirectory, copyFile, ensureDir, walkDir, basename, extname, joinPath, relativePath } from '@/lib/fs';
import { findProjectRoot } from '@/lib/config';
import { ARCHIVE_TYPE_DIRS, type ArchiveType } from './schema';

/**
 * Resolve the project root, using an explicit override or auto-detection.
 */
const resolveProjectRoot = async (rootOverride?: string): Promise<string | undefined> => {
  if (rootOverride) {
    const resolved = path.resolve(rootOverride);
    if (await exists(resolved)) {
      return resolved;
    }
    return undefined;
  }
  const result = await findProjectRoot();
  return result.found ? result.path : undefined;
};

/**
 * Generate a UTC datetime prefix in yyyymmdd-HHmm format.
 */
const datetimePrefix = (now: Date = new Date()): string => {
  const yyyy = now.getUTCFullYear().toString();
  const mm = (now.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = now.getUTCDate().toString().padStart(2, '0');
  const hh = now.getUTCHours().toString().padStart(2, '0');
  const min = now.getUTCMinutes().toString().padStart(2, '0');
  return `${yyyy}${mm}${dd}-${hh}${min}`;
};

/**
 * Store a file or directory in the archive.
 */
export const storeArchive = async (source: string, archiveType: ArchiveType, rootOverride?: string): Promise<CommandResult> => {
  // Resolve source to absolute path
  const sourcePath = path.resolve(source);

  // Validate source exists
  if (!(await exists(sourcePath))) {
    return {
      success: false,
      error: `Source path not found: ${source}`,
    };
  }

  // Determine project root
  const projectRoot = await resolveProjectRoot(rootOverride);
  if (!projectRoot) {
    return {
      success: false,
      error: 'Project root not found (no package.json or sdd/ directory)',
    };
  }
  const typeDir = ARCHIVE_TYPE_DIRS[archiveType];
  // Use sdd/ directory, fall back to .sdd/ for legacy projects
  const sddDir = joinPath(projectRoot, 'sdd');
  const legacySddDir = joinPath(projectRoot, '.sdd');
  const archiveRoot = (await exists(sddDir)) ? sddDir : legacySddDir;
  const archiveBase = joinPath(archiveRoot, 'archive', typeDir);
  const prefix = datetimePrefix();

  const sourceIsDir = await isDirectory(sourcePath);

  if (sourceIsDir) {
    return storeDirectory(sourcePath, archiveBase, prefix, source, archiveType, projectRoot);
  }

  return storeFile(sourcePath, archiveBase, prefix, source, archiveType, projectRoot);
};

const storeFile = async (
  sourcePath: string,
  archiveBase: string,
  prefix: string,
  originalSource: string,
  archiveType: ArchiveType,
  projectRoot: string,
): Promise<CommandResult> => {
  const ext = extname(sourcePath);
  const name = basename(sourcePath, ext).toLowerCase();
  const archiveFilename = `${prefix}-${name}${ext.toLowerCase()}`;
  const destPath = joinPath(archiveBase, archiveFilename);

  await ensureDir(archiveBase);
  await copyFile(sourcePath, destPath);

  const archivedPath = relativePath(projectRoot, destPath);

  return {
    success: true,
    message: `Archived to ${archivedPath}`,
    data: {
      archived_path: archivedPath,
      original_path: originalSource,
      type: archiveType,
      is_directory: false,
    },
  };
};

const storeDirectory = async (
  sourcePath: string,
  archiveBase: string,
  prefix: string,
  originalSource: string,
  archiveType: ArchiveType,
  projectRoot: string,
): Promise<CommandResult> => {
  const dirName = basename(sourcePath).toLowerCase();
  const archiveDirName = `${prefix}-${dirName}`;
  const destDir = joinPath(archiveBase, archiveDirName);

  await ensureDir(destDir);

  // Walk source directory and copy all files preserving structure
  const files = await walkDir(sourcePath);
  for (const file of files) {
    const relToSource = relativePath(sourcePath, file);
    const destFile = joinPath(destDir, relToSource);
    await copyFile(file, destFile);
  }

  const archivedPath = relativePath(projectRoot, destDir) + '/';

  return {
    success: true,
    message: `Archived ${files.length} files to ${archivedPath}`,
    data: {
      archived_path: archivedPath,
      original_path: originalSource,
      type: archiveType,
      is_directory: true,
      file_count: files.length,
    },
  };
};
