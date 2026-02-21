---
id: 157
title: Extract sdd-core from monolithic plugin into core + tech pack architecture
priority: high
status: inbox
created: 2026-02-21 18:00 UTC
depends_on: []
blocks: []
---

# Task 157: Extract sdd-core from monolithic plugin into core + tech pack architecture

## Description

Separate the SDD plugin into two independent plugins: **sdd-core** (pure methodology) and **sdd-fullstack-ts** (first-party tech pack). The current monolithic `plugin/` remains as `plugins/sdd/` for backwards compatibility.

sdd-core provides the spec-driven development methodology — spec writing, domain modeling, change lifecycle, planning, workflow enforcement, hooks, and config management. It works for any project regardless of language, framework, or infrastructure.

Tech packs are separate Claude Code plugins that register with sdd-core via `.sdd/tech-packs.yaml` and provide component types, standards skills, scaffolding skills, agents, templates, and scoped CLI actions.

## Motivation

- Need to use SDD capabilities in another Claude Code plugin without the opinionated fullstack-ts stack
- sdd-core should be able to manage many different kinds of user projects
- Third-party tech pack authors should be able to create tech packs using SDD itself (dogfooding)

## Scope

- Create `plugins/` directory with three plugins: `sdd` (legacy), `sdd-core`, `sdd-fullstack-ts`
- Extract 16 core skills, 3 commands, hooks, and ~50 CLI source files into sdd-core
- Extract 20 tech-specific skills, 7 agents, and ~37 CLI source files into sdd-fullstack-ts
- Implement tech pack registration via `.sdd/tech-packs.yaml` → `tech-pack.yaml`
- Implement namespaced settings (`tech_packs.<name>.components` in sdd-settings.yaml)
- Implement CLI namespace isolation (tech pack actions scoped under `sdd-system <pack-name>`)
- Implement separate CLI binaries (core CLI delegates to tech pack CLI via subprocess)
- Implement compatibility contract (semver, manifest validation, runtime checks)
- Add tech pack scaffolder to sdd-core (`create-techpack` scaffolding action)
- Ship `tech-pack.schema.json` for manifest validation

## Constraints

- Tech packs must be fully isolated — no code dependency on sdd-core
- Legacy `plugins/sdd/` must remain unchanged for backwards compatibility
- Tech pack CLI is a separate binary, not dynamically loaded
- Tech packs register component types + settings schemas — core validates generically
- No SDK required — tech pack scaffolder provides structure, sdd-core provides methodology

## Changes

- New directory structure: `plugins/{sdd,sdd-core,sdd-fullstack-ts}/`
- Refactor settings type system (ComponentType becomes extensible, namespaced per tech pack)
- Refactor project scaffolding (read templates from tech pack manifest, not hardcoded switch)
- Refactor CLI router (tech pack namespace discovery + subprocess delegation)
- Refactor component discovery (output abstract roles, not fixed types)
- Refactor project-settings skill (generic envelope + tech pack schema delegation)

## Acceptance Criteria

- [ ] `plugins/sdd/` exists unchanged from current `plugin/` — verified by diff
- [ ] `plugins/sdd-core/` installs as a standalone Claude Code plugin and provides full SDD methodology without any tech pack
- [ ] `plugins/sdd-fullstack-ts/` installs alongside sdd-core and provides all current tech-specific capabilities
- [ ] `sdd-system spec validate` works (core CLI, top-level namespace)
- [ ] `sdd-system fullstack-ts database setup` works (tech pack CLI, scoped namespace)
- [ ] `.sdd/sdd-settings.yaml` uses namespaced `tech_packs.<name>.components` structure
- [ ] `.sdd/tech-packs.yaml` correctly points to tech pack manifest
- [ ] Version compatibility check works: core rejects incompatible tech packs
- [ ] `tech-pack.schema.json` validates the fullstack-ts `tech-pack.yaml` successfully
- [ ] Tech pack scaffolder creates a valid tech pack project structure
- [ ] All existing tests pass
- [ ] `npm run build:plugin` succeeds for all three plugins
