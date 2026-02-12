# Task Management Workflows

Detailed workflows for each task command.

---

## View Backlog

```
User: /tasks
User: /tasks list
```

**Action:** Read INDEX.md and display the index, grouped by section. Always show all tasks in each section with their full titles - never abbreviate or summarize the inbox or other sections. Skip empty sections and omit Completed, Rejected, and Consolidated sections (these are archival). Render each task reference (`#XX`) as a markdown link pointing to its primary file relative to the repo root:
- If task has a plan.md file: link to plan.md, e.g., `[#67](.tasks/2-planning/67/plan.md)`
- Otherwise: link to task.md, e.g., `[#67](.tasks/1-inbox/67/task.md)`

---

## View Single Task

```
User: /tasks 19
```

**Action:** Find and read `<status-dir>/19/task.md`.

---

## Add New Task

```
User: /tasks add <description>
```

**Workflow:**
1. Determine next task number (highest N + 1 across all status dirs)
2. Create folder `1-inbox/<N>/` with `task.md`
3. Add entry to INDEX.md under Inbox
4. Stage changes and use commit skill: `Skill(commit, args: '-m "Tasks: Add #63"')`
5. Confirm with task number

New tasks always go to inbox first. User can prioritize later.

---

## Prioritize Task

```
User: /tasks prioritize 15 high
User: /tasks prioritize 15 medium
User: /tasks prioritize 15 low
```

**Workflow:**
1. Find task folder
2. Update `task.md` frontmatter `priority` field
3. Move task entry to correct section in INDEX.md
4. Stage changes and use commit skill (e.g., "Tasks: Prioritize #15 as high")

**Note:** Priority only affects INDEX.md grouping, not file location.

---

## Start Planning

```
User: /tasks plan 19
```

**Workflow — Phase 1 (transition first, before any planning work):**
1. Find task folder
2. Move folder to `2-planning/`
3. Update `task.md` frontmatter: `status: planning`
4. Create empty `plan.md` skeleton in the task folder (frontmatter + headings only, no content yet)
5. Update INDEX.md
6. Stage changes and use commit skill (e.g., "Tasks: Move #19 to planning")
7. Confirm with clickable link to plan

**Output:**
```
Task #19 moved to planning status.

Plan: [plan.md](.tasks/2-planning/19/plan.md)
```

**Workflow — Phase 2 (only after the transition commit completes):**
8. Research the codebase and write the actual plan content in `plan.md`

**IMPORTANT:** The status transition and commit MUST complete before any planning work begins. Do not start researching or writing plan content until the transition is committed.

---

## Mark Ready

```
User: /tasks ready 19
```

**Workflow:**
1. Find task folder
2. Move folder to `3-ready/`
3. Update `task.md` frontmatter: `status: ready`
4. Update INDEX.md
5. Stage changes and use commit skill (e.g., "Tasks: Move #19 to ready")

Use when a task has a complete plan and is ready to implement.

---

## Start Implementing

```
User: /tasks implement 19
```

**Workflow:**
1. Find task folder
2. Move folder to `4-implementing/`
3. Update `task.md` frontmatter: `status: implementing`
4. Update INDEX.md
5. Commit the task transition on main (e.g., "Tasks: Move #19 to implementing")
6. Create a feature branch (e.g., `feature/task-19-<slug>`)
7. Create a git worktree at `.worktrees/task-<id>/` on that branch
8. Confirm with the worktree path (e.g., "Worktree created at `.worktrees/task-19/`")

**IMPORTANT:** Always create a side branch before implementing. Never implement directly on main. The worktree keeps main available in the primary working directory while implementation happens in the worktree.

**NEVER** merge the feature branch or delete the worktree during implementation. The worktree and branch persist until the task is completed via `/tasks complete`.

**Final implementation commit:** The last commit of the implementation phase (before moving to review) must include the version bump and changelog entry. Use the `commit` skill's Steps 2–3 to bump the version and create the changelog entry for the task's changes.

---

## Submit for Review

```
User: /tasks review 19
```

**Workflow:**
1. Find task folder
2. **Ask the user:** "Would you like me to generate a change report before moving to review?"
3. If the user says yes, generate a `changes.md` file in the task folder (see **Change Report Format** below)
4. Move folder to `5-reviewing/`
5. Update `task.md` frontmatter: `status: reviewing`
6. Update INDEX.md
7. Commit the task transition on main (e.g., "Tasks: Move #19 to reviewing")

