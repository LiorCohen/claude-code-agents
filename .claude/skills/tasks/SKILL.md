---
name: tasks
description: Manage tasks and plans using the .tasks/ directory.
model: opus
---

# Task Management Skill

Manage the project backlog, track progress, and organize implementation plans.

---

## Directory Structure

```
.tasks/
├── INDEX.md              # Index file - task numbers, titles, links
├── 0-inbox/              # Open tasks (not yet started)
├── 1-speccing/           # Spec being refined (interactive solicitation)
├── 2-planning/           # Plan being created
├── 3-plan-review/        # Plan review checkpoint
├── 4-implementing/       # Currently being worked on
├── 5-reviewing/          # Implementation complete, under review
├── 6-complete/           # Done
├── 7-rejected/           # Rejected or irrelevant
└── 8-consolidated/       # Consolidated into other tasks
```

**Note:** `.gitkeep` files ensure empty directories are tracked in git. Do not delete these files.

Each task is a folder named by its ID containing:
- `task.md` - the task description and metadata
- `plan.md` - the execution plan — implementation order, sequencing, and test plan (created during planning phase)
- `changes.md` - file changes summary (generated during review or before completion)

**Note:** Priority (high/medium/low) is a frontmatter field, not a directory. Tasks are organized by status in directories. In INDEX.md, priority sub-sections appear under the Inbox heading.

**Reference:** See [schemas.md](schemas.md) for full task/plan schemas and templates.

---

## Commands

### View Backlog

```
/tasks
/tasks list
```

Read `.tasks/INDEX.md` and display **all** non-archival tasks in a single markdown table. Omit Complete, Rejected, and Consolidated sections (archival). Never truncate, summarize, or collapse rows.

Render task references as clickable markdown links:
- If task has a plan.md file: link to plan.md, e.g., `[#67](.tasks/2-planning/67/plan.md)`
- Otherwise: link to task.md, e.g., `[#67](.tasks/0-inbox/67/task.md)`

**Table format** — one table, four columns: `Status`, `Priority`, `#`, `Task`:

```
| Status | Priority | # | Task |
|--------|----------|---|------|
```

**Status column values:**
- `📝 Speccing`
- `📐 Planning`
- `✅ Plan Review`
- `🔨 Implementing`
- `🔍 Reviewing`
- `📥 Inbox` (for tasks in 0-inbox/)

**Priority column values:**
- `🔴 High`
- `🟡 Med`
- `🔵 Low`
- `⚪ —` (unprioritized or null)

Read the `priority` field from each task's `task.md` frontmatter to populate the Priority column for all tasks, including active ones.

**Sort order:** Active statuses first (in the order listed above), then inbox tasks by priority (high, med, low, unprioritized). Within each group, sort by task ID descending.

End with a summary line:

```
**N open** — X high, Y med, Z low, W unprioritized
```

---

### View Single Task

```
/tasks 19
```

Find and read the task file at `<status-dir>/19/task.md`.

---

### Add New Task

```
/tasks add <description>
```

1. Determine next task number (highest N + 1)
2. Create `0-inbox/<N>/task.md`
3. Add to INDEX.md under Inbox
4. Use commit skill: `Skill(commit, args: '-m "Tasks: Add #<N>"')`

---

### Prioritize Task

```
/tasks prioritize <id> <high|medium|low>
```

1. Update `task.md` frontmatter `priority` field
2. Move entry to correct priority sub-section under Inbox in INDEX.md
3. Use commit skill: `Skill(commit, args: '-m "Tasks: Prioritize #<id> as <priority>"')`

---

### Start Speccing

```
/tasks spec <id>
```

Moves a task from inbox (or back from planning) to speccing, then interactively solicits the task spec from the user.

**From inbox:** Move folder to `1-speccing/`, update status to `speccing`, update INDEX.md, commit. Then begin interactive solicitation.

**From planning (back-transition for substantial rework):** Move folder back to `1-speccing/`, update status to `speccing`, update INDEX.md, commit. Then resume solicitation.

**Solicitation:** Ask guiding questions to fill in the 6 required sections (Description, Motivation, Scope, Constraints, Changes, Acceptance Criteria). Maintain a running list of open questions. There is no defined end — the user decides when the spec is complete.

**All decisions in the spec:** Every change must be fully defined during speccing — exact files, exact changes, no ambiguity. Never defer decisions to planning or label anything a "planning detail." Planning builds an execution plan for changes already decided here.

Use commit skill: `Skill(commit, args: '-m "Tasks: Move #<id> to speccing"')`

---

### Start Planning

```
/tasks plan <id>
```

**Precondition:** Task must be in `speccing` status. If not, refuse with: "Task #<id> must be specced before planning. Use `/tasks spec <id>` first."

**Speccing validation gate:** Before transitioning, verify task.md has all 6 required sections (Description, Motivation, Scope, Constraints, Changes, Acceptance Criteria) with meaningful content — not trivial one-liners or placeholders. Pay special attention to Acceptance Criteria: every criterion must have an external verification method (a command, test, grep, or observable output) — not just "Claude reads the file and confirms." If any section is missing or insufficient, refuse with details.

**Critic exit gate:** Invoke `/critic` to validate spec quality before transitioning.

**Phase 1 — Transition (do this first, before any planning work):**
1. Move folder to `2-planning/`
2. Update `task.md`: `status: planning`
3. Create empty `plan.md` skeleton (frontmatter + headings only, no content)
4. Update INDEX.md
5. Use commit skill: `Skill(commit, args: '-m "Tasks: Move #<id> to planning"')`

