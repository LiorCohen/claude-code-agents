---
id: 115
title: Create system-cli-standards skill and audit CLI invocation violations
priority: high
status: reviewing
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
5. Find duplication between prompt files and system CLI where there's no clear authority owner. It should be simple to answer: "where's the authoritative answer?" If it's unclear, something that should be owned by system-cli is instead embedded in a prompt.
6. Introduce `plugin/system/system-run.sh` as the single internal entry point for all prompt-to-CLI invocations — mechanical enforcement, not just documentation.
7. Define output contracts (possibly via JSON Schema) so prompts have a standard way to consume CLI responses.
8. Cross-reference existing standards skills (skills-standards, agents-standards, commands-standards) to point to system-cli-standards for CLI invocation rules.

## Design Decisions

- **Scope**: Skill covers both "how to invoke" and "when to use CLI vs prompt logic"
- **Audit depth**: Plugin files only (skills, agents, commands, hooks)
- **Two entry points, separate lifecycles** (both plugin-level, referenced via `${CLAUDE_PLUGIN_ROOT}`):
  - `plugin/system/system-run.sh` — for prompts (skills, agents, commands)
  - `plugin/hooks/hook-runner.sh` — for hooks (different caller, stdin/stdout JSON contract)
- **Output contracts**: CLI responses should follow a defined schema so prompts don't resort to ad-hoc parsing

## Acceptance Criteria

- [ ] `system-cli-standards` skill created in `.claude/skills/`
- [ ] Skill documents canonical CLI invocation patterns
- [ ] Skill covers: binary name, argument format, output handling, error handling
- [ ] Skill defines output contract standards (JSON Schema or equivalent)
- [ ] `plugin/system/system-run.sh` wrapper script created as single prompt-to-CLI entry point
- [ ] Existing standards skills updated to reference system-cli-standards
- [ ] Audit report generated identifying all violations across plugin skills, agents, commands, and hooks
- [ ] Report categorizes violations by type (wrong invocation, wrong reference, missing CLI usage, unclear authority)
