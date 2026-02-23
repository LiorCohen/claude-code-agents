# Other Spec Templates

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
- Rich in user-facing interface details
- Sparse on business logic, contracts, and data layer details
- Missing edge cases and error handling
- Implicit assumptions not documented

The transformation process identifies these gaps and asks clarifying questions.
