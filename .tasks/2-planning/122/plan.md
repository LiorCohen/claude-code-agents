---
title: Fix TypeScript standards violations in plugin/system
created: 2026-02-10
updated: 2026-02-10
---

# Plan: Fix TypeScript standards violations in plugin/system

## Problem Summary

A line-by-line audit of all 73 TypeScript files in `plugin/system/src/` against the project's typescript-standards revealed widespread immutability violations. Every file was read and checked manually.

### Violation counts (from actual file reads)

| Category | Count | Description |
|----------|-------|-------------|
| `.push()` calls | ~150 | Array mutation via push |
| `T[]` mutable array types | ~100 | Should be `ReadonlyArray<T>` or `readonly T[]` |
| `let` declarations | ~35 | Should be `const` with functional patterns |
| Direct property mutation | ~25 | `obj[key] = value`, `obj.prop = value` |
| Mutable `Record<K,V>` | ~30 | Should be `Readonly<Record<K,V>>` |
| `as` casts circumventing readonly | ~15 | Casting to mutable types to enable mutation |
| `delete` operator | 4 | Banned — use destructuring rest |
| `++`/`--` operators | ~10 | Variable mutation — use functional patterns |
| `Object.assign()` | 2 | Banned — use spread |
| Mutable `Set.add()` / `Map.set()` | ~5 | Use immutable construction |
| `.sort()` on non-spread arrays | ~2 | Use `[...arr].sort()` or `.toSorted()` |
| Index files with logic | 12 | Should be pure re-exports |

### Files with violations: 35 of 73

### Clean files: 38 of 73

**Confirmed clean rules (zero violations across entire codebase):** `function` keyword, `class` keyword, `export default`, `require()`, `var`, `any` types, file extensions in imports, deep relative imports, utility library imports. All 61 interfaces across all files have 100% `readonly` properties.

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

## Complete Per-File Audit

### 100% CLEAN — No violations (38 files)

**Types (5 files — all `readonly`, all compliant):**
- `types/settings.ts`, `types/component.ts`, `types/config.ts`, `types/spec.ts`, `types/workflow.ts`

**Lib (3 files):**
- `lib/fs.ts`, `lib/logger.ts`, `lib/spec-utils.ts`

**Settings (3 files):**
- `settings/defaults.ts`, `settings/schema.ts`, `settings/index.ts`

**Commands — env (13 files):**
- `env/types.ts`, `env/create.ts`, `env/destroy.ts`, `env/start.ts`, `env/stop.ts`, `env/restart.ts`, `env/infra.ts`, `env/check-tools.ts`
- `env/providers/kind.ts`, `env/providers/minikube.ts`, `env/providers/docker-desktop.ts`

**Commands — database (5 files):**
- `database/port-forward.ts`, `database/psql.ts`, `database/setup.ts`, `database/teardown.ts`, `database/reset.ts`

**Commands — contract (2 files):**
- `contract/generate-types.ts`, `contract/validate.ts`

**Commands — other (2 files):**
- `version/bump.ts`, `config/add-env.ts`

### FILES WITH VIOLATIONS — Complete list

#### Batch 1: Lib layer (foundational — other files depend on these)

**`lib/args.ts`** — 15 violations
- (A) `.push()` at lines 63, 66, 75, 112
- (B) `string[]` at lines 29, 91
- (C) `Record<string, string>` at line 90
- (D) `let namespace`, `let action`, `let i` at lines 36-38
- (E) `named[key] = value` property mutation at lines 105, 108
- (I) `(options as { json: boolean }).json = true` — cast-then-mutate at lines 52, 55, 59

**`lib/frontmatter.ts`** — 2 violations
- (C) `Record<string, string>` at line 22
- (E) `frontmatter[key] = value` at line 28

**`lib/config.ts`** — 1 violation
- (D) `let currentDir` at line 69

**`lib/schema-validator.ts`** — 8 violations
- (A) `.push()` at lines 196, 212, 228, 268, 270, 287
- (B) `ValidationError[]` at line 188, `string[]` at line 261
- (D) `for (let i = 0; ...)` at line 165

#### Batch 2: Settings modules (heavily mutating, core infrastructure)

