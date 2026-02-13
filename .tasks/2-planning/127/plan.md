---
title: Fix system CLI TypeScript standards violations from audit
created: 2026-02-12 18:30 UTC
updated: 2026-02-13 09:45 UTC
---

# Plan: Fix System CLI TypeScript Standards Violations from Audit

## Problem Summary

The 2026-02-12 audit found 40 TypeScript standards violations in `plugin/system/src/`. All are style/consistency issues — no correctness bugs. This task fixes them in 8 focused change groups.

## Scope Clarifications

**Barrel file imports:** The audit flagged 2 missing barrel files (`lib/`, `types/`) and 15 "direct implementation file imports." Of the 15:
- 6 are `settings/*.ts` files using relative paths `../types/settings` — fixed by Change 2
- 9 are intra-command sibling imports (e.g., `database/reset.ts` importing from `./teardown`) — these are **excluded** because: (a) no barrel file exists for command subdirectories, (b) creating one would introduce circular dependencies since `index.ts` → `handler.ts` → dispatches to action files → would import back from `index.ts`, (c) these are internal implementation details of a single command namespace

**Existing `@/lib/<module>` imports:** 115 imports across 51 files use the `@/lib/<module>` pattern (e.g., `@/lib/args`). These were NOT flagged by the audit. The barrel files created here serve as the canonical import path for future code. Migrating existing imports is out of scope — it's a separate, larger task.

**`types/settings` runtime exports:** The `types/settings.ts` file exports both types AND runtime values (10 type guard functions: `isServerComponent`, `isWebappComponent`, `isHelmComponent`, `isDatabaseComponent`, `isContractComponent`, `isConfigComponent`, `isTestingComponent`, `isCicdComponent`, `isHelmServerSettings`, `isHelmWebappSettings`). The `types/index.ts` barrel must use `export { ... }` (not `export type { ... }`) for these values.

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/system/src/lib/index.ts` | **New** — barrel file re-exporting all 8 `lib/` modules |
| `plugin/system/src/types/index.ts` | **New** — barrel file re-exporting all 5 `types/` modules |
| `plugin/system/src/settings/reconcile.ts` | Replace `../types/settings` with `@/types` |
| `plugin/system/src/settings/defaults.ts` | Replace `../types/settings` with `@/types` |
| `plugin/system/src/settings/sync-helm.ts` | Replace `../types/settings` with `@/types` |
| `plugin/system/src/settings/validate.ts` | Replace `../types/settings` with `@/types` |
| `plugin/system/src/settings/index.ts` | Replace `../types/settings` with `@/types` |
| `plugin/system/src/settings/sync.ts` | Replace `../types/settings` with `@/types` |
| `plugin/system/tsconfig.json` | Update `"lib": ["ES2022"]` → `"lib": ["ES2023"]` for `toSorted()` |
| `plugin/system/src/commands/database/migrate.ts` | `.sort()` → `.toSorted()`, remove redundant spread |
| `plugin/system/src/commands/database/seed.ts` | `.sort()` → `.toSorted()`, remove redundant spread |
| `plugin/system/src/commands/spec/generate-index.ts` | `.sort()` → `.toSorted()` (3 occurrences), remove redundant spreads |
| `plugin/system/src/commands/spec/generate-snapshot.ts` | `.sort()` → `.toSorted()` (2 occurrences), remove redundant spread on line 80 |
| `plugin/system/src/commands/env/providers/index.ts` | Extract logic to `state.ts`, keep only re-exports |
| `plugin/system/src/commands/env/providers/state.ts` | **New** — extracted provider state management logic |
| `plugin/system/src/commands/hook/prompt-commit.ts` | Replace `readStdin()` with `node:stream/consumers` `text()` |
| `plugin/system/src/commands/hook/validate-write.ts` | Replace `readStdin()` with `node:stream/consumers` `text()` |
| `plugin/system/src/commands/scaffolding/apply.ts` | Replace lazy Map cache with eager IIFE; update call site at line 80 |
| `plugin/system/src/commands/env/config.ts` | Add `Readonly<>` to inner `databases` object type |
| `plugin/system/src/cli.ts` | Add `node:` prefix to `fs` and `path` imports |
| `plugin/system/src/lib/logger.ts` | Add `node:` prefix to `fs` and `path` imports |

## Changes

### 1. Create Barrel Files for `lib/` and `types/`

**`lib/index.ts`** — re-export all 8 modules. No name conflicts (verified: all export names are unique across modules):

```typescript
export { parseArgs, parseNamedArgs, outputResult } from './args';
export type { GlobalOptions, ParsedArgs, CommandResult } from './args';

