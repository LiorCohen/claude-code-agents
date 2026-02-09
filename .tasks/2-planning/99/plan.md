---
title: sdd-init settings reconciliation during plugin updates
created: 2026-02-09
updated: 2026-02-09
---

# Plan: sdd-init Settings Reconciliation During Plugin Updates

## Problem Summary

When users update the SDD plugin, `sdd-init` doesn't detect the version change, doesn't ensure the plugin is built, re-prompts for information that already exists, and doesn't reconcile sdd-settings with schema changes. Users can end up running with stale builds or incomplete settings.

## Files to Modify

### Source Files

| File | Changes |
|------|---------|
| `plugin/system/src/types/settings.ts` | Migrate `SddMetadata` interface (split version fields, UTC datetimes). Make `ProjectMetadata.domain` and `ProjectMetadata.type` optional. Add `RawSettingsFile` type for pre-reconciliation YAML |
| `plugin/system/src/settings/reconcile.ts` | **New file** — reconciliation logic: field migration, additive defaults, component path inference, directory mismatch detection |
| `plugin/system/src/settings/schema.ts` | Update `sddMetadataSchema` (lines 318-338): new field names, remove date-only pattern, accept UTC datetime. Update `projectMetadataSchema` (lines 341-365): make `domain` and `type` optional. Both have `additionalProperties: false` — must reflect new-format-only fields |
| `plugin/system/src/settings/index.ts` | Add re-exports for new `reconcile.ts` module (functions + types) |
| `plugin/system/src/cli.ts` | Update `loadSettings()` (line 152): parse YAML as `RawSettingsFile`, not `SettingsFile`. CLI only uses `system.logging` from settings — this field is unchanged so the cast is safe, but the type should be honest |

### Command and Skill Files

| File | Changes |
|------|---------|
| `plugin/commands/sdd-init.md` | Add Phase 0 (version detection + build) before current Phase 1. Modify Phase 1 to skip prompts for existing projects. Add Phase 2.7 for reconciliation |
| `plugin/commands/sdd-version.md` | Line 26: change `sdd.plugin_version` → `sdd.updated_by_plugin_version` (with fallback to legacy `sdd.plugin_version`). Update output to show both initialized and current versions |
| `plugin/skills/project-settings/SKILL.md` | Update schema documentation, minimal template, examples, and `create` operation parameters to reflect new metadata fields. Make `domain` and `type` optional in docs |
| `plugin/skills/project-settings/schemas/sdd-settings.schema.json` | Update `sdd` object: new field names, datetime format. Update `project` object: make `domain` and `type` optional (remove from `required`, keep in `properties`) |
| `plugin/skills/project-settings/schemas/input.schema.json` | Update `create` operation: rename `plugin_version` param, make `project_domain` and `project_type` optional |

### Test Files

| File | Changes |
|------|---------|
| `tests/src/tests/settings/reconcile.test.ts` | **New file** — unit tests for reconciliation logic |
| `tests/src/tests/unit/settings/settings-schema.test.ts` | Update assertions: lines 156-158 check for old field names (`plugin_version`, `initialized_at`, `last_updated`), lines 165-166 check `domain` and `type`. Must reflect new field names and optional status |
| `tests/src/tests/unit/settings/settings-types.test.ts` | Update assertions if interface field content changes (lines 114-115 check `readonly sdd: SddMetadata`) |
| `tests/src/tests/workflows/sdd-init.test.ts` | Add test for existing project detection (upgrade mode) |
| `tests/src/tests/workflows/sdd-change-new-external.test.ts` | Lines 121-127: update sample sdd-settings.yaml from old format (`plugin_version`, missing `sdd:` wrapper, `domain`, `type`) to new format |

### Documentation Files

| File | Changes |
|------|---------|
| `docs/commands.md` | Lines 296-298: update sdd-version description to reference new field names |

### Files That Do NOT Need Changes

