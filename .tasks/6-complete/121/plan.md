---
title: Fix skills standards violations from audit report
created: 2026-02-10
updated: 2026-02-10
---

# Plan: Fix Skills Standards Violations from Audit Report

## Problem Summary

The 2026-02-10 skills-standards audit found 10 violations across 8 skills. After verification:

- **Violation #10** (`local-env` referencing unimplemented commands) is a **false positive** — `/sdd-run env` commands are fully implemented in `plugin/system/src/commands/env/`
- **Violation #9** (path inconsistency) is **much larger than the audit reported** — `helm-charts` vs `helm_charts` is inconsistent across 12+ files including skills, commands, agents, templates, and TypeScript source code

Remaining: 1 path inconsistency (widespread), 6 missing output declarations, 2 minor issues.

## Files to Modify

### Change 1: Fix `helm-charts` → `helm_charts` across plugin prompt files

| File | Occurrences | Lines |
|------|-------------|-------|
| `plugin/skills/scaffolding/SKILL.md` | 2 | ~139, ~170 |
| `plugin/skills/project-settings/SKILL.md` | 1 | ~93 (line 202 already correct) |
| `plugin/skills/components/helm/helm-scaffolding/SKILL.md` | 9 | ~269–277 (operations example) |
| `plugin/skills/project-scaffolding/templates/project/CLAUDE.md` | 1 | ~21 |
| `plugin/commands/sdd-settings.md` | 2 | ~131, ~132 |
| `plugin/commands/sdd-config.md` | 1 | ~236 |
| `plugin/agents/devops.md` | 2 | ~193, ~196 (local path refs only — line 135 is an external URL, leave as-is) |

### Change 1b: Fix `helm-charts` → `helm_charts` in TypeScript source

| File | Occurrences | Lines |
|------|-------------|-------|
| `plugin/system/src/settings/sync.ts` | 1 | ~135: `helm: 'helm-charts'` → `helm: 'helm_charts'` |
| `plugin/system/src/commands/scaffolding/project.ts` | 1 | ~26: `helm: 'helm-charts'` → `helm: 'helm_charts'` |
| `plugin/system/src/commands/env/deploy.ts` | — | Already uses `helm_charts` (no change) |

Requires `npm run build:plugin` and `npm test` validation after change.

### Change 2: Add `output.schema.json` and `## Output` sections to 6 scaffolding skills

| File | Changes |
|------|---------|
| `plugin/skills/components/backend/backend-scaffolding/SKILL.md` | Add `## Output` section between `## Input` and `## Related Skills` |
| `plugin/skills/components/backend/backend-scaffolding/schemas/output.schema.json` | New file |
| `plugin/skills/components/config/config-scaffolding/SKILL.md` | Add `## Output` section between `## Input` and `## Related Skills` |
| `plugin/skills/components/config/config-scaffolding/schemas/output.schema.json` | New file |
| `plugin/skills/components/contract/contract-scaffolding/SKILL.md` | Add `## Output` section between `## Input` and `## Related Skills` |
| `plugin/skills/components/contract/contract-scaffolding/schemas/output.schema.json` | New file |
| `plugin/skills/components/database/database-scaffolding/SKILL.md` | Add `## Output` section between `## Input` and `## Related Skills` |
| `plugin/skills/components/database/database-scaffolding/schemas/output.schema.json` | New file |
| `plugin/skills/components/frontend/frontend-scaffolding/SKILL.md` | Add `## Output` section between `## Input` and `## Related Skills` |
| `plugin/skills/components/frontend/frontend-scaffolding/schemas/output.schema.json` | New file |
| `plugin/skills/components/helm/helm-scaffolding/SKILL.md` | Add `## Output` section between `## Input` and `## Related Skills` |
| `plugin/skills/components/helm/helm-scaffolding/schemas/output.schema.json` | New file |

All 6 skills share the same output schema, matching the scaffolding engine's `EngineResult` type from `plugin/system/src/commands/scaffolding/engine.ts`.

### Change 3: Minor fixes

| File | Changes |
|------|---------|
| `plugin/skills/component-discovery/SKILL.md` | Add clarifying note above Available Components table |
| `plugin/skills/spec-writing/SKILL.md` | Fix 5 malformed code block closing fences |

