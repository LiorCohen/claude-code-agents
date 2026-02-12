---
title: Add critic skill for self-checking at every task lifecycle phase
created: 2026-02-12 16:00 UTC
updated: 2026-02-12 17:00 UTC
---

# Plan: Add Critic Skill for Self-Checking at Every Task Lifecycle Phase

## Problem Summary

Claude doesn't self-check. It over-engineers, agrees with everything, drifts from plans, claims completion without evidence, and greps for keywords instead of reading files. Without a structured self-review mechanism, every interaction requires the user to manually catch these failure modes. The critic skill forces Claude to pause and self-evaluate at each task lifecycle transition using a forked subagent (`context: fork`) with fresh context — so the review isn't tainted by the same reasoning that produced the work. The forked subagent has no conversation history; it must reconstruct all state from the filesystem and git, which is exactly the point — fresh eyes on the code.

## Files to Modify

| File | Changes |
|------|---------|
| `.claude/skills/critic/SKILL.md` | **New.** Main skill (~300 lines) — phase inference algorithm, core protocols, output format, `.crit/` integration, resource file references |
| `.claude/skills/critic/resources/phases.md` | **New.** (~400 lines) Detailed per-phase checks for all 8 lifecycle phases with "The user says" voice sections |
| `.claude/skills/critic/resources/escalation.md` | **New.** (~150 lines) Escalation matrix — hard blocks vs soft warnings with trigger conditions and examples |
| `.claude/skills/critic/resources/feedback-loop.md` | **New.** (~100 lines) Rules for maintaining `.crit/` feedback files — hygiene, merging, conflict resolution |
| `.crit/planning.md` | **New.** Initial seed — learned patterns about planning mistakes (distilled from research) |
| `.crit/implementation.md` | **New.** Initial seed — learned patterns about coding anti-patterns |
| `.crit/scope.md` | **New.** Initial seed — learned patterns about over/under-engineering |
| `.crit/communication.md` | **New.** Initial seed — learned patterns about presenting work |
| `.claude/skills/tasks/SKILL.md` | **Modify.** Add critic skill reference at each lifecycle transition point (~6 one-line additions) |
| `CLAUDE.md` | **Modify.** Add `.crit/` to repository structure diagram and brief explanation |

## Changes

### 1. Critic Skill — SKILL.md (~300 lines)

**Frontmatter:**
```yaml
---
description: >
  Self-review at every task lifecycle phase. Infers current phase from
  git/filesystem state, runs phase-specific checks, rates confidence,
  and classifies findings as hard blocks or soft warnings. Reads learned
  patterns from .crit/*.md files. If no active task or ambiguous context,
  asks the user what to review. Produces: structured self-evaluation report.
context: fork
agent: general-purpose
---
```

**Section 1: Phase Inference Algorithm**

The critic must determine the current lifecycle phase entirely from filesystem and git state (since a forked subagent has no conversation history). The algorithm:

1. Run `git branch --show-current` to get the current branch name
2. If branch matches `feature/task-<N>-*`:
   - Extract task ID `<N>`
   - Read `.tasks/*/N/task.md` to get current status
   - Check `git diff --name-only HEAD` for uncommitted changes
   - Check `git diff --name-only main...HEAD` for all branch changes
   - Map to phase:
     - Status `implementing` + uncommitted changes → **Phase 6: During implementation**
     - Status `implementing` + no uncommitted changes → **Phase 5: Starting implementation** (or 7 if branch has substantial commits)
     - Status `reviewing` → **Phase 7: Submitting for review**
3. If branch is `main`:
   - Check `.tasks/2-planning/*/task.md` for any task with status `planning` → **Phase 2/3/4: Planning phases**
   - Check `.tasks/1-inbox/` for recently created tasks → **Phase 1: Creating a task**
   - Check if the most recent commit message starts with `Tasks: Complete` → **Phase 8: Completing a task**
4. If ambiguous (multiple active tasks, no clear signals) → **Ask the user** which task/phase to review. Never guess.

