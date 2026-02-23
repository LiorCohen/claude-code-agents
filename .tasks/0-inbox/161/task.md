---
id: 161
title: Create persistent threads skill for conversation thread management
status: inbox
created: 2026-02-23 12:00 UTC
depends_on: []
blocks: []
---

# Task 161: Create persistent threads skill for conversation thread management

## Description

Create a new "threads" skill for the root `.claude/skills/` directory that manages conversation threads — tracking opened topics and ensuring all are closed before a session ends. Threads are fully persistent (stored on disk) and timestamped.

## Acceptance Criteria

- [ ] Skill created at `.claude/skills/threads/`
- [ ] Threads are persistent across sessions (stored on disk)
- [ ] All thread operations are timestamped
- [ ] Supports opening, closing, and listing threads
- [ ] Surfaces unclosed threads as a reminder
