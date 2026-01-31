---
id: 37
title: Plan revision workflow for iterative development
priority: inbox
status: open
created: 2026-01-25
---

# Task 37: Plan revision workflow for iterative development

## Description

Developers often discover needed changes mid-implementation. Need a workflow for "I've started implementing, but want to revise the plan":
- New command like `/sdd-revise-plan <change-dir>`
- Acknowledge current implementation state
- Allow updating PLAN.md (and possibly SPEC.md if requirements changed)
- Track which phases need to be re-done
- Maintain history of revisions (audit trail)
- Handle partial implementations gracefully
- Support the natural iterative loop: implement → learn → revise → re-implement
