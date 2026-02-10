---
title: Fix TypeScript standards violations in plugin/system
created: 2026-02-10
updated: 2026-02-10
---

# Plan: Fix TypeScript standards violations in plugin/system

## Problem Summary

The TypeScript code in `plugin/system/src/` has widespread violations of the project's typescript-standards. A comprehensive audit identified:

- **~150 mutable `.push()` calls** across ~20 files
- **~100 mutable `T[]` array type declarations** that should be `ReadonlyArray<T>` — across nearly every file
- **~30 mutable `Record<string, T>` types** that should be `Readonly<Record<string, T>>`
- **~30 `let` declarations** that should use `const`
- **~20 direct property mutations** (e.g., `obj.prop = value`)
- **7 index.ts files containing routing logic** instead of pure re-exports
- **2 `Object.assign()` calls**, mutable Set/Map operations
- **A few `.sort()` calls** on non-spread arrays

**Confirmed clean (no violations):** `function` keyword, `class` keyword, `export default`, `require()`, `var`, `any` types, file extensions in imports, deep relative imports, utility library imports.

## Violation Categories

Each file fix must address ALL of the following that apply:

### A. Mutable array operations → immutable patterns

Replace `.push()` with `[...arr, item]`, `.concat()`, `.reduce()`, or `.flatMap()`. Replace `.sort()` on references with `[...arr].sort()` or `.toSorted()`.

### B. `T[]` → `ReadonlyArray<T>`

Every local array variable typed as `T[]` must become `ReadonlyArray<T>` (or `readonly T[]`). This is intertwined with (A) — you can't use `ReadonlyArray` while still calling `.push()`. Both must be fixed together.

### C. `Record<K,V>` → `Readonly<Record<K,V>>`

Mutable `Record` types used as return types, local variables, or parameters must be wrapped in `Readonly<>`. Direct property assignment on records must be replaced with spread.

### D. `let` → `const`

Replace `let` with `const` using conditional expressions, functional chaining, or immediately-invoked patterns.

### E. Direct property mutation → spread

Replace `obj.prop = value` with `{ ...obj, prop: value }`. Replace `Object.assign()` with object spread.

### F. Mutable Set/Map → immutable construction

Replace `Set.add()` with `new Set([...set, item])`. Replace `Map.set()` with `new Map([...map, [key, value]])`.

### G. Index files → pure re-exports

Extract routing/dispatch logic from index.ts files into dedicated handler files (e.g., `handler.ts` or `router.ts`). Index files become pure import/export modules.

### H. Interface properties → `readonly`

All interface/type properties must have `readonly`. The `types/` directory is 98% compliant (161/163 properties) — only `settings.ts` has 2 non-readonly properties to fix.

## Files to Modify

### Batch 1: Types and lib layer (foundational — other files depend on these)

| File | Violations |
|------|-----------|
| `plugin/system/src/types/settings.ts` | (H) 2 interface properties missing `readonly` |
| `plugin/system/src/types/component.ts` | (H) Verify — likely already compliant |
| `plugin/system/src/types/config.ts` | (H) Verify — likely already compliant |
| `plugin/system/src/types/spec.ts` | (H) Verify — likely already compliant |
| `plugin/system/src/types/workflow.ts` | (H) Verify — likely already compliant |
| `plugin/system/src/lib/args.ts` | (A) 4 `.push()`, (B) `string[]` vars, (C) mutable `Record`, (D) 4 `let`, (E) property mutation |
| `plugin/system/src/lib/config.ts` | (D) 1 `let` |
| `plugin/system/src/lib/frontmatter.ts` | (C) mutable `Record`, (E) property mutation — replace with `Object.fromEntries` |
| `plugin/system/src/lib/schema-validator.ts` | (A) ~11 `.push()`, (B) `ValidationError[]` and `string[]` vars |

### Batch 2: Settings modules (heavily mutating, core infrastructure)

| File | Violations |
|------|-----------|
| `plugin/system/src/settings/validate.ts` | (A) ~25 `.push()`, (B) many `T[]` vars, (F) `Map.set()`, (C) mutable Map type |
| `plugin/system/src/settings/reconcile.ts` | (A) ~18 `.push()`, (B) `ReconciliationChange[]` etc., (C) mutable `Record`, (D) ~5 `let` |
| `plugin/system/src/settings/sync.ts` | (A) ~30 `.push()`, (B) `string[]` and `Component[]` vars, (C) ~6 mutable `Record` return types and locals, (E) ~6 property mutations |
| `plugin/system/src/settings/sync-helm.ts` | (A) ~8 `.push()`, (B) `string[]` vars, (C) mutable `Record` return types and locals, (E) ~4 property mutations |
| `plugin/system/src/settings/defaults.ts` | Verify readonly types |
| `plugin/system/src/settings/schema.ts` | Verify readonly types |

