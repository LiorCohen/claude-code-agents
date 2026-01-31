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
│   └── 63/
│       └── task.md
├── 2-planning/           # Plan being created
│   └── 19/
│       ├── task.md
│       └── plan.md
├── 3-ready/              # Has plan, ready to implement
├── 4-implementing/       # Currently being worked on
├── 5-reviewing/          # Implementation complete, under review
├── 6-complete/           # Done
│   └── 7/
│       ├── task.md
│       └── plan.md
├── 7-rejected/           # Rejected or irrelevant
└── 8-consolidated/       # Consolidated into other tasks
```

Each task is a folder named by its ID containing:
- `task.md` - the task description and metadata
- `plan.md` - the implementation plan (created during planning phase)

**Note:** Priority (high/medium/low) is a frontmatter field, not a directory. Tasks are organized by status in directories but grouped by priority in INDEX.md.

---

## Task Schema

All task files use YAML frontmatter.

### Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | yes | Unique task number |
| `title` | string | yes | Short title |
| `priority` | enum | no | `low`, `medium`, `high` (unset = unprioritized) |
| `status` | enum | yes | `open`, `planning`, `ready`, `implementing`, `reviewing`, `complete`, `rejected`, `consolidated` |
| `created` | date | yes | YYYY-MM-DD |
| `completed` | date | no | YYYY-MM-DD (when status=complete) |
| `consolidated_into` | number | no | Task ID (when status=consolidated) |
| `rejected_reason` | string | no | Reason for rejection (when status=rejected) |
| `depends_on` | number[] | no | Task IDs this depends on |
| `blocks` | number[] | no | Task IDs blocked by this |

### Task File Template

```markdown
---
id: 63
title: Short descriptive title
priority: medium
status: open
created: 2026-01-30
depends_on: []
blocks: []
---

# Task 63: Short descriptive title

## Description

Full description of what needs to be done.

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
```

### Completed Task Template

```markdown
---
id: 7
title: External spec handling
priority: high
status: complete
created: 2026-01-25
completed: 2026-01-28
---

# Task 7: External spec handling ✓

## Summary

Brief summary of what was accomplished.

## Details

- Fixed X
- Added Y
- Changed Z
```

### Consolidated Task Template

```markdown
---
id: 28
title: Schema validation skill
priority: medium
status: consolidated
created: 2026-01-20
consolidated_into: 27
---

# Task 28: Schema validation skill → consolidated into #27

<!-- Original content preserved below -->

## Description

[Original description content remains here unchanged]

## Acceptance Criteria

[Original acceptance criteria remain here unchanged]
```

**IMPORTANT:** When consolidating, the original task content MUST be preserved in full. Only the frontmatter and title are modified.

### Rejected Task Template

```markdown
---
id: 15
title: Feature that was rejected
priority: medium
status: rejected
created: 2026-01-20
rejected_reason: Out of scope for MVP
---

# Task 15: Feature that was rejected ✗

<!-- Original content preserved below -->

## Description

[Original description content remains here unchanged]

## Acceptance Criteria

[Original acceptance criteria remain here unchanged]
```

**IMPORTANT:** When rejecting, the original task content MUST be preserved in full. Only the frontmatter and title are modified.

---

## Plan Schema

Plans are stored as `plan.md` inside the task folder. They are created during the planning phase and move with the task through its lifecycle.

### Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Plan title |
| `created` | date | yes | YYYY-MM-DD |
| `updated` | date | no | YYYY-MM-DD (last modification) |

### Plan File Template

```markdown
---
title: Task management skill
created: 2026-01-28
---

# Plan: Task Management Skill

## Problem Summary

Brief description of what needs to be done.

## Files to Modify

| File | Changes |
|------|---------|
| path/to/file.ts | Description of changes |

## Implementation

### Phase 1: Description

Details...

### Phase 2: Description

Details...

## Verification

1. How to verify phase 1 works
2. How to verify phase 2 works
```

---

## INDEX.md Index Structure

Tasks are grouped by priority first (for open tasks), then by terminal status.

```markdown
# Tasks Backlog

---

## Planning

