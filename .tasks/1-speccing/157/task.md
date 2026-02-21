---
id: 157
title: Extract sdd-core from monolithic plugin into core + tech pack architecture
priority: high
status: speccing
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
- **sdd-core must not assume anything about the user's project structure** aside from the `.sdd/` directory it manages

## Open Questions

### OQ-1: Where do methodology artifacts live?

sdd-core must not assume anything about the user's project structure outside `.sdd/`. The current plugin assumes root-level `specs/`, `changes/`, and `components/` directories exist. This needs to be resolved.

**Current state (monolithic plugin):**
- `specs/` at project root — architecture specs, domain specs
- `changes/` at project root — change specs, INDEX.md
- `components/` at project root — scaffolded component directories
- `package.json` at project root — assumed to exist
- `CLAUDE.md` at project root — generated with project-specific content

**Options:**

**A) Move methodology artifacts inside `.sdd/`** — sdd-core owns `.sdd/specs/`, `.sdd/changes/`, etc. Core manages these directly. Tech packs and users own everything outside `.sdd/`.

**B) Configurable paths in `.sdd/sdd-settings.yaml`** — sdd-core reads paths like `specs_dir: specs/` or `specs_dir: .sdd/specs/` from settings. Tech packs or users set them. Defaults to `.sdd/` subdirectories.

**C) Tech packs declare preferred structure** — each tech pack's `tech-pack.yaml` declares project layout preferences. sdd-core scaffolds according to the active tech pack's declared structure.

**Sub-questions:**
- **CLAUDE.md generation**: Currently sdd-core would generate a project-root `CLAUDE.md`. Should this be a tech pack responsibility? Should sdd-core only contribute a `.sdd/`-scoped instruction file?
- **Project scaffolding**: If sdd-core only owns `.sdd/`, all project-level scaffolding (directories, files, `package.json` scripts) becomes purely tech pack territory. The core scaffolding engine only creates `.sdd/` internals.
- **Spec referencing**: If specs move inside `.sdd/`, all prompt files, skills, and CLI commands that reference `specs/` need updating.

**Leaning:** Option A — specs and changes are methodology artifacts, so they belong inside `.sdd/` (owned by core). Everything outside `.sdd/` is the tech pack's or user's domain. This keeps sdd-core truly project-structure-agnostic.

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