**Disambiguating planning sub-phases (2, 3, 4):**
- Task in `2-planning/` with empty plan.md skeleton → Phase 2 (starting planning)
- Task in `2-planning/` with plan.md content, uncommitted changes → Phase 3 (writing a plan)
- Task in `2-planning/` with plan.md content, no uncommitted changes → Phase 4 (presenting plan for review)

**Section 2: Core Protocols**

Each protocol is a concrete behavioral rule, not a vague aspiration.

**Anti-grep rule:**
> For each file referenced in your work, check: was it opened with the Read tool (full file), or only searched with Grep/Glob? If any file central to the changes was only grepped — not fully read — flag it as a hard block. Grep finds files. Reading understands them. They are not interchangeable.

**Counter-sycophancy protocol:**
> When the user pushes back on Claude's work, the critic enforces a two-step check:
> 1. **Is the user right?** Check their feedback against the actual code, standards, and plan. If yes, acknowledge and fix.
> 2. **Is Claude just agreeing?** If the original approach was correct per standards/plan, the critic flags: "The original approach appears correct because [evidence]. Verify before reverting."
> The reverse also applies: if the user suggests something contradicting CLAUDE.md, standards, or the approved plan, the critic flags the contradiction with specific rule references. Silence is not compliance.

**Confidence calibration:**
> For each check, the critic assigns a confidence level:
> - **High**: Verified by reading actual files/output (e.g., "plan.md lists 5 files, diff touches 5 files — match confirmed")
> - **Medium**: Inferred from patterns but not fully verified (e.g., "tests likely pass based on file structure, but output not checked")
> - **Low**: Assumption without verification (e.g., "this approach seems consistent with existing patterns, but I haven't read the relevant files")
> Low-confidence findings are explicitly flagged: "LOW CONFIDENCE — I haven't verified X because Y. The user should check this."

**Diff audit (phases 7, 8 only):**
> 1. Read `plan.md` from the task folder — parse the "Files to Modify" table to get expected file list
> 2. Run `git diff --name-only main...HEAD` to get actual files changed on the branch
> 3. Exclude `.tasks/` files from comparison (task management is meta-work)
> 4. Compare:
>    - **Files in plan but not in diff** → Flag as "planned change not implemented" (hard block)
>    - **Files in diff but not in plan** → Flag as "unplanned change" (hard block — scope creep)
>    - **Files match** → Confirm scope alignment
> 5. For each file in diff, verify the change is justified line-by-line. If any change can't be traced to a plan item, flag it.

**"Did you run it?" gate (phases 7, 8 only):**
> Before claiming completion, the critic checks for evidence:
> 1. Were `npm test` and `npm run typecheck:plugin` run? (Check for recent test output in conversation, or ask)
> 2. If plugin TypeScript was changed, was `npm run build:plugin` run?
> 3. "I think it works" is not evidence. "Tests pass (output below)" is evidence.
> 4. If no evidence of execution exists, this is a hard block.

**Section 3: Output Format**

The critic produces a structured report:

```markdown
## Critic Self-Review — Phase N: [Phase Name]

**Task:** #<id> — <title>
**Confidence:** [overall confidence level]

### Hard Blocks (must resolve before proceeding)

1. **[Finding title]** [CONFIDENCE: high/medium/low]
   - What: [specific finding]
   - Evidence: [what was checked]
   - Action: [what must happen]

### Soft Warnings (noted, not blocking)

1. **[Finding title]** [CONFIDENCE: high/medium/low]
   - What: [specific finding]
   - Note: [suggestion]

### Checks Passed

- [x] [Check description] — [brief evidence]

### Learned Patterns Applied (from .crit/)

- Applied rule from `.crit/planning.md`: "[rule text]"
```

If there are hard blocks, the critic ends with: **"BLOCKED — resolve the above before proceeding."**
If no hard blocks, it ends with: **"CLEAR — proceed with noted warnings."**

**Section 4: `.crit/` Integration**

After inferring the phase, the critic reads only the relevant `.crit/` topic files on-demand (not all files upfront). The mapping:

| Phase | Primary .crit/ files | Secondary |
|-------|---------------------|-----------|
| 1 (creating task) | scope.md | planning.md |
| 2-4 (planning) | planning.md, scope.md | communication.md |
| 5-6 (implementing) | implementation.md, scope.md | planning.md |
| 7-8 (review/complete) | implementation.md, scope.md | communication.md |

Only primary files are read by default. Secondary files are read if a finding references a pattern that might be covered there.

**Section 5: Resource File References**

```markdown
## Resource Files

- [phases.md](resources/phases.md) — Detailed checks for all 8 lifecycle phases
- [escalation.md](resources/escalation.md) — Hard block vs soft warning classification criteria
- [feedback-loop.md](resources/feedback-loop.md) — Rules for maintaining the .crit/ learning directory
```

### 2. Critic Skill — resources/phases.md (~400 lines)

Each of the 8 phases gets a dedicated section with:
- **Context signals** — how the critic knows it's in this phase
- **Checks** — 4-8 specific, actionable questions per phase
- **"The user says"** — a voice section capturing the direct, skeptical review tone (what would the user ask?)
- **Escalation defaults** — which checks are hard blocks vs soft warnings for this phase

**Phase 1: Creating a Task** (`/tasks add`)
- Is this task well-scoped? Can it be completed in a single implementation cycle?
- Does it overlap with existing tasks? (Read INDEX.md, search for similar titles/descriptions)
- Is the description precise enough to act on without interpretation?
- Are acceptance criteria measurable and verifiable?
- *"The user says: Is this actually a new task, or are you creating busywork? Check the backlog first. If it overlaps with an existing task, consolidate — don't fragment."*
- Escalation: All soft warnings (task creation is low-risk)

**Phase 2: Starting Planning** (`/tasks plan`)
- Have you read all files you plan to modify? Full files, not grep snippets?
- Do you understand the existing patterns in the codebase, or are you assuming?
- Have you checked how similar features were implemented before?
- Are you making assumptions about architecture without reading CLAUDE.md and relevant standards?
- *"The user says: Before you write a single word of the plan, prove you understand the codebase. What files did you read? What patterns did you find? If you can't answer that, you're not ready to plan."*
- Escalation: "Didn't read relevant files" = hard block. Others = soft warning.

**Phase 3: Writing a Plan**
- Is every file in the "Files to Modify" table a real path that exists (or is being created)?
- Is every change justified by the task description or acceptance criteria?
- Are you over-engineering? (More files than needed, unnecessary abstractions, premature generalization)
- Are you under-engineering? (Missing edge cases, skipping error handling at system boundaries)
- Did you account for the 500-line limit on skill/resource files?
- Does the plan include tests? Are the tests meaningful (not just "test that it works")?
- *"The user says: Would YOU approve this plan if someone else wrote it? Be honest. If there's a change you can't justify in one sentence, remove it. If the plan is longer than the code it describes, it's too long."*
- Escalation: Missing tests = hard block. Unverified file paths = hard block. Others = soft warning.

**Phase 4: Presenting Plan for Review**
- Read the plan as if seeing it for the first time. Is it clear without the planning context?
- Are the "Changes" sections specific enough to implement without ambiguity?
- Is the scope minimal — does every change serve the task's acceptance criteria?
- Could a different Claude session implement this plan correctly from the text alone?
- What's the simplest possible way to achieve this? Is the plan doing that?
- What about existing patterns — does this plan deviate from how the codebase already works?
- What would break if this plan is implemented? What's the blast radius?
- *"The user says: I'm going to read this plan cold. If I have to ask 'what does this mean?' or 'why is this needed?', the plan isn't ready. 'What about X?' 'Did you consider Y?' 'Why not just Z?' 'This feels over-engineered.' 'You're missing the hard part.' 'What breaks if we do this?'"*
- Escalation: Missing acceptance criteria coverage = hard block. Ambiguous changes = soft warning. Devil's advocate questions = soft warning.