**`settings/validate.ts`** — 15 violations
- (A) `.push()` at lines 48, 58, 104, 115, 127, 131, 145, 182, 249, 253, 257, 264, 308, 313, 352-366
- (B) `SettingsValidationError[]` at lines 44, 75, 223, 275, 348, 349; `string[]` at line 381
- (F) `new Map<string, string[]>()` with `.set()` at lines 305, 314

**`settings/reconcile.ts`** — 20 violations
- (A) `.push()` at lines 89, 96, 105, 117, 126, 142, 149, 158, 165, 181, 187, 215, 221, 261, 269, 303
- (B) `ReconciliationChange[]` at line 64, `ReconciliationWarning[]` at line 65
- (C) `as Record<string, unknown>` casts at lines 67-71
- (D) `let initializedByPluginVersion`, `let initializedAt`, `let updatedAt`, `let path`, `let system` at lines 84, 114, 136, 205, 242

**`settings/sync.ts`** — 20 violations
- (A) `.push()` at lines 63, 67, 79, 111, 180, 183-195, 209, 213, 216, 219, 224, 235
- (B) `Component[]` at lines 51-52; `string[]` at lines 97, 173-175, 339
- (C) `Record<string, unknown>` return types at lines 259, 314; mutable Record locals at lines 260, 282, 296, 315; `Record<ComponentType, string>` at line 132
- (E) Property mutations: `config['port']`, `config['queue']`, `config['databases']`, `config['apis']`, `databases[db]`, `apis[contract]`

**`settings/sync-helm.ts`** — 15 violations
- (A) `.push()` at lines 45, 48, 51, 55, 57, 66, 71, 87
- (B) `string[]` at lines 32, 84
- (C) `Record<string, unknown>` return types at lines 127-128, 228-229; mutable locals
- (E) `values[mode] = ...`, `values['replicaCount'] = ...` at lines 175, 186-190, 198, 206, 270

#### Batch 3: Command implementations — config

**`commands/config/generate.ts`** — 10 violations
- (C) `type ConfigObject = Record<string, unknown>` without Readonly at line 17
- (D) `let mergedConfig` at line 99
- (E) `result[key] = value` at lines 41, 47
- (H) `delete result[key]` at line 32; `delete schema['$schema']` at line 106

**`commands/config/diff.ts`** — 10 violations
- (A) `.push()` at lines 70, 72, 82, 90
- (B) `DiffEntry[]` at line 61
- (C) `type ConfigObject = Record<string, unknown>` without Readonly at line 23
- (E) `result[key] = value` at lines 41, 46
- (H) `delete result[key]` at line 33

**`commands/config/validate.ts`** — 8 violations
- (A) `.push()` at lines 85, 100, 103
- (B) `ValidationResult[]` at line 78
- (D) `let schema`, `let hasErrors` at lines 53, 79
- (H) `delete schema['$schema']` at line 58

#### Batch 4: Command implementations — env

**`commands/env/config.ts`** — 12 violations
- (C) mutable `Record` at lines 72, 84, 95
- (D) `let dbPort`, `let servicePort` at lines 71, 83
- (E) `Object.assign()` at lines 80, 92; bracket property mutation at lines 74, 88-89, 101, 112, 116
- (J) `dbPort++`, `servicePort++` at lines 76, 89

**`commands/env/forward.ts`** — 10 violations
- (A) `.push()` at lines 90, 104, 113, 123, 162
- (B) `ForwardConfig[]` at line 84; `string[]` at line 139
- (D) `let dbPort`, `let nextPort`, `let message` at lines 88, 99, 168
- (J) `dbPort++`, `nextPort++` at lines 93, 107, 116

**`commands/env/deploy.ts`** — 8 violations
- (A) `.push()` at lines 143, 239, 252, 255
- (B) `deployedDbs: string[]`, `deployedCharts: string[]`, `summary: string[]` at lines 133, 222, 250
- (D) `let dbPort` at line 158
- (J) `dbPort++` at line 161

**`commands/env/status.ts`** — 4 violations
- (A) `.push()` at line 149
- (B) `NamespaceStatus[]` at line 135
- (D) `let output` at line 163
- (E) `output +=` string concatenation at lines 164-171

