---
title: Fix TypeScript standards violations in plugin/system
created: 2026-02-10
---

# Plan: Fix TypeScript standards violations in plugin/system

## Problem Summary

The TypeScript code in `plugin/system/src/` has widespread violations of the project's typescript-standards. An audit identified 150+ mutable `.push()` calls, 30+ `let` declarations, direct property mutations, `Object.assign()` usage, mutable Set/Map operations, index files containing logic, and missing `readonly` modifiers across 45+ files.

## Files to Modify

### Batch 1: Lib layer (foundational — other files depend on these)

| File | Changes |
|------|---------|
| `plugin/system/src/lib/args.ts` | Replace `.push()` with spread/concat, replace `let` with `const`, replace property mutation with spread, add `readonly` to params/returns |
| `plugin/system/src/lib/config.ts` | Replace `let` with `const` + reassignment pattern |
| `plugin/system/src/lib/frontmatter.ts` | Replace property mutation with `Object.fromEntries` or spread accumulation |
| `plugin/system/src/lib/schema-validator.ts` | Replace `.push()` with spread/concat, add `readonly` to array types |

### Batch 2: Settings modules (heavily mutating, core infrastructure)

| File | Changes |
|------|---------|
| `plugin/system/src/settings/validate.ts` | Replace ~25 `.push()` calls with immutable array building, replace `.set()` on Map, add `readonly` |
| `plugin/system/src/settings/reconcile.ts` | Replace ~18 `.push()` calls, replace `let` declarations, add `readonly` |
| `plugin/system/src/settings/sync.ts` | Replace ~30 `.push()` calls, replace property mutations with spread, add `readonly` |
| `plugin/system/src/settings/sync-helm.ts` | Replace ~8 `.push()` calls, replace property mutations, add `readonly` |

### Batch 3: Index files — extract logic into dedicated handler files

| File | Changes |
|------|---------|
| `plugin/system/src/commands/contract/index.ts` | Extract `handleContract()` logic to a handler file, keep only re-exports |
| `plugin/system/src/commands/database/index.ts` | Extract `handleDatabase()` logic to a handler file |
| `plugin/system/src/commands/hook/index.ts` | Extract `handleHook()` logic to a handler file |
| `plugin/system/src/commands/version/index.ts` | Extract `handleVersion()` logic to a handler file |
| `plugin/system/src/commands/config/index.ts` | Extract `handleConfig()` logic to a handler file |
| `plugin/system/src/commands/env/index.ts` | Extract `handleEnvironment()` logic to a handler file |
| `plugin/system/src/commands/settings/index.ts` | Extract `handleSettings()` logic to a handler file |
| `plugin/system/src/commands/spec/index.ts` | Verify compliance (may already be clean) |
| `plugin/system/src/commands/scaffolding/index.ts` | Verify compliance |
| `plugin/system/src/commands/workflow/index.ts` | Verify compliance |
| `plugin/system/src/commands/permissions/index.ts` | Verify compliance |
| `plugin/system/src/commands/env/providers/index.ts` | Replace `.push()` calls, extract any logic |

### Batch 4: Command implementations — env commands

| File | Changes |
|------|---------|
| `plugin/system/src/commands/env/deploy.ts` | Replace `.push()`, replace `let`, add `readonly` |
| `plugin/system/src/commands/env/config.ts` | Replace `Object.assign()`, property mutations, `let` declarations |
| `plugin/system/src/commands/env/forward.ts` | Replace `.push()`, `let` declarations |
| `plugin/system/src/commands/env/undeploy.ts` | Replace `.push()` |
| `plugin/system/src/commands/env/status.ts` | Replace `.push()`, `let` |

### Batch 5: Command implementations — config, database, spec, hook

| File | Changes |
|------|---------|
| `plugin/system/src/commands/config/validate.ts` | Replace `.push()`, `let` |
| `plugin/system/src/commands/config/diff.ts` | Replace `.push()`, property mutations |
| `plugin/system/src/commands/config/generate.ts` | Replace property mutations, `let` |
| `plugin/system/src/commands/database/seed.ts` | Replace `.push()`, fix `.sort()` |
| `plugin/system/src/commands/database/migrate.ts` | Replace `.push()`, fix `.sort()` |
| `plugin/system/src/commands/spec/validate.ts` | Replace `.push()` |
| `plugin/system/src/commands/spec/generate-snapshot.ts` | Fix `.sort()` on Object.keys() |
| `plugin/system/src/commands/spec/generate-index.ts` | Fix `.sort()` calls |
| `plugin/system/src/commands/hook/prompt-commit.ts` | Replace `let` with const |
| `plugin/system/src/commands/hook/validate-write.ts` | Replace `let` with const |

### Batch 6: Command implementations — scaffolding, workflow, permissions

