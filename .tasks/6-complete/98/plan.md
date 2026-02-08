---
title: Plan templates don't reference standards skills
created: 2026-02-08
---

# Plan: Plan templates don't reference standards skills

## Problem Summary

Plan templates generate PLAN.md files with generic task descriptions and no reference to which standards skills apply per phase. This causes both execution drift (agents aren't explicitly told which standards to follow) and human-readability issues (reviewers can't assess standards compliance from the plan alone).

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/skills/change-creation/templates/plan-feature.md` | Add `Standards:` field per phase, make tasks methodology-aware |
| `plugin/skills/change-creation/templates/plan-bugfix.md` | Add `Standards:` field per phase, make tasks methodology-aware |
| `plugin/skills/change-creation/templates/plan-refactor.md` | Add `Standards:` field per phase, make tasks methodology-aware |
| `plugin/skills/change-creation/templates/plan-epic.md` | No changes — epic plans coordinate child changes, not phases with agents |
| `plugin/skills/planning/SKILL.md` | Update Plan Content Guidelines and template section to match |

## Changes

### 1. plan-feature.md — Add standards and methodology-aware tasks

Each phase gets a `**Standards:**` field listing the exact skills the assigned agent must follow. Task descriptions become methodology-specific instead of generic.

**Standards mapping (derived from agent frontmatter):**

| Phase | Agent | Standards |
|-------|-------|-----------|
| API Contract | `api-designer` | `typescript-standards`, `contract-standards` |
| Backend Implementation | `backend-dev` | `typescript-standards`, `backend-standards`, `database-standards`, `unit-testing` |
| Frontend Implementation | `frontend-dev` | `typescript-standards`, `frontend-standards`, `unit-testing` |
| Helm/Infra | `devops` | `helm-standards`, `cicd-standards` |
| Integration & E2E Testing | `tester` | `testing-standards`, `integration-testing`, `e2e-testing` |
| Review | `reviewer` | `typescript-standards`, `backend-standards`, `frontend-standards`, `unit-testing` |

**Task description changes:**

- API Contract: "Update OpenAPI spec" → "Define endpoints with operationId, request/response schemas per contract-standards"
- Backend: "Implement domain logic" → "Implement Model layer (definitions + use-cases with dependency injection)", "Add data access layer" → "Implement DAL layer (one function per file, parameterized queries)", etc.
- Frontend: "Create components" → "Create View components (no business logic, TailwindCSS only)", "Add hooks" → "Create ViewModel hooks (TanStack Query for server state)", etc.
- Tester: "Integration tests" → "Integration tests per testing-standards (API layer, database queries)"
- Review: "Spec compliance review" → "Spec compliance review + standards compliance verification"

### 2. plan-bugfix.md — Add standards to investigation and fix phases

- Phase 1 (Investigation): Add `**Standards:**` matching the assigned agent (backend-dev or frontend-dev standards)
- Phase 2 (Implementation): Same agent standards, plus make "Write regression test" reference TDD methodology explicitly
- Phase 3 (Integration Testing): Add tester standards
- Phase 4 (Review): Add reviewer standards

### 3. plan-refactor.md — Add standards to preparation and implementation phases

- Phase 1 (Preparation): Add agent standards, make "Ensure comprehensive test coverage" reference unit-testing skill
- Phase 2 (Implementation): Add agent standards, make tasks reference the specific architecture being refactored (CMDO or MVVM)
- Phase 3 (Integration Testing): Add tester standards
- Phase 4 (Review): Add reviewer standards

### 4. plan-epic.md — No changes

Epic plans coordinate child changes via a dependency graph and progress table. They don't assign agents or define implementation phases — each child change has its own PLAN.md with standards. No changes needed.

### 5. planning/SKILL.md — Update guidelines and template

Two changes:

**Plan Content Guidelines (line ~51-64):** Add "Standards references per phase" to the "Acceptable in plans" list. This acknowledges that listing which standards skills apply is execution coordination, not implementation detail.

**Template section (line ~210-308):** Update the feature plan template to match the new plan-feature.md — add `Standards:` fields and methodology-aware task descriptions. The bugfix and refactor templates in this file also need matching updates.

## Dependencies

No sequencing required — all five files can be edited independently. The planning/SKILL.md template section should be updated last to ensure it matches the canonical templates in change-creation/templates/.

## Verification

- [ ] Every phase in plan-feature.md has a `**Standards:**` line listing skill names
- [ ] Every phase in plan-bugfix.md has a `**Standards:**` line
- [ ] Every phase in plan-refactor.md has a `**Standards:**` line
- [ ] plan-epic.md is unchanged (confirmed not needed)
- [ ] planning/SKILL.md "Acceptable in plans" includes standards references
- [ ] planning/SKILL.md feature template matches plan-feature.md
- [ ] planning/SKILL.md bugfix template matches plan-bugfix.md
- [ ] planning/SKILL.md refactor template matches plan-refactor.md
- [ ] Standards listed per phase match the agent's actual `skills:` frontmatter (cross-checked)
- [ ] Task descriptions reference methodology concepts (CMDO, MVVM, TDD, operationId) without going into implementation detail
