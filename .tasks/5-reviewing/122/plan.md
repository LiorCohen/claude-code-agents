---
title: Fix TypeScript standards violations in plugin/system
created: 2026-02-10
updated: 2026-02-10
---

# Plan: Fix TypeScript standards violations in plugin/system

## Problem Summary

A line-by-line audit of all 73 TypeScript files in `plugin/system/src/` against the project's typescript-standards revealed widespread violations. Every file was read and checked manually.

**Standards updated by task #123:** The typescript-standards skill was expanded with 16 new patterns including `interface` vs `type` rules, `void` return type ban, `| null` → result unions, semantic type aliases, `import type`, and more. This plan incorporates all violations against the updated standards.

### Violation counts (from actual file reads)

| Category | Count | Description |
|----------|-------|-------------|
| `interface` for data shapes | ~105 | Should be `type` (only Logger and ClusterProviderOps stay as `interface`) |
| `.push()` calls | ~150 | Array mutation via push |
| `T[]` mutable array types | ~100 | Should be `ReadonlyArray<T>` or `readonly T[]` |
| `let` declarations | ~35 | Should be `const` with functional patterns |
| Direct property mutation | ~25 | `obj[key] = value`, `obj.prop = value` |
| Mutable `Record<K,V>` | ~30 | Should be `Readonly<Record<K,V>>` |
| `void` / `Promise<void>` returns | ~20 | Functions must return values |
| `T \| null` returns / fields | ~15 | Use result unions or optional fields |
| `as` casts circumventing readonly | ~15 | Casting to mutable types to enable mutation |
| `delete` operator | 4 | Banned — use destructuring rest |
| `++`/`--` operators | ~10 | Variable mutation — use functional patterns |
| `Object.assign()` | 2 | Banned — use spread |
| Mutable `Set.add()` / `Map.set()` | ~5 | Use immutable construction |
| `.sort()` on non-spread arrays | ~2 | Use `[...arr].sort()` or `.toSorted()` |
| Index files with logic | 12 | Should be pure re-exports |

### Files with violations: 50 of 73

### Clean files: 23 of 73

**Confirmed clean rules (zero violations across entire codebase):** `function` keyword, `class` keyword, `export default`, `require()`, `var`, `any` types, file extensions in imports, deep relative imports, utility library imports, `import type` compliance, `??` vs `||` usage. All interface properties have 100% `readonly`.

## Violation Categories

### A. `.push()` → immutable array operations

Replace `.push()` with `[...arr, item]`, `.concat()`, `.reduce()`, `.flatMap()`, or `.map()`.

### B. `T[]` → `ReadonlyArray<T>`

Every local array variable typed as `T[]` must become `ReadonlyArray<T>` (or `readonly T[]`). Intertwined with (A) — can't use readonly arrays with `.push()`.

### C. `Record<K,V>` → `Readonly<Record<K,V>>`

Mutable `Record` types in return types, local variables, and parameters must be wrapped in `Readonly<>`. Property assignment on records must be replaced with spread or `Object.fromEntries()`.

### D. `let` → `const`

Replace `let` with `const` using conditional expressions, functional chaining, ternaries, or immediately-invoked patterns.

### E. Direct property mutation → spread

Replace `obj.prop = value` and `obj[key] = value` with `{ ...obj, [key]: value }`. Replace `Object.assign()` with object spread.

### F. Mutable Set/Map → immutable construction

Replace `Set.add()` with `new Set([...set, item])`. Replace `Map.set()` with `new Map([...map, [key, value]])` or `ReadonlyMap`.

### G. Index files → pure re-exports

Extract routing/dispatch logic from index.ts files into dedicated `handler.ts` files. Index files become pure import/export modules.

### H. `delete` operator → destructuring rest

Replace `delete obj[key]` with `const { [key]: _, ...rest } = obj`.

### I. `as` casts circumventing readonly → proper immutable construction

Replace patterns like `(options as { json: boolean }).json = true` with immutable alternatives. Replace `as Record<string, unknown>` casting from `unknown` with proper type narrowing where possible.

### J. `++`/`--` operators → functional alternatives

