# Implementation Action

Handles the `implement` action for the change orchestration skill.

## Usage

```
/sdd-run change implement <change-id>
```

## Flow

### Step 1: Validate Status

1. Check status is `plan_approved`
2. If not, display error with current status

### Step 2: Load Spec and Plan (REQUIRED)

**CRITICAL**: Before ANY implementation:
- Read the ENTIRE PLAN.md
- Read the ENTIRE SPEC.md
- Understand ALL requirements
- Display comprehensive summary

### Step 3: Execute Domain Updates

From SPEC.md `## Domain Updates` section:
1. Add/update glossary terms
2. Create/update definition specs
3. Apply architecture updates

### Step 4: Execute Implementation Phases

For each phase in PLAN.md:
1. Read phase details
2. Invoke specified agent
3. Verify deliverables
4. Update PLAN.md state
5. Create checkpoint commit

### Step 5: Track Progress

Update PLAN.md after each phase:
- Current Phase
- Completed Phases
- Actual Files Changed
- Blockers (if any)

This enables session resumption.

### Step 6: Update Status

When all phases complete:
```yaml
INVOKE workflow-state.update_status with:
  change_id: <change_id>
  status: verifying
```

## Output

```
Implementing: [user-auth-1](changes/2026/02/05/a1b2c3-user-auth/01-registration/) (Registration)

Step 1: Loading spec and plan...
  Read [PLAN.md](changes/2026/02/05/a1b2c3-user-auth/01-registration/PLAN.md)
  Read [SPEC.md](changes/2026/02/05/a1b2c3-user-auth/01-registration/SPEC.md)
  [Displays comprehensive summary]

Step 2: Executing Domain Updates...
  Adding glossary term: User
  Creating definition: [specs/domain/definitions/user.md](specs/domain/definitions/user.md)
  Domain updates complete

Step 3: Beginning implementation phases...

Phase 1: API Contract
  Agent: api-designer
  [Implementation progress...]
  Phase 1 complete

[... continues through all phases ...]

Implementation complete. Ready for verification.
  /sdd I want to verify the implementation
```
