# Task and Plan Schemas

Reference documentation for task and plan file formats.

---

## Task Schema

All task files use YAML frontmatter.

### Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | yes | Unique task number |
| `title` | string | yes | Short title |
| `priority` | enum | no | `low`, `medium`, `high` (unset = unprioritized) |
| `status` | enum | yes | `inbox`, `speccing`, `planning`, `plan-review`, `implementing`, `reviewing`, `complete`, `rejected`, `consolidated` |
| `created` | datetime | yes | `YYYY-MM-DD HH:MM UTC` |
| `completed` | datetime | no | `YYYY-MM-DD HH:MM UTC` (when status=complete) |
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
status: inbox
created: 2026-01-30 14:00 UTC
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

### Specced Task Template

After speccing, task.md must have all 6 required sections with meaningful content:

```markdown
---
id: 63
title: Short descriptive title
priority: medium
status: speccing
created: 2026-01-30 14:00 UTC
---

# Short descriptive title

## Description

What this task does — clear, specific, not a rough sketch.

## Motivation

Why this change is needed. What problem it solves. What breaks without it.

## Scope

### In scope

- Specific change 1
- Specific change 2

### Out of scope

- What this task explicitly does NOT cover

## Constraints

- Technical constraints, compatibility requirements, limits
- Rules that must be followed during implementation

## Changes

| File | Change |
|------|--------|
| `path/to/file.md` | What changes and why |
| `path/to/other.ts` | What changes and why |

## Acceptance Criteria

Each criterion must have an external verification method — a command, test, or observable output that proves it works without relying on Claude's self-assessment.

- [ ] Criterion — **verify:** `command or test that proves it`
- [ ] Criterion — **verify:** `command or test that proves it`
```

### Completed Task Template

```markdown
---
id: 7
title: External spec handling
priority: high
status: complete
created: 2026-01-25 09:00 UTC
completed: 2026-01-28 16:30 UTC
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
created: 2026-01-20 10:00 UTC
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
created: 2026-01-20 10:00 UTC
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

## Changes Schema

Changes are stored as `changes.md` inside the task folder. They are always generated when moving to review or completing a task. They capture **all changes made during the task's lifetime** across all lifecycle stages (planning, implementing, reviewing). Task management changes (`.tasks/` files) are excluded.

### Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `generated` | datetime | yes | `YYYY-MM-DD HH:MM UTC` |
| `branch` | string | yes | Feature branch name |
| `commits` | number | yes | Number of commits on the branch |

### Changes File Template (always generated)

```markdown
---
generated: 2026-02-12 14:30 UTC
branch: feature/task-19-slug
commits: 5
---

# Task #19 — Changes

**Files changed:** 8 (+142 / -37 lines)

| File | Added | Removed |
|------|------:|--------:|
| [`src/cli.ts`](src/cli.ts) | +45 | -12 |
| [`src/types.ts`](src/types.ts) | +20 | -3 |
```

### Detailed Change Report (appended on user request)

When the user requests a detailed change report, append per-file diff sections below the summary table:

```markdown
---

## 1. [`src/cli.ts`](src/cli.ts)

Refactored command routing to use a dispatch map.

\`\`\`diff
<actual diff for this file>
\`\`\`

---

## 2. [`src/types.ts`](src/types.ts)

Added CommandResult type.

\`\`\`diff
<actual diff for this file>
\`\`\`
```

---

## Plan Schema

Plans are stored as `plan.md` inside the task folder. They are created during the planning phase and move with the task through its lifecycle.

### Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Plan title |
| `created` | datetime | yes | `YYYY-MM-DD HH:MM UTC` |
| `updated` | datetime | no | `YYYY-MM-DD HH:MM UTC` (last modification) |

### Plan File Template

```markdown
---
title: Task management skill
created: 2026-01-28 10:00 UTC
---

# Plan: Task Management Skill

## Problem Summary

Brief description of what problem this solves.

## Files to Modify

| File | Changes |
|------|---------|
| path/to/file.ts | Description of what changes |

## Changes

### 1. [Component/Area Name]

What behavioral or functional changes are being made.
Focus on WHAT is changing, not HOW to implement it.

### 2. [Component/Area Name]

Additional changes...

## Dependencies

What must happen before what. List any sequencing requirements.

## Tests

### Unit Tests
- [ ] `test_description_of_behavior`
- [ ] `test_another_behavior`

### Integration Tests
- [ ] `test_components_work_together`

### E2E Tests (if applicable)
- [ ] `test_user_facing_flow`

## Verification

- [ ] Outcome 1 is achieved
- [ ] Outcome 2 is achieved
```

### Plan Content Guidelines

**Plans focus on WHAT, not HOW:**

| Include in Plans | Do NOT Include in Plans |
|------------------|-------------------------|
| What files/components are affected | Full code implementations |
| What behavior is changing | Line-by-line instructions |
| What tests verify the changes | Algorithm details |
| Dependencies and sequencing | Specific function signatures |
| Brief code snippets as constraints | Step-by-step coding instructions |

**Tests are required:** Every plan must include an extensive list of tests. Tests define expected behavior (WHAT) and can be reviewed before implementation begins.

---

## INDEX.md Index Structure

Active tasks (planning through reviewing) have their own top-level sections. Inbox tasks are grouped by priority as sub-sections under Inbox.

```markdown
# Tasks Backlog

---

## Speccing

- [#63](1-speccing/63/): New feature idea

---

## Planning

- [#19](2-planning/19/plan.md): Task management skill

---

## Plan Review

- [#20](3-plan-review/20/): Plugin installation debugging

---

## Implementing

- [#60](4-implementing/60/): Standardize TypeScript imports

---

## Reviewing

- [#55](5-reviewing/55/): Split CHANGELOG.md

---

## Inbox

### High Priority

- [#59](0-inbox/59/): Audit and update agents

### Medium Priority

- [#10](0-inbox/10/): Missing /sdd-help command

### Low Priority

- [#3](0-inbox/3/): Docs missing: CMDO Guide

### Unprioritized

- [#64](0-inbox/64/): Another idea

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

**Note:** Links point to task folders. Priority is determined by the `priority` frontmatter field. Priority sub-sections only appear under Inbox.
