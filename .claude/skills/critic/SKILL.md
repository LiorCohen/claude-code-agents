---
name: critic
description: >
  Two-step self-review at every task lifecycle phase. Step 1 (this skill)
  runs in-context to gather session signals — files read vs grepped, user
  pushback, build evidence, degradation signs. Step 2 launches a forked
  subagent for unbiased code/plan review with fresh eyes. Combined report
  classifies findings as hard blocks or soft warnings.
---

# Critic Skill

Self-review at every task lifecycle phase. Invoked via `/critic`.

---

## Phase Inference

The collector has full session context — it can see what commands were just run, what task is being discussed, and what the user asked for. It also uses filesystem/git state for robustness.

### Algorithm

1. Run `git branch --show-current` to get the current branch name

2. **If branch matches `feature/task-<N>-*`:**
   - Extract task ID `<N>`
   - Read `.tasks/*/N/task.md` to get current status
   - Check `git diff --name-only HEAD` for uncommitted changes
   - Check `git diff --name-only main...HEAD` for all branch changes
   - Map to phase:
     - Status `implementing` + uncommitted changes → **Phase 6: During implementation**
     - Status `implementing` + no uncommitted changes + `git diff --name-only main...HEAD` has non-`.tasks/` files → **Phase 6** (between changes)
     - Status `implementing` + no uncommitted changes + only `.tasks/` files changed → **Phase 5: Starting implementation**
     - Status `reviewing` → **Phase 7: Submitting for review**

3. **If branch is `main`:**
   - Check session context for which task is being discussed (most reliable signal)
   - Check `git log --oneline -5` for recent task transitions
   - Scan active status directories (`1-inbox/`, `2-planning/`, `3-plan-review/`, `4-implementing/`, `5-reviewing/`) for tasks
   - Cross-reference all signals
   - If task in `4-implementing/` while on main → soft warning (S9): suggest switching to feature branch
   - If **exactly one** active task → use it, infer phase from status directory
   - If **multiple** active tasks and signals don't disambiguate → ask the user
   - If **no** active tasks → ask the user
   - Status-to-phase: `1-inbox` → Phase 1, `2-planning` → Phase 2/3/4, `3-plan-review` → Phase 4, `4-implementing` → Phase 5/6, `5-reviewing` → Phase 7/8

4. **Disambiguating planning sub-phases (2, 3, 4):**
   - Task in `2-planning/` with empty plan.md skeleton → Phase 2 (starting planning)
   - Task in `2-planning/` with plan.md content, uncommitted changes → Phase 3 (writing a plan)
   - Task in `2-planning/` with plan.md content, no uncommitted changes → Phase 4 (presenting plan for review)

5. **If ambiguous at any step → ask the user.** Never guess.

---

## Collector Checks (Session-Aware)

These checks are only possible in-context because they require session visibility.

### Anti-Grep Check

Review the conversation history. For each file central to the current work, determine: was it opened with the Read tool (full file), or only found via Grep/Glob? Build a list of files-read and files-only-grepped. Any file being modified that was only grepped is a **hard block (H11)**.

### Counter-Sycophancy Check

Review the conversation for pushback — did the user disagree with an approach? If so, check: did Claude evaluate the feedback against evidence, or did it just agree? If Claude immediately agreed without defending the original with evidence, flag it (S10). The reverse: did the user suggest something that contradicts CLAUDE.md or the plan? If so, was it flagged? Silence is not compliance.

### Evidence Gathering

Search the conversation for build/test command outputs. For TypeScript changes: was `npm test`, `npm run typecheck:plugin`, or `npm run build:plugin` actually executed? For prompt-only changes (.md files): were structural checks done (file exists, under 500 lines, frontmatter valid)? Collect the actual outputs. "I think it works" is not evidence.

### Degradation Detection

Look for signs of context window exhaustion: placeholder code (`// TODO: implement`), sparse implementations, `...` or `/* rest unchanged */` comments, repeated similar errors, retrying the same approach. If detected, flag as **soft warning (S8)** and recommend context reset.

