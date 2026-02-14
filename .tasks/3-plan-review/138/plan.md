---
title: Separate component discovery from scaffolding in sdd-change new flow
created: 2026-02-14 18:00 UTC
---

# Plan: Separate Component Discovery from Scaffolding in sdd-change new Flow

## Problem Summary

In the interactive `sdd-change new` flow, scaffolding (Step 5) runs immediately after component discovery (Step 4) — before spec solicitation even begins. This creates directories, files, and mutates `sdd-settings.yaml` before any spec exists or is approved. The external spec flow already defers scaffolding correctly, creating an inconsistency between the two paths.

The fix: remove scaffolding from `sdd-change new` entirely, and make it a normal phase in the implementation plan.

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/commands/sdd-change.md` | Remove Step 5 (On-Demand Scaffolding) from interactive flow, renumber steps |
| `plugin/skills/planning/SKILL.md` | Add scaffolding as an explicit plan phase when new components are identified |
| `plugin/skills/change-creation/templates/spec-feature.md` | Enhance Components section to include component settings from discovery |
| `plugin/skills/spec-solicitation/resources/spec-sections.md` | Enhance Components section documentation to include settings |
| `plugin/skills/scaffolding/SKILL.md` | Add no-op rule, remove Component Presets section (bundles) |
| `plugin/skills/component-discovery/SKILL.md` | Fix "project type" reference, add note about settings flowing into SPEC.md |
| `plugin/skills/component-discovery/schemas/output.schema.json` | Remove non-existent `project_type` field |
| `plugin/skills/spec-solicitation/resources/solicitation-steps.md` | Update Step 9 to populate Settings column when writing Components section |
| `plugin/agents/devops.md` | Add `scaffolding` to skills frontmatter |

## Changes

### 1. Remove scaffolding from interactive `sdd-change new`

In `plugin/commands/sdd-change.md`, the interactive flow currently has:

- Step 4: Component Discovery
- Step 5: On-Demand Component Scaffolding ← **remove this entirely**
- Step 6: Create Workflow Item
- Step 7: Spec Solicitation
- ...

After the change, the interactive flow becomes:

- Step 4: Component Discovery (unchanged — analytical only)
- Step 5: Create Workflow Item (was Step 6)
- Step 6: Spec Solicitation (was Step 7)
- Step 7: Move to Review (was Step 8)
- Step 8: Display Next Steps (was Step 9)

When renumbering, also update internal cross-references within the step bodies (e.g., `<from step 6>` → `<from step 5>`, `<from step 3>` stays the same since Step 3 is unchanged).

Component discovery output is carried into spec solicitation (as it already is), and the solicitation populates the SPEC.md Components section with the discovered components and their settings.

No changes needed to the external spec flow — it already defers scaffolding correctly.

### 2. Add scaffolding as a plan phase in the planning skill

In `plugin/skills/planning/SKILL.md` (currently 479 lines — budget is tight, stay under 500):

**Generation Algorithm update:** Add a step before the existing dependency ordering (line 129). When SPEC.md `## Components` lists new components not yet in `sdd-settings.yaml`, prepend a "Phase 1: Component Scaffolding" phase and shift subsequent phases. When no new components exist, omit it. Integrate this into the existing algorithm rather than adding a separate section.

**Plan template update:** Add the scaffolding phase to the feature template (between "Phases" heading and "Phase 1: API Contract"):

```markdown
### Phase 1: Component Scaffolding (if new components)
**Agent:** `devops`
**Standards:** `scaffolding`, component-specific scaffolding skills (e.g., `backend-scaffolding`, `frontend-scaffolding`)

**Outcome:** New component directories and boilerplate created, `sdd-settings.yaml` updated

**Deliverables:**
- Component directories scaffolded per SPEC.md Components section
- sdd-settings.yaml updated with new component entries
```

The `devops` agent's `skills:` frontmatter must include `scaffolding` so it can execute this phase (see Change 8).

### 3. Enhance spec template Components section

In `plugin/skills/change-creation/templates/spec-feature.md`, update the `## Components` section to include component settings from discovery:

```markdown
## Components

> Components identified during discovery. New components will be scaffolded during implementation.

### New Components

| Component | Type | Settings | Purpose |
|-----------|------|----------|---------|
| main-server | server | server_type: api, databases: [app-db] | API backend |

### Modified Components

| Component | Changes |
|-----------|---------|
| web-app | Add new routes for feature |
```

The Settings column captures the discovery output so the plan (and scaffolding phase) know exactly what to scaffold.

**Only the feature template needs this change.** Bugfix/refactor templates don't have a Components section because they modify existing components. Epic templates decompose into features, each with its own spec.

### 4. Update spec-sections documentation

In `plugin/skills/spec-solicitation/resources/spec-sections.md`, update item 15 (line 32-34). Change:

```
15. **Components**
    - New Components table (Component, Type, Purpose)
    - Modified Components table (Component, Changes)
```

To:

```
15. **Components**
    - Note: "New components will be scaffolded during implementation"
    - New Components table (Component, Type, Settings, Purpose)
    - Modified Components table (Component, Changes)
```

