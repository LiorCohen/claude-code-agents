# Decomposition Algorithm

## Phase 1: Structure Extraction

Parse the markdown document to extract:

1. **Section headers** (H1, H2, H3)
   - Look for change-like patterns: `## Feature:`, `## Module:`, `## Capability:`, `## Epic:`
   - Note section hierarchy and nesting

2. **User stories**
   - Pattern: `As a [role], I want [capability] so that [benefit]`
   - Group by role (admin, user, guest, etc.)

3. **Acceptance criteria**
   - Pattern: `Given [context] When [action] Then [result]`
   - Also: checkbox lists under "Acceptance Criteria" headers

4. **External interfaces**
   - Pattern: operations exposed by the component
   - Group by domain (users, orders, auth)

5. **Domain concepts**
   - Capitalized nouns that appear repeatedly
   - Terms in bold or defined inline
   - Glossary entries if present

## Phase 2: Boundary Detection

Identify potential change boundaries using these signals:

**Strong Signals (high confidence):**
- Explicit section markers (`## Feature: User Authentication`)
- Distinct interface namespaces (auth vs orders)
- Non-overlapping user roles across sections
- Separate persistence entities mentioned

**Moderate Signals:**
- Thematic grouping of user stories
- Related acceptance criteria clusters
- Shared domain concepts within a section

**Weak Signals:**
- Sequential phase references ("Phase 1", "MVP", "v2")
- Different authors/dates in comments

## Phase 3: Dependency Detection

For each potential change, identify dependencies:

1. **Concept dependencies**: Change B uses concepts defined by Change A
2. **API dependencies**: Change B calls endpoints exposed by Change A
3. **Data dependencies**: Change B reads data created by Change A
4. **Explicit dependencies**: Spec mentions "requires X" or "after Y is complete"

Build a directed acyclic graph (DAG) of change dependencies.

## Phase 4: Independence Scoring

Score each change's independence (0.0 to 1.0):

```text
Independence Score =
  + 0.3 if has own external interfaces
  + 0.2 if has own data model/entities
  + 0.2 if has own user-facing surface
  + 0.2 if has >= 3 acceptance criteria
  + 0.1 if has distinct user role
  - 0.2 for each hard dependency on other proposed changes
  - 0.1 for each shared domain concept
```

**Interpretation:**
- Score >= 0.5: Good standalone change
- Score 0.3-0.5: Consider merging with related change
- Score < 0.3: Should be merged or is cross-cutting concern

## Phase 5: Refinement

1. **Merge** changes with independence score < 0.5 into related changes
2. **Flag** large changes (> 15 ACs) for potential splitting
3. **Order** changes by dependency graph (topological sort)
4. **Identify** cross-cutting concerns (auth, logging, error handling)

## Complexity Estimation

- **SMALL**: <= 3 acceptance criteria, <= 2 endpoints
- **MEDIUM**: 4-8 acceptance criteria, 3-5 endpoints
- **LARGE**: > 8 acceptance criteria, > 5 endpoints
- **EPIC**: > 10 acceptance criteria, > 5 endpoints, 3+ components

**Epic Flag:**
If a change scores as EPIC, set `type: epic` and `requires_epic: true` on the DecomposedChange. The `requires_epic: true` flag signals that during implementation, the `change-creation` skill creates an epic structure: a parent `type: epic` change containing child `type: feature` changes in a `changes/` subdirectory.

## Heuristics

### Merge Candidates

Changes should be merged when:
- Combined changes have < 5 acceptance criteria total
- Changes share > 50% of their domain concepts
- One change's only purpose is to support another
- Circular or bidirectional dependencies detected

### Split Candidates

Changes should be split when:
- Change has > 10 acceptance criteria
- Change has > 5 external interfaces
- Change spans multiple distinct user roles
- Change covers multiple domains

### Cross-Cutting Concerns

These patterns indicate cross-cutting concerns:
- **Authentication/Authorization**: Usually first change (dependency for all)
- **Error handling**: Often embedded in each change, not standalone
- **Logging/Telemetry**: Usually infrastructure, not a change
- **Configuration**: Part of project setup, not a change
