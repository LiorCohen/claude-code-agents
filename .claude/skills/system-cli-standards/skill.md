---
name: system-cli-standards
description: Standards for how plugin prompt files (skills, agents, commands) invoke and reference the SDD system CLI.
---

# System CLI Standards

Standards for all plugin prompt files (skills, agents, commands) that invoke or reference the SDD system CLI. Does NOT cover hooks (separate lifecycle via `hook-runner.sh`).

---

## Canonical Invocation

The one correct way to call the CLI from a prompt file:

```bash
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" <namespace> <action> [args] [options]
```

- `CLAUDE_PLUGIN_ROOT` is set by Claude Code when the plugin loads. It is available in all bash commands executed during a plugin session.
- Always quote the path: `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh"` — paths may contain spaces.
- `system-run.sh` is the single entry point. It forwards to the compiled CLI via `exec`.
- The system package is `private: true` with no `bin` field, so `system-run.sh` is the only valid way to invoke it.

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

```typescript
interface CommandResult {
  readonly success: boolean;
  readonly data?: unknown;
  readonly error?: string;
  readonly message?: string;
}
```

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
```bash
echo "${content}" | "${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" namespace action --config -
```

**Avoid** — creating temp files:
```bash
# Don't do this — creates files that need cleanup
echo "${content}" > /tmp/temp-config.yaml
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" namespace action --config /tmp/temp-config.yaml
rm /tmp/temp-config.yaml
```

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

### Plugin boundary

All plugin prompt files (`plugin/skills/`, `plugin/commands/`, `plugin/agents/`) have no runtime access to anything outside `plugin/`. Never reference `.claude/`, `.tasks/`, or root-level files from within a plugin prompt file.

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

### How to audit

**Use Opus model for audits** — thoroughness matters more than speed here.

1. Read every file in `plugin/skills/`, `plugin/agents/`, and `plugin/commands/`
2. Also read scaffolded templates in `plugin/skills/*/templates/`
3. For each file, check:
   - **Invocation correctness**: All CLI references use the canonical `system-run.sh` invocation
   - **Authority violations**: Prompts performing deterministic operations that belong in the CLI (e.g., YAML/JSON parsing, file generation, schema validation, path resolution). These are candidates for new CLI commands.
   - **Compliance**: All other standards in this document are followed
4. Record every finding with exact file path, line number, and description. Categorize as:
   - **Violation**: Something that is currently broken or wrong
   - **Authority issue**: A deterministic operation in a prompt that should be a CLI command (improves speed and reliability)
5. Write report to `.temp/system-cli-audit-<datetime>.md`
6. Ask the user if they want to turn the audit into a task. If yes, **copy the report file into the task directory** (e.g., `.tasks/1-inbox/116/audit-<datetime>.md`) and reference it from `task.md` — do NOT inline the full report into `task.md`

**Note:** `plugin/system/README.md` is the CLI's own documentation and is out of scope for prompt file audits.

### TypeScript standards audit

Audit the `plugin/system/` TypeScript source code against the `typescript-standards` skill.

1. Load the `typescript-standards` skill — use its full Summary Checklist as the audit criteria
2. Read every `.ts` file in `plugin/system/src/` (recursively)
3. For each file, check every item in the typescript-standards Summary Checklist
4. Record every finding with exact file path, line number, and the specific standard violated
5. Append results to the same `.temp/system-cli-audit-<datetime>.md` report (under a separate "TypeScript Standards" heading), or write a standalone `.temp/typescript-audit-<datetime>.md` if running independently
