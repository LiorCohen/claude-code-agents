# Task #117 — Change Report

**Branch:** `feature/task-117-scaffolding-engine`
**Commits:** 1
**Files changed:** 25 (+2201 / -892 lines)

---

## 1. [`plugin/system/src/commands/scaffolding/engine.ts`](plugin/system/src/commands/scaffolding/engine.ts)

New generic scaffolding engine that accepts a declarative scaffold spec and executes file operations: template copying, variable substitution, directory creation, file writing, and package.json script merging.

```typescript
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
```

---

## 2. [`plugin/system/src/commands/scaffolding/scaffold-spec.schema.json`](plugin/system/src/commands/scaffolding/scaffold-spec.schema.json)

New JSON Schema for validating scaffold spec files, covering all 5 operation types and `when` condition syntax.

```json
{
  "title": "Scaffold Spec",
  "description": "Declarative specification for the SDD scaffolding engine.",
  "type": "object",
  "required": ["target_dir", "base_dir", "variables", "operations"],
  "additionalProperties": false,
  "properties": {
    "target_dir": {
      "type": "string",
      "description": "Absolute path to project root. All dest/path fields are relative to this."
    },
    "base_dir": {
      "type": "string",
      "description": "Absolute path to skills directory. All source fields are relative to this."
    },
    "variables": {
      "type": "object",
      "description": "Key-value pairs for {{VAR}} substitution in file contents.",
      "additionalProperties": { "type": "string" }
    },
    "context": {
      "type": "object",
      "description": "Key-value pairs for when-condition evaluation.",
      "additionalProperties": true
    },
    "operations": {
      "type": "array",
      "description": "Ordered list of operations to execute.",
      "items": {
        "type": "object",
        "required": ["type"],
        "oneOf": [
          {
            "properties": {
              "type": { "const": "template_dir" },
              "source": { "type": "string" },
              "dest": { "type": "string" },
              "if_exists": { "type": "string", "enum": ["skip", "overwrite"] },
              "when": { "$ref": "#/definitions/when" }
            },
            "required": ["type", "source", "dest"],
            "additionalProperties": false
          },
          {
            "properties": {
              "type": { "const": "template_file" },
              "source": { "type": "string" },
              "dest": { "type": "string" },
              "if_exists": { "type": "string", "enum": ["skip", "overwrite"] },
              "when": { "$ref": "#/definitions/when" }
            },
            "required": ["type", "source", "dest"],
            "additionalProperties": false
          },
          {
            "properties": {
              "type": { "const": "mkdir" },
              "path": { "type": "string" },
              "gitkeep": { "type": "boolean" },
              "when": { "$ref": "#/definitions/when" }
            },
            "required": ["type", "path"],
            "additionalProperties": false
          },
          {
            "properties": {
              "type": { "const": "write_file" },
              "path": { "type": "string" },
              "content": { "type": "string" },
              "if_exists": { "type": "string", "enum": ["skip", "overwrite"] },
              "when": { "$ref": "#/definitions/when" }
            },
            "required": ["type", "path", "content"],
            "additionalProperties": false
          },
          {
            "properties": {
              "type": { "const": "package_json_scripts" },
              "scripts": {
                "type": "object",
                "additionalProperties": { "type": "string" }
              },
              "when": { "$ref": "#/definitions/when" }
            },
            "required": ["type", "scripts"],
            "additionalProperties": false
          }
        ]
      }
    }
  },
  "definitions": {
    "single_condition": {
      "type": "object",
      "required": ["key"],
      "properties": {
        "key": { "type": "string" },
        "equals": {},
        "not_empty": { "type": "boolean", "const": true }
      },
      "oneOf": [
        { "required": ["equals"] },
        { "required": ["not_empty"] }
      ],
      "additionalProperties": false
    },
    "when": {
      "oneOf": [
        { "$ref": "#/definitions/single_condition" },
        {
          "type": "array",
          "items": { "$ref": "#/definitions/single_condition" },
          "minItems": 1
        }
      ]
    }
  }
}
```

---

## 3. [`plugin/system/src/commands/scaffolding/apply.ts`](plugin/system/src/commands/scaffolding/apply.ts)

New CLI handler for `scaffolding apply` -- reads a scaffold spec JSON file, validates it with manual checks and JSON Schema, then executes it via the engine.

```typescript
/**
 * Scaffolding apply command handler.
 *
 * Reads a scaffold spec JSON file and executes it via the engine.
 *
 * Usage:
 *   sdd-system scaffolding apply --spec spec.json [--dry-run]
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import type { CommandResult } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { exists, readText, isDirectory } from '@/lib/fs';
import { executeSpec } from './engine';
import type { ScaffoldSpec } from './engine';

/** Load and compile the JSON Schema validator (lazy singleton). */
let _validate: ReturnType<Ajv['compile']> | undefined;
const getSchemaValidator = (): ReturnType<Ajv['compile']> => {
  if (!_validate) {
    const schemaPath = join(dirname(fileURLToPath(import.meta.url)), 'scaffold-spec.schema.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as Record<string, unknown>;
    const ajv = new Ajv({ allErrors: true });
    _validate = ajv.compile(schema);
  }
  return _validate;
};

/**
 * Validate a parsed spec: first manual checks for clean error messages,
 * then JSON Schema validation for structural completeness.
 */
const validateSpec = (
  raw: Record<string, unknown>
): { readonly valid: true; readonly spec: ScaffoldSpec } | { readonly valid: false; readonly error: string } => {
  // Manual checks — give clean error messages for common issues
  const required = ['target_dir', 'base_dir', 'variables', 'operations'] as const;
  const missing = required.filter((f) => !(f in raw));
  if (missing.length > 0) {
    return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
  }

  if (typeof raw['target_dir'] !== 'string') {
    return { valid: false, error: 'target_dir must be a string' };
  }
  if (typeof raw['base_dir'] !== 'string') {
    return { valid: false, error: 'base_dir must be a string' };
  }
  if (typeof raw['variables'] !== 'object' || raw['variables'] === null || Array.isArray(raw['variables'])) {
    return { valid: false, error: 'variables must be an object' };
  }
  if (!Array.isArray(raw['operations'])) {
    return { valid: false, error: 'operations must be an array' };
  }

  // Validate each operation has a valid type
  const validTypes = ['template_dir', 'template_file', 'mkdir', 'write_file', 'package_json_scripts'];
  for (let i = 0; i < (raw['operations'] as readonly unknown[]).length; i++) {
    const op = (raw['operations'] as readonly Record<string, unknown>[])[i];
    if (!op || typeof op !== 'object') {
      return { valid: false, error: `operations[${i}]: must be an object` };
    }
    if (!validTypes.includes(op['type'] as string)) {
      return { valid: false, error: `operations[${i}]: unknown type "${op['type'] as string}"` };
    }
  }

  // JSON Schema validation for structural completeness (per-operation fields, when conditions)
  const validate = getSchemaValidator();
  if (!validate(raw)) {
    const errors = (validate.errors ?? [])
      .map((e) => `${e.instancePath || '/'}: ${e.message}`)
      .join('; ');
    return { valid: false, error: `Schema validation failed: ${errors}` };
  }

  return { valid: true, spec: raw as unknown as ScaffoldSpec };
};

export const applyScaffoldSpec = async (args: readonly string[]): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);
  const specPath = named['spec'];
  const dryRun = named['dry-run'] === 'true';

  if (!specPath) {
    return {
      success: false,
      error: 'Missing --spec argument. Usage: sdd-system scaffolding apply --spec spec.json [--dry-run]',
    };
  }

  if (!(await exists(specPath))) {
    return {
      success: false,
      error: `Spec file not found: ${specPath}`,
    };
  }

  // Parse JSON
  const specContent = await readText(specPath);
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(specContent) as Record<string, unknown>;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Failed to parse spec JSON: ${message}`,
    };
  }

  // Validate spec structure
  const validation = validateSpec(raw);
  if (!validation.valid) {
    return { success: false, error: `Invalid spec: ${validation.error}` };
  }

  const spec = validation.spec;

  // Validate directories exist
  if (!(await isDirectory(spec.base_dir))) {
    return { success: false, error: `base_dir not found: ${spec.base_dir}` };
  }
  if (!(await isDirectory(spec.target_dir))) {
    return { success: false, error: `target_dir not found: ${spec.target_dir}` };
  }

  // Execute
  const result = await executeSpec(spec, dryRun);

  return {
    success: result.success,
    message: dryRun ? `[dry-run] ${result.summary}` : result.summary,
    data: result,
  };
};
```

---

## 4. [`plugin/system/src/commands/scaffolding/index.ts`](plugin/system/src/commands/scaffolding/index.ts)

Added `apply` as a new subcommand to the scaffolding command router.

```diff
diff --git a/plugin/system/src/commands/scaffolding/index.ts b/plugin/system/src/commands/scaffolding/index.ts
index de963e9..c86c7d1 100644
--- a/plugin/system/src/commands/scaffolding/index.ts
+++ b/plugin/system/src/commands/scaffolding/index.ts
@@ -4,13 +4,14 @@
  * Commands:
  *   project   Create new SDD project structure
  *   domain    Populate domain specs from config
