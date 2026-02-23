---
name: change-orchestration
description: Orchestrates the full change lifecycle — routes actions to phase-specific sub-files.
user-invocable: false
---

# Change Orchestration

Orchestrates the full change lifecycle: create, spec review, planning, implementation, verification, and management operations.

## Input

Invoked by `sdd-run.md` with:
- `action` — The change action to perform
- `args` — Remaining arguments after the action

## Action Routing

| Action | Sub-file | Description |
|--------|----------|-------------|
| `create` | `creation.md` | Create a new change (interactive or external spec) |
| `approve spec` | `spec-review.md` | Approve SPEC.md, trigger PLAN.md creation |
| `answer` | `spec-review.md` | Answer an open question |
| `assume` | `spec-review.md` | Mark question as assumption |
| `plan` | `planning.md` | Begin planning phase (after ALL specs approved) |
| `approve plan` | `planning.md` | Approve PLAN.md, enable implementation |
| `implement` | `implementation.md` | Start implementation (requires plan_approved) |
| `verify` | `verification.md` | Verify implementation against spec |
| `review` | `verification.md` | Submit for user review |
| `status` | `management.md` | Show workflow state and change IDs |
| `list` | `management.md` | List all changes in workflow |
| `continue` | `management.md` | Resume workflow from persisted state |
| `regress` | `management.md` | Go back to earlier phase |
| `request-changes` | `management.md` | Request changes during review |

## Dispatch Logic

1. Parse the action from the first argument(s):
   - Two-word actions: `approve spec`, `approve plan`, `request-changes`
   - Single-word actions: everything else
2. Read the corresponding sub-file from this skill's directory
3. Follow the sub-file's instructions for the specific action

## Shared Validation

Before dispatching any action, perform these common checks:

### Change ID Lookup

For actions that require a `<change-id>`:
1. Read `sdd/workflows/` to find the workflow containing that change
2. Validate the change exists
3. If not found: `Error: Change '<change-id>' not found. Run /sdd-run change list to see all changes.`

### Status Checks

Each action has required statuses. If the current status doesn't match:
```
Error: Change '<change-id>' is in '<current-status>' status.
Action '<action>' requires status: <required-status>.
```

### No Arguments

When invoked with no action, display usage:

```
⚠ Missing required action argument.

USAGE:
  /sdd-run change <action> [args] [options]

ACTIONS:
  create             Create a new change (interactive or from external spec)
  status             Show current workflow state and all change IDs
  continue           Resume current workflow from persisted state
  list               List all changes in current workflow
  approve spec       Approve SPEC.md, trigger PLAN.md creation
  approve plan       Approve PLAN.md, enable implementation
  implement          Start implementation (requires plan_approved)
  verify             Verify implementation, mark complete
  review             Submit for user review (after implementation)
  plan               Begin planning phase (after ALL specs approved)
  answer             Answer an open question
  assume             Mark question as assumption
  regress            Go back to earlier phase                   🟡 caution
  request-changes    Request changes during review              🟡 caution

COMMON WORKFLOWS:

  Start new feature:
    /sdd-run change create --type feature --name user-auth

  Import external spec:
    /sdd-run change create --spec /path/to/requirements.md

  Resume work:
    /sdd-run change continue <change-id>

  Approve and implement:
    /sdd-run change approve spec <change-id>
    /sdd-run change approve plan <change-id>
    /sdd-run change implement <change-id>
```

## Common Output Patterns

### NEXT STEPS Blocks

All output messages that suggest next actions use `/sdd` with natural language prompts:

```
NEXT STEPS:
  /sdd I want to approve the spec
  /sdd I want to start planning
  /sdd I want to start implementing
```

### Change Links

Always render change references as clickable markdown links:
```
[<change-id>](changes/YYYY/MM/DD/<id>-<name>/<seq>-<slug>/)
```

## Output

Returns the output from the dispatched sub-file action.
