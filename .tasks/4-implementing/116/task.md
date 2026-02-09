---
id: 116
title: Fix system CLI standards violations from audit report
status: implementing
created: 2026-02-09
depends_on: []
blocks: []
---

# Task 116: Fix system CLI standards violations from audit report

## Description

The system-cli-standards audit (from task #115) found widespread violations across the plugin. These need to be fixed to bring all prompt files into compliance with the canonical CLI invocation pattern defined in the `system-cli-standards` skill.

Audit report: [audit.md](audit.md) (22 violations across 5 categories)

## Acceptance Criteria

- [ ] All skills use `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh"` for CLI invocations
- [ ] All commands use `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh"` for CLI invocations
- [ ] All agents delegate CLI work to commands/skills (no direct CLI invocation)
- [ ] Templates use `system-run.sh` for all CLI invocations (no TODOs — fully fixed)
- [ ] `sdd-change-verify` uses stdin (`-`) instead of temp files for CLI input
- [ ] No bare `sdd-system` references remain in any prompt file
- [ ] `npm run build:plugin` passes
- [ ] `npm test` passes (no new failures)
