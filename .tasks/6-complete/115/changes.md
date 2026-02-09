# Task #115 — Change Report

**Branch:** `feature/task-115-system-cli-standards`
**Commits:** 1
**Files changed:** 9 (+241 / -4 lines)

---

## 1. [`.claude/skills/system-cli-standards/skill.md`](.claude/skills/system-cli-standards/skill.md)

New standards skill defining the canonical way to invoke the system CLI from prompt files. Covers invocation pattern, output contracts, authority boundaries, stdin convention, and audit procedure.

```markdown
---
name: system-cli-standards
description: Standards for how plugin prompt files (skills, agents, commands) invoke and reference the SDD system CLI.
---

# System CLI Standards

Standards for all plugin prompt files (skills, agents, commands) that invoke or reference the SDD system CLI. Does NOT cover hooks (separate lifecycle via `hook-runner.sh`).

---

## Canonical Invocation

The one correct way to call the CLI from a prompt file:

\`\`\`bash
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" <namespace> <action> [args] [options]
\`\`\`

- `CLAUDE_PLUGIN_ROOT` is set by Claude Code when the plugin loads. It is available in all bash commands executed during a plugin session.
- Always quote the path: `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh"` — paths may contain spaces.
- `system-run.sh` is the single entry point. It forwards to the compiled CLI via `exec`.

### What NOT to do

| Pattern | Why it's wrong |
|---------|---------------|
| `sdd-system <namespace> <action>` | No such binary exists — the package has no `bin` field and is `private: true` |
| `npx sdd-system ...` | Same reason — `npx` cannot resolve a private package with no bin |
| `node ... dist/cli.js ...` | Implementation detail — use `system-run.sh` which wraps this |
| `` `sdd-system` is available in PATH `` | False — it is never in PATH |

---

## Invocation Contexts

### 1. Plugin prompts (skills, agents, commands)

Use `system-run.sh` as shown above. This is the only context this standard covers.

### 2. Hooks

Hooks use `hook-runner.sh` via `hooks.json`. Different lifecycle, different stdin/stdout JSON contract. Out of scope for this standard.

### 3. User-project npm scripts (scaffolded templates)

Templates that scaffold `package.json` files into user projects cannot use `${CLAUDE_PLUGIN_ROOT}` — that variable only exists during a plugin session. Scaffolded npm scripts that reference `sdd-system` as a bare command are broken. Until the system package exposes a `bin` field or another resolution mechanism, **do not emit CLI invocations in scaffolded templates**. Instead, provide instructions that the user runs via the plugin commands (e.g., `/sdd-run`).

---

## Output Contract

All CLI commands return a `CommandResult`:

