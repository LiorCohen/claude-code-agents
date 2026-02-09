---
title: Fix system CLI standards violations from audit report
created: 2026-02-09
updated: 2026-02-09
---

# Plan: Fix System CLI Standards Violations

## Problem Summary

47 violations across 13 plugin prompt files and templates where CLI invocations don't follow the canonical `system-run.sh` pattern. These cause false documentation, misleading examples, and runtime failures. See [audit.md](audit.md) for the full line-by-line report.

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/skills/spec-writing/SKILL.md` | Fix PATH claim (L16), fix `npx` invocation (L125) |
| `plugin/skills/spec-index/SKILL.md` | Fix PATH claim (L46), fix 8 bare `sdd-system` (L12,19,27,36,39,127,128,133), fix 2 `npx` in CI (L162,166) |
| `plugin/commands/sdd-init.md` | Fix 2 bare `sdd-system` (L191,252) |
| `plugin/commands/sdd-config.md` | Fix 6 bare `sdd-system` (L245,249,252,255,258,261) |
| `plugin/skills/components/helm/helm-standards/SKILL.md` | Fix PATH claim (L21), fix bare `sdd-system` (L259) |
| `plugin/skills/components/helm/helm-scaffolding/SKILL.md` | Fix PATH claim (L22), fix bare `sdd-system` (L191) |
| `plugin/skills/components/config/config-scaffolding/SKILL.md` | Fix PATH claim (L17), fix bare `sdd-system` reference (L151) |
| `plugin/skills/components/database/database-standards/SKILL.md` | Fix PATH claim (L25), fix incidental text reference (L31) |
| `plugin/skills/components/contract/contract-scaffolding/SKILL.md` | Fix PATH claim (L17), fix 2 bare `sdd-system` (L55,56), fix incidental text (L25) |
| `plugin/skills/components/database/database-scaffolding/SKILL.md` | Fix PATH claim (L65), fix 4 bare `sdd-system` (L57-60), fix incidental text (L17,41) |
| `plugin/skills/domain-population/SKILL.md` | Replace temp file pattern with stdin pipe (L28-48) |
| `plugin/skills/scaffolding/SKILL.md` | Fix bare `sdd-system` in usage text (L43) |
| `plugin/skills/components/contract/contract-scaffolding/templates/package.json` | Fix 2 npm scripts |
| `plugin/skills/components/database/database-scaffolding/templates/package.json` | Fix 7 npm scripts |
| `.claude/skills/system-cli-standards/skill.md` | Update template guidance (section 3) |

## Changes

### 1. Fix PATH Claims (8 skills)

Replace:
```
- `sdd-system` CLI available in PATH (installed via the SDD plugin's npm package)
```
With:
```
- SDD plugin active (`CLAUDE_PLUGIN_ROOT` environment variable set)
```

### 2. Fix Bare `npx sdd-system` Invocations (2 skills)

Replace all `npx sdd-system <namespace> <action>` with `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" <namespace> <action>`.

For spec-index's CI example (GitHub Actions YAML), also use the `system-run.sh` pattern since CI runs in a plugin context.

### 3. Fix Bare `sdd-system` in Code Blocks (9 files, 24 occurrences)

Replace all bare `sdd-system <namespace> <action>` in code blocks with the canonical wrapper. Applies to:

- **spec-index** (8): Command examples and workflow instructions
- **sdd-init** (2): Tool check and settings reconcile invocations
- **sdd-config** (6): All CLI subcommand examples and prose
- **helm-standards** (1): Config generate example
- **helm-scaffolding** (1): Config generate example
- **config-scaffolding** (1): Prose reference
- **contract-scaffolding** (2): CLI direct usage examples
- **database-scaffolding** (4): CLI direct usage examples
- **scaffolding** (1): Usage prose

For code blocks, replace `sdd-system` with `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh"`.

For prose text like "call `sdd-system scaffolding project`", rewrite to reference the canonical wrapper naturally (e.g., "invoke the system CLI via `system-run.sh`").

For incidental text like "npm scripts (call sdd-system CLI)" and "npm scripts that call the sdd-system CLI", update to "npm scripts (invoke the system CLI via `system-run.sh`)" or similar.

### 4. Fix Template npm Scripts (2 template package.json files)

Replace bare `sdd-system` with `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh"` in all npm script values.

Update the `system-cli-standards` skill section 3 ("User-project npm scripts") to reflect that templates CAN use `system-run.sh` via `CLAUDE_PLUGIN_ROOT` since scaffolded npm scripts are invoked during plugin sessions.

### 5. Fix Temp File Pattern (domain-population)

Replace the 3-step temp file pattern (create → invoke → delete) with a single stdin pipe:
```bash
cat << 'EOF' | "${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding domain --config -
{ ... }
EOF
```

This also fixes the bare `sdd-system` on L45 since the entire block is rewritten.

## Dependencies

No sequencing requirements — all changes are independent text replacements in prompt files.

## Tests

### Verification Searches
- [ ] `grep -r "sdd-system" plugin/skills/ plugin/agents/ plugin/commands/` returns zero matches (excluding `plugin/system/`)
- [ ] `grep -r "available in PATH" plugin/` returns zero matches
- [ ] `grep -r "npx sdd-system" plugin/` returns zero matches
- [ ] `grep -r "/tmp/sdd-" plugin/` returns zero matches
- [ ] `grep -r "sdd-system" plugin/skills/*/templates/` returns zero matches
- [ ] All template `package.json` files use `system-run.sh` wrapper

### Build
- [ ] `npm run build:plugin` passes
- [ ] `npm test` passes

## Verification

- [ ] No bare `sdd-system` references remain in any prompt file (skills, commands, agents)
- [ ] No bare `sdd-system` references remain in any template file
- [ ] No PATH claims remain
- [ ] No `npx sdd-system` invocations remain
- [ ] No temp file patterns remain
- [ ] system-cli-standards skill section 3 updated for template guidance
