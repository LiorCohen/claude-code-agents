---
id: 152
title: Workflows must have user-chosen names
status: plan-review
priority: high
created: 2026-02-17 20:00 UTC
depends_on: []
blocks: []
---

# Task 152: Workflows must have user-chosen names

## Description

Workflows contain and orchestrate changes through the SDD lifecycle. They are currently identified only by auto-generated 6-character alphanumeric IDs (e.g., `a1b2c3`) with no human-readable name. Add a required `name` field so every workflow has a short, memorable label chosen by the user.

## Motivation

Without names, workflows are opaque. Users see `a1b2c3` and have to look at the first item's title to guess what a workflow is about. Workflows contain and coordinate changes — they can span multiple PRs and branches, orchestrate specs, plans, and implementations for each change, and live on the main branch or a workflow-dedicated side branch (e.g., in teams where main must stay stable). A user-chosen name makes the container instantly recognizable in listings and status displays.

## Scope

- Add `name: string` to the `WorkflowState` type
- Change workflow directory layout from `.sdd/workflows/<id>/` to `.sdd/workflows/<id>-<name>/`
- Change completed changes path from `changes/YYYY/MM/DD/<wf-id>/` to `changes/YYYY/MM/DD/<id>-<name>/`
- Derive change IDs from workflow name (e.g., `user-auth-1`) instead of auto-generated short ID
- Add `name` to the workflow YAML schema documentation
- Update the workflow creation API to accept and require `name`
- Update the creation orchestration flow to prompt the user for a name
- Update all path references from bare `<id>` to `<id>-<name>` directory format
- Update all display/output surfaces that show workflow info to include the name
- Update the input/output JSON schemas
- Fix multi-workflow assumptions: add `workflow_id` parameter to `list()`, `get_current()`, `advance()`, `get_progress()`, and `check_phase_gate()` in the internal API
- Fix `list` action in management orchestrator to handle multiple workflows
- Tighten change-id inference logic in `sdd.md` for multi-workflow scenarios

## Constraints