export { loadProjectConfig, findProjectRoot, getPluginRoot, getSkillsDir } from './config';
export type { SddConfig, ConfigResult, ProjectRootResult } from './config';

export { parseFrontmatter, parseSpec, extractOverview } from './frontmatter';
export type { Frontmatter, FrontmatterResult, ParsedSpec } from './frontmatter';

export { exists, isDirectory, isFile, walkDir, readText, readJson, writeText, writeJson, copyFile, ensureDir, relativePath, joinPath, dirname, basename, extname } from './fs';

export { compileSchema, validateAgainstSchema } from './json-schema';
export type { JsonSchema, SchemaValidationError, SchemaValidateFunction } from './json-schema';

export { createLogger, success, error, createFileLogger } from './logger';
export type { Logger, FileLoggerOptions, FileLoggerResult } from './logger';

export { validateArgs, formatValidationErrors, generateSchemaHelp } from './schema-validator';
export type { SchemaProperty, CommandSchema, ValidationError, PropertyValidationResult, ValidationResult } from './schema-validator';

export { EXCLUDED_FILES, isExcludedFile, findSpecFiles, directoryExists } from './spec-utils';
export type { SpecFile } from './spec-utils';
```

**`types/index.ts`** — re-export all 5 modules. Runtime values use `export { ... }`, type-only use `export type { ... }`:

```typescript
export type { ComponentEntry, ScaffoldingConfig, ScaffoldingResult, DomainConfig, UserPersona, PopulationResult } from './component';

export type { VersionInfo, PluginJson, MarketplaceJson, MarketplacePlugin, HookInput, HookToolInput, PreToolUseHookOutput, PostToolUseHookOutput } from './config';

// settings: types
export type { ServerMode, ServerType, ServerSettings, WebappSettings, HelmAssets, HelmServerSettings, HelmWebappSettings, HelmSettings, DatabaseProvider, DatabaseSettings, ContractVisibility, ContractSettings, ConfigSettings, TestingSettings, CicdSettings, LogLevel, LoggingSettings, SystemSettings, ComponentType, ComponentSettingsMap, ComponentSettings, ComponentBase, ServerComponent, WebappComponent, HelmComponent, DatabaseComponent, ContractComponent, ConfigComponent, TestingComponent, CicdComponent, Component, SddMetadata, ProjectMetadata, SettingsFile } from './settings';
// settings: runtime type guards (NOT export type)
export { isServerComponent, isWebappComponent, isHelmComponent, isDatabaseComponent, isContractComponent, isConfigComponent, isTestingComponent, isCicdComponent, isHelmServerSettings, isHelmWebappSettings } from './settings';

// spec: types
export type { ValidationError, SpecEntry, ActiveSpec, SpecType, ChangeType } from './spec';
// spec: runtime values
export { PRODUCT_SPEC_REQUIRED_FIELDS, TECH_SPEC_REQUIRED_FIELDS, REQUIRED_FIELDS, VALID_SPEC_TYPES, VALID_CHANGE_TYPES, VALID_STATUSES, PLACEHOLDER_ISSUES } from './spec';

