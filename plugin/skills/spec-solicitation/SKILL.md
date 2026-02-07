---
name: spec-solicitation
description: Guided requirements gathering through structured questions to create comprehensive specifications. Produces a complete requirements document via non-blocking conversational interaction.
user-invocable: false
---

# Spec Solicitation Skill

## Purpose

Guide users through structured requirements gathering to create comprehensive specifications. This skill is used for **ALL** spec creation - both interactive and external spec paths.

## Core Principles

### Zero Session Context

A new session must be able to resume solicitation with ZERO knowledge of prior conversation. All required information is stored in `solicitation-workflow.yaml`:

- Full Q&A history (questions AND answers)
- Current step and question
- Partial answers for spec generation
- Review feedback captured during iteration
- Open questions that block approval

### Non-Blocking Conversational Interaction

**CRITICAL: Never lock the user out of reading your output before they can respond.**

**NEVER:**
- Use modal dialogs that block interaction
- Force multiple choice when freeform is more appropriate
- Assume answers are single-line or single-message
- Require immediate response before user has read the output

**ALWAYS:**
- Present information FIRST, then ask questions
- Allow freeform text responses (not just A/B/C)
- Support multi-turn conversations for complex answers
- Let the user read, think, and respond at their pace

### Context-Aware Solicitation

When processing a task from external spec decomposition:
1. Load `context.md` (extracted section from external spec with transformation data)
2. Load discovered components from workflow
3. Pre-populate answers where possible from context
4. Ask clarifying questions for gaps
5. User confirms/refines pre-populated content
6. **DO NOT ask about tech stack** - use discovered components

When processing a purely interactive change:
1. No context available
2. Full solicitation flow from scratch

### External Specs Are Product-Oriented

Even if the external spec says nothing about backend, API, databases, etc., the solicitation MUST cover all technical aspects. The solicitation adds the technical dimension that product specs lack. **However, component discovery already identifies WHICH components are needed - solicitation asks about HOW they should work, not WHICH ones to use.**

### All Q&A Must Be Preserved

**CRITICAL: Every question asked and every answer received MUST be recorded in the SPEC.md Requirements Discovery section.**

This includes:
- Transformation clarification questions and answers
- Component discovery questions and answers
- Solicitation deep-dive questions and answers
- Any follow-up or multi-turn conversation content
- User corrections or overrides
- Assumptions made when user didn't know

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts change ID, workflow ID, optional context path, and resume flag.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns success status, complete SPEC.md content, save path, and review status.

## solicitation-workflow.yaml Schema

```yaml
started: YYYY-MM-DD HH:MM:SS
last_updated: YYYY-MM-DD HH:MM:SS
current_step: 3                        # Which solicitation step we're on
current_question: "What should the system do?"  # Exact question being asked

# Full Q&A history - questions AND answers, organized by phase
history:
  transformation:  # Q&A from transformation step (if from external spec)
    - id: T1
      question: "What should happen on duplicate email registration?"
      answer: "Return error, don't reveal if email exists"
      source: User
      timestamp: YYYY-MM-DD HH:MM:SS
    - id: T2
      question: "Password requirements?"
      answer: "8+ characters, industry standard"
      source: Assumption  # User said "I don't know"
      timestamp: YYYY-MM-DD HH:MM:SS

  discovery:  # Q&A from component discovery (if from external spec)
    - id: D1
      question: "Does data need persistence?"
      answer: "Yes, user accounts and sessions"
      source: User
      timestamp: YYYY-MM-DD HH:MM:SS

  solicitation:  # Q&A from this skill
    - id: S1
      step: 1
      category: context_goal
      question: "What problem does this solve?"
      answer: "User authentication is manual and error-prone"
      source: User
      timestamp: YYYY-MM-DD HH:MM:SS
    - id: S2
      step: 2
      category: context_goal
      question: "Who is the primary user?"
      answer: "End users logging into the application"
      source: User
      timestamp: YYYY-MM-DD HH:MM:SS
    - id: S3
      step: 3
      category: functional_requirements
      question: "What should the system do?"
      answer: null  # Awaiting response
      source: null
      timestamp: YYYY-MM-DD HH:MM:SS
      # For multi-turn conversations
      follow_ups:
        - question: "Can admins also modify orders?"
          answer: "Just view for now"
          source: User
          timestamp: YYYY-MM-DD HH:MM:SS

# Open questions that block spec approval
open_questions:
  - id: O1
    question: "What's the rate limit for login attempts?"
    status: OPEN  # OPEN | ANSWERED | ASSUMED | DEFERRED
    blocks: Security section
  - id: O2
    question: "Should failed logins trigger alerts?"
    status: OPEN
    blocks: Monitoring section

# User corrections/feedback
user_feedback:
  - timestamp: YYYY-MM-DD HH:MM:SS
    feedback: "Admin role should be 'Operator' - updated throughout"

# Structured answers for spec generation
answers:
  context_goal:
    problem: "User authentication is manual"
    primary_user: "End users"
    expected_outcome: "Automated login"
  functional_requirements:
    - "Users can register"
    - "Users can login"
  non_functional_requirements:
    performance: null
    security: null
    scalability: null
  user_stories: []
  acceptance_criteria: []
  edge_cases: []
  dependencies: []
  tests:
    unit: []
    integration: []
    e2e: []
  # NOTE: technical_architecture questions no longer ask about tech stack
  # Components are already discovered - questions focus on HOW not WHICH
  technical_details:
    # For each discovered component, ask deep-dive questions
    server:
      business_rules: []
      validation: []
      authorization: []
    database:
      entities: []
      relationships: []
      indexes: []
    contract:
      endpoints: []
      error_codes: []
    webapp:
      pages: []
      state_management: null

# Review feedback (captured after spec/plan created)
review_feedback: []
```

