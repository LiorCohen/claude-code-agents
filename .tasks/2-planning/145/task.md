---
id: 145
title: Add speccing phase to task lifecycle with structural validation gate
status: planning
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
- If planning reveals the spec is incomplete, task.md must be updated — never add missing spec content to plan.md instead
- **Speccing vs planning separation:** The task spec (task.md) must contain a full record of WHAT will change — every behavioral change, every file affected, every constraint. Planning (plan.md) is purely about execution: how to split the work into small steps that minimize context window usage. Compactions and hitting the context limit are the enemy — plans exist to avoid them by breaking work into small, independently executable steps. A plan should never need to figure out *what* to build; that must already be settled in the spec.

## Scope

### In scope

- Rename `1-inbox/` to `0-inbox/`
- Create new `1-speccing/` phase directory
- Add `/tasks spec <id>` command — moves task from inbox to speccing, then interactively solicits the task spec from the user through guiding questions. Maintains a running list of open questions. There is no well-defined "end of speccing" — the user decides when the spec is complete. The goal is a user-approved task/spec with all 5 required sections filled.
- `/tasks add` stays low-ceremony — creates a minimal task.md (title + brief description). The speccing phase is where the task gets fleshed out into a proper spec.
- Update task.md specced template with 5 required sections: Description, Motivation, Scope, Constraints, Acceptance Criteria
- Add structural validation gate: `/tasks plan` must verify all 5 sections have meaningful content (not trivial one-liners or placeholders) before allowing transition from speccing to planning
- Critic as speccing exit gate: `/tasks plan` invokes `/critic` before transitioning — the critic verifies the spec is complete and coherent before planning begins
- Hard constraint: planning refuses to start if task hasn't been through speccing
- Skip-forward transitions (e.g., inbox → implementing) remain possible for simple tasks, but Claude must always challenge the user before skipping phases ("This task hasn't been specced/planned — are you sure?") and require explicit confirmation
- Spec updates during planning: if planning reveals the spec is incomplete, update task.md directly (not plan.md) and commit with a clear indication it's a planning-phase spec update. No need to move the task back to speccing for minor spec fixes
- Back-transition: `/tasks spec <id>` also works on tasks in `2-planning/` to send them back to speccing when the spec needs substantial rework
- Ensure all phase directories permanently contain `.gitkeep` files (never remove them, even when directory has tasks)
- Update all references from `1-inbox` to `0-inbox` across task skill files, INDEX.md, and existing task paths
- Add `📝 Speccing` status to backlog table display
- Update critic skill:
  - Add `0-inbox/` to directory scan (replaces `1-inbox/`)
  - Add `speccing` to status-to-phase mapping — `1-speccing/` tasks skip critic (like inbox) during interactive solicitation
  - Add Phase 1 (speccing exit gate) to phases.md — runs when `/tasks plan` is invoked to validate spec quality
  - Add `.critic/` file mapping entry for speccing phase
  - Update phase numbering if needed (current phases 2-8 may shift)
- Update path references in agents-standards, skills-standards, commands-standards, system-cli-standards (all have `1-inbox` example paths)
- Update commit skill lifecycle listing to include `speccing` phase
- Add INDEX.md "Speccing" section between Inbox and Planning in display order
- Create `.critic/speccing.md` learned-rules file for the speccing phase (starts empty or with seed rules)

### Out of scope

- No spec-review gate — speccing is interactive, user explicitly approves transition to planning
- No changes to phases 2-8 (planning through consolidated)
- Nothing inside the `plugin/` folder — changes are limited to `.claude/`, `.tasks/`, and `.critic/`
- Completed/archived task files that reference `1-inbox/` paths are historical artifacts — do NOT modify

## Constraints

- Existing tasks in inbox must be migrated to `0-inbox/` without data loss
- INDEX.md link paths must all be updated
- The tasks skill files (SKILL.md, schemas.md, workflows.md, reference.md) are the authoritative source — all must be updated consistently
- `.gitkeep` files must be present in ALL phase directories at all times
- **Branch isolation:** When working inside a feature branch or worktree, only the task associated with that branch may be modified. Never touch other tasks. Never create new tasks in a feature branch. If a new task needs to be created, create and commit it directly on main. This prevents merge conflicts on `.tasks/` (INDEX.md, task moves between phase directories) when multiple branches or worktrees are active concurrently.

## Acceptance Criteria

### Task lifecycle
- [ ] `0-inbox/` directory exists, `1-inbox/` does not
- [ ] `1-speccing/` directory exists with `.gitkeep`
- [ ] All phase directories (0-8) have `.gitkeep` files
- [ ] `/tasks spec <id>` moves a task from inbox to speccing and begins interactive solicitation
- [ ] `/tasks spec <id>` works on tasks in `2-planning/` to send them back to speccing (for substantial rework)
- [ ] During planning, spec gaps are fixed in task.md (never in plan.md)
- [ ] `/tasks plan <id>` refuses if task is not in speccing status
- [ ] `/tasks plan <id>` refuses if any of the 5 required sections lack meaningful content
- [ ] `/tasks plan <id>` invokes critic as speccing exit gate before transitioning
- [ ] Skip-forward transitions prompt the user with a challenge before proceeding
- [ ] Task template in schemas.md reflects the 5 required sections (specced template) while `/tasks add` stays minimal
- [ ] All INDEX.md links point to correct `0-inbox/` paths
- [ ] All tasks skill files (SKILL.md, schemas.md, workflows.md, reference.md) updated consistently
- [ ] Backlog table shows `📝 Speccing` status for tasks in `1-speccing/`
- [ ] Branch isolation enforced: feature branches/worktrees only modify their associated task

### Critic skill
- [ ] Critic SKILL.md scans `0-inbox/` instead of `1-inbox/`
- [ ] `speccing` status added to status-to-phase mapping (skips critic during solicitation, like inbox)
- [ ] New Phase 1 (speccing exit gate) added to phases.md with spec-quality checks
- [ ] `.critic/` file mapping includes speccing phase entry
- [ ] `.critic/speccing.md` learned-rules file created
- [ ] Critic runs as exit gate when `/tasks plan` is invoked on a speccing task

### INDEX.md structure
- [ ] New "Speccing" section exists between Inbox and Planning
- [ ] All ~40 inbox task links updated from `1-inbox/` to `0-inbox/`

### Other skills (path updates)
- [ ] agents-standards SKILL.md: `1-inbox` → `0-inbox`
- [ ] skills-standards SKILL.md: `1-inbox` → `0-inbox`
- [ ] commands-standards SKILL.md: `1-inbox` → `0-inbox`
- [ ] system-cli-standards skill.md: `1-inbox` → `0-inbox`
- [ ] commit SKILL.md: lifecycle listing includes `speccing` phase
