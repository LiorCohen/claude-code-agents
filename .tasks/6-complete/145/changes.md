---
generated: 2026-02-16 10:50 UTC
branch: feature/task-145-speccing-phase
commits: 8
---

# Task #145 — Changes

**Files changed:** 15 (+173 / -30 lines)

| File | Added | Removed |
|------|------:|--------:|
| [`.claude/skills/tasks/SKILL.md`](.claude/skills/tasks/SKILL.md) | +36 | -8 |
| [`.claude/skills/tasks/schemas.md`](.claude/skills/tasks/schemas.md) | +56 | -5 |
| [`.claude/skills/tasks/workflows.md`](.claude/skills/tasks/workflows.md) | +42 | -7 |
| [`.claude/skills/tasks/reference.md`](.claude/skills/tasks/reference.md) | +6 | -1 |
| [`.claude/skills/critic/SKILL.md`](.claude/skills/critic/SKILL.md) | +6 | -4 |
| [`.claude/skills/critic/resources/phases.md`](.claude/skills/critic/resources/phases.md) | +14 | -0 |
| [`.claude/skills/critic/resources/escalation.md`](.claude/skills/critic/resources/escalation.md) | +1 | -0 |
| [`.claude/skills/critic/resources/feedback-loop.md`](.claude/skills/critic/resources/feedback-loop.md) | +1 | -1 |
| [`.claude/skills/commit/SKILL.md`](.claude/skills/commit/SKILL.md) | +1 | -1 |
| [`.claude/skills/agents-standards/SKILL.md`](.claude/skills/agents-standards/SKILL.md) | +1 | -1 |
| [`.claude/skills/skills-standards/SKILL.md`](.claude/skills/skills-standards/SKILL.md) | +1 | -1 |
| [`.claude/skills/commands-standards/SKILL.md`](.claude/skills/commands-standards/SKILL.md) | +1 | -1 |
| [`.claude/skills/system-cli-standards/skill.md`](.claude/skills/system-cli-standards/skill.md) | +1 | -1 |
| [`.critic/speccing.md`](.critic/speccing.md) | +6 | -0 |

---

## Detailed Diffs

### `.claude/skills/tasks/SKILL.md`

