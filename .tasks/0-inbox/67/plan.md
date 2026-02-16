---
title: Store user instructions in plans, specs, and .sdd/
created: 2026-02-02 12:08 UTC
updated: 2026-02-07 16:24 UTC
---

# Plan: Store User Instructions in Plans, Specs, and .sdd/

## Problem Summary

User feedback and instructions are currently lost between sessions. Skills and agents have no mechanism to read persistent user preferences — they operate on SPEC.md content alone. This causes:

- Repeated clarifications across sessions
- Inconsistent implementations that ignore stated user preferences
- No feedback loop: corrections in one session don't carry forward

## Solution: Three-Level Instruction Hierarchy

### Level 1 — Global: `.sdd/instructions.md`

Project-wide preferences that apply to ALL work. Read by skills during spec creation and plan generation. Read by agents during implementation.

**Examples:** "Always use Zod for validation", "We prefer composition over inheritance", "Target 90% test coverage", "Use snake_case for DB columns"

### Level 2 — Change-Level: `User Guidance` section in PLAN.md

User feedback specific to a particular change, captured during spec review or plan review.

**Examples:** "Keep the migration reversible", "Frontend should match the Figma exactly", "Prioritize the happy path first"

### Level 3 — Spec-Level: `Requirements Discovery > User Feedback & Corrections` in SPEC.md

Already exists. User requirements that become acceptance criteria during solicitation. No changes needed to this level — it already works.

## Reading Order

Skills and agents should read instructions in this order (most specific wins):

1. SPEC.md `Requirements Discovery` (change-specific, highest priority)
2. PLAN.md `User Guidance` (change-specific preferences)
3. `.sdd/instructions.md` (global defaults, lowest priority)

If instructions conflict, the more specific level wins.

---

## Files to Create

| File | Purpose |
|------|---------|
| `plugin/skills/user-instructions/SKILL.md` | New skill: schema, reading order, and format for `.sdd/instructions.md` |
| `plugin/skills/user-instructions/schemas/input.schema.json` | Input schema for the skill |
| `plugin/skills/user-instructions/schemas/output.schema.json` | Output schema for the skill |

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/skills/planning/SKILL.md` | Add `User Guidance` section to plan templates; add instruction to read `.sdd/instructions.md` |
| `plugin/skills/spec-solicitation/SKILL.md` | Add step to read `.sdd/instructions.md` at solicitation start for pre-populated context |
| `plugin/skills/change-creation/SKILL.md` | Add step to read `.sdd/instructions.md` when creating SPEC.md and PLAN.md |
| `plugin/skills/project-scaffolding/SKILL.md` | Add `.sdd/instructions.md` to minimal scaffolding output |
| `plugin/agents/backend-dev.md` | Add `user-instructions` to skill references |
| `plugin/agents/frontend-dev.md` | Add `user-instructions` to skill references |
| `plugin/agents/api-designer.md` | Add `user-instructions` to skill references |
| `plugin/agents/devops.md` | Add `user-instructions` to skill references |
| `plugin/agents/tester.md` | Add `user-instructions` to skill references |
| `plugin/agents/reviewer.md` | Add `user-instructions` to skill references |

## Files NOT Modified (and why)

| File | Reason |
|------|--------|
| `plugin/skills/spec-writing/SKILL.md` | Spec templates already have `Requirements Discovery > User Feedback & Corrections` — no new section needed |
| `plugin/skills/project-settings/SKILL.md` | Instructions are not settings (settings = structural capabilities, instructions = preferences). Separate skill is cleaner. |
| `plugin/agents/db-advisor.md` | Advisory agent, doesn't implement — doesn't need instructions |
| `.claude/skills/tasks/SKILL.md` | Task plans are internal to this repo's development workflow, not part of the SDD plugin product |
| `CONTRIBUTING.md` | Convention documentation belongs in the skill itself, not project-level docs |

---

## Phase 1: Create `user-instructions` Skill

**Outcome:** A new skill that defines the `.sdd/instructions.md` schema, reading order, and provides the canonical reference for how instructions work.

**Why a separate skill:** Following the existing pattern where `project-settings` is the single source of truth for `sdd-settings.yaml`, this skill is the single source of truth for `instructions.md`. Other skills and agents reference it rather than duplicating knowledge.

**Deliverables:**

### `plugin/skills/user-instructions/SKILL.md`

Contents:

1. **Frontmatter** — `name: user-instructions`, `description: ...`, `user-invocable: false`
2. **Purpose** — Manage `.sdd/instructions.md` for storing project-wide user preferences
3. **File Location** — `.sdd/instructions.md` (git-tracked, alongside `sdd-settings.yaml`)
4. **Three-Level Hierarchy** — Document the global → change → spec hierarchy with reading order
5. **Reading Order** — SPEC.md > PLAN.md > `.sdd/instructions.md` (most specific wins)
6. **Template** — The `.sdd/instructions.md` template with sections:
   - `## Architecture Preferences` — Patterns, libraries, conventions
   - `## Coding Standards` — Beyond what typescript-standards covers (naming, style, etc.)
   - `## Testing Preferences` — Coverage targets, test data conventions, testing tools
   - `## Database Conventions` — Naming, migration style, indexing preferences
   - `## API Conventions` — Naming, error format, pagination style
   - `## Deployment Preferences` — Environment-specific constraints
   - `## Domain Knowledge` — Business rules, glossary terms the team uses
   - Each section starts with a `<!-- Add your preferences below -->` comment placeholder
7. **Instructions vs Settings** — Clear distinction table (like the existing Settings vs Config table in project-settings):
   - Instructions = preferences, conventions, soft constraints ("prefer Zod")
   - Settings = structural capabilities, hard constraints (component types, databases)
