---
id: 65
title: Move external spec handling from sdd-init to sdd-new-change
priority: high
status: complete
created: 2026-01-31
completed: 2026-01-31
depends_on: []
blocks: []
---

# Task 65: Move external spec handling from sdd-init to sdd-new-change ✓

## Summary

Moved external spec import functionality from `/sdd-init --spec` to `/sdd-new-change --spec`, allowing external specs to be imported into existing projects at any time.

## Details

- `/sdd-new-change --spec <path>` now handles external spec imports
- `/sdd-init` no longer accepts `--spec` argument (focuses on project initialization)
- Updated `external-spec-integration` skill to reference new command
- Updated `product-discovery` skill to remove spec-related parameters
- Fixed `archive/` path references (was incorrectly `external/` in some places)
- Updated project scaffolding template with new command documentation
- Renamed and rewrote external spec test for new workflow
- Updated all documentation (README.md, docs/commands.md)

## Acceptance Criteria

- [x] `sdd-init` no longer accepts `--spec` argument
- [x] `sdd-init` no longer has Phase 7 (external-spec-integration)
- [x] `sdd-new-change` accepts `--spec <path>` argument
- [x] `sdd-new-change --spec` invokes external-spec-integration skill
- [x] External spec workflow produces same output (archived spec, self-sufficient SPEC.md files)
- [x] Documentation updated to reflect new command structure

## Consolidated

- #41: sdd-new-change should handle external specs
