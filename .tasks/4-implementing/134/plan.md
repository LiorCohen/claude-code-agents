---
title: "Fix CLI invocation: replace broken CLAUDE_PLUGIN_ROOT pattern, add command validation, fix permissions precondition"
created: 2026-02-14 16:00 UTC
updated: 2026-02-14 16:30 UTC
---

# Plan: Fix CLI Invocation

## Problem Summary

Three systemic issues prevent reliable CLI invocation from prompt files:

1. **Broken `${CLAUDE_PLUGIN_ROOT}` notation** — 22 prompt files use `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh"` in bash examples. The agent treats this as a Bash variable and passes it literally to the Bash tool, where it is unset. The agent self-recovers but wastes tool calls and is fragile.

2. **No CLI command validation** — Prompt files can reference `system-run.sh <namespace> <action>` patterns that don't exist (e.g., `permissions check --json`). Nothing catches this until runtime.

3. **`permissions configure` fails during sdd-init** — It calls `findProjectRoot()` which fails for new projects (no `package.json` or `.sdd/sdd-settings.yaml` yet). The function only needs `cwd` to locate `.claude/settings.local.json`.

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/system/system-run.sh` | Self-locate plugin root from script path |
| `plugin/hooks/hook-runner.sh` | Same self-location fix |
| `.claude/skills/system-cli-standards/SKILL.md` | Update canonical invocation; add command existence rule |
| `.claude/skills/commands-standards/SKILL.md` | Update line 179 — execution wrapper reference |
| `plugin/commands/sdd-init.md` | 11 occurrences — 3 categories (see Change 2) |
| `plugin/commands/sdd-version.md` | 3 occurrences — 2 categories (see Change 2) |
| `plugin/commands/sdd-run.md` | CLI invocation (line 229) + explanatory text (line 232) |
| `plugin/commands/sdd-config.md` | CLI invocation examples |
| `plugin/commands/sdd-change.md` | CLI invocation examples |
| `plugin/hooks/PERMISSIONS.md` | Hook invocation examples |
| `plugin/agents/api-designer.md` | CLI invocation |
| 15 skill files (see list below) | CLI invocation examples |
| `plugin/system/src/commands/permissions/configure.ts` | Fall back to `cwd` when no project root found |
| `tests/src/tests/unit/commands/permissions/configure.test.ts` | New: permissions configure fallback tests |
| `tests/src/tests/unit/standards/cli-invocation-audit.test.ts` | New: audit test for CLI references in prompt files |

### Skill files with CLI invocations (mechanical replacement only)

1. `plugin/skills/workflow-state/resources/internal-api.md`
2. `plugin/skills/scaffolding/SKILL.md`
3. `plugin/skills/spec-index/SKILL.md`
4. `plugin/skills/external-spec-integration/resources/workflow-steps.md`
5. `plugin/skills/spec-writing/resources/frontmatter-validation.md`
6. `plugin/skills/domain-population/SKILL.md`
7. `plugin/skills/components/helm/helm-standards/SKILL.md`
8. `plugin/skills/components/contract/contract-standards/SKILL.md`
9. `plugin/skills/components/database/database-standards/SKILL.md`
10. `plugin/skills/components/backend/backend-scaffolding/SKILL.md`
11. `plugin/skills/components/helm/helm-scaffolding/SKILL.md`
12. `plugin/skills/components/contract/contract-scaffolding/SKILL.md`
13. `plugin/skills/components/config/config-scaffolding/SKILL.md`
14. `plugin/skills/components/frontend/frontend-scaffolding/SKILL.md`
15. `plugin/skills/components/database/database-scaffolding/SKILL.md`

## Changes

### 1. Shell scripts: self-locate plugin root

Both scripts live at known positions relative to the plugin root:
- `system-run.sh` → `plugin/system/system-run.sh` → plugin root is `../`
- `hook-runner.sh` → `plugin/hooks/hook-runner.sh` → plugin root is `../`

Replace the env var reference with path self-derivation:
```bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
exec node --enable-source-maps "$PLUGIN_ROOT/system/dist/cli.js" "$@"
```

This makes the scripts work regardless of whether `CLAUDE_PLUGIN_ROOT` is set.

### 2. Prompt files: context-sensitive replacement

Not all `${CLAUDE_PLUGIN_ROOT}` occurrences are the same. Three categories:

#### Category A: CLI invocations (mechanical replacement)

Pattern: `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" <namespace> <action>`
Replace with: `<plugin-root>/system/system-run.sh <namespace> <action>`