**Phase 5: Starting Implementation** (`/tasks implement`)
- Have you re-read the approved plan? (Not from memory — actually read plan.md)
- Have you re-read the relevant standards skills (TypeScript, skills, agents, commands)?
- Are you about to introduce complexity not in the plan?
- Is the feature branch created and are you on it (not on main)?
- *"The user says: The plan is approved. Follow it. Not 'inspired by it' — follow it. If you think the plan is wrong, come back and say so. Don't silently deviate."*
- Escalation: Working on main = hard block. Didn't re-read plan = hard block. Others = soft warning.

**Phase 6: During Implementation** (ongoing)
- Compare current changes (`git diff`) against the plan's "Files to Modify" table
- Are you adding files not in the plan? Why?
- Are you gold-plating? (Adding features, configurability, or "improvements" beyond scope)
- Are existing tests still passing?
- Are you following TypeScript standards (if applicable)?
- Have you read the full files you're modifying, or just the sections you're changing?
- *"The user says: Show me the diff. Does it match the plan? If you touched a file that's not in the plan, explain why or revert it. Scope creep is the #1 failure mode."*
- Escalation: Files outside plan scope = hard block. Breaking tests = hard block. Gold-plating = soft warning.

**Phase 7: Submitting for Review** (`/tasks review`)
- **Run diff audit** (see SKILL.md Section 2)
- **Run "did you run it?" gate** (see SKILL.md Section 2)
- Are there leftover debug statements, console.log, TODO comments?
- Did you add unnecessary comments or docstrings to code you didn't need to change?
- Does `changes.md` accurately reflect what was done?
- Is the commit history clean? (Each commit focused, no "fix typo" chains)
- *"The user says: I'm going to review this diff line by line. Every line needs to justify its existence. If I see changes that aren't in the plan, I'm sending it back. If you say 'tests pass' without showing me output, I don't believe you."*
- Escalation: Diff/plan mismatch = hard block. No test evidence = hard block. Leftover debug = soft warning.

**Phase 8: Completing a Task** (`/tasks complete`)
- Go through each acceptance criterion in task.md — is it met? With evidence?
- Are there loose ends? (TODOs added during implementation, known issues deferred)
- Is the branch ready to merge? (No uncommitted changes, clean state)
- Were all hard blocks from Phase 7 resolved?
- *"The user says: Don't tell me it's done — prove it. Check every acceptance criterion. If even one is not met, it's not done. I'd rather hear 'it's 90% done, here's what's left' than 'it's complete' when it isn't."*
- Escalation: Unmet acceptance criteria = hard block. Uncommitted changes = hard block. TODOs added = soft warning.

### 3. Critic Skill — resources/escalation.md (~150 lines)

**Structure:** A table of escalation rules, each with: ID, trigger condition, severity, action, phase(s), example.

**Hard Blocks** (critic outputs "BLOCKED" — must resolve before proceeding):

| ID | Trigger | Phase(s) | Action |
|----|---------|----------|--------|
| H1 | Files in diff not in plan (scope creep) | 6, 7, 8 | List unplanned files, require justification or revert |
| H2 | Files in plan not in diff (incomplete) | 7, 8 | List missing files, require implementation or plan amendment |
| H3 | Low confidence on architectural decision | 2, 3, 5 | Flag specific decision, ask user to verify |
| H4 | Contradicts CLAUDE.md or standards | All | Quote the violated rule, require fix |
| H5 | Breaking existing tests | 6, 7 | Show failing test, require fix before proceeding |
| H6 | Plugin boundary violation | 6, 7 | Show the cross-boundary reference, require removal |
| H7 | Working on main during implementation | 5, 6 | Stop immediately, require feature branch |
| H8 | No build/test evidence before review | 7, 8 | Require actual command output |
| H9 | Destructive command without verification | All | Flag the command, require user confirmation |
| H10 | Unmet acceptance criteria at completion | 8 | List unmet criteria, block completion |
| H11 | Didn't read files that are being modified | 2, 3, 5, 6 | Flag which files were only grepped, require full read |

**Soft Warnings** (critic outputs "WARNING" — noted but not blocking):

