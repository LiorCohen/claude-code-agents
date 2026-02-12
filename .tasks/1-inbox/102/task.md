---
id: 102
title: sdd-change verify should never mark complete without explicit user authorization
status: inbox
created: 2026-02-08 10:08 UTC
depends_on: []
blocks: []
---

# Task 102: sdd-change verify should never mark complete without explicit user authorization

## Description

The `sdd-change verify` step should never automatically mark a change as complete. Completion must always require explicit user authorization/confirmation. This prevents premature closure of changes when verification passes but the user hasn't reviewed or approved the results.

## Acceptance Criteria

- [ ] `sdd-change verify` never auto-completes a change
- [ ] User is prompted for explicit confirmation before marking complete
- [ ] Verification results are displayed to the user before any completion prompt
- [ ] If verification fails, no completion prompt is shown
