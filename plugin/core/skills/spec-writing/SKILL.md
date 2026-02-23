---
name: spec-writing
description: Templates and validation for writing product specifications.
user-invocable: false
---


# Spec Writing Skill

## Templates

Use templates below as starting points.

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts spec type, change type, title, domain, and optional issue reference.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns complete SPEC.md markdown and validation results for required fields, sections, and format.

## Spec Types: Product vs Tech

**Product Specs** (external input):
- Focus on WHAT and WHY
- Typically authored by product managers or stakeholders
- Archived as-is when imported via external spec workflow
- `spec_type: product`

**Tech Specs** (generated SPEC.md files):
- Focus on HOW
- Generated from product specs + solicitation
- Full implementation details
- `spec_type: tech`

## Spec Lifecycle

**Git is the state machine:**
- In PR = draft (implicit, no status field needed)
- Merged to main = active
- Explicit statuses only for: `active`, `deprecated`, `superseded`, `archived`

## Spec Locations

| Type | Location |
|------|----------|
| Change specs | `changes/YYYY/MM/DD/<change-name>/SPEC.md` |
| Implementation plans | `changes/YYYY/MM/DD/<change-name>/PLAN.md` |
| Domain definitions | `specs/domain/definitions/<definition-name>.md` |
| API contracts | `specs/architecture/api-contracts.md` |

**Date-based organization:**
- Changes are organized by creation date (YYYY/MM/DD)
- This provides chronological traceability
- Plans live alongside their specs in the same directory

## Acceptance Criteria Format

Always use Given/When/Then:

```markdown
- [ ] **AC1:** Given [precondition], when [action], then [expected result]
```

## Resource Files

For detailed guidance, read these on-demand:
- [feature-spec-template.md](resources/feature-spec-template.md) — Complete feature spec template
- [epic-spec-template.md](resources/epic-spec-template.md) — Epic structure with child changes
- [other-templates.md](resources/other-templates.md) — Domain definition + product spec templates
- [frontmatter-validation.md](resources/frontmatter-validation.md) — Frontmatter fields + validation rules
