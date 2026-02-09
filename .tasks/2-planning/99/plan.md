---
title: sdd-init settings reconciliation during plugin updates
created: 2026-02-09
---

# Plan: sdd-init Settings Reconciliation During Plugin Updates

## Problem Summary

When users update the SDD plugin, `sdd-init` doesn't detect the version change, doesn't ensure the plugin is built, re-prompts for information that already exists, and doesn't reconcile sdd-settings with schema changes. Users can end up running with stale builds or incomplete settings.

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/commands/sdd-init.md` | Add Phase 0 (version detection + build) before current Phase 1. Modify Phase 1 to skip prompts for existing projects. Add Phase 2.7 for reconciliation |
| `plugin/system/src/types/settings.ts` | Migrate `SddMetadata` interface (split version fields, UTC datetimes). Make `ProjectMetadata.domain` and `ProjectMetadata.type` optional |
| `plugin/system/src/settings/reconcile.ts` | **New file** — reconciliation logic: field migration, additive defaults, component path inference, directory mismatch detection |
| `plugin/system/src/settings/validate.ts` | Update validation to accept both old and new metadata field names during migration |
| `plugin/system/src/settings/schema.ts` | Update JSON schema references if any are hardcoded here |
| `plugin/skills/project-settings/SKILL.md` | Update schema documentation, minimal template, and examples to reflect new metadata fields |
| `plugin/skills/project-settings/schemas/sdd-settings.schema.json` | Update `sdd` object schema (new fields), make `project.domain` and `project.type` optional with deprecation |
| `tests/src/tests/settings/reconcile.test.ts` | **New file** — unit tests for reconciliation logic |
| `tests/src/tests/workflows/sdd-init.test.ts` | Add test for existing project detection (upgrade mode) |

## Changes

### 1. SddMetadata Schema Migration

The `SddMetadata` interface changes from single-version tracking to split init/update tracking with full UTC datetimes.

**Current → New field mapping:**
- `plugin_version` → `initialized_by_plugin_version` (immutable, set once) + `updated_by_plugin_version` (set on each reconciliation)
- `initialized_at` → keep name, change from date-only `YYYY-MM-DD` to full UTC `YYYY-MM-DD HH:MM:SSZ`
- `last_updated` → rename to `updated_at`, full UTC datetime

`ProjectMetadata` changes:
- `domain` and `type` become optional (deprecated — functionality moved to sdd-change)
- `name` and `description` remain as-is

The JSON schema must accept **both old and new field names** during the transition — existing settings files with `plugin_version` / `last_updated` must still validate, but reconciliation will migrate them to the new names.

### 2. sdd-init Command: Phase 0 — Version Detection & Build

Insert a new Phase 0 **before** the current Phase 1. This runs before any other sdd-init logic because if plugin code has changed, all subsequent logic would run against stale builds.

Behavior:
- Check if `.sdd/sdd-settings.yaml` exists
- If it does, read `sdd.updated_by_plugin_version` (or legacy `sdd.plugin_version`)
- Compare against current plugin version from `plugin/.claude-plugin/plugin.json`
- If versions differ: run `npm install` in plugin workspace, then `npm run build:plugin`
- If no settings file exists, this is a new project — skip version check, proceed to Phase 1

### 3. sdd-init Command: Existing Project Detection

Modify Phase 1 to detect existing projects **independent of version mismatch**:
- If `.sdd/sdd-settings.yaml` exists, load `project.name` from settings
- Skip the "Detected project name" confirmation prompt
- Skip all "new project" prompts for already-configured values
- Switch to the "upgrade/repair mode" flow already described in the command doc but not fully implemented

### 4. Settings Reconciliation Module

New file `plugin/system/src/settings/reconcile.ts` with a pure `reconcileSettings()` function.

**Reconciliation steps (in order):**

1. **Migrate `sdd` metadata fields:**
   - If `plugin_version` exists and `initialized_by_plugin_version` does not: copy `plugin_version` → `initialized_by_plugin_version`
   - Set `updated_by_plugin_version` to current plugin version
   - If `initialized_at` is date-only (`YYYY-MM-DD`): append ` 00:00:00Z`
   - If `last_updated` exists: rename to `updated_at`, set to current UTC datetime
   - Remove old field names (`plugin_version`, `last_updated`)

2. **Handle deprecated `project` fields:**
   - If `domain` exists: preserve in file (no data loss) but mark as deprecated in schema
   - If `type` exists: same treatment
   - These fields remain readable but are no longer required

3. **Add missing component `path` fields:**
   - For components missing `path`: infer using `generateComponentPath(type, name)`
   - If the component directory actually exists at a different location (e.g., flat `components/{name}`), use that path instead

4. **Add missing optional fields with schema defaults:**
   - Walk each component's settings and add any fields that are defined in the schema with defaults but missing from the file
   - Only add, never modify existing values (preservative philosophy)

5. **Add `system` section if missing:**
   - Add `system.logging` with defaults `{enabled: true, level: "info"}`

6. **Validate the reconciled result** against the updated schema

The function returns a `ReconciliationResult` describing what was changed, so the command can inform the user.

### 5. Directory Structure Mismatch Detection

As part of reconciliation, detect and **report** (not auto-fix) mismatches:
- Component `path` in settings points to a directory that doesn't exist on disk
- Directories exist under `components/` that aren't tracked in sdd-settings
- Flat vs type-based layout discrepancies

Report format: a list of warnings shown to the user after reconciliation completes.

### 6. sdd-init Command: Phase 2.7 — Run Reconciliation

After environment verification (Phase 2) and before structure creation (Phase 3), if this is an existing project with a version mismatch:
- Run `reconcileSettings()` on the loaded settings
- Write the reconciled settings back to `.sdd/sdd-settings.yaml`
- Display a summary of changes to the user
- Display directory mismatch warnings if any
- Skip Phase 3 (structure already exists) and Phase 4 (git already initialized)
- Jump to Phase 5 (completion message) with upgrade-specific messaging

### 7. Schema and Skill Documentation Updates

Update the project-settings skill and JSON schema to reflect:
- New `sdd` metadata fields (both old and new accepted for backwards compatibility)
- `project.domain` and `project.type` now optional
- Minimal template uses new field names
- Examples updated to show new format

## Dependencies

1. **Types must change first** — `SddMetadata` and `ProjectMetadata` interface changes gate everything else
2. **JSON schema update** — must happen alongside type changes so validation works
3. **Reconciliation module** — depends on updated types, can be built independently of command changes
4. **Command update** — depends on reconciliation module being available
5. **Tests** — reconciliation unit tests can be written alongside the module; workflow test depends on all other changes

Recommended order: Types + Schema → Reconciliation module + tests → Command update → Skill docs → Workflow test

## Tests

### Unit Tests (reconcile.test.ts)

- [ ] `test_migrates_plugin_version_to_split_fields` — `plugin_version: "6.3.6"` becomes `initialized_by_plugin_version: "6.3.6"` + `updated_by_plugin_version: "<current>"`
- [ ] `test_preserves_existing_split_version_fields` — if `initialized_by_plugin_version` already exists, it is not overwritten
- [ ] `test_migrates_last_updated_to_updated_at` — `last_updated: "2026-01-15"` becomes `updated_at: "<current UTC datetime>"`
- [ ] `test_converts_date_only_initialized_at_to_utc` — `initialized_at: "2026-01-15"` becomes `initialized_at: "2026-01-15 00:00:00Z"`
- [ ] `test_preserves_full_utc_initialized_at` — `initialized_at: "2026-01-15 10:30:00Z"` is not modified
- [ ] `test_removes_deprecated_project_domain_and_type` — fields are removed from reconciled output
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

### Integration Tests (sdd-init workflow)

- [ ] `test_existing_project_skips_name_prompt` — sdd-init on existing project doesn't ask for project name
- [ ] `test_version_mismatch_triggers_reconciliation` — sdd-init detects version change and reconciles

## Verification

- [ ] New projects initialize with new metadata field names (`initialized_by_plugin_version`, `updated_by_plugin_version`, `initialized_at` with UTC, `updated_at` with UTC)
- [ ] Existing projects with old field names get migrated on next `sdd-init` run
- [ ] `initialized_by_plugin_version` and `initialized_at` are never overwritten after first set
- [ ] Plugin is built before any logic runs when version mismatch detected
- [ ] Existing project values are preserved (no data loss)
- [ ] Directory mismatches are reported but not auto-fixed
- [ ] Schema validates both old-format and new-format settings during transition
- [ ] All existing tests continue to pass