+ *   apply     Apply a declarative scaffold spec
  */

 import type { CommandResult, GlobalOptions } from '@/lib/args';
 import type { CommandSchema } from '@/lib/schema-validator';
 import { validateArgs, formatValidationErrors } from '@/lib/schema-validator';

-const ACTIONS = ['project', 'domain'] as const;
+const ACTIONS = ['project', 'domain', 'apply'] as const;
 type Action = (typeof ACTIONS)[number];

 /**
@@ -62,6 +63,10 @@ export const handleScaffolding = async (
       const { populateDomain } = await import('./domain');
       return populateDomain(args);

+    case 'apply':
+      const { applyScaffoldSpec } = await import('./apply');
+      return applyScaffoldSpec(args);
+
     default:
       return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
   }
```

---

## 5. [`plugin/system/src/commands/scaffolding/project.ts`](plugin/system/src/commands/scaffolding/project.ts)

Major refactor: replaced all inline file-operation logic with a `buildProjectSpec` function that constructs a `ScaffoldSpec` and delegates to `executeSpec`. Removed `substituteVariables`, `copyTemplateFile`, `copyTemplateDir`, `createDirectory`, `createDirectories`, `generateMetaScripts`, and related helpers. Simplified `generateComponentScripts` to return a plain record. Removed `npm-run-all` meta-script generation.

```diff
diff --git a/plugin/system/src/commands/scaffolding/project.ts b/plugin/system/src/commands/scaffolding/project.ts
index 71c1a1d..23c7797 100644
--- a/plugin/system/src/commands/scaffolding/project.ts
+++ b/plugin/system/src/commands/scaffolding/project.ts
@@ -2,28 +2,20 @@
  * Project scaffolding command.
  *
  * Creates project structure from templates with variable substitution.
+ * Builds a scaffold spec and delegates to the generic engine.
  *
  * Usage:
  *   sdd-system scaffolding project --config config.json
  */

-import * as fs from 'node:fs';
 import * as path from 'node:path';
 import type { CommandResult } from '@/lib/args';
 import { parseNamedArgs } from '@/lib/args';
-import { exists, readText, writeText, ensureDir, walkDir, copyFile } from '@/lib/fs';
+import { exists, readText } from '@/lib/fs';
 import type { ScaffoldingConfig, ComponentEntry, ScaffoldingResult } from '@/types/component';
 import { getSkillsDir } from '@/lib/config';
-
-interface CreatedItems {
-  readonly files: readonly string[];
-  readonly dirs: readonly string[];
-}
-
-const mergeItems = (...items: readonly CreatedItems[]): CreatedItems => ({
-  files: items.flatMap((i) => i.files),
-  dirs: items.flatMap((i) => i.dirs),
-});
+import { executeSpec } from './engine';
+import type { ScaffoldSpec, ScaffoldOperation } from './engine';

 /**
  * Pluralize a component type for directory naming.
@@ -53,542 +45,62 @@ const getComponentsByType = (
 ): readonly ComponentEntry[] => components.filter((c) => c.type === componentType);

 /**
- * Replace template variables with config values.
- */
-const substituteVariables = (
-  content: string,
-  config: ScaffoldingConfig,
-  component?: ComponentEntry
-): string => {
-  const replacements: Readonly<Record<string, string>> = {
-    '{{PROJECT_NAME}}': config.project_name,
-    '{{PROJECT_DESCRIPTION}}': config.project_description,
-    '{{PRIMARY_DOMAIN}}': config.primary_domain,
-    ...(component?.depends_on
-      ? { '{{CONTRACT_PACKAGE}}': `@${config.project_name}/${component.depends_on[0] ?? ''}` }
-      : {}),
-  };
-
-  return Object.entries(replacements).reduce(
-    (result, [variable, value]) => result.replaceAll(variable, value),
-    content
-  );
-};
-
-const SUBSTITUTABLE_EXTENSIONS = [
-  '.md',
-  '.json',
-  '.yaml',
-  '.yml',
-  '.ts',
-  '.tsx',
-  '.html',
-  '.css',
-  '.js',
-] as const;
-
-/**
- * Copy a template file, optionally substituting variables.
- */
-const copyTemplateFile = async (
-  src: string,
-  dest: string,
-  config: ScaffoldingConfig,
-  component?: ComponentEntry,
-  substitute = true
-): Promise<string> => {
-  await ensureDir(path.dirname(dest));
-
-  const ext = path.extname(src);
-  if (substitute && (SUBSTITUTABLE_EXTENSIONS as readonly string[]).includes(ext)) {
-    const content = await readText(src);
-    const substituted = substituteVariables(content, config, component);
-    await writeText(dest, substituted);
-  } else {
-    await copyFile(src, dest);
-  }
-
-  const relativePath = path.relative(config.target_dir, dest);
-  console.log(`  Created: ${relativePath}`);
-  return relativePath;
-};
-
-/**
- * Create a directory if it doesn't exist.
- */
-const createDirectory = async (dirPath: string, config: ScaffoldingConfig): Promise<string> => {
-  await ensureDir(dirPath);
-  const relativePath = path.relative(config.target_dir, dirPath);
-  console.log(`  Created: ${relativePath}/`);
-  return relativePath;
-};
-
-/**
- * Create multiple directories.
+ * Generate per-component npm scripts.
  */
