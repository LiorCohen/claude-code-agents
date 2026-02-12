---
name: workflow-state
description: Internal skill for managing workflow lifecycle state in .sdd/workflows/. Provides session-independent, resumable workflow tracking.
user-invocable: false
---

# Workflow State Skill

## Purpose

Manages `.sdd/workflows/<workflow-id>/` state - tracking where each item is in the solicitation → review → approval → implementation lifecycle.

**IMPORTANT**: This is completely separate from:
- The marketplace-level `tasks` skill (manages `.tasks/` directory for project backlog)
- The top-level `.tasks/` directory (issue tracking, planning)

This is **process state management**, not project task management.

## Core Principle: Zero Session Context

**ALL workflow state is persisted in `.sdd/` files.** A new session must be able to resume with ZERO knowledge of what happened before:
- No conversation history
- No in-memory state
- No assumptions

Read the files, know the state. This enables aggressive context compaction and allows users to clear sessions freely.

## Directory Structure

```text
.sdd/
├── sdd-settings.yaml
├── archive/
│   ├── external-specs/         # External specs archived here (read-only)
│   │   └── 20260205-1430-feature-spec.md  # yyyymmdd-HHmm-lowercased-filename.md
│   ├── revised-specs/          # Specs removed during decomposition revision
│   │   └── 20260205-1430-a1b2c3-03-password-reset/
│   │       └── SPEC.md
│   └── workflow-regressions/   # Work archived during phase regression
│       └── 20260205-1430-a1b2-1-impl/
│           ├── changes.patch   # Git patch for committed changes
│           ├── stash.patch     # Git stash for uncommitted changes
│           ├── src/            # Implementation files
│           └── metadata.yaml   # Regression context
└── workflows/                  # Multiple concurrent workflows supported
    ├── a1b2c3/                 # One workflow (user A, branch feature-x)
    │   ├── workflow.yaml       # This workflow's state
    │   └── drafts/
    │       ├── 01-user-management/
    │       │   ├── context.md
    │       │   ├── 01-api-contracts/
    │       │   │   └── context.md
    │       │   └── 02-backend-service/
    │       │       └── context.md
    │       └── 02-notifications/
    │           └── context.md
    └── x7y8z9/                 # Another workflow (user B, branch feature-y)
        ├── workflow.yaml
        └── drafts/...
```

### Regression Archive Structure

When work is archived during regression:

```yaml
# .sdd/archive/workflow-regressions/20260205-1430-a1b2-1-impl/metadata.yaml
change_id: a1b2-1
from_phase: implement
to_phase: spec
reason: "Need to add OAuth support"
timestamp: 2026-02-05T14:30:00Z
git_branch: feature/task-85-external-spec
git_commit: abc123def  # Last commit before regression
files_archived:
  - src/auth/login.ts
  - src/auth/session.ts
  - tests/auth/login.test.ts
```

## workflow.yaml Schema

```yaml
id: a1b2c3                      # Short unique workflow ID (used in changes/ path)
source: external | interactive
created: YYYY-MM-DD
current: 01-user-management/01-api-contracts  # Path to current item

# High-level phase (matches workflow diagram)
phase: spec                     # spec | plan | implement | review

# Detailed step within phase
step: spec_creation             # See "Step Values" below

# Aggregate progress tracking
progress:
  total_items: 5
  specs_completed: 1
  specs_pending: 4
  plans_completed: 0
  plans_pending: 5
  implemented: 0
  reviewed: 0

items:
  # Hierarchical structure preserved (epics with children)
  - id: 01-user-management
    title: User Management
    type: epic
    context_sections: ["# User Management"]
    children:
      - id: 01-api-contracts
        change_id: a1b2-1       # Unique ID for user reference
        title: API Contracts
        type: feature
        location: changes/2026/02/05/a1b2c3/01-api-contracts
        context_sections: ["## API Design", "## Endpoints"]
        depends_on: []

        # Four separate status fields for granular tracking
        spec_status: approved    # pending | in_progress | ready_for_review | approved | needs_rereview
        plan_status: pending     # pending | in_progress | approved
        impl_status: pending     # pending | in_progress | complete
        review_status: pending   # pending | ready_for_review | approved | changes_requested

        # Substep tracking within spec creation
        substep: null            # transformation | discovery | solicitation | writing

      - id: 02-backend-service
        change_id: a1b2-2
        title: Backend Service
        type: feature
        location: .sdd/workflows/a1b2c3/drafts/01-user-management/02-backend-service
        context_sections: ["## Backend Logic", "## Data Model"]
        depends_on: [01-api-contracts]
        spec_status: in_progress
        plan_status: pending
        impl_status: pending
        review_status: pending
        substep: solicitation    # Currently in solicitation

  - id: 02-notifications
    title: Notifications
    type: epic
    depends_on: [01-user-management]
    children: [...]
```

