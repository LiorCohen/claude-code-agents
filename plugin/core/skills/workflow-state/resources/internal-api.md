# Internal API

Available operations:

## workflow_state.create_workflow(source, name)

Create a new workflow with unique ID and user-chosen name.

**Input:**
```yaml
source: external | interactive
name: user-auth  # Required. Lowercase alphanumeric + hyphens, 3-50 chars.
```

**Name Validation:**
- Pattern: `^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$`
- Name must be unique among active workflows

**Output:**
```yaml
workflow_id: a1b2c3
workflow_name: user-auth
workflow_path: sdd/workflows/a1b2c3-user-auth/
workflow_yaml_path: sdd/workflows/a1b2c3-user-auth/workflow.yaml
```

**Side Effects:**
- Creates `sdd/workflows/<id>-<name>/` directory
- Creates `workflow.yaml` with initial state (includes `name` field)
- Creates `drafts/` subdirectory
- Creates checkpoint commit: `checkpoint: workflow <id> (<name>) created`

## workflow_state.create_item(workflow_id, item_metadata)

Create a new item in the workflow.

**Input:**
```yaml
workflow_id: a1b2c3
id: 01-api-contracts
title: API Contracts
type: feature | epic
parent_id: 01-user-management  # Optional, for nested items
context_sections: ["## API Design"]
depends_on: []
```

**Output:**
```yaml
change_id: user-auth-1  # Derived from workflow name + sequence
location: sdd/workflows/a1b2c3-user-auth/drafts/01-api-contracts
```

**Side Effects:**
- Creates item directory in `drafts/`
- Creates `context.md` with extracted sections
- Updates `workflow.yaml` with new item
- Assigns change_id as `<workflow-name>-<seq>`

## workflow_state.list(workflow_id)

Returns all items with their statuses for the specified workflow (or all workflows if omitted).

**Input:**
```yaml
workflow_id: a1b2c3  # Optional. If omitted, lists items from all active workflows.
```

**Output:**
```yaml
items:
  - change_id: user-auth-1
    title: API Contracts
    type: feature
    spec_status: approved
    plan_status: in_progress
    impl_status: pending
    review_status: pending
    location: changes/2026/02/05/a1b2c3-user-auth/01-api-contracts
  - change_id: user-auth-2
    title: Auth Service
    type: feature
    spec_status: in_progress
    plan_status: pending
    impl_status: pending
    review_status: pending
    location: sdd/workflows/a1b2c3-user-auth/drafts/01-user-management/02-auth-service
```

## workflow_state.get_current(workflow_id)

Returns current item being worked on for the specified workflow.

**Input:**
```yaml
workflow_id: a1b2c3  # Required.
```

**Output:**
```yaml
change_id: user-auth-1
title: API Contracts
type: feature
spec_status: ready_for_review
plan_status: pending
impl_status: pending
review_status: pending
substep: null
location: changes/2026/02/05/a1b2c3-user-auth/01-api-contracts
context_path: sdd/workflows/a1b2c3-user-auth/drafts/01-user-management/01-api-contracts/context.md
```

## workflow_state.advance(workflow_id)

Move to next item in order. Returns the new current item.

**Input:**
```yaml
workflow_id: a1b2c3  # Required.
```

**Output:**
```yaml
change_id: user-auth-2
title: Auth Service
type: feature
status: pending
previous: user-auth-1
```

**Side Effects:**
- Updates `current` in `workflow.yaml`

## workflow_state.update_status(change_id, field, status)

Update a specific status field in workflow.yaml. Validates state transitions and phase gating.

**Input:**
```yaml
change_id: user-auth-1
field: spec_status | plan_status | impl_status | review_status
status: <valid status for field>
```

**Output:**
```yaml
success: true
field: spec_status
previous_status: in_progress
new_status: approved
```

**Side Effects:**
- Updates `workflow.yaml`
- Updates `progress` aggregates
- Creates checkpoint commit

**Valid Transitions per Field:**