-const createDirectories = async (
-  dirs: readonly string[],
-  target: string,
-  config: ScaffoldingConfig
-): Promise<CreatedItems> => {
-  const created = await Promise.all(
-    dirs.map(async (d) => createDirectory(path.join(target, d), config))
-  );
-  return { files: [], dirs: created };
-};
-
-/**
- * Check if a directory exists (sync version for template checks).
- */
-const directoryExists = (dirPath: string): boolean => {
-  try {
-    return fs.statSync(dirPath).isDirectory();
-  } catch {
-    return false;
-  }
-};
-
-/**
- * Copy template files from a directory if it exists.
- */
-const copyTemplateDir = async (
-  templatesDir: string,
-  destDir: string,
-  config: ScaffoldingConfig,
-  component?: ComponentEntry
-): Promise<readonly string[]> => {
-  if (!directoryExists(templatesDir)) return [];
-
-  const srcFiles = await walkDir(templatesDir);
-  const results = await Promise.all(
-    srcFiles.map(async (srcFile) => {
-      const relPath = path.relative(templatesDir, srcFile);
-      const destFile = path.join(destDir, relPath);
-      await copyTemplateFile(srcFile, destFile, config, component);
-      return path.relative(config.target_dir, destFile);
-    })
-  );
-
-  return results;
-};
-
-/**
- * Generate component scripts and categorize components.
- */
-interface ComponentScripts {
-  readonly scripts: Readonly<Record<string, string>>;
-  readonly contracts: readonly string[];
-  readonly servers: readonly string[];
-  readonly webapps: readonly string[];
-  readonly databases: readonly string[];
-}
-
 const generateComponentScripts = (
   components: readonly ComponentEntry[],
-  config: ScaffoldingConfig
-): ComponentScripts => {
-  const initial: ComponentScripts = {
-    scripts: {},
-    contracts: [],
-    servers: [],
-    webapps: [],
-    databases: [],
-  };
+  projectName: string
+): Readonly<Record<string, string>> => {
+  const scripts: Record<string, string> = {};

-  return components.reduce((acc, component) => {
-    const workspace = `-w @${config.project_name}/${component.name}`;
+  for (const component of components) {
+    const workspace = `-w @${projectName}/${component.name}`;

     switch (component.type) {
       case 'contract':
-        console.log(`  Added: ${component.name}:generate, ${component.name}:validate`);
-        return {
-          ...acc,
-          contracts: [...acc.contracts, component.name],
-          scripts: {
-            ...acc.scripts,
-            [`${component.name}:generate`]: `npm run generate:types ${workspace}`,
-            [`${component.name}:validate`]: `npm run validate ${workspace}`,
-          },
-        };
+        scripts[`${component.name}:generate`] = `npm run generate:types ${workspace}`;
+        scripts[`${component.name}:validate`] = `npm run validate ${workspace}`;
+        break;

       case 'server':
-        console.log(
-          `  Added: ${component.name}:dev, ${component.name}:build, ${component.name}:start, ${component.name}:test`
-        );
-        return {
-          ...acc,
-          servers: [...acc.servers, component.name],
-          scripts: {
-            ...acc.scripts,
-            [`${component.name}:dev`]: `npm run dev ${workspace}`,
-            [`${component.name}:build`]: `npm run build ${workspace}`,
-            [`${component.name}:start`]: `npm run start ${workspace}`,
-            [`${component.name}:test`]: `npm run test ${workspace}`,
-          },
-        };
+        scripts[`${component.name}:dev`] = `npm run dev ${workspace}`;
+        scripts[`${component.name}:build`] = `npm run build ${workspace}`;
+        scripts[`${component.name}:start`] = `npm run start ${workspace}`;
+        scripts[`${component.name}:test`] = `npm run test ${workspace}`;
+        break;

       case 'webapp':
-        console.log(
-          `  Added: ${component.name}:dev, ${component.name}:build, ${component.name}:preview, ${component.name}:test`
-        );
-        return {
-          ...acc,
-          webapps: [...acc.webapps, component.name],
-          scripts: {
-            ...acc.scripts,
-            [`${component.name}:dev`]: `npm run dev ${workspace}`,
-            [`${component.name}:build`]: `npm run build ${workspace}`,
-            [`${component.name}:preview`]: `npm run preview ${workspace}`,
-            [`${component.name}:test`]: `npm run test ${workspace}`,
-          },
-        };
+        scripts[`${component.name}:dev`] = `npm run dev ${workspace}`;
+        scripts[`${component.name}:build`] = `npm run build ${workspace}`;
+        scripts[`${component.name}:preview`] = `npm run preview ${workspace}`;
+        scripts[`${component.name}:test`] = `npm run test ${workspace}`;
+        break;

       case 'database':
-        console.log(
-          `  Added: ${component.name}:setup, ${component.name}:teardown, ${component.name}:migrate, ${component.name}:seed, ${component.name}:reset, ${component.name}:port-forward, ${component.name}:psql`
-        );
-        return {
-          ...acc,
-          databases: [...acc.databases, component.name],
-          scripts: {
-            ...acc.scripts,
-            [`${component.name}:setup`]: `npm run setup ${workspace}`,
-            [`${component.name}:teardown`]: `npm run teardown ${workspace}`,
-            [`${component.name}:migrate`]: `npm run migrate ${workspace}`,
-            [`${component.name}:seed`]: `npm run seed ${workspace}`,
-            [`${component.name}:reset`]: `npm run reset ${workspace}`,
-            [`${component.name}:port-forward`]: `npm run port-forward ${workspace}`,
-            [`${component.name}:psql`]: `npm run psql ${workspace}`,
-          },
-        };
-
-      case 'helm': {
-        const dirName = componentDirName(component);
-        console.log(`  Added: ${component.name}:lint`);
-        return {
-          ...acc,
-          scripts: {
-            ...acc.scripts,
-            [`${component.name}:lint`]: `helm lint components/${dirName}`,
-          },
-        };
-      }
-
-      default:
-        return acc;
+        scripts[`${component.name}:setup`] = `npm run setup ${workspace}`;
+        scripts[`${component.name}:teardown`] = `npm run teardown ${workspace}`;
+        scripts[`${component.name}:migrate`] = `npm run migrate ${workspace}`;
+        scripts[`${component.name}:seed`] = `npm run seed ${workspace}`;
+        scripts[`${component.name}:reset`] = `npm run reset ${workspace}`;
+        scripts[`${component.name}:port-forward`] = `npm run port-forward ${workspace}`;
+        scripts[`${component.name}:psql`] = `npm run psql ${workspace}`;
+        break;
+
+      case 'helm':
+        scripts[`${component.name}:lint`] = `helm lint components/${componentDirName(component)}`;
+        break;
     }
-  }, initial);
-};
-
-/**
- * Generate meta-scripts for orchestration.
- */
-const generateMetaScripts = (
-  componentScripts: ComponentScripts
-): Readonly<Record<string, string>> => {
-  const { contracts, servers, webapps } = componentScripts;
-
-  if (contracts.length === 0 && servers.length === 0 && webapps.length === 0) {
-    return {};
   }

-  console.log('  Adding meta-scripts...');
-
-  const scriptEntries: readonly (readonly [string, string])[] = [
-    ...(contracts.length > 0
-      ? ([
-          ['generate', `npm-run-all ${contracts.map((c) => `${c}:generate`).join(' ')}`],
-        ] as const)
-      : []),
-    ...([...servers, ...webapps].length > 0
-      ? ([
-          [
-            'dev',
-            contracts.length > 0
-              ? `npm-run-all generate --parallel ${[...servers, ...webapps].map((c) => `${c}:dev`).join(' ')}`
-              : `npm-run-all --parallel ${[...servers, ...webapps].map((c) => `${c}:dev`).join(' ')}`,
-          ],
-        ] as const)
-      : []),
-    ...([...servers, ...webapps].length > 0
-      ? ([
-          [
-            'build',
-            contracts.length > 0
-              ? `npm-run-all generate --parallel ${[...servers, ...webapps].map((c) => `${c}:build`).join(' ')}`
-              : `npm-run-all --parallel ${[...servers, ...webapps].map((c) => `${c}:build`).join(' ')}`,
-          ],
-        ] as const)
-      : []),
-    ...([...servers, ...webapps].length > 0
-      ? ([
-          [
-            'test',
-            contracts.length > 0
-              ? `npm-run-all generate --parallel ${[...servers, ...webapps].map((c) => `${c}:test`).join(' ')}`
-              : `npm-run-all --parallel ${[...servers, ...webapps].map((c) => `${c}:test`).join(' ')}`,
-          ],
-        ] as const)
-      : []),
-    ...(servers.length > 0 || webapps.length > 0
-      ? ([
-          [
-            'start',
-            `npm-run-all --parallel ${[
-              ...servers.map((c) => `${c}:start`),
-              ...webapps.map((c) => `${c}:preview`),
-            ].join(' ')}`,
-          ],
-        ] as const)
-      : []),
-  ];
-
-  console.log('  Added: generate, dev, build, test, start');
-
-  return Object.fromEntries(scriptEntries);
+  return scripts;
 };

 /**
- * Create the complete project structure.
+ * Build the architecture overview content.
  */
-const runScaffolding = async (config: ScaffoldingConfig): Promise<ScaffoldingResult> => {
-  const target = config.target_dir;
-  const skillsDir = config.skills_dir;
-  const components = config.components;
-
-  const projectTemplates = path.join(skillsDir, 'project-scaffolding', 'templates');
-  const backendTemplates = path.join(skillsDir, 'components', 'backend', 'backend-scaffolding', 'templates');
-  const frontendTemplates = path.join(skillsDir, 'components', 'frontend', 'frontend-scaffolding', 'templates');
-  const contractTemplates = path.join(skillsDir, 'components', 'contract', 'contract-scaffolding', 'templates');
-  const databaseTemplates = path.join(skillsDir, 'components', 'database', 'database-scaffolding', 'templates');
-  const configTemplates = path.join(skillsDir, 'components', 'config', 'config-scaffolding', 'templates');
-
-  const contractComponents = getComponentsByType(components, 'contract');
-  const serverComponents = getComponentsByType(components, 'server');
-  const webappComponents = getComponentsByType(components, 'webapp');
-  const databaseComponents = getComponentsByType(components, 'database');
-  const helmComponents = getComponentsByType(components, 'helm');
-  const testingComponents = getComponentsByType(components, 'testing');
-  const cicdComponents = getComponentsByType(components, 'cicd');
-
-  await ensureDir(target);
-
-  const componentDisplay = components.map((c) =>
-    c.type === c.name ? c.type : `${c.type}:${c.name}`
-  );
-
-  console.log(`\nScaffolding project: ${config.project_name}`);
-  console.log(`Target: ${target}`);
-  console.log(`Components: ${componentDisplay.join(', ')}`);
-  console.log();
-
-  // Step 1: Create root .gitignore
-  console.log('Creating root files...');
-  // ... [~400 lines of inline file creation removed] ...
-
-  // Step 4: Generate component-specific npm scripts in root package.json
-  console.log('\nGenerating npm scripts...');
-
-  const pkgPath = path.join(target, 'package.json');
-  if (await exists(pkgPath)) {
-    const pkgContent = await readText(pkgPath);
-    const pkg = JSON.parse(pkgContent) as { scripts: Record<string, string> };
-
-    const componentScripts = generateComponentScripts(components, config);
-    const metaScripts = generateMetaScripts(componentScripts);
-
-    pkg.scripts = { ...componentScripts.scripts, ...metaScripts };
-    await writeText(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
-  }
-
-  // ... [collect results and return] ...
-};
+const buildArchitectureContent = (
+  config: ScaffoldingConfig
+): string => {
+  // ... generates architecture overview markdown ...
+  return `# Architecture Overview\n...`;
+};
+
+const CI_WORKFLOW_CONTENT = `name: CI\n...`;
+
+/**
+ * Build a scaffold spec from the existing project config.
+ */
+const buildProjectSpec = (config: ScaffoldingConfig): ScaffoldSpec => {
+  const components = config.components;
+  const operations: ScaffoldOperation[] = [];
+
+  // -- Root files --
+  operations.push({ type: 'write_file', path: '.gitignore', content: '...' });
+  operations.push({ type: 'write_file', path: '.claudeignore', content: 'archive/\n' });
+
+  // -- Project template files --
+  operations.push({ type: 'template_file', source: '...', dest: 'README.md' });
+  operations.push({ type: 'template_file', source: '...', dest: 'CLAUDE.md' });
+  operations.push({ type: 'template_file', source: '...', dest: 'package.json' });
+  // ... spec files, gitkeep dirs, architecture overview, etc.
+
+  // -- Per-component operations (config, contract, server, webapp, database, helm, testing, cicd) --
+  // Each component type maps to template_dir, mkdir, write_file operations
+
+  // -- Component scripts (no meta-scripts) --
+  const scripts = generateComponentScripts(components, config.project_name);
+  if (Object.keys(scripts).length > 0) {
+    operations.push({ type: 'package_json_scripts', scripts });
+  }
+
+  return { target_dir: config.target_dir, base_dir: config.skills_dir, variables: { ... }, operations };
+};
+
+const runScaffolding = async (config: ScaffoldingConfig): Promise<ScaffoldingResult> => {
+  const spec = buildProjectSpec(config);
+  const result = await executeSpec(spec);
+  return { success: result.success, target_dir: config.target_dir, ... };
+};
```

---

## 6. [`plugin/system/package.json`](plugin/system/package.json)

Added a `cp` step to the build script to copy `scaffold-spec.schema.json` into `dist/` alongside the compiled JS.

```diff
diff --git a/plugin/system/package.json b/plugin/system/package.json
index a6949cb..88ecb92 100644
--- a/plugin/system/package.json
+++ b/plugin/system/package.json
@@ -5,7 +5,7 @@
   "type": "module",
   "main": "dist/cli.js",
   "scripts": {
-    "build": "tsc --project tsconfig.json && tsc-alias -p tsconfig.json -f",
+    "build": "tsc --project tsconfig.json && tsc-alias -p tsconfig.json -f && cp src/commands/scaffolding/scaffold-spec.schema.json dist/commands/scaffolding/",
     "dev": "tsx src/cli.ts",
     "typecheck": "tsc --noEmit"
   },
```

---

## 7. [`plugin/skills/scaffolding/SKILL.md`](plugin/skills/scaffolding/SKILL.md)

Added comprehensive "Scaffolding Engine" section documenting the engine invocation, spec format, workflow steps, and complexity tiers (Tier 1-3).

```diff
diff --git a/plugin/skills/scaffolding/SKILL.md b/plugin/skills/scaffolding/SKILL.md
index 0e35c48..8394a8d 100644
--- a/plugin/skills/scaffolding/SKILL.md
+++ b/plugin/skills/scaffolding/SKILL.md
@@ -38,6 +38,62 @@ Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

 Returns success status, list of scaffolded components, and next steps.

+## Scaffolding Engine
+
+All scaffolding operations are executed by the generic scaffolding engine. Component skills define a declarative JSON spec that the engine executes.
+
+### Invocation
+
+```bash
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding apply --spec <path-to-spec.json> [--dry-run]
+```
+
+### Spec Format
+
+```json
+{
+  "target_dir": "<project-root>",
+  "base_dir": "<plugin-root>/skills",
+  "variables": { "PROJECT_NAME": "my-app", "...": "..." },
+  "context": { "has_databases": true, "...": "..." },
+  "operations": [
+    { "type": "template_dir", "source": "...", "dest": "..." },
+    { "type": "template_file", "source": "...", "dest": "...", "when": { "key": "flag", "equals": true } },
+    { "type": "mkdir", "path": "...", "gitkeep": true },
+    { "type": "write_file", "path": "...", "content": "...", "if_exists": "skip" },
+    { "type": "package_json_scripts", "scripts": { "name:dev": "..." } }
+  ]
+}
+```
+
+### Workflow
+
+For each component to scaffold:
+
+1. **Compute context flags** from component settings (e.g., `has_databases`, `has_ingress`)
+2. **Build a spec JSON** following the component skill's documented spec format
+3. **Write the spec** to a temp file
+4. **Invoke the engine** with `scaffolding apply --spec <path>`
+5. **For Tier 3 components** (e.g., config): run the engine for base structure, then compute dynamic content and invoke additional `write_file` operations
+
+### Complexity Tiers
+
+| Tier | Pattern | Examples |
+|------|---------|----------|
+| Tier 1 | Fixed spec, no conditions | frontend, contract, database |
+| Tier 2 | Spec with `when` conditions | backend, helm |
+| Tier 3 | Engine for base + skill computes dynamic content | config |
+
+See each component's `SKILL.md` for the complete spec format and context flag derivation.
+
+## Project Scaffolding
+
+The `scaffolding project` command uses the engine internally — it builds a spec from the project config and executes it.
+
+```bash
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding project --config <config.json>
+```
+
 ## Usage

 After gathering project configuration in `/sdd-init`, run `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding project` with a config JSON file containing the project settings. The config must include:
```

---

## 8. [`plugin/skills/project-scaffolding/SKILL.md`](plugin/skills/project-scaffolding/SKILL.md)

Added "Scaffold Spec" section describing how project scaffolding integrates with the engine, including an example of the internally generated spec.

```diff
diff --git a/plugin/skills/project-scaffolding/SKILL.md b/plugin/skills/project-scaffolding/SKILL.md
index 0f2da3a..15bfcc0 100644
--- a/plugin/skills/project-scaffolding/SKILL.md
+++ b/plugin/skills/project-scaffolding/SKILL.md
@@ -205,6 +205,64 @@ When running in repair/upgrade mode, check existing `.gitignore`:
 3. If `changes/` pattern exists, remove it
 4. Log warning: "Removed .sdd from .gitignore - SDD artifacts must be version controlled"

+## Scaffold Spec
+
+Project scaffolding uses the scaffolding engine internally. The `scaffolding project` command builds a spec from the project config and calls `executeSpec`. You do not need to invoke `scaffolding apply` separately for project-level files — the CLI handles it.
+
+### Engine Integration
+
+The project scaffolding CLI:
+
+1. Translates `ScaffoldingConfig` into a `ScaffoldSpec`
+2. Maps each component to `template_dir` operations (using colocated templates in each component skill)
+3. Generates inline content (`.gitignore`, `.claudeignore`, architecture overview) as `write_file` operations
+4. Computes per-component scripts and adds `package_json_scripts` operations
+5. Executes the full spec via the engine
+
+### Example Spec (generated internally)
+
+```json
+{
+  "target_dir": "<project-root>",
+  "base_dir": "<plugin-root>/skills",
+  "variables": {
+    "PROJECT_NAME": "my-app",
+    "PROJECT_DESCRIPTION": "My application",
+    "PRIMARY_DOMAIN": "Task Management"
+  },
+  "operations": [
+    {
+      "type": "template_dir",
+      "source": "project-scaffolding/templates/project",
+      "dest": "."
+    },
+    {
+      "type": "template_dir",
+      "source": "components/config/config-scaffolding/templates",
+      "dest": "components/config"
+    },
+    {
+      "type": "template_dir",
+      "source": "components/backend/backend-scaffolding/templates",
+      "dest": "components/servers/task-service"
+    },
+    {
+      "type": "write_file",
+      "path": ".gitignore",
+      "content": "<computed-content>",
+      "if_exists": "skip"
+    },
+    {
+      "type": "package_json_scripts",
+      "scripts": {
+        "task-service:dev": "npm run dev -w @my-app/task-service",
+        "task-service:build": "npm run build -w @my-app/task-service"
+      }
+    }
+  ]
+}
+```
+
 ## Related Skills

 - **config-scaffolding** — Generates the config component for centralized configuration. Accepts component settings from `sdd-settings.yaml` and produces `config.yaml`, validation schemas, and TypeScript types.
```

---

## 9. [`plugin/skills/project-scaffolding/templates/project/package.json`](plugin/skills/project-scaffolding/templates/project/package.json)

Removed `npm-run-all` from devDependencies (meta-scripts no longer generated).

```diff
diff --git a/plugin/skills/project-scaffolding/templates/project/package.json b/plugin/skills/project-scaffolding/templates/project/package.json
index dbda85d..f1cd7c5 100644
--- a/plugin/skills/project-scaffolding/templates/project/package.json
+++ b/plugin/skills/project-scaffolding/templates/project/package.json
@@ -9,7 +9,6 @@
   "scripts": {
   },
   "devDependencies": {
-    "npm-run-all": "^4.1.5",
     "typescript": "^5.3.0"
   }
 }
```

---

## 10. [`plugin/skills/components/backend/backend-scaffolding/SKILL.md`](plugin/skills/components/backend/backend-scaffolding/SKILL.md)

Replaced "Input" and "Root Package.json Update" sections with a "Scaffold Spec (Tier 2 -- Conditional)" section documenting variables, context flags, and the full engine spec with `when` conditions.

```diff
diff --git a/plugin/skills/components/backend/backend-scaffolding/SKILL.md b/plugin/skills/components/backend/backend-scaffolding/SKILL.md
index 551392a..a4e5e42 100644
--- a/plugin/skills/components/backend/backend-scaffolding/SKILL.md
+++ b/plugin/skills/components/backend/backend-scaffolding/SKILL.md
@@ -212,23 +212,80 @@ background-worker:

 ---

-## Input
+## Scaffold Spec (Tier 2 — Conditional)

-Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)
+To scaffold a backend component, build a spec with context flags derived from settings and invoke the engine:

