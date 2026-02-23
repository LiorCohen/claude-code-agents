# workflow.yaml Schema

```yaml
id: a1b2c3                      # Short unique workflow ID
name: user-auth                  # User-chosen workflow name (lowercase alphanumeric + hyphens, 3-50 chars)
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
        change_id: user-auth-1   # Derived from workflow name + sequence
        title: API Contracts
        type: feature
        location: changes/2026/02/05/a1b2c3-user-auth/01-api-contracts
        context_sections: ["## API Design", "## Endpoints"]
        depends_on: []

        # Four separate status fields for granular tracking
        spec_status: approved    # pending | in_progress | ready_for_review | approved | needs_rereview
        plan_status: pending     # pending | in_progress | approved
        impl_status: pending     # pending | in_progress | complete
        review_status: pending   # pending | ready_for_review | approved | changes_requested

        # Substep tracking within spec creation
        substep: null            # transformation | discovery | solicitation | writing

      - id: 02-auth-service
        change_id: user-auth-2
        title: Auth Service
        type: feature
        location: sdd/workflows/a1b2c3-user-auth/drafts/01-user-management/02-auth-service
        context_sections: ["## Business Logic", "## Data Model"]
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

## Step Values

| Phase | Valid Steps |
|-------|-------------|
| `spec` | `transform`, `discover`, `decompose`, `spec_creation`, `spec_review` |
| `plan` | `plan_creation`, `plan_review` |
| `implement` | `implementing`, `testing` |
| `review` | `reviewing` |

## Status Field Details

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

## Regression Tracking

When a phase regression occurs, track it:

```yaml
regression:
  from_phase: implement
  to_phase: spec
  reason: "Need to add additional auth method"
  timestamp: 2026-02-05T14:30:00Z
  preserved_work:
    - path: sdd/archive/workflow-regressions/20260205-1430-02-auth-impl/
      type: implementation
      description: "Partial password auth implementation"
```
