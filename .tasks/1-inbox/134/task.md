---
id: 134
title: "Fix CLI invocation resilience: env var fallback, command reference validation, and permissions configure precondition"
status: inbox
priority: null
created: 2026-02-14 12:00 UTC
---

# Fix CLI Invocation Resilience

Three systemic issues discovered when running `/sdd-init` on a new blank project. Each is a symptom of a broader problem affecting the entire plugin, not just sdd-init.

## Issue 1: CLAUDE_PLUGIN_ROOT not available in Bash tool sessions

`system-run.sh` and `hook-runner.sh` use `${CLAUDE_PLUGIN_ROOT}/system/dist/cli.js`, but the env var may not be set in Bash tool sessions. When unset, the path resolves to `/system/dist/cli.js` (absolute root path).

**Scope:** This affects every CLI invocation across every skill, command, and agent — not just sdd-init. There are 50+ prompt files that tell the agent to run `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh"`.

**Two layers of exposure:**

| Layer | Where | Expanded by | Status |
|-------|-------|-------------|--------|
| JSON configs | `hooks.json`, `.mcp.json` | Claude Code (string interpolation) | Likely works |
| Shell scripts | `system-run.sh`, `hook-runner.sh` | Bash (env var) | Unknown / possibly broken |
| Prompt files | 50+ `.md` files | Agent constructs bash command | Broken when env var not set |

**Fix:** Make `system-run.sh` and `hook-runner.sh` self-locating — derive plugin root from their own filesystem path as fallback. Since `system-run.sh` lives at `<plugin-root>/system/system-run.sh`, it can always resolve its own root:

```bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(dirname "$SCRIPT_DIR")}"
```

## Issue 2: Prompt files reference CLI commands that don't exist

sdd-init Phase 3.6 references `permissions check --json`, but this subcommand was never implemented. The CLI only supports `permissions configure`.

**Scope:** This is a wider problem — there is no validation that prompt files (skills, agents, commands) reference CLI commands that actually exist. Any `.md` file can reference `system-run.sh foo bar` and nothing catches it until runtime.

**Fix:** Add a rule to `system-cli-standards` that all CLI invocations in prompt files must reference commands that actually exist. Add a test or audit mechanism to enforce this — parse all `.md` files for `system-run.sh <namespace> <action>` patterns and validate against the CLI's actual command registry.

## Issue 3: `permissions configure` requires existing SDD project

During sdd-init, Phase 3.6 (permissions) runs before Phase 4 (create structure). `configurePermissions()` calls `findProjectRoot()` which looks for `package.json` or `.sdd/sdd-settings.yaml` — neither exists yet for a new project.

**Fix:** Make `configurePermissions()` fall back to `cwd` when no project root is found (it only needs the cwd to locate `.claude/settings.local.json`). Also reorder sdd-init so permissions configuration runs after structure creation.