Replace `counter++` with `counter + 1` in expressions, or restructure loops to avoid mutable counters entirely using `.reduce()`, `.map()` with index, or `Array.from()`.

### K. `.sort()` on references → `.toSorted()` or `[...arr].sort()`

Avoid in-place mutation of arrays via `.sort()`.

### L. `interface` for data shapes → `type` *(NEW from task #123)*

The standard requires `interface` only for function-only contracts (callbacks, loggers, handlers). All data shapes must use `type`. Only two interfaces in the codebase should remain as `interface`:
- `Logger` (lib/logger.ts) — function-only contract
- `ClusterProviderOps` (env/types.ts) — handler/provider contract

All other ~105 interfaces across ~30 files must become `type`.

### M. `void` / `Promise<void>` return types → return values *(NEW from task #123)*

The standard bans `void` return types except in callback signatures within interface contracts (like `Logger`). Standalone functions must return meaningful values.

Affected standalone functions (~20):
- `lib/fs.ts`: writeText, writeJson, copyFile, ensureDir → return path written
- `lib/logger.ts`: success, error → return message
- `lib/args.ts`: outputResult → return formatted string
- `commands/env/providers/index.ts`: writeState, persistClusterProvider, removeClusterProvider → return state
- `commands/env/deploy.ts`: waitForDatabase → return success indicator
- `commands/env/create.ts`: installInfrastructure → return success indicator
- `commands/scaffolding/domain.ts`: updateSnapshot → return success indicator
- `commands/workflow/check-gate.ts`: processItem (local) → restructure to return accumulated data

Also affects `ClusterProviderOps` interface methods (create, destroy, start, stop return `Promise<void>`). These should return a result type, cascading to all 3 provider implementations.

### N. `| null` returns and type fields → result unions / optional fields *(NEW from task #123)*

The standard says: never return `null` from your own functions — use result unions. For type fields, use `?:` (optional) instead of `| null`.

Functions returning `T | null` (~11):
- `lib/frontmatter.ts`: parseFrontmatter() → result union
- `lib/config.ts`: loadProjectConfig(), findProjectRoot() → result unions
- `lib/schema-validator.ts`: validateProperty() → result union
- `lib/logger.ts`: createFileLogger() → result union
- `commands/version/bump.ts`: parseVersion() → result union
- `commands/hook/prompt-commit.ts`: findMatchingDir() → result union
- `commands/hook/validate-write.ts`: matchesBlockedPattern() → result union
- `cli.ts`: loadLoggingConfig() → result union
- `commands/env/providers/index.ts`: getClusterProvider() → result union
- `commands/env/check-tools.ts`: detectPackageManager() → result union

Type fields with `| null` (~5):
- `lib/frontmatter.ts`: `frontmatter: Frontmatter | null` → `frontmatter?: Frontmatter`
- `lib/spec-utils.ts`: `frontmatter: Frontmatter | null` → `frontmatter?: Frontmatter`
- `commands/env/status.ts`: `provider: ClusterProvider | null` → `provider?: ClusterProvider`
- `commands/env/check-tools.ts`: `version: string | null`, `installHint: string | null`, `packageManager: string | null` → optional fields

## Complete Per-File Audit

### 100% CLEAN — No violations (23 files)

**Settings (3 files):**
- `settings/defaults.ts`, `settings/schema.ts`, `settings/index.ts`

**Commands — env (8 files):**
- `env/destroy.ts`, `env/start.ts`, `env/stop.ts`, `env/restart.ts`, `env/infra.ts`
- `env/providers/kind.ts`, `env/providers/minikube.ts`, `env/providers/docker-desktop.ts`

Note: Provider files implement `ClusterProviderOps` which has `Promise<void>` methods. The violation is in the interface definition (`env/types.ts`); implementations will update to match when the interface changes.

**Commands — database (5 files):**
- `database/port-forward.ts`, `database/psql.ts`, `database/setup.ts`, `database/teardown.ts`, `database/reset.ts`

**Commands — contract (2 files):**
- `contract/generate-types.ts`, `contract/validate.ts`

**Commands — other (1 file):**
- `config/add-env.ts`

### FILES WITH VIOLATIONS — Complete list

