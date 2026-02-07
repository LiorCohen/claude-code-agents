---
name: external-spec-integration
description: Process external specifications through transformation, classification, gap analysis, component discovery, and decomposition. Creates workflow items with classified context.
user-invocable: false
---

# External Spec Integration Skill

Processes external specification files into the SDD workflow structure. Transforms product specs into classified tech spec context - specs are created interactively one at a time.

## Purpose

When a user provides an external specification via `/sdd-change new --spec`:
- Archive the external spec to `.sdd/archive/external-specs/` (single copy, yyyymmdd-filename format)
- **TRANSFORM** the spec: classify information, identify gaps, ask clarifying questions
- **DISCOVER** required components through targeted questions
- **DECOMPOSE** into workflow items with classified context
- Create workflow items with context in `.sdd/workflows/<workflow-id>/`
- **DO NOT** create SPEC.md or PLAN.md files - those are created interactively

**CRITICAL: External specs are product specs (WHAT/WHY). This skill transforms them into tech spec context (HOW) before decomposition.**

## Key Insight: External Specs Are Inherently Incomplete

**Always assume external specs are lacking:**
- Details not thought through by product people
- Technical implications not considered by non-engineers
- Missing edge cases, error handling, and non-functional requirements
- Implicit assumptions never made explicit

**Critical asymmetry:**
| Area | Typical Detail Level | Action Required |
|------|---------------------|-----------------|
| **Frontend/UI** | High | Extract and classify |
| **UX/Design** | High | Extract and classify |
| **API/Contracts** | Low | Must be DERIVED from UI |
| **Backend Logic** | Very Low | Must be extracted through questions |
| **Database/Models** | Very Low | Must be discovered from UI + actions |
| **Non-Functional** | Absent | Must be explicitly asked |

## When to Use

- During `/sdd-change new --spec <path>` when external spec is provided

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts path to external spec file, target directory, workflow ID, and optional domain.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns archived spec path, workflow ID, hierarchical flag, and list of created workflow items.

## Workflow

### Step 1: Archive External Spec

**Single location, single copy:**

1. Create archive directory: `.sdd/archive/external-specs/`
2. Generate filename: `yyyymmdd-lowercased-original-name.md`
3. Copy external spec to archive location
4. Display: "Archived to: .sdd/archive/external-specs/20260205-feature-spec.md"

**For directories:**
1. Create archive subdirectory: `.sdd/archive/external-specs/yyyymmdd-dirname/`
2. Copy all files preserving structure
3. Display file count

**IMPORTANT**: This is the ONLY copy. The archived spec is read-only and for audit trail only.

### Step 2: Detect Large Specs

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

### Step 3: Transformation (NEW)

**CRITICAL STEP**: Transform product spec to tech spec context BEFORE decomposition.

#### 3a. Classification

Parse the external spec and classify each piece of information:

```yaml
transformation:
  domain_knowledge:
    entities:
      - name: User
        definition: "A person who authenticates with the system"
        source: "Line 15: 'Users can register...'"
    glossary:
      - term: Authentication
        definition: "Process of verifying user identity"
    relationships:
      - "User has-many Sessions"

  constraints:
    technical:
      - "API latency < 200ms"
    business:
      - "Users must verify email before accessing dashboard"
    compliance:
      - "GDPR: user data deletion required"

  requirements:
    functional:
      - "Users can register with email"
      - "Users can login with password"
    non_functional:
      - "Support 10k concurrent users"
    acceptance_criteria:
      - "Given a valid email, when user submits registration, then account is created"

  design_details:
    ui_specs:
      - "Login form with email and password fields"
      - "Dashboard shows recent activity"
    user_flows:
      - "Registration → Email verification → Login → Dashboard"
    visual_requirements:
      - "Mobile-responsive design"
```

#### 3b. Gap Analysis

Identify what's MISSING or unclear (weighted toward backend/API):

```yaml
gaps:
  missing_requirements:
    - "Error handling for failed login not specified"
    - "Password requirements not defined"
  undefined_edge_cases:
    - "What happens if user registers with existing email?"
    - "Session timeout behavior not specified"
  missing_nfrs:
    - "No performance requirements stated"
    - "Security requirements undefined"
  ambiguous_terms:
    - "'User' - is this the same as 'Account'?"
  implicit_assumptions:
    - "Assumes email-based authentication"
    - "Assumes single-tenant deployment"
```

#### 3c. Clarification Questions (Non-Blocking, Conversational)

Present what was found, then ask questions ONE AT A TIME:

