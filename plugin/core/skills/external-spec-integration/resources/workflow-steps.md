# Workflow Steps

Detailed steps 1-10 for processing external specifications into the SDD workflow structure.

## Step 1: Archive External Spec

**Single location, single copy — use the system CLI:**

```bash
<plugin-root>/system/system-run.sh archive store --source <external-spec-path> --type external-spec --json
```

The CLI handles datetime-prefix naming (`yyyymmdd-HHmm-lowercased-original-name.md`), directory creation, and lowercasing automatically. Parse the JSON result to get `archived_path`.

**For directories**, the same command works — the CLI detects directory sources and copies all files preserving structure, returning `is_directory: true` and `file_count`.

Display the result: `"Archived to: sdd/archive/external-specs/20260205-1430-feature-spec.md"`

**IMPORTANT**: This is the ONLY copy. The archived spec is read-only and for audit trail only.

## Step 2: Detect Large Specs

Before transformation, estimate spec size:

```text
Estimated tokens ≈ character_count / 4
```

**Threshold:** If estimated tokens > 15,000, use chunked processing.

```yaml
spec_info:
  path: /path/to/spec.md
  estimated_tokens: 28000
  is_large: true
  sections:
    - title: "User Management"
      line_start: 1
      line_end: 450
      estimated_tokens: 8200
    - title: "Dashboard"
      line_start: 451
      line_end: 780
      estimated_tokens: 6100
```

For large specs, display:

```text
═══════════════════════════════════════════════════════════════
 LARGE SPEC DETECTED
═══════════════════════════════════════════════════════════════

This spec is approximately 28,000 tokens (~112 pages).
I'll process it in sections to ensure thorough analysis.

Found 5 major sections:
  1. User Management (8,200 tokens)
  2. Dashboard (6,100 tokens)
  3. Billing (5,800 tokens)
  4. Reporting (4,500 tokens)
  5. Admin Panel (3,400 tokens)

Processing section 1 of 5: User Management...

[████░░░░░░░░░░░░░░░░] 1/5 sections
```

## Step 3: Transformation

See [transformation.md](transformation.md) for the full classification, gap analysis, and clarification question process.

## Step 4: Component Discovery

After transformation, invoke component-discovery:

```yaml
INVOKE component-discovery skill with:
  classified_requirements: <from transformation>
  mode: "external-spec"
```

This runs ONCE for the entire external spec (not per-item).

**Output documented (NOT applied to system):**

```yaml
discovered_components:
  - type: <type-from-tech-pack>
    reason: "Handles core business logic"
  - type: <type-from-tech-pack>
    reason: "User-facing interface"
  - type: <type-from-tech-pack>
    reason: "Data persistence"
```

## Step 5: Present Outline to User

The `spec_outline` is already extracted. Detect hierarchical decomposition:

**Hierarchical decomposition applies when:**
- Spec has 2+ H1 sections
- At least one H1 has 2+ H2 subsections

**Display for hierarchical specs:**

```text
I found the following structure in this spec:

EPICS (from H1 sections):
  01 User Management (lines 10-150)
     ├── 01 Registration
     ├── 02 Authentication
     └── 03 Password Reset

  02 Dashboard (lines 151-300) [depends on: User Management]
     ├── 01 Analytics
     └── 02 Settings

Total: 2 epics, 5 features
Implementation order: 01 → 02 (02 depends on 01)

Options:
  [A] Accept this breakdown
  [S] Single change (don't split)
  [C] Cancel
```

## Step 6: Thinking Step (Domain Analysis)

Perform deep analysis using transformation output:

```yaml
INVOKE spec-decomposition skill with:
  mode: "hierarchical"
  spec_outline: <from input>
  spec_content: <full spec content from archive>
  classified_transformation: <from step 3>  # Include transformation
  discovered_components: <from step 4>       # Include discovery
  default_domain: <primary_domain>
  include_thinking: true
```

The thinking step produces:

### 6a. Domain Analysis

- **Entities**: Extract all domain entities (capitalized nouns that represent concepts)
- **Relationships**: Identify relationships (has-a, is-a, depends-on)
- **Glossary**: Build glossary of terms with precise definitions
- **Bounded Contexts**: Identify bounded contexts and aggregates
- **Spec Mapping**: Map each entity to a spec file path (new or existing)

Example output:
```yaml
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
```

### 6b. Specs Directory Impact

Show before/after of `specs/` directory:

```yaml
specs_impact:
  before:
    - specs/domain/user.md
    - specs/api/users.md
  after:
    - specs/domain/user.md          # MODIFIED
    - specs/domain/session.md       # NEW
    - specs/domain/auth-token.md    # NEW
    - specs/api/users.md
    - specs/api/auth.md             # NEW
  changes_summary:
    - path: specs/domain/user.md
      action: modify
      description: "Add sessions relationship, lastLogin field"
    - path: specs/domain/session.md
      action: create
      description: "New entity for user sessions"
```

### 6c. Gap Analysis

Identify what's missing or assumed:

```yaml
gaps_identified:
  - "Password policy requirements not specified"
  - "Session timeout duration not defined"
  - "Email verification flow not detailed"
```

### 6d. API-First Ordering

Reorder items for API-first implementation:

```yaml
recommended_order:
  # Order determined by techpacks.dependencyOrder for the active tech pack
  1. <component-type ordered by dependency>
  2. <component-type ordered by dependency>
  3. ...
```

## Step 7: Display Thinking Output

Show the analysis to user for review:

```text
═══════════════════════════════════════════════════════════════
 DOMAIN ANALYSIS
═══════════════════════════════════════════════════════════════

ENTITIES IDENTIFIED:
  User          → specs/domain/user.md (existing, will modify)
  Session       → specs/domain/session.md (NEW)
  AuthToken     → specs/domain/auth-token.md (NEW)

RELATIONSHIPS:
  User ─────┬──── has-many ───→ Session
            └──── owns ───────→ AuthToken

SPECS IMPACT:
  Before: 2 files in specs/
  After: 4 files in specs/ (+2 new, 1 modified)

GAPS IDENTIFIED:
  - Password policy requirements not specified
  - Session timeout duration not defined

IMPLEMENTATION ORDER (API-first):
  1. 01-registration (API contracts first)
  2. 02-authentication (depends on 01)
  3. 03-password-reset (depends on 02)

Continue with this analysis? [Y/n]
```

## Step 8: Create Workflow Items

For each item in the decomposition:

```yaml
INVOKE workflow-state.create_item with:
  workflow_id: <workflow_id>
  id: <NN-slug>
  title: <Title>
  type: feature | epic
  parent_id: <epic-id if nested>
  context_sections: <sections from external spec>
  depends_on: <dependencies>
```

## Step 9: Create Context Files

For each leaf item, create `context.md` in drafts (include transformation output):

```markdown
# Context: Registration

## Original Content

[Full section content embedded here — self-sufficient, no external references]

## Domain Analysis

### Entities
- User (new/existing)
- ...

### Specs Impact
- specs/domain/user.md (modify)
- ...

## Gaps Identified
- Password policy not specified

---
Note: This context is read-only. Use it as input during spec solicitation.
```

## Step 10: Return Summary

```yaml
success: true
workflow_id: a1b2c3
transformation:
  classification: {...}
  gaps: {...}
  clarifications: [...]
  assumptions: [...]
discovered_components: [...]
items_created: [...]
thinking_output:
  domain_model: {...}
  specs_impact: {...}
  gaps_identified: [...]
  recommended_order: [...]
first_item:
  change_id: user-auth-1
  title: Registration
  status: pending
```
