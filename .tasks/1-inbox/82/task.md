---
id: 82
title: Reorganize archive into .sdd directory
priority: medium
status: inbox
created: 2026-02-05
depends_on: []
blocks: []
---

# Task 82: Reorganize archive into .sdd directory

## Description

Move the archive directory into `.sdd/` and improve the organization of imported files with better naming conventions.

## Changes Required

1. Move `archive/` to `.sdd/archive/`
2. Move external specs to `.sdd/archive/external-specs/`
3. When importing files, apply naming conventions:
   - Lowercase the filename
   - Add leading `yyyymmdd` prefix to prevent conflicts

## Acceptance Criteria

- [ ] Archive directory lives at `.sdd/archive/`
- [ ] External specs are stored at `.sdd/archive/external-specs/`
- [ ] Imported files are lowercased
- [ ] Imported files have `yyyymmdd` prefix (e.g., `20260205-feature-spec.md`)
- [ ] Existing import code is updated to use new paths and naming
