---
title: Add critic skill for self-checking at every task lifecycle phase
created: 2026-02-12 16:00 UTC
updated: 2026-02-12 19:00 UTC
---

# Plan: Add Critic Skill for Self-Checking at Every Task Lifecycle Phase

## Problem Summary

Claude doesn't self-check. It over-engineers, agrees with everything, drifts from plans, claims completion without evidence, and greps for keywords instead of reading files. Without a structured self-review mechanism, every interaction requires the user to manually catch these failure modes.

A single-step critic (either in-context or forked) can't solve this alone. An in-context critic has the same biases that produced the work — self-preference, confirmation bias, context rot. A forked critic gets fresh eyes but is blind to session history — it can't tell which files were actually Read vs Grep'd, whether the user pushed back, or whether build commands were actually run.

**The solution is a two-step architecture:**

1. **Step 1 — Collector** (runs in-context): Has full session visibility. Gathers facts that only the current session knows — which files were Read vs Grep'd, whether the user pushed back, what build/test output exists, whether there are signs of degradation. Writes a structured brief.

2. **Step 2 — Reviewer** (runs as a forked subagent with fresh context): Receives the brief, reads the code/plan/diff with genuinely fresh eyes. Does the unbiased checks — plan-vs-implementation comparison, standards compliance, semantic code review. Produces the final report.

The collector does what only in-context can do (see the session). The reviewer does what only fresh context can do (unbiased review). Session-aware checks become high-confidence because they have the right information. Code review becomes high-confidence because it has no confirmation bias.

## Files to Modify

| File | Changes |
|------|---------|
| `.claude/skills/critic/SKILL.md` | **New.** In-context collector (~300 lines) — phase inference, session-aware checks, brief generation, launches forked reviewer, presents combined report |
| `.claude/skills/critic/resources/reviewer-prompt.md` | **New.** (~300 lines) Prompt for the forked reviewer subagent — reads brief + code/plan/diff with fresh eyes, produces structured report |
| `.claude/skills/critic/resources/phases.md` | **New.** (~400 lines) Per-phase checks annotated with step ownership (collector vs reviewer) |
| `.claude/skills/critic/resources/escalation.md` | **New.** (~150 lines) Escalation matrix — hard blocks vs soft warnings with step ownership |
| `.claude/skills/critic/resources/feedback-loop.md` | **New.** (~100 lines) Rules for maintaining `.critic/` feedback files |
| `.critic/planning.md` | **New.** Initial seed — planning phase patterns |
| `.critic/implementation.md` | **New.** Initial seed — implementation phase patterns |
| `.critic/review.md` | **New.** Initial seed — review phase patterns |
| `.critic/completion.md` | **New.** Initial seed — completion phase patterns |
| `.claude/skills/tasks/SKILL.md` | **Modify.** Rename `ready` → `plan-review`; add critic reference at each lifecycle transition (~6 one-line additions) |
| `.claude/skills/tasks/schemas.md` | **Modify.** Rename `ready` → `plan-review` in enum, INDEX.md example, directory references |
| `.claude/skills/tasks/workflows.md` | **Modify.** Rename `ready` → `plan-review` in workflow descriptions |
| `.claude/skills/tasks/reference.md` | **Modify.** Rename `ready` → `plan-review` in lifecycle references |
| `.claude/skills/commit/SKILL.md` | **Modify.** Rename `ready` → `plan-review` if referenced |
| `.tasks/3-ready/` | **Rename.** Directory becomes `.tasks/3-plan-review/` |
| `CLAUDE.md` | **Modify.** Add `.critic/`; rename `3-ready` → `3-plan-review` |

## Changes

### 1. Critic Skill — SKILL.md (~300 lines) — The Collector

Runs **in-context** (no `context: fork`). This is the orchestrator — it gathers session-aware signals, runs checks that require session visibility, writes a brief, then launches a forked reviewer for unbiased code review.

**Frontmatter:**
```yaml
---
description: >
  Two-step self-review at every task lifecycle phase. Step 1 (this skill)
  runs in-context to gather session signals — files read vs grepped, user
  pushback, build evidence, degradation signs. Step 2 launches a forked
  subagent for unbiased code/plan review with fresh eyes. Combined report
  classifies findings as hard blocks or soft warnings.
---
```

No `context: fork` — the collector must see conversation history. No `agent` — runs as the current agent.

**Section 1: Phase Inference Algorithm**

