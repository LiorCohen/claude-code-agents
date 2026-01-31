---
id: 60
title: Standardize TypeScript imports and tsconfig
priority: high
status: complete
created: 2026-01-29
completed: 2026-01-30
plan: ../../plans/complete/PLAN-task-60-standardize-typescript.md
---

# Task 60: Standardize TypeScript imports and tsconfig across codebase ✓

## Summary

Standardized all TypeScript imports and configuration across the codebase:
- Changed `moduleResolution` from `NodeNext` to `Bundler` (no extensions required)
- Added `@/` path alias for clean imports via tsconfig `paths`
- Updated 57 files to remove `.js` extensions and use `@/` aliases
- Added conformance test to enforce standards automatically
- Updated typescript-standards skill with new import rules

## Details

- Updated `plugin/system/tsconfig.json` and `tests/tsconfig.json`
- Updated `tests/vitest.config.ts` with alias support
- Created `tests/src/tests/unit/standards/typescript-standards.test.ts`
- Updated `plugin/skills/typescript-standards/SKILL.md` and synced to `.claude/skills/`