### Confidence Calibration

For each finding, rate confidence based on what was actually verified (read the file, ran the command) vs assumed (inferred from patterns, didn't check). Low-confidence findings are explicitly flagged to the user.

---

## Brief Generation

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
**User pushback:** [yes/no — if yes, summary of what was challenged and how resolved]
**Build/test evidence:** [command outputs collected, or "not run"]
**Uncommitted changes:** [yes/no]

### Collector Findings

[Anti-grep violations, sycophancy signals, degradation signals, evidence gaps]

### Phase-Specific Review Request

[What the reviewer should focus on for this phase]

### Learned Patterns

[Relevant rules from .critic/ files for this phase]
```

---

## Launching the Reviewer

After writing the brief, launch the forked reviewer:

```
Task(
  subagent_type: "general-purpose",
  description: "Critic reviewer — fresh-context code review",
  prompt: [contents of resources/reviewer-prompt.md with brief path injected]
)
```

The reviewer runs with fresh context — no conversation history, no confirmation bias. It reads the brief, the code, the plan, and the diff, then produces a structured report.

**If the reviewer fails or times out:** Present the collector's own findings with a note that the reviewer was unavailable.

---

## Combined Output

After the reviewer returns its report, combine both into a single output:

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

If there are hard blocks: **"BLOCKED — resolve the above before proceeding."**
If no hard blocks: **"CLEAR — proceed with noted warnings."**

### Challenge Prompts

Always end the critic output with 3-5 ready-to-use prompts the user can throw back at Claude to force deeper verification. These are questions the user gives TO Claude — they challenge Claude's work, not the user's judgement.

Generate prompts tailored to the current phase, findings, and areas of low confidence. Examples:

> - "Did you actually read [specific file], or are you assuming you know what's in it? Show me the part that confirms [specific claim]."
> - "Walk me through how acceptance criterion N is met — show evidence, not assertions."
> - "The plan says to modify [file]. Show me exactly what changed and why each change is justified."
> - "You said [check] passed. Prove it — what command did you run and what was the output?"
> - "What would break if I reverted [specific file]? If nothing, why did you change it?"

Don't generate generic prompts. Reference actual files, acceptance criteria, and specific areas where the critic had medium or low confidence.

**Critical rule: The critic NEVER auto-fixes.** All findings go to the human for decision.

---

## `.critic/` Integration

After inferring the phase, read the `.critic/` file matching the current status and include relevant rules in the brief for the reviewer:

| Phase | .critic/ file |
|-------|-------------|
| 1 (creating task) | `planning.md` |
| 2-4 (planning) | `planning.md` |
| 5-6 (implementing) | `implementation.md` |
| 7 (review) | `review.md` |
| 8 (completion) | `completion.md` |

---

## Thought Depth Escalation

Not all checks need the same level of analysis:

- **Quick** — surface-level structural checks. File exists? Frontmatter valid? Line count under limit? Branch name correct?
- **Standard** — routine checks requiring modest reasoning. Diff audit file list comparison, plan coverage check.
- **Deep** (`think hard`) — potential hard blocks, multi-file cross-referencing. Standards contradiction analysis, acceptance criteria verification.
- **Ultra** (`think harder`) — architectural decisions, plan-vs-implementation semantic comparison. Reserved for Phase 4 (full plan review), Phase 7 (pre-review audit), and low-confidence high-stakes findings.

The escalation matrix in [escalation.md](resources/escalation.md) annotates each check with its default depth. Escalate when a lower-depth check surfaces something suspicious.

---

## Resource Files

- [reviewer-prompt.md](resources/reviewer-prompt.md) — Prompt for the forked reviewer subagent
- [phases.md](resources/phases.md) — Detailed checks for all 8 lifecycle phases
- [escalation.md](resources/escalation.md) — Hard block vs soft warning classification criteria
- [feedback-loop.md](resources/feedback-loop.md) — Rules for maintaining the .critic/ learning directory