| ID | Trigger | Phase(s) | Note |
|----|---------|----------|------|
| S1 | Minor style deviation | 6, 7 | Note the deviation, suggest fix |
| S2 | Optional improvement spotted | 3, 6 | Suggest as future task, don't expand current scope |
| S3 | Non-critical edge case | 3, 6 | Document as known limitation |
| S4 | Documentation opportunity | 7 | Note but don't add unless in plan |
| S5 | Verbose commit history | 7 | Suggest squash if excessive |
| S6 | Gold-plating detected | 6 | Flag the extra work, note it's beyond scope |
| S7 | TODOs added during implementation | 6, 7 | Note for follow-up, don't block |

### 4. Critic Skill — resources/feedback-loop.md (~100 lines)

Rules for maintaining the `.crit/` learning directory:

**When to add entries:**
- The user pushes back on a plan or approach → capture the pattern
- The user rejects an implementation detail → capture the anti-pattern
- The user corrects Claude's thinking → capture the correction
- A recurring mistake is identified across multiple tasks → capture it

**How to add entries:**
1. Identify which topic file the pattern belongs to (planning, implementation, scope, communication)
2. Read the existing file
3. Check for overlap or contradiction with existing rules
4. If new rule overlaps with existing: merge into one stronger, more precise rule
5. If new rule contradicts existing: replace the old rule (it was wrong or outdated)
6. If unsure about overlap/contradiction: ask the user before modifying
7. Write the rule as a concise, imperative statement — not a paragraph, not a transcript

**When to create new topic files:**
- When a pattern doesn't fit any existing topic file
- When an existing file exceeds ~30 rules (split by subtopic)
- Name the file descriptively: `testing.md`, `git-workflow.md`, etc.

**Hygiene rules:**
- No contradictions within or across files
- No duplications — if two rules say the same thing, merge them
- Keep rules concise — one sentence per rule where possible
- No raw conversation transcripts — distill into actionable rules
- Review periodically: if a rule hasn't been relevant in 10+ tasks, consider removing it

### 5. `.crit/` Initial Seed Files

Each file is seeded with rules distilled from the research documents (`research_2026-02-10.md` and `research_2026-02-10_deep.md`). These are starting points — they grow from real interactions.

**`.crit/planning.md`** (~20 rules):
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

**`.crit/implementation.md`** (~20 rules):
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
- Don't use `git commit --no-verify` to bypass pre-commit hooks
- When something is blocked, investigate the root cause — don't brute-force or retry

**`.crit/scope.md`** (~15 rules):
- The right amount of complexity is the minimum needed for the current task
- Don't add configurability, feature flags, or backwards-compatibility shims
- Don't create helpers or utilities for one-time operations
- If you're touching more files than the plan specified, you're probably over-engineering
- Don't add abstractions "in case we need them later"
- If the solution is more complex than the problem, reconsider the approach
- Don't add optional parameters to make functions "more flexible"
- A bug fix doesn't need surrounding code cleaned up
- Don't design for N when you only need 1
- Silent scope reduction is as bad as scope creep — don't quietly drop acceptance criteria

**`.crit/communication.md`** (~10 rules):
- Be direct — skip preamble and filler
- Don't over-explain or justify every micro-decision
- Flag uncertainty explicitly with confidence levels
- Present options with trade-offs, not recommendations disguised as questions
- When presenting work, lead with what the user needs to know or decide
- Don't claim completion without evidence — "tests pass" requires output
- If blocked, explain what's blocking and suggest next steps — don't just stop
- Don't add emojis unless asked
- Disagreement with evidence is more useful than agreement without

### 6. Tasks Skill Integration

Add a one-line critic reference at each lifecycle transition in `.claude/skills/tasks/SKILL.md`. The reference tells Claude to invoke the critic skill at that point. Example addition after a transition's commit step:

```markdown
**Critic check:** After completing this phase, invoke the `critic` skill (`/critic`) for self-review before presenting results to the user.
```

Integration points (6 additions):
- `/tasks add` — after creating and committing the task
- `/tasks plan` — Phase 2, after plan content is written (before presenting to user)
- `/tasks ready` — before moving to ready
- `/tasks implement` — after creating the feature branch
- `/tasks review` — before generating changes.md (the diff audit is most critical here)
- `/tasks complete` — before finalizing completion

