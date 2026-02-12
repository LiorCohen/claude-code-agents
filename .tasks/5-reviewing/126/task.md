---
id: 126
title: Implement hook system — skill auto-activation and objective Stop checks
status: reviewing
priority: high
created: 2026-02-12 18:00 UTC
depends_on: []
blocks: []
---

# Task 126: Implement hook system — skill auto-activation and objective Stop checks

## Description

Two hook improvements inspired by the Claude Code infrastructure showcase:

### 1. Skill auto-activation (UserPromptSubmit)

Add a `UserPromptSubmit` hook that reads a YAML config (`skill-rules.yaml`) and injects skill activation reminders into prompts based on keyword/regex/file-pattern triggers. This ensures development skills like `typescript-standards`, `plugin-testing-standards`, and `system-cli-standards` are automatically suggested when relevant, instead of relying on manual invocation.

### 2. Objective Stop hook (Stop)

Replace the current prompt-based Stop hook with a command-based hook that runs actual checks and reports objective findings. The current hook asks Claude to self-assess ("are there uncommitted changes?", "did you run tests?") but can't actually verify anything. The replacement should:

- Run `git status` to detect uncommitted changes
- Detect if on a feature branch (task context) — skip task-specific checks otherwise
- Run `npm run typecheck:plugin` to catch type errors in plugin code
- Report findings as structured output so Claude sees facts, not questions

## Acceptance Criteria

### Skill auto-activation
- [ ] `.claude/skill-rules.yaml` exists with trigger definitions for all current skills
- [ ] `UserPromptSubmit` hook reads the YAML config and matches prompts against triggers
- [ ] Matched skills are injected as reminders before Claude sees the prompt
- [ ] Hook supports keyword triggers, intent pattern (regex) triggers, and file path triggers

### Stop hook
- [ ] Stop hook is a command-type hook (shell script), not a prompt-type hook
- [ ] Runs `git status` and reports uncommitted changes
- [ ] Detects feature branch context and skips task checks when not on one
- [ ] Runs `npm run typecheck:plugin` and reports any type errors
- [ ] Reports findings as structured output for Claude to act on

### General
- [ ] All hooks registered in `.claude/settings.json`
- [ ] Hook scripts are in `.claude/hooks/`