## Solicitation Flow

### Step 1: Context & Goal

Questions to ask:
- "What problem does this solve?"
- "Who is the primary user?"
- "What's the expected outcome?"

If context exists (from context.md):
- "Based on the provided context, this appears to be about X. Is that correct?"
- Pre-populate answers from context.md
- Ask for confirmation or clarification

### Step 2: Functional Requirements

Questions to ask:
- "What should the system do?" (iterative, can add multiple)
- "What are the main user actions?"
- "What data is involved?"

If context exists:
- "I extracted these requirements from the spec: [list]. Anything to add/modify?"

### Step 3: Non-Functional Requirements

Questions to ask:
- **Performance:** "Any latency/throughput requirements?"
- **Security:** "Authentication? Authorization? Data sensitivity?"
- **Scalability:** "Expected load? Growth expectations?"
- **Reliability:** "Uptime requirements? Failure handling?"

### Step 4: User Stories

Guide through "As a [role], I want [action], so that [benefit]" format.
- Prompt for multiple stories if complex feature
- Ensure all user roles are covered

### Step 5: Acceptance Criteria

For each user story or requirement:
- Prompt for Given/When/Then format
- "How will we know this is working correctly?"
- Ensure criteria are independently testable

### Step 6: Edge Cases & Error Handling

Questions to ask:
- "What could go wrong?"
- "What happens with invalid input?"
- "What are the boundary conditions?"

### Step 7: Dependencies & Constraints

Questions to ask:
- "What existing systems does this interact with?"
- "Any technical constraints or requirements?"
- "What must be true before this can work?"

### Step 8: Tests (TDD)

Questions to ask:
- "What tests would prove this works?"
- Prompt for unit, integration, E2E test ideas
- Each test should map to an acceptance criterion

### Step 9: Technical Deep-Dive (Component-Specific)

**DO NOT ask about which components to use** - component-discovery has already identified them. Instead, ask deep-dive questions for EACH discovered component.

**Question depth should be inversely proportional to spec coverage:**
- Backend/API/Database: ASK MANY questions (spec has little info)
- Frontend/UI: ASK FEW questions (spec likely has answers)

**For Server (if discovered):**

```text
For each entity derived from UI:
  - What fields does [Entity] have?
  - Which fields are required vs optional?
  - What validation rules apply to each field?

For each user action:
  - Who is authorized to perform this action?
  - What validation happens before the action?
  - What happens if validation fails?
  - What side effects occur (emails, notifications)?
```

**For Database (if discovered):**

```text
  - Entity attributes and types?
  - Required indexes?
  - Soft or hard deletes?
  - Audit/history requirements?
```

**For API Contract (if discovered):**

```text
  - Request/response schemas for each endpoint?
  - Error codes and messages?
  - Authentication method?
  - Rate limiting requirements?
```

**For Webapp (if discovered):**

External specs usually have good UI detail. Only ask about:
```text
  - Loading/empty/error states (if not in mockups)?
  - Any interactions not clear from mockups?
```

**YAGNI Principle**: Only ask about operations the UI actually requires. Do NOT assume full CRUD for every entity. If the UI only shows a list view, don't ask about Create/Update/Delete.

## Resume Behavior

On resume (when `resume: true`):

1. Read `solicitation-workflow.yaml`
2. Display summary of collected answers so far:
   ```text
   Resuming spec solicitation for: API Contracts

   Previously collected:
   - Problem: User authentication is manual
   - Primary user: End users
   - Requirements: 2 collected

   Continuing from: Step 3 - Functional Requirements
   Last question: "What should the system do?"
   ```
3. Continue from `current_step` / `current_question`
4. No conversation history needed - everything is in the file

## Spec Generation

After all questions answered, generate SPEC.md with:

### Required Sections

1. **Standard frontmatter** (title, type, status, etc.)
2. **Overview** with Background and Current State
3. **Original Requirements** (if from external spec - embed full context)
4. **User Stories**
5. **Functional Requirements**
6. **Non-Functional Requirements**
7. **Technical Design** (Architecture, Data Model, Algorithms)
8. **API Contract** (if applicable)
9. **Security Considerations**
10. **Error Handling**
11. **Observability**
12. **Acceptance Criteria** (Given/When/Then format)

