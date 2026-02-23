---
name: workflow-state
description: Internal skill for managing workflow lifecycle state in sdd/workflows/. Provides session-independent, resumable workflow tracking.
user-invocable: false
---

# Workflow State Skill

## Purpose

Manages `sdd/workflows/<id>-<name>/` state - tracking where each item is in the solicitation → review → approval → implementation lifecycle.

This is **process state management**, not project task management.

## Core Principle: Zero Session Context

**ALL workflow state is persisted in `sdd/` files.** A new session must be able to resume with ZERO knowledge of what happened before:
- No conversation history
- No in-memory state
- No assumptions

Read the files, know the state. This enables aggressive context compaction and allows users to clear sessions freely.

## Directory Structure

```text
sdd/
├── sdd-settings.yaml
├── archive/
│   ├── external-specs/         # External specs archived here (read-only)
│   │   └── 20260205-1430-feature-spec.md  # yyyymmdd-HHmm-lowercased-filename.md
│   ├── revised-specs/          # Specs removed during decomposition revision
│   │   └── 20260205-1430-a1b2c3-user-auth-03-password-reset/
│   │       └── SPEC.md
│   └── workflow-regressions/   # Work archived during phase regression
│       └── 20260205-1430-user-auth-1-impl/
│           ├── changes.patch   # Git patch for committed changes
│           ├── stash.patch     # Git stash for uncommitted changes
│           ├── src/            # Implementation files
│           └── metadata.yaml   # Regression context
└── workflows/                  # Multiple concurrent workflows supported
    ├── a1b2c3-user-auth/       # One workflow (user A, branch feature-x)
    │   ├── workflow.yaml       # This workflow's state
    │   └── drafts/
    │       ├── 01-user-management/
    │       │   ├── context.md
    │       │   ├── 01-api-contracts/
    │       │   │   └── context.md
    │       │   └── 02-auth-service/
    │       │       └── context.md
    │       └── 02-notifications/
    │           └── context.md
    └── x7y8z9-notifications/   # Another workflow (user B, branch feature-y)
        ├── workflow.yaml
        └── drafts/...
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

## Resource Files

For detailed guidance, read these on-demand:
- [internal-api.md](resources/internal-api.md) — All 15 operations with input/output schemas
- [workflow-yaml-schema.md](resources/workflow-yaml-schema.md) — Full schema documentation with all fields
- [recovery.md](resources/recovery.md) — Checkpoint triggers, recovery scenarios, regression handling

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

Change IDs are derived from the workflow name:

- Format: `<name>-<seq>` (e.g., `user-auth-1`, `user-auth-2`)
- `name`: The workflow's user-chosen name
- `seq`: Sequence number within workflow (1, 2, 3, ...)
- Unique across concurrent workflows (different workflows = different name prefix)

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
  - Delete entire `sdd/workflows/<id>-<name>/` directory including `workflow.yaml`
- Completed items remain in `changes/` permanently (that's the source of truth)

## INDEX.md Handling

- `changes/INDEX.md` is updated when items move to `changes/` directory
- No separate INDEX.md in `sdd/workflows/` - workflow.yaml is the source of truth
- `workflow_state.ready_for_review()` updates `changes/INDEX.md` with new entry

## Consumers

- `/sdd` orchestrator — creates workflows and manages lifecycle
- `spec-solicitation` skill — reads context, saves specs
- `change-creation` skill — saves plans
- `external-spec-integration` skill — creates workflows and items from decomposition
