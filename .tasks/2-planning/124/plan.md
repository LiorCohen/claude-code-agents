---
title: Add critic skill for self-checking at every task lifecycle phase
created: 2026-02-12 16:00 UTC
---

# Plan: Add Critic Skill for Self-Checking at Every Task Lifecycle Phase

## Problem Summary

Claude doesn't self-check. It over-engineers, agrees with everything, drifts from plans, claims completion without evidence, and grepping for keywords instead of reading files. Without a structured self-review mechanism, every interaction requires Lior to manually catch these failure modes. The critic skill forces Claude to pause and self-evaluate at each task lifecycle transition using a forked subagent with fresh context — so the review isn't tainted by the same reasoning that produced the work.

## Files to Modify

| File | Changes |
|------|---------|
| `.claude/skills/critic/SKILL.md` | **New.** Main critic skill — phase inference, core checks, escalation rules, `.crit/` integration |
| `.claude/skills/critic/resources/phases.md` | **New.** Detailed per-phase checks for all 9 lifecycle phases |
| `.claude/skills/critic/resources/escalation.md` | **New.** Escalation matrix — hard blocks vs soft warnings with criteria |
| `.claude/skills/critic/resources/feedback-loop.md` | **New.** Rules for maintaining `.crit/` feedback files — hygiene, merging, conflict resolution |
| `.crit/planning.md` | **New.** Initial seed — learned patterns about planning mistakes |
| `.crit/implementation.md` | **New.** Initial seed — learned patterns about coding anti-patterns |
| `.crit/scope.md` | **New.** Initial seed — learned patterns about over/under-engineering |
| `.crit/communication.md` | **New.** Initial seed — learned patterns about presenting work |
| `.claude/skills/tasks/SKILL.md` | **Modify.** Add critic skill invocation at each lifecycle transition point |
| `CLAUDE.md` | **Modify.** Document `.crit/` directory in repository structure |

## Changes

### 1. Critic Skill (``.claude/skills/critic/``)

**SKILL.md** — The main skill file with frontmatter:
- `context: fork` — runs as a forked subagent with fresh context (no inherited reasoning bias)
- `user-invocable: true` — invoked via `/critic`
- `agent: general-purpose` — needs codebase access to read files, check git state, etc.

Core responsibilities:
- **Phase inference** — determine current lifecycle phase from context signals: current branch name (feature/task-N-*), task status in `.tasks/`, git status, recent conversation actions. If ambiguous, ask Lior.
- **Read `.crit/*.md` files** — load learned feedback patterns relevant to the inferred phase
- **Run phase-specific checks** — each phase has concrete, actionable questions (delegated to `resources/phases.md`)
- **Confidence calibration** — rate each check as high/medium/low confidence, flag low-confidence areas explicitly to Lior
- **Escalation classification** — label each finding as hard block or soft warning (delegated to `resources/escalation.md`)
- **Counter-sycophancy protocol** — when Lior pushes back, evaluate whether the original approach was correct and defend it with evidence if so; if Lior suggests something contradicting standards, flag it
- **Anti-grep rule** — check whether files were actually read vs. only grepped for keywords
- **Diff audit** (review/complete phases) — compare files touched vs. files the plan said to touch; flag mismatches
- **"Did you run it?" gate** (review/complete phases) — require evidence of build/test output, not assertions
- **Output format** — structured self-evaluation with findings grouped by severity, confidence-tagged, before presenting to user

**resources/phases.md** — Detailed checks for each of the 9 lifecycle phases, each with a "Lior says" section capturing the tone and critical questions:

1. Creating a task — scope, duplication, precision
2. Starting planning — codebase understanding, assumptions
3. Writing a plan — justification, over/under-engineering, edge cases
4. Presenting plan for review — self-approval test, file path verification, minimality
5. Before approving a plan (user perspective) — devil's advocate questions
6. Starting implementation — plan adherence, complexity check, standards re-read
7. During implementation — drift detection, gold-plating, test breakage
8. Submitting for review — diff audit, test evidence, cleanup verification
9. Completing a task — acceptance criteria verification, loose ends

**resources/escalation.md** — Defines severity levels:

- **Hard blocks** (stop and ask Lior): scope mismatch between plan and diff, low confidence on architectural decisions, contradicting CLAUDE.md or standards, breaking existing tests, plugin boundary violations, destructive commands without verification
- **Soft warnings** (note but continue): minor style deviations, optional improvements noticed, non-critical edge cases, documentation opportunities

Each escalation rule has: trigger condition, severity, action to take, example.

**resources/feedback-loop.md** — Rules for maintaining the `.crit/` learning directory:

- When to add entries (Lior pushes back, rejects approach, corrects thinking)
- How to organize (by topic file, not chronologically)
- Hygiene rules: no contradictions, no duplications, merge overlapping rules, replace outdated rules
- When to create new topic files (new category of feedback that doesn't fit existing files)
- Conflict resolution: if unsure whether new entry subsumes or conflicts with existing one, ask Lior

### 2. `.crit/` Feedback Directory

Create `.crit/` at the repo root with initial seed files. Each file contains a concise set of rules distilled from the research in `research_2026-02-10.md` and `research_2026-02-10_deep.md`. These are NOT raw transcripts — they are sharp, actionable rules.

**`planning.md`** — Planning mistakes and corrections:
- Read all relevant files before planning, not just grep for keywords
- Plans must reference real file paths verified to exist
- Fewer focused changes beat many scattered changes
- Every change in the plan must be justified — no "while we're at it" additions

**`implementation.md`** — Coding patterns and anti-patterns:
- Follow the plan exactly — no drift, no gold-plating
- Use `npm run build:plugin` not `npx tsc` for plugin builds
- Plugin boundary: nothing inside `plugin/` references outside `plugin/`
- Don't add error handling for scenarios that can't happen
- Three similar lines is better than a premature abstraction

**`scope.md`** — Over/under-engineering feedback:
- The right amount of complexity is the minimum needed for the current task
- Don't add configurability, feature flags, or backwards-compatibility shims
- Don't create helpers/utilities for one-time operations
- If you're adding more files than the plan specified, you're probably over-engineering

**`communication.md`** — How to present work:
- Be direct, not verbose — skip preamble
- Don't over-explain or justify every micro-decision
- Flag what you're uncertain about explicitly
- Present options with trade-offs, not recommendations disguised as questions

### 3. Tasks Skill Integration

Add critic invocation references at each lifecycle transition in `.claude/skills/tasks/SKILL.md`. At each transition point, add a note indicating that the critic skill should be invoked. The critic runs as a forked subagent and presents its self-evaluation before the transition output is shown to the user.

Integration points:
- After `/tasks add` completes — critic reviews task scope
- After plan content is written in `/tasks plan` — critic reviews plan quality
- Before `/tasks ready` — critic does final plan review
- After `/tasks implement` creates the branch — critic checks implementation readiness
- Before `/tasks review` — critic does diff audit and evidence gate
- Before `/tasks complete` — critic verifies acceptance criteria

### 4. CLAUDE.md Updates

Add `.crit/` to the repository structure diagram. Add a brief note explaining its purpose (learned critic feedback, not gitignored, topic-organized).

## Dependencies

1. `.crit/` directory must be created before the skill can reference it
2. SKILL.md must be written before resources/ files (it references them)
3. Tasks skill integration comes last (references the completed critic skill)

## Tests

This is a prompt-only skill (no TypeScript code), so traditional unit/integration tests don't apply. Verification is behavioral.

### Structural Validation

- [ ] `critic/SKILL.md` frontmatter has `context: fork`, `user-invocable: true`, `agent: general-purpose`
- [ ] `critic/SKILL.md` is under 500 lines (skills-standards requirement)
- [ ] All resource files exist and are referenced from SKILL.md
- [ ] `.crit/` directory exists with 4 initial topic files
- [ ] Each `.crit/` file contains actionable rules, not raw transcript

### Behavioral Verification

- [ ] `/critic` can be invoked without arguments
- [ ] Phase inference works: on a feature branch with implementing task → detects "during implementation" phase
- [ ] Phase inference works: on main with no active task → asks user for context
- [ ] Hard blocks are clearly distinguished from soft warnings in output
- [ ] Confidence ratings appear on each check
- [ ] Anti-grep rule is present in relevant phases
- [ ] Diff audit logic is present in review/complete phases
- [ ] "Did you run it?" gate is present in review/complete phases
- [ ] Counter-sycophancy protocol is present

### Integration Verification

- [ ] Tasks skill SKILL.md references critic at each transition point
- [ ] CLAUDE.md documents `.crit/` in repository structure
- [ ] `.crit/` is NOT in `.gitignore`

## Verification

- [ ] Critic skill is user-invocable via `/critic` and listed in available skills
- [ ] Running `/critic` on a task in planning status produces planning-phase checks
- [ ] Running `/critic` on a task in implementing status produces implementation-phase checks
- [ ] Hard blocks actually stop and present to user before proceeding
- [ ] `.crit/` files are readable by the forked subagent
- [ ] Tasks skill transitions invoke critic checks
- [ ] All 18 acceptance criteria from the task are met
