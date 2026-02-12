---
id: 82
title: Reorganize archive into .sdd directory
priority: high
status: ready
created: 2026-02-05 14:32 UTC
depends_on: []
blocks: []
---

# Task 82: Reorganize archive into .sdd directory

## Description

Move the archive directory into `.sdd/` and improve the organization of imported files with better naming conventions.

## Analysis (2026-02-12)

The `.sdd/archive/` design is **fully documented** across multiple skills and commands but **not implemented**:

- `external-spec-integration/SKILL.md` — Step 1 specifies archiving to `.sdd/archive/external-specs/` with `yyyymmdd-lowercased-filename.md`
- `workflow-state/SKILL.md` — Documents `.sdd/archive/` directory structure (external-specs, revised-specs, regressions)
- `sdd-change.md` — References the archive path and naming format
- `sdd-change-new-external.test.ts` — Test setup creates `.sdd/archive/external-specs/`

However, **no code actually performs archiving**. Skills are prompt-based with no TypeScript implementation for file copying, date prefixing, or lowercasing. The project scaffolding (`project.ts:244`) still creates a top-level `archive/` directory instead of `.sdd/archive/`.

Task #85 (external spec workflow) and #97 (plugin quality) touched related code but neither implemented archiving.

## Changes Required

1. Update project scaffolding to create `.sdd/archive/` instead of top-level `archive/`
2. Update `.claudeignore` template to reference `.sdd/archive/` instead of `archive/`
3. Implement archiving logic for external spec imports (copy to `.sdd/archive/external-specs/` with `yyyymmdd-lowercased-filename.md` naming)
4. Ensure skill output schemas include `archived_path` field

## Acceptance Criteria

- [ ] Archive directory lives at `.sdd/archive/`
- [ ] External specs are stored at `.sdd/archive/external-specs/`
- [ ] Imported files are lowercased
- [ ] Imported files have `yyyymmdd` prefix (e.g., `20260205-feature-spec.md`)
- [ ] Project scaffolding creates `.sdd/archive/` (not top-level `archive/`)
- [ ] Existing import code is updated to use new paths and naming
