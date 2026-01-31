---
id: 45
title: TypeScript standards - ban mutable operations
priority: medium
status: complete
created: 2026-01-25
completed: 2026-01-28
---

# Task 45: TypeScript standards: ban mutable array/object operations ✓

## Summary

Added explicit "Banned Mutable Operations" section to `.claude/skills/typescript-standards/SKILL.md`:
- Banned array methods: `.push()`, `.pop()`, `.shift()`, `.unshift()`, `.splice()`, `.sort()`, `.reverse()`, `.fill()`
- Banned object operations: direct assignment, dynamic property assignment, `delete`
- Banned Map/Set mutations: `.set()`, `.delete()`, `.add()`, `.clear()`
- Each banned operation includes the immutable alternative
- Updated summary checklist with new mutation checks