### Step Values

| Phase | Valid Steps |
|-------|-------------|
| `spec` | `transform`, `discover`, `decompose`, `spec_creation`, `spec_review` |
| `plan` | `plan_creation`, `plan_review` |
| `implement` | `implementing`, `testing` |
| `review` | `reviewing` |

### Status Field Details

**spec_status:**
- `pending` - Not yet started
- `in_progress` - Actively working on spec
- `ready_for_review` - SPEC.md created, awaiting user review
- `approved` - User approved spec (resting state for phase gating)
- `needs_rereview` - Upstream dependency changed, needs review

**plan_status:**
- `pending` - Cannot start until spec_status is approved
- `in_progress` - Creating PLAN.md
- `approved` - User approved plan

**impl_status:**
- `pending` - Cannot start until plan_status is approved
- `in_progress` - Implementation in progress
- `complete` - Implementation finished

**review_status:**
- `pending` - Implementation not complete
- `ready_for_review` - Ready for user review
- `approved` - User approved, change complete
- `changes_requested` - User requested changes (regression to impl)

### Regression Tracking

When a phase regression occurs, track it:

```yaml
regression:
  from_phase: implement
  to_phase: spec
  reason: "Need to add OAuth support"
  timestamp: 2026-02-05T14:30:00Z
  preserved_work:
    - path: .sdd/archive/workflow-regressions/20260205-1430-02-auth-impl/
      type: implementation
      description: "Partial password auth implementation"
```

## Status Progression (Four-Field Model)

The workflow uses four separate status fields for granular tracking:

### Spec Phase
1. `spec_status: pending` → `in_progress` → `ready_for_review` → `approved`

### Plan Phase (only after ALL specs approved)
2. `plan_status: pending` → `in_progress` → `approved`

### Implementation Phase (only after ALL plans approved)
3. `impl_status: pending` → `in_progress` → `complete`

### Review Phase (after implementation)
4. `review_status: pending` → `ready_for_review` → `approved`

**Key Difference from Previous Design:**

The old design had a single `status` field with immediate `spec_approved → plan_review` transition. The new design:

1. **`spec_status: approved` IS a resting state** - Phase gating requires ALL specs approved before ANY planning starts
2. **Plan phase is separate** - Only begins after checkpoint "All specs approved"
3. **Review phase is explicit** - User must approve implementation, not just verify tests pass

### Phase Gating Rules

| Gate | Condition |
|------|-----------|
| Start planning | ALL items have `spec_status: approved` |
| Start implementing | ALL items have `plan_status: approved` |
| Complete workflow | ALL items have `review_status: approved` |
| Approve spec | No OPEN questions in Requirements Discovery section |
| Approve spec | No dependencies with `spec_status: needs_rereview` |

### Regression Transitions

| From | To | Trigger | Effect |
|------|-----|---------|--------|
| plan → spec | `/sdd-change regress <id> --to spec` | Plan invalidated, spec needs revision |
| impl → plan | `/sdd-change regress <id> --to plan` | Impl discarded, plan invalidated |
| impl → spec | `/sdd-change regress <id> --to spec` | Impl discarded, plan invalidated, spec needs revision |
| review → impl | `/sdd-change request-changes <id>` | Implementation needs changes |
| review → spec | `/sdd-change regress <id> --to spec` | Major revision needed |

Regression archives discarded work to `.sdd/archive/workflow-regressions/`.

## Internal API

Available operations:

### workflow_state.create_workflow(source)

Create a new workflow with unique ID.

**Input:**
```yaml
source: external | interactive
```

**Output:**
```yaml
workflow_id: a1b2c3
workflow_path: .sdd/workflows/a1b2c3/
workflow_yaml_path: .sdd/workflows/a1b2c3/workflow.yaml
```

**Side Effects:**
- Creates `.sdd/workflows/<id>/` directory
- Creates `workflow.yaml` with initial state
- Creates `drafts/` subdirectory
- Creates checkpoint commit: `checkpoint: workflow <id> created`

### workflow_state.create_item(workflow_id, item_metadata)

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
change_id: a1b2-1  # Assigned by skill
location: .sdd/workflows/a1b2c3/drafts/01-api-contracts
```

**Side Effects:**
- Creates item directory in `drafts/`
- Creates `context.md` with extracted sections
- Updates `workflow.yaml` with new item
- Assigns unique change_id within workflow

### workflow_state.list()

Returns all items with their statuses.

**Output:**
```yaml
items:
  - change_id: a1b2-1
    title: API Contracts
    type: feature
    spec_status: approved
    plan_status: in_progress
    impl_status: pending
    review_status: pending
    location: changes/2026/02/05/a1b2c3/01-api-contracts
  - change_id: a1b2-2
    title: Backend Service
    type: feature
    spec_status: in_progress
    plan_status: pending
    impl_status: pending
    review_status: pending
    location: .sdd/workflows/a1b2c3/drafts/01-user-management/02-backend-service
```

### workflow_state.get_current()

Returns current item being worked on.

**Output:**
```yaml
change_id: a1b2-1
title: API Contracts
type: feature
spec_status: ready_for_review
plan_status: pending
impl_status: pending
review_status: pending
substep: null
location: changes/2026/02/05/a1b2c3/01-api-contracts
context_path: .sdd/workflows/a1b2c3/drafts/01-user-management/01-api-contracts/context.md
```

### workflow_state.advance()

Move to next item in order. Returns the new current item.

**Output:**
```yaml
change_id: a1b2-2
title: Backend Service
type: feature
status: pending
previous: a1b2-1
```

**Side Effects:**
- Updates `current` in `workflow.yaml`

### workflow_state.update_status(change_id, field, status)

Update a specific status field in workflow.yaml. Validates state transitions and phase gating.

**Input:**
```yaml
change_id: a1b2-1
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

### workflow_state.update_substep(change_id, substep)

Update the current substep within spec creation.

**Input:**
```yaml
change_id: a1b2-1
substep: transformation | discovery | solicitation | writing
```

**Side Effects:**
- Updates `substep` field in item
- Updates `step` field in workflow if needed

### workflow_state.get_progress()

Returns aggregate progress for the workflow.

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

### workflow_state.check_phase_gate(target_phase)

Check if the workflow can advance to a target phase.

**Input:**
```yaml
target_phase: plan | implement | review
```

**Output:**
```yaml
can_advance: false
blocking_items:
  - change_id: a1b2-4
    title: Analytics
    spec_status: in_progress
    reason: "Spec not approved"
  - change_id: a1b2-5
    title: Settings
    spec_status: pending
    reason: "Spec not started"
message: "Cannot start planning - 2 specs not approved"
```

### workflow_state.regress(change_id, to_phase, reason)

Regress an item to an earlier phase. Archives discarded work.

**Input:**
```yaml
change_id: a1b2-1
to_phase: spec | plan
reason: "Need to add OAuth support"
```

**Output:**
```yaml
success: true
from_phase: implement
to_phase: spec
archived_to: .sdd/archive/workflow-regressions/20260205-1430-a1b2-1-impl/
cascade_effects:
  - change_id: a1b2-2
    current_spec_status: approved
    new_spec_status: needs_rereview
    reason: "Depends on a1b2-1 which regressed"
```

**Side Effects:**
- Archives implementation via system CLI: `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" archive store --source <prepared-dir> --type workflow-regression --json`
- Uses `git stash` for uncommitted changes
- Creates patch for committed-but-not-pushed changes
- Updates item's status fields
- Flags dependent items for re-review
- Creates checkpoint commit