```diff
@@ Directory structure @@
-.tasks/
-├── 1-inbox/              # Open tasks (not yet started)
+.tasks/
+├── 0-inbox/              # Open tasks (not yet started)
+├── 1-speccing/           # Spec being refined (interactive solicitation)

@@ Link example @@
-- Otherwise: link to task.md, e.g., `[#67](.tasks/1-inbox/67/task.md)`
+- Otherwise: link to task.md, e.g., `[#67](.tasks/0-inbox/67/task.md)`

@@ Status column values @@
+- `📝 Speccing`
-- `📥 Inbox` (for tasks in 1-inbox/)
+- `📥 Inbox` (for tasks in 0-inbox/)

@@ Add New Task @@
-2. Create `1-inbox/<N>/task.md`
+2. Create `0-inbox/<N>/task.md`

@@ NEW: Start Speccing command (lines 125-141) @@
+### Start Speccing
+/tasks spec <id>
+Moves a task from inbox (or back from planning) to speccing,
+then interactively solicits the task spec from the user.
+From inbox: Move to 1-speccing/, update status, commit, begin solicitation.
+From planning (back-transition): Move back to 1-speccing/, resume solicitation.
+Solicitation: Ask guiding questions for 5 required sections.

@@ Start Planning - NEW precondition, validation gate, critic gate @@
+Precondition: Task must be in speccing status.
+Speccing validation gate: Verify 5 required sections with meaningful content.
+Critic exit gate: Invoke /critic to validate spec quality.

@@ Start Planning Phase 2 @@
+7. If planning reveals spec gaps, update task.md directly (never plan.md).

@@ User Approval Rule @@
-- `/tasks add` → add to inbox, commit, stop. Do NOT proceed to plan.
+- `/tasks add` → add to inbox, commit, stop. Do NOT proceed to spec.
+- `/tasks spec` → move to speccing (or back-transition), run solicitation, stop.

+**Branch isolation:** Feature branches only modify their associated task.

@@ Quick Reference @@
+- **Branch isolation:** Feature branches only modify their associated task
```

### `.claude/skills/tasks/schemas.md`

```diff
@@ Status enum @@
-| `status` | enum | yes | `inbox`, `planning`, ...
+| `status` | enum | yes | `inbox`, `speccing`, `planning`, ...

@@ NEW: Specced Task Template (lines 51-93) @@
+After speccing, task.md must have all 5 required sections:
+Description, Motivation, Scope (in/out), Constraints, Acceptance Criteria

@@ INDEX.md example - NEW Speccing section @@
+## Speccing
+- [#63](1-speccing/63/): New feature idea

@@ INDEX.md example - path updates @@
-- [#59](1-inbox/59/) → [#59](0-inbox/59/)
-- [#10](1-inbox/10/) → [#10](0-inbox/10/)
-- [#3](1-inbox/3/) → [#3](0-inbox/3/)
-- [#63](1-inbox/63/) → [#64](0-inbox/64/)
```

### `.claude/skills/tasks/workflows.md`

```diff
@@ View Backlog link example @@
-- link to task.md, e.g., `[#67](.tasks/1-inbox/67/task.md)`
+- link to task.md, e.g., `[#67](.tasks/0-inbox/67/task.md)`

@@ Add New Task @@
-2. Create folder `1-inbox/<N>/` with `task.md`
+2. Create folder `0-inbox/<N>/` with `task.md`

@@ NEW: Start Speccing section (lines 65-88) @@
+From inbox: Move from 0-inbox/ to 1-speccing/, commit, begin solicitation.
+From planning (back-transition): Move from 2-planning/ to 1-speccing/, resume.
+Solicitation: Guiding questions for 5 sections, user decides when done.

@@ Start Planning - NEW gates @@
+Precondition: Task must be in speccing status.
+Speccing validation gate: 5 required sections with meaningful content.
+Critic exit gate: /critic validates spec quality.

@@ Start Planning workflow @@
-7. Confirm with clickable link to plan
+Output: Task #19 moved to planning status. Plan: [plan.md](...)
-8. Research → 7. Research
+8. If planning reveals spec gaps, update task.md directly.

@@ Audit - Frontmatter compliance @@
-- `status` matches directory (e.g., `1-inbox/` → `inbox`)
+- `status` matches directory (e.g., `0-inbox/` → `inbox`, `1-speccing/` → `speccing`)

@@ Audit - INDEX.md sync @@
-- Every non-archived task (inbox, planning, ...)
+- Every non-archived task (inbox, speccing, planning, ...)

@@ Automatic Status Updates @@
+| "Spec task 19" | speccing | Move to 1-speccing/ |

@@ Skip-forward @@
-Skip forward transitions are allowed (e.g., inbox → implementing).
+Skip-forward allowed but Claude must challenge: "This task hasn't been specced/planned — are you sure?"

+**Branch isolation:** Feature branches only modify their associated task.
```

### `.claude/skills/tasks/reference.md`

```diff
@@ Best practices @@
+13. **Branch isolation** - Feature branches only modify their associated task

@@ Lifecycle diagram @@
-                  1-inbox/ (open tasks)
+                  0-inbox/ (open tasks)
+                           ↓
+                     [/tasks spec]
+                           ↓
+                     1-speccing/
                            ↓
                      [/tasks plan]
```

### `.claude/skills/critic/SKILL.md`

```diff
@@ Phase inference - main branch scanning @@
-   - Scan active status directories (`1-inbox/`, `2-planning/`, ...)
+   - Scan active status directories (`0-inbox/`, `1-speccing/`, `2-planning/`, ...)
-   - If task is in `1-inbox/` → not a critic phase
+   - If task is in `0-inbox/` → not a critic phase
+   - If task is in `1-speccing/` → not a critic phase during solicitation.
+     Exception: /tasks plan → run Phase 1 (speccing exit gate)
-   - Status-to-phase: `2-planning` → Phase 2/3/4, ...
+   - Status-to-phase: `1-speccing` (via /tasks plan) → Phase 1, `2-planning` → Phase 2/3/4, ...

@@ .critic/ integration table @@
+| 1 (speccing exit) | `speccing.md` |

@@ Resource files @@
-- all 8 lifecycle phases → all lifecycle phases
```

### `.claude/skills/critic/resources/phases.md`

```diff
@@ NEW: Phase 1 (lines 7-17) @@
+## Phase 1: Speccing Exit Gate (`/tasks plan` on a speccing task)
+- (R) All 5 required sections present and non-empty?
+- (R) Meaningful content (not trivial one-liners)?
+- (R) Scope clear enough for planning?
+- (R) Acceptance criteria testable and specific?
+- (C) Guiding questions asked? Open questions resolved?
+Escalation: Empty/trivial = H13. Vague AC = soft warning.
```

### `.claude/skills/critic/resources/escalation.md`

```diff
+| H13 | Incomplete spec sections (speccing gate) | R | 1 | Standard | List empty/trivial sections |
```

### `.claude/skills/critic/resources/feedback-loop.md`

```diff
-1. Identify which file: `planning.md`, `implementation.md`, `review.md`, or `completion.md`
+1. Identify which file: `speccing.md`, `planning.md`, `implementation.md`, `review.md`, or `completion.md`
```

### `.claude/skills/commit/SKILL.md`

```diff
-- Task lifecycle (inbox → planning → plan-review → implementing → reviewing → complete)
+- Task lifecycle (inbox → speccing → planning → plan-review → implementing → reviewing → complete)
```

### `.claude/skills/agents-standards/SKILL.md`

```diff
-.tasks/1-inbox/<N>/
+.tasks/0-inbox/<N>/
```

### `.claude/skills/skills-standards/SKILL.md`

```diff
-.tasks/1-inbox/<N>/
+.tasks/0-inbox/<N>/
```

### `.claude/skills/commands-standards/SKILL.md`

```diff
-.tasks/1-inbox/<N>/
+.tasks/0-inbox/<N>/
```

### `.claude/skills/system-cli-standards/skill.md`

```diff
-.tasks/1-inbox/116/audit-<datetime>.md
+.tasks/0-inbox/116/audit-<datetime>.md
```

### `.critic/speccing.md` (new file)

```markdown
# Speccing Rules

- Spec must be complete before planning — all 5 sections with meaningful content
- Task.md is the source of truth for WHAT; plan.md is purely HOW
- If planning reveals spec gaps, update task.md directly — never add missing spec content to plan.md
- Back-transition to speccing is for substantial rework; minor spec fixes can be done in-place during planning
```
