---
name: spec-writing
description: Templates and validation for writing product specifications.
user-invocable: false
---


# Spec Writing Skill

## Templates

Use templates below as starting points.

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts spec type, change type, title, domain, and optional issue reference.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns complete SPEC.md markdown and validation results for required fields, sections, and format.

## Spec Types: Product vs Tech

**Product Specs** (external input):
- Focus on WHAT and WHY
- Typically authored by product managers or stakeholders
- Archived as-is when imported via external spec workflow
- `spec_type: product`

**Tech Specs** (generated SPEC.md files):
- Focus on HOW
- Generated from product specs + solicitation
- Full implementation details
- `spec_type: tech`

## Spec Lifecycle

**Git is the state machine:**
- In PR = draft (implicit, no status field needed)
- Merged to main = active
- Explicit statuses only for: `active`, `deprecated`, `superseded`, `archived`

## Frontmatter Requirements

### Tech Spec Frontmatter (Default)

Every tech spec (generated SPEC.md) must include:

```yaml
---
title: Change Name
spec_type: tech                     # Required: tech (default for generated specs)
type: feature | bugfix | refactor | epic
status: active | deprecated | superseded | archived
domain: Identity | Billing | Core | ...
issue: PROJ-1234                    # Required: JIRA/GitHub issue
created: YYYY-MM-DD
updated: YYYY-MM-DD
sdd_version: X.Y.Z                  # Required: SDD plugin version used
supersedes: [optional, path to old spec]
superseded_by: [optional, path to new spec]
---
```

**Required fields for tech specs:**
- `title`
- `spec_type` ← Must be `tech`
- `type` ← Must be `feature`, `bugfix`, `refactor`, or `epic`
- `status`
- `domain`
- `issue` ← Must reference a tracking issue
- `created`
- `updated`
- `sdd_version` ← Plugin version used to generate this spec

**Required sections for tech specs:**
- `## Overview`
- `## Acceptance Criteria`
- `## API Contract` (if type involves API changes)
- `## Domain Model`
- `## Requirements Discovery` (Q&A trail from solicitation)
- `## Testing Strategy`

### Product Spec Frontmatter

External/product specs have minimal requirements:

```yaml
---
title: Product Spec Name
spec_type: product                  # Required: product
status: active | archived
domain: Identity | Billing | Core | ...
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

**Required fields for product specs:**
- `title`
- `spec_type` ← Must be `product`
- `status`
- `domain`
- `created`
- `updated`

**Optional sections for product specs:**
- `## Overview`
- `## User Stories`
- `## Requirements`
- `## Acceptance Criteria`

## Validation

### Validation Rules

Run `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" spec validate <path>` to check:
- Required frontmatter fields present based on `spec_type`
- Acceptance criteria in Given/When/Then format (tech specs only)
- All referenced definitions exist in domain glossary
- Required sections present (tech specs only)
- Open questions resolved (no BLOCKING open questions remain)

### Validation Error Messages

Validation should return clear, actionable error messages:

```text
Spec validation failed: changes/2026/02/05/a1b2c3/01-auth/SPEC.md

FRONTMATTER ERRORS:
  - Missing required field: issue
  - Missing required field: sdd_version
  - Invalid spec_type: 'unknown' (expected: tech | product)

SECTION ERRORS:
  - Missing required section: ## API Contract
  - Missing required section: ## Requirements Discovery

FORMAT ERRORS:
  - Line 45: Acceptance criterion not in Given/When/Then format
    Found: "Users can register"
    Expected: "Given [precondition], when [action], then [result]"

OPEN QUESTIONS (BLOCKING):
  - O1: What's the rate limit for login attempts?
  - O2: Should failed logins trigger alerts?

  Resolve these questions before spec can be approved:
    /sdd-change answer O1 "5 attempts per minute"
    /sdd-change assume O1 "Industry standard: 5 attempts/min"
```

### Open Questions Block Approval

Specs CANNOT be approved while open questions remain in the `## Requirements Discovery` section. The validation enforces this:

| Question Status | Effect |
|----------------|--------|
| `OPEN` | Blocks spec approval |
| `ANSWERED` | Does not block |
| `ASSUMED` | Does not block (assumption documented) |
| `DEFERRED` | Does not block (requires justification, tracked for later) |

## Spec Locations