```text
═══════════════════════════════════════════════════════════════
 TRANSFORMATION COMPLETE
═══════════════════════════════════════════════════════════════

I analyzed the external spec and found:

EXTRACTED (from spec):
  - 5 screens with mockups
  - 3 user flows
  - 12 UI components

DERIVED (from UI descriptions):
  - 4 entities: User, Order, Product, Cart
  - 8 API endpoints (see below)
  - Authorization: users see only their own data

GAPS IDENTIFIED:
  - Password requirements not specified
  - Session timeout not defined
  - Error message format unclear

───────────────────────────────────────────────────────────────

I have some questions about the gaps. Take your time to read the
above, then let me know when you're ready to continue.
```

Then ask ONE question at a time:

```text
Let's fill in the gaps. First question:

What are your password requirements?
(e.g., minimum length, special characters, etc.)

If you're not sure, I'll use industry standard defaults
(8+ chars, mixed case, number required) and document that
as an assumption.
```

Record all Q&A:

```yaml
clarifications:
  - question: "What should happen on duplicate email registration?"
    answer: "Return error, don't reveal if email exists"
    source: User
  - question: "Session timeout duration?"
    answer: "30 minutes of inactivity"
    source: User
  - question: "Password requirements?"
    answer: "8+ characters, industry standard"
    source: Assumption  # User said "I don't know"
```

### Step 4: Component Discovery

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
  - type: server
    reason: "Backend for auth + analytics"
  - type: webapp
    reason: "Dashboard UI"
  - type: database
    reason: "User data persistence"
  - type: contract
    reason: "API definition"
```

### Step 5: Present Outline to User

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

### Step 6: Thinking Step (Domain Analysis)

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

#### 3a. Domain Analysis

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
      definition: "JWT credential for session management"
  bounded_contexts:
    - name: Identity
      entities: [User, Session, Token]
    - name: Analytics
      entities: [Dashboard, Metric]
```

#### 3b. Specs Directory Impact

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

#### 3c. Gap Analysis

Identify what's missing or assumed:

```yaml
gaps_identified:
  - "Password policy requirements not specified"
  - "Session timeout duration not defined"
  - "Email verification flow not detailed"
```

#### 3d. API-First Ordering

Reorder items for API-first implementation:

```yaml
recommended_order:
  1. API Contracts / Interfaces
  2. Data Models / Database
  3. Backend Services / Business Logic
  4. Frontend Components / UI
  5. Infrastructure / DevOps
```

### Step 7: Display Thinking Output

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

### Step 8: Create Workflow Items

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

### Step 9: Create Context Files

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

### Step 10: Return Summary

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
  change_id: a1b2-1
  title: Registration
  status: pending
```

## Key Differences from Previous Version

| Before | After |
|--------|-------|
| Created SPEC.md + PLAN.md immediately | Creates workflow items with context only |
| Archived to `archive/` | Archives to `.sdd/archive/external-specs/` |
| No domain analysis | Comprehensive thinking step with domain extraction |
| No transformation | **NEW: Transformation classifies and identifies gaps** |
| No component discovery | **NEW: Component discovery before decomposition** |
| Order in session only | Order persisted in workflow.yaml |
| All specs created upfront | Specs created one at a time through solicitation |
| Modal dialogs for questions | **NEW: Non-blocking conversational questions** |

## Dependencies

This skill orchestrates:
- `workflow-state` - Creates workflow and items
- `component-discovery` - Identifies needed components (NEW)
- `spec-decomposition` - Analyzes spec structure with thinking step

Trigger: `/sdd-change new --spec` command.

## Workflow Steps Summary

| Step | Action | Output |
|------|--------|--------|
| 1 | Archive External Spec | `.sdd/archive/external-specs/...` |
| 2 | Detect Large Specs | Size estimation, chunking plan |
| 3 | Transformation | Classification, gaps, clarifications |
| 4 | Component Discovery | Components list (not applied) |
| 5 | Present Outline | User reviews structure |
| 6 | Thinking Step | Domain analysis, dependencies |
| 7 | Display Thinking | User confirms analysis |
| 8 | Create Workflow Items | Items in workflow.yaml |
| 9 | Create Context Files | context.md for each item |
| 10 | Return Summary | Complete output |

## Notes

- External specs are product specs - they are transformed, not copied
- Transformation happens BEFORE decomposition
- Component discovery runs ONCE for entire spec (not per-item)
- Questions are non-blocking and conversational (no modal dialogs)
- All Q&A is preserved and flows into SPEC.md Requirements Discovery section
- Context files contain classified content for use during solicitation
- Items are processed one at a time - user reviews each spec before moving to next
- Hierarchical decomposition is mandatory for specs meeting criteria (2+ H1 with H2+)
- Numbers indicate implementation order based on API-first dependency sort
- Large specs (>15K tokens) use chunked processing with per-section progress
