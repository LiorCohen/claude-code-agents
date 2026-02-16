# Workflow Progress

> Understanding and tracking progress through SDD workflows.

## Progress Visualization

Every SDD command shows progress. You should never wonder "where am I?" or "what's left?".

### Standard Progress Display

```
═══════════════════════════════════════════════════════════════
 EXTERNAL SPEC WORKFLOW                              [3/7 STEPS]
═══════════════════════════════════════════════════════════════

 ✓ Transform      Classify, gap analysis, clarifications
 ✓ Discover       Identify required components
 ● Decompose      Break into epics/changes          ← CURRENT
 ○ Spec 1/5       User Management - Registration
 ○ Spec 2/5       User Management - Authentication
 ○ Spec 3/5       Dashboard - Analytics
 ○ Review         Final spec review
 ○ Plan           Create implementation plans

───────────────────────────────────────────────────────────────
 CURRENT: Decomposing spec into workflow items...
 NEXT:    Create spec for "Registration" (Epic 1, Change 1)
───────────────────────────────────────────────────────────────
```

### Progress Symbols

| Symbol | Meaning |
|--------|---------|
| `✓` | Completed |
| `●` | Current (in progress) |
| `○` | Pending |
| `❗` | Needs attention (stale dependency, review needed) |
| `✗` | Failed/blocked |

### Compact Progress Bar

For quick status checks:

```
[████████░░░░░░░░░░░░] 3/7 steps │ Decomposing...
```

## Phase Tracking

SDD tracks four status fields per item:

| Field | Values | Description |
|-------|--------|-------------|
| `spec_status` | pending, in_progress, ready_for_review, approved, needs_rereview | Spec creation status |
| `plan_status` | pending, in_progress, approved | Plan creation status |
| `impl_status` | pending, in_progress, complete | Implementation status |
| `review_status` | pending, ready_for_review, approved, changes_requested | User review status |

### Substep Tracking

During spec creation, SDD tracks which substep is active:

| Substep | Description |
|---------|-------------|
| `transformation` | Classifying and analyzing input |
| `discovery` | Identifying required components |
| `solicitation` | Gathering requirements through questions |
| `writing` | Generating the SPEC.md file |

## Viewing Status

### Full Status

```
/sdd
```

Output:

```
═══════════════════════════════════════════════════════════════
 WORKFLOW STATUS
═══════════════════════════════════════════════════════════════

Workflow: a1b2c3
Source: external (.sdd/archive/external-specs/20260205-1430-feature-spec.md)
Created: 2026-02-05

Current: a1b2-1 (Registration) - spec_review

ITEMS:
  a1b2-1  Registration         spec_review    changes/2026/02/05/...
  a1b2-2  Authentication       pending        .sdd/workflows/...
  a1b2-3  Password Reset       pending        .sdd/workflows/...
  a1b2-4  Analytics            pending        .sdd/workflows/...
  a1b2-5  Settings             pending        .sdd/workflows/...

NEXT ACTION:
  Review spec at: changes/2026/02/05/a1b2c3/01-registration/SPEC.md
  Then run: /sdd I want to approve the spec
```

### List Items

```
/sdd I want to list my changes
```

Output:

```
═══════════════════════════════════════════════════════════════
 CHANGES IN WORKFLOW a1b2c3
═══════════════════════════════════════════════════════════════

ID        TITLE                 TYPE      STATUS         LOCATION
───────── ───────────────────── ───────── ────────────── ─────────────
a1b2-1    Registration          feature   spec_review    changes/...
a1b2-2    Authentication        feature   pending        .sdd/...
a1b2-3    Password Reset        feature   pending        .sdd/...

Dependencies:
  a1b2-2 depends on: a1b2-1
  a1b2-3 depends on: a1b2-2
```

## Phase-Specific Progress

### Spec Creation Phase

```
═══════════════════════════════════════════════════════════════
 SPEC CREATION                                       [2/9 SPECS]
═══════════════════════════════════════════════════════════════

 Epic 1: User Management
   ✓ 01-registration
   ● 02-authentication                               ← CURRENT
   ○ 03-password-reset

 Epic 2: Dashboard
   ○ 04-analytics
   ○ 05-settings
   ○ 06-notifications

 Epic 3: Billing
   ○ 07-subscription
   ○ 08-invoices
   ○ 09-payment-methods

───────────────────────────────────────────────────────────────
 DONE:    Created SPEC.md for 01-registration
 CURRENT: Soliciting requirements for 02-authentication
 NEXT:    03-password-reset (after this spec approved)
───────────────────────────────────────────────────────────────
```

### Planning Phase

