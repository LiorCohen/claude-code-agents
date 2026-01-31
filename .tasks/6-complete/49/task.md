---
id: 49
title: Auto-commit to prevent data loss
priority: high
status: complete
created: 2026-01-25
completed: 2026-01-29
plan: ../../plans/complete/PLAN-task-49-auto-commit-specs-plans.md
---

# Task 49: Auto-commit to prevent data loss ✓

## Summary

Added PostToolUse hook to prompt committing after writes to SDD-managed directories:
- Created `plugin/hooks/prompt-commit-after-write.sh` - fires after Write/Edit to `changes/`, `specs/`, `components/`, `config/`, `tests/`
- Registered hook in `plugin/hooks/hooks.json`
- Updated `sdd-new-change` with Step 6: Commit (using commit-standards format)
- Updated `sdd-init` Phase 8 with commit-standards format and error handling
- Documented in `plugin/docs/permissions.md`

Goal: Ensure no file changes are ever lost due to uncommitted work.