### Batch 3: Index files — extract logic into handler files

| File | Violations |
|------|-----------|
| `plugin/system/src/commands/contract/index.ts` | (G) `handleContract()` switch/dispatch logic |
| `plugin/system/src/commands/database/index.ts` | (G) `handleDatabase()` switch/dispatch logic |
| `plugin/system/src/commands/hook/index.ts` | (G) `handleHook()` switch/dispatch logic |
| `plugin/system/src/commands/version/index.ts` | (G) `handleVersion()` switch/dispatch logic |
| `plugin/system/src/commands/config/index.ts` | (G) `handleConfig()` switch/dispatch logic |
| `plugin/system/src/commands/env/index.ts` | (G) `handleEnvironment()` switch/dispatch logic |
| `plugin/system/src/commands/settings/index.ts` | (G) `handleSettings()` switch/dispatch logic |
| `plugin/system/src/commands/env/providers/index.ts` | (A) 3 `.push()`, (B) `string[]` var, (G) contains logic |

For each: create a `handler.ts` sibling with the extracted logic, update index.ts to re-export only.

### Batch 4: Command implementations — env commands

| File | Violations |
|------|-----------|
| `plugin/system/src/commands/env/deploy.ts` | (A) 4 `.push()`, (B) 3 `string[]` vars, (D) 1 `let` |
| `plugin/system/src/commands/env/config.ts` | (C) 3 mutable `Record` vars, (D) 2 `let`, (E) ~6 property mutations + 2 `Object.assign()` |
| `plugin/system/src/commands/env/forward.ts` | (A) 5 `.push()`, (B) 3 `T[]` vars, (D) 3 `let` |
| `plugin/system/src/commands/env/undeploy.ts` | (A) 1 `.push()`, (B) 1 `string[]` var |
| `plugin/system/src/commands/env/status.ts` | (A) 1 `.push()`, (B) 1 `T[]` var, (D) 1 `let` |

### Batch 5: Command implementations — config, database, spec, hook

| File | Violations |
|------|-----------|
| `plugin/system/src/commands/config/validate.ts` | (A) 4 `.push()`, (B) 1 `T[]` var, (D) 2 `let` |
| `plugin/system/src/commands/config/diff.ts` | (A) 4 `.push()`, (B) 1 `T[]` var, (C) mutable `Record` type alias + params, (E) 3 property mutations |
| `plugin/system/src/commands/config/generate.ts` | (C) mutable `Record` type alias, (D) 1 `let`, (E) 3 property mutations |
| `plugin/system/src/commands/database/seed.ts` | (A) 1 `.push()`, (B) 1 `string[]` var |
| `plugin/system/src/commands/database/migrate.ts` | (A) 1 `.push()`, (B) 1 `string[]` var |
| `plugin/system/src/commands/spec/validate.ts` | (A) 5 `.push()`, (B) 1 `ValidationError[]` var |
| `plugin/system/src/commands/spec/generate-snapshot.ts` | (C) 1 mutable `Record` in `.reduce()` accumulator |
| `plugin/system/src/commands/spec/generate-index.ts` | (C) 1 mutable `Record` in `.reduce()` accumulator |
| `plugin/system/src/commands/hook/prompt-commit.ts` | (D) 1 `let` |
| `plugin/system/src/commands/hook/validate-write.ts` | (D) 1 `let` |

### Batch 6: Command implementations — scaffolding, workflow, permissions

| File | Violations |
|------|-----------|
| `plugin/system/src/commands/scaffolding/project.ts` | (A) ~30 `.push()`, (B) 1 `T[]` var, (C) 2 mutable `Record` vars |
| `plugin/system/src/commands/scaffolding/engine.ts` | (A) ~15 `.push()`, (B) ~7 `string[]` vars, (C) 1 mutable `Record`, (D) 1 `let`, (E) 1 property mutation |
| `plugin/system/src/commands/scaffolding/domain.ts` | (D) 2 `let` |
| `plugin/system/src/commands/scaffolding/apply.ts` | (C) mutable `Record` params, (D) 2 `let` |
| `plugin/system/src/commands/workflow/check-gate.ts` | (A) 6 `.push()`, (B) 5 `T[]` vars |
| `plugin/system/src/commands/permissions/configure.ts` | (D) 2 `let`, (F) `Set.add()` |
| `plugin/system/src/commands/settings/reconcile.ts` | (D) 2 `let` |

