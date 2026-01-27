---
name: epic-planning
description: Templates and guidelines for epic-level planning with multiple feature changes.
---


# Epic Planning Skill

## Purpose

Epics are a change type that groups multiple feature-type changes under a single goal. Each child change is a full feature with its own SPEC.md and PLAN.md.

## Epic Structure

```
specs/changes/YYYY/MM/DD/<epic-name>/
├── SPEC.md                    # Epic specification (overall goals, all ACs)
├── PLAN.md                    # Epic plan (change ordering, dependencies)
└── changes/
    ├── <change-name>/
    │   ├── SPEC.md            # Feature spec
    │   └── PLAN.md            # Feature plan
    └── <change-name>/
        ├── SPEC.md
        └── PLAN.md
```

## PR Strategy

**One PR per child change.** Each child change:
- Has its own branch: `epic/<epic-name>/<change-name>`
- Has its own PR with clear scope
- Can be reviewed and merged independently
- Must pass all tests before merge

**PR Size Guidelines:**
- Target: < 400 lines changed
- Maximum: 800 lines changed
- If a child change exceeds limits, split it into smaller changes

## Dependencies Between Changes

Changes may depend on each other. Document dependencies in:
1. The epic PLAN.md (change ordering)
2. Each child SPEC.md's `parent_epic` frontmatter field

---

## Template: Epic PLAN.md

```markdown
---
title: [Epic Name] - Implementation Plan
change: [epic-name]
type: epic
spec: ./SPEC.md
status: draft
created: YYYY-MM-DD
sdd_version: [X.Y.Z]
---

# [Epic Name] - Implementation Plan

## Overview

**Spec:** [./SPEC.md](./SPEC.md)
**Issue:** [PROJ-XXX](link)

[1-2 sentence summary of the epic's goal]

## Change Order

Implement child changes in this order:

| # | Change | Description | Dependencies | Status |
|---|--------|-------------|--------------|--------|
| 1 | [change-name] | [Brief description] | None | pending |
| 2 | [change-name] | [Brief description] | [change-name] | pending |
| 3 | [change-name] | [Brief description] | [change-name] | pending |

## Dependency Graph

```
change-1
    ↓
change-2 (requires: change-1)
    ↓
change-3 (requires: change-2)
```

## PR Strategy

One PR per child change. Branch naming: `epic/<epic-name>/<change-name>`

## Cross-Cutting Concerns

Items that span multiple changes:

- **[Concern]**: [How it's handled across changes]

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk] | [H/M/L] | [Mitigation] |

## Progress Tracking

- [ ] Change 1: [change-name]
- [ ] Change 2: [change-name]
- [ ] Change 3: [change-name]
```

---

## Template: Child Change SPEC.md

Each child change uses the standard feature spec template with `parent_epic` in frontmatter:

```markdown
---
title: [Feature Name]
type: feature
parent_epic: ../SPEC.md
status: active
domain: [Domain Name]
issue: [PROJ-XXX]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sdd_version: [X.Y.Z]
---

# Feature: [Feature Name]

## Overview

**Parent Epic:** [../SPEC.md](../SPEC.md)

[What this change delivers as part of the epic]

## Acceptance Criteria

Subset of parent epic's ACs that this change implements:

- [ ] **AC1:** Given [precondition], when [action], then [result]

## Dependencies

**Requires (from previous changes):**
- [APIs/types from earlier changes]

**Provides (for later changes):**
- [APIs/components this change exposes]

[Remainder follows standard feature spec template]
```

---

## Workflow: Creating an Epic

### Step 1: Create Epic Directory and SPEC.md

Write the epic-level spec with all acceptance criteria for the entire epic.

### Step 2: Identify Child Changes

Break the epic into independent feature-type changes:
- Each change should be independently implementable and reviewable
- Target < 800 lines per change
- Document dependencies between changes

### Step 3: Create Epic PLAN.md

Document change ordering and dependencies using the template above.

### Step 4: Create Child Changes

For each child change in `changes/`:
1. Create the directory: `changes/<change-name>/`
2. Write SPEC.md with `parent_epic: ../SPEC.md`
3. Write PLAN.md using the standard feature plan template

### Step 5: Review

Present the complete epic structure to the user for review before implementation.

---

## Workflow: Implementing an Epic

### For Each Child Change (in dependency order):

1. **Branch**: `git checkout -b epic/<epic-name>/<change-name>`
2. **Implement**: Follow the child change's PLAN.md (standard feature implementation)
3. **Test**: Ensure all tests pass
4. **PR**: Create PR with change scope
5. **Review**: Get approval
6. **Merge**: Merge to main
7. **Update**: Mark change complete in epic PLAN.md

### Handling Failures

If a child change fails review:
1. Address feedback on the change branch
2. Do NOT modify other change branches
3. Re-submit for review

If requirements change mid-epic:
1. Update parent SPEC.md
2. Update affected child SPECs
3. Re-plan affected changes
4. Document changes in epic PLAN.md

---

## Quick Reference

```
Epic = Change type containing multiple feature changes
Child Change = Standard feature change inside changes/ subdirectory
SPEC.md (epic) = Overall goals and all ACs
PLAN.md (epic) = Change ordering and dependencies
SPEC.md (child) = Feature spec with parent_epic field
PLAN.md (child) = Standard feature plan
```
