---
title: Use .temp/ for test environments and preserve on failure
created: 2026-02-09
---

# Plan: Use .temp/ for test environments and preserve on failure

## Problem Summary

Tests create temp directories in OS `/tmp` and unconditionally delete them after each test. When a test fails, the developer cannot inspect the environment because it's already been cleaned up. The `.temp/` directory at the repo root is gitignored and designed for exactly this purpose.

## Files to Modify

| File | Changes |
|------|---------|
| `tests/src/lib/paths.ts` | Change `TEST_OUTPUT_DIR` default from `/tmp/sdd-tests` to `<REPO_ROOT>/.temp/test-runs` |
| `tests/src/lib/fs.ts` | Change `mkdtemp` to use `TEST_OUTPUT_DIR` instead of `os.tmpdir()` |
| `tests/src/lib/project.ts` | Add `TestContext` parameter to `cleanupTestProject`; skip cleanup on failure |
| `tests/src/lib/index.ts` | Export new `cleanupOnSuccess` helper |
| `tests/src/tests/unit/commands/config/generate.test.ts` | Use conditional cleanup |
| `tests/src/tests/unit/commands/config/validate.test.ts` | Use conditional cleanup |
| `tests/src/tests/unit/commands/config/diff.test.ts` | Use conditional cleanup |
| `tests/src/tests/unit/lib/spec-utils.test.ts` | Use conditional cleanup |
| `tests/src/tests/integration/database-component/scaffolding-integration.test.ts` | Use conditional cleanup |

## Changes

### 1. Redirect test directories to `.temp/test-runs`

`TEST_OUTPUT_DIR` in `paths.ts` changes from `/tmp/sdd-tests` to `path.join(REPO_ROOT, '.temp', 'test-runs')`. The env var override is kept for CI or custom setups.

`mkdtemp` in `fs.ts` changes from `os.tmpdir()` to `TEST_OUTPUT_DIR`, so all temp directories (both `mkdtemp` callers and `createTestProject` callers) land in the same `.temp/test-runs` location.

### 2. Add conditional cleanup helper

New `cleanupOnSuccess` function in `fs.ts` that takes a Vitest `TestContext` (or suite-level check) and only runs `rmdir` when the current test passed. Vitest provides `expect.getState().isExpectingAssertions` and `context.task.result?.state` to detect failure.

The pattern for test files:

**Per-test cleanup (beforeEach/afterEach):**
```typescript
afterEach(async (context) => {
  if (testDir && context.task.result?.state !== 'fail') {
    await rmdir(testDir);
  }
});
```

**Suite-level cleanup (beforeAll/afterAll):**
```typescript
afterAll(async (context) => {
  if (tmpDir && context.task.result?.state !== 'fail') {
    await rmdir(tmpDir);
  }
});
```

This is the simplest approach — no new abstractions needed. Each cleanup site just adds a condition check. Tests that currently don't clean up (workflow tests using `createTestProject`) remain unchanged.

### 3. Update all cleanup sites in test files

Every `afterEach`/`afterAll` that calls `rmdir` or `cleanupTestProject` gets the conditional check added. There are 5 test files with cleanup:

1. `config/generate.test.ts` — `afterEach` with `rmdir`
2. `config/validate.test.ts` — `afterEach` with `rmdir`
3. `config/diff.test.ts` — `afterEach` with `rmdir`
4. `spec-utils.test.ts` — two `afterAll` with `rmdir`
5. `scaffolding-integration.test.ts` — `afterAll` with `rmdir`

Workflow postgresql tests (`migration`, `seed`, `schema`) only clean up Docker containers, not filesystem — no changes needed there.

### 4. Update `cleanupTestProject` in `project.ts`

Add an optional `force` parameter. Default behavior: only clean up if called explicitly (no auto-behavior change). The workflow tests that don't clean up already preserve their environments — no change needed.

## Verification

- Run `npm test` — all tests should pass
- Intentionally fail a test — its `.temp/test-runs/` directory should remain
- Pass a test — its `.temp/test-runs/` directory should be cleaned up
- `.temp/` is gitignored — no test artifacts leak into commits
