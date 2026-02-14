---
id: 138
title: Separate component discovery from scaffolding in sdd-change new flow
priority: null
status: planning
created: 2026-02-14 17:00 UTC
depends_on: []
blocks: []
---

# Task 138: Separate component discovery from scaffolding in sdd-change new flow

## Description

In the current `sdd-change` skill, scaffolding happens too early — before requirements have been fully gathered and approved. In the interactive flow, Steps 4-5 (Component Discovery + On-Demand Scaffolding) run before Step 7 (Spec Solicitation), creating directories and boilerplate before a spec even exists. The external spec flow is better but still not fully correct — it must also ensure scaffolding is deferred to implementation.

This applies to **both** the interactive and external spec paths. The principle is universal: scaffolding is implementation, not creation.

### Why this is wrong

1. **Scaffolding without requirements is wasteful.** The scaffolded code is generic boilerplate that doesn't reflect the actual feature. For example, the contract scaffolding agent generated menu item and order endpoints based on guessing from the component name, rather than from an approved spec.

2. **It violates the two-stage approval model.** The entire point of the SDD flow is: spec -> approve spec -> plan -> approve plan -> implement. Scaffolding is an implementation concern — it creates real files with real code structure. Running it during `new` bypasses the approval gates.

3. **Multiple agents race on shared state.** When scaffolding runs in parallel, agents compete to update `sdd-settings.yaml`, causing write conflicts (one agent got a "file modified since read" error during this session).

4. **It conflates "which components exist" with "what components contain."** Component discovery (asking "will this feature need a database? a frontend?") is fine during `new` — that's a planning question. But actually creating the directories and files is implementation.

### Core principle

**Scaffolding is an implementation activity that must appear in the spec and plan.** It is never a silent, automatic step. The spec defines what components are needed and why. The plan defines what to scaffold. Implementation executes the plan, including scaffolding. No implicit file creation at any phase.

### Design decisions

- **Scaffolding stays deterministic.** Scaffolding skills generate the same structural skeleton every time — they do not interpret spec content to make creative decisions. The spec determines *which* scaffolding to run and *when*, not *what* it generates. Feature-specific code (routes, handlers, schemas) comes from implementation agents after scaffolding, guided by the spec.

- **Scaffolding is a no-op for existing components.** If the component directory already exists, scaffolding skips it entirely. Never overwrite user code. The plan should distinguish "scaffold new component" from "modify existing component." Template drift for existing components is tracked in #140.

### Proposed fix

- **Keep component discovery in `new` (both flows)** — it's a planning question about which components are needed. Discovery results are recorded in the spec.
- **Remove all scaffolding from `new` (both flows)** — no directories, no files, no settings mutations. Neither interactive nor external spec paths should scaffold.
- **Scaffolding is just another implementation phase** — the spec lists required components, the plan includes scaffolding as a phase like any other (e.g., "scaffold backend component", "set up database migrations"). Implementation executes the plan phases in order. Not every plan needs scaffolding.
- **Fix parallel write conflicts on `sdd-settings.yaml`** — the race condition goes away naturally since scaffolding moves to sequential implementation, but settings writes should be serialized regardless.

## Acceptance Criteria

- [ ] `sdd-change new` never creates component directories, files, or modifies `sdd-settings.yaml` (both interactive and external spec flows)
- [ ] `sdd-change new` still performs component discovery (analytical only, both flows)
- [ ] Spec template includes a "Required Components" section for discovery output
- [ ] Plan template includes scaffolding as an explicit step when new components are needed
- [ ] Scaffolding appears as a normal phase in the implementation plan (not a special pre-step)
- [ ] Scaffolding is deterministic — structural skeleton only, no spec-driven code generation
- [ ] Scaffolding is a no-op for existing components (never overwrites)
- [ ] No parallel write conflicts on `sdd-settings.yaml`
