---
name: tasks
description: Manage tasks and plans using the tasks/ directory.
---

# Task Management Skill

Manage the project backlog, track progress, and organize implementation plans.

---

## Directory Structure

Task data files live in `tasks/` at the project root:

```
tasks/
├── TASKS.md      # Main backlog with all tasks
└── plans/        # Implementation plans for tasks
    ├── pending/  # Plans being drafted (not yet ready)
    ├── planned/  # Plans ready for implementation
    │   └── PLAN-task-9-ready-to-work-components.md
    └── complete/ # Plans for completed tasks
        ├── PLAN-task-2-npm-lifecycle-scripts.md
        ├── PLAN-task-4-permission-prompts.md
        └── PLAN-task-7-external-spec-handling.md
```

## Files

| File/Directory | Purpose |
|----------------|---------|
| `tasks/TASKS.md` | Main backlog file with all tasks organized by priority/status |
| `tasks/plans/pending/` | Plans being drafted - not yet ready for implementation |
| `tasks/plans/planned/` | Plans ready for implementation - task is in Planned section |
| `tasks/plans/complete/` | Plans for completed tasks - kept for reference |

## TASKS.md Structure

```markdown
# Tasks / Improvements Backlog

## High Priority
### N. Task title [CRITICAL]
Description...

## Planned
### N. Task title
Description...
**Plan:** [plans/planned/PLAN-task-N-slug.md](plans/planned/PLAN-task-N-slug.md)

## Pending
### N. Task title
Description...

## Low Priority
### N. Task title
Description...

## Merged
### N. Task title → merged into #M

## Completed
### N. Task title ✓
**Completed: YYYY-MM-DD**
Description of what was done...
**Plan:** [plans/complete/PLAN-task-N-slug.md](plans/complete/PLAN-task-N-slug.md)
```

**Section Order:** High Priority → Planned → Pending → Low Priority → Merged → Completed

**Planned Section:** Tasks that have implementation plans created but work hasn't started yet. These are "ready to implement" - the thinking is done, just needs execution.

---

## Commands

### View Backlog

```
User: /tasks
User: /tasks list
User: show me the backlog
```

**Action:** Read and summarize TASKS.md, grouped by section.

Output format:
```
## High Priority (N items)
- #9: sdd-init should produce ready-to-work components [CRITICAL]

## Planned (N items) - Ready to implement
- #7: External spec handling (has plan)
...

## Pending (N items)
- #10: Missing /sdd-help command
- #11: Missing deeper config integration
...

## Low Priority (N items)
- #3: Docs missing: CMDO Guide
...

## Recently Completed (last 5)
- #7: External spec handling ✓ (2026-01-28)
- #2: Add npm run scripts ✓ (2026-01-28)
...
```

### View Single Task

```
User: /tasks 19
User: show me task 19
User: what's task #19 about?
```

**Action:** Find and display the full task entry from TASKS.md.

### Add New Task

```
User: /tasks add <description>
User: add a new task: <description>
```

**Workflow:**
1. Determine next available task number (scan for highest N, add 1)
2. Ask user for priority level (High/Pending/Low)
3. Add task to appropriate section in TASKS.md
4. Confirm addition with task number

Format for new task:
```markdown
### N. Task title
Description provided by user. Expand if needed to capture the full intent.
```

### Complete Task

```
User: /tasks complete 7
User: mark task 7 as done
User: task 7 is complete
```

**Workflow:**
1. Find task N in TASKS.md
2. Move task to ## Completed section
3. Add completion date and ✓ marker
4. If a plan exists in `plans/planned/`, move it to `plans/complete/` and link it
5. Summarize what was accomplished (ask user if needed)

Format:
```markdown
### N. Task title ✓
**Completed: YYYY-MM-DD**

Summary of what was done...

**Plan:** [plans/complete/PLAN-task-N-slug.md](plans/complete/PLAN-task-N-slug.md)
```

### Merge Tasks

```
User: /tasks merge 28 into 27
User: merge task 28 into 27
```

**Workflow:**
1. Find both tasks
2. **Preserve original content in Merged section:** Move task 28 to ## Merged section with ALL its original content intact, adding the merge reference
3. Update format to: `### 28. Task title → merged into #27` followed by the original task content
4. **Copy merged content into target task:** Update target task (27) to include the full context from task 28

**IMPORTANT:** Never delete the original contents of a merged task. The full description and any details must be preserved in BOTH locations:
- In the Merged section (for historical reference)
- In the target task (so all context is in one place)

Format for merged task entry:
```markdown
### 28. Task title → merged into #27

_Original content preserved below:_

Original description and all details from task 28...
```

Format for target task update:
```markdown
### 27. Task title

Original description of task 27...

---
**Merged from #28:** Task 28 title

Original description from task 28...
```

### Change Priority

```
User: /tasks prioritize 15 high
User: move task 15 to high priority
User: task 15 is now critical
```

**Workflow:**
1. Find task in current section
2. Move to target priority section
3. Add [CRITICAL] tag if moving to High Priority and user indicates critical

### Create Plan

```
User: /tasks plan 19
User: create a plan for task 19
```

