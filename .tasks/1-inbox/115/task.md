---
id: 115
title: Create system-cli-standards skill and audit CLI invocation violations
priority: high
status: open
created: 2026-02-09
depends_on: []
blocks: []
---

# Task 115: Create system-cli-standards skill and audit CLI invocation violations

## Description

Create a `system-cli-standards` skill in `.claude/skills/` that defines the canonical way for skills, agents, commands, and hooks to invoke the SDD system CLI. Then audit the entire codebase for violations.

Goals:
1. Define the one correct way to call the system CLI from prompt files
2. Identify wrong invocation patterns (wrong binary names, wrong paths, inconsistent arguments)
3. Identify wrong ways to refer to the CLI in documentation/prompts
4. Find operations done in prompt text that should be converted to CLI commands (improving speed by using code instead of LLM interpretation)

## Acceptance Criteria

- [ ] `system-cli-standards` skill created in `.claude/skills/`
- [ ] Skill documents canonical CLI invocation patterns
- [ ] Skill covers: binary name, argument format, output handling, error handling
- [ ] Audit report generated identifying all violations across skills, agents, commands, and hooks
- [ ] Report categorizes violations by type (wrong invocation, wrong reference, missing CLI usage)
