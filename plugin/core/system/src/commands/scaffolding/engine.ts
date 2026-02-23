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
export type EqualsCondition = {
  readonly key: string;
  readonly equals: unknown;
};

/** Condition that checks a context value is non-empty. */
export type NotEmptyCondition = {
  readonly key: string;
  readonly not_empty: true;
};

/** A single condition. */
export type SingleCondition = EqualsCondition | NotEmptyCondition;

/** One or more conditions (array = AND). */
export type WhenCondition = SingleCondition | readonly SingleCondition[];

/** Base fields shared by operations that create files. */
type FileOperationBase = {
  readonly when?: WhenCondition;
  readonly if_exists?: 'skip' | 'overwrite';
};

export type TemplateDirOp = FileOperationBase & {
  readonly type: 'template_dir';
  readonly source: string;
  readonly dest: string;
};

export type TemplateFileOp = FileOperationBase & {
  readonly type: 'template_file';
  readonly source: string;
  readonly dest: string;
};

export type MkdirOp = {
  readonly type: 'mkdir';
  readonly path: string;
  readonly gitkeep?: boolean;
  readonly when?: WhenCondition;
};

export type WriteFileOp = FileOperationBase & {
  readonly type: 'write_file';
  readonly path: string;
  readonly content: string;
};

export type PackageJsonScriptsOp = {
  readonly type: 'package_json_scripts';
  readonly scripts: Readonly<Record<string, string>>;
  readonly when?: WhenCondition;
};

export type ScaffoldOperation =
  | TemplateDirOp
  | TemplateFileOp
  | MkdirOp
  | WriteFileOp
  | PackageJsonScriptsOp;

export type ScaffoldSpec = {
  readonly target_dir: string;
  readonly base_dir: string;
  readonly variables: Readonly<Record<string, string>>;
  readonly context?: Readonly<Record<string, unknown>>;
  readonly operations: readonly ScaffoldOperation[];
};

export type EngineResult = {
  readonly success: boolean;
  readonly created: {
    readonly files: readonly string[];
    readonly dirs: readonly string[];
    readonly scripts: readonly string[];
  };
  readonly skipped: readonly string[];
  readonly errors: readonly string[];
  readonly summary: string;
};

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
export const isSubstitutableFile = (filePath: string): boolean => {
  const ext = path.extname(filePath).toLowerCase();
  // .tmpl files are always substitutable (strip .tmpl to check the real extension too)
  if (ext === '.tmpl') return true;
  return SUBSTITUTABLE_EXTENSIONS.has(ext);
};

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
 * - `undefined` -> true (no condition = always execute)
 * - Single condition -> evaluate it
 * - Array -> AND (all must be true)
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

    // Missing key -> false
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

type OpResult = {
  readonly files: readonly string[];
  readonly dirs: readonly string[];
  readonly scripts: readonly string[];
  readonly skipped: readonly string[];
  readonly errors: readonly string[];
};

const emptyResult: OpResult = { files: [], dirs: [], scripts: [], skipped: [], errors: [] };

const resolveSource = (spec: ScaffoldSpec, relative: string): string =>
  path.isAbsolute(relative) ? relative : path.join(spec.base_dir, relative);

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
  const { files, skipped } = await srcFiles.reduce(
    async (accPromise, srcFile) => {
      const acc = await accPromise;
      const relPath = path.relative(srcDir, srcFile);
      const destFile = path.join(destDir, relPath);
      const relDest = path.relative(spec.target_dir, destFile);

      const result = await copySingleFile(srcFile, destFile, spec.variables, ifExists, dryRun);
      if (result.created) {
        return { files: [...acc.files, relDest], skipped: acc.skipped };
      }
      if (result.skipped) {
        return { files: acc.files, skipped: [...acc.skipped, relDest] };
      }
      return acc;
    },
    Promise.resolve({ files: [] as readonly string[], skipped: [] as readonly string[] })
  );

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

  if (op.gitkeep) {
    const gitkeepPath = path.join(dirPath, '.gitkeep');
    if (!dryRun) {
      await writeText(gitkeepPath, '');
    }
    return { ...emptyResult, dirs, files: [`${relDir}/.gitkeep`] };
  }

  return { ...emptyResult, dirs, files: [] };
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
    return { ...emptyResult, errors: ['package.json not found in target_dir -- skipping script merge'] };
  }

  const pkg = await readJson<{ scripts?: Readonly<Record<string, string>> }>(pkgPath);
  const existingScripts: Readonly<Record<string, string>> = pkg.scripts ?? {};

  const newEntries = Object.entries(op.scripts).filter(([key]) => !(key in existingScripts));
  const addedScripts: readonly string[] = newEntries.map(([key]) => key);
  const merged: Readonly<Record<string, string>> = {
    ...existingScripts,
    ...Object.fromEntries(newEntries),
  };

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

  const initialAcc = {
    files: [] as readonly string[],
    dirs: [] as readonly string[],
    scripts: [] as readonly string[],
    skipped: [] as readonly string[],
    errors: [] as readonly string[],
  };

  const accumulated = await spec.operations.reduce(
    async (accPromise, op) => {
      const acc = await accPromise;

      // Evaluate condition
      if (!evaluateCondition(op.when, context)) {
        return acc;
      }

      const result: OpResult = await ((): Promise<OpResult> => {
        switch (op.type) {
          case 'template_dir':
            return handleTemplateDir(op, spec, dryRun);
          case 'template_file':
            return handleTemplateFile(op, spec, dryRun);
          case 'mkdir':
            return handleMkdir(op, spec, dryRun);
          case 'write_file':
            return handleWriteFile(op, spec, dryRun);
          case 'package_json_scripts':
            return handlePackageJsonScripts(op, spec, dryRun);
          default:
            return Promise.resolve({
              ...emptyResult,
              errors: [`Unknown operation type: ${(op as { type: string }).type}`],
            });
        }
      })();

      return {
        files: [...acc.files, ...result.files],
        dirs: [...acc.dirs, ...result.dirs],
        scripts: [...acc.scripts, ...result.scripts],
        skipped: [...acc.skipped, ...result.skipped],
        errors: [...acc.errors, ...result.errors],
      };
    },
    Promise.resolve(initialAcc)
  );

  const parts: readonly string[] = [
    ...(accumulated.files.length > 0 ? [`Created ${accumulated.files.length} files`] : []),
    ...(accumulated.dirs.length > 0 ? [`${accumulated.dirs.length} directories`] : []),
    ...(accumulated.scripts.length > 0 ? [`${accumulated.scripts.length} scripts`] : []),
    ...(accumulated.skipped.length > 0 ? [`Skipped ${accumulated.skipped.length} existing`] : []),
    ...(accumulated.errors.length > 0 ? [`${accumulated.errors.length} errors`] : []),
  ];

  const summary = parts.length > 0 ? parts.join('. ') + '.' : 'No operations executed.';

  return {
    success: accumulated.errors.length === 0,
    created: { files: accumulated.files, dirs: accumulated.dirs, scripts: accumulated.scripts },
    skipped: accumulated.skipped,
    errors: accumulated.errors,
    summary,
  };
};