#### Batch 0: Types layer (L-only — mechanical `interface` → `type` conversion)

**`types/settings.ts`** — 21 violations
- (L) 21 `interface` declarations should be `type`: ServerSettings, WebappSettings, HelmServerSettings, HelmWebappSettings, DatabaseSettings, ContractSettings, LoggingSettings, SystemSettings, ComponentSettingsMap, ComponentBase, ServerComponent, WebappComponent, HelmComponent, DatabaseComponent, ContractComponent, ConfigComponent, TestingComponent, CicdComponent, SddMetadata, ProjectMetadata, SettingsFile

**`types/component.ts`** — 6 violations
- (L) 6 `interface` declarations should be `type`: ComponentEntry, ScaffoldingConfig, ScaffoldingResult, DomainConfig, UserPersona, PopulationResult

**`types/config.ts`** — 8 violations
- (L) 8 `interface` declarations should be `type`: VersionInfo, PluginJson, MarketplaceJson, MarketplacePlugin, HookInput, HookToolInput, PreToolUseHookOutput, PostToolUseHookOutput

**`types/spec.ts`** — 3 violations
- (L) 3 `interface` declarations should be `type`: ValidationError, SpecEntry, ActiveSpec

**`types/workflow.ts`** — 6 violations
- (L) 6 `interface` declarations should be `type`: WorkflowItem, WorkflowState, WorkflowProgress, PhaseGateResult, BlockingItem, OpenQuestion

**`env/types.ts`** — 2 violations
- (L) 2 `interface` declarations should be `type`: EnvironmentConfig, InfrastructureConfig
- Note: ClusterProviderOps correctly stays as `interface` (function contract), but its `Promise<void>` methods are an (M) violation — fix in Batch 1

#### Batch 1: Lib layer (foundational — other files depend on these)

**`lib/args.ts`** — 19 violations
- (A) `.push()` at lines 63, 66, 75, 112
- (B) `string[]` at lines 29, 91
- (C) `Record<string, string>` at line 90
- (D) `let namespace`, `let action`, `let i` at lines 36-38
- (E) `named[key] = value` property mutation at lines 105, 108
- (I) `(options as { json: boolean }).json = true` — cast-then-mutate at lines 52, 55, 59
- (L) GlobalOptions, ParsedArgs, CommandResult should be `type`
- (M) `outputResult(): void` at line 123

**`lib/frontmatter.ts`** — 6 violations
- (C) `Record<string, string>` at line 22
- (E) `frontmatter[key] = value` at line 28
- (L) Frontmatter, ParsedSpec should be `type`
- (N) `parseFrontmatter(): Frontmatter | null` at line 18; `frontmatter: Frontmatter | null` field at line 10

**`lib/config.ts`** — 4 violations
- (D) `let currentDir` at line 69
- (L) SddConfig should be `type`
- (N) `loadProjectConfig(): Promise<SddConfig | null>` at line 45; `findProjectRoot(): Promise<string | null>` at line 68

**`lib/schema-validator.ts`** — 13 violations
- (A) `.push()` at lines 196, 212, 228, 268, 270, 287
- (B) `ValidationError[]` at line 188, `string[]` at line 261
- (D) `for (let i = 0; ...)` at line 165
- (L) SchemaProperty, CommandSchema, ValidationError, ValidationResult should be `type`
- (N) `validateProperty(): ValidationError | null` at line 61

**`lib/fs.ts`** — 4 violations
- (M) `writeText(): Promise<void>` at line 88; `writeJson(): Promise<void>` at line 96; `copyFile(): Promise<void>` at line 103; `ensureDir(): Promise<void>` at line 111

**`lib/logger.ts`** — 4 violations
- (L) FileLoggerOptions should be `type`
- (M) `success(): void` at line 73; `error(): void` at line 77
- (N) `createFileLogger(): pino.Logger | null` at line 108

**`lib/spec-utils.ts`** — 1 violation
- (N) `frontmatter: Frontmatter | null` field at line 15 → should be `frontmatter?: Frontmatter`

#### Batch 2: Settings modules (heavily mutating, core infrastructure)

