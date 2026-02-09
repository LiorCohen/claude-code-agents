---
id: 116
title: Fix system CLI standards violations from audit report
status: open
created: 2026-02-09
depends_on: []
blocks: []
---

# Task 116: Fix system CLI standards violations from audit report

## Description

The system-cli-standards audit (from task #115) found widespread violations across the plugin. These need to be fixed to bring all prompt files into compliance with the canonical CLI invocation pattern defined in the `system-cli-standards` skill.

Audit report: `.temp/system-cli-audit-2026-02-09.md`

## Violations Found

### 1. Wrong PATH claims in skills (8 files)
Skills reference `plugin/system/cli.ts` or `plugin/system/dist/cli.js` directly instead of using the `system-run.sh` wrapper via `$CLAUDE_PLUGIN_ROOT`.

### 2. Bare `sdd-system` invocations (12 files)
Skills, commands, and agents use `sdd-system <namespace> <action>` instead of the canonical `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" <namespace> <action>` pattern.

### 3. Broken template npm scripts (3 files)
Scaffolded templates contain `npx sdd-system` or bare `sdd-system` in npm run scripts, which won't resolve at runtime.

### 4. Temp file usage instead of stdin (1 file)
`sdd-change-verify` writes a temp file for CLI input instead of using the stdin (`-`) convention.

## Acceptance Criteria

- [ ] All skills use `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh"` for CLI invocations
- [ ] All commands use `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh"` for CLI invocations
- [ ] All agents delegate CLI work to commands/skills (no direct CLI invocation)
- [ ] Templates either use `system-run.sh` or omit CLI invocations with a TODO comment
- [ ] `sdd-change-verify` uses stdin (`-`) instead of temp files for CLI input
- [ ] No bare `sdd-system` references remain in any prompt file
- [ ] `npm run build:plugin` passes
- [ ] `npm test` passes (no new failures)