**`commands/env/undeploy.ts`** — 2 violations
- (A) `.push()` at line 79
- (B) `undeployed: string[]` at line 74

**`commands/env/providers/index.ts`** — 3 violations
- (A) `.push()` at lines 114, 121, 128
- (B) `missing: string[]` at line 108

#### Batch 5: Command implementations — spec, database, hook, scaffolding

**`commands/spec/validate.ts`** — 3 violations
- (A) `.push(...missingFieldErrors)` at line 72
- (B) `errors: ValidationError[]` at line 56

**`commands/spec/generate-snapshot.ts`** — 1 violation
- (C) `{} as Record<string, readonly ActiveSpec[]>` mutable Record accumulator in reduce at line 42

**`commands/spec/generate-index.ts`** — 1 violation
- (C) `{} as Readonly<Record<...>>` — actually already typed Readonly, but uses `as` cast on accumulator

**`commands/database/migrate.ts`** — 2 violations
- (A) `.push()` at line 91
- (B) `migrationsRun: string[]` at line 84

**`commands/database/seed.ts`** — 2 violations
- (A) `.push()` at line 90
- (B) `seedsRun: string[]` at line 83

**`commands/hook/prompt-commit.ts`** — 2 violations
- (D) `let data = ''` at line 67
- (E) `data += chunk` string mutation at line 70

**`commands/hook/validate-write.ts`** — 2 violations
- (D) `let data = ''` at line 110
- (E) `data += chunk` string mutation at line 113

#### Batch 6: Command implementations — scaffolding, workflow, permissions, settings, cli

**`commands/scaffolding/project.ts`** — 12 violations
- (A) `.push()` at ~15 call sites (lines 180-341)
- (B) `ScaffoldOperation[]` at line 177
- (C) `scripts: Record<string, string>` at line 54; `variables: Record<string, string>` at line 344
- (E) `scripts[key] = value` bracket mutations at lines 61-91

**`commands/scaffolding/engine.ts`** — 12 violations
- (A) `.push()` at lines 248, 250, 302, 351, 408-412
- (B) `string[]` at lines 238-239, 295, 345, 373-377, 415
- (C) `Record<string, string>` without Readonly at line 344
- (D) `let result: OpResult` at line 385
- (E) `merged[key] = value` at line 350

**`commands/scaffolding/domain.ts`** — 2 violations
- (D) `let content` at lines 151, 209

**`commands/scaffolding/apply.ts`** — 3 violations
- (D) `let _validate` (module-level mutable singleton) at line 21; `let raw` at line 104
- (D) `for (let i = 0; ...)` at line 61

**`commands/workflow/check-gate.ts`** — 10 violations
- (A) `.push()` at lines 59, 76, 82, 115, 148, 181
- (B) `WorkflowItem[]` at line 53; `BlockingItem[]` at lines 72, 112, 145, 178

**`commands/permissions/configure.ts`** — 3 violations
- (D) `let sddPermissions` at line 92; `let existingSettings` at line 106
- (F) `existingSet.add(item)` on Set at line 36

**`commands/settings/reconcile.ts`** — 2 violations
- (D) `let rawContent` at line 51; `let pluginVersion` at line 63

**`cli.ts`** — 2 violations
- (I) `as Record<string, unknown>` casts at lines 169-171

#### Batch 7: Index files — extract logic into handler files

12 index.ts files contain routing/dispatch logic instead of pure re-exports:

| File | Logic to extract |
|------|-----------------|
| `commands/config/index.ts` | `handleConfig()` switch/dispatch |
| `commands/contract/index.ts` | `handleContract()` switch/dispatch |
| `commands/database/index.ts` | `handleDatabase()` switch/dispatch |
| `commands/hook/index.ts` | `handleHook()` switch/dispatch |
| `commands/spec/index.ts` | `handleSpec()` switch/dispatch |
| `commands/env/index.ts` | `handleEnvironment()` switch/dispatch |
| `commands/permissions/index.ts` | `handlePermissions()` switch/dispatch |
| `commands/workflow/index.ts` | `handleWorkflow()` switch/dispatch |
| `commands/scaffolding/index.ts` | `handleScaffolding()` switch/dispatch |
| `commands/version/index.ts` | `handleVersion()` switch/dispatch |
| `commands/settings/index.ts` | `handleSettings()` switch/dispatch |
| `commands/env/providers/index.ts` | Provider registry + state management |

