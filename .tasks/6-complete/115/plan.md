---
title: System CLI standards skill and audit
created: 2026-02-09
---

# Plan: System CLI Standards Skill and Audit

## Problem Summary

The plugin has no canonical standard for how prompt files (skills, agents, commands) invoke the system CLI. Today there are two different invocation patterns, 8 skills that claim `sdd-system` is "available in PATH" (which isn't how it actually works), and no guidance on output contracts, authority boundaries, or when to use CLI vs prompt logic. This creates drift, inconsistency, and missed opportunities to convert slow prompt-based operations to fast CLI commands.

## Files to Modify

| File | Changes |
|------|---------|
| `.claude/skills/system-cli-standards/skill.md` | **New** — the standards skill |
| `plugin/system/system-run.sh` | **New** — prompt-to-CLI wrapper script |
| `.claude/skills/skills-standards/skill.md` | Add cross-reference to system-cli-standards |
| `.claude/skills/agents-standards/skill.md` | Add cross-reference to system-cli-standards |
| `.claude/skills/commands-standards/skill.md` | Add cross-reference to system-cli-standards |
| `.temp/system-cli-audit-*.md` | **New** — audit report |

## Changes

### 1. Create system-cli-standards skill

Create `.claude/skills/system-cli-standards/skill.md` covering:

**Scope**: All plugin prompt files (skills, agents, commands) that invoke or reference the system CLI. Does NOT cover hooks (separate lifecycle via hook-runner.sh).

**Canonical invocation pattern**: The one correct way to call the CLI from prompts is via `system-run.sh`:

```bash
${CLAUDE_PLUGIN_ROOT}/system/system-run.sh <namespace> <action> [args] [options]
```

Prompts must never invoke `node ... dist/cli.js` directly — that's an implementation detail hidden behind `system-run.sh`. Bare `sdd-system` is not a valid command anywhere — the system package has no `bin` field and is `private: true`. All existing references to `sdd-system` as a bare command are incorrect.

**Three invocation contexts** (the standard must distinguish these):
1. **Plugin prompts** (skills, agents, commands): Use `${CLAUDE_PLUGIN_ROOT}/system/system-run.sh`. `CLAUDE_PLUGIN_ROOT` is set by Claude Code when the plugin loads and is available in bash commands executed during a plugin session.
2. **Hooks**: Use `hook-runner.sh` via `hooks.json`. Separate lifecycle, out of scope for this standard.
3. **User-project npm scripts** (scaffolded templates): Currently broken — templates emit `sdd-system` which doesn't exist in PATH. The standard must define how scaffolded templates should invoke the CLI (e.g., via a relative path to `system-run.sh`, or the system package needs a `bin` field).

**Stdin convention**: CLI commands that accept file paths (e.g., `--config <path>`) should also accept `-` to read from stdin. This eliminates temp file creation in prompts. `system-run.sh` passes stdin through transparently via `exec`.

**Output contracts**: Define how CLI responses are structured:
- Standard `CommandResult` shape: `{ success, data?, error?, message? }`
- When to use `--json` flag (structured consumption) vs plain text (user display)
- Exit codes: 0 success, 1 failure
- How prompts should handle errors from CLI calls

**Authority boundaries**: Clarify what belongs in CLI vs prompts:
- CLI owns: deterministic operations (validation, file generation, scaffolding, environment management)
- Prompts own: orchestration, user interaction, decision-making, context-dependent logic
- Rule: if an operation is deterministic and repeatable, it should be a CLI command, not prompt text

**Layer separation**: Reiterate the existing rule from skills-standards:
- One-way dependency: prompts → CLI (allowed), CLI → prompts (forbidden)
- CLI must never be aware of skills, agents, or commands

**When to use CLI vs prompt logic**: Decision framework:
- File reading/writing with fixed logic → CLI
- YAML/JSON parsing with validation → CLI
- Path resolution and filesystem checks → CLI
- Anything requiring LLM judgment → prompt
- Anything requiring user interaction → prompt (command layer)

**Checklist for new CLI commands**: What to verify before adding a CLI command.

**Audit procedure**: How to audit the codebase for violations. Categories:
- Wrong invocation (bare `sdd-system` in plugin prompts, wrong path, `npx sdd-system`)
- Wrong reference (claiming CLI is "in PATH", incorrect prerequisites)
- Missing CLI usage (operations in prompt text that should be CLI commands)
- Unclear authority (logic duplicated between prompt and CLI)
- Broken template (scaffolded files that produce non-functional CLI references in user projects)

### 2. Create `system-run` wrapper script (plugin-level)

The wrapper script lives in the plugin's system directory, alongside the CLI it dispatches to:

```bash
#!/bin/bash
# system-run.sh - Single entry point for all prompt-to-CLI invocations
exec node --enable-source-maps "${CLAUDE_PLUGIN_ROOT}/system/dist/cli.js" "$@"
```

**Location**: `plugin/system/system-run.sh` — lives alongside the CLI source it dispatches to (`plugin/system/dist/cli.js`).

**Invocation from prompts**: `${CLAUDE_PLUGIN_ROOT}/system/system-run.sh <namespace> <action> [args] [options]`

The system directory owns the CLI binary, so it owns the entry point to it. Prompts reference it via `${CLAUDE_PLUGIN_ROOT}`.

### 3. Cross-reference existing standards skills

Add a brief section to each of these skills pointing to system-cli-standards:

- **skills-standards**: In the Layer Separation section, add reference to system-cli-standards for invocation details
- **agents-standards**: Add note that agents should delegate CLI calls to commands/skills rather than invoking directly
- **commands-standards**: In the CLI Integration section, add reference to system-cli-standards for the canonical invocation pattern

### 4. Run audit, produce report, and create fix task

Audit all plugin files against the new standard. Write report to `.temp/system-cli-audit-<datetime>.md`.

After the audit, ask the user if they want a follow-up fix task created (e.g., "Fix system CLI standards violations from audit report") — same pattern as #89 (audit) → #90 (fixes).

**Findings from research** (to be included in audit report):

| File | Issue | Category |
|------|-------|----------|
| 8 skills (spec-writing, spec-index, helm-standards, helm-scaffolding, database-standards, database-scaffolding, contract-scaffolding, config-scaffolding) | State "`sdd-system` CLI available in PATH" — bare `sdd-system` doesn't exist (no bin field, private package) | Wrong reference |
| `sdd-run.md` line 229 | Uses direct `node ... cli.js` invocation — should transition to `system-run.sh` | Migration candidate |
| `sdd-init.md` lines 191, 252 | Uses bare `sdd-system` in prose describing what to run — should use `system-run.sh` | Wrong invocation |
| `sdd-config.md` lines 245-261 | Uses bare `sdd-system` for invocation examples — should use `system-run.sh` | Wrong invocation |
| `domain-population/SKILL.md` lines 30-48 | Creates temp file with bash heredoc in `/tmp/`, calls CLI, cleans up. Two issues: (a) uses `/tmp/` instead of `.temp/` per CLAUDE.md, (b) should use stdin convention instead of temp files | Missing CLI usage |
| `database-scaffolding/templates/package.json` | npm scripts use bare `sdd-system database setup ...` — these are scaffolded into user projects where `sdd-system` is not in PATH (no bin field). **Templates produce broken npm scripts.** | Broken template |
| `contract-scaffolding/templates/package.json` | npm scripts use bare `sdd-system contract ...` — same issue as database templates. **Templates produce broken npm scripts.** | Broken template |
| `spec-index/SKILL.md` lines 162-167 | CI examples use `npx sdd-system` — would fail since package has no bin field | Wrong invocation |
| `system/README.md` | Uses bare `sdd-system` throughout all examples — none of these work | Wrong reference |
| All agents | No CLI references — correct, agents delegate to commands/skills | OK |

## Dependencies

1. Standards skill must be written first (defines what's correct)
2. Audit runs against the standard (references the skill for categories)
3. Cross-references added after skill exists (so the links are valid)

## Tests

### Manual Verification
- [ ] `grep -r "sdd-system" plugin/` matches only canonical patterns or is documented as a violation
- [ ] `system-cli-standards` skill follows the same structure as other standards skills
- [ ] All three existing standards skills reference system-cli-standards
- [ ] Audit report covers every .md file in plugin/skills, plugin/agents, plugin/commands
- [ ] Audit report categorizes each finding by violation type

## Verification

- [ ] A prompt author can read the standards skill and know exactly how to invoke the CLI — no ambiguity
- [ ] The audit report identifies every non-compliant CLI reference in plugin/
- [ ] Existing standards skills link to system-cli-standards for CLI-related rules
- [ ] The boundary between "CLI's job" and "prompt's job" is clearly documented with decision criteria
