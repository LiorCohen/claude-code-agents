# Planning Actions

Handles `plan` and `approve plan` actions for the change orchestration skill.

---

## Action: approve plan

Approve PLAN.md and enable implementation.

### Usage

```
/sdd-run change approve plan <change-id>
```

### Flow

1. Validate change-id exists
2. Check status is `plan_review`
3. Update status to `plan_approved`
4. Advance workflow to next item (if any)

### Output

```
Approving plan for: [user-auth-1](changes/2026/02/05/a1b2c3-user-auth/01-registration/) (Registration)

Status: plan_approved

NEXT STEPS:
  Option 1: Start implementation
    /sdd I want to start implementing

  Option 2: Continue with next change
    Next: [user-auth-2](changes/2026/02/05/a1b2c3-user-auth/02-authentication/) (Authentication)
    /sdd I want to continue
```

---

## Action: plan

Begin planning phase for the workflow (after ALL specs are approved).

### Usage

```
/sdd-run change plan <change-id>
```

### Prerequisites

- All items in the workflow must have `spec_status: approved`
- If any specs are not approved, command fails with list of pending items

### Flow

1. Check phase gate: ALL specs approved
2. For each item in dependency order:
   - Invoke planning skill
   - Create PLAN.md
   - Set `plan_status: ready_for_review`
3. Display summary of plans created

### Output

```
Beginning planning phase...

Checking phase gate: ALL specs approved ✓

Creating plans in dependency order:

  [user-auth-1](changes/2026/02/05/a1b2c3-user-auth/01-registration/) (Registration)
    [PLAN.md](changes/2026/02/05/a1b2c3-user-auth/01-registration/PLAN.md) created
    Status: plan_ready_for_review

  [user-auth-2](changes/2026/02/05/a1b2c3-user-auth/02-authentication/) (Authentication) [depends on: user-auth-1]
    [PLAN.md](changes/2026/02/05/a1b2c3-user-auth/02-authentication/PLAN.md) created
    Status: plan_ready_for_review

Plans created: 2

NEXT STEPS:
  Review each PLAN.md file
  Then: /sdd I want to approve the plan
```
