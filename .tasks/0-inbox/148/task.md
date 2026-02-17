---
id: 148
title: "Implicit /sdd invocation: make Jarvis behavior ambient without explicit command"
status: inbox
priority: high
created: 2026-02-16
---

# Implicit /sdd invocation: make Jarvis behavior ambient without explicit command

## Context

Follow-up to #144 (three-command structure). The `/sdd` Jarvis command requires explicit invocation (`/sdd` or `/sdd some prompt`). This task explores making the Jarvis behavior trigger implicitly — so a user can just type naturally (e.g., "I want to add a feature") and have it captured/deferred to the `/sdd` command behavior.

**Prerequisite:** #144 must be implemented first. The `/sdd` command's strict approval protocol (understand → explain → ask → execute) makes implicit invocation safe — even if triggered automatically, it always confirms before acting.

## Problem

Users may not know to type `/sdd` — especially novices who just installed the plugin. If the Jarvis behavior only activates on explicit invocation, users who don't know about the command get vanilla Claude behavior instead of SDD-aware guidance.

## Options Explored

### Option 1: Plugin CLAUDE.md (simplest, least reliable)

The plugin's `CLAUDE.md` already shapes Claude's default behavior. Add the Jarvis instructions there — "when the user makes a development request, read context, suggest next steps, delegate to `/sdd-run`." This makes every interaction implicitly `/sdd`-like.

- **Pro:** No new infrastructure, just text instructions
- **Con:** Guidance, not enforcement — Claude might not always follow it
- **Con:** Competes with other instructions in the context window

### Option 2: Hook (`UserPromptSubmit`)

A hook fires on every user message and can inject text into the context. A hook could inject project context (current branch, workflow state, active changes) as structured data into every message, priming Claude to behave like the Jarvis.

- **Pro:** Fires reliably on every message
- **Con:** Hooks can only run shell commands and output text — they can't redirect to commands or invoke skills
- **Con:** Adds latency to every user message
- **Use:** Best as a context injector, not a command redirector

### Option 3: Combination (most reliable)

Combine multiple layers for reliability:
- Plugin CLAUDE.md establishes the default Jarvis behavior
- A `UserPromptSubmit` hook injects project context (branch, workflow phase, active changes) as structured data into every message
- `/sdd` exists as an explicit command for when the user wants to be deliberate
- The implicit and explicit paths produce the same behavior

### Option 4: Project CLAUDE.md injection via `sdd-init`

During `/sdd-run init`, write a section into the project's `.claude/CLAUDE.md` that establishes the Jarvis behavior. This is more durable than the plugin CLAUDE.md since it's checked into the repo and specific to the project.

- **Pro:** Persists across sessions and plugin updates
- **Pro:** Project-specific — can reference project details
- **Con:** Requires `sdd-init` to have been run
- **Con:** User might modify/remove it

## Reliability Hierarchy

From most to least reliable:
1. Explicit command (`/sdd`) — user intent is unambiguous
2. Hook-injected context — fires on every message, injects structured data
3. CLAUDE.md instructions — guidance that Claude follows most of the time

## Open Questions

1. **Which approach?** Option 3 (combination) seems most robust. Is the added complexity worth it?
2. **Hook latency:** How much latency does a `UserPromptSubmit` hook add? If it reads workflow state from disk, is that fast enough?
3. **Opt-in vs opt-out:** Should implicit invocation be on by default, or should users enable it? (e.g., a setting in `sdd-settings.yaml`)
4. **Conflict with non-SDD work:** If a user is doing non-SDD work in an SDD project (e.g., editing a README), the Jarvis behavior might be annoying. How to handle this?
5. **Plugin CLAUDE.md vs project CLAUDE.md:** Which is the right place for the Jarvis instructions? Plugin CLAUDE.md applies to all SDD projects; project CLAUDE.md is specific.
