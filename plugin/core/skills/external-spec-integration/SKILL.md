---
name: external-spec-integration
description: Process external specifications through transformation, classification, gap analysis, component discovery, and decomposition. Creates workflow items with classified context.
user-invocable: false
---

# External Spec Integration Skill

Processes external specification files into the SDD workflow structure. Transforms product specs into classified tech spec context - specs are created interactively one at a time.

## Purpose

When a user provides an external specification via `/sdd I want to import an external spec`:
- Archive the external spec to `sdd/archive/external-specs/` (single copy, yyyymmdd-HHmm-filename format)
- **TRANSFORM** the spec: classify information, identify gaps, ask clarifying questions
- **DISCOVER** required components through targeted questions
- **DECOMPOSE** into workflow items with classified context
- Create workflow items with context in `sdd/workflows/<id>-<name>/`
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
| **User-Facing Interface** | High | Extract and classify |
| **UX/Design** | High | Extract and classify |
| **Integration Contracts** | Low | Must be DERIVED from interface |
| **Business Logic** | Very Low | Must be extracted through questions |
| **Persistence/Data** | Very Low | Must be discovered from interface + actions |
| **Non-Functional** | Absent | Must be explicitly asked |

## When to Use

- During `/sdd I want to import an external spec` when external spec is provided

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts path to external spec file, target directory, workflow ID, and optional domain.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns archived spec path, workflow ID, hierarchical flag, and list of created workflow items.

## Workflow Overview

1. **Archive** external spec to `sdd/archive/external-specs/` via system CLI
2. **Detect large specs** (>15K tokens) and chunk if needed
3. **Transform** product spec: classify information, identify gaps, ask clarifying questions
4. **Discover components** via component-discovery skill (once for entire spec)
5. **Present outline** to user with hierarchical decomposition if applicable
6. **Thinking step** — domain analysis, specs impact, gap analysis, API-first ordering
7. **Display thinking** output for user review
8. **Create workflow items** via workflow-state skill
9. **Create context files** (`context.md`) for each leaf item
10. **Return summary** with transformation, components, items, and thinking output

## Resource Files

For detailed guidance, read these on-demand:
- [workflow-steps.md](resources/workflow-steps.md) — Detailed steps 1-10 with YAML examples
- [transformation.md](resources/transformation.md) — Classification, gap analysis, clarification process

## Key Differences from Previous Version

| Before | After |
|--------|-------|
| Created SPEC.md + PLAN.md immediately | Creates workflow items with context only |
| Archived to `archive/` | Archives to `sdd/archive/external-specs/` |
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

Trigger: `/sdd I want to import an external spec` command.

## Workflow Steps Summary

| Step | Action | Output |
|------|--------|--------|
| 1 | Archive External Spec | `sdd/archive/external-specs/...` |
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