-Accepts component name, server type, and optional settings for databases, contracts, and Helm chart generation.
+```bash
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding apply --spec spec.json
+```

-## Root Package.json Update
+### Variables
+
+| Variable | Source |
+|----------|--------|
+| `PROJECT_NAME` | From `sdd-settings.yaml` project name |
+| `SERVER_NAME` | Component name |
+| `CONTRACT_PACKAGE` | `@<project-name>/<contract-name>` (from `depends_on`) |
+
+### Context Flags (derived from settings)
+
+| Flag | Derived From |
+|------|-------------|
+| `has_databases` | `settings.databases.length > 0` |
+| `has_provides_contracts` | `settings.provides_contracts.length > 0` |
+| `has_consumes_contracts` | `settings.consumes_contracts.length > 0` |
+
+### Operations
+
+```json
+{
+  "target_dir": "<project-root>",
+  "base_dir": "<plugin-root>/skills",
+  "variables": {
+    "PROJECT_NAME": "<project-name>",
+    "SERVER_NAME": "<server-name>",
+    "CONTRACT_PACKAGE": "@<project-name>/<contract-name>"
+  },
+  "context": {
+    "has_databases": true,
+    "has_provides_contracts": true,
+    "has_consumes_contracts": false
+  },
+  "operations": [
+    {
+      "type": "template_dir",
+      "source": "components/backend/backend-scaffolding/templates",
+      "dest": "components/servers/<server-name>"
+    },
+    {
+      "type": "mkdir",
+      "path": "components/servers/<server-name>/src/dal",
+      "when": { "key": "has_databases", "equals": true }
+    },
+    {
+      "type": "mkdir",
+      "path": "components/servers/<server-name>/src/controller/http_handlers",
+      "when": { "key": "has_provides_contracts", "equals": true }
+    },
+    {
+      "type": "package_json_scripts",
+      "scripts": {
+        "<server-name>:dev": "npm run dev -w @<project-name>/<server-name>",
+        "<server-name>:build": "npm run build -w @<project-name>/<server-name>",
+        "<server-name>:start": "npm run start -w @<project-name>/<server-name>",
+        "<server-name>:test": "npm run test -w @<project-name>/<server-name>"
+      }
+    }
+  ]
+}
+```

