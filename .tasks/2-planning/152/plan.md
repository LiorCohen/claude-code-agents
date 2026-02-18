---
title: Workflows must have user-chosen names
created: 2026-02-18 11:50 UTC
---

# Plan: Workflows must have user-chosen names

## Problem Summary

Workflows are identified only by auto-generated 6-character alphanumeric IDs (`a1b2c3`). Users see opaque IDs in listings, paths, and status displays. Add a required `name` field so every workflow has a short, memorable label chosen by the user. This changes directory layout from `.sdd/workflows/<id>/` to `.sdd/workflows/<id>-<name>/`, change IDs from `<short>-<seq>` to `<name>-<seq>`, and completed changes paths from `changes/YYYY/MM/DD/<wf-id>/` to `changes/YYYY/MM/DD/<id>-<name>/`.

## Files to Modify

| # | File | Changes |
|---|------|---------|
| 1 | `plugin/system/src/types/workflow.ts` | Add `name: string` to `WorkflowState` |
| 2 | `plugin/skills/workflow-state/SKILL.md` | Update path refs (lines 11, 147), ID generation, change-ID format |
| 3 | `plugin/skills/workflow-state/resources/workflow-yaml-schema.md` | Add `name` field, update all example paths/IDs |
| 4 | `plugin/skills/workflow-state/resources/internal-api.md` | Add `name` to `create_workflow`, uniqueness, path changes, change-ID derivation, backward compat, `workflow_id` param on 5 operations |
| 5 | `plugin/skills/workflow-state/resources/recovery.md` | Update checkpoint/archive paths |
| 6 | `plugin/skills/workflow-state/schemas/input.schema.json` | Add `name` property |
| 7 | `plugin/skills/workflow-state/schemas/output.schema.json` | Add `name` to output |
| 8 | `plugin/skills/change-creation/SKILL.md` | Update `changes/` path pattern, epic workflow.yaml example |
| 9 | `plugin/skills/planning/SKILL.md` | Update `changes/` path pattern |
| 10 | `plugin/skills/spec-solicitation/SKILL.md` | Update drafts-to-changes path refs, example change IDs |
| 11 | `plugin/skills/external-spec-integration/SKILL.md` | Update `.sdd/workflows/<workflow-id>/` refs |
| 12 | `plugin/skills/external-spec-integration/resources/workflow-steps.md` | Update return summary examples (`a1b2c3`, `a1b2-1`) |
| 13 | `plugin/skills/spec-writing/resources/frontmatter-validation.md` | Update validation error path example |
| 14 | `plugin/skills/external-spec-integration/schemas/input.schema.json` | Update `workflow_id` description |
| 15 | `plugin/skills/external-spec-integration/schemas/output.schema.json` | Update `workflow_id` and `change_id` descriptions |
| 16 | `plugin/skills/change-creation/schemas/input.schema.json` | Update `workflow_id`/`change_id` descriptions |
| 17 | `plugin/skills/planning/schemas/input.schema.json` | Update `workflow_id`/`change_id` descriptions |
| 18 | `plugin/skills/spec-solicitation/schemas/input.schema.json` | Update `workflow_id`/`change_id` descriptions |
| 19 | `plugin/skills/orchestrators/change-orchestration/SKILL.md` | Update change link format |
| 20 | `plugin/skills/orchestrators/change-orchestration/creation.md` | Add workflow name prompt, update output examples |
| 21 | `plugin/skills/orchestrators/change-orchestration/management.md` | Show name in status/list, fix multi-workflow `list` |
| 22 | `plugin/skills/orchestrators/change-orchestration/spec-review.md` | Update output examples |
| 23 | `plugin/skills/orchestrators/change-orchestration/planning.md` | Update output examples |
| 24 | `plugin/skills/orchestrators/change-orchestration/implementation.md` | Update output examples |
| 25 | `plugin/skills/orchestrators/change-orchestration/verification.md` | Update output examples, fix `advance` call to pass `workflow_id` |
| 26 | `plugin/skills/orchestrators/init-orchestration/SKILL.md` | Update Change ID format section |
| 27 | `plugin/commands/sdd.md` | Show workflow name in listings, tighten change-id inference |
| 28 | `plugin/commands/sdd-run.md` | Document workflow name in change create examples |
| 29 | `plugin/commands/sdd-help.md` | Update workflow path references |
| 30 | `plugin/system/src/commands/workflow/check-gate.ts` | Update usage comment paths |