spec_status:
- `pending` → `in_progress`
- `in_progress` → `ready_for_review`
- `ready_for_review` → `approved`
- `approved` → `needs_rereview` (when dependency changes)

plan_status:
- `pending` → `in_progress` (requires: ALL specs approved)
- `in_progress` → `approved`

impl_status:
- `pending` → `in_progress` (requires: ALL plans approved)
- `in_progress` → `complete`

review_status:
- `pending` → `ready_for_review` (requires: impl_status complete)
- `ready_for_review` → `approved`
- `ready_for_review` → `changes_requested`

## workflow_state.update_substep(change_id, substep)

Update the current substep within spec creation.

**Input:**
```yaml
change_id: user-auth-1
substep: transformation | discovery | solicitation | writing
```

**Side Effects:**
- Updates `substep` field in item
- Updates `step` field in workflow if needed

## workflow_state.get_progress(workflow_id)

Returns aggregate progress for the specified workflow.

**Input:**
```yaml
workflow_id: a1b2c3  # Required.
```

**Output:**
```yaml
phase: spec
step: spec_creation
progress:
  total_items: 9
  specs_completed: 3
  specs_pending: 6
  plans_completed: 0
  plans_pending: 9
  implemented: 0
  reviewed: 0
phase_complete: false
next_phase_blocked: true
blocking_reason: "6 specs still pending"
```

## workflow_state.check_phase_gate(workflow_id, target_phase)

Check if the workflow can advance to a target phase.

**Input:**
```yaml
workflow_id: a1b2c3  # Required.
target_phase: plan | implement | review
```

**Output:**
```yaml
can_advance: false
blocking_items:
  - change_id: user-auth-4
    title: Analytics
    spec_status: in_progress
    reason: "Spec not approved"
  - change_id: user-auth-5
    title: Settings
    spec_status: pending
    reason: "Spec not started"
message: "Cannot start planning - 2 specs not approved"
```

## workflow_state.regress(change_id, to_phase, reason)

Regress an item to an earlier phase. Archives discarded work.

**Input:**
```yaml
change_id: user-auth-1
to_phase: spec | plan
reason: "Need to add additional auth method"
```

**Output:**
```yaml
success: true
from_phase: implement
to_phase: spec
archived_to: sdd/archive/workflow-regressions/20260205-1430-user-auth-1-impl/
cascade_effects:
  - change_id: user-auth-2
    current_spec_status: approved
    new_spec_status: needs_rereview
    reason: "Depends on user-auth-1 which regressed"
```

**Side Effects:**
- Archives implementation via system CLI: `<plugin-root>/system/system-run.sh archive store --source <prepared-dir> --type workflow-regression --json`
- Uses `git stash` for uncommitted changes
- Creates patch for committed-but-not-pushed changes
- Updates item's status fields
- Flags dependent items for re-review
- Creates checkpoint commit

## workflow_state.flag_dependents(change_id)

Flag all items that depend on a changed item.

**Input:**
```yaml
change_id: user-auth-1
```

**Output:**
```yaml
flagged:
  - change_id: user-auth-2
    previous_spec_status: approved
    new_spec_status: needs_rereview
  - change_id: user-auth-3
    previous_spec_status: approved
    new_spec_status: needs_rereview
```

**Side Effects:**
- Updates `spec_status` to `needs_rereview` for dependent items
- Updates progress aggregates

## workflow_state.get_context(change_id)

Return context.md content for solicitation.

**Output:**
```yaml
context: |
  ## API Design

  Content extracted from external spec...
has_context: true
```

## workflow_state.save_spec(change_id, content)

Write SPEC.md to item folder (in drafts/).

**Input:**
```yaml
change_id: user-auth-1
content: |
  ---
  title: API Contracts
  ...
  ---

  # API Contracts
  ...
```

**Side Effects:**
- Writes `SPEC.md` to drafts location
- Creates checkpoint commit: `checkpoint: <change_id> spec created`

