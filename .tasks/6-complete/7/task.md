---
id: 7
title: External spec handling is broken
priority: high
status: complete
created: 2026-01-25
completed: 2026-01-28
plan: ../../plans/complete/PLAN-task-7-external-spec-handling.md
---

# Task 7: External spec handling is broken ✓

## Summary

Fixed all issues with external spec processing:
- Specs generated from `sdd-init` with external spec now include both SPEC.md and PLAN.md
- External specs with 3+ changes produce epic structures with order-preserving prefixes (01-, 02-, 03-)
- Generated specs embed full `source_content` making them completely self-sufficient
- External specs are consumed ONCE during import, then NEVER read again (archived to `specs/external/` for audit only)

**Core principle:** External specs are consumed once during import, then never referenced again. Generated SPEC.md files are completely self-sufficient.
