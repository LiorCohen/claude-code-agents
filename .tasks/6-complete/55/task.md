---
id: 55
title: Split CHANGELOG.md into per-major-version files
priority: medium
status: complete
created: 2026-01-25
completed: 2026-01-29
---

# Task 55: Split CHANGELOG.md into per-major-version files ✓

## Summary

Split the oversized `CHANGELOG.md` (2,685 lines) into per-major-version files:
- Created `changelog/` directory with `index.md`, `v1.md`, `v2.md`, `v3.md`, `v4.md`, `v5.md`
- Root `CHANGELOG.md` now serves as index with version table + latest entries only
- Updated commit skill to document the two-file update requirement
- GitHub Actions release workflow continues to work (extracts from root file)
