# Transformation Process

**CRITICAL STEP**: Transform product spec to tech spec context BEFORE decomposition.

## Classification

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

## Gap Analysis

Identify what's MISSING or unclear (weighted toward business logic and integration contracts):

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

## Clarification Questions (Non-Blocking, Conversational)

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
  - 8 interfaces (see below)
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
