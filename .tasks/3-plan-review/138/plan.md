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
| `plugin/skills/scaffolding/SKILL.md` | Add no-op rule for existing components, document implementation-phase usage |
| `plugin/skills/component-discovery/SKILL.md` | Minor: add note about settings flowing into SPEC.md Components section |
| `plugin/skills/spec-solicitation/resources/solicitation-steps.md` | Update Step 9 to populate Settings column when writing Components section |

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

In `plugin/skills/planning/SKILL.md`, update the Dynamic Phase Generation section:

When the SPEC.md `## Components` section lists **New Components** that don't yet exist in `sdd-settings.yaml`, the planning skill generates a **"Phase 1: Component Scaffolding"** phase as the first phase, shifting all subsequent phases down by one.

This phase:
- Is assigned to `devops` agent (infrastructure setup)
- Invokes the component-specific scaffolding skills for each new component
- Updates `sdd-settings.yaml` with new component entries
- Runs scaffolding in dependency order (config → contract → server → webapp → database → helm)
- Is a no-op if all components already exist

When no new components are needed, this phase is omitted entirely and Phase 1 starts with whatever the dependency graph dictates (typically contract or config).

Update the plan template to show this optional phase:

```markdown
### Phase 1: Component Scaffolding (if new components)
**Agent:** `devops`
**Standards:** Component scaffolding skills

**Outcome:** New component directories and boilerplate created

**Deliverables:**
- Component directories scaffolded
- sdd-settings.yaml updated
- package.json scripts updated
```

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

### 4. Update spec-sections documentation

In `plugin/skills/spec-solicitation/resources/spec-sections.md`, update section 15 (Components) to match the enhanced template, including the Settings column for new components.

### 5. Add no-op rule to scaffolding skill

In `plugin/skills/scaffolding/SKILL.md`, add a section documenting:
- Scaffolding runs during implementation phase only — never during `sdd-change new`
- Scaffolding is a no-op for existing components (if `components/{type-plural}/{name}/` already exists, skip entirely)
- Never overwrite user code
- The plan must distinguish "scaffold new component" from "modify existing component"

### 6. Minor update to component-discovery skill

In `plugin/skills/component-discovery/SKILL.md`, add a note in the output section clarifying that component settings flow into the SPEC.md Components section (with Settings column) so the implementation plan can use them for scaffolding.

### 7. Update solicitation steps to populate Settings column

In `plugin/skills/spec-solicitation/resources/solicitation-steps.md`, update Step 9 (Technical Deep-Dive) to note that when generating the SPEC.md Components section, the Settings column must be populated from the component-discovery output. The solicitation skill already loads discovered components from the workflow — this change makes it explicit that Settings data (server_type, databases, provides_contracts, etc.) must be written into the New Components table.

## Dependencies

Changes are independent and can be made in any order, but logically:
1. Remove scaffolding from `sdd-change.md` first (the core fix)
2. Update planning skill (enables scaffolding during implementation)
3. Update templates and documentation (supporting changes)

## Tests

### Unit Tests

- [ ] `test_interactive_flow_steps_do_not_include_scaffolding` — verify interactive flow step sequence in sdd-change.md has no scaffolding step
- [ ] `test_external_flow_steps_do_not_include_scaffolding` — verify external spec flow has no scaffolding step
- [ ] `test_plan_includes_scaffolding_phase_for_new_components` — verify plan template includes Phase 1 (scaffolding) scaffolding when new components exist
- [ ] `test_plan_omits_scaffolding_phase_when_all_components_exist` — verify plan template omits Phase 1 (scaffolding) when no new components
- [ ] `test_spec_components_section_includes_settings` — verify spec template Components section has Settings column
- [ ] `test_scaffolding_noop_for_existing_components` — verify scaffolding skill documents no-op behavior

### Integration Tests

- [ ] `test_interactive_new_creates_no_files_or_directories` — run through interactive `new` flow and verify no component directories are created
- [ ] `test_external_new_creates_no_files_or_directories` — run through external spec `new` flow and verify no component directories are created
- [ ] `test_implementation_scaffolds_from_plan_phase` — verify implementation with scaffolding plan phase creates component directories

## Verification

- [ ] `sdd-change new` (interactive) never creates component directories or modifies `sdd-settings.yaml`
- [ ] `sdd-change new` (external spec) never creates component directories or modifies `sdd-settings.yaml`
- [ ] Component discovery still runs and produces recommendations in both flows
- [ ] SPEC.md Components section includes component settings from discovery
- [ ] PLAN.md includes scaffolding as Phase 1 (scaffolding) when new components are needed
- [ ] PLAN.md omits Phase 1 (scaffolding) when all components already exist
- [ ] Scaffolding during implementation is a no-op for existing components
- [ ] No parallel write conflicts on `sdd-settings.yaml` (scaffolding runs sequentially in implementation)