**Phase 2 — Build execution plan (only after commit completes):**
6. Research the codebase and write the execution plan in `plan.md` — sequencing, step-by-step implementation order, and test plan for the changes already defined in the spec. Do not redefine what changes to make; that belongs in the spec.
7. If planning reveals spec gaps (missing files, unclear changes), update task.md directly (never plan.md) and commit as a planning-phase spec update. This should be rare — a well-specced task needs no planning-phase amendments.

**Critic check:** After writing the plan, invoke `/critic` for self-review before presenting the plan to the user.

Output clickable link: `[plan.md](.tasks/2-planning/<id>/plan.md)`

---

### Mark Plan Review

```
/tasks plan-review <id>
```

**Critic check:** Before moving, invoke `/critic` for plan review self-check.

1. Move to `3-plan-review/`
2. Update status
3. Update INDEX.md
4. Use commit skill: `Skill(commit, args: '-m "Tasks: Move #<id> to plan-review"

---

### Start Implementing

```
/tasks implement <id>
```

1. Move to `4-implementing/`
2. Update status
3. Update INDEX.md
4. Use commit skill on main: `Skill(commit, args: '-m "Tasks: Move #<id> to implementing"')`
5. Create feature branch: `feature/task-<id>-<slug>`
6. Create worktree at `.worktrees/task-<id>/`

**Critic check:** After creating the feature branch, invoke `/critic` for implementation readiness self-check.

**IMPORTANT:** Never implement on main. Never merge or delete worktree until `/tasks complete`.

---

### Submit for Review

```
/tasks review <id>
```

**Critic check:** Before generating changes.md, invoke `/critic` for pre-review self-check.

1. Generate `changes.md` in the task folder with frontmatter and file summary table (see [workflows.md](workflows.md) for format)
2. **Ask the user** if they want a detailed change report (expands `changes.md` with full diffs)
3. Move to `5-reviewing/`
4. Update status
5. Update INDEX.md
6. Use commit skill: `Skill(commit, args: '-m "Tasks: Move #<id> to reviewing"

**IMPORTANT:** Never merge or delete worktree until `/tasks complete`.

---

### Complete Task

```
/tasks complete <id>
```

**Critic check:** Before finalizing, invoke `/critic` for completion self-check.

1. **Ensure `changes.md` exists** in the task folder. If missing, generate it (frontmatter + file summary table). See [workflows.md](workflows.md) for format.
2. If worktree exists:
   - Verify no uncommitted changes
   - Merge feature branch if needed
   - Remove worktree
   - Delete feature branch (if fully merged)
3. Move to `6-complete/`
4. Update status, add `completed` datetime (e.g., `completed: 2026-02-12 14:30 UTC`)
5. Update INDEX.md
6. Use commit skill: `Skill(commit, args: '-m "Tasks: Complete #<id>"

---

### Reject Task

```
/tasks reject <id> [reason]
```

1. Determine rejection reason (required)
2. Move to `7-rejected/`
3. Update status, add `rejected_reason`
4. Update INDEX.md
5. Use commit skill: `Skill(commit, args: '-m "Tasks: Reject #<id>"

---

### Consolidate Tasks

```
/tasks consolidate <id> into <target-id>
```

1. Move task to `8-consolidated/`
2. Update status, add `consolidated_into`
3. Preserve ALL original content
4. Update target task with consolidated context
5. Update INDEX.md
6. Use commit skill: `Skill(commit, args: '-m "Tasks: Consolidate #<id> into #<target-id>"

---

### Audit Backlog

```
/tasks audit
```

Scan all tasks and INDEX.md for:
1. Structural integrity
2. Frontmatter compliance
3. INDEX.md sync
4. Title/heading consistency
5. Possibly obsolete tasks
6. Dependency integrity

Write report to `.temp/tasks-audit-<datetime>.md`.

**Reference:** See [workflows.md](workflows.md) for detailed audit criteria.

---

## User Approval Rule

**CRITICAL:** Each `/tasks` command is a standalone operation. After executing the requested command, **STOP and return control to the user**. NEVER chain commands or advance a task to the next status without explicit user approval.

- `/tasks add` → add to inbox, commit, stop. Do NOT proceed to spec.
- `/tasks spec` → move to speccing (or back-transition), run solicitation, stop. Do NOT proceed to plan.
- `/tasks plan` → move to planning, create plan, commit, stop. Do NOT proceed to plan-review/implement.
- `/tasks plan-review` → move to plan-review, commit, stop. Do NOT proceed to implement.
- `/tasks implement` → move to implementing, create branch, commit, stop. Do NOT start coding.

The user decides when to advance. Always wait for their instruction.

**No phase skipping:** The lifecycle is strictly sequential: inbox → speccing → planning → plan-review → implementing → reviewing → complete. Never skip a phase and never suggest skipping one. For example, after `/tasks add`, do not offer to go "straight to planning" — the next step is always speccing.

**Branch isolation:** When working inside a feature branch or worktree, only modify the task associated with that branch. Never touch other tasks. Never create new tasks in a feature branch — create and commit them directly on main.

---

## Quick Reference

- **Task numbering:** Permanent IDs, never reused. Find highest + 1.
- **Sort order:** All INDEX.md sections are sorted by task ID **descending** (newest first). Maintain this when adding, moving, or reordering tasks.
- **Commit every transition:** Use `Tasks:` prefix
- **Inbox first:** New tasks → inbox, prioritize later
- **Worktree lifecycle:** Created by `/tasks implement`, removed by `/tasks complete`
- **Preserve content:** Never lose original content when consolidating/rejecting
- **Branch isolation:** Feature branches only modify their associated task; new tasks go on main

**Full documentation:**
- [schemas.md](schemas.md) - Task/plan formats and templates
- [workflows.md](workflows.md) - Detailed command workflows
- [reference.md](reference.md) - Best practices and lifecycles
