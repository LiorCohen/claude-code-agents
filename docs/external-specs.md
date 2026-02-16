# External Specs

> How to import external specification documents into SDD workflows.

## Overview

External specs are product specifications - they describe WHAT to build and WHY. SDD transforms them into tech specs that describe HOW to build it.

```
External Product Spec (archived, read-only)
         │
         ▼
    Transform + Classify
         │
         ▼
    Component Discovery
         │
         ▼
    Decompose into items
         │
         ▼
    For each item:
         │
         ├─→ Solicitation (deep-dive questions)
         │
         └─→ Generate Tech Spec (SPEC.md)
```

## Importing an External Spec

```
/sdd I want to import an external spec
```

SDD will ask for the path to your spec file or directory.

For directories, SDD looks for an entry point (README.md, SPEC.md, or index.md).

## The Transformation Process

### 1. Archive

The external spec is archived via the system CLI to `.sdd/archive/external-specs/` with a datetime prefix:

```
.sdd/archive/external-specs/20260205-1430-feature-requirements.md
```

This is the **only** copy. The archived spec is read-only and serves as an audit trail.

### 2. Transform and Classify

SDD analyzes the external spec and classifies information:

| Category | What's Extracted |
|----------|------------------|
| **Domain Knowledge** | Entities, glossary terms, relationships |
| **Constraints** | Technical, business, compliance requirements |
| **Requirements** | Functional, non-functional, acceptance criteria |
| **Design Details** | UI specs, user flows, visual requirements |

### 3. Gap Analysis

External specs are inherently incomplete. SDD identifies gaps:

| Area | Typical Detail Level | Action |
|------|---------------------|--------|
| Frontend/UI | High | Extract and classify |
| UX/Design | High | Extract and classify |
| API/Contracts | Low | Derive from UI |
| Backend Logic | Very Low | Ask questions |
| Database/Models | Very Low | Discover from UI |
| Non-Functional | Absent | Ask explicitly |

### 4. Clarification Questions

SDD asks non-blocking, conversational questions about gaps:

```
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

Questions are asked one at a time, with freeform responses supported.

### 5. Component Discovery

Based on the classified requirements, SDD identifies needed components:

| Question | If Yes → Component |
|----------|-------------------|
| Does data need to be persisted? | **database** |
| Are there user actions that modify data? | **server** |
| Do external clients need to call this system? | **contract** |
| Is there a user interface? | **webapp** |
| Does this need to be deployed to Kubernetes? | **helm** |

Component discovery runs **once** for the entire external spec, not per-item.

### 6. Decomposition

Large specs are decomposed into epics and features:

```
EPICS (from H1 sections):
  01 User Management (lines 10-150)
     ├── 01 Registration (a1b2-1)
     ├── 02 Authentication (a1b2-2)
     └── 03 Password Reset (a1b2-3)

  02 Dashboard (lines 151-300) [depends on: User Management]
     ├── 01 Analytics (a1b2-4)
     └── 02 Settings (a1b2-5)

Total: 2 epics, 5 features
Implementation order: 01 → 02 (API-first within each epic)
```

You can accept the breakdown, combine into a single change, or cancel.

## Q&A Preservation

All questions and answers are preserved in the SPEC.md file's **Requirements Discovery** section:

```markdown
## Requirements Discovery

> Complete Q&A trail from spec solicitation. Never delete entries.

### Transformation Phase

| # | Question | Answer | Source |
|---|----------|--------|--------|
| T1 | What should happen on duplicate email? | Return error | User |
| T2 | Session timeout duration? | 30 minutes | User |
| T3 | Password requirements? | 8+ chars default | Assumption |

### Component Discovery Phase

| # | Question | Answer | Source |
|---|----------|--------|--------|
| D1 | Does data need persistence? | Yes | User |
| D2 | External API consumers? | Mobile app | User |

### Open Questions (BLOCKING)

| # | Question | Status | Blocker For |
|---|----------|--------|-------------|
| O1 | Rate limit for login attempts? | OPEN | Security |
```

## Open Questions

Specs cannot be approved while open questions remain:

```
/sdd I want to answer an open question
```

SDD will ask which question you want to answer and whether you want to provide an answer or mark it as an assumption.

Question statuses:
- **OPEN** - Not yet answered, blocks approval
- **ANSWERED** - User provided answer
- **ASSUMED** - User said "I don't know", assumption documented
- **DEFERRED** - Moved to later phase (requires justification)

## Large Spec Handling

Specs over ~15K tokens are processed in chunks:

```
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

### Chunking Strategy

| Section Size | Strategy |
|-------------|----------|
| < 5K tokens | Process as single chunk |
| 5K - 15K tokens | Process alone |
| > 15K tokens | Split at H2/H3 boundaries |

Cross-section dependencies are tracked and merged at the end.

## Product Specs vs Tech Specs

| Aspect | Product Spec (External) | Tech Spec (SPEC.md) |
|--------|------------------------|---------------------|
| Focus | WHAT and WHY | HOW |
| Sections | Overview, User Stories, Requirements | + Technical Design, API Contracts, Data Model |
| Detail | Business-focused | Implementation-focused |
| Source | Imported | Generated |
| Location | `.sdd/archive/external-specs/` | `changes/YYYY/MM/DD/.../` |

## Workflow Commands

```
# Import external spec
/sdd I want to import an external spec

# Check status
/sdd

# Continue with next item
/sdd I want to continue

# List all items
/sdd I want to list my changes

# Answer open questions
/sdd I want to answer an open question

# Approve spec (after all questions resolved)
/sdd I want to approve the spec

# Begin planning (after ALL specs approved)
/sdd I want to start planning
```

## Tips

**External specs are incomplete by nature.** Expect to answer many questions, especially about backend logic and API design.

**Q&A is never lost.** Every question and answer is preserved in the spec for future reference.

**One spec at a time.** For large decompositions, you work through each spec interactively before moving to planning.

**Phase gating is strict.** ALL specs must be approved before ANY planning starts.

**Backend is derived from frontend.** If the spec describes UI, SDD will derive the necessary API endpoints and data models.

## Next Steps

- [Workflows](workflows.md) - Full workflow documentation
- [Commands](commands.md) - Command reference
