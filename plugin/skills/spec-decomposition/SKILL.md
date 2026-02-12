---
name: spec-decomposition
description: Analyze specifications and decompose into independent changes.
user-invocable: false
---

# Spec Decomposition Skill

## Purpose

Analyze a specification document to identify natural change boundaries and return a structured decomposition result. This is a pure analysis skill that takes input and returns output without user interaction.

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts decomposition mode, spec content, and mode-specific parameters for outline, section, or hierarchical decomposition.

## Chunked Outline Extraction

**Always** extract the spec outline before full analysis. This prevents context overflow for large specs.

### Mode: "outline"

Extract markdown headers without processing prose content. This is a pure parsing operation (no LLM reasoning needed).

**Algorithm (Single File):**

1. Read spec content (can be done in chunks for very large files)
2. Use regex to find headers: `/^(#{1,6})\s+(.+)$/gm`
3. Track line numbers for each header
4. Calculate `end_line` for each header (next header's start_line - 1, or total lines)
5. Return flat list of sections with line ranges

**Algorithm (Directory with Multiple Files):**

1. For each file in `spec_files`:
   - Read file content
   - Extract headers with line numbers
   - Prefix each section with `source_file` field
2. Combine all sections into unified outline
3. Each section includes which file it came from

**Output (OutlineResult) - Single File:**

```yaml
mode: "outline"
is_directory: false
sections:
  - level: 1
    header: "Product Requirements"
    start_line: 1
    end_line: 9
  - level: 2
    header: "User Authentication"
    start_line: 10
    end_line: 50
  - level: 3
    header: "Login Flow"
    start_line: 15
    end_line: 30
  - level: 3
    header: "Registration"
    start_line: 31
    end_line: 50
  - level: 2
    header: "Dashboard"
    start_line: 51
    end_line: 120
total_lines: 120
has_headers: true
```

**Output (OutlineResult) - Directory:**

```yaml
mode: "outline"
is_directory: true
files:
  - path: "README.md"
    total_lines: 50
  - path: "auth/authentication.md"
    total_lines: 120
  - path: "dashboard/overview.md"
    total_lines: 80
sections:
  - level: 1
    header: "Product Overview"
    source_file: "README.md"
    start_line: 1
    end_line: 50
  - level: 1
    header: "User Authentication"
    source_file: "auth/authentication.md"
    start_line: 1
    end_line: 60
  - level: 2
    header: "Login Flow"
    source_file: "auth/authentication.md"
    start_line: 10
    end_line: 40
  - level: 1
    header: "Dashboard"
    source_file: "dashboard/overview.md"
    start_line: 1
    end_line: 80
total_files: 3
has_headers: true
```

If no headers found:

```yaml
mode: "outline"
sections: []
total_lines: 500
has_headers: false
```

### Mode: "section"

Analyze a single section's content. Use this after outline extraction to process one section at a time.

**Input:**

```yaml
mode: "section"
spec_content: <content of ONE section only>
section_header: "## User Authentication"
default_domain: "Identity"
```

**Output:**

Returns a single `DecomposedChange` for that section, using the standard algorithm (Phase 1-5 below) applied to the section content only.

### Mode: "hierarchical"

Two-level decomposition for large external specs. Creates numbered epics from H1 sections and numbered features from H2/H3 sections within each epic.

**Input:**

```yaml
mode: "hierarchical"
spec_outline: <pre-extracted outline with line ranges>
spec_content: <full spec content>
default_domain: <primary domain>
include_thinking: true  # Enable comprehensive domain analysis

# NEW: Accept transformation and discovery output
classified_transformation:  # From external-spec-integration transformation step
  domain_knowledge: {...}
  constraints: {...}
  requirements: {...}
  design_details: {...}
  gaps: {...}
  clarifications: [...]
  assumptions: [...]

discovered_components:  # From component-discovery skill
  - type: server
    reason: "..."
  - type: webapp
    reason: "..."
```

**Algorithm:**

1. Group sections by H1 headers (each H1 becomes an epic)
2. Within each H1, H2/H3 sections become features
3. **Use transformation output** (if provided):
   - Pre-classified requirements inform decomposition
   - Gaps identify areas needing solicitation focus
   - Assumptions document what was pre-determined
4. **Thinking Step** (if include_thinking=true):
   - Domain Analysis (entities, relationships, glossary, bounded contexts)
   - Specs Impact Analysis (before/after, new vs modified)
   - Gap Analysis (what's missing or assumed)
   - Component Mapping (which components affected - use discovered_components)
5. **Build dependency graph**:
   - Features depend on other features (based on concept/API references)
   - Epics depend on other epics (if any feature depends on another epic's feature)
   - **Store dependencies in decomposition output for workflow.yaml**
6. **API-First Ordering** (topological sort with priority):
   - API Contracts / Interfaces first
   - Data Models / Database second
   - Backend Services / Business Logic third
   - Frontend Components / UI fourth
   - Infrastructure / DevOps last
7. Assign numbers: 01, 02, 03, etc.

**Output (HierarchicalDecompositionResult):**

```yaml
mode: "hierarchical"
epics:
  - id: e1
    name: user-management
    title: User Management
    order: 1
    source_h1: "# User Management"
    features:
      - id: f1
        name: registration
        title: User Registration
        order: 1
        dependencies: []
        source_sections: ["## User Registration"]
        acceptance_criteria: [...]
        api_endpoints: [...]
      - id: f2
        name: authentication
        title: User Authentication
        order: 2
        dependencies: [f1]
        source_sections: ["## User Authentication"]
        acceptance_criteria: [...]
        api_endpoints: [...]
      - id: f3
        name: password-reset
        title: Password Reset
        order: 3
        dependencies: [f2]
        source_sections: ["## Password Reset"]
        acceptance_criteria: [...]
        api_endpoints: [...]
  - id: e2
    name: dashboard
    title: Dashboard
    order: 2
    epic_dependencies: [e1]
    features:
      - id: f4
        name: analytics
        title: Analytics Dashboard
        order: 1
        dependencies: []
        source_sections: ["## Analytics"]
      - id: f5
        name: settings
        title: User Settings
        order: 2
        dependencies: [f4]
        source_sections: ["## Settings"]
  - id: e3
    name: billing
    title: Billing
    order: 3
    epic_dependencies: [e1]
    features: [...]
shared_concepts: ["User", "Session", "Token"]
suggested_epic_order: [e1, e2, e3]
warnings: []

# Dependencies (for workflow.yaml)
dependency_graph:
  items:
    - id: f1
      depends_on: []
    - id: f2
      depends_on: [f1]  # Authentication depends on Registration
    - id: f3
      depends_on: [f2]  # Password Reset depends on Authentication
    - id: f4
      depends_on: [f1]  # Analytics depends on User model from Registration
    - id: f5
      depends_on: [f4]
  epics:
    - id: e1
      depends_on: []
    - id: e2
      depends_on: [e1]  # Dashboard depends on User Management
    - id: e3
      depends_on: [e1]  # Billing depends on User Management

# Components mapping (from discovered_components or derived)
components_per_item:
  f1: [server, database, contract]
  f2: [server, contract, webapp]
  f3: [server, contract, webapp]
  f4: [server, webapp]
  f5: [webapp]

# Transformation data (passed through for context files)
transformation_data:
  clarifications: <from input>
  assumptions: <from input>
  gaps: <from input>

# Thinking Step Output (if include_thinking=true)
thinking:
  domain_model:
    entities:
      - name: User
        definition: "A person who authenticates with the system"
        spec_path: specs/domain/user.md
        status: existing  # or "new"
      - name: Session
        definition: "An authenticated period of user activity"
        spec_path: specs/domain/session.md
        status: new
    relationships:
      - "User has-many Sessions"
      - "Session belongs-to User"
    glossary_terms:
      - term: Authentication
        definition: "Process of verifying user identity"
      - term: Token
        definition: "JWT credential for session management"
    bounded_contexts:
      - name: Identity
        entities: [User, Session, Token]
      - name: Analytics
        entities: [Dashboard, Metric]
  specs_impact:
    before: [specs/domain/user.md, specs/api/users.md]
    after:
      - path: specs/domain/user.md
        status: modified
      - path: specs/domain/session.md
        status: new
      - path: specs/api/auth.md
        status: new
    changes_summary:
      - path: specs/domain/user.md
        action: modify
        description: "Add sessions relationship"
      - path: specs/domain/session.md
        action: create
        description: "New entity for sessions"
  gaps_identified:
    - "Password policy requirements not specified"
    - "Session timeout duration not defined"
  component_mapping:
    - component: server
      affected: true
      reason: "Backend authentication logic"
    - component: webapp
      affected: true
      reason: "Login UI components"
  api_first_order:
    - tier: 1
      category: "API Contracts"
      items: [f1]
    - tier: 2
      category: "Backend Services"
      items: [f2, f3]
    - tier: 3
      category: "Frontend"
      items: [f4, f5]
```

**Numbering Rules:**
- Epics: `01-epic-name`, `02-epic-name`, etc.
- Features within epics: `01-feature-name`, `02-feature-name`, etc.
- Numbers based on topological sort of dependency graph
- Independent items can share the same "phase" but get sequential numbers

**When to use hierarchical mode:**
- Spec has 2+ H1 sections
- At least one H1 has 2+ H2 subsections
- Large external specs being imported

---

### Default Mode (Full Analysis)

If `mode` is omitted, perform full analysis on the entire `spec_content`. This is the legacy behavior, suitable only for small specs that fit in context.

**Warning:** For specs > ~50KB, always use outline mode first, then section mode per-section.

---

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns mode-specific results: outline sections, or hierarchical epic/feature groupings with dependency graph.

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

```text
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
recommend_epic: boolean    # true if changes.length >= 3 (signals epic structure recommended)
```

**Epic Recommendation:**
When `recommend_epic` is true (3+ changes identified), the changes should be wrapped in an epic structure. This provides better organization for larger decompositions.

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

Available operations on the result:

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

```yaml
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