### workflow_state.flag_dependents(change_id)

Flag all items that depend on a changed item.

**Input:**
```yaml
change_id: a1b2-1
```

**Output:**
```yaml
flagged:
  - change_id: a1b2-2
    previous_spec_status: approved
    new_spec_status: needs_rereview
  - change_id: a1b2-3
    previous_spec_status: approved
    new_spec_status: needs_rereview
```

**Side Effects:**
- Updates `spec_status` to `needs_rereview` for dependent items
- Updates progress aggregates

### workflow_state.get_context(change_id)

Return context.md content for solicitation.

**Output:**
```yaml
context: |
  ## API Design

  Content extracted from external spec...
has_context: true
```

### workflow_state.save_spec(change_id, content)

Write SPEC.md to item folder (in drafts/).

**Input:**
```yaml
change_id: a1b2-1
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

### workflow_state.ready_for_review(change_id)

Move item from drafts to changes/. Sets `spec_status` to `ready_for_review`.

**Input:**
```yaml
change_id: a1b2-1
```

**Output:**
```yaml
new_location: changes/2026/02/05/a1b2c3/01-api-contracts
sequence_number: 1  # NN- prefix within workflow
```

**Side Effects:**
- Determines next sequence number within workflow
- Moves item folder from `.sdd/workflows/<wf-id>/drafts/` to `changes/YYYY/MM/DD/<wf-id>/NN-slug/`
- Updates `workflow.yaml` with new location
- Updates `changes/INDEX.md` with new entry
- Sets `spec_status` to `ready_for_review`
- Deletes `solicitation-workflow.yaml` from drafts (cleanup)
- Preserves `context.md` in drafts for reference
- Creates checkpoint commit: `checkpoint: <change_id> ready for review`

### workflow_state.save_plan(change_id, content)

Write PLAN.md to item folder (now in changes/).

**Input:**
```yaml
change_id: a1b2-1
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

### workflow_state.complete_item(change_id)

Mark item as complete. Item already in changes/.

**Input:**
```yaml
change_id: a1b2-1
```

**Side Effects:**
- Sets `review_status` to `approved`
- Updates `progress` aggregates (reviewed count)
- Removes entry from `workflow.yaml` items array (keeps manifest lean)
- Updates `INDEX.md` to show completion
- If all items complete: deletes entire `.sdd/workflows/<workflow-id>/` directory
- Creates checkpoint commit: `checkpoint: <change_id> complete`

### workflow_state.revise_decomposition(revision)

Revise the decomposition structure (merge, split, add, remove changes).

**Input:**
```yaml
revision_type: merge | split | add | remove
items:
  - a1b2-2   # For merge: list items to combine
  - a1b2-3
target_id: a1b2-2  # For merge: which ID survives
new_title: "User Authentication"  # For merge: combined title
reason: "These changes heavily overlap in the session model"
```

**Output:**
```yaml
success: true
revision_type: merge
affected_items:
  - change_id: a1b2-2
    action: preserved_as_target
  - change_id: a1b2-3
    action: archived
    archive_path: .sdd/archive/revised-specs/20260205-1430-a1b2c3-03-password-reset/
rereviews_needed:
  - change_id: a1b2-4
    reason: "Dependency on merged item"
progress_update:
  previous_total: 9
  new_total: 8
```

**Side Effects:**
- For merge: archives removed spec via system CLI: `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" archive store --source <draft-dir> --type revised-spec --json`
- Updates `workflow.yaml` item structure
- Flags affected approved specs for re-review
- Updates progress aggregates
- Creates checkpoint commit

### workflow_state.checkpoint(message, files)

Create checkpoint commit on feature branch.

**Input:**
```yaml
message: "checkpoint: a1b2-1 spec created"
files:
  - .sdd/workflows/a1b2c3/drafts/01-api-contracts/SPEC.md
  - .sdd/workflows/a1b2c3/workflow.yaml
```

**Behavior:**
- Uses `--no-verify` to skip hooks
- No-op if on main/master branch
- Only stages workflow-related files (`.sdd/`, `changes/`, implementation files)