**`settings/validate.ts`** — 17 violations
- (A) `.push()` at lines 48, 58, 104, 115, 127, 131, 145, 182, 249, 253, 257, 264, 308, 313, 352-366
- (B) `SettingsValidationError[]` at lines 44, 75, 223, 275, 348, 349; `string[]` at line 381
- (F) `new Map<string, string[]>()` with `.set()` at lines 305, 314
- (L) SettingsValidationError, SettingsValidationResult should be `type`

**`settings/reconcile.ts`** — 23 violations
- (A) `.push()` at lines 89, 96, 105, 117, 126, 142, 149, 158, 165, 181, 187, 215, 221, 261, 269, 303
- (B) `ReconciliationChange[]` at line 64, `ReconciliationWarning[]` at line 65
- (C) `as Record<string, unknown>` casts at lines 67-71
- (D) `let initializedByPluginVersion`, `let initializedAt`, `let updatedAt`, `let path`, `let system` at lines 84, 114, 136, 205, 242
- (L) ReconciliationChange, ReconciliationWarning, ReconciliationResult should be `type`

**`settings/sync.ts`** — 22 violations
- (A) `.push()` at lines 63, 67, 79, 111, 180, 183-195, 209, 213, 216, 219, 224, 235
- (B) `Component[]` at lines 51-52; `string[]` at lines 97, 173-175, 339
- (C) `Record<string, unknown>` return types at lines 259, 314; mutable Record locals at lines 260, 282, 296, 315; `Record<ComponentType, string>` at line 132
- (E) Property mutations: `config['port']`, `config['queue']`, `config['databases']`, `config['apis']`, `databases[db]`, `apis[contract]`
- (L) SyncResult, SettingsDiff should be `type`

**`settings/sync-helm.ts`** — 16 violations
- (A) `.push()` at lines 45, 48, 51, 55, 57, 66, 71, 87
- (B) `string[]` at lines 32, 84
- (C) `Record<string, unknown>` return types at lines 127-128, 228-229; mutable locals
- (E) `values[mode] = ...`, `values['replicaCount'] = ...` at lines 175, 186-190, 198, 206, 270
- (L) HelmTemplateSet should be `type`

#### Batch 3: Command implementations — config

**`commands/config/generate.ts`** — 10 violations
- (C) `type ConfigObject = Record<string, unknown>` without Readonly at line 17
- (D) `let mergedConfig` at line 99
- (E) `result[key] = value` at lines 41, 47
- (H) `delete result[key]` at line 32; `delete schema['$schema']` at line 106

**`commands/config/diff.ts`** — 11 violations
- (A) `.push()` at lines 70, 72, 82, 90
- (B) `DiffEntry[]` at line 61
- (C) `type ConfigObject = Record<string, unknown>` without Readonly at line 23
- (E) `result[key] = value` at lines 41, 46
- (H) `delete result[key]` at line 33
- (L) DiffEntry should be `type`

**`commands/config/validate.ts`** — 9 violations
- (A) `.push()` at lines 85, 100, 103
- (B) `ValidationResult[]` at line 78
- (D) `let schema`, `let hasErrors` at lines 53, 79
- (H) `delete schema['$schema']` at line 58
- (L) ValidationResult should be `type`

#### Batch 4: Command implementations — env

**`commands/env/config.ts`** — 14 violations
- (C) mutable `Record` at lines 72, 84, 95
- (D) `let dbPort`, `let servicePort` at lines 71, 83
- (E) `Object.assign()` at lines 80, 92; bracket property mutation at lines 74, 88-89, 101, 112, 116
- (J) `dbPort++`, `servicePort++` at lines 76, 89
- (L) SddSettings, LocalConfigUrls should be `type`

**`commands/env/forward.ts`** — 12 violations
- (A) `.push()` at lines 90, 104, 113, 123, 162
- (B) `ForwardConfig[]` at line 84; `string[]` at line 139
- (D) `let dbPort`, `let nextPort`, `let message` at lines 88, 99, 168
- (J) `dbPort++`, `nextPort++` at lines 93, 107, 116
- (L) SddSettings, ForwardConfig should be `type`

