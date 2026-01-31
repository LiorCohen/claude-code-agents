---
id: 18
title: Add commit standards skill inside plugin
priority: medium
status: complete
created: 2026-01-25
completed: 2026-01-29
plan: ../../plans/complete/PLAN-task-18-commit-standards-plugin-skill.md
---

# Task 18: Add commit standards skill inside plugin ✓

## Summary

Added `plugin/skills/commit-standards/SKILL.md` with:
- Conventional commit format (Add, Fix, Update, Remove, Refactor, Docs, Tasks)
- Changelog standards with split directory structure (`changelog/vN.md`)
- Version bump guidelines (PATCH/MINOR/MAJOR)
- SDD-aware practices: reference change directories, commit after phases
- Critical rule: commit after every filesystem change to prevent data loss
- Co-Authored-By footer with SDD Plugin version (verified with user)