Use when implementation is complete and ready for review.

### Change Report Format

The change report is saved as `changes.md` in the task folder (e.g., `.tasks/5-reviewing/19/changes.md`). It documents every file changed on the feature branch vs main.

**How to generate:**
1. Run `git diff main..HEAD --stat` to get the file list and line counts
2. Run `git diff main..HEAD` to get the full diff
3. Write `changes.md` with one section per file, each containing:
   - A clickable markdown link to the file
   - The file path as a heading
   - A one-line description of what changed
   - The actual diff in a syntax-highlighted fenced code block

**Template:**

```markdown
# Task #<id> — Change Report

**Branch:** `<branch-name>`
**Commits:** <count>
**Files changed:** <count> (+<additions> / -<deletions> lines)

---

## 1. [`<file-path>`](<file-path>)

<One-line description of what changed.>

\`\`\`diff
<actual diff for this file>
\`\`\`

---

## 2. [`<file-path>`](<file-path>)

...
```

**Rules:**
- One section per changed file, numbered sequentially
- Each heading is a clickable markdown link to the file (e.g., `[plugin/system/src/cli.ts](plugin/system/src/cli.ts)`)
- Each section has the file link, a brief description, and the diff
- Use `diff` as the code fence language for all diffs (provides +/- syntax highlighting)
- For new files where you show the full content instead of a diff, use the file's language for syntax highlighting (e.g., `typescript`, `json`, `yaml`, `markdown`)
- New files show the full content
- Order files logically (core types first, then modules, then commands, then tests, then version/changelog)

**NEVER** merge the feature branch or delete the worktree during reviewing. The worktree and branch persist until the task is completed via `/tasks complete`.

**Commit prefixing:** All commits made during the reviewing phase (e.g., fixes from code review) must be prefixed with the task reference (e.g., `Task #19: Fix validation edge case`).

**Amend when possible:** If the previous commit on the feature branch has NOT been pushed to remote, review-phase commits should amend it and update the existing changelog entry. If it HAS been pushed, create a new commit and amend the changelog entry in-place (update the existing version entry, do not create a new one).

---

## Complete Task

```
User: /tasks complete 7
```

**Workflow:**
1. Find task folder
2. If a worktree exists at `.worktrees/task-<id>/`:
   a. **Verify no work is lost** before removing:
      - Check for uncommitted changes in the worktree (`git -C .worktrees/task-<id> status`)
      - If uncommitted changes exist, **stop and warn the user** — do not proceed
   b. Check for commits not merged into main (`git log main..<branch> --oneline`)
      - If unmerged commits exist, merge the feature branch into main first
   c. Remove the worktree with `git worktree remove`
   d. Delete the feature branch only if it has been fully merged into main
3. Move folder to `6-complete/`
4. Update `task.md` frontmatter: `status: complete`, add `completed` datetime (e.g., `completed: 2026-02-12 14:30 UTC`)
5. Update INDEX.md
6. Commit the task transition on main (e.g., "Tasks: Complete #7")

---

## Reject Task

```
User: /tasks reject 15
User: /tasks reject 15 "Out of scope for MVP"
```

**Workflow:**
1. Find task folder
2. **Determine the reason for rejection.** A reason is always required:
   - If the user says "obsolete", check completed tasks to identify which task(s) made it obsolete. Reference them in the reason (e.g., "Obsolete — superseded by #81")
   - If the reason is unclear, **ask the user** before proceeding
3. Move folder to `7-rejected/`
4. Update `task.md` frontmatter: `status: rejected`, `rejected_reason: <reason>`
5. Update INDEX.md (include the reason summary after the title, e.g., `— obsolete, superseded by #81`)
6. Stage changes and use commit skill (e.g., "Tasks: Reject #15")

---

## Consolidate Tasks

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
6. Stage changes and use commit skill (e.g., "Tasks: Consolidate #28 into #27")

---

## Audit Backlog

```
User: /tasks audit
```

**Action:** Scan all task directories and INDEX.md, check for compliance issues, identify possibly obsolete tasks, and present a report with action items.

**Checks to perform:**

