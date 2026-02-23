# Verification Actions

Handles `verify` and `review` actions for the change orchestration skill.

---

## Action: verify

Verify implementation matches specification.

### Usage

```
/sdd-run change verify <change-id>
```

### Flow

#### Step 1: Load Spec

1. Read SPEC.md
2. Extract all acceptance criteria
3. List external interfaces
4. Note edge cases and security requirements

#### Step 2: Validate Specs Traceability

**CRITICAL**: Check that specs/ changes match SPEC.md declaration.

1. Read "Specs Directory Changes" section from SPEC.md
2. Get list of declared changes (Path, Action)
3. Compare against actual git diff for specs/
4. Fail if:
   - Any declared change wasn't made
   - Any undeclared specs/ file was changed

```
Validating specs traceability...
  Declared: specs/domain/user.md (modify) - FOUND
  Declared: specs/domain/session.md (create) - FOUND
  Undeclared changes: NONE
  Specs traceability verified
```

#### Step 3: Map to Tests

1. Find test files referencing this change
2. Check coverage of each acceptance criterion
3. Identify gaps

#### Step 4: Run Tests

```bash
# Unit tests (runner determined by tech pack)

# Integration tests (runner determined by tech pack)

# E2E tests (runner determined by tech pack)
```

#### Step 5: Verify Implementation Against Standards

For each component type affected by the change, verify the implementation follows the corresponding standards. Load standards via the tech pack:

1. Invoke `techpacks.routeSkills(phase: verification, component_type: <type>)` for each affected component type — this loads the relevant standards into context
2. Read `lifecycle.verification.agent` from the manifest to determine the verification agent
3. Review the implementation against the loaded standards
4. Flag any violations in the verification report

#### Step 6: Generate Report

```markdown
## Verification Report: Registration

**Change ID:** [user-auth-1](changes/2026/02/05/a1b2c3-user-auth/01-registration/)
**Spec:** [SPEC.md](changes/2026/02/05/a1b2c3-user-auth/01-registration/SPEC.md)
**Date:** 2026-02-05

### Specs Traceability
- All declared specs/ changes verified
- No undeclared changes detected

### Acceptance Criteria Coverage
| AC | Description | Tests | Status |
|----|-------------|-------|--------|
| AC1 | Given valid email... | 2 tests | PASS |
| AC2 | Given duplicate email... | 1 test | PASS |

### Test Results
**Unit Tests:** 45/45 passing
**Integration Tests:** 12/12 passing
**E2E Tests:** 4/4 passing

### Standards Compliance
| Standard | Status | Notes |
|----------|--------|-------|
| [standards loaded via techpacks.routeSkills] | PASS/FAIL | Details |

### Verdict: PASS
```

#### Step 7: Mark Complete

If verification passes:
```yaml
INVOKE workflow-state.complete_item with:
  change_id: <change_id>
```

#### Step 8: Advance Workflow

Move to next item:
```yaml
INVOKE workflow-state.advance with:
  workflow_id: <workflow_id>
```

### Output

```
Verifying: [user-auth-1](changes/2026/02/05/a1b2c3-user-auth/01-registration/) (Registration)

Step 1: Loading spec...
Step 2: Validating specs traceability...
  All specs/ changes match declaration
Step 3: Mapping to tests...
Step 4: Running tests...
  Unit: 45/45 passed
  Integration: 12/12 passed
  E2E: 4/4 passed
Step 5: Verifying implementation...
  All checks passed

VERIFICATION PASSED

Change [user-auth-1](changes/2026/02/05/a1b2c3-user-auth/01-registration/) marked complete.

NEXT:
  Next change: [user-auth-2](changes/2026/02/05/a1b2c3-user-auth/02-authentication/) (Authentication)
  /sdd I want to continue
```

---

## Action: review

Submit a change for user review after implementation.

### Usage

```
/sdd-run change review <change-id>
```

### Flow

1. Validate change exists and `impl_status: complete`
2. Update `review_status: ready_for_review`
3. Display review checklist

### Output

```
Submitting for review: [user-auth-1](changes/2026/02/05/a1b2c3-user-auth/01-registration/) (Registration)

Implementation complete. Ready for user review.

REVIEW CHECKLIST:
  [ ] Check [SPEC.md](changes/2026/02/05/a1b2c3-user-auth/01-registration/SPEC.md) requirements are met
  [ ] Review changed files in git diff
  [ ] Verify tests pass
  [ ] Check specs/ changes match declaration

NEXT STEPS:
  If approved: /sdd I want to verify the implementation
  If changes needed: /sdd I want to request changes
```
