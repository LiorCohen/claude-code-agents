## Overview

<description>

### Background

> Why is this change needed? What problem does it solve?

[Explain the context and motivation]

### Current State

> What exists today? What are the limitations?

[Describe the current implementation or lack thereof]

## Original Requirements

> Only include if `source_content` is provided. This section embeds the full content from the external spec, making this spec self-sufficient.

<source_content>

---

## User Stories

> Who benefits and how?

- As a [role], I want [capability] so that [benefit]
- ...

## Functional Requirements

> What the system must do. Be specific and complete.

### FR1: [Requirement Name]

**Description:** [Detailed description]

**Behavior:**
- When [condition], the system shall [action]
- ...

**Constraints:**
- [Any limitations or rules]

### FR2: [Requirement Name]

...

## Non-Functional Requirements

> Performance, security, scalability, etc.

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| Response time | < 200ms p95 | API latency monitoring |
| Availability | 99.9% | Uptime monitoring |
| Throughput | 1000 req/s | Load testing |

## Technical Design

### Architecture

> How does this fit into the system? Include diagrams if helpful.

```
[Component A] ---> [Component B] ---> [Component C]
       |
       v
[External Service]
```

### Data Model

> Schema changes, new entities, modified fields

**New Tables:**

```sql
CREATE TABLE table_name (
  id UUID PRIMARY KEY,
  field_1 VARCHAR(255) NOT NULL,
  field_2 TIMESTAMP DEFAULT NOW(),
  -- ...
);
```

**Modified Tables:**

| Table | Column | Change | Reason |
|-------|--------|--------|--------|
| existing_table | new_column | ADD | [Why] |

**Indexes:**

| Table | Index | Columns | Type |
|-------|-------|---------|------|
| table_name | idx_field_1 | field_1 | btree |

### Algorithms / Business Logic

> Key algorithms or complex business rules

**[Algorithm/Rule Name]:**

1. Step 1: [Description]
2. Step 2: [Description]
3. ...

