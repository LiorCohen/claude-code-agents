---
id: 124
title: Add critic skill for self-checking at every task lifecycle phase
status: planning
created: 2026-02-10 16:17 UTC
priority: high
depends_on: []
blocks: []
---

# Task 124: Add critic skill for self-checking at every task lifecycle phase

## Description

Create a critic skill (`.claude/skills/critic/`) that embeds Lior's voice and critical thinking prompts at every phase of the task lifecycle. The goal is to make Claude check itself, be thorough, and think hard before proceeding — simulating the kinds of questions and pushback Lior gives during reviews.

The critic should activate at each lifecycle transition and force Claude to pause and self-evaluate before presenting work to the user.

The skill must be user-invocable via `/critic`. When called, it should **infer the current phase from context** — what branch are we on, what task status, what was just done, what's about to happen — and apply the appropriate critic checks. It should not require the user to specify a phase. If the context is ambiguous (e.g., no active task, unclear what just happened), ask Lior rather than guessing.

## Lifecycle Phases to Cover

Each phase needs a "Lior says" section with the kind of critical questions and standards Lior holds:

1. **Creating a task** (`/tasks add`) — Is this task well-scoped? Is it actually new or should it consolidate with an existing task? Is the description precise enough to act on?

2. **Starting planning** (`/tasks plan`) — Before writing the plan: Do you actually understand the codebase well enough? Have you read all the relevant files? Are you making assumptions?

3. **Writing a plan** — Is every change justified? Are you over-engineering? Are you under-engineering? Did you miss edge cases? Did you account for existing patterns?

4. **Presenting a plan for review** — Before showing the plan to the user: Would YOU approve this plan? Is it specific enough to implement without ambiguity? Are file paths real? Are the changes minimal and focused?

5. **Before approving a plan** (user perspective) — What would Lior ask? "What about X?" "Did you consider Y?" "Why not just Z?" "This feels over-engineered." "You're missing the hard part."

6. **Starting implementation** (`/tasks implement`) — Are you following the plan exactly? Are you about to introduce unnecessary complexity? Did you re-read the standards?

7. **During implementation** — Are you drifting from the plan? Are you gold-plating? Are your changes minimal? Are you breaking existing tests? Are you following the TypeScript standards?

8. **Submitting for review** (`/tasks review`) — Did you actually test this? Does the diff match what the plan said? Are there leftover debug statements? Did you add unnecessary comments or docstrings?

9. **Completing a task** (`/tasks complete`) — Is this actually done? Did you verify the acceptance criteria? Are there loose ends?

## Design Considerations

- **Must use `context: fork` frontmatter** to run as a subagent with fresh context. Same-context self-review inherits all original reasoning biases — a forked subagent sees the code with fresh eyes, which is what makes self-review actually valuable.
- The skill should be referenced by the tasks skill at each lifecycle transition
- It should output its checks as a self-evaluation before presenting to the user
- The tone should be direct, skeptical, and constructive — Lior's actual review style
- It should catch the most common Claude failure modes: over-engineering, making assumptions without reading code, drifting from plans, adding unnecessary abstractions, being too agreeable
- **Anti-grep rule:** Claude over-relies on grep to skim for keywords instead of reading full files. The critic must enforce: "Did you actually READ the files, or did you just grep for a keyword and assume you understand the context? Read the full file. Grep is for finding files, not for understanding them."
- **Learning feedback loop:** The `.crit/` directory at the repo root stores the critic's learned knowledge, organized by topic into separate files. When Lior pushes back on a plan, rejects an approach, or corrects Claude's thinking, the critic captures that pattern and files it into the appropriate topic file. Over time, the critic gets sharper because it learns from real interactions — not just the initial static prompts. The skill prompt should read the relevant `.crit/*.md` files at each phase and apply learned patterns.
- **`.crit/` directory structure:** Organize feedback by topic, not chronologically. Example files: `planning.md` (planning mistakes and corrections), `implementation.md` (coding patterns and anti-patterns), `scope.md` (over/under-engineering feedback), `communication.md` (how to present work). Each file is a concise set of rules, not a raw transcript. New topics get new files. The skill reads all files at startup but focuses on phase-relevant ones.
- **Feedback log hygiene:** Each `.crit/` file must be kept consistent — no contradictions, no duplications. When adding a new entry, check if it overlaps with or contradicts an existing entry in the same or another file. If it overlaps, merge into one stronger rule. If it contradicts, replace the old one. Keep files concise — distill patterns into sharp rules. Never lose functionality during summarization. If unsure whether a new entry subsumes or conflicts with an existing one, ask Lior before modifying.
- **Counter-sycophancy protocol:** When Lior pushes back, the critic must enforce: "Is Lior right, or are you just agreeing? If your original approach was correct, defend it with evidence." And the reverse: if Lior suggests something that contradicts the standards or the plan, flag it — don't silently comply. The critic should make Claude comfortable disagreeing when it has evidence.
- **Diff audit before commit:** Before submitting for review, the critic must enforce a concrete "review your own diff" step. Compare files touched vs files the plan said to touch. If there's a mismatch, stop. If there are changes you can't justify line-by-line, revert them. No silent scope additions.
- **Confidence calibration:** Force Claude to rate its own confidence (high/medium/low) on each check and flag low-confidence areas to Lior explicitly. "I'm 60% sure this is the right approach because I haven't seen how X interacts with Y" is more useful than silently proceeding. Low confidence = ask, don't guess.
- **"Did you actually run it?" gate:** Before submitting for review, enforce: Did the build pass? Did tests pass? Did you verify with your own eyes, or are you assuming? Not "I think it works" — show the output. No claims of completion without evidence.
- **Escalation rules:** Each check has a severity level. **Hard blocks** (stop and ask Lior): scope mismatch between plan and diff, low confidence on architectural decisions, contradicting standards, breaking existing tests. **Soft warnings** (note but continue): minor style deviations, optional improvements noticed, non-critical edge cases. The skill must clearly label which checks are which.

## Acceptance Criteria

- [ ] Critic skill created at `.claude/skills/critic/` and user-invocable via `/critic`
- [ ] `/critic` infers current lifecycle phase from context (branch, task status, recent actions)
- [ ] Covers all 9 lifecycle phases listed above
- [ ] Each phase has specific, actionable self-check questions
- [ ] Tone matches Lior's direct, skeptical review style
- [ ] Tasks skill references the critic at each transition point
- [ ] Critic catches common Claude failure modes (over-engineering, assumptions, drift, gold-plating)
- [ ] Anti-grep rule included: grep is for finding files, not understanding them — read full files
- [ ] `.crit/` directory created at repo root with topic-organized feedback files
- [ ] Initial topic files created (e.g., `planning.md`, `implementation.md`, `scope.md`, `communication.md`)
- [ ] Skill prompt reads relevant `.crit/*.md` files at each lifecycle phase
- [ ] Instructions for when/how to add entries and when to create new topic files
- [ ] Feedback log hygiene rules: no contradictions, no duplications, merge overlaps, ask Lior if unsure
- [ ] Counter-sycophancy protocol: defend correct work with evidence, flag when user contradicts standards
- [ ] Diff audit step: compare files touched vs plan, revert unjustified changes
- [ ] Confidence calibration: rate confidence per check, flag low-confidence areas explicitly
- [ ] "Did you run it?" gate: require build/test output evidence before claiming completion
- [ ] Escalation rules: each check labeled as hard block or soft warning with clear criteria
