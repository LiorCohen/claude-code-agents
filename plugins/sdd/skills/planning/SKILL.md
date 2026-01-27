---
name: planning
description: Templates for implementation plans.
---


# Planning Skill

## Plan Location

Plans are stored alongside their specs:

`specs/changes/YYYY/MM/DD/<change-name>/PLAN.md`

This keeps all change documentation (spec + plan) together in one location.

## Phase Structure

- Each phase is independently reviewable
- Contract changes come first
- Phases build on each other sequentially

## PR Size Guidelines

Each phase should result in a reviewable PR:

| Metric | Target | Maximum |
|--------|--------|---------|
| Lines changed | < 400 | 800 |
| Files changed | < 15 | 30 |
| Acceptance criteria | < 5 | 8 |

**If a phase exceeds limits:**
1. Split into sub-phases (e.g., Phase 2a, Phase 2b)
2. Each sub-phase gets its own PR
3. Document splits in plan

## Epic Plans

For `type: epic` changes, use the `epic-planning` skill. Epics contain multiple feature-type changes in a `changes/` subdirectory, each with its own SPEC.md and PLAN.md.

---

## Template: Implementation Plan (Feature)

```markdown
---
title: Implementation Plan: [Change Name]
change: [change-name]
type: feature
spec: ./SPEC.md
issue: [PROJ-XXX]
created: YYYY-MM-DD
sdd_version: [X.Y.Z]
---

# Implementation Plan: [Change Name]

## Overview

**Spec:** [link to spec]
**Issue:** [link to issue]

## Phases

### Phase 0: Domain Documentation (Prerequisite)
**Agent:** `spec-writer`

**CRITICAL:** This phase MUST be completed before any code implementation begins.

Tasks:
- [ ] Update `specs/domain/glossary.md` with new/modified terms
- [ ] Create/update definition specs in `specs/domain/definitions/`
- [ ] Document use cases in `specs/domain/use-cases/` (if applicable)
- [ ] Update `specs/architecture/` if architectural changes needed

Deliverables:
- Updated domain glossary
- Definition specifications for all new domain concepts
- Use case documentation (if applicable)

**Verification:**
- [ ] All new terms from the change spec are in the glossary
- [ ] All new domain concepts have definition specs
- [ ] Existing definitions updated if behavior changes

### Phase 1: API Contract
**Agent:** `api-designer`

Tasks:
- [ ] Update `components/contract/openapi.yaml`
- [ ] Add schemas for [definitions]
- [ ] Generate types

Deliverables:
- Updated OpenAPI spec
- Generated TypeScript types

### Phase 2: Backend Implementation
**Agent:** `backend-dev`

Tasks:
- [ ] Add domain definitions to `model/definitions/`
- [ ] Implement use-cases in `model/use-cases/`
- [ ] Add DAL methods
- [ ] Wire up controller

Deliverables:
- Working API endpoints

### Phase 3: Frontend Implementation
**Agent:** `frontend-dev`

Tasks:
- [ ] Create components
- [ ] Add hooks
- [ ] Integrate with API

Deliverables:
- Working UI

### Phase 4: Testing
**Agent:** `tester`

Tasks:
- [ ] Integration tests
- [ ] E2E tests

Deliverables:
- Test suites passing

### Phase 5: Review
**Agent:** `reviewer`, `db-advisor`

Tasks:
- [ ] Spec compliance review
- [ ] Database review (if applicable)

## Dependencies

- [External dependencies or blockers]

## Risks

| Risk | Mitigation |
|------|------------|
| [Risk] | [How to mitigate] |
```

---

## Template: Implementation Plan (Bugfix)

```markdown
---
title: Implementation Plan: [Change Name]
change: [change-name]
type: bugfix
spec: ./SPEC.md
issue: [BUG-XXX]
created: YYYY-MM-DD
sdd_version: [X.Y.Z]
---

# Implementation Plan: [Change Name]

## Overview

**Spec:** [link to spec]
**Issue:** [link to issue]

## Phases

### Phase 1: Investigation
**Agent:** `backend-dev` or `frontend-dev`

Tasks:
- [ ] Reproduce the bug locally
- [ ] Identify root cause
- [ ] Document findings in SPEC.md

Deliverables:
- Documented root cause
- Clear reproduction steps

### Phase 2: Implementation
**Agent:** `backend-dev` or `frontend-dev`

Tasks:
- [ ] Implement the fix
- [ ] Update any affected API contracts (if needed)
- [ ] Add input validation (if applicable)

Deliverables:
- Working fix

### Phase 3: Testing
**Agent:** `tester`

Tasks:
- [ ] Add regression test for this bug
- [ ] Verify fix resolves the issue
- [ ] Run existing test suite
- [ ] Verify no regressions

Deliverables:
- Regression test added
- All tests passing

### Phase 4: Review
**Agent:** `reviewer`

Tasks:
- [ ] Code review
- [ ] Verify acceptance criteria met
- [ ] Final QA sign-off

## Notes

- Prioritize minimal, focused changes
- Update this plan as investigation reveals more details
```

---

## Template: Implementation Plan (Refactor)

```markdown
---
title: Implementation Plan: [Change Name]
change: [change-name]
type: refactor
spec: ./SPEC.md
issue: [TECH-XXX]
created: YYYY-MM-DD
sdd_version: [X.Y.Z]
---

# Implementation Plan: [Change Name]

## Overview

**Spec:** [link to spec]
**Issue:** [link to issue]

## Phases

### Phase 1: Preparation
**Agent:** `backend-dev` or `frontend-dev`

Tasks:
- [ ] Ensure comprehensive test coverage exists
- [ ] Document current behavior
- [ ] Identify all affected areas

Deliverables:
- Test coverage report
- Affected area documentation

### Phase 2: Implementation
**Agent:** `backend-dev` or `frontend-dev`

Tasks:
- [ ] Implement refactoring changes
- [ ] Update any affected API contracts (if needed)
- [ ] Maintain backward compatibility (if required)

Deliverables:
- Refactored code

### Phase 3: Testing
**Agent:** `tester`

Tasks:
- [ ] Run existing test suite
- [ ] Verify no behavior changes
- [ ] Add tests for improved structure (if applicable)
- [ ] Performance testing (if applicable)

Deliverables:
- All tests passing
- No behavior changes verified

### Phase 4: Review
**Agent:** `reviewer`

Tasks:
- [ ] Code review focusing on refactoring goals
- [ ] Verify no regressions
- [ ] Final QA sign-off

## Notes

- All tests must pass before and after refactoring
- No functional changes should be introduced
- Update this plan as implementation progresses
```