**`commands/env/deploy.ts`** — 10 violations
- (A) `.push()` at lines 143, 239, 252, 255
- (B) `deployedDbs: string[]`, `deployedCharts: string[]`, `summary: string[]` at lines 133, 222, 250
- (D) `let dbPort` at line 158
- (J) `dbPort++` at line 161
- (L) SddSettings should be `type`
- (M) `waitForDatabase(): Promise<void>` at line 40

**`commands/env/status.ts`** — 11 violations
- (A) `.push()` at line 149
- (B) `NamespaceStatus[]` at line 135
- (D) `let output` at line 163
- (E) `output +=` string concatenation at lines 164-171
- (L) ClusterStatus, NodeStatus, NamespaceStatus, KubeNode, KubeNamespace, KubePod should be `type`
- (N) `provider: ClusterProvider | null` field at line 18

**`commands/env/undeploy.ts`** — 3 violations
- (A) `.push()` at line 79
- (B) `undeployed: string[]` at line 74
- (L) SddSettings should be `type`

**`commands/env/create.ts`** — 1 violation
- (M) `installInfrastructure(): Promise<void>` at line 94

**`commands/env/check-tools.ts`** — 7 violations
- (L) ToolCheck, ToolResult, CheckToolsData should be `type`
- (N) `detectPackageManager(): PackageManager | null` at line 143; `version: string | null` field at line 26; `installHint: string | null` at line 27; `packageManager: string | null` at line 32

**`commands/env/providers/index.ts`** — 8 violations
- (A) `.push()` at lines 114, 121, 128
- (B) `missing: string[]` at line 108
- (L) ClusterState should be `type`
- (M) `writeState(): void` at line 39; `persistClusterProvider(): void` at line 65; `removeClusterProvider(): void` at line 73
- (N) `getClusterProvider(): ClusterProvider | null` at line 57

#### Batch 5: Command implementations — spec, database, hook, scaffolding

**`commands/spec/validate.ts`** — 3 violations
- (A) `.push(...missingFieldErrors)` at line 72
- (B) `errors: ValidationError[]` at line 56

**`commands/spec/generate-snapshot.ts`** — 1 violation
- (C) `{} as Record<string, readonly ActiveSpec[]>` mutable Record accumulator in reduce at line 42

**`commands/spec/generate-index.ts`** — 1 violation
- (C) `{} as Readonly<Record<...>>` — uses `as` cast on accumulator

**`commands/database/migrate.ts`** — 2 violations
- (A) `.push()` at line 91
- (B) `migrationsRun: string[]` at line 84

**`commands/database/seed.ts`** — 2 violations
- (A) `.push()` at line 90
- (B) `seedsRun: string[]` at line 83

**`commands/hook/prompt-commit.ts`** — 3 violations
- (D) `let data = ''` at line 67
- (E) `data += chunk` string mutation at line 70
- (N) `findMatchingDir(): string | null` at line 30

**`commands/hook/validate-write.ts`** — 3 violations
- (D) `let data = ''` at line 110
- (E) `data += chunk` string mutation at line 113
- (N) `matchesBlockedPattern(): string | null` at line 76

#### Batch 6: Command implementations — scaffolding, workflow, permissions, settings, cli

**`commands/scaffolding/project.ts`** — 12 violations
- (A) `.push()` at ~15 call sites (lines 180-341)
- (B) `ScaffoldOperation[]` at line 177
- (C) `scripts: Record<string, string>` at line 54; `variables: Record<string, string>` at line 344
- (E) `scripts[key] = value` bracket mutations at lines 61-91

**`commands/scaffolding/engine.ts`** — 22 violations
- (A) `.push()` at lines 248, 250, 302, 351, 408-412
- (B) `string[]` at lines 238-239, 295, 345, 373-377, 415
- (C) `Record<string, string>` without Readonly at line 344
- (D) `let result: OpResult` at line 385
- (E) `merged[key] = value` at line 350
- (L) EqualsCondition, NotEmptyCondition, FileOperationBase, TemplateDirOp, TemplateFileOp, MkdirOp, WriteFileOp, PackageJsonScriptsOp, ScaffoldSpec, EngineResult, OpResult should be `type`

