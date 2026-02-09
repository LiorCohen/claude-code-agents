---
title: sdd-init settings reconciliation during plugin updates
created: 2026-02-09
updated: 2026-02-09
---

# Plan: sdd-init Settings Reconciliation During Plugin Updates

## Problem Summary

When users update the SDD plugin, `sdd-init` doesn't detect the version change, doesn't ensure the plugin is built, re-prompts for information that already exists, and doesn't reconcile sdd-settings with schema changes. Users can end up running with stale builds or incomplete settings.

## Core Principle

The reconciler's job is to **translate any older sdd-settings file into the latest schema**. The output always conforms to the current schema. There is no need to remain backward-compatible with older formats — we just need to be able to read them and produce a clean, up-to-date file without requiring filesystem changes.

"Preservative" applies to **component settings values** (don't alter `databases: ["main-db"]`, don't strip `consumes_contracts: []`) — not to deprecated metadata fields being migrated away.

## Files to Modify

### Source Files

| File | Changes |
|------|---------|
| `plugin/system/src/types/settings.ts` | Migrate `SddMetadata` interface (split version fields, UTC datetimes). Remove `domain` and `type` from `ProjectMetadata`. Make `description` optional |
| `plugin/system/src/settings/reconcile.ts` | **New file** — reconciliation logic: accepts `unknown` from `YAML.parse()`, returns `SettingsFile` conforming to latest schema |
| `plugin/system/src/settings/schema.ts` | Update `sddMetadataSchema` (lines 318-338): new field names, UTC datetime pattern. Update `projectMetadataSchema` (lines 341-365): remove `domain` and `type`, make `description` optional |
| `plugin/system/src/settings/index.ts` | Add re-exports for new `reconcile.ts` module (functions + types) |
| `plugin/system/src/cli.ts` | Update `loadSettings()` (line 152): the cast `as SettingsFile` is only safe for already-reconciled files. CLI only reads `system.logging` — extract just that field instead of casting the whole object |

### Command and Skill Files

| File | Changes |
|------|---------|
| `plugin/commands/sdd-init.md` | Add Phase 0 (version detection + build) before current Phase 1. Modify Phase 1 to skip prompts for existing projects. Add Phase 2.7 for reconciliation |
| `plugin/commands/sdd-version.md` | Line 26: change `sdd.plugin_version` → `sdd.updated_by_plugin_version`. Add fallback for pre-reconciliation files. Show both initialized and current versions |
| `plugin/commands/sdd-change.md` | Line 317: remove `default_domain: <from sdd-settings.yaml>` — domain no longer lives in settings. Spec-decomposition skill already handles domain inference from spec content |
| `plugin/skills/project-settings/SKILL.md` | Update schema documentation, minimal template, examples, and `create` operation parameters. Remove `domain` and `type` references |
| `plugin/skills/project-settings/schemas/sdd-settings.schema.json` | Update `sdd` object: new field names, datetime format. Update `project` object: remove `domain` and `type` from both `required` and `properties`. Make `description` optional |
| `plugin/skills/project-settings/schemas/input.schema.json` | Update `create` operation: rename `plugin_version` param, remove `project_domain` and `project_type` |

### Test Files

| File | Changes |
|------|---------|
| `tests/src/tests/settings/reconcile.test.ts` | **New file** — unit tests for reconciliation logic |
| `tests/src/tests/unit/settings/settings-schema.test.ts` | Lines 156-158: update field name assertions to new names. Lines 165-166: remove `domain`/`type` assertions |
| `tests/src/tests/unit/settings/settings-types.test.ts` | Update interface content assertions for changed `SddMetadata` and `ProjectMetadata` fields |
| `tests/src/tests/workflows/sdd-init.test.ts` | Add test for existing project detection (upgrade mode) |
| `tests/src/tests/workflows/sdd-change-new-external.test.ts` | Lines 121-127: update sample sdd-settings.yaml to latest format (new field names, proper `sdd:` wrapper, no `domain`/`type`) |

### Documentation Files

| File | Changes |
|------|---------|
| `docs/commands.md` | Lines 296-298: update sdd-version description to reference new field names |

### Files That Do NOT Need Changes

