---
id: 145
title: Add speccing phase to task lifecycle with structural validation gate
status: inbox
priority: null
created: 2026-02-15
---

# Add speccing phase to task lifecycle with structural validation gate

## Description

Add a mandatory speccing phase between inbox and planning in the task lifecycle. Currently, task speccing happens during planning, which causes misalignment between the task description (task.md) and the implementation plan (plan.md). The speccing phase separates WHAT (task.md) from HOW (plan.md).

## Motivation

- Task descriptions are often rough sketches that get refined during planning, but refinements end up in plan.md instead of task.md
- The task description and the plan drift apart over time
- Planning should take a stable, complete spec as input — not refine the spec itself
- If planning reveals the spec was wrong, the task should go back to speccing rather than silently patching it in the plan

## Scope

### In scope

- Rename `1-inbox/` to `0-inbox/`
- Create new `1-speccing/` phase directory
- Add `/tasks spec <id>` command — moves task from inbox to speccing for interactive refinement
- Update task.md template with 5 required sections: Description, Motivation, Scope, Constraints, Acceptance Criteria
- Add structural validation gate: `/tasks plan` must verify all 5 sections are non-empty before allowing transition from speccing to planning
- Hard constraint: planning refuses to start if task hasn't been through speccing
- Ensure all phase directories permanently contain `.gitkeep` files (never remove them, even when directory has tasks)
- Update all references from `1-inbox` to `0-inbox` across task skill files, INDEX.md, and existing task paths
- Add `📝 Speccing` status to backlog table display

### Out of scope

- No spec-review gate — speccing is interactive, user explicitly approves transition to planning
- No changes to phases 2-8 (planning through consolidated)

## Constraints

- Existing tasks in inbox must be migrated to `0-inbox/` without data loss
- INDEX.md link paths must all be updated
- The tasks skill files (SKILL.md, schemas.md, workflows.md, reference.md) are the authoritative source — all must be updated consistently
- `.gitkeep` files must be present in ALL phase directories at all times

## Acceptance Criteria

- [ ] `0-inbox/` directory exists, `1-inbox/` does not
- [ ] `1-speccing/` directory exists with `.gitkeep`
- [ ] All phase directories (0-8) have `.gitkeep` files
- [ ] `/tasks spec <id>` moves a task from inbox to speccing
- [ ] `/tasks plan <id>` refuses if task is not in speccing status
- [ ] `/tasks plan <id>` refuses if any of the 5 required sections are empty
- [ ] Task template in schemas.md reflects the 5 required sections
- [ ] All INDEX.md links point to correct `0-inbox/` paths
- [ ] All tasks skill files updated consistently
- [ ] Backlog table shows `📝 Speccing` status for tasks in `1-speccing/`