**`commands/scaffolding/domain.ts`** — 3 violations
- (D) `let content` at lines 151, 209
- (M) `updateSnapshot(): Promise<void>` at line 200

**`commands/scaffolding/apply.ts`** — 3 violations
- (D) `let _validate` (module-level mutable singleton) at line 21; `let raw` at line 104
- (D) `for (let i = 0; ...)` at line 61

**`commands/workflow/check-gate.ts`** — 11 violations
- (A) `.push()` at lines 59, 76, 82, 115, 148, 181
- (B) `WorkflowItem[]` at line 53; `BlockingItem[]` at lines 72, 112, 145, 178
- (M) `processItem(): void` (local function) at line 55

**`commands/permissions/configure.ts`** — 4 violations
- (D) `let sddPermissions` at line 92; `let existingSettings` at line 106
- (F) `existingSet.add(item)` on Set at line 36
- (L) PermissionSettings should be `type`

**`commands/settings/reconcile.ts`** — 2 violations
- (D) `let rawContent` at line 51; `let pluginVersion` at line 63

**`commands/version/bump.ts`** — 1 violation
- (N) `parseVersion(): VersionInfo | null` at line 22

**`cli.ts`** — 4 violations
- (I) `as Record<string, unknown>` casts at lines 169-171
- (L) RawLoggingConfig should be `type`
- (N) `loadLoggingConfig(): RawLoggingConfig | null` at line 165

#### Batch 7: Index files — extract logic into handler files + convert Args interfaces

12 index.ts files contain routing/dispatch logic instead of pure re-exports. Each also has an `*Args` interface that should be `type`:

| File | Logic to extract | Interface → type |
|------|-----------------|-----------------|
| `commands/config/index.ts` | `handleConfig()` switch/dispatch | ConfigArgs |
| `commands/contract/index.ts` | `handleContract()` switch/dispatch | ContractArgs |
| `commands/database/index.ts` | `handleDatabase()` switch/dispatch | DatabaseArgs |
| `commands/hook/index.ts` | `handleHook()` switch/dispatch | HookArgs |
| `commands/spec/index.ts` | `handleSpec()` switch/dispatch | SpecArgs |
| `commands/env/index.ts` | `handleEnvironment()` switch/dispatch | EnvironmentArgs |
| `commands/permissions/index.ts` | `handlePermissions()` switch/dispatch | PermissionsArgs |
| `commands/workflow/index.ts` | `handleWorkflow()` switch/dispatch | WorkflowArgs |
| `commands/scaffolding/index.ts` | `handleScaffolding()` switch/dispatch | ScaffoldingArgs |
| `commands/version/index.ts` | `handleVersion()` switch/dispatch | VersionArgs |
| `commands/settings/index.ts` | `handleSettings()` switch/dispatch | SettingsArgs |
| `commands/env/providers/index.ts` | Provider registry + state management | (ClusterState — already in Batch 4) |

## Changes

### 1. Convert `interface` to `type` for data shapes (L) — ~105 edits across ~30 files

Mechanical find-and-replace: `interface Foo {` → `type Foo = {` with closing `};`. Only `Logger` (lib/logger.ts) and `ClusterProviderOps` (env/types.ts) stay as `interface`.

This is the highest-volume change but lowest-risk — purely syntactic with no behavioral impact.

### 2. Convert mutable array operations (A + B) — ~250 edits across ~25 files

Every `const arr: T[] = []` followed by `.push()` becomes:
- `.reduce()` accumulation returning `ReadonlyArray<T>`
- `.flatMap()` / `.map()` / `.filter()` chains
- Spread accumulation `[...prev, newItem]`

All `T[]` types become `ReadonlyArray<T>` or `readonly T[]`.

### 3. Convert mutable Record types (C) — ~30 edits across ~12 files

`Record<K,V>` → `Readonly<Record<K,V>>`. Property assignment via `obj[key] = value` → `Object.fromEntries()`, spread, or `.reduce()`.

### 4. Replace `let` with `const` (D) — ~35 edits across ~18 files

Using ternaries, conditional expressions, immediately-invoked arrow functions, or functional chaining.

### 5. Replace direct property mutation (E) — ~25 edits across ~10 files