| File | Why |
|------|-----|
| `plugin/system/src/settings/validate.ts` | Only validates component cross-references (databases, contracts, helm, naming). Does not check metadata fields. Reconciliation runs before validation |
| `plugin/system/src/settings/sync.ts` | Only uses `Component` types for component diffing. No metadata field references |
| `plugin/system/src/settings/defaults.ts` | Only contains component settings defaults |
| `plugin/skills/scaffolding/SKILL.md` | Uses `primary_domain` as its own input parameter, independent of project settings |
| `plugin/skills/domain-population/SKILL.md` | Same — `primary_domain` is an input parameter |
| `plugin/skills/spec-decomposition/SKILL.md` | Takes `default_domain` as input param; infers domain from spec content when not provided |

## Changes

### 1. SddMetadata Schema Migration

The `SddMetadata` interface changes from single-version tracking to split init/update tracking with full UTC datetimes.

**Current → New field mapping:**
- `plugin_version` → `initialized_by_plugin_version` (immutable, set once) + `updated_by_plugin_version` (set on each reconciliation)
- `initialized_at` → keep name, change from date-only `YYYY-MM-DD` to full UTC `YYYY-MM-DD HH:MM:SSZ`
- `last_updated` → rename to `updated_at`, full UTC datetime

**`ProjectMetadata` changes:**
- `domain` and `type` are **removed** (deprecated — functionality moved to sdd-change)
- `name` remains required; `description` becomes optional (the minimal template already omits it)

### 2. Schema Validation Strategy

**Key decision: reconcile first, validate second.**

Both `schema.ts` and `sdd-settings.schema.json` have `additionalProperties: false` on the `sdd` and `project` objects. The schemas are updated to the **latest format only**. The `reconcileSettings()` function transforms any older format into the latest before validation runs.

There is no need for `oneOf`/`anyOf` complexity — old-format files are never validated directly. They are always reconciled first.

### 3. sdd-init Command: Phase 0 — Version Detection & Build

Insert a new Phase 0 **before** the current Phase 1. This runs before any other sdd-init logic because if plugin code has changed, all subsequent logic would run against stale builds.

Behavior:
- Check if `.sdd/sdd-settings.yaml` exists
- If it does, raw-parse the YAML and read version from `sdd.updated_by_plugin_version` or legacy `sdd.plugin_version`
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

**Input:** raw parsed YAML (`unknown`), current plugin version (`string`), project root path (`string` — for filesystem checks)
**Output:** `ReconciliationResult` containing the reconciled `SettingsFile` and a change summary

**Reconciliation steps (in order):**

1. **Migrate `sdd` metadata fields:**
   - If `plugin_version` exists: copy to `initialized_by_plugin_version` (if not already set)
   - Set `updated_by_plugin_version` to current plugin version
   - If `initialized_at` is date-only (`YYYY-MM-DD`): convert to `YYYY-MM-DD 00:00:00Z`
   - If `last_updated` exists: discard it, set `updated_at` to current UTC datetime
   - Remove old field names (`plugin_version`, `last_updated`)

2. **Remove deprecated `project` fields:**
   - Strip `domain` and `type` from the output — these are no longer part of the schema
   - The reconciled file conforms to the latest schema which does not include them

3. **Add missing component `path` fields:**
   - For components missing `path`: check if `components/{name}/` exists on disk (flat layout) and use that; otherwise use `generateComponentPath(type, name)`
   - Never move files — just record where the component currently lives

4. **Add `system` section if missing:**
   - Add `system.logging` with defaults `{enabled: true, level: "info"}`

5. **Validate the reconciled result** using `validateSettings()`

The function returns a `ReconciliationResult` describing what was changed (fields migrated, fields removed, fields added), so the command can inform the user.

### 6. Directory Structure Mismatch Detection

As part of reconciliation, detect and **report** (not auto-fix) mismatches:
- Component `path` in settings points to a directory that doesn't exist on disk
- Directories exist under `components/` that aren't tracked in sdd-settings
- Flat vs type-based layout discrepancies

Report format: a list of warnings included in `ReconciliationResult`, shown to the user after reconciliation completes.

### 7. sdd-init Command: Phase 2.7 — Run Reconciliation

After environment verification (Phase 2) and before structure creation (Phase 3), if this is an existing project with a version mismatch:
- Run `reconcileSettings()` on the raw-parsed settings
- Write the reconciled settings back to `.sdd/sdd-settings.yaml`
- Display a summary of changes to the user
- Display directory mismatch warnings if any
- Skip Phase 3 (structure already exists) and Phase 4 (git already initialized)
- Jump to Phase 5 (completion message) with upgrade-specific messaging

### 8. sdd-version Command Update

Update `plugin/commands/sdd-version.md`:
- Read project version from `sdd.updated_by_plugin_version` (with fallback to legacy `sdd.plugin_version` for pre-reconciliation files)
- Show `sdd.initialized_by_plugin_version` as "Originally created with" for context
- Update "project outdated" message to reference `/sdd-init` for reconciliation

