---
id: 134
title: "Fix CLI invocation: replace broken CLAUDE_PLUGIN_ROOT pattern, add command validation, fix permissions precondition"
status: inbox
priority: null
created: 2026-02-14 12:00 UTC
---

# Fix CLI Invocation

Three systemic issues discovered when running `/sdd-init` on a new blank project. Each is a symptom of a broader problem affecting the entire plugin, not just sdd-init.

## Issue 1: Prompt files use `${CLAUDE_PLUGIN_ROOT}` which the agent delegates to Bash instead of resolving

**How `CLAUDE_PLUGIN_ROOT` works (per Claude Code docs):**
- Claude Code expands `${CLAUDE_PLUGIN_ROOT}` via string interpolation in JSON configs (hooks.json, .mcp.json)
- It is also set as an environment variable for hook and MCP server subprocesses
- It is **not** set as an environment variable in Bash tool sessions (agent-initiated commands)

**Hooks currently work** because Claude Code sets the env var for hook subprocesses. However, shell scripts should not assume anything about env vars internally — they should derive what they need from their own filesystem location. This is a hidden dependency that could break silently if Claude Code's behavior changes.

**Key discovery (tested):** The agent CAN resolve the plugin root path from Claude Code's context when running inside a plugin prompt (skill/command/agent). However, when prompt files use `${CLAUDE_PLUGIN_ROOT}` in bash command examples, the agent treats it as a Bash variable and passes it through literally to the Bash tool. Since the env var is not set in Bash tool sessions, the command fails. The agent then self-recovers by discovering the correct path and retrying (wastes tool calls, not guaranteed to work).

**The problem is purely about notation in prompt files.** 50+ skill/command/agent `.md` files instruct the agent to run `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" <namespace> <action>`. The `${...}` syntax causes the agent to delegate resolution to Bash instead of substituting the value it already knows.

**Two-part fix:**

1. **Shell scripts** (`system-run.sh`, `hook-runner.sh`): Self-locate by deriving plugin root from their own filesystem path. Don't rely on caller-provided env vars — the script knows where it lives and can derive the plugin root from that.

2. **Prompt files**: Change the notation so the agent substitutes the value itself instead of delegating to Bash. Replace the `${CLAUDE_PLUGIN_ROOT}` syntax with something the agent recognizes as "substitute this with the plugin root path I know from context" rather than "pass this Bash variable through." Update `system-cli-standards` with the new canonical invocation pattern and update all 50+ prompt files.

## Issue 2: Prompt files reference CLI commands that don't exist

sdd-init Phase 3.6 tells the agent to check if permissions are configured ("Checking permissions...") but doesn't specify which CLI command to use. The agent inferred it should run `permissions check --json`, but this subcommand doesn't exist — the CLI only supports `permissions configure`.

**Scope:** There is no validation that prompt files reference CLI commands that actually exist. Any `.md` file can reference `system-run.sh foo bar` and nothing catches it until runtime.

**Fix:** Add a rule to `system-cli-standards` requiring all CLI invocations in prompt files to reference commands that actually exist. Add a test or audit mechanism to enforce — parse all `.md` files for `system-run.sh <namespace> <action>` patterns and validate against the CLI's actual command registry.

## Issue 3: `permissions configure` requires existing SDD project

During sdd-init, Phase 3.6 (permissions) runs before Phase 4 (create structure). `configurePermissions()` calls `findProjectRoot()` which looks for `package.json` or `.sdd/sdd-settings.yaml` — neither exists yet for a new project.

**Fix:** Make `configurePermissions()` fall back to `cwd` when no project root is found (it only needs the cwd to locate `.claude/settings.local.json`). Also reorder sdd-init so permissions configuration runs after structure creation.
