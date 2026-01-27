---
name: change-creation
description: Create change specification and implementation plan with proper structure and frontmatter. Supports feature, bugfix, refactor, and epic types.
---

# Change Creation Skill

## Purpose

Create a complete change specification package consisting of:
- Change directory: `specs/changes/YYYY/MM/DD/<change-name>/`
- Specification: `SPEC.md` with proper frontmatter and type-specific sections
- Implementation plan: `PLAN.md` with 6-phase structure
- INDEX.md update with new change entry

## Input

| Parameter | Required | Description |
|-----------|----------|-------------|
| `name` | Yes | Directory name (lowercase, hyphens) |
| `type` | Yes | Change type: `feature`, `bugfix`, `refactor`, or `epic` |
| `title` | Yes | Display title for the change |
| `description` | Yes | Brief description (1-2 sentences) |
| `domain` | Yes | Primary domain (e.g., "Identity", "Billing") |
| `issue` | No | Issue reference (e.g., "PROJ-123"), defaults to "TBD" |
| `user_stories` | No | List of user stories (feature type only) |
| `acceptance_criteria` | No | List of acceptance criteria |
| `api_endpoints` | No | List of API endpoints affected |
| `external_source` | No | Path to external spec (for traceability) |
| `decomposition_id` | No | UUID linking related changes |
| `prerequisites` | No | List of prerequisite changes (for dependencies) |
| `affected_files` | No | List of files affected (bugfix/refactor types) |
| `root_cause` | No | Root cause description (bugfix type only) |
| `refactor_goals` | No | List of refactoring goals (refactor type only) |
| `child_changes` | No | List of child change names (epic type only) |
| `epic_goal` | No | Overall epic goal (epic type only) |

## Output

Returns a result with:
- `spec_path`: Path to created SPEC.md
- `plan_path`: Path to created PLAN.md
- `index_updated`: Boolean indicating INDEX.md was updated

## Workflow

### Step 1: Validate Inputs

1. Validate `name` is a valid directory name:
   - Lowercase letters, numbers, hyphens only
   - No spaces or special characters
   - Not empty

2. Validate `type` is one of: `feature`, `bugfix`, `refactor`, `epic`

3. Ensure required parameters are provided:
   - `name`, `type`, `title`, `description`, `domain`

### Step 2: Generate Date Path

1. Get current date
2. Format as `YYYY/MM/DD`
3. Full path: `specs/changes/YYYY/MM/DD/<name>/`

### Step 3: Read Plugin Version

1. Read SDD plugin version from `.claude-plugin/plugin.json`
2. Use for `sdd_version` frontmatter field

### Step 4: Create Change Directory

```bash
mkdir -p specs/changes/YYYY/MM/DD/<name>/
```

### Step 5: Create SPEC.md

Create `specs/changes/YYYY/MM/DD/<name>/SPEC.md` using type-specific template.

#### Common Frontmatter (all types)

```yaml
---
title: <title>
type: <type>
status: active
domain: <domain>
issue: <issue or "TBD">
created: YYYY-MM-DD
updated: YYYY-MM-DD
sdd_version: <plugin_version>
external_source: <path>  # Only if provided
decomposition_id: <uuid>  # Only if provided
---
```

#### Type-Specific Content

**For `type: feature`:**

```markdown
## Overview

<description>

## External Source

> Only include if `external_source` is provided

This specification was imported from an external document: `<external_source>`

## User Stories

> Include if `user_stories` provided, otherwise use template

- As a [role], I want [capability] so that [benefit]
- ...

## Acceptance Criteria

> Include if `acceptance_criteria` provided, otherwise use template

- [ ] Given [context], when [action], then [result]
- ...

## API Contract

> Include if `api_endpoints` provided, otherwise use template

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| METHOD | /path | Description |

## Domain Concepts

> List any new domain terms introduced by this feature

- **Term**: Definition

## Out of Scope

> Explicitly list what this feature does NOT include

- Item 1
- Item 2

## Open Questions

> List any unresolved questions

- Question 1?
```

**For `type: bugfix`:**

