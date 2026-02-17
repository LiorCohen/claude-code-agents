# SDD Workflows

<!--
This file is maintained by the docs-writer agent.
To update, invoke the docs-writer agent with your changes.
-->

> How to use SDD for features, bugfixes, refactors, and epics.

## The Core Loop

Every change in SDD follows the same pattern:

1. **Spec** - Define what you're building (SPEC.md)
2. **Plan** - Break it into implementation phases (PLAN.md)
3. **Implement** - Execute the plan with specialized agents
4. **Review** - User reviews implementation against spec
5. **Verify** - Confirm the code matches the spec

### Phase Gating

SDD enforces strict phase gating to ensure quality:

- **Spec → Plan**: ALL specs must be approved before ANY planning starts
- **Plan → Implement**: ALL plans must be approved before implementation starts
- **Implement → Review**: Implementation must complete before user review
- **Review → Complete**: User must approve before workflow completes

This prevents half-finished specs from causing downstream issues.

## Feature Workflow

Use this when adding new functionality.

### 1. Create the Feature Spec

```
/sdd I want to create a new feature
```

You'll go through a guided solicitation workflow:
- Context and problem description
- Functional and non-functional requirements
- User stories and acceptance criteria
- Edge cases and dependencies

**What happens automatically:**
- **Requirements gathering** - SDD guides you through comprehensive solicitation
- **Component discovery** - Determines what components are needed
- **Domain updates** - Glossary updated with new entities from your feature

**Note:** Component scaffolding happens during implementation, not during spec creation.

### 2. Review and Approve the Spec

The spec is created with new sections:
- `SPEC.md` - What you're building, including Domain Model and Specs Directory Changes

Review the spec. Status is now `spec_review`.

```
/sdd I want to approve the spec
```

This creates the implementation plan (`PLAN.md`). Status advances to `plan_review`.

### 3. Approve the Plan and Implement

Review the plan, then approve it:

```
/sdd I want to approve the plan
```

Now implement:

```
/sdd I want to start implementing
```

Specialized agents execute each phase of the plan:
- `api-designer` defines contracts
- `backend-dev` implements server logic
- `frontend-dev` builds the UI
- `tester` writes tests

Checkpoint commits are created after each phase for recovery.

### 4. Review

After implementation, submit for user review:

```
/sdd I want to submit for review
```

Review the implementation against the spec. If changes are needed:

```
/sdd I want to request changes
```

### 5. Verify

When the review passes:

```
/sdd I want to verify the implementation
```

The `reviewer` agent checks that the implementation matches the spec.

## External Spec Workflow

Use this when importing requirements from an external specification document.

See [External Specs](external-specs.md) for complete details.

### Quick Overview

```
/sdd I want to import an external spec
```

The workflow:

1. **Archive** - External spec copied to `.sdd/archive/external-specs/`
2. **Transform** - Classify information, identify gaps, ask clarifying questions
3. **Discover** - Identify required components through targeted questions
4. **Decompose** - Break into epics and features with dependencies
5. **Spec Creation** - Create SPEC.md for each item (one at a time)
6. **Planning** - After ALL specs approved, create PLAN.md files
7. **Implementation** - Execute plans in dependency order
8. **Review** - User reviews each implementation
9. **Verification** - Final checks

### Phase Progression for Large Specs

For specs that decompose into multiple items:

```
═══════════════════════════════════════════════════════════════
 SPEC PHASE (complete ALL specs before planning)
═══════════════════════════════════════════════════════════════

Epic 1: User Management
  ✓ 01-registration      SPEC.md approved
  ● 02-authentication    SPEC.md in progress    ← CURRENT
  ○ 03-password-reset    Pending

Epic 2: Dashboard
  ○ 04-analytics         Pending
  ○ 05-settings          Pending

Progress: 1/5 specs approved

NEXT: Complete 02-authentication spec

Run: /sdd I want to continue
```

The workflow GUIDES you through this sequence - it's not optional.

