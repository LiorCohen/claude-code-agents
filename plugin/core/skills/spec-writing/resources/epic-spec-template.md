# Epic Spec Template (Tech Spec)

An epic contains multiple feature-type changes. The epic SPEC.md defines the overall goal, and each child change in `changes/` has its own feature SPEC.md.

```markdown
---
title: [Epic Name]
spec_type: tech
type: epic
status: active
domain: [Domain Name]
issue: [PROJ-XXX or GitHub issue URL]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sdd_version: [X.Y.Z]
---

# Epic: [Epic Name]

## Overview

[1-2 sentences: what this epic accomplishes and why it matters]

## Changes

| Change | Description | Dependencies |
|--------|-------------|--------------|
| [change-name] | [What this change does] | None |
| [change-name] | [What this change does] | [depends-on] |

## Acceptance Criteria

### [Capability Group]

- [ ] **AC1:** Given [precondition], when [action], then [result]
- [ ] **AC2:** Given [precondition], when [action], then [result]

## Cross-Cutting Concerns

[Shared patterns, conventions, or constraints that apply across all changes]

## Out of Scope

- [What this epic explicitly does NOT cover]
```

## Epic Child Change Spec

Each child change inside `changes/` uses the standard feature template with one additional frontmatter field:

```yaml
---
title: [Feature Name]
spec_type: tech
type: feature
parent_epic: ../SPEC.md
status: active
domain: [Domain Name]
issue: [PROJ-XXX]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sdd_version: [X.Y.Z]
---
```

The `parent_epic` field links the child back to the epic spec.

## Epic Directory Structure

```text
changes/YYYY/MM/DD/<epic-name>/
├── SPEC.md                    # Epic-level spec
├── PLAN.md                    # Epic-level plan (change ordering)
└── changes/
    ├── <change-name>/
    │   ├── SPEC.md            # Feature spec
    │   └── PLAN.md            # Feature plan
    └── <change-name>/
        ├── SPEC.md
        └── PLAN.md
```
