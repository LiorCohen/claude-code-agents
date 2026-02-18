# Frontmatter Fields and Validation Rules

## Tech Spec Frontmatter (Default)

Every tech spec (generated SPEC.md) must include:

```yaml
---
title: Change Name
spec_type: tech                     # Required: tech (default for generated specs)
type: feature | bugfix | refactor | epic
status: active | deprecated | superseded | archived
domain: Identity | Billing | Core | ...
issue: PROJ-1234                    # Required: JIRA/GitHub issue
created: YYYY-MM-DD
updated: YYYY-MM-DD
sdd_version: X.Y.Z                  # Required: SDD plugin version used
supersedes: [optional, path to old spec]
superseded_by: [optional, path to new spec]
---
```

**Required fields for tech specs:**
- `title`
- `spec_type` -- Must be `tech`
- `type` -- Must be `feature`, `bugfix`, `refactor`, or `epic`
- `status`
- `domain`
- `issue` -- Must reference a tracking issue
- `created`
- `updated`
- `sdd_version` -- Plugin version used to generate this spec

**Required sections for tech specs:**
- `## Overview`
- `## Acceptance Criteria`
- `## API Contract` (if type involves API changes)
- `## Domain Model`
- `## Requirements Discovery` (Q&A trail from solicitation)
- `## Testing Strategy`

## Product Spec Frontmatter

External/product specs have minimal requirements:

```yaml
---
title: Product Spec Name
spec_type: product                  # Required: product
status: active | archived
domain: Identity | Billing | Core | ...
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

**Required fields for product specs:**
- `title`
- `spec_type` -- Must be `product`
- `status`
- `domain`
- `created`
- `updated`

**Optional sections for product specs:**
- `## Overview`
- `## User Stories`
- `## Requirements`
- `## Acceptance Criteria`

## Validation Rules

Run `<plugin-root>/system/system-run.sh spec validate <path>` to check:
- Required frontmatter fields present based on `spec_type`
- Acceptance criteria in Given/When/Then format (tech specs only)
- All referenced definitions exist in domain glossary
- Required sections present (tech specs only)
- Open questions resolved (no BLOCKING open questions remain)

## Validation Error Messages

Validation should return clear, actionable error messages:

```text
Spec validation failed: changes/2026/02/05/a1b2c3-user-auth/01-auth/SPEC.md

FRONTMATTER ERRORS:
  - Missing required field: issue
  - Missing required field: sdd_version
  - Invalid spec_type: 'unknown' (expected: tech | product)

SECTION ERRORS:
  - Missing required section: ## API Contract
  - Missing required section: ## Requirements Discovery

FORMAT ERRORS:
  - Line 45: Acceptance criterion not in Given/When/Then format
    Found: "Users can register"
    Expected: "Given [precondition], when [action], then [result]"

OPEN QUESTIONS (BLOCKING):
  - O1: What's the rate limit for login attempts?
  - O2: Should failed logins trigger alerts?

  Resolve these questions before spec can be approved:
    /sdd I want to answer an open question
    /sdd I want to answer an open question
```

## Open Questions Block Approval

Specs CANNOT be approved while open questions remain in the `## Requirements Discovery` section. The validation enforces this:

| Question Status | Effect |
|----------------|--------|
| `OPEN` | Blocks spec approval |
| `ANSWERED` | Does not block |
| `ASSUMED` | Does not block (assumption documented) |
| `DEFERRED` | Does not block (requires justification, tracked for later) |