## Changes

### 1. Core Type Definition

**File 1: `plugin/system/src/types/workflow.ts`**

Add `readonly name: string` to `WorkflowState` type (after `id` field, line 30). No other type changes — `WorkflowItem` and other types are unaffected.

### 2. Workflow-State Skill Spec

**File 2: `plugin/skills/workflow-state/SKILL.md`**

- Line 11: Change `.sdd/workflows/<workflow-id>/` to `.sdd/workflows/<id>-<name>/`
- Line 42: Update directory tree example from `a1b2c3/` to `a1b2c3-user-auth/`
- Line 53: Update second workflow example similarly
- Lines 112-118 (Workflow ID Generation): Keep 6-char ID generation as-is. Add note that the directory combines ID and name.
- Lines 120-127 (Change ID Format): Change from `<workflow-short>-<seq>` to `<name>-<seq>`. Replace examples: `a1b2-1` → `user-auth-1`. Remove "workflow-short: first 4 characters" — no longer relevant.
- Line 147: Update cleanup path from `<workflow-id>` to `<id>-<name>`

### 3. Workflow YAML Schema

**File 3: `plugin/skills/workflow-state/resources/workflow-yaml-schema.md`**

- Add `name: user-auth` field after `id:` in the schema example (line 4)
- Update `location:` examples from `a1b2c3/` to `a1b2c3-user-auth/` (lines 36, 53)
- Update `change_id:` examples from `a1b2-1` to `user-auth-1` (lines 33, 50)

### 4. Internal API

**File 4: `plugin/skills/workflow-state/resources/internal-api.md`**

This is the heaviest change (currently 425 lines). Estimated final: ~454 lines (under 500). Net additions: ~29 lines (5x `workflow_id` param blocks at +3 each, name validation/uniqueness at +6, backward compat section at +8). If it exceeds 500, move backward compat into `recovery.md` (currently 64 lines). Update every operation:

**`create_workflow` (lines 5-25):**
- Add `name` as required input alongside `source`
- Add name validation: lowercase alphanumeric + hyphens, 3-50 chars
- Add uniqueness check among active workflows
- Update output: `workflow_path: .sdd/workflows/a1b2c3-user-auth/`
- Update side effects: directory is `<id>-<name>/`

**`create_item` (lines 27-52):**
- Update output `change_id` example: `a1b2-1` → `user-auth-1`
- Update `location` example path from `a1b2c3/` to `a1b2c3-user-auth/`
- Update side effect: change_id derivation is `<name>-<seq>` not `<short>-<seq>`

**`list` (lines 54-77):**
- Add `workflow_id` parameter (fix single-workflow assumption)
- Update all path examples from `a1b2c3/` to `a1b2c3-user-auth/`
- Update change_id examples from `a1b2-N` to `user-auth-N`

**`get_current` (lines 79-95):**
- Add `workflow_id` parameter
- Update all path and ID examples

**`advance` (lines 97-112):**
- Add `workflow_id` parameter
- Update ID examples

**`update_status`, `update_substep`, `get_context`, `save_spec`, `save_plan` (various):**
- Update ID examples from `a1b2-N` to `user-auth-N`

**`get_progress` (lines 172-191):**
- Add `workflow_id` parameter

**`check_phase_gate` (lines 193-215):**
- Add `workflow_id` parameter
- Update ID examples

**`ready_for_review` (lines 307-330):**
- Update move path: `changes/YYYY/MM/DD/<wf-id>/` → `changes/YYYY/MM/DD/<id>-<name>/`
- Update all path examples

**`complete_item` (lines 353-368):**
- Update cleanup path reference from `<workflow-id>` to `<id>-<name>`

**`regress`, `flag_dependents`, `revise_decomposition` (various):**
- Update ID examples

**`checkpoint` (lines 410-425):**
- Update file path examples from `a1b2c3/` to `a1b2c3-user-auth/`