| File | Changes |
|------|---------|
| `plugin/system/src/commands/scaffolding/project.ts` | Replace ~30 `.push()` calls with immutable patterns |
| `plugin/system/src/commands/scaffolding/engine.ts` | Replace `.push()`, property mutation, `let` |
| `plugin/system/src/commands/scaffolding/domain.ts` | Replace `let` declarations |
| `plugin/system/src/commands/scaffolding/apply.ts` | Replace `let` declarations |
| `plugin/system/src/commands/workflow/check-gate.ts` | Replace `.push()` |
| `plugin/system/src/commands/permissions/configure.ts` | Replace `.add()` on Set, `let` declarations |
| `plugin/system/src/commands/settings/reconcile.ts` | Replace `let` declarations |

### Batch 7: Type definitions and remaining files

| File | Changes |
|------|---------|
| `plugin/system/src/types/component.ts` | Add `readonly` to all interface properties |
| `plugin/system/src/types/config.ts` | Add `readonly` to all interface properties |
| `plugin/system/src/types/settings.ts` | Add `readonly` to all interface properties |
| `plugin/system/src/types/spec.ts` | Add `readonly` to all interface properties |
| `plugin/system/src/types/workflow.ts` | Add `readonly` to all interface properties |
| `plugin/system/src/settings/defaults.ts` | Add `readonly` types |
| `plugin/system/src/settings/schema.ts` | Add `readonly` types |
| `plugin/system/src/settings/index.ts` | Verify only re-exports |

## Changes

### 1. Replace all mutable array operations with immutable patterns

All `.push()` calls replaced with spread (`[...arr, item]`) or functional accumulation patterns. All `.sort()` on existing references replaced with `[...arr].sort()` or `.toSorted()`. This is the largest change by volume (~150+ sites).

For functions that build up arrays in loops, the pattern shifts from:
- Mutable: declare `const arr: T[] = []`, then `arr.push(item)` in a loop
- Immutable: use `.reduce()`, `.flatMap()`, or build via `[...acc, item]`

### 2. Replace all `let` declarations with `const`

~30 `let` declarations converted. Where `let` is used for reassignment, refactor to use either:
- Conditional expressions (`condition ? a : b`)
- Immediately-invoked patterns
- Functional chaining

### 3. Replace all direct property mutation with spread

Property assignments like `obj.prop = value` replaced with `{ ...obj, prop: value }`. `Object.assign()` calls replaced with object spread.

### 4. Replace mutable Map/Set operations

`Set.add()` replaced with `new Set([...set, item])`. `Map.set()` replaced with `new Map([...map, [key, value]])`.

### 5. Extract logic from index.ts files into handler files

7 index files currently contain routing/dispatch logic. Each gets a new sibling `handler.ts` file that contains the logic, while index.ts becomes pure re-exports.

### 6. Add `readonly` modifiers throughout

- All interface/type properties get `readonly`
- Array types become `ReadonlyArray<T>`
- Function parameters get `readonly` where applicable
- Map/Set types become `ReadonlyMap`/`ReadonlySet`

## Dependencies

1. **Batch 1 (lib) must come first** — types and signatures from lib files are used by all other modules. Changing return types here affects downstream consumers.
2. **Batch 2 (settings) and Batch 7 (types) can come next** — type definitions and settings are used across commands.
3. **Batches 3-6 (commands)** can be done in any order after lib/types/settings are stable.
4. **Typecheck after each batch** — run `npm run typecheck:plugin` after each batch to catch cascading type errors early.

## Tests

### Unit Tests

- [ ] `test_existing_tests_pass_unchanged` — all existing tests in `tests/` continue to pass with no modifications
- [ ] `test_typecheck_passes` — `npm run typecheck:plugin` produces zero errors

### Verification Tests (manual/grep-based)

- [ ] `test_no_push_calls` — grep confirms zero `.push(` in `plugin/system/src/`
- [ ] `test_no_let_declarations` — grep confirms zero `let ` declarations (except justified edge cases)
- [ ] `test_no_object_assign` — grep confirms zero `Object.assign(` calls
- [ ] `test_no_default_exports` — grep confirms zero `export default` in `plugin/system/src/`
- [ ] `test_no_function_keyword` — grep confirms zero `function ` declarations (except Error subclasses)
- [ ] `test_no_class_keyword` — grep confirms zero `class ` declarations (except Error subclasses)
- [ ] `test_index_files_clean` — all `index.ts` files contain only imports/exports
- [ ] `test_no_mutable_sort` — no bare `.sort()` on non-spread arrays
- [ ] `test_readonly_on_interfaces` — all interface properties have `readonly`

## Verification

- [ ] `npm run typecheck:plugin` passes with zero errors
- [ ] `npm test` passes with no regressions
- [ ] Grep-based audit confirms zero remaining violations
- [ ] No behavioral changes — all refactoring is purely structural
