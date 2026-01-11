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
title: Feature Name
status: active | deprecated | superseded | archived
domain: Identity | Billing | Core | ...
issue: PROJ-1234                    # Required: JIRA/GitHub issue
created: YYYY-MM-DD
updated: YYYY-MM-DD
supersedes: [optional, path to old spec]
superseded_by: [optional, path to new spec]
---
```

**Required fields:**
- `title`
- `status`
- `domain`
- `issue` ← Must reference a tracking issue
- `created`
- `updated`

## Validation

Run `scripts/validate-spec.py <path>` to check:
- Required frontmatter fields present (including `issue`)
- Acceptance criteria in Given/When/Then format
- All referenced entities exist in domain glossary

## Spec Locations

| Type | Location |
|------|----------|
| Feature specs | `specs/features/YYYY/MM/DD/<feature-name>/SPEC.md` |
| Implementation plans | `specs/features/YYYY/MM/DD/<feature-name>/PLAN.md` |
| Domain entities | `specs/domain/entities/<entity-name>.md` |
| API contracts | `specs/architecture/api-contracts.md` |

**Date-based organization:**
- Features are organized by creation date (YYYY/MM/DD)
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
status: active
domain: [Domain Name]
issue: [PROJ-XXX or GitHub issue URL]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Feature: [Feature Name]

## Overview

[1-2 sentences: what this feature does and why it matters]

## Domain Concepts

**Entities:**
- [Entity](../../domain/entities/entity.md) - how it's used here

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

## Template: Domain Entity

```markdown
---
title: [Entity Name]
status: active
domain: [Domain]
issue: [PROJ-XXX]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Entity: [Entity Name]

## Definition

[What this entity represents in the domain]

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| id | UUID | Yes | Unique identifier |
| name | string | Yes | Display name |
| createdAt | DateTime | Yes | Creation timestamp |

## Relationships

- **[Related Entity]**: [Relationship description]

## Business Rules

1. [Rule about this entity]
2. [Another rule]

## Lifecycle

[States this entity can be in and transitions between them]
```
