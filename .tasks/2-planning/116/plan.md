---
title: Fix system CLI standards violations from audit report
created: 2026-02-09
---

# Plan: Fix System CLI Standards Violations

## Problem Summary

22 violations across plugin prompt files and templates where CLI invocations don't follow the canonical `system-run.sh` pattern. These cause false documentation and runtime failures.

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/skills/spec-writing/SKILL.md` | Fix PATH claim (L16), fix `npx` invocation (L125) |
| `plugin/skills/spec-index/SKILL.md` | Fix PATH claim (L46), fix bare commands (L12,19,27,36,39), fix `npx` in CI example (L162,166) |
| `plugin/skills/components/helm/helm-standards/SKILL.md` | Fix PATH claim (L21) |
| `plugin/skills/components/config/config-scaffolding/SKILL.md` | Fix PATH claim (L17) |
| `plugin/skills/components/database/database-standards/SKILL.md` | Fix PATH claim (L25) |
| `plugin/skills/components/contract/contract-scaffolding/SKILL.md` | Fix PATH claim (L17) |
| `plugin/skills/components/database/database-scaffolding/SKILL.md` | Fix PATH claim (L65) |
| `plugin/skills/components/helm/helm-scaffolding/SKILL.md` | Fix PATH claim (L22) |
| `plugin/skills/domain-population/SKILL.md` | Replace temp file pattern with stdin pipe (L28-48), fix bare `sdd-system` (L45) |
| `plugin/skills/scaffolding/SKILL.md` | Fix bare `sdd-system` in usage text (L43) |
| `plugin/skills/components/contract/contract-scaffolding/templates/package.json` | Fix npm scripts to use `system-run.sh` |
| `plugin/skills/components/database/database-scaffolding/templates/package.json` | Fix npm scripts to use `system-run.sh` |
| `.claude/skills/system-cli-standards/skill.md` | Update template guidance to allow `system-run.sh` in templates |

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

### 3. Fix Bare `sdd-system` in Skill Command Documentation (spec-index)

The spec-index skill documents CLI commands using bare `sdd-system` in its Commands section. Replace all bare `sdd-system` references with the canonical wrapper.

### 4. Fix Template npm Scripts (2 template package.json files)

Replace bare `sdd-system` with `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh"` in all npm script values. These scripts are run during plugin sessions where `CLAUDE_PLUGIN_ROOT` is available.

Update the `system-cli-standards` skill to reflect that templates CAN use `system-run.sh` via `CLAUDE_PLUGIN_ROOT` since scaffolded npm scripts are run during plugin sessions.

### 5. Fix Temp File Pattern (domain-population)

Replace the 3-step temp file pattern (create → invoke → delete) with a single stdin pipe:
```bash
cat << 'EOF' | "${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding domain --config -
{ ... }
EOF
```

### 6. Fix Bare `sdd-system` in Skill Examples (2 skills)

Replace bare `sdd-system scaffolding <action>` with `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding <action>` in domain-population and scaffolding skills.

## Dependencies

No sequencing requirements — all changes are independent text replacements in prompt files. Can be done in any order.

## Tests

### Verification Searches
- [ ] `grep -r "sdd-system" plugin/skills/ plugin/agents/ plugin/commands/` returns zero matches in prompt files (excluding the standard itself)
- [ ] `grep -r "available in PATH" plugin/` returns zero matches
- [ ] `grep -r "npx sdd-system" plugin/` returns zero matches
- [ ] `grep -r "/tmp/sdd-" plugin/` returns zero matches
- [ ] All template `package.json` files use `system-run.sh` wrapper

### Build
- [ ] `npm run build:plugin` passes
- [ ] `npm test` passes

## Verification

- [ ] No bare `sdd-system` references remain in any prompt file
- [ ] No PATH claims remain
- [ ] No `npx sdd-system` invocations remain
- [ ] No temp file patterns remain
- [ ] All template npm scripts use canonical wrapper
- [ ] system-cli-standards skill updated to reflect template guidance
