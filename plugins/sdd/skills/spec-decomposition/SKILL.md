---
name: spec-decomposition
description: Analyze specifications and decompose into independent changes.
---

# Spec Decomposition Skill

## Purpose

Analyze a specification document to identify natural change boundaries and return a structured decomposition result. This is a pure analysis skill that takes input and returns output without user interaction.

## Input

| Parameter | Required | Description |
|-----------|----------|-------------|
| `spec_content` | Yes | The markdown content of the specification to analyze |
| `spec_path` | No | Original path to the spec file (for reference tracking) |
| `default_domain` | No | Default domain to use if not detected |

## Output

Returns a `DecompositionResult` structure (see Data Structures below).

## Algorithm

### Phase 1: Structure Extraction

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

4. **API endpoints**
   - Pattern: `METHOD /path` (e.g., `POST /users`, `GET /orders/:id`)
   - Group by namespace (`/users/*`, `/orders/*`, `/auth/*`)

5. **Domain concepts**
   - Capitalized nouns that appear repeatedly
   - Terms in bold or defined inline
   - Glossary entries if present

### Phase 2: Boundary Detection

Identify potential change boundaries using these signals:

**Strong Signals (high confidence):**
- Explicit section markers (`## Feature: User Authentication`)
- Distinct API namespaces (`/auth/*` vs `/orders/*`)
- Non-overlapping user roles across sections
- Separate database entities mentioned

**Moderate Signals:**
- Thematic grouping of user stories
- Related acceptance criteria clusters
- Shared domain concepts within a section

**Weak Signals:**
- Sequential phase references ("Phase 1", "MVP", "v2")
- Different authors/dates in comments

### Phase 3: Dependency Detection

For each potential change, identify dependencies:

1. **Concept dependencies**: Change B uses concepts defined by Change A
2. **API dependencies**: Change B calls endpoints exposed by Change A
3. **Data dependencies**: Change B reads data created by Change A
4. **Explicit dependencies**: Spec mentions "requires X" or "after Y is complete"

Build a directed acyclic graph (DAG) of change dependencies.

### Phase 4: Independence Scoring

Score each change's independence (0.0 to 1.0):

```
Independence Score =
  + 0.3 if has own API endpoints
  + 0.2 if has own data model/entities
  + 0.2 if has own UI section/pages
  + 0.2 if has >= 3 acceptance criteria
  + 0.1 if has distinct user role
  - 0.2 for each hard dependency on other proposed changes
  - 0.1 for each shared domain concept
```

**Interpretation:**
- Score >= 0.5: Good standalone change
- Score 0.3-0.5: Consider merging with related change
- Score < 0.3: Should be merged or is cross-cutting concern

### Phase 5: Refinement

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
If a change scores as EPIC, set `type: epic` and `requires_epic: true` on the DecomposedChange. The change should be created as an `epic` type containing feature-type child changes in a `changes/` subdirectory (see `epic-planning` skill).

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
- Change has > 5 API endpoints
- Change spans multiple distinct user roles
- Change covers multiple domains

### Cross-Cutting Concerns

These patterns indicate cross-cutting concerns:
- **Authentication/Authorization**: Usually first change (dependency for all)
- **Error handling**: Often embedded in each change, not standalone
- **Logging/Telemetry**: Usually infrastructure, not a change
- **Configuration**: Part of project setup, not a change

## Data Structures

### DecomposedChange

```yaml
id: string              # e.g., "c1", "c2"
name: string            # e.g., "user-authentication"
title: string           # display: "User Authentication"
type: string            # "feature" | "bugfix" | "refactor" | "epic"
description: string     # 1-2 sentence summary
domain: string          # "Identity", "Billing", "Core"
source_sections: list   # section names from original spec
complexity: string      # "small" | "medium" | "large" | "epic"
dependencies: list      # change ids this depends on
acceptance_criteria: list
api_endpoints: list     # "METHOD /path" strings
user_stories: list
domain_concepts: list
independence_score: float  # 0.0-1.0
requires_epic: boolean  # true if complexity is "epic"
components_affected: list  # ["contract", "server", "webapp", ...]
```

### DecompositionResult

```yaml
spec_path: string          # original spec path (if provided)
analysis_date: string      # ISO date
changes: list              # list of DecomposedChange
shared_concepts: list      # concepts used by multiple changes
suggested_order: list      # change ids in implementation order
warnings: list             # any issues detected
is_decomposable: boolean   # false if spec is too small/simple
```

## Special Cases

### Spec Too Small

If spec has < 3 acceptance criteria AND < 2 API endpoints:
- Set `is_decomposable: false`
- Return single change containing all content
- Add warning: "Spec is compact enough for single change implementation"

### No Clear Boundaries

If no strong boundary signals found:
- Set `is_decomposable: false`
- Return single change containing all content
- Add warning: "No clear change boundaries detected; content appears tightly coupled"

### Circular Dependencies

If dependency graph contains cycles:
- Add warning identifying the cycle: "Circular dependency detected: c2 ↔ c3"
- Suggest merge in warning: "Consider merging these changes"

### Very Large Change

If a change has > 15 acceptance criteria:
- Add warning: "Change 'X' is large (N ACs); consider splitting"

## Operations

The caller can perform these operations on the result:

### Merge Changes

Combine changes by ID:
- Union all sections, endpoints, acceptance criteria, user stories
- Use first change's name or generate new one
- Recalculate dependencies (remove internal dependencies)
- Recalculate independence scores
- Update suggested_order

### Split Change

Split a change by criteria:
- Re-analyze the change content with provided hint
- Generate 2+ sub-changes
- Assign new IDs (e.g., c3 → c3a, c3b)
- Recalculate dependencies
- Update suggested_order

### Rename Change

Update change name:
- Validate new name is valid directory name (lowercase, hyphens)
- Update name and title fields

### Change Type

Update the change type:
- Valid types: `feature`, `bugfix`, `refactor`, `epic`
- Update the type field
- Note: Type defaults to `feature` for most decomposed specs

## Example Usage

```
Input:
  spec_content: <markdown content>
  spec_path: /path/to/product-requirements.md
  default_domain: "Task Management"

Output:
  spec_path: /path/to/product-requirements.md
  analysis_date: 2026-01-21
  is_decomposable: true
  changes:
    - id: c1
      name: user-authentication
      title: User Authentication
      type: feature
      description: Allow users to sign up, sign in, and manage sessions
      domain: Identity
      complexity: medium
      dependencies: []
      acceptance_criteria: [...]
      api_endpoints: [POST /auth/signup, POST /auth/login, DELETE /auth/logout]
      independence_score: 0.8
    - id: c2
      name: team-management
      title: Team Management
      type: feature
      description: Create and manage teams with member invitations
      domain: Core
      complexity: medium
      dependencies: [c1]
      acceptance_criteria: [...]
      api_endpoints: [POST /teams, GET /teams/:id, POST /teams/:id/invite]
      independence_score: 0.6
  shared_concepts: [User, Team, Session]
  suggested_order: [c1, c2]
  warnings: []
```