**Backward compatibility section (new):**
- Add section: when loading a workflow YAML without `name`, derive from first item title (slugified). E.g., first item title "API Contracts" → name "api-contracts".

### 5. Recovery

**File 5: `plugin/skills/workflow-state/resources/recovery.md`**

- Update checkpoint commit message example: `checkpoint: workflow a1b2c3-user-auth created`
- Update archive path examples with name-based change IDs

### 6-7. JSON Schemas

**File 6: `plugin/skills/workflow-state/schemas/input.schema.json`**

Add `name` property:
```json
"name": {
  "type": "string",
  "pattern": "^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$",
  "description": "Workflow name (lowercase alphanumeric + hyphens, 3-50 chars). Required for create_workflow."
}
```

**File 7: `plugin/skills/workflow-state/schemas/output.schema.json`**

Add `name` to properties:
```json
"name": {
  "type": "string",
  "description": "Workflow name chosen by the user"
}
```

### 8-10. Dependent Skill Specs

**File 8: `plugin/skills/change-creation/SKILL.md`**

- Line 12: Update `changes/YYYY/MM/DD/<change-name>/` — this skill's paths are for individual changes within a workflow. Update the epic workflow tracking example (lines 239-253) to use `a1b2c3-user-auth` paths and `user-auth-N` change IDs.

**File 9: `plugin/skills/planning/SKILL.md`**

- Update `changes/YYYY/MM/DD/<workflow-id>/` path references to `<id>-<name>` format.

**File 10: `plugin/skills/spec-solicitation/SKILL.md`**

- Update drafts-to-changes path references and change-ID examples to name-based format.

### 11-13. External Spec Integration & Spec Writing

**File 11: `plugin/skills/external-spec-integration/SKILL.md`**

- Line 18: Update `.sdd/workflows/<workflow-id>/` to `<id>-<name>`

**File 12: `plugin/skills/external-spec-integration/resources/workflow-steps.md`**

