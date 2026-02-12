---
id: 126
title: Implement skill auto-activation hook system with YAML-based skill-rules config
status: inbox
created: 2026-02-12 18:00 UTC
depends_on: []
blocks: []
---

# Task 126: Implement skill auto-activation hook system with YAML-based skill-rules config

## Description

Add a `UserPromptSubmit` hook that reads a YAML config (`skill-rules.yaml`) and injects skill activation reminders into prompts based on keyword/regex/file-pattern triggers. This ensures development skills like `typescript-standards`, `plugin-testing-standards`, and `system-cli-standards` are automatically suggested when relevant, instead of relying on manual invocation.

Inspired by the "skill auto-activation" pattern from the Claude Code infrastructure showcase.

## Acceptance Criteria

- [ ] `.claude/skill-rules.yaml` exists with trigger definitions for all current skills
- [ ] `UserPromptSubmit` hook reads the YAML config and matches prompts against triggers
- [ ] Matched skills are injected as reminders before Claude sees the prompt
- [ ] Hook supports keyword triggers, intent pattern (regex) triggers, and file path triggers
- [ ] Hook is registered in `.claude/settings.json`
- [ ] Existing Stop hook is preserved
