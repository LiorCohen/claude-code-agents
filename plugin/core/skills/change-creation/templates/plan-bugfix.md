## Overview

Implementation plan for bugfix: <title>

Specification: [SPEC.md](./SPEC.md)

## Affected Components

- <component>

## Implementation Phases

### Phase 1: Investigation
**Agent:** `backend-dev` or `frontend-dev` (based on component)
**Standards:** <!-- backend: `typescript-standards`, `backend-standards`, `database-standards` | frontend: `typescript-standards`, `frontend-standards` -->

Tasks:
- [ ] Reproduce the bug locally
- [ ] Identify root cause within the component's architecture (CMDO layers or MVVM layers)
- [ ] Document findings in SPEC.md

Deliverables:
- Documented root cause
- Clear reproduction steps

### Phase 2: Implementation
**Agent:** `backend-dev` or `frontend-dev` (based on component)
**Standards:** <!-- backend: `typescript-standards`, `backend-standards`, `database-standards`, `unit-testing` | frontend: `typescript-standards`, `frontend-standards`, `unit-testing` -->

Tasks:
- [ ] Write regression test first using TDD (test must fail before fix)
- [ ] Implement the fix following component architecture standards
- [ ] Update any affected API contracts per contract-standards (if needed)

Deliverables:
- Working fix
- Regression test passing

### Phase 3: Integration Testing
**Agent:** `tester`
**Standards:** `testing-standards`, `integration-testing`, `e2e-testing`

Tasks:
- [ ] Verify fix resolves the issue
- [ ] Run existing test suite
- [ ] Verify no regressions

Deliverables:
- All tests passing

### Phase 4: Review
**Agent:** `reviewer`
**Standards:** `typescript-standards`, `backend-standards`, `frontend-standards`, `unit-testing`

Tasks:
- [ ] Code review against spec and component standards
- [ ] Verify acceptance criteria met
- [ ] Standards compliance verification

## Implementation State

### Current Phase

- **Phase:** [Not started | 1 | 2 | 3 | 4 | Complete]
- **Status:** [pending | in_progress | blocked | complete]
- **Last Updated:** YYYY-MM-DD HH:MM

### Resource Usage

| Phase | Tokens (Input) | Tokens (Output) | Turns | Duration |
|-------|----------------|-----------------|-------|----------|
| 1 | - | - | - | |
| 2 | - | - | - | |
| 3 | - | - | - | |
| 4 | - | - | - | |
| **Total** | **-** | **-** | **-** | **-** |

## Notes

- Prioritize minimal, focused changes
- Update this plan as investigation reveals more details