```markdown
## Overview

<description>

## Bug Description

### Symptoms

> Describe the observable behavior that indicates the bug

- Symptom 1
- Symptom 2

### Expected Behavior

> What should happen instead

### Steps to Reproduce

1. Step 1
2. Step 2
3. Step 3

### Root Cause

> Include if `root_cause` provided, otherwise use template

[Describe the underlying cause of the bug]

## Affected Areas

> Include if `affected_files` provided, otherwise use template

| File | Impact |
|------|--------|
| path/to/file | Description of impact |

## Acceptance Criteria

> Include if `acceptance_criteria` provided, otherwise use template

- [ ] Bug no longer reproducible following steps above
- [ ] No regression in related functionality
- [ ] [Additional criteria]

## API Impact

> Include if `api_endpoints` provided, otherwise note "None"

### Affected Endpoints

| Method | Path | Change |
|--------|------|--------|
| METHOD | /path | Description of change |

## Out of Scope

> Explicitly list what this fix does NOT address

- Item 1
- Item 2
```

**For `type: refactor`:**

```markdown
## Overview

<description>

## Refactoring Goals

> Include if `refactor_goals` provided, otherwise use template

- [ ] Goal 1 (e.g., Improve code readability)
- [ ] Goal 2 (e.g., Reduce duplication)
- [ ] Goal 3 (e.g., Better separation of concerns)

## Current State

> Describe the current implementation and its issues

### Problems with Current Approach

- Problem 1
- Problem 2

## Proposed Changes

> Describe the refactoring approach

### Affected Areas

> Include if `affected_files` provided, otherwise use template

| File/Module | Change Type | Description |
|-------------|-------------|-------------|
| path/to/file | Restructure | Description |

## Acceptance Criteria

> Include if `acceptance_criteria` provided, otherwise use template

- [ ] All existing tests pass
- [ ] No change in external behavior
- [ ] [Specific refactoring goals met]

## API Impact

> Include if `api_endpoints` provided, otherwise note "None - internal refactor"

## Risks

> List potential risks of this refactor

| Risk | Mitigation |
|------|------------|
| Risk 1 | How to mitigate |

## Out of Scope

> Explicitly list what this refactor does NOT change

- Item 1
- Item 2
```

**For `type: epic`:**

```markdown
## Overview

<description>

## Changes

| Change | Description | Dependencies |
|--------|-------------|--------------|
| [change-name] | [Brief description] | None |

> Include if `child_changes` provided, otherwise use template rows

## Acceptance Criteria

> Include if `acceptance_criteria` provided, otherwise use template

- [ ] **AC1:** Given [precondition], when [action], then [result]

## Cross-Cutting Concerns

> Items that span multiple child changes

- **[Concern]**: [How it's handled across changes]

## Out of Scope

> Explicitly list what this epic does NOT include

- Item 1
- Item 2
```

**Epic Directory Structure:**

After creating the epic's own SPEC.md and PLAN.md, create child change directories:

```
specs/changes/YYYY/MM/DD/<epic-name>/
├── SPEC.md
├── PLAN.md
└── changes/
    ├── <child-change-1>/
    │   ├── SPEC.md
    │   └── PLAN.md
    └── <child-change-2>/
        ├── SPEC.md
        └── PLAN.md
```

Each child change uses the standard feature spec template with `parent_epic: ../SPEC.md` in frontmatter.

### Step 6: Create PLAN.md

Create `specs/changes/YYYY/MM/DD/<name>/PLAN.md`:

#### Frontmatter

```yaml
---
title: <title> - Implementation Plan
change: <name>
type: <type>
spec: ./SPEC.md
status: draft
created: YYYY-MM-DD
sdd_version: <plugin_version>
---
```

#### Content Structure

The plan structure varies slightly by type:

**For `type: feature`:** (full 6-phase structure)