**Edge Cases:**
- [Edge case 1]: [How it's handled]
- [Edge case 2]: [How it's handled]

## API Contract

> Complete API specification

### Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/v1/resource | Create resource | Bearer |
| GET | /api/v1/resource/:id | Get resource | Bearer |

### Request/Response Schemas

**POST /api/v1/resource**

Request:
```json
{
  "field_1": "string (required)",
  "field_2": "number (optional, default: 0)"
}
```

Response (201):
```json
{
  "id": "uuid",
  "field_1": "string",
  "field_2": "number",
  "created_at": "ISO8601"
}
```

Error Responses:
| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid input |
| 401 | UNAUTHORIZED | Missing/invalid token |
| 409 | CONFLICT | Resource already exists |

## Security Considerations

> Authentication, authorization, data protection

- **Authentication:** [How users are authenticated]
- **Authorization:** [Who can access what]
- **Data Protection:** [Sensitive data handling, encryption]
- **Input Validation:** [Validation rules]

## Error Handling

> How errors are handled and communicated

| Error Scenario | User Message | Log Level | Recovery |
|----------------|--------------|-----------|----------|
| Dependency unavailable | "Service temporarily unavailable" | ERROR | Retry with backoff |
| Invalid input | "Validation failed: {details}" | WARN | Return error |

## Observability

### Logging

| Event | Level | Fields |
|-------|-------|--------|
| Resource created | INFO | resource_id, user_id |
| Validation failed | WARN | errors, input |

### Metrics

| Metric | Type | Labels |
|--------|------|--------|
| resource_created_total | counter | status |
| resource_creation_duration | histogram | - |

### Traces

| Span | Attributes |
|------|------------|
| create_resource | resource_type, user_id |

## Acceptance Criteria

> Use Given/When/Then format. Each criterion must be independently testable.

- [ ] **AC1:** Given [precondition], when [action], then [result]
- [ ] **AC2:** Given [precondition], when [action], then [result]
- ...

## Domain Model

> Comprehensive domain knowledge extracted from this change.

### Entities

| Entity | Definition | Spec Path | Status |
|--------|------------|-----------|--------|
| User | A person who authenticates with the system | specs/domain/user.md | Existing (modify) |
| Session | An authenticated period of user activity | specs/domain/session.md | New |

### Relationships

```text
User ─────────────┐
  │               │
  │ has-many      │ owns
  ▼               ▼
Session ◄──── AuthToken
        issued-for
```

### Glossary

| Term | Definition | First Defined In |
|------|------------|------------------|
| Authentication | Process of verifying user identity | This spec |
| Session | Active authenticated state for a user | This spec |

### Bounded Contexts

- **Identity Context**: User, Session, AuthToken (this change)
- **[Other Context]**: [Related entities]

## Specs Directory Changes

> **REQUIRED**: Every change to `specs/` must be declared here. Implementation validates against this.

### Before

```text
specs/
├── domain/
│   └── user.md
└── api/
    └── users.md
```

### After

```text
specs/
├── domain/
│   ├── user.md          # MODIFIED - add session relationship
│   ├── session.md       # NEW
│   └── auth-token.md    # NEW
└── api/
    ├── users.md
    └── auth.md          # NEW - authentication endpoints
```

### Changes Summary

| Path | Action | Description |
|------|--------|-------------|
| specs/domain/user.md | Modify | Add `sessions` relationship, `lastLogin` field |
| specs/domain/session.md | Create | New entity for user sessions |

**Validation**: During `/sdd I want to verify the implementation`, the system checks that:
1. All files listed here were actually created/modified
2. No specs/ files were changed that aren't listed here

## Components

> Components identified during discovery. New components will be scaffolded during implementation.

### New Components

| Component | Type | Settings | Purpose |
|-----------|------|----------|---------|
| my-component | <type> | depends_on: [other-component] | Handles business logic |

### Modified Components

| Component | Changes |
|-----------|---------|
| existing-component | Add new capabilities for feature |

## System Analysis

> What the system inferred beyond the explicit requirements.

### Inferred Requirements

- [What the system determined beyond explicit spec]

### Gaps & Assumptions

- [What's missing or assumed]

### Cross-References

- [Other specs/changes this depends on]
- [Cross-references to related specs in the domain model]

## Requirements Discovery

> Full Q&A trail from spec solicitation (auto-populated).

### Questions & Answers

| Step | Question | Answer |
|------|----------|--------|
| Context | What problem does this solve? | [User response] |
| Functional | What should the system do? | [User response] |

### User Feedback

- [Clarifications, corrections, or additional context provided during review]

## Domain Updates

> Specify all domain documentation changes upfront. Implementation executes these exactly.

### Glossary Terms

> List exact terms to add or modify in `specs/domain/glossary.md`

| Term | Definition | Action |
|------|------------|--------|
| Term Name | Complete definition including context and usage | add/update |

### Definition Specs

> List domain definition files to create or update in `specs/domain/definitions/`

| File | Description | Action |
|------|-------------|--------|
| `<definition-name>.md` | What this definition covers | create/update |

### Architecture Docs

> List architecture documentation updates needed in `specs/architecture/`

- [ ] Update `<doc-name>.md` with [description of change]

## Testing Strategy

> Comprehensive testing approach

### Unit Tests

| Component | Test Case | Expected Behavior |
|-----------|-----------|-------------------|
| [service] | [scenario] | [expected result] |
| [service] | [edge case] | [expected result] |

### Integration Tests

| Scenario | Components | Expected Outcome |
|----------|------------|------------------|
| [scenario] | [A → B] | [result] |

### E2E Tests

| User Flow | Steps | Expected Result |
|-----------|-------|-----------------|
| [flow name] | 1. [step] 2. [step] | [outcome] |

### Test Data

> Required test fixtures or data

| Entity | Required State | Purpose |
|--------|---------------|---------|
| User | Active, verified | Happy path testing |
| User | Suspended | Error path testing |

## Dependencies

### Internal Dependencies

| Component | Version | Reason |
|-----------|---------|--------|
| [service] | >= 1.2.0 | Requires [feature] |

### External Dependencies

| Service | API Version | Fallback |
|---------|-------------|----------|
| [external] | v2 | [how to handle unavailability] |

## Migration / Rollback

### Migration Steps

1. [Step 1]
2. [Step 2]

### Rollback Plan

1. [How to revert if issues occur]
2. [Data rollback if needed]

### Feature Flags

| Flag | Default | Purpose |
|------|---------|---------|
| enable_feature_x | false | Gradual rollout |

## Out of Scope

> Explicitly list what this feature does NOT include

- Item 1: [Why it's out of scope]
- Item 2: [Why it's out of scope]

## Open Questions

> Unresolved questions that need answers before/during implementation

- [ ] Question 1?
- [ ] Question 2?

## References

> Links to related specs, docs, or external resources

- [Related Spec](path/to/spec.md)
- [External Doc](https://example.com)
