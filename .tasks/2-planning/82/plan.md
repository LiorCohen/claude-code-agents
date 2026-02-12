---
title: Reorganize archive into .sdd directory
created: 2026-02-12 14:00 UTC
updated: 2026-02-12 15:00 UTC
---

# Plan: Reorganize archive into .sdd directory

## Problem Summary

The `.sdd/archive/` directory structure is fully documented across skills, commands, and docs but:

1. Project scaffolding still creates a top-level `archive/` directory
2. The `.claudeignore` template references the old path
3. No system CLI command exists for archiving — skills do file operations directly, leading to inconsistent naming and paths
4. The output schema for external-spec-integration is missing an `archived_path` field
5. Date format examples across skills/docs use `yyyymmdd` but should be `yyyymmdd-HHmm`

This task adds an `archive` namespace to the system CLI so archiving is a reliable, consistent operation (datetime-prefix, lowercase, correct target directory), and aligns the scaffolding and all documentation with the actual design.

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/system/src/cli.ts` | Register `archive` namespace, handler, and help text |
| `plugin/system/src/commands/archive/handler.ts` | New — namespace dispatcher |
| `plugin/system/src/commands/archive/schema.ts` | New — argument validation schema |
| `plugin/system/src/commands/archive/store.ts` | New — `store` action implementation (files + directories) |
| `plugin/system/src/commands/archive/index.ts` | New — re-exports |
| `plugin/system/src/commands/scaffolding/project.ts` | Replace `archive` gitkeep with `.sdd/archive/` subdirs; fix `.claudeignore` |
| `plugin/skills/external-spec-integration/schemas/output.schema.json` | Add `archived_path` property |
| `plugin/skills/external-spec-integration/SKILL.md` | Update archiving step to invoke system CLI; update date format to `yyyymmdd-HHmm` |
| `plugin/skills/workflow-state/SKILL.md` | Update all `yyyymmdd` format examples to `yyyymmdd-HHmm` |
| `plugin/commands/sdd-change.md` | Update archive step to invoke system CLI; update date format |
| `docs/external-specs.md` | Update archive naming examples to `yyyymmdd-HHmm` format |
| `tests/src/tests/commands/archive.test.ts` | New — unit tests for archive command |
| `tests/src/tests/workflows/sdd-change-new-external.test.ts` | Strengthen archive file naming assertion |

## Changes

### 1. New `archive` namespace in system CLI

Add a new `archive` namespace following the standard command pattern:

**Action: `store`** — Archives a file or directory to `.sdd/archive/<type>/` with datetime-prefix and lowercased filename.

**CLI invocation:**
```bash
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" archive store --source <path> --type external-spec
```

**Behavior (file source):**
- Validate that source path exists
- Find project root (to locate `.sdd/`)
- Generate archive filename: `yyyymmdd-HHmm-lowercased-original-name.ext` (current UTC datetime, not file mtime)
- Ensure target directory exists (`.sdd/archive/<type>/`)
- Copy file to target
- Return archived path in `CommandResult.data`

**Behavior (directory source):**
- Validate that source path exists and is a directory
- Generate archive subdirectory: `yyyymmdd-HHmm-lowercased-dirname/`
- Copy all files preserving internal structure
- Return archived directory path and file count in `CommandResult.data`

**Supported types:** `external-spec`, `revised-spec`, `regression` (maps to subdirectory names `external-specs`, `revised-specs`, `regressions`)

**File result:**
```json
{
  "success": true,
  "message": "Archived to .sdd/archive/external-specs/20260212-1430-feature-spec.md",
  "data": {
    "archived_path": ".sdd/archive/external-specs/20260212-1430-feature-spec.md",
    "original_path": "./feature-spec.md",
    "type": "external-spec",
    "is_directory": false
  }
}
```

**Directory result:**
```json
{
  "success": true,
  "message": "Archived 5 files to .sdd/archive/external-specs/20260212-1430-spec-bundle/",
  "data": {
    "archived_path": ".sdd/archive/external-specs/20260212-1430-spec-bundle/",
    "original_path": "./spec-bundle/",
    "type": "external-spec",
    "is_directory": true,
    "file_count": 5
  }
}
```

**Error cases:**
- Source path not found
- Invalid type
- Project root not found (no `.sdd/` directory)

### 2. Register archive namespace in CLI

In `cli.ts`:
- Add `'archive'` to the `NAMESPACES` tuple
- Add `archive: handleArchive` to `COMMAND_HANDLERS`
- Add `archive` section to `HELP_TEXT` with `store` action description

### 3. Project scaffolding — archive directories

In `project.ts`, replace `'archive'` in `gitkeepDirs` with:
- `.sdd/archive/external-specs`
- `.sdd/archive/revised-specs`
- `.sdd/archive/regressions`

Note: These gitkeep dirs are only used in full-mode scaffolding. Minimal mode (`/sdd-init`) does not create them. The `archive store` command creates directories on-demand via `ensureDir`, so this is fine.

### 4. Project scaffolding — `.claudeignore` template

In `project.ts`, change `.claudeignore` content from `'archive/\n'` to `'.sdd/archive/\n'`.

### 5. Output schema — `archived_path` field

Add `archived_path` (string) to `output.schema.json` as a required property. This is the path returned by the `archive store` command.

### 6. Skill and command updates — CLI invocation

Update `external-spec-integration/SKILL.md` Step 1 (archiving) to invoke the system CLI:
```bash
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" archive store --source <external-spec-path> --type external-spec --json
```

This replaces the manual file copy + rename instructions with a single CLI call. Update both the single-file and directory archiving instructions.

Update `sdd-change.md` Step 4 (archive external spec) to invoke the same command.

### 7. Date format updates across skills and docs

All `yyyymmdd` format references become `yyyymmdd-HHmm`. Files affected:

**`external-spec-integration/SKILL.md`:**
- Line 14: `yyyymmdd-filename` → `yyyymmdd-HHmm-filename`
- Line 64: `yyyymmdd-lowercased-original-name.md` → `yyyymmdd-HHmm-lowercased-original-name.md`
- Line 66: Example `20260205-feature-spec.md` → `20260205-1430-feature-spec.md`
- Line 69: Directory format `yyyymmdd-dirname/` → `yyyymmdd-HHmm-dirname/`

**`workflow-state/SKILL.md`:**
- Line 35: `20260205-feature-spec.md` with comment → update format
- Line 67: Regression path `a1b2-1-impl-20260205/` → `a1b2-1-impl-20260205-1430/`
- Line 194, 477, 638: Similar regression/revised-spec path examples

**`sdd-change.md`:**
- Line 262: `yyyymmdd-lowercased-filename.md` → `yyyymmdd-HHmm-lowercased-filename.md`
- Line 265: Example filename

**`docs/external-specs.md`:**
- Line 50: Example `20260205-feature-requirements.md` → `20260205-1430-feature-requirements.md`

## Dependencies

1. The `archive` command implementation (changes 1-2) must be complete before skill/command updates (change 6) can reference it
2. Scaffolding changes (3, 4), schema changes (5), and date format updates (7) are independent of each other and the CLI work

## Tests

### Unit Tests

- [ ] `test_archive_store_copies_file_with_datetime_prefix` — source file is copied to `.sdd/archive/external-specs/yyyymmdd-HHmm-lowercased-name.md`
- [ ] `test_archive_store_lowercases_filename` — `MySpec.md` becomes `yyyymmdd-HHmm-myspec.md`
- [ ] `test_archive_store_preserves_extension` — `.md` extension is preserved
- [ ] `test_archive_store_creates_target_directory` — `.sdd/archive/external-specs/` is created if it doesn't exist
- [ ] `test_archive_store_returns_archived_path` — `CommandResult.data.archived_path` contains the correct relative path
- [ ] `test_archive_store_handles_directory_source` — copies all files from directory preserving structure, returns `is_directory: true` and `file_count`
- [ ] `test_archive_store_fails_on_missing_source` — returns error when source path doesn't exist
- [ ] `test_archive_store_fails_on_invalid_type` — returns error for unsupported archive type
- [ ] `test_archive_store_type_mapping` — `external-spec` maps to `external-specs/`, `revised-spec` to `revised-specs/`, `regression` to `regressions/`
- [ ] `test_scaffolding_creates_sdd_archive_subdirectories` — scaffolding creates `.sdd/archive/external-specs/`, `.sdd/archive/revised-specs/`, `.sdd/archive/regressions/` (not top-level `archive/`)
- [ ] `test_scaffolding_claudeignore_references_sdd_archive` — `.claudeignore` content is `.sdd/archive/\n`

### Integration Tests

- [ ] `test_external_spec_archived_with_datetime_prefix` — after running `/sdd-change new --spec`, the archived file exists at `.sdd/archive/external-specs/yyyymmdd-HHmm-lowercased-name.md` (strengthen existing test)

## Verification

- [ ] `npm run build:plugin` succeeds
- [ ] `npm run typecheck:plugin` succeeds
- [ ] `npm test` passes
- [ ] `sdd-system archive store --source <file> --type external-spec --json` returns correct result
- [ ] `sdd-system archive store --source <dir> --type external-spec --json` returns correct result with file count
- [ ] Scaffolding no longer creates top-level `archive/`
- [ ] `.claudeignore` references `.sdd/archive/`
- [ ] No remaining `yyyymmdd-lowercased` references (all updated to `yyyymmdd-HHmm-lowercased`)