```markdown
## Overview

Implementation plan for: <title>

Specification: [SPEC.md](./SPEC.md)

## Prerequisites

> Only include if `prerequisites` provided

Complete implementation of the following changes before starting:
- <prerequisite_1>
- <prerequisite_2>

## Implementation Phases

### Phase 0: Domain Documentation
**Agent:** `spec-writer`

- [ ] Review and update domain glossary
- [ ] Document any new domain concepts
- [ ] Ensure ubiquitous language is consistent

### Phase 1: API Contract
**Agent:** `api-designer`

- [ ] Define OpenAPI paths and operations
- [ ] Define request/response schemas
- [ ] Generate TypeScript types
- [ ] Review contract with team

### Phase 2: Backend Implementation
**Agent:** `backend-dev`

- [ ] Implement database models/migrations
- [ ] Implement service layer
- [ ] Implement API handlers
- [ ] Add input validation
- [ ] Add error handling

### Phase 3: Frontend Implementation
**Agent:** `frontend-dev`

- [ ] Create UI components
- [ ] Implement state management
- [ ] Connect to API endpoints
- [ ] Add loading/error states
- [ ] Implement form validation

### Phase 4: Testing
**Agent:** `tester`

- [ ] Write unit tests for services
- [ ] Write integration tests for API
- [ ] Write E2E tests for critical paths
- [ ] Verify all acceptance criteria pass

### Phase 5: Review & Documentation
**Agent:** `reviewer`

- [ ] Code review
- [ ] Update API documentation
- [ ] Update user documentation (if needed)
- [ ] Final QA sign-off

## Notes

- Phases build on each other sequentially
- Update this plan as implementation progresses
```

**For `type: bugfix`:** (streamlined phases)

```markdown
## Overview

Implementation plan for bugfix: <title>

Specification: [SPEC.md](./SPEC.md)

## Prerequisites

> Only include if `prerequisites` provided

Complete implementation of the following changes before starting:
- <prerequisite_1>
- <prerequisite_2>

## Implementation Phases

### Phase 1: Investigation
**Agent:** `backend-dev` or `frontend-dev`

- [ ] Reproduce the bug locally
- [ ] Identify root cause
- [ ] Document findings in SPEC.md

### Phase 2: Implementation
**Agent:** `backend-dev` or `frontend-dev`

- [ ] Implement the fix
- [ ] Update any affected API contracts (if needed)
- [ ] Add input validation (if applicable)

### Phase 3: Testing
**Agent:** `tester`

- [ ] Add regression test for this bug
- [ ] Verify fix resolves the issue
- [ ] Run existing test suite
- [ ] Verify no regressions

### Phase 4: Review
**Agent:** `reviewer`

- [ ] Code review
- [ ] Verify acceptance criteria met
- [ ] Final QA sign-off

## Notes

- Prioritize minimal, focused changes
- Update this plan as investigation reveals more details
```

**For `type: refactor`:** (streamlined phases)

```markdown
## Overview

Implementation plan for refactor: <title>

Specification: [SPEC.md](./SPEC.md)

## Prerequisites

> Only include if `prerequisites` provided

Complete implementation of the following changes before starting:
- <prerequisite_1>
- <prerequisite_2>

## Implementation Phases

### Phase 1: Preparation
**Agent:** `backend-dev` or `frontend-dev`

- [ ] Ensure comprehensive test coverage exists
- [ ] Document current behavior
- [ ] Identify all affected areas

### Phase 2: Implementation
**Agent:** `backend-dev` or `frontend-dev`

- [ ] Implement refactoring changes
- [ ] Update any affected API contracts (if needed)
- [ ] Maintain backward compatibility (if required)

### Phase 3: Testing
**Agent:** `tester`

- [ ] Run existing test suite
- [ ] Verify no behavior changes
- [ ] Add tests for improved structure (if applicable)
- [ ] Performance testing (if applicable)

### Phase 4: Review
**Agent:** `reviewer`

- [ ] Code review focusing on refactoring goals
- [ ] Verify no regressions
- [ ] Final QA sign-off

## Notes

- All tests must pass before and after refactoring
- No functional changes should be introduced
- Update this plan as implementation progresses
```

**For `type: epic`:** (uses epic-planning skill)