The only difference is adding Settings to the New Components table columns and the scaffolding note.

### 5. Update scaffolding skill — no-op rule and remove presets

In `plugin/skills/scaffolding/SKILL.md`, two changes:

**Add a section** documenting:
- Scaffolding runs during implementation phase only — never during `sdd-change new`
- Scaffolding is a no-op for existing components (if `components/{type-plural}/{name}/` already exists, skip entirely)
- Never overwrite user code
- The plan must distinguish "scaffold new component" from "modify existing component"

**Remove the "Component Presets" section** (lines 192-250). These predefined bundles (Full-Stack Application, Backend API Only, Frontend Only, Multi-Backend, Multi-Frontend, Backend with Database) are no longer used — component discovery always asks users to pick components explicitly. Delete the entire `## Component Presets` section and its six preset blocks.

### 6. Minor update to component-discovery skill

In `plugin/skills/component-discovery/SKILL.md`, update the Output section (lines 107-111). The current text references "project type" which doesn't exist. Fix the description and add a note about settings flow. Change:

```
## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns detected project type and a list of components with names, types, and settings.
```

To:

```
## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns a list of components with names, types, and settings.

Component settings from this output (server_type, databases, provides_contracts, etc.) flow into the SPEC.md `## Components` section's Settings column, where they inform the scaffolding phase during implementation.
```

Also remove the `project_type` line from both examples in the same file (line 217: `project_type: "fullstack"`, line 263: `project_type: "custom"`).

Also update `schemas/output.schema.json` to remove the `project_type` field and its `required` entry.

### 7. Update solicitation steps to populate Settings column

In `plugin/skills/spec-solicitation/resources/solicitation-steps.md`, add a note at the end of Step 9 (line 118, after the YAGNI Principle paragraph). Insert after:

```
**YAGNI Principle**: Only ask about operations the UI actually requires. Do NOT assume full CRUD for every entity. If the UI only shows a list view, don't ask about Create/Update/Delete.
```

Add:

```
**Components Section**: When generating SPEC.md, populate the `## Components` New Components table's Settings column from the component-discovery output. Each discovered component's settings (server_type, databases, provides_contracts, etc.) must appear in this column so the implementation plan can scaffold correctly.
```

### 8. Add scaffolding skill to devops agent

In `plugin/agents/devops.md`, make two changes:

**Frontmatter** (lines 7-11) — change:

```yaml
skills:
  - project-settings
  - postgresql
  - helm-standards
  - cicd-standards
```

To:

```yaml
skills:
  - project-settings
  - postgresql
  - helm-standards
  - cicd-standards
  - scaffolding
```

**Skills body** (line 24, after the `cicd-standards` bullet) — add a new bullet:

```
- `scaffolding` — Orchestrates component scaffolding during implementation (structural skeleton only)
```

The `scaffolding` skill is the orchestrator that coordinates component-specific scaffolding skills (backend-scaffolding, frontend-scaffolding, etc.) — the agent only needs the orchestrator, not each individual one.

## Dependencies

Changes are independent and can be made in any order, but logically:
1. Remove scaffolding from `sdd-change.md` first (the core fix)
2. Update planning skill (enables scaffolding during implementation)
3. Update templates and documentation (supporting changes)

## Tests

All changes are prompt-only (.md files) — no automated test infrastructure applies. The following are manual verification checks to perform after implementation.

### Structural Checks

- [ ] `sdd-change.md` interactive flow has no scaffolding step between discovery and workflow creation
- [ ] `sdd-change.md` external spec flow has no scaffolding step (unchanged)
- [ ] `planning/SKILL.md` template includes Phase 1: Component Scaffolding with `devops` agent and explicit `Standards:` field
- [ ] `planning/SKILL.md` line count stays under 500
- [ ] `spec-feature.md` Components section has Settings column in New Components table
- [ ] `scaffolding/SKILL.md` documents no-op rule and implementation-phase-only usage
- [ ] `solicitation-steps.md` Step 9 notes Settings column population from discovery output
- [ ] `devops.md` frontmatter `skills:` includes `scaffolding`

### Cross-Reference Checks

- [ ] All step numbers in `sdd-change.md` interactive flow are sequential (no gaps or duplicates)
- [ ] All `<from step N>` references in `sdd-change.md` point to correct renumbered steps
- [ ] `spec-sections.md` Components section matches `spec-feature.md` template

## Verification

- [ ] `sdd-change new` (interactive) never creates component directories or modifies `sdd-settings.yaml`
- [ ] `sdd-change new` (external spec) never creates component directories or modifies `sdd-settings.yaml`
- [ ] Component discovery still runs and produces recommendations in both flows
- [ ] SPEC.md Components section includes component settings from discovery
- [ ] PLAN.md includes scaffolding as Phase 1 (scaffolding) when new components are needed
- [ ] PLAN.md omits Phase 1 (scaffolding) when all components already exist
- [ ] Scaffolding during implementation is a no-op for existing components
- [ ] No parallel write conflicts on `sdd-settings.yaml` (scaffolding runs sequentially in implementation)