8. **What Belongs Where** — Decision table:
   - Global: preferences that apply to all changes
   - Change PLAN.md: preferences specific to one change
   - SPEC.md: requirements that become acceptance criteria
9. **Input/Output Schemas** — For programmatic operations (read, validate)

### `plugin/skills/user-instructions/schemas/input.schema.json`

Operation types: `read` (load current instructions), `validate` (check format)

### `plugin/skills/user-instructions/schemas/output.schema.json`

Returns: file path, sections found, validation status

---

## Phase 2: Update Planning Skill

**Outcome:** Plans include a `User Guidance` section and the planning workflow reads `.sdd/instructions.md`.

**Deliverables:**

### `plugin/skills/planning/SKILL.md` updates:

1. **Add to "Component Source of Truth" section** (after step 2):
   ```
   3. Reads `.sdd/instructions.md` for user preferences (refer to the `user-instructions` skill)
   ```

2. **Add `User Guidance` section to all three plan templates** (Feature, Bugfix, Refactor) — insert after `## Overview` and before `## Affected Components`:
   ```markdown
   ## User Guidance

   <!-- Captured from .sdd/instructions.md and user feedback during spec/plan review -->
   <!-- Agents MUST respect these preferences during implementation -->

   - [Relevant instructions from .sdd/instructions.md]
   - [User feedback specific to this change]
   ```

3. **Add to "Plan Content Guidelines > Acceptable in plans":**
   - User preferences and constraints from `.sdd/instructions.md`
   - Change-specific user feedback captured during review

---

## Phase 3: Update Solicitation and Change Creation Skills

**Outcome:** Spec solicitation reads global instructions to pre-populate context. Change creation references instructions when generating specs and plans.

**Deliverables:**

### `plugin/skills/spec-solicitation/SKILL.md` updates:

1. **Add to "Context-Aware Solicitation" section** — new step at the top of both flows:
   ```
   0. Read `.sdd/instructions.md` (refer to `user-instructions` skill) for project-wide preferences
   ```

2. **Add to "Solicitation Flow > Step 1: Context & Goal"** — after "Questions to ask":
   ```
   If `.sdd/instructions.md` exists with relevant preferences:
   - "I see your project prefers X. Should this change follow that convention?"
   - Pre-populate answers where instructions provide clear defaults
   ```

### `plugin/skills/change-creation/SKILL.md` updates:

1. **Add new step between Step 3 and Step 4** (renumber subsequent steps):
   ```
   ### Step 4: Read User Instructions

   1. Read `.sdd/instructions.md` if it exists (refer to `user-instructions` skill)
   2. Extract preferences relevant to the change type and affected components
   3. Pass relevant preferences to SPEC.md and PLAN.md generation
   ```

---

## Phase 4: Update Project Scaffolding

**Outcome:** `sdd-init` creates `.sdd/instructions.md` alongside `sdd-settings.yaml`.

**Deliverables:**

### `plugin/skills/project-scaffolding/SKILL.md` updates:

1. **Update "Minimal Mode" file tree** to include:
   ```
   ├── .sdd/
   │   ├── sdd-settings.yaml
   │   └── instructions.md          # User preferences and conventions
   ```

2. **Update "Full Mode" file tree** similarly.

3. **Add to "Templates Location":**
   ```
   skills/project-scaffolding/templates/
   ├── minimal/
   │   ├── ...
   │   └── instructions.md          # NEW
   ```

4. **Note:** The template file itself is the same template defined in the `user-instructions` skill. Reference it rather than duplicating.

---

## Phase 5: Update All Implementation Agents

**Outcome:** All agents that implement code read `.sdd/instructions.md` via the `user-instructions` skill.

**Deliverables:**

For each agent (`backend-dev.md`, `frontend-dev.md`, `api-designer.md`, `devops.md`, `tester.md`, `reviewer.md`):

1. **Add `user-instructions` to the Skills section:**
   ```
   - `user-instructions` — Project-wide user preferences from `.sdd/instructions.md`
   ```

2. **Add to Rules section:**
   ```
   - Read `.sdd/instructions.md` before starting implementation (refer to `user-instructions` skill)
   - Respect user preferences unless they conflict with the SPEC.md
   ```

The `reviewer.md` agent gets an additional checklist item:
   ```
   ### User Instructions Compliance
   - [ ] Implementation respects `.sdd/instructions.md` preferences
   - [ ] Change-specific user guidance from PLAN.md followed
   ```

---

## Dependencies

- None. All referenced files exist. The `.sdd/` directory is already an established convention.

## Testing Strategy

- Manual: Run `/sdd-init` and verify `.sdd/instructions.md` is created
- Manual: Create a change and verify the planning skill reads instructions
- Manual: Verify agent files reference the new skill
- Lint: All modified SKILL.md files pass skill frontmatter validation

## Verification Checklist

- [ ] `plugin/skills/user-instructions/SKILL.md` exists with full schema
- [ ] `plugin/skills/user-instructions/schemas/input.schema.json` exists
- [ ] `plugin/skills/user-instructions/schemas/output.schema.json` exists
- [ ] `plugin/skills/planning/SKILL.md` has `User Guidance` in all 3 templates
- [ ] `plugin/skills/planning/SKILL.md` references `user-instructions` skill
- [ ] `plugin/skills/spec-solicitation/SKILL.md` reads instructions at solicitation start
- [ ] `plugin/skills/change-creation/SKILL.md` has "Read User Instructions" step
- [ ] `plugin/skills/project-scaffolding/SKILL.md` includes `instructions.md` in scaffolding output
- [ ] All 6 implementation agents reference `user-instructions` skill
- [ ] `reviewer.md` has instruction compliance checklist item
