# Feature Spec Template (Tech Spec)

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
| S1 | [Deep-dive question for component] | [Answer] | User |
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
```
