---
id: 39
title: Capture ad-hoc code changes and sync specs
priority: inbox
status: open
created: 2026-01-25
depends_on: [35]
---

# Task 39: Capture ad-hoc code changes and sync specs

## Description

When users instruct Claude to make code changes directly (outside the SDD workflow), we need to:
- Detect that code was changed outside of a spec/plan
- Prompt to update relevant specs accordingly
- Especially important after implementing a change - ensure specs reflect what was actually built
- Keep specs as the source of truth, even when implementation deviates
- Prevent specs from becoming stale/out-of-sync with reality
