/**
 * Generic scaffolding engine.
 *
 * Accepts a declarative scaffold spec and executes file operations:
 * template copying, variable substitution, directory creation, file writing,
 * and package.json script merging.
 */

import * as path from 'node:path';
import { exists, readText, writeText, ensureDir, walkDir, copyFile, readJson, writeJson } from '@/lib/fs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Condition that checks a context value with `equals`. */
export interface EqualsCondition {
  readonly key: string;
  readonly equals: unknown;
}

/** Condition that checks a context value is non-empty. */
export interface NotEmptyCondition {
  readonly key: string;
  readonly not_empty: true;
}

/** A single condition. */
export type SingleCondition = EqualsCondition | NotEmptyCondition;

/** One or more conditions (array = AND). */
export type WhenCondition = SingleCondition | readonly SingleCondition[];

/** Base fields shared by operations that create files. */
interface FileOperationBase {
  readonly when?: WhenCondition;
  readonly if_exists?: 'skip' | 'overwrite';
}

export interface TemplateDirOp extends FileOperationBase {
  readonly type: 'template_dir';
  readonly source: string;
  readonly dest: string;
}

export interface TemplateFileOp extends FileOperationBase {
  readonly type: 'template_file';
  readonly source: string;
  readonly dest: string;
}

export interface MkdirOp {
  readonly type: 'mkdir';
  readonly path: string;
  readonly gitkeep?: boolean;
  readonly when?: WhenCondition;
}

export interface WriteFileOp extends FileOperationBase {
  readonly type: 'write_file';
  readonly path: string;
  readonly content: string;
}

export interface PackageJsonScriptsOp {
  readonly type: 'package_json_scripts';
  readonly scripts: Readonly<Record<string, string>>;
  readonly when?: WhenCondition;
}

export type ScaffoldOperation =
  | TemplateDirOp
  | TemplateFileOp
  | MkdirOp
  | WriteFileOp
  | PackageJsonScriptsOp;

export interface ScaffoldSpec {
  readonly target_dir: string;
  readonly base_dir: string;
  readonly variables: Readonly<Record<string, string>>;
  readonly context?: Readonly<Record<string, unknown>>;
  readonly operations: readonly ScaffoldOperation[];
}

export interface EngineResult {
  readonly success: boolean;
  readonly created: {
    readonly files: readonly string[];
    readonly dirs: readonly string[];
    readonly scripts: readonly string[];
  };
  readonly skipped: readonly string[];
  readonly errors: readonly string[];
  readonly summary: string;
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

const SUBSTITUTABLE_EXTENSIONS: ReadonlySet<string> = new Set([
  '.md',
  '.json',
  '.yaml',
  '.yml',
  '.ts',
  '.tsx',
  '.html',
  '.css',
  '.js',
  '.sql',
]);

/** Check whether a file's extension supports variable substitution. */
export const isSubstitutableFile = (filePath: string): boolean =>
  SUBSTITUTABLE_EXTENSIONS.has(path.extname(filePath).toLowerCase());

/** Replace `{{VAR}}` placeholders in content with values from variables map. */
export const substituteVariables = (
  content: string,
  variables: Readonly<Record<string, string>>
): string => {
  const now = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');

  const merged: Readonly<Record<string, string>> = {
    DATE: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    DATE_TIME: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
    ...variables,
  };

  return Object.entries(merged).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
    content
  );
};

/**
 * Evaluate a `when` condition against a context object.
 *
 * - `undefined` → true (no condition = always execute)
 * - Single condition → evaluate it
 * - Array → AND (all must be true)
 */
export const evaluateCondition = (
  when: WhenCondition | undefined,
  context: Readonly<Record<string, unknown>>
): boolean => {
  if (when === undefined) return true;

  const conditions: readonly SingleCondition[] = Array.isArray(when)
    ? (when as readonly SingleCondition[])
    : [when as SingleCondition];

  return conditions.every((cond) => {
    const value = context[cond.key];

    // Missing key → false
    if (value === undefined) return false;

    if ('equals' in cond) {
      return value === cond.equals;
    }

    if ('not_empty' in cond) {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.length > 0;
      return false;
    }

    return false;
  });
};

