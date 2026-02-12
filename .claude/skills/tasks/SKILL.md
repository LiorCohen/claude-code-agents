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
├── 1-inbox/              # Open tasks (not yet started)
├── 2-planning/           # Plan being created
├── 3-plan-review/        # Plan review checkpoint
│   └── .gitkeep
├── 4-implementing/       # Currently being worked on
│   └── .gitkeep
├── 5-reviewing/          # Implementation complete, under review
│   └── .gitkeep
├── 6-complete/           # Done
├── 7-rejected/           # Rejected or irrelevant
└── 8-consolidated/       # Consolidated into other tasks
```

**Note:** `.gitkeep` files ensure empty directories are tracked in git. Do not delete these files.

Each task is a folder named by its ID containing:
- `task.md` - the task description and metadata
- `plan.md` - the implementation plan (created during planning phase)
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

Run the colocated script and output the result verbatim:

```bash
bash .claude/skills/tasks/list-backlog.sh
```

**MANDATORY — ZERO TRUNCATION:** Output the script's stdout exactly as produced — every line, every section, every task. Do NOT summarize, collapse, group, abbreviate, or replace any section with counts like "N more tasks". The user needs to see the full backlog. If you truncate any part of the output, the skill has failed.

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
2. Create `1-inbox/<N>/task.md`
3. Add to INDEX.md under Inbox
4. Use commit skill: `Skill(commit, args: '-m "Tasks: Add #<N>"')`

**Critic check:** After committing, invoke `/critic` for self-review before presenting the task to the user.

---

### Prioritize Task

```
/tasks prioritize <id> <high|medium|low>
```

1. Update `task.md` frontmatter `priority` field
2. Move entry to correct priority sub-section under Inbox in INDEX.md
3. Use commit skill: `Skill(commit, args: '-m "Tasks: Prioritize #<id> as <priority>"')`

---

### Start Planning

```
/tasks plan <id>
```

**Phase 1 — Transition (do this first, before any planning work):**
1. Move folder to `2-planning/`
2. Update `task.md`: `status: planning`
3. Create empty `plan.md` skeleton (frontmatter + headings only, no content)
4. Update INDEX.md
5. Use commit skill: `Skill(commit, args: '-m "Tasks: Move #<id> to planning"')`

**Phase 2 — Plan (only after commit completes):**
6. Research the codebase and write the actual plan content in `plan.md`

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

- `/tasks add` → add to inbox, commit, stop. Do NOT proceed to plan.
- `/tasks plan` → move to planning, create plan, commit, stop. Do NOT proceed to plan-review/implement.
- `/tasks plan-review` → move to plan-review, commit, stop. Do NOT proceed to implement.
- `/tasks implement` → move to implementing, create branch, commit, stop. Do NOT start coding.

The user decides when to advance. Always wait for their instruction.

---

## Quick Reference

- **Task numbering:** Permanent IDs, never reused. Find highest + 1.
- **Commit every transition:** Use `Tasks:` prefix
- **Inbox first:** New tasks → inbox, prioritize later
- **Worktree lifecycle:** Created by `/tasks implement`, removed by `/tasks complete`
- **Preserve content:** Never lose original content when consolidating/rejecting

**Full documentation:**
- [schemas.md](schemas.md) - Task/plan formats and templates
- [workflows.md](workflows.md) - Detailed command workflows
- [reference.md](reference.md) - Best practices and lifecycles