-After scaffolding, update the root `package.json`:
+## Input
+
+Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

-1. If root `package.json` doesn't exist, create it from the `project-scaffolding` skill template (`templates/project/package.json`)
-2. Add component scripts:
-   - `"<name>:dev": "npm run dev -w components/servers/<name>"`
-   - `"<name>:build": "npm run build -w components/servers/<name>"`
-   - `"<name>:start": "npm run start -w components/servers/<name>"`
-   - `"<name>:test": "npm run test -w components/servers/<name>"`
-3. Update meta-scripts (`dev`, `build`, `test`) to include this component
+Accepts component name, server type, and optional settings for databases, contracts, and Helm chart generation.

 ## Related Skills
```

---

## 11. [`plugin/skills/components/frontend/frontend-scaffolding/SKILL.md`](plugin/skills/components/frontend/frontend-scaffolding/SKILL.md)

Replaced "Input" and "Root Package.json Update" sections with a "Scaffold Spec (Tier 1)" section documenting the engine spec for frontend components (no conditions needed).

```diff
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/SKILL.md b/plugin/skills/components/frontend/frontend-scaffolding/SKILL.md
index c03973d..715ae38 100644
--- a/plugin/skills/components/frontend/frontend-scaffolding/SKILL.md
+++ b/plugin/skills/components/frontend/frontend-scaffolding/SKILL.md
@@ -164,23 +164,53 @@ webapp-{name}:

 ---

-## Input
+## Scaffold Spec (Tier 1)

-Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)
+To scaffold a frontend component, build a spec and invoke the engine:

-Accepts webapp name, project metadata, and optional contract list for API client generation.
+```bash
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding apply --spec spec.json
+```
+
+### Variables

-## Root Package.json Update
+| Variable | Source |
+|----------|--------|
+| `PROJECT_NAME` | From `sdd-settings.yaml` project name |

-After scaffolding, update the root `package.json`:
+### Operations

-1. If root `package.json` doesn't exist, create it from the `project-scaffolding` skill template (`templates/project/package.json`)
-2. Add component scripts:
-   - `"<name>:dev": "npm run dev -w components/webapps/<name>"`
-   - `"<name>:build": "npm run build -w components/webapps/<name>"`
-   - `"<name>:preview": "npm run preview -w components/webapps/<name>"`
-   - `"<name>:test": "npm run test -w components/webapps/<name>"`
-3. Update meta-scripts (`dev`, `build`, `test`) to include this component
+```json
+{
+  "target_dir": "<project-root>",
+  "base_dir": "<plugin-root>/skills",
+  "variables": { "PROJECT_NAME": "<project-name>" },
+  "operations": [
+    {
+      "type": "template_dir",
+      "source": "components/frontend/frontend-scaffolding/templates",
+      "dest": "components/webapps/<webapp-name>"
+    },
+    {
+      "type": "package_json_scripts",
+      "scripts": {
+        "<webapp-name>:dev": "npm run dev -w @<project-name>/<webapp-name>",
+        "<webapp-name>:build": "npm run build -w @<project-name>/<webapp-name>",
+        "<webapp-name>:preview": "npm run preview -w @<project-name>/<webapp-name>",
+        "<webapp-name>:test": "npm run test -w @<project-name>/<webapp-name>"
+      }
+    }
+  ]
+}
+```
+
+No conditions needed — Tier 1 (straightforward).
+
+## Input
+
+Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)
+
+Accepts webapp name, project metadata, and optional contract list for API client generation.

 ## Related Skills
