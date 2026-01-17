---
name: planning
description: Templates for implementation plans.
---

**FIRST:** Print this banner exactly (including blank lines):

```
╔══════════════════════════════════════════════════════════════════╗
║  🔧 SKILL: planning                                              ║
║  📋 Templates for implementation plans                           ║
╚══════════════════════════════════════════════════════════════════╝
```

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

### Phase 0: Domain Documentation (Prerequisite)
**Agent:** `spec-writer`
**Duration:** [X hours]

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
- [ ] All new terms from the feature spec are in the glossary
- [ ] All new domain concepts have definition specs
- [ ] Existing definitions updated if behavior changes

### Phase 1: API Contract
**Agent:** `api-designer`
**Duration:** [X hours/days]

Tasks:
- [ ] Update `components/contract/openapi.yaml`
- [ ] Add schemas for [definitions]
- [ ] Generate types

Deliverables:
- Updated OpenAPI spec
- Generated TypeScript types

### Phase 2: Backend Implementation
**Agent:** `backend-dev`
**Duration:** [X hours/days]

Tasks:
- [ ] Add domain definitions to `model/definitions/`
- [ ] Implement use-cases in `model/use-cases/`
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
