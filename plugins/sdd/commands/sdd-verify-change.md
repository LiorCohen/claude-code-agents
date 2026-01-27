---
name: sdd-verify-change
description: Verify implementation matches specification.
---

# /sdd-verify-change

Verify implementation matches spec.

## Usage

```
/sdd-verify-change [path-to-change-dir]
```

## Flow

### 1. Load Spec

- Read SPEC.md
- Extract all acceptance criteria
- List all API endpoints defined
- Note all edge cases and security requirements

### 2. Map to Tests

- Find all test files referencing this spec
- Check coverage of each acceptance criterion
- Identify any gaps in test coverage

### 3. Run Tests

Via Testkube:
```bash
# Unit tests (local)
npm test --workspaces

# Integration tests (Testkube)
testkube run testsuite integration-tests --watch

# E2E tests (Testkube)
testkube run testsuite e2e-tests --watch
```

### 4. Verify Implementation

- Check that OpenAPI spec matches spec requirements
- Verify backend endpoints exist and return correct types
- Verify frontend components exist and consume correct types
- Check database schema matches domain definitions

### 4b. Epic Verification

If the change directory contains a `changes/` subdirectory, this is an epic:

1. **Verify each child change** individually (run steps 1-4 for each child in `changes/`)
2. **Verify epic-level ACs** - check that the combined child changes satisfy all acceptance criteria in the epic's SPEC.md
3. **Check cross-cutting concerns** - verify items listed in the epic spec's "Cross-Cutting Concerns" section

### 5. Report

Generate verification report:

```markdown
## Verification Report: [Change Name]

**Spec:** [path/to/SPEC.md]
**Issue:** [PROJ-XXX]
**Date:** YYYY-MM-DD

### Acceptance Criteria Coverage

| AC | Description | Tests | Status |
|----|-------------|-------|--------|
| AC1 | Given valid credentials... | ✅ 2 tests | PASS |
| AC2 | Given invalid email... | ✅ 1 test | PASS |
| AC3 | Given duplicate email... | ❌ No tests | MISSING |

### Implementation Coverage

- [x] API endpoints implemented
- [x] Backend use-cases implemented
- [x] Frontend components implemented
- [ ] Error handling complete
- [x] Database schema matches

### Test Results

**Unit Tests:** ✅ 45/45 passing
**Integration Tests:** ✅ 12/12 passing
**E2E Tests:** ⚠️ 3/4 passing (1 failure)

### Issues Found

1. **Missing test for AC3**
   - Location: Integration tests
   - Fix: Add test for duplicate email handling

2. **E2E test failure**
   - Test: "User registration with existing email"
   - Error: Element not found
   - Fix: Update selector or check UI implementation

### Recommendations

- Add missing test for AC3
- Fix E2E test failure
- Consider edge case: very long email addresses
```

## Example

```
User: /sdd-verify-change specs/changes/2026/01/11/user-auth