## Changes

### 1. Convert all mutable array types and operations (A + B)

Every `const arr: T[] = []` followed by `.push()` in a loop becomes one of:
- `.reduce()` accumulation returning `ReadonlyArray<T>`
- `.flatMap()` / `.map()` / `.filter()` chains
- Spread accumulation `[...prev, newItem]`

All array variable types change from `T[]` to `ReadonlyArray<T>` (or `readonly T[]`). This is the largest change by volume.

### 2. Convert all mutable Record types (C)

Local variables, return types, and parameters using `Record<K,V>` without `Readonly` get wrapped: `Readonly<Record<K,V>>`. Where records are being built up via property assignment, refactor to use `Object.fromEntries()` or spread patterns.

### 3. Replace all `let` declarations with `const` (D)

~30 `let` declarations converted using conditional expressions, ternaries, immediately-invoked arrow functions, or functional chaining.

### 4. Replace all direct property mutation and Object.assign (E)

Property assignments like `obj.prop = value` replaced with `{ ...obj, prop: value }`. `Object.assign()` calls replaced with object spread.

### 5. Replace mutable Set/Map operations (F)

`Set.add()` → `new Set([...set, item])`. `Map.set()` → `new Map([...map, [key, value]])`.

### 6. Extract logic from index.ts files (G)

7 command index files contain routing/dispatch logic (switch statements). Each gets a new sibling `handler.ts` file containing the extracted logic. Index files become pure re-exports. The `cli.ts` imports stay the same since they import through index.

### 7. Fix remaining readonly on interfaces (H)

Fix 2 non-readonly properties in `types/settings.ts`. Verify the other 4 type files are fully compliant.

## Dependencies

1. **Batch 1 (types + lib) must come first** — type signatures from these files are used everywhere. Changing `T[]` to `ReadonlyArray<T>` in return types cascades to all consumers.
2. **Batch 2 (settings) comes next** — settings types and functions are used by many commands.
3. **Batch 3 (index files) can run in parallel with Batches 4-6** — extracting handler files is structurally independent.
4. **Batches 4-6 (commands)** can be done in any order after types/lib/settings are stable.
5. **Typecheck after each batch** — run `npm run typecheck:plugin` after each batch to catch cascading type errors early.

## Tests

### Unit Tests

- [ ] `test_existing_tests_pass_unchanged` — all existing tests in `tests/` continue to pass with no modifications
- [ ] `test_typecheck_passes` — `npm run typecheck:plugin` produces zero errors

### Verification Tests (grep-based)

- [ ] `test_no_push_calls` — grep confirms zero `.push(` in `plugin/system/src/`
- [ ] `test_no_mutable_array_types` — grep confirms zero `const.*: \w+\[\]` (mutable array type declarations)
- [ ] `test_no_mutable_record_types` — grep confirms zero unWrapped `Record<` without `Readonly<Record<` in variable declarations and return types
- [ ] `test_no_let_declarations` — grep confirms zero `let ` declarations
- [ ] `test_no_object_assign` — grep confirms zero `Object.assign(` calls
- [ ] `test_no_property_mutation` — spot-check key files for `obj.prop = value` patterns
- [ ] `test_no_mutable_set_map_ops` — grep confirms zero `.add(` on Sets, `.set(` on Maps
- [ ] `test_index_files_clean` — all `index.ts` files contain only imports/re-exports
- [ ] `test_no_mutable_sort` — no bare `.sort()` on non-spread arrays
- [ ] `test_readonly_on_interfaces` — all interface properties in `types/` have `readonly`

### Already-clean rules (no violations found — verify stays clean)

- [ ] `test_no_default_exports` — zero `export default`
- [ ] `test_no_function_keyword` — zero `function` declarations
- [ ] `test_no_class_keyword` — zero `class` declarations (except Error subclasses)
- [ ] `test_no_require` — zero `require()` calls
- [ ] `test_no_var` — zero `var` declarations
- [ ] `test_no_any` — zero `any` type annotations
- [ ] `test_no_file_extensions` — zero file extensions in imports

## Verification

- [ ] `npm run typecheck:plugin` passes with zero errors
- [ ] `npm test` passes with no regressions
- [ ] Full grep-based audit confirms zero remaining violations across all rule categories
- [ ] No behavioral changes — all refactoring is purely structural
