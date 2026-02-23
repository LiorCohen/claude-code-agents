# Solicitation Steps

All 9 steps of the solicitation flow with question guidance.

## Step 1: Context & Goal

Questions to ask:
- "What problem does this solve?"
- "Who is the primary user?"
- "What's the expected outcome?"

If context exists (from context.md):
- "Based on the provided context, this appears to be about X. Is that correct?"
- Pre-populate answers from context.md
- Ask for confirmation or clarification

## Step 2: Functional Requirements

Questions to ask:
- "What should the system do?" (iterative, can add multiple)
- "What are the main user actions?"
- "What data is involved?"

If context exists:
- "I extracted these requirements from the spec: [list]. Anything to add/modify?"

## Step 3: Non-Functional Requirements

Questions to ask:
- **Performance:** "Any latency/throughput requirements?"
- **Security:** "Authentication? Authorization? Data sensitivity?"
- **Scalability:** "Expected load? Growth expectations?"
- **Reliability:** "Uptime requirements? Failure handling?"

## Step 4: User Stories

Guide through "As a [role], I want [action], so that [benefit]" format.
- Prompt for multiple stories if complex feature
- Ensure all user roles are covered

## Step 5: Acceptance Criteria

For each user story or requirement:
- Prompt for Given/When/Then format
- "How will we know this is working correctly?"
- Ensure criteria are independently testable

## Step 6: Edge Cases & Error Handling

Questions to ask:
- "What could go wrong?"
- "What happens with invalid input?"
- "What are the boundary conditions?"

## Step 7: Dependencies & Constraints

Questions to ask:
- "What existing systems does this interact with?"
- "Any technical constraints or requirements?"
- "What must be true before this can work?"

## Step 8: Tests (TDD)

Questions to ask:
- "What tests would prove this works?"
- Prompt for unit, integration, E2E test ideas
- Each test should map to an acceptance criterion

## Step 9: Technical Deep-Dive (Component-Specific)

**DO NOT ask about which components to use** - component-discovery has already identified them. Instead, ask deep-dive questions for EACH discovered component.

**Question depth should be inversely proportional to spec coverage.** Components whose domain is well-covered in the spec need fewer questions; components with sparse coverage need more.

**For each discovered component type**, ask deep-dive questions appropriate to that type. The tech pack's component-discovery skill provides type-specific question sets. General categories:

```text
For data/persistence components:
  - Entity attributes and types?
  - Required indexes or constraints?
  - Soft or hard deletes?
  - Audit/history requirements?

For service/logic components:
  - Business rules and validation for each operation?
  - Authorization requirements per action?
  - Side effects (notifications, events)?

For interface/contract components:
  - Request/response schemas?
  - Error codes and messages?
  - Authentication and rate limiting?

For UI components:
  - Loading/empty/error states (if not in mockups)?
  - Interactions not clear from mockups?
```

**YAGNI Principle**: Only ask about operations the spec actually requires. Do NOT assume full CRUD for every entity. If the spec only shows a list view, don't ask about Create/Update/Delete.

**Components Section**: When generating SPEC.md, populate the `## Components` New Components table's Settings column from the component-discovery output. Each discovered component's settings must appear in this column so the implementation plan can scaffold correctly.

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