No quotes needed — `<plugin-root>` is not shell syntax; the agent substitutes the actual path before constructing the bash command.

Applies to: all 15 skill files, `sdd-config.md`, `sdd-change.md`, `sdd-run.md`, `api-designer.md`, and specific lines in `sdd-init.md` (lines 183, 223, 242).

#### Category B: Path references (mechanical replacement)

Pattern: `${CLAUDE_PLUGIN_ROOT}/some/path` (not a CLI invocation)
Replace with: `<plugin-root>/some/path`

Applies to:
- `sdd-init.md` lines 59, 61, 62, 136, 137, 139 (e.g., "Read version from `<plugin-root>/.claude-plugin/plugin.json`", "Run npm install in `<plugin-root>/system/`")
- `sdd-version.md` line 24 ("Read version from `<plugin-root>/.claude-plugin/plugin.json`")
- `PERMISSIONS.md` hook paths

#### Category C: Explanatory text about the env var (rewrite, NOT replace)

These lines discuss `CLAUDE_PLUGIN_ROOT` as a concept. Mechanically replacing with `<plugin-root>` would make them nonsensical.

**`sdd-init.md` line 131 — explains what the env var is:**

Before:
> This must pass before any other checks. The plugin's absolute path is available via `${CLAUDE_PLUGIN_ROOT}` (set by Claude when the plugin loads).

After:
> This must pass before any other checks. The agent knows the plugin's absolute path from its Claude Code plugin context.

**`sdd-init.md` line 133 — tells agent to check a Bash env var (the broken pattern):**

Before:
> 1. Check `${CLAUDE_PLUGIN_ROOT}`. If set, use it as the plugin path. If not set, fall back to searching `~/.claude/plugins` recursively for the SDD plugin...

After:
> 1. Use the known plugin path from your plugin context. If the plugin path cannot be determined, fall back to searching `~/.claude/plugins` recursively for the SDD plugin...

**`sdd-version.md` line 20 — precondition referencing env var:**

Before:
> - `${CLAUDE_PLUGIN_ROOT}` is set (plugin is loaded)

After:
> - Plugin is loaded (agent has access to plugin root path)

**`sdd-run.md` line 232 — explaining what the variable is:**

Before:
> Where `CLAUDE_PLUGIN_ROOT` is the path to the SDD plugin directory.

After:
> Where `<plugin-root>` is the plugin's absolute path, resolved by the agent from its Claude Code plugin context.

**`commands-standards/SKILL.md` line 179 — execution wrapper reference:**

Before:
> The execution wrapper (`node --enable-source-maps "${CLAUDE_PLUGIN_ROOT}/system/dist/cli.js"`) should appear at most once...

After:
> The execution wrapper (`node --enable-source-maps "<plugin-root>/system/dist/cli.js"`) should appear at most once...

**`system-cli-standards/SKILL.md` line 39 — explaining why env var doesn't work in templates:**

> Templates that scaffold `package.json` files into user projects cannot use `${CLAUDE_PLUGIN_ROOT}` — that variable only exists during a plugin session.

**KEEP AS-IS.** This line is explaining the env var concept — the env var name IS the subject. Replacing it would make the explanation nonsensical.

### 3. Update system-cli-standards

Three changes to `SKILL.md`:

**3a. Update canonical invocation (lines 14-23):**

Before:
```
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" <namespace> <action> [args] [options]
```

After:
```
<plugin-root>/system/system-run.sh <namespace> <action> [args] [options]
```

Update the explanation below: `<plugin-root>` is a placeholder the agent resolves from its Claude Code plugin context. Remove the quoting note (angle-bracket notation is not shell syntax).

