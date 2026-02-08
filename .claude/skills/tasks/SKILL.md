---
name: tasks
description: Manage tasks and plans using the .tasks/ directory.
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
├── 3-ready/              # Has plan, ready to implement
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

**Note:** Priority (high/medium/low) is a frontmatter field, not a directory. Tasks are organized by status in directories but grouped by priority in INDEX.md.

**Reference:** See [schemas.md](schemas.md) for full task/plan schemas and templates.

---

## Commands

### View Backlog

```
/tasks
/tasks list
```

Read `.tasks/INDEX.md` and display it. Skip empty sections. Omit Complete, Rejected, and Consolidated sections (archival). Render task references as clickable markdown links:
- If task has a plan.md file: link to plan.md, e.g., `[#67](.tasks/2-planning/67/plan.md)`
- Otherwise: link to task.md, e.g., `[#67](.tasks/1-inbox/67/task.md)`

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
4. Commit: "Tasks: Add #<N>"

---

### Prioritize Task

```
/tasks prioritize <id> <high|medium|low>
```

1. Update `task.md` frontmatter `priority` field
2. Move entry to correct section in INDEX.md
3. Commit: "Tasks: Prioritize #<id> as <priority>"

---

### Start Planning

```
/tasks plan <id>
```

1. Move folder to `2-planning/`
2. Update `task.md`: `status: planning`
3. Create `plan.md`
4. Update INDEX.md
5. Commit: "Tasks: Move #<id> to planning"

Output clickable link: `[plan.md](.tasks/2-planning/<id>/plan.md)`

---

### Mark Ready

```
/tasks ready <id>
```

1. Move to `3-ready/`
2. Update status
3. Update INDEX.md
4. Commit: "Tasks: Move #<id> to ready"

---

### Start Implementing

```
/tasks implement <id>
```

1. Move to `4-implementing/`
2. Update status
3. Update INDEX.md
4. Commit transition on main
5. Create feature branch: `feature/task-<id>-<slug>`
6. Create worktree at `.worktrees/task-<id>/`

**IMPORTANT:** Never implement on main. Never merge or delete worktree until `/tasks complete`.

---

### Submit for Review

```
/tasks review <id>
```

1. Move to `5-reviewing/`
2. Update status
3. Update INDEX.md
4. Commit: "Tasks: Move #<id> to reviewing"

**IMPORTANT:** Never merge or delete worktree until `/tasks complete`.

---

### Complete Task

```
/tasks complete <id>
```

1. If worktree exists:
   - Verify no uncommitted changes
   - Merge feature branch if needed
   - Remove worktree
   - Delete feature branch (if fully merged)
2. Move to `6-complete/`
3. Update status, add `completed` date
4. Update INDEX.md
5. Commit: "Tasks: Complete #<id>"

---

### Reject Task

```
/tasks reject <id> [reason]
```

1. Determine rejection reason (required)
2. Move to `7-rejected/`
3. Update status, add `rejected_reason`
4. Update INDEX.md
5. Commit: "Tasks: Reject #<id>"

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
6. Commit: "Tasks: Consolidate #<id> into #<target-id>"

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