**Workflow:**
1. Read the task from TASKS.md
2. Analyze codebase to understand scope
3. Create `tasks/plans/planned/PLAN-task-N-slug.md` with:
   - Problem summary
   - Files to modify
   - Implementation steps
   - Verification steps
4. Move task from current section to **## Planned** section
5. Add plan link to task entry

**Note:** If plan needs iteration before it's ready, create in `plans/pending/` first, then move to `plans/planned/` when finalized.

Plan template:
```markdown
# Plan: Task Title (Task N)

## Status: IN PROGRESS | COMPLETED ✓

**Completed: YYYY-MM-DD (vX.Y.Z)** ← only when done

---

## Problem Summary

Brief description of what needs to be done.

## Files to Modify

| File | Changes |
|------|---------|
| path/to/file.ts | Description of changes |

## Implementation

### Step 1: Description

Details...

### Step 2: Description

Details...

## Verification

1. How to verify step 1 works
2. How to verify step 2 works
...
```

### Move to Planned

```
User: /tasks planned 19
User: task 19 has a plan now
User: move task 19 to planned
```

**Workflow:**
1. Find task N in TASKS.md
2. Verify a plan exists at `tasks/plans/pending/PLAN-task-N-*.md` or `tasks/plans/planned/PLAN-task-N-*.md`
3. If plan is in `pending/`, move it to `planned/`
4. Move task to ## Planned section
5. Add plan link if not already present

### Review Plans

```
User: /tasks plans
User: show me all plans
```

**Action:** List all files in `tasks/plans/` subdirectories grouped by status:

```
## Pending (drafts in progress)
- PLAN-task-15-planner-rules.md

## Planned (ready to implement)
- PLAN-task-9-ready-to-work-components.md

## Complete (reference)
- PLAN-task-2-npm-lifecycle-scripts.md
- PLAN-task-4-permission-prompts.md
- PLAN-task-7-external-spec-handling.md
```

---

## Examples

### Adding a Task

```
User: /tasks add Need better error messages when spec validation fails

Agent: What priority level?
1. High Priority - Critical or blocking issues
2. Pending - Normal priority, to be done
3. Low Priority - Nice to have, not urgent

User: 2

Agent: ✓ Added task #48 to Pending:

### 48. Better error messages for spec validation failures
Need better error messages when spec validation fails. Should provide clear guidance on what's wrong and how to fix it.
```

### Completing a Task

```
User: /tasks complete 7

Agent: Found task #7: External spec handling is broken

Moving to Completed section...

What was accomplished? (I'll summarize or you can provide details)

User: Fixed all external spec issues - specs are now self-sufficient

Agent: ✓ Moved task #7 to Completed:

### 7. External spec handling is broken ✓
**Completed: 2026-01-28**

Fixed all issues with external spec processing:
- Specs generated from `sdd-init` with external spec now include both SPEC.md and PLAN.md
- External specs with 3+ changes produce epic structures
- Generated specs embed full content making them self-sufficient

**Plan:** [plans/complete/PLAN-task-7-external-spec-handling.md](plans/complete/PLAN-task-7-external-spec-handling.md)
```

### Creating a Plan

```
User: /tasks plan 19

Agent: Reading task #19: Create task management skill in marketplace

Analyzing what's needed...

Creating plan at tasks/plans/planned/PLAN-task-19-task-management-skill.md

✓ Plan created. Key points:
- Add task management at tasks/
- Support add/complete/merge/prioritize operations
- Integrate with tasks/TASKS.md and tasks/plans/

View the plan? (yes/no)
```

### Merging Tasks

```
User: /tasks merge 36 into 35

Agent: Found task #36: Add drift detection for specs
Found task #35: Add checksumming for spec change detection

Merging #36 into #35...

✓ Task #36 moved to Merged section (original content preserved)
✓ Task #35 updated with merged content from #36

Updated task #35:
### 35. Add checksumming for spec change detection
Add checksums to track when specs have been modified since last generation.
- Store hash of spec content
- Compare on regeneration to detect drift

---
**Merged from #36:** Add drift detection for specs

Detect when generated code has drifted from the spec.
- Compare current implementation against spec
- Warn user when drift is detected
- Suggest regeneration or spec update

---

Task #36 entry in Merged section:
### 36. Add drift detection for specs → merged into #35

_Original content preserved below:_

Detect when generated code has drifted from the spec.
- Compare current implementation against spec
- Warn user when drift is detected
- Suggest regeneration or spec update
```

---

## Task Numbering

- Task numbers are permanent identifiers (never reused)
- Find the highest existing number and increment for new tasks
- Numbers may have gaps (due to merges, deletions)
- Reference tasks as `#N` or `task N`

## Best Practices

1. **Keep tasks atomic** - One clear outcome per task
2. **Merge related tasks** - Don't duplicate effort
3. **Link plans** - Always link implementation plans when completing
4. **Update status** - Move tasks through sections as work progresses
5. **Move to Planned** - When a plan is created, move task from Pending to Planned
6. **Add context** - When completing, summarize what was actually done
7. **Date everything** - Completion dates help track velocity

## Task Lifecycle

```
Pending → [create plan] → Planned → [implement] → Completed
                ↓
         High Priority (if urgent)
                ↓
         Low Priority (if deprioritized)
                ↓
         Merged (if combined with another)
```