### Not changing (false positive)

| File | Reason |
|------|--------|
| `plugin/skills/local-env/SKILL.md` | All `/sdd-run env` commands are implemented |

## Changes

### 1. Fix `helm-charts` → `helm_charts` path inconsistency (Priority 1)

The authoritative path is `helm_charts` (underscores), per `project-settings/SKILL.md` line 202 and `helm-scaffolding/SKILL.md` documentation. Fix all prompt files (skills, commands, agents, templates) that use `helm-charts` for local component paths.

**Important distinctions:**
- External URLs like `https://kubeshop.github.io/helm-charts` and `https://victoriametrics.github.io/helm-charts/` are NOT local paths — leave these unchanged
- `project-settings/SKILL.md` line 93 uses `helm-charts` while line 202 uses `helm_charts` — fix line 93

Also fix the TypeScript source code (`sync.ts`, `project.ts`) — same inconsistency. Validate with `npm run build:plugin` and `npm test`.

### 2. Add output schemas to 6 scaffolding skills (Priority 2)

Each scaffolding skill produces output via the scaffolding engine (`EngineResult` in `engine.ts`). Create a shared `output.schema.json` for all 6 skills matching this type:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "<component>-scaffolding output",
  "description": "Result from scaffolding engine execution.",
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "description": "Whether all operations completed without errors"
    },
    "created": {
      "type": "object",
      "description": "Artifacts created during scaffolding",
      "properties": {
        "files": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Relative paths of files created"
        },
        "dirs": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Relative paths of directories created"
        },
        "scripts": {
          "type": "array",
          "items": { "type": "string" },
          "description": "package.json script names added"
        }
      },
      "required": ["files", "dirs", "scripts"]
    },
    "skipped": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Paths skipped because they already existed"
    },
    "errors": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Error messages for failed operations"
    },
    "summary": {
      "type": "string",
      "description": "Human-readable summary of operations performed"
    }
  },
  "required": ["success", "created", "skipped", "errors", "summary"]
}
```

Add `## Output` section to each SKILL.md (between `## Input` and `## Related Skills`):

```markdown
## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns the scaffolding engine result: created files, directories, and scripts; skipped paths; errors; and a human-readable summary.
```

### 3. Clarify component-discovery table references (Priority 3)

Add a note above the Available Components table: "The Scaffolding Skill column shows which skill handles scaffolding for each component type. These are informational references — this skill does not invoke them."

### 4. Fix spec-writing code block formatting (Priority 3)

Fix 5 malformed closing fences where the language identifier is incorrectly included:
- Line 243: ` ```json ` → ` ``` `
- Line 248: ` ```json ` → ` ``` `
- Line 280: ` ```text ` → ` ``` `
- Line 301: ` ```text ` → ` ``` `
- Line 308: ` ```text ` → ` ``` `

## Dependencies

Change 1b (TypeScript fixes) must be validated with build + tests before committing. All other changes are independent prompt-file edits with no sequencing dependencies.

## Tests

### Manual Verification
- [ ] `verify_helm_path_consistency` — grep all plugin prompt files (`**/*.md`) for `helm-charts` in local path context, confirm none remain (external URLs are OK)
- [ ] `verify_output_schemas_exist` — all 6 scaffolding skills have `schemas/output.schema.json` and `## Output` section in SKILL.md
- [ ] `verify_component_discovery_note` — component-discovery SKILL.md has clarifying note above Available Components table
- [ ] `verify_spec_writing_code_blocks` — no code block closing fences contain language identifiers in spec-writing SKILL.md

## Verification

- [ ] All local path references to helm directories use `helm_charts` (underscores) in prompt files and TypeScript source
- [ ] `npm run build:plugin` passes
- [ ] `npm test` passes
- [ ] `project-settings/SKILL.md` is internally consistent (both references use underscores)
- [ ] All 6 scaffolding skills have `## Output` sections referencing `output.schema.json`
- [ ] All 6 `output.schema.json` files match the `EngineResult` type from `engine.ts`
- [ ] `component-discovery` table has informational reference note
- [ ] `spec-writing` code blocks render correctly in markdown
- [ ] No new violations introduced (re-audit passes clean)