- Update Step 10 return summary: `workflow_id: a1b2c3` stays (the ID itself doesn't change), but update `change_id: a1b2-1` → `user-auth-1` and path examples
- Update Step 8-9 examples with name-based paths

**File 13: `plugin/skills/spec-writing/resources/frontmatter-validation.md`**

- Line 85: Update `changes/2026/02/05/a1b2c3/01-auth/SPEC.md` to `changes/2026/02/05/a1b2c3-user-auth/01-auth/SPEC.md`

### 14-18. Dependent Schemas

**Files 14-18:** Update `workflow_id` and `change_id` field descriptions in all dependent schema files to reflect name-based format. Specifically:
- `workflow_id` descriptions: note that directory format is `<id>-<name>`
- `change_id` descriptions: note that format is `<name>-<seq>` (e.g., `user-auth-1`)

### 19-25. Orchestration Specs

**File 19: `plugin/skills/orchestrators/change-orchestration/SKILL.md`**

- Line 123: Update change link format from `changes/YYYY/MM/DD/<workflow-id>/<seq>-<name>/` to `changes/YYYY/MM/DD/<id>-<name>/<seq>-<slug>/`

**File 20: `plugin/skills/orchestrators/change-orchestration/creation.md`**

Interactive flow changes:
- After Step 3 (Create Workflow), add Step 3a: prompt user for workflow name
  - Suggest a name derived from the change name (e.g., `--name user-auth` → suggest `user-auth`)
  - User confirms or provides their own
  - Pass `name` to `workflow-state.create_workflow`
- Update `create_workflow` invocation to include `name`
- Step 8 output: change `a1b2-1` → `user-auth-1`, paths from `a1b2c3/` → `a1b2c3-user-auth/`
- Step 12 output: change `Created workflow: a1b2c3` → `Created workflow: a1b2c3 (user-auth)`, update IDs and paths

External flow changes:
- After Step 7 (Create Workflow), add name prompt
  - Suggest name derived from spec title or first section heading
  - User confirms or provides their own
- Update all output examples with name-based IDs and paths

**File 21: `plugin/skills/orchestrators/change-orchestration/management.md`**

Status action:
- Add `Name: user-auth` line after `Workflow: a1b2c3` in status output
- Update all path examples from `a1b2c3/` to `a1b2c3-user-auth/`
- Update all change IDs from `a1b2-N` to `user-auth-N`

List action:
- Fix single-workflow assumption: the section currently says "List all changes in current workflow" — change to iterate all workflows
- Add workflow name to header: `CHANGES IN WORKFLOW a1b2c3 (user-auth)`
- If multiple workflows exist, list each with a header
- Add `workflow_id` to the flow step: "Read workflow state" → "Read workflow state for specified workflow (or all)"
- Update all ID and path examples

Continue action:
- Update "Resuming workflow a1b2c3..." → "Resuming workflow a1b2c3 (user-auth)..."
- Update all path and ID examples

**Files 22-24: spec-review.md, planning.md, implementation.md**

Update all output examples:
- Change IDs: `a1b2-N` → `user-auth-N`
- Paths: `a1b2c3/` → `a1b2c3-user-auth/`

**File 25: `plugin/skills/orchestrators/change-orchestration/verification.md`**

- Update all output examples (IDs + paths)
- Line 128: Fix `advance` invocation to pass `workflow_id`:
  ```yaml
  INVOKE workflow-state.advance with:
    workflow_id: <workflow_id>
  ```

### 26. Init Orchestration

**File 26: `plugin/skills/orchestrators/init-orchestration/SKILL.md`**

- Lines 323-328: Update Change ID format section from `<workflow-short>-<seq>` to `<name>-<seq>`, update example from `a1b2-1` to `user-auth-1`

### 27-29. Command Specs

**File 27: `plugin/commands/sdd.md`**

- Update active workflow display to include name alongside ID
- Lines 148-151: Tighten change-id inference for multi-workflow scenarios:
  - Add: "If multiple active workflows, use workflow name to disambiguate (e.g., `user-auth-1` clearly belongs to workflow `user-auth`)"
  - The name prefix in change IDs enables direct lookup without scanning all workflows

**File 28: `plugin/commands/sdd-run.md`**

- Update `change create` examples to show workflow name in output

**File 29: `plugin/commands/sdd-help.md`**

- Update workflow path references from `.sdd/workflows/<id>/` to `<id>-<name>/`

### 30-31. TypeScript Implementation

**File 30: `plugin/system/src/commands/workflow/check-gate.ts`**

- Lines 7-8: Update usage comment paths from `.sdd/workflows/a1b2c3/` to `.sdd/workflows/a1b2c3-user-auth/`
- No logic changes — check-gate reads `workflow.yaml` and validates item statuses; the `name` field is irrelevant to gating logic

**Note:** `plugin/system/src/commands/hook/prompt-commit.ts` was reviewed and needs no changes — `getContextDir` extracts `changes/YYYY/MM/DD/<dir>` (first 5 path segments), which works regardless of whether `<dir>` is `a1b2c3` or `a1b2c3-user-auth`.

## Dependencies

Execution order matters only between groups:

1. **File 1** (types) → must be first (defines the schema)
2. **Files 2-7** (core workflow-state specs + schemas) → define the API contract everything else depends on
3. **Files 8-18** (dependent skills + schemas) → consume the API
4. **Files 19-26** (orchestration + init) → reference the API and display workflow info
5. **Files 27-29** (commands) → user-facing surfaces
6. **Files 30-31** (TypeScript code) → implementation matches specs

Within each group, files are independent and can be done in any order. Build (`npm run build:plugin`) is required after File 30.

## Tests

No new tests. This task changes a type definition, a comment, and 28 markdown prompt files — no new runtime behavior. Verification is the AC grep commands and the build checks below.

## Verification

- [ ] `npm run typecheck:plugin` passes
- [ ] `npm run build:plugin` passes
- [ ] `npm test` passes (existing tests unbroken)
- [ ] All 18 acceptance criteria grep commands pass
- [ ] No remaining bare `<workflow-id>` path references in updated files
- [ ] No remaining `a1b2c3/` hardcoded examples in updated files (all should be `a1b2c3-user-auth/`)
- [ ] No remaining `a1b2-N` change ID examples (all should be `user-auth-N` or `<name>-N`)
