---
title: Fix skills standards violations from audit report
created: 2026-02-10
---

# Plan: Fix Skills Standards Violations from Audit Report

## Problem Summary

The 2026-02-10 skills-standards audit found 10 violations across 8 skills: a path inconsistency between `scaffolding` and `project-settings`, 6 missing output schemas on scaffolding skills, and 3 minor issues (vague table references, code block formatting, and unverified CLI commands).

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/skills/scaffolding/SKILL.md` | Fix `helm-charts` → `helm_charts` in Directory Naming table |
| `plugin/skills/components/helm/helm-scaffolding/SKILL.md` | Fix `helm-charts` → `helm_charts` in operations example (~line 269), add `## Output` section |
| `plugin/skills/components/backend/backend-scaffolding/SKILL.md` | Add `## Output` section before `## Related Skills` |
| `plugin/skills/components/backend/backend-scaffolding/schemas/output.schema.json` | New file — scaffolding output schema |
| `plugin/skills/components/config/config-scaffolding/SKILL.md` | Add `## Output` section before `## Related Skills` |
| `plugin/skills/components/config/config-scaffolding/schemas/output.schema.json` | New file — scaffolding output schema |
| `plugin/skills/components/contract/contract-scaffolding/SKILL.md` | Add `## Output` section before `## Related Skills` |
| `plugin/skills/components/contract/contract-scaffolding/schemas/output.schema.json` | New file — scaffolding output schema |
| `plugin/skills/components/database/database-scaffolding/SKILL.md` | Add `## Output` section before `## Related Skills` |
| `plugin/skills/components/database/database-scaffolding/schemas/output.schema.json` | New file — scaffolding output schema |
| `plugin/skills/components/frontend/frontend-scaffolding/SKILL.md` | Add `## Output` section before `## Related Skills` |
| `plugin/skills/components/frontend/frontend-scaffolding/schemas/output.schema.json` | New file — scaffolding output schema |
| `plugin/skills/components/helm/helm-scaffolding/schemas/output.schema.json` | New file — scaffolding output schema |
| `plugin/skills/component-discovery/SKILL.md` | Add clarifying note above Available Components table |
| `plugin/skills/spec-writing/SKILL.md` | Fix 5 malformed code block closing fences |
| `plugin/skills/local-env/SKILL.md` | Add note that `/sdd-run env` commands are planned but not yet implemented |

## Changes

### 1. Fix path inconsistency (Priority 1)

The `scaffolding` SKILL.md Directory Naming table uses `helm-charts` (hyphens), but `project-settings` (authoritative source) and `helm-scaffolding` use `helm_charts` (underscores). Change `components/helm-charts/` to `components/helm_charts/` in the scaffolding SKILL.md table.

Also fix one occurrence in `helm-scaffolding/SKILL.md` operations example (~line 269) that uses `helm-charts` instead of `helm_charts`.

### 2. Add output schemas to 6 scaffolding skills (Priority 2)

All 6 component scaffolding skills (`backend`, `config`, `contract`, `database`, `frontend`, `helm`) are invoked by the parent `scaffolding` skill via the scaffolding engine. Each skill produces files but has no `output.schema.json`.

These skills are delegated to by the parent `scaffolding` skill, which already has its own `output.schema.json` describing the aggregate result. The individual scaffolding skills don't produce independent structured output — their results are consumed by the scaffolding engine internally. Rather than duplicating the parent schema, each skill should declare that output is handled by the scaffolding engine.

**Approach:** Add an `## Output` section to each SKILL.md (between `## Input` and `## Related Skills`) stating: "Output is reported by the parent `scaffolding` skill. This skill produces files in the component directory but does not define independent structured output." No `output.schema.json` files are needed since these skills don't produce standalone structured output — they produce filesystem artifacts mediated by the scaffolding engine.

### 3. Clarify component-discovery table references (Priority 3)

The Available Components table in `component-discovery/SKILL.md` lists scaffolding skill names as informational references (which skill handles each type), but component-discovery doesn't invoke them. Add a note above the table: "The Scaffolding Skill column shows which skill handles scaffolding for each component type. These are informational references — this skill does not invoke them."

### 4. Fix spec-writing code block formatting (Priority 3)

Five code blocks in `spec-writing/SKILL.md` close with the language identifier (e.g., ` ```json ` instead of ` ``` `). Fix all 5 instances:
- ~Line 243: ` ```json ` → ` ``` `
- ~Line 248: ` ```json ` → ` ``` `
- ~Line 280: ` ```text ` → ` ``` `
- ~Line 301: ` ```text ` → ` ``` `
- ~Line 308: ` ```text ` → ` ``` `

### 5. Verify local-env command references (Priority 3)

The `/sdd-run env` commands referenced in `local-env/SKILL.md` are documented but may not be implemented in the system CLI yet. Add a note in the Prerequisites or Quick Start section indicating these commands are planned for future implementation by the system CLI.

## Dependencies

No sequencing dependencies — all 5 changes are independent and can be made in any order.

## Tests

### Manual Verification
- [ ] `verify_scaffolding_helm_path_consistency` — grep all skill files for `helm-charts` and `helm_charts`, confirm only `helm_charts` appears
- [ ] `verify_output_sections_exist` — all 6 scaffolding SKILL.md files have an `## Output` section
- [ ] `verify_component_discovery_note` — component-discovery SKILL.md has clarifying note above Available Components table
- [ ] `verify_spec_writing_code_blocks` — no code block closing fences contain language identifiers in spec-writing SKILL.md
- [ ] `verify_local_env_note` — local-env SKILL.md has a note about command implementation status

## Verification

- [ ] All path references to helm directories use `helm_charts` (underscores) consistently
- [ ] All 6 scaffolding skills have `## Output` sections explaining output is handled by parent skill
- [ ] `component-discovery` table has informational reference note
- [ ] `spec-writing` code blocks render correctly in markdown
- [ ] `local-env` command status is documented
- [ ] No new violations introduced (re-audit passes clean)
