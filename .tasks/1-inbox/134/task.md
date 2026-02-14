---
id: 134
title: "Fix 3 sdd-init issues: CLAUDE_PLUGIN_ROOT fallback, permissions check, and permissions configure project requirement"
status: inbox
priority: null
created: 2026-02-14 12:00 UTC
---

# Fix 3 sdd-init Issues

Three issues found when running `/sdd-init` on a new blank project:

## Issue 1: CLAUDE_PLUGIN_ROOT not available in Bash tool sessions

`system-run.sh` uses `${CLAUDE_PLUGIN_ROOT}/system/dist/cli.js`, but the env var isn't set in Bash tool sessions. The path resolves to `/system/dist/cli.js` (absolute root).

**Root cause:** `system-run.sh` has no fallback — it blindly trusts the env var. `hook-runner.sh` has the same pattern but hooks may set the env var differently.

**Fix:** Derive plugin root from the script's own location as a fallback (the script lives at `plugin/system/system-run.sh`).

## Issue 2: `permissions check` subcommand doesn't exist

Phase 3.6 of sdd-init needs to check if permissions are configured before offering to configure them. The CLI only supports `permissions configure`, not `permissions check`.

**Root cause:** The subcommand was never implemented. The permissions handler only has `configure`.

**Fix:** Either add a `permissions check` subcommand, or update sdd-init to read `.claude/settings.local.json` directly (simpler).

## Issue 3: `permissions configure` requires existing SDD project

Phase 3.6 (permissions) runs before Phase 4 (create structure). `configurePermissions()` calls `findProjectRoot()` which looks for `package.json` or `.sdd/sdd-settings.yaml` — neither exists yet for a new project.

**Root cause:** `configurePermissions()` hard-requires a project root to determine where `.claude/` lives.

**Fix:** Fall back to `cwd` when no project root is found, AND reorder sdd-init phases so permissions come after structure creation.