- [#19](2-planning/19/): Task management skill

---

## Ready

- [#20](3-ready/20/): Plugin installation debugging

---

## Implementing

- [#60](4-implementing/60/): Standardize TypeScript imports

---

## Reviewing

- [#55](5-reviewing/55/): Split CHANGELOG.md

---

## High Priority

- [#59](1-inbox/59/): Audit and update agents

---

## Medium Priority

- [#10](1-inbox/10/): Missing /sdd-help command

---

## Low Priority

- [#3](1-inbox/3/): Docs missing: CMDO Guide

---

## Inbox (unprioritized)

- [#63](1-inbox/63/): New feature idea

---

## Complete

- [#62](6-complete/62/): Unified CLI system ✓ (2026-01-30)

---

## Rejected

- [#5](7-rejected/5/): Out of scope feature

---

## Consolidated

- [#28](8-consolidated/28/) → #27
```

**Note:** Links point to task folders. Priority is determined by the `priority` frontmatter field.

---

## Commands

### View Backlog

```
User: /tasks
User: /tasks list
```

**Action:** Read INDEX.md and display the index, grouped by section.

### View Single Task

```
User: /tasks 19
```

**Action:** Find and read `<status-dir>/19/task.md`.

### Add New Task

```
User: /tasks add <description>
```

**Workflow:**
1. Determine next task number (highest N + 1 across all status dirs)
2. Create folder `1-inbox/<N>/` with `task.md`
3. Add entry to INDEX.md under Inbox
4. Confirm with task number

New tasks always go to inbox first. User can prioritize later.

### Prioritize Task

```
User: /tasks prioritize 15 high
User: /tasks prioritize 15 medium
User: /tasks prioritize 15 low
```

**Workflow:**
1. Find task folder
2. Update `task.md` frontmatter `priority` field
3. Move task entry to correct section in INDEX.md

**Note:** Priority only affects INDEX.md grouping, not file location.

### Start Planning

```
User: /tasks plan 19
```

**Workflow:**
1. Find task folder
2. Move folder to `2-planning/`
3. Update `task.md` frontmatter: `status: planning`
4. Create `plan.md` in the task folder
5. Update INDEX.md

Use when starting to create a plan for a task.

### Mark Ready

```
User: /tasks ready 19
```

**Workflow:**
1. Find task folder
2. Move folder to `3-ready/`
3. Update `task.md` frontmatter: `status: ready`
4. Update INDEX.md

Use when a task has a complete plan and is ready to implement.

### Start Implementing

```
User: /tasks implement 19
```

**Workflow:**
1. Create and switch to a feature branch (e.g., `feature/task-19-<slug>`)
2. Find task folder
3. Move folder to `4-implementing/`
4. Update `task.md` frontmatter: `status: implementing`
5. Update INDEX.md

**IMPORTANT:** Always create a side branch before implementing. Never implement directly on main.

### Submit for Review

```
User: /tasks review 19
```

**Workflow:**
1. Find task folder
2. Move folder to `5-reviewing/`
3. Update `task.md` frontmatter: `status: reviewing`
4. Update INDEX.md

Use when implementation is complete and ready for review.

### Complete Task

```
User: /tasks complete 7
```

**Workflow:**
1. Find task folder
2. Move folder to `6-complete/`
3. Update `task.md` frontmatter: `status: complete`, add `completed` date
4. Update INDEX.md

### Reject Task

```
User: /tasks reject 15
User: /tasks reject 15 "Out of scope for MVP"
```

**Workflow:**
1. Find task folder
2. Move folder to `7-rejected/`
3. Update `task.md` frontmatter: `status: rejected`
4. If reason provided, add to `task.md`
5. Update INDEX.md

### Consolidate Tasks

```
User: /tasks consolidate 28 into 27
```

**Workflow:**
1. Find both task folders
2. Move task 28 folder to `8-consolidated/`
3. Update task 28 `task.md`:
   - Update frontmatter: `status: consolidated`, `consolidated_into: 27`
   - Update title to include `→ consolidated into #27`
   - **Preserve ALL original content** (description, acceptance criteria, etc.)
4. Update task 27 `task.md` with consolidated context (add ## Consolidated section referencing #28)
5. Update INDEX.md

---

## Task Numbering

- Task numbers are permanent identifiers (never reused)
- Find highest number across ALL subdirs, increment by 1
- Numbers may have gaps (merges, deletions)
- Reference as `#N` or `task N`

## Best Practices

1. **Inbox first** - New tasks go to inbox, prioritize later
2. **Keep atomic** - One clear outcome per task
3. **Branch before implementing** - Always create a feature branch before starting work
4. **Consolidate related** - Don't duplicate effort
5. **Preserve on consolidate** - Never lose original task content when consolidating
6. **Update both** - Task folder AND INDEX.md must stay in sync
7. **Add context** - When completing, summarize what was done
8. **Date everything** - Completion dates help track velocity

## Lifecycles

### Task Lifecycle

```
                  1-inbox/ (open tasks)
                           ↓
                     [/tasks plan]
                           ↓
                     2-planning/
                           ↓
                    [/tasks ready]
                           ↓
                      3-ready/
                           ↓
                  [/tasks implement]
                           ↓
                   4-implementing/
                           ↓
                   [/tasks review]
                           ↓
                    5-reviewing/
                           ↓
                   [/tasks complete]
                           ↓
                     6-complete/

Any status → 8-consolidated/ (if combined with another)
Any status → 7-rejected/ (if irrelevant or out of scope)
```

**Priority** (high/medium/low) can be set at any point and only affects INDEX.md grouping.

Plans are created during the planning phase and move with their task folder through the lifecycle.

---

## Automatic Status Updates

When the user gives task-related instructions, **automatically move the task to the appropriate status**:

| User instruction | Inferred status | Action |
|------------------|-----------------|--------|
| "Plan task 19" / "Create a plan for #19" | `planning` | Move to `2-planning/`, create `plan.md` |
| "Task 19 is ready" / "Mark #19 ready" | `ready` | Move to `3-ready/` |
| "Let's work on task 19" / "Implement #19" | `implementing` | Move to `4-implementing/`, create branch |
| "Task 19 is ready for review" / "Submit #19" | `reviewing` | Move to `5-reviewing/` |
| "Task 19 is done" / "Complete #19" | `complete` | Move to `6-complete/`, add completion date |
| "Reject task 19" / "Close #19 as wontfix" | `rejected` | Move to `7-rejected/` |

**Always update both the task folder location AND INDEX.md when status changes.**

**After completing implementation work, automatically move the task to `5-reviewing/`** to signal that implementation is done and ready for user review.

Skip forward transitions are allowed (e.g., inbox → implementing for quick fixes without formal planning).
