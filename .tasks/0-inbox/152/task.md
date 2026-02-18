---
id: 152
title: Workflows must have user-chosen names
status: inbox
priority: high
created: 2026-02-17 20:00 UTC
depends_on: []
blocks: []
---

# Task 152: Workflows must have user-chosen names

## Description

Workflows are currently identified only by auto-generated 6-character alphanumeric IDs (e.g., `a1b2c3`). They have no human-readable name. Add a required `name` field so every workflow has a short, memorable label chosen by the user.

## Motivation

Without names, workflows are opaque. Users see `a1b2c3` and have to look at the first item's title to understand what a workflow is about. A user-chosen name makes workflows instantly recognizable in listings, branch names, and status displays.

## Scope

- Add `name: string` to the `WorkflowState` type
- Add `name` to the workflow YAML schema documentation
- Update the workflow creation API to accept and require `name`
- Update the creation orchestration flow to prompt the user for a name
- Update all display/output surfaces that show workflow info to include the name
- Update the input/output JSON schemas

## Constraints

- The name must be chosen by the user, never auto-generated
- The name is required — workflows cannot be created without one
- Existing auto-generated IDs remain for internal references; name is for display

## Changes

- `plugin/system/src/types/workflow.ts` — add `name` field to `WorkflowState`
- `plugin/skills/workflow-state/resources/workflow-yaml-schema.md` — document `name`
- `plugin/skills/workflow-state/resources/internal-api.md` — add `name` param to `create_workflow`
- `plugin/skills/workflow-state/schemas/input.schema.json` — add `name` property
- `plugin/skills/workflow-state/schemas/output.schema.json` — add `name` to output
- `plugin/skills/orchestrators/change-orchestration/creation.md` — prompt user for name
- `plugin/commands/sdd.md` — show name in active workflow listings

## Acceptance Criteria

- [ ] `WorkflowState` type includes a required `name: string` field — verify with `grep 'name' plugin/system/src/types/workflow.ts`
- [ ] Workflow YAML schema docs list `name` as a required field — verify with `grep 'name' plugin/skills/workflow-state/resources/workflow-yaml-schema.md`
- [ ] `create_workflow` API accepts and requires `name` — verify with `grep 'name' plugin/skills/workflow-state/resources/internal-api.md`
- [ ] Creation orchestration prompts the user for a workflow name — verify with `grep -i 'name' plugin/skills/orchestrators/change-orchestration/creation.md`
- [ ] Input schema includes `name` property — verify with `grep 'name' plugin/skills/workflow-state/schemas/input.schema.json`
- [ ] Active workflow display includes the name — verify with `grep 'name' plugin/commands/sdd.md`