// ---------------------------------------------------------------------------
// Operation handlers
// ---------------------------------------------------------------------------

interface OpResult {
  readonly files: readonly string[];
  readonly dirs: readonly string[];
  readonly scripts: readonly string[];
  readonly skipped: readonly string[];
  readonly errors: readonly string[];
}

const emptyResult: OpResult = { files: [], dirs: [], scripts: [], skipped: [], errors: [] };

const resolveSource = (spec: ScaffoldSpec, relative: string): string =>
  path.join(spec.base_dir, relative);

const resolveDest = (spec: ScaffoldSpec, relative: string): string =>
  path.join(spec.target_dir, relative);

/** Copy a single file with optional variable substitution. */
const copySingleFile = async (
  srcPath: string,
  destPath: string,
  variables: Readonly<Record<string, string>>,
  ifExists: 'skip' | 'overwrite',
  dryRun: boolean
): Promise<{ readonly created: boolean; readonly skipped: boolean }> => {
  if (await exists(destPath)) {
    if (ifExists === 'skip') {
      return { created: false, skipped: true };
    }
  }

  if (!dryRun) {
    await ensureDir(path.dirname(destPath));
    if (isSubstitutableFile(srcPath)) {
      const content = await readText(srcPath);
      const substituted = substituteVariables(content, variables);
      await writeText(destPath, substituted);
    } else {
      await copyFile(srcPath, destPath);
    }
  }

  return { created: true, skipped: false };
};

export const handleTemplateDir = async (
  op: TemplateDirOp,
  spec: ScaffoldSpec,
  dryRun: boolean
): Promise<OpResult> => {
  const srcDir = resolveSource(spec, op.source);
  const destDir = resolveDest(spec, op.dest);
  const ifExists = op.if_exists ?? 'skip';

  if (!(await exists(srcDir))) {
    return { ...emptyResult, errors: [`Source directory not found: ${op.source}`] };
  }

  const srcFiles = await walkDir(srcDir);
  const files: string[] = [];
  const skipped: string[] = [];

  for (const srcFile of srcFiles) {
    const relPath = path.relative(srcDir, srcFile);
    const destFile = path.join(destDir, relPath);
    const relDest = path.relative(spec.target_dir, destFile);

    const result = await copySingleFile(srcFile, destFile, spec.variables, ifExists, dryRun);
    if (result.created) {
      files.push(relDest);
    } else if (result.skipped) {
      skipped.push(relDest);
    }
  }

  return { ...emptyResult, files, skipped };
};

export const handleTemplateFile = async (
  op: TemplateFileOp,
  spec: ScaffoldSpec,
  dryRun: boolean
): Promise<OpResult> => {
  const srcPath = resolveSource(spec, op.source);
  const destPath = resolveDest(spec, op.dest);
  const ifExists = op.if_exists ?? 'skip';
  const relDest = path.relative(spec.target_dir, destPath);

  if (!(await exists(srcPath))) {
    return { ...emptyResult, errors: [`Source file not found: ${op.source}`] };
  }

  const result = await copySingleFile(srcPath, destPath, spec.variables, ifExists, dryRun);

  if (result.skipped) {
    return { ...emptyResult, skipped: [relDest] };
  }
  if (result.created) {
    return { ...emptyResult, files: [relDest] };
  }
  return emptyResult;
};

export const handleMkdir = async (
  op: MkdirOp,
  spec: ScaffoldSpec,
  dryRun: boolean
): Promise<OpResult> => {
  const dirPath = resolveDest(spec, op.path);
  const relDir = path.relative(spec.target_dir, dirPath);

  if (!dryRun) {
    await ensureDir(dirPath);
  }

  const dirs: readonly string[] = [relDir];
  const files: string[] = [];

  if (op.gitkeep) {
    const gitkeepPath = path.join(dirPath, '.gitkeep');
    if (!dryRun) {
      await writeText(gitkeepPath, '');
    }
    files.push(`${relDir}/.gitkeep`);
  }

  return { ...emptyResult, dirs, files };
};