Each addition is ~1-2 lines. Total impact on tasks SKILL.md: ~12 lines added.

### 7. CLAUDE.md Updates

Add `.crit/` to the repository structure diagram:
```
├── .crit/                               # Learned critic feedback (topic-organized)
```

Add a brief note in a relevant section explaining:
- `.crit/` stores learned patterns from user feedback, organized by topic
- NOT gitignored — these are persistent project knowledge
- Managed by the critic skill — don't edit directly unless adding feedback

## Dependencies

1. `.crit/` seed files created first (the skill references them at startup)
2. Critic skill SKILL.md written next (establishes the framework)
3. Critic resource files written after SKILL.md (referenced from it)
4. Tasks skill integration last (references the completed critic skill)
5. CLAUDE.md update can happen at any point

## Tests

This is a prompt-only skill (no TypeScript), so verification is structural and behavioral.

### Structural Validation

- [ ] `critic/SKILL.md` has frontmatter: `context: fork`, `agent: general-purpose`, `description` present
- [ ] `critic/SKILL.md` is under 500 lines
- [ ] `critic/resources/phases.md` exists and is under 500 lines
- [ ] `critic/resources/escalation.md` exists and is under 500 lines
- [ ] `critic/resources/feedback-loop.md` exists and is under 500 lines
- [ ] All resource files are referenced from SKILL.md's "Resource Files" section
- [ ] `.crit/` directory exists with 4 files: `planning.md`, `implementation.md`, `scope.md`, `communication.md`
- [ ] Each `.crit/` file contains concise imperative rules, not transcripts or paragraphs
- [ ] `.crit/` is NOT listed in `.gitignore`

### Phase Inference Validation

- [ ] Critic correctly identifies Phase 6 when on a `feature/task-N-*` branch with uncommitted changes and task status `implementing`
- [ ] Critic correctly identifies Phase 4 when on main with a task in `2-planning/` having complete plan.md and no uncommitted changes
- [ ] Critic correctly identifies Phase 7 when on a feature branch with task status `reviewing`
- [ ] Critic asks the user when context is ambiguous (multiple active tasks, no clear phase signals)
- [ ] Phase inference handles edge case: no active tasks at all (asks user what to review)

### Output Format Validation

- [ ] Output includes "Hard Blocks" and "Soft Warnings" sections
- [ ] Each finding has a confidence rating (high/medium/low)
- [ ] Hard blocks end with "BLOCKED — resolve the above before proceeding"
- [ ] No hard blocks end with "CLEAR — proceed with noted warnings"
- [ ] Applied `.crit/` rules are cited in the output

### Protocol Validation

- [ ] Anti-grep rule triggers when files are grepped but not fully read
- [ ] Counter-sycophancy protocol flags when user feedback contradicts standards
- [ ] Diff audit compares plan's files table against actual branch diff (phases 7, 8)
- [ ] "Did you run it?" gate requires build/test command output (phases 7, 8)
- [ ] Confidence calibration distinguishes verified (high) from assumed (low)

### Integration Validation

- [ ] Tasks SKILL.md references critic at each of the 6 transition points
- [ ] CLAUDE.md includes `.crit/` in repository structure
- [ ] Critic reference in tasks skill is non-blocking (recommendation, not mandatory gate)

### Failure Mode Validation

- [ ] If `.crit/` directory is empty or missing files, critic still runs (uses built-in checks only)
- [ ] If phase inference is wrong, user can correct it and critic re-runs with correct phase
- [ ] Forked subagent correctly receives skill content as its prompt (not inline execution)

## Verification

- [ ] `/critic` is invocable and listed in available skills
- [ ] Running `/critic` while planning produces planning-phase checks with relevant `.crit/` rules
- [ ] Running `/critic` while implementing produces implementation-phase checks with diff comparison
- [ ] Running `/critic` before review produces diff audit + evidence gate
- [ ] Hard blocks prevent "CLEAR" output — user must see and address them
- [ ] `.crit/` files are readable and their rules appear in critic output
- [ ] Tasks skill transitions reference the critic at all 6 integration points
- [ ] All 18 acceptance criteria from task.md are addressed