| File | Why |
|------|-----|
| `plugin/system/src/settings/validate.ts` | Only validates component cross-references (databases, contracts, helm, naming). Does not check metadata field names. Reconciliation transforms old→new BEFORE validation runs, so `validate.ts` only ever sees the new format |
| `plugin/system/src/settings/sync.ts` | Only uses `Component` and `SettingsFile` types for component diffing. No references to `SddMetadata` or `ProjectMetadata` fields |
| `plugin/system/src/settings/defaults.ts` | Only contains component settings defaults, no metadata defaults |
| `plugin/skills/scaffolding/SKILL.md` | Uses `primary_domain` as its own input parameter, independent of project settings schema |
| `plugin/skills/domain-population/SKILL.md` | Same — `primary_domain` is an input parameter, not read from settings directly |
| `plugin/commands/sdd-change.md` | References `default_domain: <from sdd-settings.yaml>` but this is a read operation — the field remains readable as long as it exists. During reconciliation we preserve `domain` in the file, so existing projects still have it available. New projects won't have it, but sdd-change already handles missing domain gracefully |

## Changes

### 1. SddMetadata Schema Migration

The `SddMetadata` interface changes from single-version tracking to split init/update tracking with full UTC datetimes.

**Current → New field mapping:**
- `plugin_version` → `initialized_by_plugin_version` (immutable, set once) + `updated_by_plugin_version` (set on each reconciliation)
- `initialized_at` → keep name, change from date-only `YYYY-MM-DD` to full UTC `YYYY-MM-DD HH:MM:SSZ`
- `last_updated` → rename to `updated_at`, full UTC datetime

**`ProjectMetadata` changes:**
- `domain` and `type` become optional (deprecated — functionality moved to sdd-change)
- `name` remains required; `description` becomes optional (the minimal template already omits it)

**`RawSettingsFile` type:**

A new type for raw YAML before reconciliation. This is needed because `YAML.parse()` may return old-format fields that don't match the updated `SettingsFile` interface. The reconciler accepts `RawSettingsFile` (loose typing with `Record<string, unknown>` for `sdd` and `project`) and returns `SettingsFile` (strict typing with new field names).

### 2. Schema Validation Strategy

**Key decision: reconcile first, validate second.**

Both `schema.ts` and `sdd-settings.schema.json` have `additionalProperties: false` on the `sdd` and `project` objects. This means they cannot simultaneously accept both old and new field names. Instead:

1. The schemas are updated to the **new format only** (new field names, UTC datetime pattern)
2. The `reconcileSettings()` function transforms old format → new format
3. Schema validation runs **after** reconciliation, so it only ever validates new-format data
4. Old-format files on disk are valid — they just get reconciled before validation

This eliminates the need for `oneOf`/`anyOf` complexity in the schema.

### 3. sdd-init Command: Phase 0 — Version Detection & Build

Insert a new Phase 0 **before** the current Phase 1. This runs before any other sdd-init logic because if plugin code has changed, all subsequent logic would run against stale builds.

Behavior:
- Check if `.sdd/sdd-settings.yaml` exists
- If it does, read `sdd.updated_by_plugin_version` (or legacy `sdd.plugin_version`) — use raw YAML parse, not typed, since the file may be in old format
- Compare against current plugin version from `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`
- If versions differ: run `npm install` in plugin workspace, then `npm run build:plugin`
- If no settings file exists, this is a new project — skip version check, proceed to Phase 1

### 4. sdd-init Command: Existing Project Detection

Modify Phase 1 to detect existing projects **independent of version mismatch**:
- If `.sdd/sdd-settings.yaml` exists, load `project.name` from settings
- Skip the "Detected project name" confirmation prompt
- Skip all "new project" prompts for already-configured values
- Switch to the "upgrade/repair mode" flow already described in the command doc but not fully implemented

### 5. Settings Reconciliation Module

New file `plugin/system/src/settings/reconcile.ts` with a pure `reconcileSettings()` function.

**Input:** raw parsed YAML (`RawSettingsFile`), current plugin version (`string`), project root path (`string` — for filesystem checks)
**Output:** `ReconciliationResult` containing the reconciled `SettingsFile` and a change summary

**Reconciliation steps (in order):**

1. **Migrate `sdd` metadata fields:**
   - If `plugin_version` exists and `initialized_by_plugin_version` does not: copy `plugin_version` → `initialized_by_plugin_version`
   - Set `updated_by_plugin_version` to current plugin version
   - If `initialized_at` is date-only (`YYYY-MM-DD`): append ` 00:00:00Z`
   - If `last_updated` exists: rename to `updated_at`, set to current UTC datetime
   - Remove old field names (`plugin_version`, `last_updated`)