```
═══════════════════════════════════════════════════════════════
 PLANNING PHASE                                     [4/9 PLANS]
═══════════════════════════════════════════════════════════════

 ✓ 01-registration      PLAN.md created, approved
 ✓ 02-authentication    PLAN.md created, approved
 ✓ 03-password-reset    PLAN.md created, approved
 ● 04-analytics         Creating plan...            ← CURRENT
 ○ 05-settings
 ○ 06-notifications
 ○ 07-subscription
 ○ 08-invoices
 ○ 09-payment-methods

───────────────────────────────────────────────────────────────
```

### Implementation Phase

```
═══════════════════════════════════════════════════════════════
 IMPLEMENTATION                                      [1/9 DONE]
═══════════════════════════════════════════════════════════════

 ✓ 01-registration      Implemented, tests passing
 ● 02-authentication    Implementing...             ← CURRENT
   └─ Phase 1/3: API contracts
 ○ 03-password-reset    Blocked by: 02-authentication
 ○ 04-analytics
 ...

───────────────────────────────────────────────────────────────
```

## Phase Gating

SDD enforces strict phase transitions:

### Gate: Spec → Plan

```
═══════════════════════════════════════════════════════════════
 ALL SPECS COMPLETE - READY FOR PLANNING
═══════════════════════════════════════════════════════════════

Created 9 specs across 3 epics:
  Epic 1: User Management (3 specs) ✓
  Epic 2: Dashboard (4 specs) ✓
  Epic 3: Billing (2 specs) ✓

Review all specs before proceeding to planning.

NEXT: Begin planning phase

Run: /sdd I want to start planning
```

### Gate: Plan → Implement

All plans must be approved before implementation can start.

### Gate: Implement → Review

Implementation must complete before user review.

### Gate: Review → Complete

User must approve before workflow completes.

## Blocked States

### Spec Approval Blocked (Open Questions)

```
═══════════════════════════════════════════════════════════════
 SPEC APPROVAL BLOCKED
═══════════════════════════════════════════════════════════════

Cannot approve 02-authentication - 2 open questions remain:

  O1: What's the rate limit for login attempts?
      (Blocks: Security section)

  O2: Should failed logins trigger alerts?
      (Blocks: Monitoring section)

Answer these questions or mark as assumptions:
  /sdd I want to answer an open question
```

### Planning Blocked (Stale Dependencies)

```
═══════════════════════════════════════════════════════════════
 CANNOT PROCEED - STALE DEPENDENCIES
═══════════════════════════════════════════════════════════════

The following specs have unreviewed upstream changes:
  ❗ 02-authentication (01-user-model changed)
  ❗ 03-password-reset (02-authentication not reviewed)

Review these specs before planning.
```

## Dependency Visualization

When reviewing specs with dependents:

```
═══════════════════════════════════════════════════════════════
 SPEC REVIEW: 01-user-model
═══════════════════════════════════════════════════════════════

⚠️  This spec has 3 dependents that may need updates:
    ├── 02-authentication (depends on: User entity)
    ├── 03-password-reset (depends on: 02-authentication)
    └── 04-dashboard (depends on: User entity)

Review the spec: SPEC.md

After making changes, dependent specs will be flagged for review.
```

## Workflow State Storage

Progress is persisted in `.sdd/workflows/<workflow-id>/workflow.yaml`:

```yaml
workflow:
  id: a1b2c3
  phase: spec  # spec | plan | implement
  step: spec_creation
  current_item: 02-authentication

  progress:
    total_items: 9
    specs_completed: 1
    specs_pending: 8
    plans_completed: 0
    plans_pending: 9
    implemented: 0
    reviewed: 0

  items:
    - id: 01-registration
      spec_status: approved
      plan_status: pending
      impl_status: pending
      review_status: pending
      depends_on: []

    - id: 02-authentication
      spec_status: in_progress
      plan_status: pending
      impl_status: pending
      review_status: pending
      depends_on: [01-registration]
      substep: solicitation
```

## Resuming Workflows

```
/sdd I want to continue
```

SDD reads the workflow state and resumes from where you left off:

```
Resuming workflow a1b2c3...

Current: a1b2-1 (Registration)
Status: soliciting (spec creation in progress)

Previously collected:
  - Problem: User registration flow
  - Primary user: New users
  - Requirements: 3 collected

Continuing from: Step 5 - Acceptance Criteria

For the requirement "Users can register with email":
What acceptance criteria should we have?
```

## Next Steps

- [Workflows](workflows.md) - Full workflow documentation
- [External Specs](external-specs.md) - Importing external specs
- [Commands](commands.md) - Command reference