```markdown
## Overview

Implementation plan for epic: <title>

Specification: [SPEC.md](./SPEC.md)

## Change Order

Implement child changes in this order:

| # | Change | Description | Dependencies | Status |
|---|--------|-------------|--------------|--------|
| 1 | [change-name] | [Brief description] | None | pending |
| 2 | [change-name] | [Brief description] | [change-name] | pending |

## Dependency Graph

```
change-1
    ↓
change-2 (requires: change-1)
```

## PR Strategy

One PR per child change. Branch naming: `epic/<epic-name>/<change-name>`

## Progress Tracking

- [ ] Change 1: [change-name]
- [ ] Change 2: [change-name]
```

After creating the epic PLAN.md, create child change directories under `changes/` with their own SPEC.md and PLAN.md (standard feature structure with `parent_epic: ../SPEC.md`).

### Step 7: Update INDEX.md

Add entry to `specs/INDEX.md`:

1. Find the `## Active Changes` section (create if missing)
2. Add entry with type indicator:
   ```markdown
   - [<title>](changes/YYYY/MM/DD/<name>/SPEC.md) - <type> - <description>
   ```

### Step 8: Return Result

Return:
```yaml
spec_path: specs/changes/YYYY/MM/DD/<name>/SPEC.md
plan_path: specs/changes/YYYY/MM/DD/<name>/PLAN.md
index_updated: true
```

## Examples

### Feature Example

```
Input:
  name: user-authentication
  type: feature
  title: User Authentication
  description: Allow users to sign up, sign in, and manage sessions
  domain: Identity
  issue: PROJ-123

Output:
  spec_path: specs/changes/2026/01/21/user-authentication/SPEC.md
  plan_path: specs/changes/2026/01/21/user-authentication/PLAN.md
  index_updated: true
```

### Bugfix Example

```
Input:
  name: fix-session-timeout
  type: bugfix
  title: Fix Session Timeout
  description: Sessions expire prematurely after 5 minutes instead of 30
  domain: Identity
  issue: BUG-456
  root_cause: Token expiry calculation uses seconds instead of minutes
  affected_files:
    - src/services/auth/session.ts
    - src/middleware/auth.ts

Output:
  spec_path: specs/changes/2026/01/21/fix-session-timeout/SPEC.md
  plan_path: specs/changes/2026/01/21/fix-session-timeout/PLAN.md
  index_updated: true
```

### Refactor Example

```
Input:
  name: extract-validation-layer
  type: refactor
  title: Extract Validation Layer
  description: Move validation logic from controllers to dedicated validation layer
  domain: Core
  issue: TECH-789
  refactor_goals:
    - Centralize validation logic
    - Improve testability
    - Reduce code duplication
  affected_files:
    - src/controllers/*.ts
    - src/validation/ (new)

Output:
  spec_path: specs/changes/2026/01/21/extract-validation-layer/SPEC.md
  plan_path: specs/changes/2026/01/21/extract-validation-layer/PLAN.md
  index_updated: true
```

### Epic Example

```
Input:
  name: checkout-system
  type: epic
  title: Checkout System
  description: Complete checkout flow with cart, payment, and order management
  domain: Commerce
  issue: PROJ-500
  child_changes:
    - shopping-cart
    - payment-processing
    - order-management

Output:
  spec_path: specs/changes/2026/01/27/checkout-system/SPEC.md
  plan_path: specs/changes/2026/01/27/checkout-system/PLAN.md
  index_updated: true
  # Also creates:
  # specs/changes/2026/01/27/checkout-system/changes/shopping-cart/SPEC.md
  # specs/changes/2026/01/27/checkout-system/changes/shopping-cart/PLAN.md
  # specs/changes/2026/01/27/checkout-system/changes/payment-processing/SPEC.md
  # specs/changes/2026/01/27/checkout-system/changes/payment-processing/PLAN.md
  # specs/changes/2026/01/27/checkout-system/changes/order-management/SPEC.md
  # specs/changes/2026/01/27/checkout-system/changes/order-management/PLAN.md
```

## Error Handling

- If change directory already exists: Warn and ask for confirmation to overwrite
- If INDEX.md doesn't exist: Create it with basic structure
- If plugin.json can't be read: Use "unknown" for sdd_version and warn
- If invalid type provided: Return error with valid options
