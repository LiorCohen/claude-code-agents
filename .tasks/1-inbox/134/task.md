---
id: 134
title: "Fix CLI invocation: replace broken CLAUDE_PLUGIN_ROOT pattern, add command validation, fix permissions precondition"
status: inbox
priority: null
created: 2026-02-14 12:00 UTC
---

# Fix CLI Invocation

Three systemic issues discovered when running `/sdd-init` on a new blank project. Each is a symptom of a broader problem affecting the entire plugin, not just sdd-init.

## Issue 1: CLAUDE_PLUGIN_ROOT is not a runtime env var — the canonical invocation pattern is broken

**Finding:** `CLAUDE_PLUGIN_ROOT` is a **config-time variable only**. Claude Code expands it via string interpolation in JSON configs (hooks.json, .mcp.json) before passing commands to Bash. It is **never** set as an environment variable in Bash tool sessions.

**Impact on hooks:** Claude Code expands `${CLAUDE_PLUGIN_ROOT}/hooks/hook-runner.sh` in hooks.json → the script IS found. But inside `hook-runner.sh`, it references `${CLAUDE_PLUGIN_ROOT}` again internally (`exec node ... "${CLAUDE_PLUGIN_ROOT}/system/dist/cli.js"`). At that point it's a Bash env var lookup and the variable is empty. **Hooks are likely broken too.**

**Impact on prompt files:** 50+ skill/command/agent `.md` files instruct the agent to run `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" <namespace> <action>`. The agent constructs this as a Bash command. The variable is empty. The agent must self-recover by discovering the path (wastes tool calls, not guaranteed to work).

**Two-part fix needed:**

1. **Shell scripts** (`system-run.sh`, `hook-runner.sh`): Self-locate by deriving plugin root from their own filesystem path. This fixes hooks (where Claude Code finds the script via JSON expansion, but the script itself needs the path internally).

2. **Prompt files**: The canonical invocation pattern in `system-cli-standards` (`"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh"`) must be replaced with a mechanism that works without the env var. All 50+ prompt files must be updated to use the new pattern. Options to evaluate during planning:
   - Discovery one-liner (search `~/.claude/plugins/` for system-run.sh)
   - Store plugin root in project-local file (e.g., `.sdd/.plugin-root`) during init
   - Other mechanism TBD

## Issue 2: Prompt files reference CLI commands that don't exist

sdd-init Phase 3.6 tells the agent to check if permissions are configured ("Checking permissions...") but doesn't specify which CLI command to use. The agent inferred it should run `permissions check --json`, but this subcommand doesn't exist — the CLI only supports `permissions configure`.

**Scope:** There is no validation that prompt files reference CLI commands that actually exist. Any `.md` file can reference `system-run.sh foo bar` and nothing catches it until runtime.

**Fix:** Add a rule to `system-cli-standards` requiring all CLI invocations in prompt files to reference commands that actually exist. Add a test or audit mechanism to enforce — parse all `.md` files for `system-run.sh <namespace> <action>` patterns and validate against the CLI's actual command registry.

## Issue 3: `permissions configure` requires existing SDD project

During sdd-init, Phase 3.6 (permissions) runs before Phase 4 (create structure). `configurePermissions()` calls `findProjectRoot()` which looks for `package.json` or `.sdd/sdd-settings.yaml` — neither exists yet for a new project.

**Fix:** Make `configurePermissions()` fall back to `cwd` when no project root is found (it only needs the cwd to locate `.claude/settings.local.json`). Also reorder sdd-init so permissions configuration runs after structure creation.