The collector has full session context, which makes phase inference simpler — it can see what commands were just run, what task is being discussed, and what the user just asked for. But it also uses filesystem/git state for robustness (the session context might be compressed or ambiguous):

1. Run `git branch --show-current` to get the current branch name
2. If branch matches `feature/task-<N>-*`:
   - Extract task ID `<N>`
   - Read `.tasks/*/N/task.md` to get current status
   - Check `git diff --name-only HEAD` for uncommitted changes
   - Check `git diff --name-only main...HEAD` for all branch changes
   - Map to phase:
     - Status `implementing` + uncommitted changes → **Phase 6: During implementation**
     - Status `implementing` + no uncommitted changes + `git diff --name-only main...HEAD` has non-`.tasks/` files → **Phase 6** (between changes)
     - Status `implementing` + no uncommitted changes + only `.tasks/` files changed → **Phase 5: Starting implementation**
     - Status `reviewing` → **Phase 7: Submitting for review**
3. If branch is `main`:
   - Check session context for which task is being discussed (most reliable signal when available)
   - Check `git log --oneline -5` for recent task transitions
   - Scan active status directories (`1-inbox/`, `2-planning/`, `3-plan-review/`, `4-implementing/`, `5-reviewing/`) for tasks
   - Cross-reference all signals: session context, git log, active directories
   - If task found in `4-implementing/` while on main → soft warning: suggest switching to feature branch
   - If **exactly one** active task → use it, infer phase from status directory
   - If **multiple** active tasks and signals don't disambiguate → ask the user
   - If **no** active tasks → ask the user
   - Status-to-phase mapping: `1-inbox` → Phase 1, `2-planning` → Phase 2/3/4, `3-plan-review` → Phase 4, `4-implementing` → Phase 5/6, `5-reviewing` → Phase 7/8
4. If ambiguous at any step → **Ask the user**. Never guess.

**Disambiguating planning sub-phases (2, 3, 4):**
- Task in `2-planning/` with empty plan.md skeleton → Phase 2 (starting planning)
- Task in `2-planning/` with plan.md content, uncommitted changes → Phase 3 (writing a plan)
- Task in `2-planning/` with plan.md content, no uncommitted changes → Phase 4 (presenting plan for review)

**Section 2: Collector Checks (session-aware)**

These checks are *only possible* in-context because they require session visibility:

**Anti-grep check:**
> Review the conversation history. For each file central to the current work, determine: was it opened with the Read tool (full file), or only found via Grep/Glob? Build a list of files-read and files-only-grepped. Any file being modified that was only grepped is a hard block (H11). This check is impossible for a forked agent — it's the collector's highest-value contribution.

**Counter-sycophancy check:**
> Review the conversation for pushback — did the user disagree with an approach? If so, check: did Claude evaluate the feedback against evidence, or did it just agree? If Claude immediately agreed and changed approach without defending the original with evidence, flag it. The reverse: did the user suggest something that contradicts CLAUDE.md or the plan? If so, was it flagged? Silence is not compliance.

**Evidence gathering:**
> Search the conversation for build/test command outputs. For TypeScript changes: was `npm test`, `npm run typecheck:plugin`, or `npm run build:plugin` actually executed? For prompt-only changes: were structural checks done (file exists, under 500 lines, frontmatter valid)? Collect the actual outputs. "I think it works" is not evidence.

**Degradation detection:**
> Look for signs of context window exhaustion in the current session: placeholder code (`// TODO: implement`), sparse implementations, `...` or `/* rest unchanged */` comments, repeated similar errors, retrying the same approach multiple times. If detected, flag as soft warning and recommend context reset.