| Type | Location |
|------|----------|
| Change specs | `changes/YYYY/MM/DD/<change-name>/SPEC.md` |
| Implementation plans | `changes/YYYY/MM/DD/<change-name>/PLAN.md` |
| Domain definitions | `specs/domain/definitions/<definition-name>.md` |
| API contracts | `specs/architecture/api-contracts.md` |

**Date-based organization:**
- Changes are organized by creation date (YYYY/MM/DD)
- This provides chronological traceability
- Plans live alongside their specs in the same directory

## Acceptance Criteria Format

Always use Given/When/Then:

```markdown
- [ ] **AC1:** Given [precondition], when [action], then [expected result]
```

---

## Template: Feature Spec (Tech Spec)

```markdown
---
title: [Feature Name]
spec_type: tech
type: feature
status: active
domain: [Domain Name]
issue: [PROJ-XXX or GitHub issue URL]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sdd_version: [X.Y.Z]
---

# Feature: [Feature Name]

## Overview

[1-2 sentences: what this feature does and why it matters]

## Domain Concepts

**Definitions:**
- [Definition](../../domain/definitions/definition.md) - how it's used here

**New concepts introduced:**
- [Concept]: [Definition]

## User Stories

### [Story Group]
- As a [role], I want [capability] so that [benefit]

## Acceptance Criteria

### [Capability Group]

- [ ] **AC1:** Given [precondition], when [action], then [result]
- [ ] **AC2:** Given [precondition], when [action], then [result]

## API Contract

### [METHOD] [/path]

**Description:** [What this endpoint does]

**Request:**
```json
{ "field": "type" }
```

**Response (2XX):**
```json
{ "data": { "field": "type" } }
```

**Errors:**
| Status | Code | Condition |
|--------|------|-----------|
| 400 | `validation_error` | Invalid input |
| 404 | `not_found` | Resource not found |

## Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| [Edge case] | [How it's handled] |

## Security Considerations

- [Security requirement or constraint]

## Domain Model

> Comprehensive domain knowledge extracted from this change.

### Entities

| Entity | Definition | Spec Path | Status |
|--------|------------|-----------|--------|
| [Entity] | [What it represents] | specs/domain/[entity].md | New/Existing |

### Relationships

```text
[Entity A] ──── [relationship] ───→ [Entity B]
```

### Glossary

| Term | Definition | First Defined In |
|------|------------|------------------|
| [Term] | [Definition] | This spec |

### Bounded Contexts

- **[Context Name]**: [Entities in this context]

## Specs Directory Changes

> **REQUIRED**: Every change to `specs/` must be declared here.

### Before

```text
specs/
└── [current structure]
```

### After

```text
specs/
└── [new structure with comments: # NEW, # MODIFIED]
```

### Changes Summary

| Path | Action | Description |
|------|--------|-------------|
| [path] | Create/Modify | [What changes] |

## Components

### New Components

| Component | Type | Purpose |
|-----------|------|---------|
| [Name] | [service/component] | [Purpose] |

### Modified Components

| Component | Changes |
|-----------|---------|
| [Name] | [What changes] |

## System Analysis

### Inferred Requirements

- [System-inferred requirements beyond explicit spec]

### Gaps & Assumptions

- [Identified gaps or assumptions]

## Requirements Discovery

> Complete Q&A trail from spec solicitation. Never delete entries.

### Transformation Phase

| # | Question | Answer | Source |
|---|----------|--------|--------|
| T1 | [Question about gaps/ambiguities] | [User's answer] | User |
| T2 | [Question about undefined behavior] | [Default used] | Assumption |

### Component Discovery Phase

| # | Question | Answer | Source |
|---|----------|--------|--------|
| D1 | Does data need persistence? | [Answer] | User |
| D2 | Are there external API consumers? | [Answer] | User |

### Solicitation Phase

| # | Question | Answer | Source |
|---|----------|--------|--------|
| S1 | [Deep-dive question for backend] | [Answer] | User |
| S2 | [Follow-up] [Clarification question] | [Answer] | User |

### User Feedback & Corrections

- [YYYY-MM-DD] [Feedback or correction captured during review]

### Open Questions

> Questions that must be resolved before spec approval. BLOCKING questions prevent approval.

| # | Question | Status | Blocker For |
|---|----------|--------|-------------|
| O1 | [Unresolved question] | OPEN | [Section affected] |

**Question Status Legend:**
- `OPEN` - Not yet answered, blocks approval
- `ANSWERED` - User provided answer
- `ASSUMED` - User said "I don't know", default documented
- `DEFERRED` - Moved to later phase (requires justification)

## Testing Strategy

### Unit Tests

| Component | Test Case | Expected Behavior |
|-----------|-----------|-------------------|
| [Component] | [Scenario] | [Expected result] |

### Integration Tests

| Scenario | Components | Expected Outcome |
|----------|------------|------------------|
| [Scenario] | [A → B] | [Result] |

### E2E Tests

| User Flow | Steps | Expected Result |
|-----------|-------|-----------------|
| [Flow] | [Steps] | [Outcome] |

## Out of Scope

- [What this feature explicitly does NOT cover]
```yaml

---

## Template: Domain Definition

```markdown
---
title: [Definition Name]
spec_type: tech
status: active
domain: [Domain]
issue: [PROJ-XXX]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sdd_version: [X.Y.Z]
---

# Definition: [Definition Name]

## Description

[What this definition represents in the domain]

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| id | UUID | Yes | Unique identifier |
| name | string | Yes | Display name |
| createdAt | DateTime | Yes | Creation timestamp |

## Relationships

- **[Related Definition]**: [Relationship description]

## Business Rules

1. [Rule about this definition]
2. [Another rule]

## Lifecycle

[States this definition can be in and transitions between them]
```

---

## Template: Epic Spec (Tech Spec)

An epic contains multiple feature-type changes. The epic SPEC.md defines the overall goal, and each child change in `changes/` has its own feature SPEC.md.

```markdown
---
title: [Epic Name]
spec_type: tech
type: epic
status: active
domain: [Domain Name]
issue: [PROJ-XXX or GitHub issue URL]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sdd_version: [X.Y.Z]
---

# Epic: [Epic Name]

## Overview

[1-2 sentences: what this epic accomplishes and why it matters]

## Changes

| Change | Description | Dependencies |
|--------|-------------|--------------|
| [change-name] | [What this change does] | None |
| [change-name] | [What this change does] | [depends-on] |

## Acceptance Criteria

### [Capability Group]

- [ ] **AC1:** Given [precondition], when [action], then [result]
- [ ] **AC2:** Given [precondition], when [action], then [result]

## Cross-Cutting Concerns

[Shared patterns, conventions, or constraints that apply across all changes]

## Out of Scope

- [What this epic explicitly does NOT cover]
```

### Epic Child Change Spec

Each child change inside `changes/` uses the standard feature template with one additional frontmatter field:

```yaml
---
title: [Feature Name]
spec_type: tech
type: feature
parent_epic: ../SPEC.md
status: active
domain: [Domain Name]
issue: [PROJ-XXX]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sdd_version: [X.Y.Z]
---
```

The `parent_epic` field links the child back to the epic spec.

### Epic Directory Structure

```text
changes/YYYY/MM/DD/<epic-name>/
├── SPEC.md                    # Epic-level spec
├── PLAN.md                    # Epic-level plan (change ordering)
└── changes/
    ├── <change-name>/
    │   ├── SPEC.md            # Feature spec
    │   └── PLAN.md            # Feature plan
    └── <change-name>/
        ├── SPEC.md
        └── PLAN.md
```

---

## Template: Product Spec (External Input)

Product specs are external inputs archived for reference. They focus on WHAT and WHY, not HOW.

```markdown
---
title: [Product Spec Name]
spec_type: product
status: active
domain: [Domain Name]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# [Product Spec Name]

## Overview

[What this product/feature does and why it matters to users]

## User Stories

### [User Group]

- As a [role], I want [capability] so that [benefit]

## Requirements

### Functional Requirements

- [Requirement 1]
- [Requirement 2]

### Non-Functional Requirements

- [Performance, security, scalability requirements - often missing]

## Acceptance Criteria

- [Criterion 1]
- [Criterion 2]

## UI/UX Specifications

[Visual designs, mockups, user flows - typically well-specified in product specs]

## Out of Scope

- [What this product spec explicitly does NOT cover]
```

**Note:** Product specs are typically incomplete:
- Rich in frontend/UI details
- Sparse on backend/API/database details
- Missing edge cases and error handling
- Implicit assumptions not documented

The transformation process identifies these gaps and asks clarifying questions.