```

---

## 12. [`plugin/skills/components/database/database-scaffolding/SKILL.md`](plugin/skills/components/database/database-scaffolding/SKILL.md)

Replaced "Input" and "Root Package.json Update" sections with a "Scaffold Spec (Tier 1)" section for database components.

```diff
diff --git a/plugin/skills/components/database/database-scaffolding/SKILL.md b/plugin/skills/components/database/database-scaffolding/SKILL.md
index e42bdab..3682442 100644
--- a/plugin/skills/components/database/database-scaffolding/SKILL.md
+++ b/plugin/skills/components/database/database-scaffolding/SKILL.md
@@ -158,18 +158,44 @@ export type DatabaseConfig = Readonly<{

 ---

-## Input
+## Scaffold Spec (Tier 1)

-Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)
+To scaffold a database component, build a spec and invoke the engine:

-Accepts database name and optional project name for migration and seed template generation.
+```bash
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding apply --spec spec.json
+```

-## Root Package.json Update
+### Variables

-After scaffolding, update the root `package.json`:
+| Variable | Source |
+|----------|--------|
+| `PROJECT_NAME` | From `sdd-settings.yaml` project name |

-1. If root `package.json` doesn't exist, create it from the `project-scaffolding` skill template (`templates/project/package.json`)
-2. Add the database component as a workspace entry (no component-level scripts needed — database operations use the system CLI directly)
+### Operations
+
+```json
+{
+  "target_dir": "<project-root>",
+  "base_dir": "<plugin-root>/skills",
+  "variables": { "PROJECT_NAME": "<project-name>" },
+  "operations": [
+    {
+      "type": "template_dir",
+      "source": "components/database/database-scaffolding/templates",
+      "dest": "components/databases/<database-name>"
+    }
+  ]
+}
+```
+
+No conditions needed — Tier 1 (straightforward).
+
+## Input
+
+Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)
+
+Accepts database name and optional project name for migration and seed template generation.

 ## Related Skills
```

---

## 13. [`plugin/skills/components/contract/contract-scaffolding/SKILL.md`](plugin/skills/components/contract/contract-scaffolding/SKILL.md)

Replaced "Input" and "Root Package.json Update" sections with a "Scaffold Spec (Tier 1)" section for contract components (includes a `write_file` for `.gitignore`).

```diff
diff --git a/plugin/skills/components/contract/contract-scaffolding/SKILL.md b/plugin/skills/components/contract/contract-scaffolding/SKILL.md
index 0593c1b..b90de19 100644
--- a/plugin/skills/components/contract/contract-scaffolding/SKILL.md
+++ b/plugin/skills/components/contract/contract-scaffolding/SKILL.md
@@ -73,18 +73,49 @@ skills/components/contract/contract-scaffolding/templates/
 └── openapi.yaml
 ```

-## Input
+## Scaffold Spec (Tier 1)

-Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)
+To scaffold a contract component, build a spec and invoke the engine:

-Accepts contract name and optional project metadata for OpenAPI spec generation.
+```bash
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding apply --spec spec.json
+```

-## Root Package.json Update
+### Variables
+
+| Variable | Source |
+|----------|--------|
+| `PROJECT_NAME` | From `sdd-settings.yaml` project name |
+
+### Operations
+
+```json
+{
+  "target_dir": "<project-root>",
+  "base_dir": "<plugin-root>/skills",
+  "variables": { "PROJECT_NAME": "<project-name>" },
+  "operations": [
+    {
+      "type": "template_dir",
+      "source": "components/contract/contract-scaffolding/templates",
+      "dest": "components/contracts/<contract-name>"
+    },
+    {
+      "type": "write_file",
+      "path": "components/contracts/<contract-name>/.gitignore",
+      "content": "node_modules/\ngenerated/\n"
+    }
+  ]
+}
+```

-After scaffolding, update the root `package.json`:
+No conditions needed — Tier 1 (straightforward).

-1. If root `package.json` doesn't exist, create it from the `project-scaffolding` skill template (`templates/project/package.json`)
-2. Add the contract component as a workspace entry (no component-level scripts needed — contract operations use the system CLI directly)
+## Input
+
+Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)
+
+Accepts contract name and optional project metadata for OpenAPI spec generation.

 ## Related Skills
```

---

## 14. [`plugin/skills/components/config/config-scaffolding/SKILL.md`](plugin/skills/components/config/config-scaffolding/SKILL.md)

Added "Scaffold Spec (Tier 3 -- Hybrid)" section documenting the split approach: engine for base template structure, skill computes dynamic config sections via `write_file`.

```diff
diff --git a/plugin/skills/components/config/config-scaffolding/SKILL.md b/plugin/skills/components/config/config-scaffolding/SKILL.md
index d651ac1..df8af89 100644
--- a/plugin/skills/components/config/config-scaffolding/SKILL.md
+++ b/plugin/skills/components/config/config-scaffolding/SKILL.md
@@ -192,6 +192,46 @@ When settings change (via `/sdd-settings`), the config component is automaticall
 3. **Contract added to consumes_contracts** → API subsection added
 4. **Existing sections** → Never modified or deleted (preserves user changes)

+## Scaffold Spec (Tier 3 — Hybrid)
+
+The config component uses the engine for base template structure, but config section generation is dynamic (computed from component settings by the skill).
+
+### Base structure via engine
+
+```bash
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding apply --spec spec.json
+```
+
+```json
+{
+  "target_dir": "<project-root>",
+  "base_dir": "<plugin-root>/skills",
+  "variables": { "PROJECT_NAME": "<project-name>" },
+  "operations": [
+    {
+      "type": "template_dir",
+      "source": "components/config/config-scaffolding/templates",
+      "dest": "components/config"
+    }
+  ]
+}
+```
+
+### Dynamic config sections (skill computes content)
+
+For each component, the skill computes the YAML config section content and writes it via `write_file` with `if_exists: "skip"` (additive only — never clobber existing sections). The skill builds the YAML content itself, then passes it to the engine.
+
+```json
+{
+  "type": "write_file",
+  "path": "components/config/envs/default/config.yaml",
+  "content": "<computed-yaml-content>",
+  "if_exists": "overwrite"
+}
+```
+
+**Split:** Use the engine for the component directory structure. Compute config sections yourself (from component settings) and write them via `write_file`.
+
 ## Input

 Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)
```

---

## 15. [`plugin/skills/components/helm/helm-scaffolding/SKILL.md`](plugin/skills/components/helm/helm-scaffolding/SKILL.md)

Replaced "Input" and "Root Package.json Update" sections with a "Scaffold Spec (Tier 2 -- Conditional)" section documenting variables, context flags, and the full engine spec with per-template `when` conditions.

```diff
diff --git a/plugin/skills/components/helm/helm-scaffolding/SKILL.md b/plugin/skills/components/helm/helm-scaffolding/SKILL.md
index 520fa7c..0fd82e1 100644
--- a/plugin/skills/components/helm/helm-scaffolding/SKILL.md
+++ b/plugin/skills/components/helm/helm-scaffolding/SKILL.md
@@ -214,19 +214,76 @@ Cluster-level observability (Victoria Metrics, Victoria Logs) is set up separate

 ---

-## Input
+## Scaffold Spec (Tier 2 — Conditional)

-Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)
+To scaffold a Helm chart, build a spec with context flags derived from helm + server settings and invoke the engine:

-Accepts chart name, deploy target, deployment type, and optional settings for modes, ingress, and webapp assets.
+```bash
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding apply --spec spec.json
+```

-## Root Package.json Update
+### Variables
+
+| Variable | Source |
+|----------|--------|
+| `PROJECT_NAME` | From `sdd-settings.yaml` project name |
+| `CHART_NAME` | Helm component name |
+| `CHART_DESCRIPTION` | `"Helm chart for <chart-name>"` |
+| `DEPLOYS_COMPONENT` | Name of the component this chart deploys |
+| `IS_HYBRID` | `"true"` or `"false"` |
+| `HAS_SERVICE` | `"true"` or `"false"` |
+| `HAS_INGRESS` | `"true"` or `"false"` |
+
+### Context Flags (derived from settings)
+
+| Flag | Derived From |
+|------|-------------|
+| `deploy_type` | `settings.deploy_type` (`"server"` or `"webapp"`) |
+| `is_hybrid` | `deploy_modes.length > 1` |
+| `is_cron_only` | `deploy_modes === ["cron"]` |
+| `has_api_mode` | `deploy_modes.includes("api")` |
+| `has_worker_mode` | `deploy_modes.includes("worker")` |
+| `has_cron_mode` | `deploy_modes.includes("cron")` |
+| `needs_service` | `has_api_mode && provides_contracts.length > 0` |
+| `has_ingress` | `settings.ingress === true` |
+
+### Example Spec (server chart)
+
+See the full Helm chart spec example in the task description. Each template file is a separate `template_file` operation with appropriate `when` conditions based on the pre-computed context flags.
+
+### Operations Pattern
+
+```json
+{
+  "target_dir": "<project-root>",
+  "base_dir": "<plugin-root>/skills",
+  "variables": { "CHART_NAME": "<chart-name>", "..." : "..." },
+  "context": {
+    "is_hybrid": false,
+    "is_cron_only": false,
+    "has_api_mode": true,
+    "needs_service": true,
+    "has_ingress": true
+  },
+  "operations": [
+    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/Chart.yaml", "dest": "components/helm-charts/<chart-name>/Chart.yaml" },
+    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/values.yaml", "dest": "components/helm-charts/<chart-name>/values.yaml" },
+    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/templates/_helpers.tpl", "dest": "components/helm-charts/<chart-name>/templates/_helpers.tpl" },
+    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/templates/configmap.yaml", "dest": "components/helm-charts/<chart-name>/templates/configmap.yaml" },
+    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/templates/servicemonitor.yaml", "dest": "components/helm-charts/<chart-name>/templates/servicemonitor.yaml" },
+    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/templates/deployment.yaml", "dest": "components/helm-charts/<chart-name>/templates/deployment.yaml", "when": [{ "key": "is_hybrid", "equals": false }, { "key": "is_cron_only", "equals": false }] },
+    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/templates/service.yaml", "dest": "components/helm-charts/<chart-name>/templates/service.yaml", "when": { "key": "needs_service", "equals": true } },
+    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/templates/ingress.yaml", "dest": "components/helm-charts/<chart-name>/templates/ingress.yaml", "when": { "key": "has_ingress", "equals": true } },
+    { "type": "package_json_scripts", "scripts": { "<chart-name>:lint": "helm lint components/helm-charts/<chart-name>" } }
+  ]
+}
+```

-After scaffolding, update the root `package.json`:
+## Input

-1. If root `package.json` doesn't exist, create it from the `project-scaffolding` skill template (`templates/project/package.json`)
-2. Add component scripts:
-   - `"<name>:lint": "helm lint components/helm_charts/<name>"`
+Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)
+
+Accepts chart name, deploy target, deployment type, and optional settings for modes, ingress, and webapp assets.

 ## Related Skills
```

