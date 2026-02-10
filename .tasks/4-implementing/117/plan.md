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
| `plugin/system/src/commands/scaffolding/scaffold-spec.schema.json` | **New** — JSON Schema for the scaffold spec format |
| `plugin/system/src/commands/scaffolding/apply.ts` | **New** — CLI handler for `scaffolding apply --spec <path> [--dry-run]` |
| `plugin/system/src/commands/scaffolding/index.ts` | Add `apply` action to router |
| `plugin/system/src/commands/scaffolding/project.ts` | Refactor to build a spec and call engine internally; remove meta-scripts |
| `plugin/skills/project-scaffolding/templates/project/package.json` | Remove `npm-run-all` devDependency |
| `plugin/skills/components/backend/backend-scaffolding/SKILL.md` | Replace prose scaffolding with spec-building instructions (Tier 2) |
| `plugin/skills/components/frontend/frontend-scaffolding/SKILL.md` | Replace prose scaffolding with spec-building instructions (Tier 1) |
| `plugin/skills/components/config/config-scaffolding/SKILL.md` | Add spec-building instructions for base templates (Tier 3 — dynamic sections stay as skill logic) |
| `plugin/skills/components/contract/contract-scaffolding/SKILL.md` | Replace prose scaffolding with spec-building instructions (Tier 1) |
| `plugin/skills/components/database/database-scaffolding/SKILL.md` | Replace prose scaffolding with spec-building instructions (Tier 1) |
| `plugin/skills/components/helm/helm-scaffolding/SKILL.md` | Replace prose scaffolding with spec-building instructions (Tier 2) |
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

### 2. JSON Schema (`scaffold-spec.schema.json`)

A JSON Schema file defining the spec format, colocated with the engine. Validates:
- Top-level required fields (`target_dir`, `base_dir`, `variables`, `operations`)
- Operation type discriminator and per-type required fields
- `when` condition structure (`key` + `equals`/`not_empty`)
- `if_exists` enum values (`skip`, `overwrite`)

Used by `apply.ts` for runtime validation before executing. Follows the project's existing pattern (`schemas/*.schema.json`).

### 3. CLI Handler (`apply.ts`)

Thin handler that:
- Parses `--spec <path>` and `--dry-run` from args
- Reads and JSON-parses the spec file
- Validates spec against the JSON Schema; returns structured error on validation failure
- Validates that `target_dir` and `base_dir` exist on the filesystem
- Calls `executeSpec(spec, dryRun)`
- Returns `CommandResult` with engine output as `data`

Error handling (follows project.ts patterns):
- Missing `--spec` argument → error with usage hint
- Spec file not found → error with path
- Malformed JSON → error with parse details
- Schema validation failure → error listing which fields are invalid
- `base_dir` not found → error (templates can't be resolved)
- `target_dir` not found → error (nowhere to write)
- Individual operation failures (e.g., source template missing) → logged in output, execution continues for remaining operations

### 4. Router Update (`index.ts`)

Add `'apply'` to the `ACTIONS` tuple. Add the dynamic import case for `apply.ts` in `handleScaffolding`.

### 5. Project.ts Refactor

Refactor `runScaffolding` to:
1. Build a `ScaffoldSpec` from the existing `ScaffoldingConfig` (translate component entries into operations)
2. Call `executeSpec(spec, false)`
3. Map `EngineResult` back to the existing `ScaffoldingResult` format for backward compatibility

The spec builder translates all current inline content generation into `write_file` operations:
- Root `.gitignore` (line ~400) → `write_file` with inline content
- `.claudeignore` (line ~449) → `write_file` with inline content
- `.gitkeep` files (line ~438) → `mkdir` with `gitkeep: true`
- Architecture overview (line ~609) → `write_file` (content computed by builder)
- Contract `.gitignore` (line ~650) → `write_file` with inline content
- CI/CD workflow YAML (line ~712) → `write_file` (content computed by builder)

Remove `generateMetaScripts()` and all references to meta-scripts (`dev`, `build`, `test`, `start` orchestration scripts). Keep `generateComponentScripts()` since it's used to compute per-component scripts that feed into `package_json_scripts` operations.

The existing helper functions (`substituteVariables`, `copyTemplateFile`, `copyTemplateDir`) become unused after refactoring and are removed — the engine has its own implementations.

### 6. Project Template Update

Remove `npm-run-all` from `plugin/skills/project-scaffolding/templates/project/package.json` devDependencies. This dependency was only needed by meta-scripts, which are being dropped.

### 7. Component Skills Update

Each skill gets a new "Scaffold Spec" section that replaces the prose file-creation instructions. The skill retains its domain knowledge (what a backend component needs, what conditions apply) and documents:
- Which variables to set
- Which context flags to compute from settings
- The full operations list (with `when` conditions where applicable)
- Example spec

**Tier 1 skills** (frontend, contract, database) — straightforward replacement. Prose instructions become a fixed spec with no conditions.

**Tier 2 skills** (backend, helm) — specs include `when` conditions. The skill explains which context flags to derive from settings and how.

**Tier 3 skills** (config) — different pattern. The base config component templates use the engine (`template_dir`), but dynamic config section generation (per-component YAML content) stays as skill logic. The skill builds the YAML content and passes it via `write_file` operations with `if_exists: "skip"` (additive only, never clobber existing sections). The skill explicitly documents this split: "Use the engine for the component structure. Compute config sections yourself and write them via `write_file`."

### 8. Orchestrator and Project-Scaffolding Skills

The orchestrator skill (`plugin/skills/scaffolding/SKILL.md`) is updated to describe the new flow: for each component, build a spec and invoke `scaffolding apply --spec <path>`. The LLM writes the spec JSON to `.temp/` and passes the path.

The project-scaffolding skill is updated to reference the engine for its file operations (project structure spec from the task).

## Dependencies

1. Engine core (`engine.ts`) and JSON Schema must be implemented first — all other changes depend on it
2. CLI handler (`apply.ts`) and router update (`index.ts`) can happen together, after engine
3. Project.ts refactor and template update depend on engine being complete and tested
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
- `test_handleTemplateDir_if_exists_overwrite_mixed_creates_new_and_overwrites_existing`
- `test_handleTemplateDir_source_not_found_returns_error_in_output`
- `test_handleTemplateFile_copies_single_file`
- `test_handleTemplateFile_substitutes_variables`
- `test_handleTemplateFile_skips_existing_by_default`
- `test_handleTemplateFile_overwrites_when_if_exists_overwrite`
- `test_handleTemplateFile_source_not_found_returns_error_in_output`
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

Validation and error handling:

- `test_apply_rejects_missing_spec_argument`
- `test_apply_rejects_nonexistent_spec_file`
- `test_apply_rejects_malformed_json`
- `test_apply_rejects_spec_missing_required_fields`
- `test_apply_rejects_unknown_operation_type`
- `test_apply_rejects_nonexistent_base_dir`
- `test_apply_rejects_nonexistent_target_dir`

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
- [ ] JSON Schema validates spec format and rejects malformed input
- [ ] Error handling: clear messages for missing spec, bad JSON, invalid fields, missing dirs
- [ ] `scaffolding project` still produces the same output after refactoring (minus meta-scripts)
- [ ] Meta-scripts (`dev`, `build`, `test`, `start`) and `npm-run-all` removed from project scaffolding
- [ ] All existing tests pass
- [ ] New engine tests pass
- [ ] `npm run build:plugin` succeeds
