---
name: new-feature
description: Start a new feature by creating a spec and implementation plan.
---

# /project:new-feature

Start a new feature.

## Usage

```
/project:new-feature [feature-name]
```

## Flow

### 1. Create Spec (`spec-writer` agent)

- Prompt for feature details:
  - Feature name
  - Issue reference (required)
  - Domain
  - Brief description
- Get current date in YYYY/MM/DD format
- Create `specs/features/YYYY/MM/DD/<feature-name>/SPEC.md` using template
- Fill in skeleton with user input
- Set `created` frontmatter field to current date
- Present for review and confirmation

### 2. Create Plan (`planner` agent)

- Analyze the spec
- Determine components affected (contract, server, webapp, helm, testing)
- Create `specs/features/YYYY/MM/DD/<feature-name>/PLAN.md` (same directory as spec)
- Break down into phases with agent assignments
- Estimate effort for each phase
- Present plan for approval

### 3. Review

- Show both spec and plan to user
- Wait for confirmation before proceeding
- If approved, update INDEX.md

## Example Interaction

```
User: /project:new-feature user-authentication