---
name: spec-writing
description: Templates and validation for writing product specifications.
---


# Spec Writing Skill

## Templates

Use templates below as starting points.

## Spec Lifecycle

**Git is the state machine:**
- In PR = draft (implicit, no status field needed)
- Merged to main = active
- Explicit statuses only for: `active`, `deprecated`, `superseded`, `archived`

## Frontmatter Requirements

Every spec must include:

```yaml
---
title: Change Name
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

**Required fields:**
- `title`
- `type` ← Must be `feature`, `bugfix`, `refactor`, or `epic`
- `status`
- `domain`
- `issue` ← Must reference a tracking issue
- `created`
- `updated`
- `sdd_version` ← Plugin version used to generate this spec

## Validation

Run `scripts/validate-spec.py <path>` to check:
- Required frontmatter fields present (including `issue`)
- Acceptance criteria in Given/When/Then format
- All referenced definitions exist in domain glossary

## Spec Locations

| Type | Location |
|------|----------|
| Change specs | `specs/changes/YYYY/MM/DD/<change-name>/SPEC.md` |
| Implementation plans | `specs/changes/YYYY/MM/DD/<change-name>/PLAN.md` |
| Domain definitions | `specs/domain/definitions/<definition-name>.md` |
| API contracts | `specs/architecture/api-contracts.md` |

**Date-based organization:**
- Changes are organized by creation date (YYYY/MM/DD)
- This provides chronological traceability
- Plans live alongside their specs in the same directory

## Acceptance Criteria Format

Always use Given/When/Then:

```
- [ ] **AC1:** Given [precondition], when [action], then [expected result]
```

---

## Template: Feature Spec

```markdown
---
title: [Feature Name]
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

## Out of Scope

- [What this feature explicitly does NOT cover]
```

---

## Template: Domain Definition

```markdown
---
title: [Definition Name]
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

## Template: Epic Spec

An epic contains multiple feature-type changes. The epic SPEC.md defines the overall goal, and each child change in `changes/` has its own feature SPEC.md.

```markdown
---
title: [Epic Name]
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

```
specs/changes/YYYY/MM/DD/<epic-name>/
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