### NEW Required Sections

13. **Domain Model**
    - Entities table (Entity, Definition, Spec Path, Status)
    - Relationships diagram
    - Glossary table (Term, Definition, First Defined In)
    - Bounded Contexts list

14. **Specs Directory Changes** (MANDATORY for traceability)
    - Before/After directory tree
    - Changes Summary table (Path, Action, Description)

15. **Components**
    - New Components table (Component, Type, Purpose)
    - Modified Components table (Component, Changes)

16. **System Analysis**
    - Inferred Requirements
    - Gaps & Assumptions
    - Dependencies

17. **Requirements Discovery** (CRITICAL - full Q&A trail, never delete)
    - **Transformation Phase** table (if from external spec)
      | # | Question | Answer | Source |
    - **Component Discovery Phase** table (if from external spec)
      | # | Question | Answer | Source |
    - **Solicitation Phase** table
      | # | Question | Answer | Source |
      - Include follow-up questions as threaded exchanges
    - **User Feedback & Corrections** (with timestamps)
    - **Open Questions (BLOCKING)** table
      | # | Question | Status | Blocker For |
      - Status: OPEN | ANSWERED | ASSUMED | DEFERRED
      - Specs CANNOT be approved while OPEN questions remain

18. **Testing Strategy**
    - Unit Tests table
    - Integration Tests table
    - E2E Tests table
    - Test Data requirements

19. **Dependencies** (Internal and External)
20. **Migration / Rollback**
21. **Out of Scope**
22. **Open Questions**
23. **References**

## Workflow Integration

After spec generation:

1. Save SPEC.md to drafts location via `workflow_state.save_spec()`
2. Update status to `spec_review` via `workflow_state.update_status()`
3. Move to changes/ via `workflow_state.ready_for_review()`
4. Prompt user to review the spec

## User Feedback Capture

During spec review, when user provides feedback:

1. Capture feedback in `review_feedback` array of solicitation-workflow.yaml
2. Update the spec based on feedback
3. Save updated spec
4. Continue until user approves

## Example Usage

### Interactive Path (No External Context)

```typescript
User: /sdd-change new --type feature --name user-auth

Agent: Starting spec solicitation for: user-auth

Step 1: Context & Goal
What problem does this solve?

User: Users can't log in securely

Agent: Who is the primary user?

User: End users of the application

Agent: What's the expected outcome?

User: Secure login with session management

[... continues through all steps ...]

Agent: Generating SPEC.md from collected requirements...
Agent: Spec created at: changes/2026/02/05/a1b2c3/01-user-auth/SPEC.md
Agent: Please review the spec. When satisfied, run /sdd-change approve spec a1b2-1
```

### External Path (With Context)

```yaml
User: /sdd-change continue

Agent: Resuming workflow a1b2c3
Agent: Current item: API Contracts (a1b2-1)
Agent: Loading context...

Step 1: Context & Goal
Based on the provided context, this appears to be about:
- Building REST API endpoints for user authentication
- Including login, logout, and session refresh

Is that correct? (yes/no/modify)

User: yes, but also add password reset

Agent: Got it. Adding password reset to the requirements.

[... continues with context-aware questions ...]
```

### Resume Mid-Solicitation

```yaml
User: /sdd-change continue

Agent: Resuming spec solicitation for: API Contracts (a1b2-1)

Previously collected:
  - Problem: User authentication needs API endpoints
  - Primary user: Frontend developers
  - Expected outcome: REST API for auth operations
  - Requirements: 3 collected (login, logout, refresh)

Continuing from: Step 5 - Acceptance Criteria

For the requirement "Users can login with email and password":
What acceptance criteria should we have? (Given/When/Then format)

User: Given valid credentials, when user submits login form, then they receive a JWT token

[... continues ...]
```

## Dependencies

This skill uses:
- `workflow-state` skill - for state management
- `spec-writing` skill - for spec template and formatting

## Notes

- Spec creation is **always collaborative** - external spec content is INPUT, not output
- User always has opportunity to refine, clarify, and approve
- **DO NOT ask about tech stack** - component-discovery has already determined what's needed
- Deep-dive questions focus on HOW components work, not WHICH components to use
- Questions are weighted: more for backend (sparse in spec), fewer for frontend (detailed in spec)
- **All Q&A is captured for traceability** in Requirements Discovery section - NEVER delete
- Multi-turn conversations are supported and captured as threaded exchanges
- Open questions block spec approval - must be ANSWERED, ASSUMED, or DEFERRED
- Assumptions are documented when user says "I don't know"
- Non-blocking conversational interaction - no modal dialogs
- **Specs contain only user-confirmed content** - no speculative additions or "future ideas"
