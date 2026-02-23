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

Even if the external spec says nothing about the technical implementation, the solicitation MUST cover all technical aspects. The solicitation adds the technical dimension that product specs lack. **However, component discovery already identifies WHICH components are needed - solicitation asks about HOW they should work, not WHICH ones to use.**

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

## Resource Files

For detailed guidance, read these on-demand:
- [workflow-yaml.md](resources/workflow-yaml.md) — solicitation-workflow.yaml schema
- [solicitation-steps.md](resources/solicitation-steps.md) — All 9 steps with question guidance
- [spec-sections.md](resources/spec-sections.md) — Required sections, structure, examples

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
User: /sdd I want to create a new feature

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
Agent: Spec created at: changes/2026/02/05/a1b2c3-user-auth/01-user-auth/SPEC.md
Agent: Please review the spec. When satisfied, tell me: /sdd I want to approve the spec
```

### External Path (With Context)

```yaml
User: /sdd I want to continue

Agent: Resuming workflow a1b2c3 (user-auth)
Agent: Current item: API Contracts (user-auth-1)
Agent: Loading context...

Step 1: Context & Goal
Based on the provided context, this appears to be about:
- Building interfaces for user authentication
- Including login, logout, and session refresh

Is that correct? (yes/no/modify)

User: yes, but also add password reset

Agent: Got it. Adding password reset to the requirements.

[... continues with context-aware questions ...]
```

### Resume Mid-Solicitation

```yaml
User: /sdd I want to continue

Agent: Resuming spec solicitation for: Auth Contracts (user-auth-1)

Previously collected:
  - Problem: User authentication needs service interfaces
  - Primary user: Interface consumers
  - Expected outcome: Auth operations interface
  - Requirements: 3 collected (login, logout, refresh)

Continuing from: Step 5 - Acceptance Criteria

For the requirement "Users can login with email and password":
What acceptance criteria should we have? (Given/When/Then format)

User: Given valid credentials, when user submits login form, then they receive a session token

[... continues ...]
```

## Dependencies

This skill uses:
- `workflow-state` skill — delegates for persistent state: reads item context via `get_context(change_id)`, saves generated SPEC.md via `save_spec(change_id, content)`, updates item status via `update_status(change_id, status)`
- `spec-writing` skill — validates output against SPEC.md section requirements (not a runtime dependency)

## Notes

- Spec creation is **always collaborative** - external spec content is INPUT, not output
- User always has opportunity to refine, clarify, and approve
- **DO NOT ask about tech stack** - component-discovery has already determined what's needed
- Deep-dive questions focus on HOW components work, not WHICH components to use
- Questions are weighted: more for components with sparse spec coverage, fewer for well-documented components
- **All Q&A is captured for traceability** in Requirements Discovery section - NEVER delete
- Multi-turn conversations are supported and captured as threaded exchanges
- Open questions block spec approval - must be ANSWERED, ASSUMED, or DEFERRED
- Assumptions are documented when user says "I don't know"
- Non-blocking conversational interaction - no modal dialogs
- **Specs contain only user-confirmed content** - no speculative additions or "future ideas"