`obj.prop = value` → `{ ...obj, prop: value }`. `Object.assign()` → spread.

### 6. Replace `delete` operator (H) — 4 edits across 3 files

`delete obj[key]` → `const { [key]: _, ...rest } = obj`.

### 7. Replace `as` casts circumventing readonly (I) — ~15 edits across ~3 files

Particularly `lib/args.ts` where `(options as { json: boolean }).json = true` must become an immutable pattern.

### 8. Replace `++`/`--` operators (J) — ~10 edits across 3 files

Convert to functional patterns with `.reduce()`, `.map()` with index, or `Array.from({ length: n }, (_, i) => ...)`.

### 9. Replace mutable Set/Map operations (F) — ~5 edits across 2 files

`Set.add()` → `new Set([...set, item])`. `Map.set()` → `new Map([...map, [key, value]])`.

### 10. Replace `void` / `Promise<void>` return types (M) — ~20 edits across ~7 files

Standalone void functions must return meaningful values:
- File utility functions → return the path written or a success indicator
- Logging functions → return the message
- State management functions → return the updated state
- `ClusterProviderOps` interface methods → return `Promise<CommandResult>` or similar, cascading to all 3 provider implementations

### 11. Replace `| null` returns with result unions (N) — ~11 function signatures + ~5 type fields across ~10 files

Functions returning `T | null`:
- Convert to discriminated union results: `{ found: true; value: T } | { found: false }`
- Or `{ success: true; data: T } | { success: false; error: string }` where error context is available

Type fields with `| null`:
- Convert to optional fields: `prop: T | null` → `prop?: T`

### 12. Extract logic from index.ts files (G) — 12 files

Create `handler.ts` sibling for each command index.ts. Move dispatch logic there. Index.ts becomes pure re-exports.

## Execution Order

1. **Batch 0 (types layer)** — Do first. `interface` → `type` is mechanical and won't break anything, but sets the foundation for the correct pattern going forward.
2. **Batch 1 (lib layer)** — Must come next. Type signatures here cascade to all consumers. Includes L, M, N changes to lib files.
3. **Batch 2 (settings)** — Settings types/functions used by many commands.
4. **Batches 3-6 (commands)** — Can be done in any order after lib/settings are stable.
5. **Batch 7 (index files)** — Structural-only change, can be done last.
6. **Typecheck after each batch** — Run `npm run typecheck:plugin` to catch cascading errors early.

## Tests

### Pre-existing tests must pass

- [ ] `npm test` passes with no regressions
- [ ] `npm run typecheck:plugin` produces zero errors

### Verification (grep-based, after all batches)

- [ ] Zero `^interface\s` in non-Logger, non-ClusterProviderOps locations
- [ ] Zero `.push(` in `plugin/system/src/`
- [ ] Zero `const.*: \w+\[\]` (mutable array type declarations)
- [ ] Zero unwrapped `Record<` without `Readonly<Record<` in variable/return types
- [ ] Zero `let ` declarations
- [ ] Zero `Object.assign(` calls
- [ ] Zero `delete ` operators on objects
- [ ] Zero `++` / `--` operators (outside comments)
- [ ] Zero `.add(` on Sets, `.set(` on Maps
- [ ] All `index.ts` files contain only imports/re-exports
- [ ] Zero bare `.sort()` on non-spread arrays
- [ ] All interface properties have `readonly` (already 100% — verify maintained)
- [ ] Zero `: void` / `: Promise<void>` on standalone functions
- [ ] Zero `| null` return types from own functions
- [ ] Zero `| null` type fields (use `?:` instead)

### Confirmed clean rules (verify stays clean)

- [ ] Zero `export default`
- [ ] Zero `function` declarations
- [ ] Zero `class` declarations
- [ ] Zero `require()` calls
- [ ] Zero `var` declarations
- [ ] Zero `any` type annotations
- [ ] Zero file extensions in imports
- [ ] `import type` used for all type-only imports

## Verification

- [ ] `npm run typecheck:plugin` passes with zero errors
- [ ] `npm test` passes with no regressions
- [ ] Full grep-based audit confirms zero remaining violations
- [ ] No behavioral changes — all refactoring is purely structural (same inputs → same outputs)