2. **Handle deprecated `project` fields:**
   - `domain` and `type` are **preserved in the YAML file** if they exist (no data loss, other commands may still read them)
   - They are marked optional in the TypeScript interface and JSON schema (no longer required for new projects)
   - They are NOT stripped during reconciliation — the "preservative" philosophy applies

3. **Add missing component `path` fields:**
   - For components missing `path`: check if `components/{name}/` exists on disk (flat layout) and use that; otherwise use `generateComponentPath(type, name)`
   - Never move files — just record where the component currently lives

4. **Add missing optional fields with schema defaults:**
   - Walk each component's settings and add any fields that are defined in the schema with defaults but missing from the file
   - Only add, never modify existing values (preservative philosophy)

5. **Add `system` section if missing:**
   - Add `system.logging` with defaults `{enabled: true, level: "info"}`

6. **Validate the reconciled result** using `validateSettings()`

The function returns a `ReconciliationResult` describing what was changed, so the command can inform the user.

### 6. Directory Structure Mismatch Detection

As part of reconciliation, detect and **report** (not auto-fix) mismatches:
- Component `path` in settings points to a directory that doesn't exist on disk
- Directories exist under `components/` that aren't tracked in sdd-settings
- Flat vs type-based layout discrepancies

Report format: a list of warnings included in `ReconciliationResult`, shown to the user after reconciliation completes.

### 7. sdd-init Command: Phase 2.7 — Run Reconciliation

After environment verification (Phase 2) and before structure creation (Phase 3), if this is an existing project with a version mismatch:
- Run `reconcileSettings()` on the loaded settings
- Write the reconciled settings back to `.sdd/sdd-settings.yaml`
- Display a summary of changes to the user
- Display directory mismatch warnings if any
- Skip Phase 3 (structure already exists) and Phase 4 (git already initialized)
- Jump to Phase 5 (completion message) with upgrade-specific messaging

### 8. sdd-version Command Update

Update `plugin/commands/sdd-version.md` to read the project version from the new field:
- Read `sdd.updated_by_plugin_version` (with fallback to legacy `sdd.plugin_version` for pre-reconciliation files)
- Optionally show `sdd.initialized_by_plugin_version` as "Originally created with" for context
- Update output format to reflect both versions when they differ
- Update "project outdated" message to reference `/sdd-init` for reconciliation

### 9. Schema and Documentation Updates

Update the project-settings skill, JSON schemas, and docs:
- `sdd-settings.schema.json`: new `sdd` field names, `initialized_at` pattern accepts both date and datetime, `project.domain` and `project.type` move from `required` to optional
- `schema.ts`: mirror the same changes in the programmatic schema (lines 318-365)
- `input.schema.json`: update `create` operation parameters
- `SKILL.md`: update minimal template, examples, field tables, `create` operation docs
- `docs/commands.md`: update sdd-version description

### 10. Existing Test Updates

Tests that directly assert old field names or formats must be updated:

- **`settings-schema.test.ts`** lines 156-158: change assertions from `'plugin_version'`/`'initialized_at'`/`'last_updated'` to new field names. Lines 165-166: keep `'domain'`/`'type'` assertions but verify they're optional (not in required array)
- **`settings-types.test.ts`**: verify `SddMetadata` interface has new field names
- **`sdd-change-new-external.test.ts`** lines 121-127: update sample settings to new format with `sdd:` wrapper and new field names

## Dependencies

1. **Types must change first** — `SddMetadata` and `ProjectMetadata` interface changes + `RawSettingsFile` type gate everything
2. **Both schemas update together** — `schema.ts` and `sdd-settings.schema.json` must change in sync with types
3. **Reconciliation module** — depends on updated types, imports `generateComponentPath` from sync.ts
4. **Index re-exports** — `index.ts` updated after reconcile.ts exists
5. **Command updates** — sdd-init.md and sdd-version.md depend on reconciliation module being available
6. **Existing test updates** — must change alongside the types/schemas they assert against
7. **New tests** — reconciliation unit tests written alongside the module; workflow test depends on all other changes

Recommended order:
1. Types + both schemas + existing test updates (atomic — must all change together)
2. Reconciliation module + new tests
3. Index re-exports + cli.ts type fix
4. Command updates (sdd-init.md, sdd-version.md)
5. Skill docs + input schema
6. docs/commands.md
7. Workflow test for existing project upgrade

