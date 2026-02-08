---
id: 105
title: Widen permission wildcards to reduce excessive permission prompts
status: open
created: 2026-02-08
depends_on: []
blocks: []
---

# Task 105: Widen permission wildcards to reduce excessive permission prompts

## Description

The plugin's permission configuration is too narrow, causing excessive permission request prompts during normal workflows. Users are repeatedly prompted for permissions that should be covered by broader wildcard patterns. The permission rules need to be reviewed and widened to cover common operations without requiring individual approval.

## Acceptance Criteria

- [ ] Audit current permission rules and identify overly narrow patterns
- [ ] Widen wildcards to cover common workflow operations (read, write, execute)
- [ ] Verify that normal sdd-init, sdd-change, and sdd-run workflows complete without unnecessary permission prompts
- [ ] Maintain security — don't over-permit sensitive operations
- [ ] Document the updated permission patterns
