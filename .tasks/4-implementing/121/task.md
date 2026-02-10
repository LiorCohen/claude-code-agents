---
id: 121
title: Fix skills standards violations from audit report
status: implementing
created: 2026-02-10
depends_on: []
blocks: []
---

# Task 121: Fix skills standards violations from audit report

## Description

Fix the 10 violations identified in the skills-standards audit of 2026-02-10. Full audit report at `.temp/skills-audit-2026-02-10_12-00.md`.

## Violations Summary

### Priority 1: Path inconsistency (1 violation)
- `scaffolding` SKILL.md uses `helm-charts` (hyphens) in Directory Naming table, but `project-settings` (authoritative source) and `helm-scaffolding` use `helm_charts` (underscores). Align to `helm_charts`.

### Priority 2: Missing output schemas (6 violations)
- `backend-scaffolding` — missing `output.schema.json`
- `config-scaffolding` — missing `output.schema.json`
- `contract-scaffolding` — missing `output.schema.json`
- `database-scaffolding` — missing `output.schema.json`
- `frontend-scaffolding` — missing `output.schema.json`
- `helm-scaffolding` — missing `output.schema.json`

### Priority 3: Minor issues (3 violations)
- `component-discovery` — vague table references to scaffolding skills (add clarifying note)
- `spec-writing` — nested code block formatting issue
- `local-env` — references possibly unimplemented `/sdd-run env` commands

## Acceptance Criteria

- [ ] `scaffolding/SKILL.md` directory naming table uses `helm_charts` (matching `project-settings`)
- [ ] All 6 scaffolding skills have `output.schema.json` or explicitly declare no output
- [ ] `component-discovery` Available Components table has clarifying note about informational references
- [ ] `spec-writing` nested code block formatting fixed
- [ ] `local-env` command references verified or noted as future work