## Tests

### Unit Tests (reconcile.test.ts)

- [ ] `test_migrates_plugin_version_to_split_fields` — `plugin_version: "6.3.6"` becomes `initialized_by_plugin_version: "6.3.6"` + `updated_by_plugin_version: "<current>"`
- [ ] `test_preserves_existing_split_version_fields` — if `initialized_by_plugin_version` already exists, it is not overwritten
- [ ] `test_migrates_last_updated_to_updated_at` — `last_updated: "2026-01-15"` becomes `updated_at: "<current UTC datetime>"`
- [ ] `test_converts_date_only_initialized_at_to_utc` — `initialized_at: "2026-01-15"` becomes `initialized_at: "2026-01-15 00:00:00Z"`
- [ ] `test_preserves_full_utc_initialized_at` — `initialized_at: "2026-01-15 10:30:00Z"` is not modified
- [ ] `test_preserves_project_domain_and_type` — existing `domain` and `type` values are kept in the output (not stripped)
- [ ] `test_does_not_require_domain_or_type_for_new_projects` — settings without `domain`/`type` pass validation
- [ ] `test_preserves_project_name_and_description` — existing values unchanged
- [ ] `test_adds_missing_component_path_using_generate` — component without `path` gets `generateComponentPath()` result
- [ ] `test_infers_existing_flat_path_from_filesystem` — component without `path` but `components/{name}/` exists on disk → uses flat path
- [ ] `test_preserves_existing_component_path` — component with `path` keeps its value unchanged
- [ ] `test_adds_missing_system_logging_section` — settings without `system` get `system.logging` with defaults
- [ ] `test_preserves_existing_system_settings` — settings with `system.logging` are not modified
- [ ] `test_adds_missing_optional_server_fields` — server without `databases` doesn't get it force-added (optional fields with defaults only added where schema requires)
- [ ] `test_preserves_empty_arrays` — `consumes_contracts: []` stays as `[]` (not removed)
- [ ] `test_preserves_all_existing_component_settings` — full round-trip: no data loss for any field
- [ ] `test_detects_path_not_on_disk` — warning for component path that doesn't exist as directory
- [ ] `test_detects_untracked_component_directories` — warning for `components/foo-server/` that's not in settings
- [ ] `test_validates_reconciled_output` — reconciled settings pass `validateSettings()`
- [ ] `test_returns_change_summary` — result describes what fields were added/migrated/removed
- [ ] `test_full_reconciliation_v636_to_v640` — end-to-end scenario from task description (v6.3.6 → v6.4.0)
- [ ] `test_already_reconciled_is_noop` — running reconciliation on already-new-format settings produces no changes

### Existing Test Updates

- [ ] `settings-schema.test.ts` — update field name assertions to match new schema
- [ ] `settings-types.test.ts` — update interface content assertions if needed
- [ ] `sdd-change-new-external.test.ts` — update sample sdd-settings.yaml to new format

### Integration Tests (sdd-init workflow)

- [ ] `test_existing_project_skips_name_prompt` — sdd-init on existing project doesn't ask for project name
- [ ] `test_version_mismatch_triggers_reconciliation` — sdd-init detects version change and reconciles

## Verification

- [ ] New projects initialize with new metadata field names (`initialized_by_plugin_version`, `updated_by_plugin_version`, `initialized_at` with UTC, `updated_at` with UTC)
- [ ] Existing projects with old field names get migrated on next `sdd-init` run
- [ ] `initialized_by_plugin_version` and `initialized_at` are never overwritten after first set
- [ ] Existing `project.domain` and `project.type` values are preserved (not stripped)
- [ ] New projects work without `domain` and `type` fields
- [ ] Plugin is built before any logic runs when version mismatch detected
- [ ] Existing project values are preserved (no data loss)
- [ ] Directory mismatches are reported but not auto-fixed
- [ ] `/sdd-version` correctly reads version from new field name (with legacy fallback)
- [ ] Schema validates new-format settings (old-format files are reconciled first, not validated directly)
- [ ] All existing tests continue to pass after updates
- [ ] `npm run build:plugin` succeeds with updated types
- [ ] `npm test` passes