## Checkpoint Triggers

Checkpoints are created automatically on workflow state changes:

| Event | Commit Message | Files Committed |
|-------|----------------|-----------------|
| Workflow created | `checkpoint: workflow <id> created` | `workflow.yaml` |
| Spec solicitation progress | `checkpoint: <change-id> solicitation progress` | `solicitation-workflow.yaml` |
| SPEC.md created | `checkpoint: <change-id> spec created` | `SPEC.md`, `workflow.yaml` |
| SPEC.md approved | `checkpoint: <change-id> spec approved` | `workflow.yaml` |
| All specs approved | `checkpoint: all specs approved, ready for planning` | `workflow.yaml` |
| PLAN.md created | `checkpoint: <change-id> plan created` | `PLAN.md`, `workflow.yaml` |
| PLAN.md approved | `checkpoint: <change-id> plan approved` | `workflow.yaml` |
| All plans approved | `checkpoint: all plans approved, ready for implementation` | `workflow.yaml` |
| Item moved to changes/ | `checkpoint: <change-id> ready for review` | All files, `workflow.yaml` |
| Implementation progress | `checkpoint: <change-id> implementation progress` | Changed files |
| Implementation complete | `checkpoint: <change-id> implementation complete` | Changed files, `workflow.yaml` |
| Review approved | `checkpoint: <change-id> review approved` | `workflow.yaml` |
| Item complete | `checkpoint: <change-id> complete` | `workflow.yaml` |
| Regression | `checkpoint: <change-id> regressed to <phase>` | `workflow.yaml`, archived files |
| Decomposition revised | `checkpoint: decomposition revised (<type>)` | `workflow.yaml`, archived files |

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts operation type and operation-specific parameters for workflow lifecycle management.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns workflow ID, current phase, and progress tracking.

## Workflow ID Generation

Workflow IDs are short, unique identifiers:

1. Generate 6 random alphanumeric characters (a-z, 0-9)
2. Check for collision with existing workflows
3. If collision, regenerate
4. Format: `a1b2c3`, `x7y8z9`, etc.

## Change ID Format

Change IDs are workflow-scoped:

- Format: `<workflow-short>-<seq>` (e.g., `a1b2-1`, `a1b2-2`)
- `workflow-short`: First 4 characters of workflow ID
- `seq`: Sequence number within workflow (1, 2, 3, ...)
- Unique across concurrent workflows (different workflows = different prefix)

## Epic Handling

- Each epic is an item with `type: epic` and `children` array
- Children are features within the epic
- Epic status tracks overall progress:
  - `pending` until first child starts
  - `complete` when all children complete
- Epic itself doesn't get a change_id - only leaf features get change_ids
- Epic folder in `changes/` contains child change folders

## Cleanup Behavior

- When item moves from `drafts/` to `changes/`:
  - Keep `context.md` in drafts for reference
  - Delete `solicitation-workflow.yaml`
- When item is marked `complete`:
  - Remove from `workflow.yaml` items array
- When all items complete:
  - Delete entire `.sdd/workflows/<workflow-id>/` directory including `workflow.yaml`
- Completed items remain in `changes/` permanently (that's the source of truth)

## INDEX.md Handling

- `changes/INDEX.md` is updated when items move to `changes/` directory
- No separate INDEX.md in `.sdd/workflows/` - workflow.yaml is the source of truth
- `workflow_state.ready_for_review()` updates `changes/INDEX.md` with new entry

## Consumers

- `sdd-change` command — creates workflows and manages lifecycle
- `spec-solicitation` skill — reads context, saves specs
- `change-creation` skill — saves plans
- `external-spec-integration` skill — creates workflows and items from decomposition

## Recovery Scenarios

| Scenario | Recovery |
|----------|----------|
| Session interrupted mid-solicitation | Resume from `solicitation-workflow.yaml`, last checkpoint has partial progress |
| Context compacted during implementation | Resume from `workflow.yaml`, implementation files in last checkpoint |
| Crash during spec creation | `SPEC.md` or `solicitation-workflow.yaml` in last checkpoint |
| Power loss | Git reflog + checkpoints ensure < 1 question of lost work |