**Confidence calibration:**
> For each finding, the collector knows what was actually verified (read the file, ran the command) vs assumed (inferred from patterns, didn't check). Rate each finding's confidence based on what you actually did, not what you think you know. Low-confidence findings are explicitly flagged.

**Section 3: Brief Generation**

After running collector checks, write a structured brief to `.temp/critic-brief.md`:

```markdown
## Critic Brief

**Task:** #<id> — <title>
**Phase:** N — <phase name>
**Branch:** <branch name>
**Plan file:** <path to plan.md>
**Task file:** <path to task.md>

### Session Signals

**Files fully read:** [list of paths opened with Read tool]
**Files only grepped:** [list of paths only found via Grep, not fully read]
**User pushback:** [yes/no — if yes, summary of what was challenged and how it was resolved]
**Build/test evidence:** [command outputs collected, or "not run"]
**Uncommitted changes:** [yes/no]

### Collector Findings

[Step 1 findings — anti-grep violations, sycophancy signals, degradation signals, evidence gaps]

### Phase-Specific Review Request

[What the reviewer should focus on for this phase — e.g., "compare plan files table against actual diff" for Phase 7]
```

**Section 4: Launching the Reviewer**

After writing the brief, launch the forked reviewer using the Task tool:

```
Task(
  subagent_type: "general-purpose",
  description: "Critic reviewer — fresh-context code review",
  prompt: [contents of resources/reviewer-prompt.md with brief path injected]
)
```

The reviewer runs with fresh context — no conversation history, no confirmation bias. It reads the brief, the code, the plan, and the diff, then produces a structured report.

**Section 5: Combined Output**

After the reviewer returns its report, the collector combines both into a single output:

```markdown
## Critic Self-Review — Phase N: [Phase Name]

**Task:** #<id> — <title>

### Session Checks (collector — in-context)

- [x] Anti-grep: 5 of 5 files fully read ✓
- [!] Counter-sycophancy: User pushed back on X, Claude agreed without evidence — verify
- [x] Build evidence: npm test output captured ✓

### Code Review (reviewer — fresh context)

#### Hard Blocks (must resolve before proceeding)

1. **[Finding title]** [H-ID] [CONFIDENCE: high/medium/low]
   - What: [specific finding]
   - Evidence: [what was checked]
   - Action: [what must happen]

#### Soft Warnings (noted, not blocking)

1. **[Finding title]** [S-ID] [CONFIDENCE: high/medium/low]
   - What: [specific finding]
   - Note: [suggestion]

### Checks Passed

- [x] [Check description] — [brief evidence]

### Learned Patterns Applied (from .critic/)

- Applied rule from `.critic/planning.md`: "[rule text]"
```

If there are hard blocks from either step: **"BLOCKED — resolve the above before proceeding."**
If no hard blocks: **"CLEAR — proceed with noted warnings."**

**Critical rule: The critic NEVER auto-fixes.** All findings go to the human for decision. Research shows auto-correction loops degrade correct code due to sycophancy.

**Section 6: `.critic/` Integration**

After inferring the phase, the collector reads the `.critic/` file matching the current status and includes relevant rules in the brief for the reviewer:

| Phase | .critic/ file |
|-------|-------------|
| 1 (creating task) | `planning.md` |
| 2-4 (planning) | `planning.md` |
| 5-6 (implementing) | `implementation.md` |
| 7 (review) | `review.md` |
| 8 (completion) | `completion.md` |

**Section 7: Resource File References**

```markdown
## Resource Files

- [reviewer-prompt.md](resources/reviewer-prompt.md) — Prompt for the forked reviewer subagent
- [phases.md](resources/phases.md) — Detailed checks for all 8 lifecycle phases
- [escalation.md](resources/escalation.md) — Hard block vs soft warning classification criteria
- [feedback-loop.md](resources/feedback-loop.md) — Rules for maintaining the .critic/ learning directory
```

**Section 8: Thought Depth Escalation**

Not all checks need the same level of analysis. The critic uses four thinking depth levels:
- **Quick** — surface-level structural checks. File exists? Frontmatter valid? Line count under limit? Branch name correct?
- **Standard** — routine checks requiring modest reasoning. Diff audit file list comparison, plan coverage check.
- **Deep** (`think hard`) — potential hard blocks, multi-file cross-referencing. Standards contradiction analysis, acceptance criteria verification.
- **Ultra** (`think harder`) — architectural decisions, plan-vs-implementation semantic comparison. Reserved for Phase 4 (full plan review), Phase 7 (pre-review audit), and low-confidence high-stakes findings.

The escalation matrix annotates each check with its default depth. The critic may escalate when a lower-depth check surfaces something suspicious.

### 2. Critic Skill — resources/reviewer-prompt.md (~300 lines) — The Reviewer

This is the prompt given to the forked subagent. It runs with fresh context — no conversation history, no confirmation bias. It reads the brief written by the collector, then independently reviews code, plans, and diffs.

**Structure:**

1. **Preamble** — You are a code reviewer with fresh eyes. You have no prior context about this task. Read the brief at `.temp/critic-brief.md` to understand what's being reviewed and what session signals were collected.

2. **Phase-specific checks** — Based on the phase identified in the brief, apply the relevant checks from `resources/phases.md`. Focus on checks marked as "reviewer" ownership.

3. **Diff audit (phases 6, 7, 8):**
   - Read `plan.md` — parse the "Files to Modify" table
   - Run `git diff --name-only main...HEAD` for actual files changed
   - Exclude `.tasks/` files
   - Compare: files in plan but not in diff → hard block (H2). Files in diff but not in plan → hard block (H1).
   - For each file in diff, verify the change is justified by a plan item

4. **Standards compliance:**
   - Read the relevant standards skills (TypeScript, skills, agents, commands) fresh
   - Check code against standards without the bias of having written it
   - Quote specific violations with file and line number

5. **Test file modification check (phase 7):**
   - If test files were modified alongside source files, compare original test assertions against modified ones
   - Were assertions weakened? Were mocks added? Were expectations relaxed?
   - Flag as hard block (H12) if tests were modified to pass instead of code being fixed

6. **Acceptance criteria verification (phase 8):**
   - Read `task.md` acceptance criteria
   - For each criterion, find concrete evidence it's met — actual file, actual test, actual output
   - Unmet criteria = hard block (H10)

7. **`.critic/` rules** — Read the `.critic/` file referenced in the brief, apply relevant rules, cite any that surface findings

8. **Report generation** — Produce the structured reviewer findings (hard blocks, soft warnings, checks passed, learned patterns applied). The collector will combine this with its own findings.

### 3. Critic Skill — resources/phases.md (~400 lines)

Each of the 8 phases gets a dedicated section. Each check is annotated with its **step ownership** — collector (C) for session-aware checks, reviewer (R) for fresh-eyes checks.

**Phase 1: Creating a Task** (`/tasks add`)
- (C) Is there an existing task that overlaps? (Check INDEX.md in context)
- (R) Is the description precise enough to act on without interpretation?
- (R) Are acceptance criteria measurable and verifiable?
- *"The user says: Is this actually a new task, or are you creating busywork? Check the backlog first."*
- Escalation: All soft warnings (task creation is low-risk)

**Phase 2: Starting Planning** (`/tasks plan`)
- (C) Which files have you actually Read (full file) vs Grep'd? List them.
- (C) Are you making assumptions without having read CLAUDE.md and relevant standards?
- (R) How were similar features implemented in this codebase?
- *"The user says: Before you write a single word of the plan, prove you understand the codebase. What files did you read? What patterns did you find?"*
- Escalation: "Didn't read relevant files" = hard block (H11). Others = soft warning.

**Phase 3: Writing a Plan**
- (C) Did you read the files you're planning to modify, or just grep for them?
- (R) Is every file in "Files to Modify" a real path that exists (or is being created)?
- (R) Is every change justified by acceptance criteria?
- (R) Over-engineering check: more files than needed? Unnecessary abstractions?
- (R) Under-engineering check: missing edge cases at system boundaries?
- (R) 500-line limit on skill/resource files accounted for?
- (R) Tests included? Are they meaningful?
- *"The user says: Would YOU approve this plan if someone else wrote it? If the plan is longer than the code it describes, it's too long."*
- Escalation: Missing tests = hard block. Unverified file paths = hard block. Others = soft warning.

**Phase 4: Presenting Plan for Review**
- (C) Was there pushback during planning? How was it resolved?
- (R) Read the plan cold — is it clear without session context?
- (R) Are "Changes" sections specific enough to implement without ambiguity?
- (R) Could a different session implement this correctly from the text alone?
- (R) What's the simplest way to achieve this? Is the plan doing that?
- (R) What would break if implemented? What's the blast radius?
- *"The user says: I'm going to read this plan cold. 'What about X?' 'Did you consider Y?' 'Why not just Z?' 'This feels over-engineered.' 'You're missing the hard part.'"*
- Escalation: Missing acceptance criteria coverage = hard block. Ambiguous changes = soft warning.

**Phase 5: Starting Implementation** (`/tasks implement`)
- (C) Was the plan re-read (not from memory — actually Read tool)?
- (C) Were relevant standards skills read?
- (C) Is the feature branch created? Are you on it?
- (R) Does the plan match the current task.md? Any drift between plan approval and now?
- *"The user says: The plan is approved. Follow it. Not 'inspired by it' — follow it."*
- Escalation: Working on main = hard block (H7). Didn't re-read plan = hard block (H11). Others = soft warning.

**Phase 6: During Implementation** (ongoing)
- (C) Anti-grep: files being modified that were only grepped?
- (C) Degradation signals: placeholders, TODOs, sparse implementations, retries?
- (C) Are existing tests still passing? (evidence from session)
- (R) Compare current diff against plan's "Files to Modify" table
- (R) Gold-plating check: features, configurability, or "improvements" beyond scope?
- (R) TypeScript standards compliance (if applicable)?
- *"The user says: Show me the diff. Does it match the plan? If you touched a file not in the plan, explain why or revert it."*
- Escalation: Files outside plan scope = hard block (H1). Breaking tests = hard block (H5). Degradation = soft warning (S8).

**Phase 7: Submitting for Review** (`/tasks review`)
- (C) "Did you run it?" — collect build/test output evidence from session
- (C) Anti-grep: all modified files were fully read?
- (C) Counter-sycophancy: was there pushback? How was it handled?
- (R) Diff audit: plan files vs actual diff (see reviewer-prompt.md)
- (R) Test file modification check: assertions weakened?
- (R) Leftover debug statements, console.log, TODO comments?
- (R) Unnecessary comments/docstrings added to unchanged code?
- (R) Does `changes.md` accurately reflect what was done?
- *"The user says: I'm going to review this diff line by line. If I see changes not in the plan, I'm sending it back. If you changed the tests to make them pass instead of fixing the code, I'm definitely sending it back."*
- Escalation: Diff/plan mismatch = hard block (H1/H2). No evidence = hard block (H8). Weakened tests = hard block (H12). Debug leftovers = soft warning.

**Phase 8: Completing a Task** (`/tasks complete`)
- (C) Were all Phase 7 hard blocks resolved?
- (R) Each acceptance criterion in task.md — met? With evidence?
- (R) Loose ends? TODOs added during implementation?
- (R) Branch ready to merge? Clean state?
- *"The user says: Don't tell me it's done — prove it. Check every acceptance criterion."*
- Escalation: Unmet acceptance criteria = hard block (H10). Uncommitted changes = hard block. TODOs = soft warning.

### 4. Critic Skill — resources/escalation.md (~150 lines)

**Structure:** A table of escalation rules with step ownership — which step (collector/reviewer) is responsible for detecting each trigger.

**Hard Blocks** (must resolve before proceeding):

| ID | Trigger | Step | Phase(s) | Depth | Action |
|----|---------|------|----------|-------|--------|
| H1 | Files in diff not in plan (scope creep) | R | 6, 7, 8 | Standard | List unplanned files, require justification or revert |
| H2 | Files in plan not in diff (incomplete) | R | 7, 8 | Standard | List missing files, require implementation or plan amendment |
| H3 | Low confidence on architectural decision | C+R | 2, 3, 5 | Deep | C flags low confidence, R evaluates the decision |
| H4 | Contradicts CLAUDE.md or standards | R | All | Deep | Quote the violated rule, require fix |
| H5 | Breaking existing tests | C | 6, 7 | Standard | Show failing test from session output, require fix |
| H6 | Plugin boundary violation | R | 6, 7 | Standard | Show the cross-boundary reference, require removal |
| H7 | Working on main during implementation | C | 5, 6 | Quick | Stop immediately, require feature branch |
| H8 | No build/test evidence before review | C | 7, 8 | Quick | Require actual command output from session |
| H9 | Destructive command without verification | C | All | Quick | Flag the command, require user confirmation |
| H10 | Unmet acceptance criteria at completion | R | 8 | Ultra | List unmet criteria with evidence gaps |
| H11 | Files modified but only grepped, not read | C | 2, 3, 5, 6 | Standard | List files only grepped, require full read |
| H12 | Test assertions weakened to make tests pass | R | 7 | Deep | Show original vs modified assertions |

**Soft Warnings** (noted, not blocking):

| ID | Trigger | Step | Phase(s) | Depth | Note |
|----|---------|------|----------|-------|------|
| S1 | Minor style deviation | R | 6, 7 | Quick | Note the deviation, suggest fix |
| S2 | Optional improvement spotted | R | 3, 6 | Standard | Suggest as future task, don't expand scope |
| S3 | Non-critical edge case | R | 3, 6 | Deep | Document as known limitation |
| S4 | Documentation opportunity | R | 7 | Quick | Note but don't add unless in plan |
| S5 | Verbose commit history | R | 7 | Quick | Suggest squash if excessive |
| S6 | Gold-plating detected | R | 6 | Standard | Flag extra work, note it's beyond scope |
| S7 | TODOs added during implementation | C+R | 6, 7 | Quick | Note for follow-up, don't block |
| S8 | Degradation signals | C | 6 | Standard | Recommend context reset |
| S9 | On main while task is in implementing | C | 5, 6 | Quick | Suggest switching to feature branch |
| S10 | Sycophantic agreement detected | C | All | Standard | Flag that Claude agreed without evidence |

### 5. Critic Skill — resources/feedback-loop.md (~100 lines)

Rules for maintaining the `.critic/` learning directory:

**When to add entries:**
- The user pushes back on a plan or approach → capture the pattern
- The user rejects an implementation detail → capture the anti-pattern
- The user corrects Claude's thinking → capture the correction
- A recurring mistake is identified across multiple tasks → capture it

**How to add entries:**
1. Identify which status file the pattern belongs to (planning, implementation, review, completion)
2. Read the existing file
3. Check for overlap or contradiction with existing rules
4. Draft the proposed rule as a concise, imperative statement
5. **Present the proposed change to the user for approval.** Show: which file, what rule, whether it's new/merge/replacement. Never write to `.critic/` without explicit user approval.
6. If the new rule overlaps with an existing rule: draft a merged rule and **show both the original and merged version to the user for approval**.
7. If the new rule contradicts an existing rule: show both rules to the user and **ask which to keep**. Never silently replace.

**When to create new topic files:**
- When a pattern doesn't fit any existing status file
- When an existing file exceeds ~30 rules (split by subtopic)
- Name new files by status or sub-phase: `testing.md`, `git-workflow.md`, etc.

**Hygiene rules:**
- No contradictions within or across files
- No duplications — propose a merge to the user
- Keep rules concise — one sentence per rule where possible
- No raw conversation transcripts — distill into actionable rules
- **Never remove rules without user approval.** All `.critic/` modifications (add, merge, replace, remove) require explicit user approval.

### 6. `.critic/` Initial Seed Files

Each file is seeded with rules distilled from the research documents. These are starting points — they grow from real interactions.

**`.critic/planning.md`** (~15 rules):
- Read all relevant files in full before writing a plan — grep finds files, reading understands them
- Plans must reference real file paths — verify they exist before listing them
- Fewer focused changes beat many scattered changes
- Every change must be justified by task acceptance criteria — no "while we're at it"
- Check for existing patterns before inventing new ones
- Plans should be implementable by a different session with zero additional context
- Don't plan for hypothetical future requirements
- If you're unsure about architecture, read more code — don't guess
- Include meaningful tests in every plan — "test that it works" is not a test
- Account for the 500-line limit on skill and resource files
- Check INDEX.md for overlapping tasks before creating plans that duplicate existing work
- The right amount of complexity is the minimum needed for the current task
- Don't add configurability, feature flags, or backwards-compatibility shims
- Don't design for N when you only need 1
- If the solution is more complex than the problem, reconsider the approach

**`.critic/implementation.md`** (~16 rules):
- Follow the approved plan exactly — deviations require going back to planning
- Use `npm run build:plugin` not `npx tsc` — tsc alone doesn't run tsc-alias
- Plugin boundary: nothing inside `plugin/` references `.claude/`, `.tasks/`, or root files
- Don't add error handling for scenarios that can't happen internally — only at system boundaries
- Three similar lines is better than a premature abstraction
- Don't add docstrings, comments, or type annotations to code you didn't change
- Don't rename unused variables with `_` prefix — delete unused code
- Prefer editing existing files over creating new ones
- Run tests after every significant change, not just at the end
- If a test fails, fix the code — never modify the test to make it pass (unless the test was wrong)
- When something is blocked, investigate the root cause — don't brute-force or retry
- Don't create helpers or utilities for one-time operations
- If you're touching more files than the plan specified, you're probably over-engineering
- A bug fix doesn't need surrounding code cleaned up
- Silent scope reduction is as bad as scope creep — don't quietly drop acceptance criteria
- Watch for degradation signals: placeholder code, `// TODO: implement`, sparse implementations — recommend context reset

**`.critic/review.md`** (~11 rules):
- Every line in the diff must justify its existence — if it's not in the plan, explain or revert
- If test files were modified alongside source files, verify assertions weren't weakened
- Don't claim completion without evidence — "tests pass" requires actual output
- Be direct — skip preamble and filler when presenting work
- Flag uncertainty explicitly with confidence levels
- Present options with trade-offs, not recommendations disguised as questions
- Lead with what the user needs to know or decide
- Don't add emojis unless asked
- Disagreement with evidence is more useful than agreement without
- If blocked, explain what's blocking and suggest next steps
- Don't over-explain or justify every micro-decision

**`.critic/completion.md`** (~6 rules):
- Check every acceptance criterion individually — with evidence, not assertions
- Don't mark a task complete if any acceptance criterion is unmet
- "It's 90% done, here's what's left" is better than "it's complete" when it isn't
- Verify no uncommitted changes remain on the branch
- Check for TODOs or deferred issues added during implementation — document them
- Don't add optional parameters to make functions "more flexible" as a last-minute addition

### 7. Tasks Skill Integration

Add a one-line critic reference at each lifecycle transition in `.claude/skills/tasks/SKILL.md`:

```markdown
**Critic check:** After completing this phase, invoke the `critic` skill (`/critic`) for self-review before presenting results to the user.
```

Integration points (6 additions):
- `/tasks add` — after creating and committing the task
- `/tasks plan` — after plan content is written (before presenting to user)
- `/tasks plan-review` — before moving to plan-review
- `/tasks implement` — after creating the feature branch
- `/tasks review` — before generating changes.md
- `/tasks complete` — before finalizing completion

Each addition is ~1-2 lines. Total impact on tasks SKILL.md: ~12 lines added.

### 8. CLAUDE.md Updates

Add `.critic/` to the repository structure diagram:
```
├── .critic/                               # Learned critic feedback (topic-organized)
```

Add a brief note:
- `.critic/` stores learned patterns from user feedback, organized by topic
- NOT gitignored — persistent project knowledge
- Managed by the critic skill — all modifications require user approval

### 9. Rename `ready` → `plan-review` Across Task Management System

The `3-ready` status is renamed to `3-plan-review` to accurately reflect its purpose: a formal plan review checkpoint (possibly by a different person) between collaborative planning and implementation.

**Directory rename:**
- `.tasks/3-ready/` → `.tasks/3-plan-review/` (currently contains only `.gitkeep`)

**Tasks skill files** (4 files, find-and-replace `ready` → `plan-review` in status-related contexts):
- `SKILL.md`: Rename `/tasks ready` → `/tasks plan-review`, update directory/status references
- `schemas.md`: Update status enum, INDEX.md example, directory references
- `workflows.md`: Update workflow descriptions
- `reference.md`: Update lifecycle references

**Other files:**
- `commit/SKILL.md`: Update if it references the ready status
- `CLAUDE.md`: Update if it references `3-ready`

**What changes in each tasks skill file:**
- Command name: `/tasks ready <id>` → `/tasks plan-review <id>`
- Directory name: `3-ready/` → `3-plan-review/`
- Status value: `ready` → `plan-review`
- Display name in INDEX.md: `## Ready` → `## Plan Review`

## Dependencies

1. `ready` → `plan-review` rename first (critic skill references the new name)
2. `.critic/` seed files created next (the skill references them)
3. Critic SKILL.md written next (the collector/orchestrator)
4. `reviewer-prompt.md` written next (referenced by SKILL.md)
5. Other resource files (phases, escalation, feedback-loop)
6. Tasks skill integration last (references the completed critic skill)
7. CLAUDE.md update can happen at any point

## Tests

This is a prompt-only skill (no TypeScript), so verification is structural and behavioral.

### Structural Validation

- [ ] `critic/SKILL.md` has frontmatter with `description` (no `context: fork` — runs in-context)
- [ ] `critic/SKILL.md` is under 500 lines
- [ ] `critic/resources/reviewer-prompt.md` exists and is under 500 lines
- [ ] `critic/resources/phases.md` exists and is under 500 lines
- [ ] `critic/resources/escalation.md` exists and is under 500 lines
- [ ] `critic/resources/feedback-loop.md` exists and is under 500 lines
- [ ] All resource files are referenced from SKILL.md's "Resource Files" section
- [ ] `.critic/` directory exists with 4 files: `planning.md`, `implementation.md`, `review.md`, `completion.md`
- [ ] Each `.critic/` file contains concise imperative rules, not transcripts
- [ ] `.critic/` is NOT listed in `.gitignore`

### Two-Step Architecture Validation

- [ ] Step 1 (collector) runs in the current session context — can see conversation history
- [ ] Step 1 writes a structured brief to `.temp/critic-brief.md`
- [ ] Brief includes: files-read vs files-grepped, user pushback summary, build/test evidence, phase, task info
- [ ] Step 2 (reviewer) launches as a fresh-context subagent via Task tool
- [ ] Reviewer reads the brief, not the conversation — has genuinely fresh eyes
- [ ] Reviewer independently reads code, plan, diff (not relying on collector's summaries of code content)
- [ ] Combined output clearly separates "Session Checks (collector)" from "Code Review (reviewer)"
- [ ] Collector handles: anti-grep, counter-sycophancy, evidence gathering, degradation detection
- [ ] Reviewer handles: diff audit, standards compliance, test assertion check, acceptance criteria

### Phase Inference Validation

- [ ] Collector correctly identifies Phase 6 when on a `feature/task-N-*` branch with uncommitted changes
- [ ] Collector correctly identifies Phase 5 when on a feature branch with only `.tasks/` files changed
- [ ] Collector correctly identifies Phase 4 when on main with a task in `3-plan-review/`
- [ ] Collector correctly identifies Phase 4 when on main with a task in `2-planning/` having complete plan.md
- [ ] Collector correctly identifies Phase 7 when on a feature branch with task status `reviewing`
- [ ] Collector flags "on main but task is in implementing" as soft warning
- [ ] Collector uses session context as primary signal, git/filesystem as fallback
- [ ] Collector asks user when ambiguous (multiple active tasks, no clear signals)
- [ ] Collector handles edge case: no active tasks (asks user what to review)

### Output Format Validation

- [ ] Output has separate sections for collector findings and reviewer findings
- [ ] Each finding has a confidence rating (high/medium/low)
- [ ] Hard blocks from either step end with "BLOCKED"
- [ ] No hard blocks end with "CLEAR — proceed with noted warnings"
- [ ] Applied `.critic/` rules are cited in the output
- [ ] Critic never auto-fixes — all findings presented to user for decision

### Protocol Validation

- [ ] Anti-grep check (collector) triggers when files are grepped but not fully read
- [ ] Counter-sycophancy check (collector) flags when Claude agreed without evidence
- [ ] Diff audit (reviewer) compares plan's files table against actual branch diff
- [ ] "Did you run it?" gate (collector) requires build/test output for TypeScript changes
- [ ] "Did you run it?" gate correctly skips build/test for prompt-only (.md) tasks
- [ ] Test file modification check (reviewer) flags weakened assertions in Phase 7
- [ ] Degradation detection (collector) flags placeholder code and TODO proliferation
- [ ] Confidence calibration reflects what was actually verified vs assumed

### Rename Validation

- [ ] `.tasks/3-plan-review/` directory exists (renamed from `3-ready/`)
- [ ] `.tasks/3-ready/` no longer exists
- [ ] Tasks SKILL.md uses `/tasks plan-review` command (not `/tasks ready`)
- [ ] Tasks schemas.md lists `plan-review` in status enum (not `ready`)
- [ ] Tasks schemas.md INDEX.md example shows `## Plan Review` section
- [ ] No remaining references to `3-ready` or `/tasks ready` in tasks skill files
- [ ] INDEX.md section header is `## Plan Review` (not `## Ready`)

### Integration Validation

- [ ] Tasks SKILL.md references critic at each of the 6 transition points
- [ ] CLAUDE.md includes `.critic/` in repository structure
- [ ] CLAUDE.md references `3-plan-review` (not `3-ready`) if applicable
- [ ] Critic reference in tasks skill is non-blocking (recommendation, not mandatory gate)

### Failure Mode Validation

- [ ] If `.critic/` directory is empty or missing files, critic still runs (built-in checks only)
- [ ] If phase inference is wrong, user can correct it and critic re-runs
- [ ] If reviewer subagent fails or times out, collector presents its own findings with a note
- [ ] Brief file is written to `.temp/` (gitignored, not committed)

## Verification

- [ ] `/critic` is invocable and listed in available skills
- [ ] Running `/critic` while planning produces collector + reviewer findings with `.critic/` rules
- [ ] Running `/critic` while implementing produces diff comparison + session evidence checks
- [ ] Running `/critic` before review produces diff audit + evidence gate
- [ ] Hard blocks prevent "CLEAR" output
- [ ] `.critic/` files are readable and their rules appear in critic output
- [ ] Tasks skill transitions reference the critic at all 6 integration points
- [ ] `/tasks plan-review` command works (renamed from `/tasks ready`)
- [ ] All 18 acceptance criteria from task.md are addressed