// workflow: types
export type { SpecStatus, PlanStatus, ImplStatus, ReviewStatus, WorkflowPhase, WorkflowItem, WorkflowState, WorkflowProgress, PhaseGateResult, BlockingItem, OpenQuestion } from './workflow';
// workflow: runtime values
export { VALID_SPEC_STATUSES, VALID_PLAN_STATUSES, VALID_IMPL_STATUSES, VALID_REVIEW_STATUSES, VALID_WORKFLOW_PHASES } from './workflow';
```

### 2. Fix Settings Path Alias Imports

All 6 files in `settings/` import from `'../types/settings'` using relative paths. Replace with `'@/types'` (through the new barrel file). Import specifiers stay the same — only the module path changes.

**Before → After for each file:**

**`settings/reconcile.ts:11`**
```diff
-import type { SettingsFile, ComponentType, LogLevel } from '../types/settings';
+import type { SettingsFile, ComponentType, LogLevel } from '@/types';
```

**`settings/defaults.ts:8-16`**
```diff
-import type {
-  ServerSettings,
-  WebappSettings,
-  HelmServerSettings,
-  HelmWebappSettings,
-  DatabaseSettings,
-  ContractSettings,
-  ConfigSettings,
-} from '../types/settings';
+import type {
+  ServerSettings,
+  WebappSettings,
+  HelmServerSettings,
+  HelmWebappSettings,
+  DatabaseSettings,
+  ContractSettings,
+  ConfigSettings,
+} from '@/types';
```

**`settings/sync-helm.ts:7-14`** (two import statements)
```diff
-import type {
-  Component,
-  HelmComponent,
-  HelmSettings,
-  HelmServerSettings,
-  ServerSettings,
-} from '../types/settings';
-import { isServerComponent, isHelmComponent, isHelmServerSettings } from '../types/settings';
+import type {
+  Component,
+  HelmComponent,
+  HelmSettings,
+  HelmServerSettings,
+  ServerSettings,
+} from '@/types';
+import { isServerComponent, isHelmComponent, isHelmServerSettings } from '@/types';
```

**`settings/validate.ts:7-21`** (two import statements)
```diff
-import type {
-  Component,
-  ServerSettings,
-  HelmSettings,
-  SettingsFile,
-  ServerMode,
-} from '../types/settings';
-import {
-  isServerComponent,
-  isWebappComponent,
-  isHelmComponent,
-  isDatabaseComponent,
-  isContractComponent,
-  isHelmServerSettings,
-} from '../types/settings';
+import type {
+  Component,
+  ServerSettings,
+  HelmSettings,
+  SettingsFile,
+  ServerMode,
+} from '@/types';
+import {
+  isServerComponent,
+  isWebappComponent,
+  isHelmComponent,
+  isDatabaseComponent,
+  isContractComponent,
+  isHelmServerSettings,
+} from '@/types';
```

**`settings/index.ts:12-59`** (two re-export blocks)
```diff
-} from '../types/settings';
+} from '@/types';

 // Re-export type guards
 export {
   ...
-} from '../types/settings';
+} from '@/types';
```

**`settings/sync.ts:8-16`** (two import statements)
```diff
-import type {
-  Component,
-  ComponentType,
-  ServerSettings,
-  WebappSettings,
-  HelmSettings,
-  SettingsFile,
-} from '../types/settings';
-import { isServerComponent, isHelmComponent } from '../types/settings';
+import type {
+  Component,
+  ComponentType,
+  ServerSettings,
+  WebappSettings,
+  HelmSettings,
+  SettingsFile,
+} from '@/types';
+import { isServerComponent, isHelmComponent } from '@/types';
```

### 3. Replace `.sort()` with `.toSorted()`

**Prerequisite:** `toSorted()` is ES2023. Current `tsconfig.json` has `"lib": ["ES2022"]` (line 10) — TypeScript won't recognize `toSorted()` without this update:

**`plugin/system/tsconfig.json:10`**
```diff
-    "lib": ["ES2022"],
+    "lib": ["ES2023"],
```

`ES2023` is a superset of `ES2022` — no other config changes needed. Node.js v25.6.0 supports `toSorted()` natively.

7 occurrences across 4 files. `walkDir` returns `Promise<readonly string[]>` (verified at `lib/fs.ts:47`). `toSorted()` works on readonly arrays and returns a new mutable array.

**`database/migrate.ts:73-74`**
```diff
-  const migrationFiles = [...(await walkDir(migrationsDir, (entry) => entry.name.endsWith('.sql')))]
-    .sort();
+  const migrationFiles = (await walkDir(migrationsDir, (entry) => entry.name.endsWith('.sql')))
+    .toSorted();
```

**`database/seed.ts:73`**
```diff
-  const seedFiles = [...(await walkDir(seedsDir, (entry) => entry.name.endsWith('.sql')))].sort();
+  const seedFiles = (await walkDir(seedsDir, (entry) => entry.name.endsWith('.sql'))).toSorted();
```

**`spec/generate-index.ts:67`**
```diff
-      ? [...activeSpecs].sort((a, b) => a.created.localeCompare(b.created)).map(formatTableRow)
+      ? activeSpecs.toSorted((a, b) => a.created.localeCompare(b.created)).map(formatTableRow)
```

**`spec/generate-index.ts:76-77`**
```diff
-          ...[...deprecatedSpecs]
-            .sort((a, b) => a.created.localeCompare(b.created))
+          ...deprecatedSpecs
+            .toSorted((a, b) => a.created.localeCompare(b.created))
```

**`spec/generate-index.ts:88-89`**
```diff
-          ...[...archivedSpecs]
-            .sort((a, b) => a.created.localeCompare(b.created))
+          ...archivedSpecs
+            .toSorted((a, b) => a.created.localeCompare(b.created))
```

**`spec/generate-snapshot.ts:46`**
```diff
-  const domains = Object.keys(byDomain).sort();
+  const domains = Object.keys(byDomain).toSorted();
```

**`spec/generate-snapshot.ts:80`**
```diff
-            const sorted = [...domainSpecs].sort((a, b) => a.title.localeCompare(b.title));
+            const sorted = domainSpecs.toSorted((a, b) => a.title.localeCompare(b.title));
```

### 4. Extract Logic from `providers/index.ts`

Current file (146 lines) contains full implementations of `readState`, `writeState`, `getProvider`, `getClusterProvider`, `persistClusterProvider`, `removeClusterProvider`, `detectProvider`, `checkPrerequisites`, plus the `providers` dispatch record, types `ClusterState` and `ClusterProviderResult`, and constants `STATE_DIR`/`STATE_FILE`.

**`providers/state.ts`** — move ALL content from current `providers/index.ts` verbatim (lines 1-145). No logic changes needed.

**`providers/index.ts`** — replace with re-exports of only the currently exported functions (preserving the existing public API — `kindProvider`, `minikubeProvider`, `dockerDesktopProvider` are internal imports today and stay internal):

```typescript
export { getProvider, getClusterProvider, persistClusterProvider, removeClusterProvider, detectProvider, checkPrerequisites } from './state';
```

Consumers importing from `providers/index.ts` (or `providers/`) need no changes — the barrel path and exported names stay the same.

### 5. Replace Mutable Stdin Pattern

Both hook files have identical `readStdin()` implementations (verified: prompt-commit.ts:66-73, validate-write.ts:109-116).

**Current** (`prompt-commit.ts:66-73`):
```typescript
const readStdin = (): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: string[] = [];                            // ← mutable type
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk: string) => { chunks.push(chunk); });  // ← mutable .push()
    process.stdin.on('end', () => { resolve(chunks.join('')); });
    process.stdin.on('error', reject);
  });
