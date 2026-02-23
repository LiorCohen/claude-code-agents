# solicitation-workflow.yaml Schema

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
    # Keys are component names from discovery output
    <component-name>:
      # Questions vary by component type (defined by tech pack)
      details: []

# Review feedback (captured after spec/plan created)
review_feedback: []
```
