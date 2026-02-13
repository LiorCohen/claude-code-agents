---
id: 132
title: "Fix critic skill: use datetime-based filenames for .temp output"
priority: high
status: complete
created: 2026-02-13 15:30 UTC
completed: 2026-02-13 15:45 UTC
depends_on: []
blocks: []
---

# Task 132: Fix critic skill: use datetime-based filenames for .temp output ✓

## Summary

Updated the critic skill to use datetime-based filenames for `.temp/` output files instead of hardcoded names. The naming pattern is now `<datetime>-critic-brief-<task-id>.md` (e.g., `2026-02-13-1530-critic-brief-107.md`).

## Details

- Updated `SKILL.md` brief generation section with new naming convention
- Updated `SKILL.md` reviewer launch section to inject actual brief path
- Updated `resources/reviewer-prompt.md` to reference dynamic brief path instead of hardcoded `.temp/critic-brief.md`
