---
id: 114
title: Use .temp/ for test environments and preserve on failure
status: planning
priority: high
created: 2026-02-09
---

# Use .temp/ for test environments and preserve on failure

## Problem

Tests currently create temporary directories in OS temp (`/tmp`) via `mkdtemp()` and always clean them up in `afterEach`/`afterAll` hooks. When tests fail, the environment is deleted before the developer can inspect it, making it hard to understand why tests failed.

## Requirements

1. **Use `.temp/` for test environments** — Test directories should be created under the repo's `.temp/` directory instead of OS `/tmp`, making them easy to find and inspect.

2. **Preserve environments on failure** — When a test fails, its test environment should NOT be cleaned up. Only clean up on success.

3. **Keep environments discoverable** — Use meaningful directory names (test name, timestamp) so developers can identify which test produced which environment.

## Current State

- `tests/src/lib/fs.ts:62` — `mkdtemp()` uses `os.tmpdir()` (maps to `/tmp`)
- `tests/src/lib/paths.ts:17` — `TEST_OUTPUT_DIR` defaults to `/tmp/sdd-tests`
- `tests/src/lib/project.ts:27-30` — `createTestProject()` uses `TEST_OUTPUT_DIR`
- Various test files use `afterEach`/`afterAll` with `rmdir()` for unconditional cleanup