#### 1. Structural Integrity
- Every status directory contains only numbered task folders (and `.gitkeep` if empty)
- Every task folder contains a `task.md` file
- No orphan folders (folders without `task.md`)
- No task folders exist outside recognized status directories
- `.gitkeep` files in empty directories should not be flagged as errors

#### 2. Frontmatter Compliance
- All required fields present (`id`, `title`, `status`, `created`)
- `id` matches the folder name
- `status` matches the directory the task lives in (e.g., `1-inbox/` → `inbox`, `7-rejected/` → `rejected`)
- Rejected tasks have `rejected_reason`
- Consolidated tasks have `consolidated_into`
- Completed tasks have `completed` datetime
- `priority` is a valid value (`low`, `medium`, `high`) or absent
- `depends_on` and `blocks` reference task IDs that exist

#### 3. INDEX.md Sync
- Every non-archived task (inbox, planning, ready, implementing, reviewing) appears in INDEX.md
- Every entry in INDEX.md points to a task folder that exists
- Tasks appear in the correct INDEX.md section for their status/priority
- Rejected entries include a reason summary
- Consolidated entries include the target task reference

#### 4. Title and Heading Consistency
- Frontmatter `title` matches the `# Task N:` heading in the body
- Completed tasks have `✓` suffix in heading
- Rejected tasks have `✗` suffix in heading
- Consolidated tasks have `→ consolidated into #N` suffix in heading

#### 5. Possibly Obsolete Tasks
- For each open task (inbox, planning, ready), compare against completed tasks:
  - Does a completed task's description overlap significantly with this open task?
  - Does a completed task explicitly address the same problem?
  - Has the area this task targets been redesigned or replaced?
- Check `depends_on` references: if a dependency was rejected or consolidated, the task may need updating
- Flag tasks with stale priorities or outdated descriptions based on recent completions

#### 6. Dependency Integrity
- `depends_on` references point to tasks that exist
- `depends_on` does not reference rejected or consolidated tasks (may indicate staleness)
- `blocks` references are reciprocal (if A blocks B, B should depend on A)
- No circular dependencies

**Output format:** Write the report to `.temp/tasks-audit-<datetime>.md` (e.g., `tasks-audit-2026-02-07_14-30.md`) and display a summary to the user. Group findings by severity:

```markdown
# Tasks Audit — YYYY-MM-DD_HH-MM

## Errors (must fix)
- [ ] #14: Frontmatter `status: inbox` but task is in `7-rejected/` directory
- [ ] INDEX.md references #99 but no task folder exists

## Warnings (should fix)
- [ ] #83: Rejected without `rejected_reason` in frontmatter
- [ ] #16: `depends_on: [15]` but #15 was consolidated into #64

## Possibly Obsolete
- [ ] #70: "Git checkpoint workflow" — may be superseded by #49 (Auto-commit hook ✓)
- [ ] #33: "Tests are not useful" — may be addressed by #68 (Plans focus on WHAT ✓)

## Info
- 27 open tasks, 16 completed, 4 rejected, 15 consolidated
- Oldest open task: #3 (created 2026-01-20)
```

**IMPORTANT:** The "Possibly Obsolete" section requires judgement. Read the description of each open task and compare against completed tasks to identify potential overlap. When uncertain, flag it with a `?` and brief rationale so the user can decide. Never auto-reject — only flag for review.

---

## Automatic Status Updates

When the user gives task-related instructions, **automatically move the task to the appropriate status**:

| User instruction | Inferred status | Action |
|------------------|-----------------|--------|
| "Plan task 19" / "Create a plan for #19" | `planning` | Move to `2-planning/`, create `plan.md` |
| "Task 19 is ready" / "Mark #19 ready" | `ready` | Move to `3-ready/` |
| "Let's work on task 19" / "Implement #19" | `implementing` | Move to `4-implementing/`, create branch + worktree |
| "Task 19 is ready for review" / "Submit #19" | `reviewing` | Move to `5-reviewing/` |
| "Task 19 is done" / "Complete #19" | `complete` | Move to `6-complete/`, add completion date |
| "Reject task 19" / "Close #19 as wontfix" | `rejected` | Move to `7-rejected/` |

**Always update both the task folder location AND INDEX.md when status changes.**

**After completing implementation work, automatically move the task to `5-reviewing/`** to signal that implementation is done and ready for user review.

Skip forward transitions are allowed (e.g., inbox → implementing for quick fixes without formal planning).
