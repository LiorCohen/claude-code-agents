# Data Structures

## DecomposedChange

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
interfaces: list        # external interfaces this change exposes
user_stories: list
domain_concepts: list
independence_score: float  # 0.0-1.0
requires_epic: boolean  # true if complexity is "epic"
components_affected: list  # component names from tech pack manifest
```

## DecompositionResult

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

## HierarchicalDecompositionResult

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
        interfaces: [...]
      - id: f2
        name: authentication
        title: User Authentication
        order: 2
        dependencies: [f1]
        source_sections: ["## User Authentication"]
        acceptance_criteria: [...]
        interfaces: [...]
      - id: f3
        name: password-reset
        title: Password Reset
        order: 3
        dependencies: [f2]
        source_sections: ["## Password Reset"]
        acceptance_criteria: [...]
        interfaces: [...]
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
  f1: [component-a, component-b, component-c]
  f2: [component-a, component-c, component-d]
  f3: [component-a, component-c, component-d]
  f4: [component-a, component-d]
  f5: [component-d]

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
        definition: "Credential for session management"
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
    - component: component-a
      affected: true
      reason: "Authentication logic"
    - component: component-b
      affected: true
      reason: "Login interface components"
  contract_first_order:
    - tier: 1
      category: "Contracts"
      items: [f1]
    - tier: 2
      category: "Services"
      items: [f2, f3]
    - tier: 3
      category: "User-Facing"
      items: [f4, f5]
```

## Special Cases

### Spec Too Small

If spec has < 3 acceptance criteria AND < 2 interfaces:
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
- Add warning identifying the cycle: "Circular dependency detected: c2 <-> c3"
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
- Assign new IDs (e.g., c3 -> c3a, c3b)
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
      interfaces: [signup, login, logout]
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
      interfaces: [create-team, get-team, invite-member]
      independence_score: 0.6
  shared_concepts: [User, Team, Session]
  suggested_order: [c1, c2]
  warnings: []
```