## workflow_state.ready_for_review(change_id)

Move item from drafts to changes/. Sets `spec_status` to `ready_for_review`.

**Input:**
```yaml
change_id: user-auth-1
```

**Output:**
```yaml
new_location: changes/2026/02/05/a1b2c3-user-auth/01-api-contracts
sequence_number: 1  # NN- prefix within workflow
```

**Side Effects:**
- Determines next sequence number within workflow
- Moves item folder from `sdd/workflows/<id>-<name>/drafts/` to `changes/YYYY/MM/DD/<id>-<name>/NN-slug/`
- Updates `workflow.yaml` with new location
- Updates `changes/INDEX.md` with new entry
- Sets `spec_status` to `ready_for_review`
- Deletes `solicitation-workflow.yaml` from drafts (cleanup)
- Preserves `context.md` in drafts for reference
- Creates checkpoint commit: `checkpoint: <change_id> ready for review`

## workflow_state.save_plan(change_id, content)

Write PLAN.md to item folder (now in changes/).

**Input:**
```yaml
change_id: user-auth-1
content: |
  ---
  title: API Contracts - Implementation Plan
  ...
  ---

  ## Overview
  ...
```

**Side Effects:**
- Writes `PLAN.md` to changes location
- Creates checkpoint commit: `checkpoint: <change_id> plan created`

## workflow_state.complete_item(change_id)

Mark item as complete. Item already in changes/.

**Input:**
```yaml
change_id: user-auth-1
```

**Side Effects:**
- Sets `review_status` to `approved`
- Updates `progress` aggregates (reviewed count)
- Removes entry from `workflow.yaml` items array (keeps manifest lean)
- Updates `INDEX.md` to show completion
- If all items complete: deletes entire `sdd/workflows/<id>-<name>/` directory
- Creates checkpoint commit: `checkpoint: <change_id> complete`

## workflow_state.revise_decomposition(revision)

Revise the decomposition structure (merge, split, add, remove changes).

**Input:**
```yaml
revision_type: merge | split | add | remove
items:
  - user-auth-2   # For merge: list items to combine
  - user-auth-3
target_id: user-auth-2  # For merge: which ID survives
new_title: "User Authentication"  # For merge: combined title
reason: "These changes heavily overlap in the session model"
```

**Output:**
```yaml
success: true
revision_type: merge
affected_items:
  - change_id: user-auth-2
    action: preserved_as_target
  - change_id: user-auth-3
    action: archived
    archive_path: sdd/archive/revised-specs/20260205-1430-a1b2c3-user-auth-03-password-reset/
rereviews_needed:
  - change_id: user-auth-4
    reason: "Dependency on merged item"
progress_update:
  previous_total: 9
  new_total: 8
```

**Side Effects:**
- For merge: archives removed spec via system CLI: `<plugin-root>/system/system-run.sh archive store --source <draft-dir> --type revised-spec --json`
- Updates `workflow.yaml` item structure
- Flags affected approved specs for re-review
- Updates progress aggregates
- Creates checkpoint commit

## workflow_state.checkpoint(message, files)

Create checkpoint commit on feature branch.

**Input:**
```yaml
message: "checkpoint: user-auth-1 spec created"
files:
  - sdd/workflows/a1b2c3-user-auth/drafts/01-api-contracts/SPEC.md
  - sdd/workflows/a1b2c3-user-auth/workflow.yaml
```

**Behavior:**
- Uses `--no-verify` to skip hooks
- No-op if on main/master branch
- Only stages workflow-related files (`sdd/`, `changes/`, implementation files)

## Backward Compatibility

When loading a `workflow.yaml` without a `name` field (pre-name workflows):
- Derive `name` from the first item's title, slugified (e.g., "API Contracts" → `api-contracts`)
- Write the derived `name` back to `workflow.yaml`
- Directory remains as-is (no rename) — only new workflows get `<id>-<name>` directories
- Change IDs remain in their original format — only new items get name-based IDs
