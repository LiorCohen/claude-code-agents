---
id: 138
title: Separate component discovery from scaffolding in sdd-change new flow
priority: null
status: inbox
created: 2026-02-14 17:00 UTC
depends_on: []
blocks: []
---

# Task 138: Separate component discovery from scaffolding in sdd-change new flow

## Description

In the current `sdd-change` skill, the interactive `new` action runs Step 4 (Component Discovery) and Step 5 (On-Demand Component Scaffolding) before Step 7 (Spec Solicitation). This means component directories are created with generic placeholder code before requirements have even been gathered.

### Why this is wrong

1. **Scaffolding without requirements is wasteful.** The scaffolded code is generic boilerplate that doesn't reflect the actual feature. For example, the contract scaffolding agent generated menu item and order endpoints based on guessing from the component name, rather than from an approved spec.

2. **It violates the two-stage approval model.** The entire point of the SDD flow is: spec -> approve spec -> plan -> approve plan -> implement. Scaffolding is an implementation concern — it creates real files with real code structure. Running it during `new` bypasses the approval gates.

3. **Multiple agents race on shared state.** When scaffolding runs in parallel, agents compete to update `sdd-settings.yaml`, causing write conflicts (one agent got a "file modified since read" error during this session).

4. **It conflates "which components exist" with "what components contain."** Component discovery (asking "will this feature need a database? a frontend?") is fine during `new` — that's a planning question. But actually creating the directories and files is implementation.

### Proposed fix

- **Keep component discovery in `new`** — it's a planning question about which components are needed.
- **Move scaffolding to the implement phase** — after spec approval and plan approval, scaffold as the first step of implementation.
- **Fix parallel write conflicts on `sdd-settings.yaml`** — either serialize settings writes or use a locking mechanism.

## Acceptance Criteria

- [ ] `sdd-change new` no longer creates component directories or files
- [ ] `sdd-change new` still asks which components are needed (discovery)
- [ ] Component scaffolding runs during the implement phase, after spec and plan approval
- [ ] No parallel write conflicts on `sdd-settings.yaml`
- [ ] Scaffolding has access to approved spec content to generate meaningful code instead of guesses
