---
id: 124
title: Add critic skill for self-checking at every task lifecycle phase
status: inbox
created: 2026-02-10
priority: high
depends_on: []
blocks: []
---

# Task 124: Add critic skill for self-checking at every task lifecycle phase

## Description

Create a critic skill (`.claude/skills/critic/`) that embeds Lior's voice and critical thinking prompts at every phase of the task lifecycle. The goal is to make Claude check itself, be thorough, and think hard before proceeding — simulating the kinds of questions and pushback Lior gives during reviews.

The critic should activate at each lifecycle transition and force Claude to pause and self-evaluate before presenting work to the user.

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

- The skill should be referenced by the tasks skill at each lifecycle transition
- It should output its checks as a self-evaluation before presenting to the user
- The tone should be direct, skeptical, and constructive — Lior's actual review style
- It should catch the most common Claude failure modes: over-engineering, making assumptions without reading code, drifting from plans, adding unnecessary abstractions, being too agreeable
- **Anti-grep rule:** Claude over-relies on grep to skim for keywords instead of reading full files. The critic must enforce: "Did you actually READ the files, or did you just grep for a keyword and assume you understand the context? Read the full file. Grep is for finding files, not for understanding them."
- **Learning feedback loop:** The critic should maintain a `feedback-log.md` file inside `.crit/` at the repo root. This file accumulates Lior's actual feedback over time. When Lior pushes back on a plan, rejects an approach, or corrects Claude's thinking, the critic should capture that pattern and add it to its knowledge base. Over time, the critic gets sharper because it learns from real interactions — not just the initial static prompts. The skill prompt should read `.crit/feedback-log.md` at each phase and apply any relevant learned patterns.
- **Feedback log hygiene:** The feedback log must be kept consistent — no contradictions, no duplications. When adding a new entry, check if it overlaps with or contradicts an existing entry. If it overlaps, merge them into one stronger rule. If it contradicts, replace the old one. Keep the log concise — distill patterns into sharp rules, don't just append raw transcripts. Never lose functionality during summarization. If unsure whether a new entry subsumes or conflicts with an existing one, ask Lior before modifying.

## Acceptance Criteria

- [ ] Critic skill created at `.claude/skills/critic/`
- [ ] Covers all 9 lifecycle phases listed above
- [ ] Each phase has specific, actionable self-check questions
- [ ] Tone matches Lior's direct, skeptical review style
- [ ] Tasks skill references the critic at each transition point
- [ ] Critic catches common Claude failure modes (over-engineering, assumptions, drift, gold-plating)
- [ ] Anti-grep rule included: grep is for finding files, not understanding them — read full files
- [ ] `.crit/` directory created at repo root for critic state
- [ ] `.crit/feedback-log.md` file created for accumulating Lior's real feedback patterns
- [ ] Skill prompt reads `.crit/feedback-log.md` at each lifecycle phase and applies learned patterns
- [ ] Instructions for when/how to append new feedback entries to the log
- [ ] Feedback log hygiene rules: no contradictions, no duplications, merge overlaps, ask Lior if unsure
