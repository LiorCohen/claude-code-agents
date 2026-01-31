---
id: 19
title: Create task management skill in marketplace
priority: medium
status: complete
created: 2026-01-25
completed: 2026-01-28
---

# Task 19: Create task management skill in marketplace ✓

## Summary

Added task management skill at `.claude/skills/tasks/` with:
- Commands: `/tasks`, `/tasks add`, `/tasks complete`, `/tasks merge`, `/tasks prioritize`, `/tasks plan`, `/tasks plans`
- Reorganized task data into `.tasks/` directory (TASKS.md + plans/)
- Updated commit skill to verify tasks/plans are updated before committing