## Bugfix Workflow

Use this when fixing existing behavior.

```
/sdd I want to create a bugfix
```

Bugfix specs require:
- Current (broken) behavior
- Expected (correct) behavior
- Steps to reproduce

The implementation plan is typically shorter - focused on the fix and regression tests.

## Refactor Workflow

Use this when restructuring code without changing behavior.

```
/sdd I want to create a refactor
```

Refactor specs require:
- Current structure
- Target structure
- Reason for the change

The plan emphasizes maintaining behavior while changing structure.

## Epic Workflow

Use this when a goal requires multiple features working together.

```
/sdd I want to create an epic
```

Epic specs require:
- Overall goal and acceptance criteria
- List of child changes (features) with descriptions
- Dependencies between child changes

The command creates workflow items for each child feature, tracking them in `.sdd/workflows/<workflow-id>/workflow.yaml`.

### Implementation

Each child change is implemented in dependency order:

```
/sdd I want to start implementing
```

The workflow tracks dependency order and implements child changes sequentially, creating checkpoint commits after each phase.

### Verification

```
/sdd I want to verify the implementation
```

Verifies each child change individually, then checks that the combined implementation satisfies all epic-level acceptance criteria.

## Regression (Going Back)

Sometimes you need to go back to an earlier phase:

```
/sdd I want to go back to the spec phase
/sdd I want to go back to the plan phase
/sdd I want to request changes
```

Regression:
- Archives discarded work to `.sdd/archive/workflow-regressions/`
- Flags dependent items for re-review
- Requires a reason for audit trail

## Open Questions

Specs may have open questions that block approval:

```
═══════════════════════════════════════════════════════════════
 SPEC APPROVAL BLOCKED
═══════════════════════════════════════════════════════════════

Cannot approve 02-authentication - 2 open questions remain:

  O1: What's the rate limit for login attempts?
  O2: Should failed logins trigger alerts?

Answer these questions or mark as assumptions:
  /sdd I want to answer an open question
```

## Configuration Workflow

Use this when you need to add or modify configuration.

### 1. Add Config Property

Edit `components/config/envs/default/config.yaml`:

```yaml
server-task-service:
  port: 3000
  newProperty: value
```

### 2. Add Environment Override (if needed)

Edit `components/config/envs/local/config.yaml`:

```yaml
server-task-service:
  newProperty: localValue
```

### 3. Update Types

Edit `components/config/types/server.ts`:

```typescript
export type ServerConfig = Readonly<{
  port?: number;
  newProperty?: string;
}>;
```

### 4. Generate and Run

```bash
/sdd I want to generate config for local
SDD_CONFIG_PATH=./local-config.yaml npm run dev
```

See the [Configuration Guide](config-guide.md) for complete details.

## On-Demand Scaffolding

Components are scaffolded during implementation when first needed:

1. You create a feature that requires a server component
2. Component discovery identifies the need during spec creation
3. The component requirement is documented in SPEC.md
4. During implementation, the component is scaffolded
5. The component is added to `.sdd/sdd-settings.yaml`

This means your project grows organically - you only have what you've actually needed.

## Tips

**Small changes are better.** A feature that takes 6 phases is harder to review than three 2-phase features.

**Specs are living documents.** If requirements change during implementation, use `/sdd I want to go back to the spec phase` to regress.

**Trust the agents.** Each agent has specific expertise. Let `backend-dev` handle server code, `frontend-dev` handle UI.

**Config before code.** When adding features that need configuration, add the config properties first, then implement the feature.

**Answer open questions early.** Specs with open questions cannot be approved. Use `/sdd I want to answer an open question` to resolve them.

**Watch the progress display.** Every command shows your progress. Use `/sdd` to see the full picture.

## Next Steps

- [External Specs](external-specs.md) - Importing external specifications
- [Commands](commands.md) - Full command reference
- [Agents](agents.md) - What each agent does
- [Configuration Guide](config-guide.md) - Config system details