**3b. Update stdin convention examples (lines 96, 103):**

Mechanical replacement of `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh"` → `<plugin-root>/system/system-run.sh` in example code blocks.

**3c. Add Command Existence Rule (new section after Checklist for New CLI Commands):**

New section requiring all `system-run.sh <namespace> <action>` references in prompt files to correspond to commands that actually exist in the CLI registry. Reference the audit test as the enforcement mechanism.

### 4. Fix `configurePermissions()` fallback

In `configure.ts`, when `findProjectRoot()` returns `{ found: false }`, fall back to `process.cwd()`. Change the early return on lines 62-68:

Before:
```typescript
if (!projectRootResult.found) {
  return { success: false, error: 'No SDD project found...' };
}
const projectRoot = projectRootResult.path;
```

After:
```typescript
const projectRoot = projectRootResult.found ? projectRootResult.path : process.cwd();
```

### 5. CLI invocation audit test

New test at `tests/src/tests/unit/standards/cli-invocation-audit.test.ts`.

**Approach: parse ACTIONS arrays from schema files.** Each namespace has a `schema.ts` at `plugin/system/src/commands/<namespace>/schema.ts` exporting an `ACTIONS` array — this is the actual source of truth. The `HELP_TEXT` in `cli.ts` is incomplete (e.g., missing `scaffolding apply`), so it cannot be used.

Test logic:
1. Read `plugin/system/src/cli.ts`, extract the `NAMESPACES` array
2. For each namespace, read `plugin/system/src/commands/<namespace>/schema.ts` and extract the `ACTIONS` array
3. Build a `namespace → action[]` map
4. Glob all `.md` files under `plugin/` (skills, commands, agents)
5. Regex-match `system-run\.sh\s+(\w+)\s+(\w[\w-]*)` patterns with file+line context
6. Validate each `<namespace> <action>` pair exists in the registry
7. Fail listing file path + line number for any invalid reference

Additional regression test:
- `no_prompt_files_use_dollar_brace_plugin_root` — grep all `.md` files under `plugin/` for `\$\{CLAUDE_PLUGIN_ROOT\}` in invocation/path contexts. Allowlist for explanatory prose (system-cli-standards line 39).

## Dependencies

Order: 1 → 3 → 2 → 4 → 5

1. Shell script self-location (Change 1) — independent, do first
2. System-cli-standards update (Change 3) — document the new pattern before applying it
3. Prompt file notation changes (Change 2) — apply new pattern across all files
4. Permissions fallback (Change 4) — independent
5. Audit test (Change 5) — validates final state, must come last

## Tests

### Unit Tests

- [ ] `permissions_configure_falls_back_to_cwd_when_no_project_root` — succeeds using cwd when findProjectRoot returns not-found
- [ ] `permissions_configure_still_uses_project_root_when_found` — existing behavior preserved
- [ ] `permissions_configure_creates_claude_dir_when_missing` — works in fresh directory
- [ ] `all_prompt_cli_references_match_existing_commands` — parse HELP_TEXT, scan .md files, validate pairs
- [ ] `no_prompt_files_use_dollar_brace_plugin_root` — regression with allowlist for explanatory prose
- [ ] `system_run_sh_does_not_reference_CLAUDE_PLUGIN_ROOT` — shell script self-locates
- [ ] `hook_runner_sh_does_not_reference_CLAUDE_PLUGIN_ROOT` — shell script self-locates

### Integration Tests

- [ ] `permissions_configure_works_in_empty_directory` — end-to-end CLI in temp dir with no SDD markers

## Verification

- [ ] `npm test` passes
- [ ] `npm run typecheck:plugin` passes
- [ ] `grep -r 'CLAUDE_PLUGIN_ROOT' plugin/ .claude/skills/` — only in: `hooks/hooks.json` (Claude Code interpolates), `system/src/lib/config.ts` (runtime), and allowlisted explanatory prose (system-cli-standards line 39)
- [ ] `system-run.sh --help` works without `CLAUDE_PLUGIN_ROOT` env var set
- [ ] Audit test catches deliberately invalid command reference