---

## 16. [`tests/src/tests/unit/commands/scaffolding/engine.test.ts`](tests/src/tests/unit/commands/scaffolding/engine.test.ts)

New unit test file with 35 tests covering the engine's pure functions: `substituteVariables` (9 tests), `evaluateCondition` (12 tests), and `isSubstitutableFile` (14 tests).

```typescript
/**
 * Scaffolding Engine Pure Function Tests
 *
 * WHY: The scaffolding engine's pure functions (variable substitution, condition
 * evaluation, file extension detection) are core to all declarative operations.
 * Testing them in isolation ensures correctness independent of filesystem state.
 *
 * Note: Functions are copied from engine.ts to test the algorithm in isolation,
 * following the project pattern (see deep-merge.test.ts).
 */

import { describe, expect, it } from 'vitest';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Copies of pure functions from engine.ts for isolated testing
// ---------------------------------------------------------------------------

const SUBSTITUTABLE_EXTENSIONS: ReadonlySet<string> = new Set([
  '.md', '.json', '.yaml', '.yml', '.ts', '.tsx', '.html', '.css', '.js', '.sql',
]);

const isSubstitutableFile = (filePath: string): boolean =>
  SUBSTITUTABLE_EXTENSIONS.has(path.extname(filePath).toLowerCase());

const substituteVariables = (
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

interface EqualsCondition {
  readonly key: string;
  readonly equals: unknown;
}

interface NotEmptyCondition {
  readonly key: string;
  readonly not_empty: true;
}

type SingleCondition = EqualsCondition | NotEmptyCondition;
type WhenCondition = SingleCondition | readonly SingleCondition[];

const evaluateCondition = (
  when: WhenCondition | undefined,
  context: Readonly<Record<string, unknown>>
): boolean => {
  if (when === undefined) return true;

  const conditions: readonly SingleCondition[] = Array.isArray(when)
    ? (when as readonly SingleCondition[])
    : [when as SingleCondition];

  return conditions.every((cond) => {
    const value = context[cond.key];
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
// Tests
// ---------------------------------------------------------------------------

describe('substituteVariables', () => {
  it('replaces placeholders with values', () => {
    const result = substituteVariables('Hello {{NAME}}!', { NAME: 'World' });
    expect(result).toBe('Hello World!');
  });

  it('replaces multiple occurrences of the same variable', () => {
    const result = substituteVariables('{{A}} and {{A}}', { A: 'x' });
    expect(result).toBe('x and x');
  });

  it('replaces multiple different variables', () => {
    const result = substituteVariables('{{A}}-{{B}}', { A: 'hello', B: 'world' });
    expect(result).toBe('hello-world');
  });

  it('leaves unknown placeholders untouched', () => {
    const result = substituteVariables('{{KNOWN}} {{UNKNOWN}}', { KNOWN: 'yes' });
    expect(result).toBe('yes {{UNKNOWN}}');
  });

  it('adds built-in DATE variable (YYYY-MM-DD)', () => {
    const result = substituteVariables('today: {{DATE}}', {});
    expect(result).toMatch(/^today: \d{4}-\d{2}-\d{2}$/);
  });

  it('adds built-in DATE_TIME variable', () => {
    const result = substituteVariables('now: {{DATE_TIME}}', {});
    expect(result).toMatch(/^now: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });

  it('user variables override built-ins', () => {
    const result = substituteVariables('{{DATE}}', { DATE: 'custom-date' });
    expect(result).toBe('custom-date');
  });

  it('handles empty content', () => {
    const result = substituteVariables('', { NAME: 'test' });
    expect(result).toBe('');
  });

  it('handles content with no placeholders', () => {
    const result = substituteVariables('no vars here', { NAME: 'test' });
    expect(result).toBe('no vars here');
  });
});

describe('evaluateCondition', () => {
  it('returns true when when is undefined', () => {
    expect(evaluateCondition(undefined, {})).toBe(true);
  });

  it('equals: returns true on boolean match', () => {
    expect(evaluateCondition({ key: 'flag', equals: true }, { flag: true })).toBe(true);
  });

  it('equals: returns false on boolean mismatch', () => {
    expect(evaluateCondition({ key: 'flag', equals: true }, { flag: false })).toBe(false);
  });

  it('equals: works with string values', () => {
    expect(evaluateCondition({ key: 'mode', equals: 'api' }, { mode: 'api' })).toBe(true);
    expect(evaluateCondition({ key: 'mode', equals: 'api' }, { mode: 'worker' })).toBe(false);
  });

  it('not_empty: true for non-empty array', () => {
    expect(evaluateCondition({ key: 'items', not_empty: true }, { items: ['a'] })).toBe(true);
  });

  it('not_empty: false for empty array', () => {
    expect(evaluateCondition({ key: 'items', not_empty: true }, { items: [] })).toBe(false);
  });

  it('not_empty: true for non-empty string', () => {
    expect(evaluateCondition({ key: 'name', not_empty: true }, { name: 'hello' })).toBe(true);
  });

  it('not_empty: false for empty string', () => {
    expect(evaluateCondition({ key: 'name', not_empty: true }, { name: '' })).toBe(false);
  });

  it('returns false when key is missing from context', () => {
    expect(evaluateCondition({ key: 'missing', equals: true }, {})).toBe(false);
  });

  it('array AND: all true → true', () => {
    expect(
      evaluateCondition(
        [
          { key: 'a', equals: true },
          { key: 'b', equals: true },
        ],
        { a: true, b: true }
      )
    ).toBe(true);
  });

  it('array AND: one false → false', () => {
    expect(
      evaluateCondition(
        [
          { key: 'a', equals: true },
          { key: 'b', equals: true },
        ],
        { a: true, b: false }
      )
    ).toBe(false);
  });

  it('array AND: missing key in one condition → false', () => {
    expect(
      evaluateCondition(
        [
          { key: 'a', equals: true },
          { key: 'missing', equals: true },
        ],
        { a: true }
      )
    ).toBe(false);
  });
});

describe('isSubstitutableFile', () => {
  it('returns true for .ts files', () => {
    expect(isSubstitutableFile('index.ts')).toBe(true);
  });

  it('returns true for .tsx files', () => {
    expect(isSubstitutableFile('App.tsx')).toBe(true);
  });

  it('returns true for .json files', () => {
    expect(isSubstitutableFile('package.json')).toBe(true);
  });

  it('returns true for .sql files', () => {
    expect(isSubstitutableFile('001_init.sql')).toBe(true);
  });

  it('returns true for .md files', () => {
    expect(isSubstitutableFile('README.md')).toBe(true);
  });

  it('returns true for .yaml files', () => {
    expect(isSubstitutableFile('config.yaml')).toBe(true);
  });

  it('returns true for .yml files', () => {
    expect(isSubstitutableFile('ci.yml')).toBe(true);
  });

  it('returns true for .html files', () => {
    expect(isSubstitutableFile('index.html')).toBe(true);
  });

  it('returns true for .css files', () => {
    expect(isSubstitutableFile('styles.css')).toBe(true);
  });

  it('returns true for .js files', () => {
    expect(isSubstitutableFile('script.js')).toBe(true);
  });

  it('returns false for .png files', () => {
    expect(isSubstitutableFile('logo.png')).toBe(false);
  });

  it('returns false for .woff2 files', () => {
    expect(isSubstitutableFile('font.woff2')).toBe(false);
  });

  it('returns false for extensionless files', () => {
    expect(isSubstitutableFile('Makefile')).toBe(false);
  });

  it('returns false for .exe files', () => {
    expect(isSubstitutableFile('app.exe')).toBe(false);
  });
});
```