### 9. sdd-change Command Update

Remove `default_domain: <from sdd-settings.yaml>` from the spec-decomposition invocation (line 317). The spec-decomposition skill already infers domain from spec content when `default_domain` is not provided.

### 10. Schema and Documentation Updates

Update the project-settings skill, JSON schemas, and docs to latest format only:
- `sdd-settings.schema.json`: new `sdd` field names with UTC datetime pattern, remove `domain`/`type` from `project`
- `schema.ts`: mirror the same changes in the programmatic schema (lines 318-365)
- `input.schema.json`: update `create` operation parameters
- `SKILL.md`: update minimal template, examples, field tables, `create` operation docs
- `docs/commands.md`: update sdd-version description

### 11. Existing Test Updates

Tests that assert old field names or formats:
- **`settings-schema.test.ts`**: update assertions to new field names, remove `domain`/`type` assertions
- **`settings-types.test.ts`**: update `SddMetadata`/`ProjectMetadata` content assertions
- **`sdd-change-new-external.test.ts`**: update sample settings to latest format

## Dependencies

Recommended order:
1. Types + both schemas + existing test updates (atomic — must all change together to compile)
2. Reconciliation module + new unit tests
3. Index re-exports + cli.ts fix
4. Command updates (sdd-init.md, sdd-version.md, sdd-change.md)
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
- [ ] `test_strips_deprecated_project_domain_and_type` — existing `domain` and `type` are removed from output
- [ ] `test_works_without_domain_or_type` — settings without `domain`/`type` reconcile cleanly
- [ ] `test_preserves_project_name` — existing `name` value unchanged
- [ ] `test_preserves_project_description` — existing `description` value unchanged
- [ ] `test_works_without_description` — settings without `description` reconcile cleanly
- [ ] `test_adds_missing_component_path_using_generate` — component without `path` gets `generateComponentPath()` result
- [ ] `test_infers_existing_flat_path_from_filesystem` — component without `path` but `components/{name}/` exists on disk → uses flat path
- [ ] `test_preserves_existing_component_path` — component with `path` keeps its value unchanged
- [ ] `test_adds_missing_system_logging_section` — settings without `system` get `system.logging` with defaults
- [ ] `test_preserves_existing_system_settings` — settings with `system.logging` are not modified
- [ ] `test_preserves_empty_arrays` — `consumes_contracts: []` stays as `[]` (not removed)
- [ ] `test_preserves_all_existing_component_settings` — full round-trip: no data loss for component settings
- [ ] `test_detects_path_not_on_disk` — warning for component path that doesn't exist as directory
- [ ] `test_detects_untracked_component_directories` — warning for `components/foo-server/` that's not in settings
- [ ] `test_validates_reconciled_output` — reconciled settings pass `validateSettings()`
- [ ] `test_returns_change_summary` — result describes what fields were added/migrated/removed
- [ ] `test_full_reconciliation_v636_to_v640` — end-to-end scenario from task description (v6.3.6 → v6.4.0)
- [ ] `test_already_reconciled_is_noop` — running reconciliation on already-current-format settings produces no changes

### Existing Test Updates

- [ ] `settings-schema.test.ts` — update field name assertions to match new schema
- [ ] `settings-types.test.ts` — update interface content assertions for changed fields
- [ ] `sdd-change-new-external.test.ts` — update sample sdd-settings.yaml to latest format

### Integration Tests (sdd-init workflow)

- [ ] `test_existing_project_skips_name_prompt` — sdd-init on existing project doesn't ask for project name
- [ ] `test_version_mismatch_triggers_reconciliation` — sdd-init detects version change and reconciles

## Verification

- [ ] New projects initialize with latest metadata field names
- [ ] Existing projects with old field names get migrated on next `sdd-init` run
- [ ] `initialized_by_plugin_version` and `initialized_at` are never overwritten after first set
- [ ] Deprecated `project.domain` and `project.type` are stripped during reconciliation
- [ ] Plugin is built before any logic runs when version mismatch detected
- [ ] Component settings values are preserved (no data loss on component-level fields)
- [ ] Directory mismatches are reported but not auto-fixed
- [ ] `/sdd-version` correctly reads version from new field name (with legacy fallback)
- [ ] Reconciled output conforms to latest schema — no backward-compat format accepted by schema
- [ ] All existing tests pass after updates
- [ ] `npm run build:plugin` succeeds
- [ ] `npm test` passes