- The name is required — workflows cannot be created without one
- The creation flow should suggest a name (e.g., derived from the spec title or first item) but the user must confirm or provide their own
- Names must be unique across active workflows (completed/archived workflows don't count)
- Name validation: lowercase alphanumeric and hyphens, 3–50 characters (suitable for display and safe for filesystem/branch contexts)
- The directory uses both ID and name: `.sdd/workflows/<id>-<name>/`, replacing the old `<id>` directory scheme
- Change IDs derive from the workflow name (e.g., `user-auth-1`, `user-auth-2`) instead of the auto-generated short ID
- The existing `--name` flag on `sdd-run change create` provides the change name; during creation the orchestration must also prompt for the workflow name (these are distinct — a workflow named `user-auth` might contain a change named `api-contracts`)
- Backward compatibility: when loading a workflow YAML that has no `name` field, derive one from the first item's title (slugified) rather than failing

## Changes

> In SDD, specs are the source of truth for what's inside components. They provide the exhaustive, definitive, and authoritative answer to **Why** and **What**. Code covers **How**. Every change starts with specs — update the spec first, then make the code match.

**Specs (source of truth — change these first):**

Every component type has spec files that define Why and What. All specs must be updated before any code. Grouped by component type:

*Skill specs:*
- `plugin/skills/workflow-state/SKILL.md` — update `.sdd/workflows/<workflow-id>/` references (lines 11, 147) to `<id>-<name>` format, add `name` to workflow identity, update ID generation rules
- `plugin/skills/workflow-state/resources/workflow-yaml-schema.md` — add `name` as a required field, update directory layout, update all example paths and YAML samples
- `plugin/skills/workflow-state/resources/internal-api.md` — add `name` param to `create_workflow`, add uniqueness enforcement, change all path references, update change-ID derivation to `<name>-<seq>`, add backward-compat derivation, add `workflow_id` param to `list()`, `get_current()`, `advance()`, `get_progress()`, `check_phase_gate()` (fix single-workflow assumptions)
- `plugin/skills/workflow-state/resources/recovery.md` — update recovery scenarios with name-based paths
- `plugin/skills/change-creation/SKILL.md` — update `changes/YYYY/MM/DD/<id>-<name>/` path pattern and change-ID references
- `plugin/skills/planning/SKILL.md` — update `changes/YYYY/MM/DD/<workflow-id>/` path pattern to `<id>-<name>`
- `plugin/skills/spec-solicitation/SKILL.md` — update drafts-to-changes path references and example change IDs
- `plugin/skills/external-spec-integration/SKILL.md` — update `.sdd/workflows/<id>/` references to `<id>-<name>`, update output examples
- `plugin/skills/external-spec-integration/resources/workflow-steps.md` — update return summary examples (`a1b2c3`, `a1b2-1`)
- `plugin/skills/spec-writing/resources/frontmatter-validation.md` — update validation error example path (`a1b2c3`)
- `plugin/skills/orchestrators/change-orchestration/SKILL.md` — update change lookup paths and link format
- `plugin/skills/orchestrators/change-orchestration/creation.md` — prompt user for workflow name (both interactive and external flows), update output examples from `a1b2c3` to `<id>-<name>`
- `plugin/skills/orchestrators/change-orchestration/management.md` — update status display to show name, update path references, fix `list` action to handle multiple workflows (currently assumes single "current workflow")
- `plugin/skills/orchestrators/change-orchestration/spec-review.md` — update approve output examples (IDs + paths)
- `plugin/skills/orchestrators/change-orchestration/planning.md` — update approve/plan output examples (IDs + paths)
- `plugin/skills/orchestrators/change-orchestration/implementation.md` — update implement output examples (IDs + paths)
- `plugin/skills/orchestrators/change-orchestration/verification.md` — update verify/complete output examples (IDs + paths), fix `advance` call site (line 128) to pass `workflow_id`
- `plugin/skills/orchestrators/init-orchestration/SKILL.md` — update Change ID format section (`<workflow-short>-<seq>` → `<name>-<seq>`)

*Command specs:*
- `plugin/commands/sdd.md` — show workflow name in active workflow listings, tighten change-id inference logic for multi-workflow scenarios (lines 148-151)
- `plugin/commands/sdd-run.md` — document workflow name in change create examples
- `plugin/commands/sdd-help.md` — update workflow path references

*Schema specs:*
- `plugin/skills/workflow-state/schemas/input.schema.json` — add `name` property with validation pattern
- `plugin/skills/workflow-state/schemas/output.schema.json` — add `name` to workflow output
- `plugin/skills/change-creation/schemas/input.schema.json` — update `workflow_id` / `change_id` descriptions
- `plugin/skills/planning/schemas/input.schema.json` — update `workflow_id` / `change_id` descriptions
- `plugin/skills/external-spec-integration/schemas/input.schema.json` — update `workflow_id` description
- `plugin/skills/external-spec-integration/schemas/output.schema.json` — update `workflow_id` and `change_id` in output
- `plugin/skills/spec-solicitation/schemas/input.schema.json` — update `workflow_id` / `change_id` descriptions

**Implementation (code — makes the specs real):**
- `plugin/system/src/types/workflow.ts` — add `name` field to `WorkflowState`
- `plugin/system/src/commands/workflow/check-gate.ts` — update usage comment paths, consider adding `name` validation on parsed YAML
- `plugin/system/src/commands/hook/prompt-commit.ts` — review `changes/` path extraction logic for `<id>-<name>` directory format

## Acceptance Criteria

- [ ] `WorkflowState` type includes a required `name: string` field — verify with `grep 'name' plugin/system/src/types/workflow.ts`
- [ ] Workflow YAML schema docs list `name` as a required field — verify with `grep 'name' plugin/skills/workflow-state/resources/workflow-yaml-schema.md`
- [ ] Workflow directory layout uses `<id>-<name>`: `.sdd/workflows/<id>-<name>/` — verify with `grep 'workflows/' plugin/skills/workflow-state/resources/internal-api.md` shows `<id>-<name>` not bare `<id>`
- [ ] `create_workflow` API accepts and requires `name` — verify with `grep 'name' plugin/skills/workflow-state/resources/internal-api.md`
- [ ] Creation orchestration prompts the user for a workflow name — verify with `grep -i 'workflow.*name\|name.*workflow' plugin/skills/orchestrators/change-orchestration/creation.md` (currently returns 0; must not match existing `--name` flag for change names)
- [ ] Input schema includes `name` property — verify with `grep 'name' plugin/skills/workflow-state/schemas/input.schema.json`
- [ ] Output schema includes `name` in workflow output — verify with `grep 'name' plugin/skills/workflow-state/schemas/output.schema.json`
- [ ] Active workflow display includes the name — verify with `grep -i 'workflow.*name\|name.*workflow' plugin/commands/sdd.md` (currently returns 0; must not match existing `name: sdd` frontmatter or change `--name` flag)
- [ ] Name uniqueness is enforced among active workflows — verify with `grep -i 'name.*unique\|unique.*name' plugin/skills/workflow-state/resources/internal-api.md` (currently returns 0; existing "unique ID" mentions must not match)
- [ ] Completed changes path uses `<id>-<name>`: `changes/YYYY/MM/DD/<id>-<name>/` — verify with `grep 'changes/YYYY' plugin/skills/workflow-state/resources/internal-api.md` shows `<id>-<name>` not bare `<wf-id>`
- [ ] Change IDs derive from workflow name (e.g., `user-auth-1`) — verify with `grep 'change_id' plugin/skills/workflow-state/resources/internal-api.md`
- [ ] No remaining references to bare `.sdd/workflows/<id>/` or `<wf-id>` pattern in plugin specs/code (all should be `<id>-<name>`) — verify with `grep -rE 'workflows/.*<(id|wf-id|workflow-id)>/' plugin/ --include='*.md' --include='*.ts'` returns no matches
- [ ] No remaining hardcoded example IDs using bare ID directory format — verify with `grep -rn 'workflows/a1b2c3/' plugin/ --include='*.md' --include='*.ts'` returns no matches (currently returns 9+ matches across internal-api.md, workflow-yaml-schema.md, check-gate.ts, management.md)
- [ ] Backward compat: loading a workflow YAML without `name` derives one from the first item title — verify with `grep -i 'derive\|fallback\|migration' plugin/skills/workflow-state/resources/internal-api.md`
- [ ] All internal API operations accept `workflow_id` — verify with `grep -c 'workflow_id' plugin/skills/workflow-state/resources/internal-api.md` returns at least 8 (currently 3; adding `workflow_id` to `list`, `get_current`, `advance`, `get_progress`, `check_phase_gate` adds 5+)
- [ ] `list` action in management handles multiple workflows — verify with `grep -B2 -A10 'List all changes' plugin/skills/orchestrators/change-orchestration/management.md` shows iteration over all workflows (not just "current workflow")
- [ ] `advance` call site passes `workflow_id` — verify with `grep -A2 'advance' plugin/skills/orchestrators/change-orchestration/verification.md`
- [ ] Change-id inference in `sdd.md` handles multi-workflow disambiguation — verify with `grep -A8 'infer' plugin/commands/sdd.md` shows disambiguation logic that uses workflow name when multiple active workflows exist
