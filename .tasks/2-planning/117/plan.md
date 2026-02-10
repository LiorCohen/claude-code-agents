---
title: Generic scaffolding engine in system CLI
created: 2026-02-10
---

# Plan: Generic Scaffolding Engine in System CLI

## Problem Summary

Scaffolding logic is split between the system CLI (`project.ts` — file operations) and 6 component skills (conditional logic described in prose, executed by the LLM). The deterministic parts (template copying, variable substitution, conditional directory creation) should be unified into one generic engine that accepts a declarative spec and executes it.

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/system/src/commands/scaffolding/engine.ts` | **New** — Core engine module: spec types, condition evaluator, operation handlers, executor |
| `plugin/system/src/commands/scaffolding/apply.ts` | **New** — CLI handler for `scaffolding apply --spec <path> [--dry-run]` |
| `plugin/system/src/commands/scaffolding/index.ts` | Add `apply` action to router |
| `plugin/system/src/commands/scaffolding/project.ts` | Refactor to build a spec and call engine internally; remove meta-scripts |
| `plugin/skills/components/backend/backend-scaffolding/SKILL.md` | Add spec-building instructions |
| `plugin/skills/components/frontend/frontend-scaffolding/SKILL.md` | Add spec-building instructions |
| `plugin/skills/components/config/config-scaffolding/SKILL.md` | Add spec-building instructions |
| `plugin/skills/components/contract/contract-scaffolding/SKILL.md` | Add spec-building instructions |
| `plugin/skills/components/database/database-scaffolding/SKILL.md` | Add spec-building instructions |
| `plugin/skills/components/helm/helm-scaffolding/SKILL.md` | Add spec-building instructions |
| `plugin/skills/scaffolding/SKILL.md` | Update orchestrator to use `scaffolding apply` |
| `plugin/skills/project-scaffolding/SKILL.md` | Update to reference engine invocation |
| `tests/src/tests/unit/commands/scaffolding/engine.test.ts` | **New** — Unit tests for engine core |
| `tests/src/tests/integration/scaffolding/engine-integration.test.ts` | **New** — Integration tests with real templates |

## Changes

### 1. Scaffolding Engine Core (`engine.ts`)

The engine module is the heart of this task. It contains:

- **Type definitions** for the spec schema: `ScaffoldSpec`, `ScaffoldOperation` (discriminated union for the 5 operation types), `WhenCondition`, `EngineResult`
- **`substituteVariables(content, variables)`** — extracted from project.ts, simplified to accept a flat `Record<string, string>` instead of the full `ScaffoldingConfig`. Adds built-in `DATE` and `DATE_TIME` before substitution.
- **`evaluateCondition(when, context)`** — evaluates `equals` and `not_empty` operators. Single condition or array (AND). Missing keys → false.
- **`isSubstitutableFile(filePath)`** — checks extension against the known list (`.md`, `.json`, `.yaml`, `.yml`, `.ts`, `.tsx`, `.html`, `.css`, `.js`, `.sql`)
- **Operation handlers** — one function per operation type, each returning created/skipped file lists:
  - `handleTemplateDir(op, spec, dryRun)` — walks source dir, copies files with substitution, respects `if_exists`
  - `handleTemplateFile(op, spec, dryRun)` — copies single file with substitution, respects `if_exists`
  - `handleMkdir(op, spec, dryRun)` — creates directory, optionally adds `.gitkeep`
  - `handleWriteFile(op, spec, dryRun)` — writes content with substitution, respects `if_exists`
  - `handlePackageJsonScripts(op, spec, dryRun)` — reads/merges/writes package.json scripts
- **`executeSpec(spec, dryRun)`** — main entry point. Iterates operations, evaluates conditions, dispatches to handlers, aggregates results into `EngineResult`.

All functions use existing `@/lib/fs` utilities (`ensureDir`, `writeText`, `readText`, `readJson`, `writeJson`, `walkDir`, `exists`, `copyFile`).

### 2. CLI Handler (`apply.ts`)

Thin handler that:
- Parses `--spec <path>` and `--dry-run` from args
- Reads and JSON-parses the spec file
- Validates required fields (`target_dir`, `base_dir`, `variables`, `operations`)
- Calls `executeSpec(spec, dryRun)`
- Returns `CommandResult` with engine output as `data`

### 3. Router Update (`index.ts`)

Add `'apply'` to the `ACTIONS` tuple. Add the dynamic import case for `apply.ts` in `handleScaffolding`.

### 4. Project.ts Refactor

Refactor `runScaffolding` to:
1. Build a `ScaffoldSpec` from the existing `ScaffoldingConfig` (translate component entries into operations)
2. Call `executeSpec(spec, false)`
3. Map `EngineResult` back to the existing `ScaffoldingResult` format for backward compatibility

Remove `generateMetaScripts()` and all references to meta-scripts (`dev`, `build`, `test`, `start` orchestration scripts, `npm-run-all`). Keep `generateComponentScripts()` since it's used to compute per-component scripts that feed into `package_json_scripts` operations.

The existing helper functions (`substituteVariables`, `copyTemplateFile`, `copyTemplateDir`) become unused after refactoring and are removed — the engine has its own implementations.

### 5. Component Skills Update

Each skill gets a new section explaining how to build and invoke a scaffold spec. The skill retains its domain knowledge (what a backend component needs, what conditions apply) but the "What It Creates" section now explains that the LLM should construct a spec JSON and invoke `scaffolding apply`.

The skill documents:
- Which variables to set
- Which context flags to compute from settings
- The full operations list (with `when` conditions where applicable)
- Example spec (already in task.md for most components)

The existing prose instructions for file creation are replaced with spec-building instructions.

### 6. Orchestrator and Project-Scaffolding Skills

The orchestrator skill (`plugin/skills/scaffolding/SKILL.md`) is updated to describe the new flow: for each component, build a spec and invoke `scaffolding apply --spec <path>`.

The project-scaffolding skill is updated to reference the engine for its file operations (project structure spec from the task).

## Dependencies

1. Engine core (`engine.ts`) must be implemented first — all other changes depend on it
2. CLI handler (`apply.ts`) and router update (`index.ts`) can happen together, after engine
3. Project.ts refactor depends on engine being complete and tested
4. Skill updates are independent of each other but depend on the engine working
5. Tests should be written alongside the engine (TDD for core logic)

## Tests

### Unit Tests

Engine core logic (pure functions, no filesystem):

- `test_substituteVariables_replaces_placeholders`
- `test_substituteVariables_leaves_unknown_placeholders_untouched`
- `test_substituteVariables_adds_builtin_DATE`
- `test_substituteVariables_adds_builtin_DATE_TIME`
- `test_substituteVariables_user_vars_override_builtins`
- `test_evaluateCondition_equals_true`
- `test_evaluateCondition_equals_false`
- `test_evaluateCondition_equals_string_match`
- `test_evaluateCondition_not_empty_with_nonempty_array`
- `test_evaluateCondition_not_empty_with_empty_array`
- `test_evaluateCondition_not_empty_with_nonempty_string`
- `test_evaluateCondition_not_empty_with_empty_string`
- `test_evaluateCondition_missing_key_returns_false`
- `test_evaluateCondition_array_AND_all_true`
- `test_evaluateCondition_array_AND_one_false`
- `test_evaluateCondition_undefined_when_returns_true`
- `test_isSubstitutableFile_ts_returns_true`
- `test_isSubstitutableFile_png_returns_false`
- `test_isSubstitutableFile_sql_returns_true`

Engine operations (filesystem, temp dirs):

- `test_handleTemplateDir_copies_all_files`
- `test_handleTemplateDir_substitutes_variables_in_ts_files`
- `test_handleTemplateDir_copies_binary_files_without_substitution`
- `test_handleTemplateDir_creates_intermediate_dirs`
- `test_handleTemplateDir_skips_existing_files_by_default`
- `test_handleTemplateDir_overwrites_when_if_exists_overwrite`
- `test_handleTemplateFile_copies_single_file`
- `test_handleTemplateFile_substitutes_variables`
- `test_handleTemplateFile_skips_existing_by_default`
- `test_handleTemplateFile_overwrites_when_if_exists_overwrite`
- `test_handleMkdir_creates_directory`
- `test_handleMkdir_creates_gitkeep_when_requested`
- `test_handleMkdir_idempotent_on_existing_dir`
- `test_handleWriteFile_creates_file_with_content`
- `test_handleWriteFile_substitutes_variables_in_content`
- `test_handleWriteFile_skips_existing_by_default`
- `test_handleWriteFile_overwrites_when_if_exists_overwrite`
- `test_handleWriteFile_creates_parent_dirs`
- `test_handlePackageJsonScripts_merges_new_scripts`
- `test_handlePackageJsonScripts_does_not_overwrite_existing_scripts`
- `test_handlePackageJsonScripts_warns_if_no_package_json`
- `test_handlePackageJsonScripts_creates_scripts_field_if_missing`

Full engine execution:

- `test_executeSpec_processes_operations_in_order`
- `test_executeSpec_skips_operations_with_false_conditions`
- `test_executeSpec_includes_operations_with_true_conditions`
- `test_executeSpec_dry_run_creates_no_files`
- `test_executeSpec_dry_run_returns_correct_output`
- `test_executeSpec_returns_created_and_skipped_counts`
- `test_executeSpec_returns_summary_string`

### Integration Tests

Using real plugin templates:

- `test_engine_with_frontend_spec_creates_correct_structure`
- `test_engine_with_backend_spec_conditional_dal`
- `test_engine_with_contract_spec_creates_gitignore`
- `test_engine_with_helm_spec_conditional_templates`
- `test_engine_with_project_structure_spec`
- `test_project_ts_refactored_produces_same_output`

## Verification

- [ ] `scaffolding apply --spec spec.json` creates files matching the spec
- [ ] `scaffolding apply --spec spec.json --dry-run` outputs correct structure without creating files
- [ ] Conditional operations correctly evaluate `when` clauses
- [ ] Non-destructive: existing files are skipped by default, overwritten with `if_exists: "overwrite"`
- [ ] `scaffolding project` still produces the same output after refactoring
- [ ] Meta-scripts (`dev`, `build`, `test`, `start`) are removed from project scaffolding
- [ ] All existing tests pass
- [ ] New engine tests pass
- [ ] `npm run build:plugin` succeeds