```

**After** (both files):
```typescript
import { text } from 'node:stream/consumers';

const readStdin = (): Promise<string> => text(process.stdin);
```

This eliminates `.push()`, `string[]`, and the manual event wiring. `text()` reads the stream to completion and returns UTF-8 by default, matching the current `setEncoding('utf8')` behavior. Also remove the JSDoc comment block above each function since it described the old accumulation approach.

**Acceptance criteria coverage:** This change satisfies three criteria simultaneously: (1) "Stdin `.push()` replaced with immutable pattern", (2) "`string[]` types changed to `ReadonlyArray<string>` for stdin chunks" — the `string[]` type is eliminated entirely rather than changed, because the function that used it no longer exists, and (3) the mutable `.push()` is gone.

### 6. Replace Mutable Map Cache in `apply.ts`

**Current** (`apply.ts:20-32`):
```typescript
/** Load and compile the JSON Schema validator (lazy singleton via Map). */
const getSchemaValidator = (() => {
  const cache = new Map<string, SchemaValidateFunction>();  // ← mutable Map
  return (): SchemaValidateFunction => {
    const existing = cache.get('validator');
    if (existing) return existing;
    const schemaPath = join(dirname(fileURLToPath(import.meta.url)), 'scaffold-spec.schema.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as JsonSchema;
    const validate = compileSchema(schema);
    cache.set('validator', validate);                       // ← mutable .set()
    return validate;
  };
})();
```

**After** (`apply.ts`):
```typescript
/** Compiled JSON Schema validator (eager — module loads only when scaffolding apply runs). */
const schemaValidator: SchemaValidateFunction = (() => {
  const schemaPath = join(dirname(fileURLToPath(import.meta.url)), 'scaffold-spec.schema.json');
  const schema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as JsonSchema;
  return compileSchema(schema);
})();
```

Eager evaluation is safe because `apply.ts` is dynamically imported (`await import('./apply')` in `handler.ts:40`) — the module only loads when the `scaffolding apply` action runs.

**Call site update** (`apply.ts:80`):
```diff
-  const validate = getSchemaValidator();
+  const validate = schemaValidator;
```

### 7. Add `readonly` to Inner Database Object Type

**Current** (`config.ts:33-36`):
```typescript
type LocalConfigUrls = {
  readonly databases: Readonly<Record<string, { host: string; port: number }>>;
  readonly services: Readonly<Record<string, string>>;
}
```

**After**:
```diff
-  readonly databases: Readonly<Record<string, { host: string; port: number }>>;
+  readonly databases: Readonly<Record<string, Readonly<{ host: string; port: number }>>>;
```

### 8. Add `node:` Prefix to Node.js Imports

**`cli.ts:20-21`**
```diff
-import { readFileSync } from 'fs';
-import { join } from 'path';
+import { readFileSync } from 'node:fs';
+import { join } from 'node:path';
```

**`lib/logger.ts:5-6`**
```diff
-import { mkdirSync } from 'fs';
-import { join } from 'path';
+import { mkdirSync } from 'node:fs';
+import { join } from 'node:path';
```

## Dependencies

Changes 1 → 2 (barrel files must exist before updating import paths).

All other changes are independent and can be done in any order.

## Tests

### Unit Tests

Existing tests must continue to pass — no new tests needed since these are mechanical refactors with no behavior changes:

- [ ] `test_settings_sync_produces_correct_output`
- [ ] `test_database_migrate_sorts_files_correctly`
- [ ] `test_database_seed_sorts_files_correctly`
- [ ] `test_scaffolding_apply_validates_schema`
- [ ] `test_hook_prompt_commit_reads_stdin`
- [ ] `test_hook_validate_write_reads_stdin`
- [ ] `test_provider_detection_works`
- [ ] `test_provider_state_persistence`

### Integration Tests

- [ ] `test_build_succeeds` — `npm run build:plugin` passes
- [ ] `test_all_imports_resolve` — no broken imports after barrel file changes

## Verification

- [ ] `npm run typecheck:plugin` passes with zero errors
- [ ] `npm run build:plugin` produces working dist output
- [ ] `npm test` — all existing tests pass
- [ ] No `.sort()` calls remain (only `.toSorted()`)
- [ ] No `../types/settings` imports in `settings/` (all use `@/types`)
- [ ] `providers/index.ts` contains only re-exports
- [ ] No bare `fs` or `path` imports (all use `node:` prefix)
- [ ] No mutable `.push()` in hook files
- [ ] No `Map.set()` in `apply.ts`