---

## 17. [`tests/src/tests/integration/scaffolding/engine-integration.test.ts`](tests/src/tests/integration/scaffolding/engine-integration.test.ts)

New integration test file with 20 tests exercising the `scaffolding apply` CLI end-to-end: error handling (7 tests), filesystem operations (5 tests), conditional operations (2 tests), non-destructive behavior (2 tests), dry-run (1 test), and full spec with real templates (3 tests).

```typescript
/**
 * Scaffolding Engine Integration Tests
 *
 * WHY: Tests the scaffolding engine through the CLI interface, verifying that
 * `scaffolding apply` correctly processes specs, creates files, substitutes
 * variables, evaluates conditions, and produces the expected output structure.
 */

import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import {
  PLUGIN_DIR,
  SKILLS_DIR,
  joinPath,
  fileExists,
  isDirectory,
  readFile,
  mkdtemp,
  rmdir,
  mkdir,
  writeFileAsync,
  runCommand,
} from '@/lib';

/** Run the scaffolding apply command via the built CLI. */
const runApply = async (
  specPath: string,
  cwd: string,
  dryRun = false
): Promise<{ exitCode: number; stdout: string; stderr: string }> => {
  const cliPath = joinPath(PLUGIN_DIR, 'system', 'dist', 'cli.js');
  const args = ['--enable-source-maps', cliPath, 'scaffolding', 'apply', '--spec', specPath];
  if (dryRun) args.push('--dry-run');
  return runCommand('node', args, { cwd, timeout: 60000 });
};

describe('Scaffolding Apply CLI', () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await mkdtemp('sdd-engine-integ-');
  });

  afterAll(async () => {
    if (tmpDir) await rmdir(tmpDir);
  });

  // -- Error handling --

  it('rejects missing --spec argument', async () => { /* ... */ });
  it('rejects nonexistent spec file', async () => { /* ... */ });
  it('rejects malformed JSON', async () => { /* ... */ });
  it('rejects spec missing required fields', async () => { /* ... */ });
  it('rejects nonexistent base_dir', async () => { /* ... */ });
  it('rejects unknown operation type', async () => { /* ... */ });
  it('rejects nonexistent target_dir', async () => { /* ... */ });

  // -- Filesystem operations --

  it('creates files from write_file operations', async () => { /* ... */ });
  it('creates directories from mkdir operations', async () => { /* ... */ });
  it('copies template files with variable substitution', async () => { /* ... */ });
  it('copies template directories recursively', async () => { /* ... */ });
  it('merges package.json scripts', async () => { /* ... */ });

  // -- Conditional operations --

  it('skips operations when condition is false', async () => { /* ... */ });
  it('executes operations when condition is true', async () => { /* ... */ });

  // -- Non-destructive behavior --

  it('skips existing files by default', async () => { /* ... */ });
  it('overwrites with if_exists: overwrite', async () => { /* ... */ });

  // -- Dry run --

  it('dry run creates no files', async () => { /* ... */ });

  // -- Full spec with real templates --

  it('applies a frontend component spec using real templates', async () => { /* ... */ });
  it('applies a backend component spec with conditional operations', async () => { /* ... */ });
  it('applies a project structure spec', async () => { /* ... */ });
});
```

---

## 18. [`plugin/.claude-plugin/plugin.json`](plugin/.claude-plugin/plugin.json)

Version bump from 6.6.4 to 6.7.0.

```diff
diff --git a/plugin/.claude-plugin/plugin.json b/plugin/.claude-plugin/plugin.json
index 39a1642..4beb5da 100644
--- a/plugin/.claude-plugin/plugin.json
+++ b/plugin/.claude-plugin/plugin.json
@@ -1,6 +1,6 @@
 {
   "name": "sdd",
-  "version": "6.6.4",
+  "version": "6.7.0",
   "description": "Spec-driven development methodology for full-stack teams",
   "author": {
     "name": "Lior Cohen"
```

---

## 19. [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json)

Version bump from 6.6.4 to 6.7.0.

```diff
diff --git a/.claude-plugin/marketplace.json b/.claude-plugin/marketplace.json
index 43177b2..2b699f7 100644
--- a/.claude-plugin/marketplace.json
+++ b/.claude-plugin/marketplace.json
@@ -8,7 +8,7 @@
       "name": "sdd",
       "source": "./plugin",
       "description": "Spec-driven development (SDD) plugin for Claude Code — 7 specialized AI agents, phased implementation plans, and verified code generation for full-stack teams",
-      "version": "6.6.4"
+      "version": "6.7.0"
     }
   ]
 }
```

---

## 20. [`changelog/v6.md`](changelog/v6.md)

Added 6.7.0 changelog entry documenting the scaffolding engine: new features, refactored modules, removed npm-run-all and meta-scripts, and rationale.

```diff
diff --git a/changelog/v6.md b/changelog/v6.md
index a8de3d7..fe12edd 100644
--- a/changelog/v6.md
+++ b/changelog/v6.md
@@ -4,17 +4,34 @@ All notable changes for major version 6 of the SDD plugin.

 ---

-## Infrastructure - 2026-02-10
+## [6.7.0] - 2026-02-10

 ### Added

-- **Task #119**: Add session hook with blurb and plugin update check
-  - New medium-priority task for creating a session start hook
-  - Displays welcome message, checks for updates, shows quick command reference
-- **Task #118**: Upgrade all JSON schemas to latest stable version (2020-12)
-  - New high-priority task to audit and upgrade all JSON schema references from draft-7 to 2020-12
-  - Scope includes skills, agents, commands, manifests, settings, and component schemas
-- **Task #17**: Added plan reference link
+- **scaffolding-engine**: Generic declarative scaffolding engine in system CLI (`scaffolding apply --spec <path>`)
+  - 5 operation types: `template_dir`, `template_file`, `mkdir`, `write_file`, `package_json_scripts`
+  - Conditional operations via `when` clauses with `equals` and `not_empty` operators
+  - Non-destructive by default (`if_exists: "skip"`), opt-in overwrite
+  - Variable substitution with `{{VAR}}` syntax and built-in `DATE`/`DATE_TIME` variables
+  - Dry-run support (`--dry-run` flag)
+  - JSON Schema validation for spec format
+- **engine tests**: 35 unit tests for pure functions, 19 integration tests via CLI
+
+### Changed
+
+- **scaffolding/project.ts**: Refactored to use engine internally — builds a `ScaffoldSpec` and delegates to `executeSpec`
+- **component skills**: All 6 component scaffolding skills updated with declarative spec sections (Tier 1-3)
+- **orchestrator skill**: Updated to describe engine-based scaffolding workflow
+- **project-scaffolding skill**: Updated to reference engine integration
+
+### Removed
+
+- **npm-run-all**: Removed from project template devDependencies (meta-scripts dropped)
+- **meta-scripts**: Removed `generateMetaScripts()` and orchestration scripts (`dev`, `build`, `test`, `start`)
+
+### Rationale
+
+Scaffolding logic was split between the system CLI (file operations) and component skills (conditional logic in prose). The engine unifies deterministic operations into a single declarative spec, reducing LLM interpretation errors and enabling dry-run validation.

 ---
```
