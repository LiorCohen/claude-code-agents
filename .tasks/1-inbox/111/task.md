---
id: 111
title: Fix test suite creating .sdd/ artifacts in source directories
status: inbox
priority: high
created: 2026-02-09
---

# Fix test suite creating .sdd/ artifacts in source directories

## Problem

Despite commit 5cfff56 ("Fix: Prevent tests from polluting source directories with .sdd/ artifacts"), the test suite still creates `.sdd/system-logs/` directories in the `tests/` source directory when running.

**Evidence:**
- After running `npm test`, `tests/.sdd/system-logs/system-2026-02-09.log` was created
- The previous fix attempted to address this by adding `projectRoot` parameter to the logger
- However, the issue persists

## Root Cause (To Be Investigated)

The logger in `plugin/system/src/lib/logger.ts` receives a `projectRoot` parameter, but when tests run, they may still be using `process.cwd()` which points to the `tests/` directory.

## Current Workaround

Added `tests/.gitignore` to prevent `.sdd/` and `changes/` directories from being committed, but this doesn't solve the underlying problem.

## Expected Behavior

Test runs should:
1. Never create `.sdd/` directories in source folders (`tests/`, `plugin/system/`, etc.)
2. Either disable file logging entirely during test runs
3. Or create logs in the test project directories (`/tmp/sdd-tests/...`)

## Acceptance Criteria

- [ ] No `.sdd/` directories created in `tests/` after running test suite
- [ ] No `.sdd/` directories created in `plugin/system/` after running test suite
- [ ] Test suite still captures necessary logs (if needed, in appropriate test project directories)
- [ ] Solution is robust and doesn't rely on `.gitignore` bandaids
