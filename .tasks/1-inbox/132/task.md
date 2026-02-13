---
id: 132
title: "Fix critic skill: use datetime-based filenames for .temp output"
priority: high
status: inbox
created: 2026-02-13 15:30 UTC
depends_on: []
blocks: []
---

# Task 132: Fix critic skill: use datetime-based filenames for .temp output

## Description

The critic skill writes brief and report files to `.temp/` but doesn't use a consistent, descriptive naming convention. Update the naming pattern to:

```
.temp/<datetime>-critic-<brief|report>-<task-id>.md
```

For example:
- `.temp/2026-02-13-1530-critic-brief-107.md`
- `.temp/2026-02-13-1530-critic-report-107.md`

## Acceptance Criteria

- [ ] Critic brief files written to `.temp/` follow the naming pattern `<datetime>-critic-brief-<task-id>.md`
- [ ] Critic report files written to `.temp/` follow the naming pattern `<datetime>-critic-report-<task-id>.md`
- [ ] Existing references in the critic skill are updated to use the new naming convention