\`\`\`typescript
interface CommandResult {
  readonly success: boolean;
  readonly data?: unknown;
  readonly error?: string;
  readonly message?: string;
}
\`\`\`

### Behavior by mode

| Mode | Flag | Behavior |
|------|------|----------|
| JSON (structured) | `--json` | Prints `JSON.stringify(result, null, 2)` to stdout |
| Plain (human) | _(default)_ | Prints `result.message` to stdout, or `Error: ${result.error}` to stderr on failure |

### Exit codes

| Code | Meaning |
|------|---------|
| `0` | `result.success === true` |
| `1` | `result.success === false` |

### How prompts should consume CLI output

- **For structured data**: Use `--json` and parse the JSON output. Check `.success` before reading `.data`.
- **For display to user**: Omit `--json`. The CLI prints human-readable text.
- **Error handling**: Check the exit code. On non-zero exit, the stderr contains the error message.

### Global options

All commands accept:

| Option | Description |
|--------|-------------|
| `--json` | Output structured JSON instead of plain text |
| `--verbose` | Enable verbose logging |
| `--help` | Show help for the command |

---

## Stdin Convention

CLI commands that accept file content (e.g., `--config <path>`) should also accept `-` to read from stdin. This eliminates temporary file creation in prompts.

`system-run.sh` passes stdin through transparently via `exec`.

**Preferred** — pipe content via stdin:
\`\`\`bash
echo "${content}" | "${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" namespace action --config -
\`\`\`

**Avoid** — creating temp files:
\`\`\`bash
# Don't do this — creates files that need cleanup
echo "${content}" > /tmp/temp-config.yaml
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" namespace action --config /tmp/temp-config.yaml
rm /tmp/temp-config.yaml
\`\`\`

---

## Authority Boundaries

### CLI owns (deterministic operations)

- File generation and scaffolding
- YAML/JSON parsing and validation
- Path resolution and filesystem checks
- Schema validation
- Environment management
- Configuration reads and writes
- Version information

### Prompts own (judgment and interaction)

- Orchestration and workflow sequencing
- User interaction (commands only)
- Decision-making and context-dependent logic
- LLM-based analysis and generation
- Interpreting user intent

### Rule

If an operation is deterministic and repeatable, it belongs in the CLI. If it requires judgment or context, it belongs in the prompt.

### Layer separation

- **Allowed**: prompts → CLI (prompts invoke CLI commands)
- **Forbidden**: CLI → prompts (CLI must never reference skills, agents, or commands)

This is a strict one-way dependency. The CLI is a standalone tool that knows nothing about the prompt layer.

---

## When to Use CLI vs Prompt Logic

| Operation | Owner | Why |
|-----------|-------|-----|
| File reading/writing with fixed logic | CLI | Deterministic, no judgment needed |
| YAML/JSON parsing with validation | CLI | Schema-based, repeatable |
| Path resolution and filesystem checks | CLI | Pure computation |
| Scaffolding files from templates | CLI | Template expansion is mechanical |
| Configuration management | CLI | Read/write/validate against schema |
| Anything requiring LLM judgment | Prompt | Non-deterministic |
| Anything requiring user interaction | Prompt (command layer) | Commands are the UI layer |
| Workflow orchestration | Prompt | Sequencing decisions |
| Interpreting ambiguous requirements | Prompt | Needs context and judgment |

---

## Checklist for New CLI Commands

Before adding a new CLI command, verify:

- [ ] The operation is deterministic and repeatable
- [ ] It does not require LLM judgment or user interaction
- [ ] It fits within an existing namespace, or a new namespace is justified
- [ ] It returns a `CommandResult` with appropriate `success`, `data`, `error`, and `message` fields
- [ ] It supports `--json` for structured output
- [ ] It accepts `-` for stdin where file content is an input
- [ ] It has proper exit codes (0 success, 1 failure)
- [ ] It does not reference or depend on any prompt files (skills, agents, commands)
- [ ] It is documented in the relevant command `.md` file that will invoke it

---

## Audit Procedure

### Violation categories

| Category | Description | Example |
|----------|-------------|---------|
| **Wrong invocation** | Bare `sdd-system`, `npx sdd-system`, or direct `node ... cli.js` in plugin prompts | `sdd-system config get` in a command file |
| **Wrong reference** | Claiming CLI is "in PATH" or "available as `sdd-system`" | Prerequisites section saying "`sdd-system` CLI available in PATH" |
| **Missing CLI usage** | Operations done in prompt text that should be CLI commands | Prompt manually parsing YAML instead of using a CLI validator |
| **Unclear authority** | Logic duplicated between prompt and CLI with no clear owner | Both a skill and CLI command validating the same schema |
| **Broken template** | Scaffolded files that emit non-functional CLI references | `package.json` template with `"scripts": { "setup": "sdd-system ..." }` |

### How to audit

1. Search all files in `plugin/skills/`, `plugin/agents/`, `plugin/commands/` for:
   - `sdd-system` (bare command references)
   - `npx sdd-system` (npx invocations)
   - `node.*cli.js` (direct CLI invocations)
   - `available in PATH` or `in PATH` (wrong reference claims)
2. For each match, classify by violation category
3. Check `plugin/skills/*/templates/` for scaffolded files that emit CLI references
4. Write report to `.temp/system-cli-audit-<datetime>.md`
```

---

## 2. [`plugin/system/system-run.sh`](plugin/system/system-run.sh)

New executable wrapper script — single entry point for all prompt-to-CLI invocations.

```bash
#!/bin/bash
# system-run.sh - Single entry point for all prompt-to-CLI invocations
# Used by skills, agents, and commands. Hooks use hook-runner.sh instead.
exec node --enable-source-maps "${CLAUDE_PLUGIN_ROOT}/system/dist/cli.js" "$@"
```

---

## 3. [`.claude/skills/skills-standards/SKILL.md`](.claude/skills/skills-standards/SKILL.md)

Added cross-reference to `system-cli-standards` in the Layer Separation section.

```diff
 A skill may document calling the CLI (e.g., "run `sdd-system spec validate`"). A skill must never document being invoked by the CLI (e.g., "runs via `sdd-system scaffolding project`"). If the CLI has a subcommand that implements what a skill describes, the skill should be refactored so that the command or skill orchestrates CLI primitives — not the other way around.

+**For the canonical CLI invocation pattern, output contracts, and authority boundaries, see the `system-cli-standards` skill.**
+
 ---
```

---

## 4. [`.claude/skills/agents-standards/SKILL.md`](.claude/skills/agents-standards/SKILL.md)

Added new CLI Delegation section between Self-Containment and No User Interaction.

```diff
 ---

+## CLI Delegation
+
+Agents should not invoke the system CLI directly. Instead, agents delegate to commands or skills that handle CLI invocation. This keeps CLI coupling out of agents and in the orchestration layers. **For the canonical CLI invocation pattern, see the `system-cli-standards` skill.**
+
+---
+
 ## No User Interaction
```

---

## 5. [`.claude/skills/commands-standards/SKILL.md`](.claude/skills/commands-standards/SKILL.md)

Added cross-reference to `system-cli-standards` in the CLI Integration section.

```diff
-Commands may call the `sdd-system` CLI for deterministic, system-layer operations (file creation, validation, version bumping). This is a different delegation path than INVOKE — CLI calls are shell executions, not prompt-layer context loading.
+Commands may call the `sdd-system` CLI for deterministic, system-layer operations (file creation, validation, version bumping). This is a different delegation path than INVOKE — CLI calls are shell executions, not prompt-layer context loading. **For the canonical invocation pattern, output contracts, and authority boundaries, see the `system-cli-standards` skill.**
```

---

## 6. [`CLAUDE.md`](CLAUDE.md)

Added `system-cli-standards` to Skills list and Repository Structure.

```diff
 - **commands-standards** - Follow when creating or reviewing commands
+- **system-cli-standards** - Follow when invoking or referencing the system CLI from prompt files
```

```diff
-│       └── commands-standards/     # Standards for authoring commands
+│       ├── commands-standards/     # Standards for authoring commands
+│       └── system-cli-standards/  # Standards for CLI invocation from prompts
```

---

## 7. [`plugin/.claude-plugin/plugin.json`](plugin/.claude-plugin/plugin.json)

Version bump 6.6.1 → 6.6.2.

```diff
-  "version": "6.6.1",
+  "version": "6.6.2",
```

---

## 8. [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json)

Version bump 6.6.1 → 6.6.2.

```diff
-      "version": "6.6.1"
+      "version": "6.6.2"
```

---

## 9. [`changelog/v6.md`](changelog/v6.md)

Added 6.6.2 changelog entry.

```diff
+## [6.6.2] - 2026-02-09
+
+### Added
+
+- **system-cli-standards**: New standards skill defining the canonical way to invoke the system CLI from prompt files
+  - Documents invocation pattern via `system-run.sh`, output contracts (`CommandResult`), authority boundaries, and stdin convention
+  - Includes audit procedure and violation categories
+- **system-run.sh**: New wrapper script as single entry point for all prompt-to-CLI invocations
+  - Lives at `plugin/system/system-run.sh`, invoked via `${CLAUDE_PLUGIN_ROOT}/system/system-run.sh`
+  - Replaces direct `node ... cli.js` invocations in prompt files
+
+### Changed
+
+- **skills-standards**: Added cross-reference to `system-cli-standards` in Layer Separation section
+- **agents-standards**: Added CLI Delegation section referencing `system-cli-standards`
+- **commands-standards**: Added cross-reference to `system-cli-standards` in CLI Integration section
+- **CLAUDE.md**: Added `system-cli-standards` to Skills list and Repository Structure
```
