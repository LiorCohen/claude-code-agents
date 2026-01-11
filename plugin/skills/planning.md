---
name: planning
description: Templates for implementation plans.
---

# Planning Skill

## Plan Location

Plans are stored alongside their specs:

`specs/features/YYYY/MM/DD/<feature-name>/PLAN.md`

This keeps all feature documentation (spec + plan) together in one location.

## Phase Sizing

- 1-2 days of work per phase
- Each phase independently deployable
- Contract changes come first

---

## Template: Implementation Plan

```markdown
---
title: Implementation Plan: [Feature Name]
spec: ./SPEC.md
issue: [PROJ-XXX]
created: YYYY-MM-DD
---

# Implementation Plan: [Feature Name]

## Overview

**Spec:** [link to spec]
**Issue:** [link to issue]
**Estimated Duration:** [X days]

## Phases

### Phase 1: API Contract
**Agent:** `api-designer`
**Duration:** [X hours/days]

Tasks:
- [ ] Update `components/contract/openapi.yaml`
- [ ] Add schemas for [entities]
- [ ] Generate types

Deliverables:
- Updated OpenAPI spec
- Generated TypeScript types

### Phase 2: Backend Implementation
**Agent:** `backend-dev`
**Duration:** [X hours/days]

Tasks:
- [ ] Add model definitions
- [ ] Implement use-cases
- [ ] Add DAL methods
- [ ] Wire up controller

Deliverables:
- Working API endpoints

### Phase 3: Frontend Implementation
**Agent:** `frontend-dev`
**Duration:** [X hours/days]

Tasks:
- [ ] Create components
- [ ] Add hooks
- [ ] Integrate with API

Deliverables:
- Working UI

### Phase 4: Testing
**Agent:** `tester`
**Duration:** [X hours/days]

Tasks:
- [ ] Integration tests
- [ ] E2E tests

Deliverables:
- Test suites passing

### Phase 5: Review
**Agent:** `reviewer`, `db-advisor`
**Duration:** [X hours]

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
