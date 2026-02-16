# Management Actions

Handles `status`, `list`, `continue`, `regress`, and `request-changes` actions for the change orchestration skill.

---

## Action: status

Show current workflow state and all change IDs.

### Usage

```
/sdd-run change status [<change-id>]
```

### Flow

1. Read all workflows from `.sdd/workflows/`
2. If `<change-id>` provided, show details for that specific change
3. Otherwise, for each workflow, display:
   - Workflow ID and source
   - Current item being worked on
   - All items with their statuses and change IDs

### Output

```
===============================================================
 WORKFLOW STATUS
===============================================================

Workflow: a1b2c3
Source: external
Created: 2026-02-05

Current: [a1b2-1](changes/2026/02/05/a1b2c3/01-registration/) (Registration) - spec_review

ITEMS:
  a1b2-1  Registration         spec_review    [changes/...](changes/2026/02/05/a1b2c3/01-registration/)
  a1b2-2  Authentication       pending        [.sdd/workflows/...](.sdd/workflows/a1b2c3/drafts/...)
  a1b2-3  Password Reset       pending        [.sdd/workflows/...](.sdd/workflows/a1b2c3/drafts/...)
  a1b2-4  Analytics            pending        [.sdd/workflows/...](.sdd/workflows/a1b2c3/drafts/...)
  a1b2-5  Settings             pending        [.sdd/workflows/...](.sdd/workflows/a1b2c3/drafts/...)

NEXT ACTION:
  Review spec at: [SPEC.md](changes/2026/02/05/a1b2c3/01-registration/SPEC.md)
  Then: /sdd I want to approve the spec
```

---

## Action: list

List all changes in current workflow.

### Usage

```
/sdd-run change list
```

### Flow

1. Read workflow state
2. Display all items with details

### Output

```
===============================================================
 CHANGES IN WORKFLOW a1b2c3
===============================================================

ID        TITLE                 TYPE      STATUS         LOCATION
───────── ───────────────────── ───────── ────────────── ─────────────────────────
a1b2-1    Registration          feature   spec_review    [changes/...](changes/2026/02/05/a1b2c3/01-registration/)
a1b2-2    Authentication        feature   pending        [.sdd/workflows/...](.sdd/workflows/a1b2c3/drafts/02-authentication/)
a1b2-3    Password Reset        feature   pending        [.sdd/workflows/...](.sdd/workflows/a1b2c3/drafts/03-password-reset/)

Dependencies:
  [a1b2-2](changes/2026/02/05/a1b2c3/02-authentication/) depends on: [a1b2-1](changes/2026/02/05/a1b2c3/01-registration/)
  [a1b2-3](changes/2026/02/05/a1b2c3/03-password-reset/) depends on: [a1b2-2](changes/2026/02/05/a1b2c3/02-authentication/)
```

---

## Action: continue

Resume current workflow from persisted state.

### Usage

```
/sdd-run change continue <change-id>
```

### Flow

1. Read workflow state from `.sdd/workflows/`
2. Find current item (or specified change-id)
3. Based on status, take appropriate action:

| Status | Action |
|--------|--------|
| `pending` | Start spec solicitation |
| `soliciting` | Resume spec solicitation from saved state |
| `spec_review` | Prompt to review spec, suggest approve command |
| `plan_review` | Prompt to review plan, suggest approve command |
| `plan_approved` | Prompt to start implementation |
| `implementing` | Resume implementation from saved state |
| `verifying` | Continue verification |

### Output (example: soliciting)

```
Resuming workflow a1b2c3...

Current: [a1b2-1](changes/2026/02/05/a1b2c3/01-registration/) (Registration)
Status: soliciting (spec creation in progress)

Previously collected:
  - Problem: User registration flow
  - Primary user: New users
  - Requirements: 3 collected

Continuing from: Step 5 - Acceptance Criteria

For the requirement "Users can register with email":
What acceptance criteria should we have?
```

---

## Action: regress

Go back to an earlier phase (e.g., from planning back to spec).

### Usage

```
/sdd-run change regress <change-id> --to <phase> --reason "<reason>"
```

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `change-id` | Yes | The change to regress |
| `--to` | Yes | Target phase: `spec` or `plan` |
| `--reason` | Yes | Reason for regression |

### Flow

1. Validate change exists
2. Archive current state via system CLI:
   ```bash
   <plugin-root>/system/system-run.sh archive store --source <prepared-dir> --type workflow-regression --json
   ```
3. Reset status fields for target phase and later
4. Flag dependent items for re-review
5. Log regression reason

### Output

```
Regressing [a1b2-1](changes/2026/02/05/a1b2c3/01-registration/) to spec phase...

Reason: Need to add OAuth support

Archived:
  [PLAN.md](.sdd/archive/workflow-regressions/20260205-1200-a1b2-1-impl/PLAN.md) → [.sdd/archive/...](.sdd/archive/workflow-regressions/20260205-1200-a1b2-1-impl/PLAN.md)

Status changes:
  spec_status: approved → needs_rereview
  plan_status: approved → pending

Dependent items flagged for re-review:
  [a1b2-2](changes/2026/02/05/a1b2c3/02-authentication/) (Authentication) - depends on a1b2-1

NEXT STEPS:
  Edit [SPEC.md](changes/2026/02/05/a1b2c3/01-registration/SPEC.md) to add OAuth requirements
  Then: /sdd I want to approve the spec
```

---

## Action: request-changes

Request changes during the review phase.

### Usage

```
/sdd-run change request-changes <change-id> --reason "<reason>"
```

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `change-id` | Yes | The change to request changes for |
| `--reason` | Yes | What changes are needed |

### Flow

1. Validate change exists and `review_status: ready_for_review`
2. Update `review_status: changes_requested`
3. Log the reason in workflow state
4. Reset `impl_status` to allow re-implementation

### Output

```
Requesting changes for: [a1b2-1](changes/2026/02/05/a1b2c3/01-registration/) (Registration)

Reason: Error messages need to be more user-friendly

Status changes:
  review_status: ready_for_review → changes_requested
  impl_status: complete → in_progress

NEXT STEPS:
  Address the feedback
  Then: /sdd I want to submit for review
```