## Changes

### 1. Convert mutable array operations (A + B) — ~250 edits across ~25 files

Every `const arr: T[] = []` followed by `.push()` becomes:
- `.reduce()` accumulation returning `ReadonlyArray<T>`
- `.flatMap()` / `.map()` / `.filter()` chains
- Spread accumulation `[...prev, newItem]`

All `T[]` types become `ReadonlyArray<T>` or `readonly T[]`.

### 2. Convert mutable Record types (C) — ~30 edits across ~12 files

`Record<K,V>` → `Readonly<Record<K,V>>`. Property assignment via `obj[key] = value` → `Object.fromEntries()`, spread, or `.reduce()`.

### 3. Replace `let` with `const` (D) — ~35 edits across ~18 files

Using ternaries, conditional expressions, immediately-invoked arrow functions, or functional chaining.

### 4. Replace direct property mutation (E) — ~25 edits across ~10 files

`obj.prop = value` → `{ ...obj, prop: value }`. `Object.assign()` → spread.

### 5. Replace `delete` operator (H) — 4 edits across 3 files

`delete obj[key]` → `const { [key]: _, ...rest } = obj`.

### 6. Replace `as` casts circumventing readonly (I) — ~15 edits across ~3 files

Particularly `lib/args.ts` where `(options as { json: boolean }).json = true` must become an immutable pattern.

### 7. Replace `++`/`--` operators (J) — ~10 edits across 3 files

Convert to functional patterns with `.reduce()`, `.map()` with index, or `Array.from({ length: n }, (_, i) => ...)`.

### 8. Replace mutable Set/Map operations (F) — ~5 edits across 2 files

`Set.add()` → `new Set([...set, item])`. `Map.set()` → `new Map([...map, [key, value]])`.

### 9. Extract logic from index.ts files (G) — 12 files

Create `handler.ts` sibling for each command index.ts. Move dispatch logic there. Index.ts becomes pure re-exports.

## Execution Order

1. **Batch 1 (lib layer)** — Must come first. Type signatures cascade to all consumers.
2. **Batch 2 (settings)** — Settings types/functions used by many commands.
3. **Batches 3-6 (commands)** — Can be done in any order after lib/settings are stable.
4. **Batch 7 (index files)** — Structural-only change, can be done last.
5. **Typecheck after each batch** — Run `npm run typecheck:plugin` to catch cascading errors early.

## Tests

### Pre-existing tests must pass

- [ ] `npm test` passes with no regressions
- [ ] `npm run typecheck:plugin` produces zero errors

### Verification (grep-based, after all batches)

- [ ] Zero `.push(` in `plugin/system/src/`
- [ ] Zero `const.*: \w+\[\]` (mutable array type declarations)
- [ ] Zero unWrapped `Record<` without `Readonly<Record<` in variable/return types
- [ ] Zero `let ` declarations
- [ ] Zero `Object.assign(` calls
- [ ] Zero `delete ` operators on objects
- [ ] Zero `++` / `--` operators (outside comments)
- [ ] Zero `.add(` on Sets, `.set(` on Maps
- [ ] All `index.ts` files contain only imports/re-exports
- [ ] Zero bare `.sort()` on non-spread arrays
- [ ] All interface properties have `readonly` (already 100% — verify maintained)

### Confirmed clean rules (verify stays clean)

- [ ] Zero `export default`
- [ ] Zero `function` declarations
- [ ] Zero `class` declarations
- [ ] Zero `require()` calls
- [ ] Zero `var` declarations
- [ ] Zero `any` type annotations
- [ ] Zero file extensions in imports

## Verification

- [ ] `npm run typecheck:plugin` passes with zero errors
- [ ] `npm test` passes with no regressions
- [ ] Full grep-based audit confirms zero remaining violations
- [ ] No behavioral changes — all refactoring is purely structural (same inputs → same outputs)