export const handleWriteFile = async (
  op: WriteFileOp,
  spec: ScaffoldSpec,
  dryRun: boolean
): Promise<OpResult> => {
  const destPath = resolveDest(spec, op.path);
  const ifExists = op.if_exists ?? 'skip';
  const relDest = path.relative(spec.target_dir, destPath);

  if (await exists(destPath)) {
    if (ifExists === 'skip') {
      return { ...emptyResult, skipped: [relDest] };
    }
  }

  if (!dryRun) {
    await ensureDir(path.dirname(destPath));
    const content = substituteVariables(op.content, spec.variables);
    await writeText(destPath, content);
  }

  return { ...emptyResult, files: [relDest] };
};

export const handlePackageJsonScripts = async (
  op: PackageJsonScriptsOp,
  spec: ScaffoldSpec,
  dryRun: boolean
): Promise<OpResult> => {
  const pkgPath = path.join(spec.target_dir, 'package.json');

  if (!(await exists(pkgPath))) {
    return { ...emptyResult, errors: ['package.json not found in target_dir — skipping script merge'] };
  }

  const pkg = await readJson<{ scripts?: Record<string, string> }>(pkgPath);
  const existingScripts: Record<string, string> = pkg.scripts ?? {};
  const addedScripts: string[] = [];

  const merged = { ...existingScripts };
  for (const [key, value] of Object.entries(op.scripts)) {
    if (!(key in existingScripts)) {
      merged[key] = value;
      addedScripts.push(key);
    }
  }

  if (!dryRun && addedScripts.length > 0) {
    await writeJson(pkgPath, { ...pkg, scripts: merged });
  }

  return { ...emptyResult, scripts: addedScripts };
};

// ---------------------------------------------------------------------------
// Main executor
// ---------------------------------------------------------------------------

/** Execute a scaffold spec, returning a summary of all operations. */
export const executeSpec = async (
  spec: ScaffoldSpec,
  dryRun: boolean = false
): Promise<EngineResult> => {
  const context: Readonly<Record<string, unknown>> = spec.context ?? {};

  const allFiles: string[] = [];
  const allDirs: string[] = [];
  const allScripts: string[] = [];
  const allSkipped: string[] = [];
  const allErrors: string[] = [];

  for (const op of spec.operations) {
    // Evaluate condition
    if (!evaluateCondition(op.when, context)) {
      continue;
    }

    let result: OpResult;

    switch (op.type) {
      case 'template_dir':
        result = await handleTemplateDir(op, spec, dryRun);
        break;
      case 'template_file':
        result = await handleTemplateFile(op, spec, dryRun);
        break;
      case 'mkdir':
        result = await handleMkdir(op, spec, dryRun);
        break;
      case 'write_file':
        result = await handleWriteFile(op, spec, dryRun);
        break;
      case 'package_json_scripts':
        result = await handlePackageJsonScripts(op, spec, dryRun);
        break;
      default:
        allErrors.push(`Unknown operation type: ${(op as { type: string }).type}`);
        continue;
    }

    allFiles.push(...result.files);
    allDirs.push(...result.dirs);
    allScripts.push(...result.scripts);
    allSkipped.push(...result.skipped);
    allErrors.push(...result.errors);
  }

  const parts: string[] = [];
  if (allFiles.length > 0) parts.push(`Created ${allFiles.length} files`);
  if (allDirs.length > 0) parts.push(`${allDirs.length} directories`);
  if (allScripts.length > 0) parts.push(`${allScripts.length} scripts`);
  if (allSkipped.length > 0) parts.push(`Skipped ${allSkipped.length} existing`);
  if (allErrors.length > 0) parts.push(`${allErrors.length} errors`);

  const summary = parts.length > 0 ? parts.join('. ') + '.' : 'No operations executed.';

  return {
    success: allErrors.length === 0,
    created: { files: allFiles, dirs: allDirs, scripts: allScripts },
    skipped: allSkipped,
    errors: allErrors,
    summary,
  };
};
