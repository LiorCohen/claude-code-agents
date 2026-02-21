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

Tech packs are separate Claude Code plugins that register with sdd-core via `sdd/tech-packs.yaml` and provide component types, standards skills, scaffolding skills, agents, templates, and scoped CLI actions.

## Motivation

- Need to use SDD capabilities in another Claude Code plugin without the opinionated fullstack-ts stack
- sdd-core should be able to manage many different kinds of user projects
- Third-party tech pack authors should be able to create tech packs using SDD itself (dogfooding)

## Scope

- Create `plugins/` directory with three plugins: `sdd` (legacy), `sdd-core`, `sdd-fullstack-ts`
- Extract 16 core skills, 3 commands, hooks, and ~50 CLI source files into sdd-core
- Extract 20 tech-specific skills, 7 agents, and ~37 CLI source files into sdd-fullstack-ts
- Implement tech pack registration via `sdd/tech-packs.yaml` → `tech-pack.yaml`
- Implement namespaced settings (`tech_packs.<name>.components` in `sdd/settings.yaml`)
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
- **sdd-core must not assume anything about the user's project structure** aside from the `sdd/` directory it manages
- **sdd-core must not touch language/framework files** — `package.json`, `tsconfig.json`, lock files, etc. are tech pack territory

## Resolved Questions

### RQ-1: Where do methodology artifacts live?

**Decision:** All SDD-managed artifacts live in a visible `sdd/` directory at the project root. No hidden `.sdd/` directory.

```
project/
├── sdd/
│   ├── settings.yaml       # project settings (was .sdd/sdd-settings.yaml)
│   ├── tech-packs.yaml     # registered tech packs
│   ├── specs/              # architecture, domain, change specs
│   ├── changes/            # change lifecycle tracking
│   ├── logs/               # system logs
│   └── ...
├── CLAUDE.md               # generated (stays at root — Claude Code requires it)
└── <everything else>       # user's / tech pack's domain
```

**Rationale:** Specs, changes, and domain models are project documentation — first-class artifacts that developers should see and browse, not hidden tool internals. A single visible directory keeps things simple and signals "this project uses SDD."

**Ownership boundary:**
- sdd-core owns `sdd/` and nothing outside it (except root `CLAUDE.md` which Claude Code mandates at project root)
- Tech packs own everything outside `sdd/` — they scaffold `src/`, `components/`, `package.json`, `tsconfig.json`, etc.
- Language/framework files (`package.json`, lock files, etc.) are strictly tech pack territory — sdd-core never touches them

## Open Questions

(none)

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
- [ ] `sdd/settings.yaml` uses namespaced `tech_packs.<name>.components` structure
- [ ] `sdd/tech-packs.yaml` correctly points to tech pack manifest
- [ ] Version compatibility check works: core rejects incompatible tech packs
- [ ] `tech-pack.schema.json` validates the fullstack-ts `tech-pack.yaml` successfully
- [ ] Tech pack scaffolder creates a valid tech pack project structure
- [ ] All existing tests pass
- [ ] `npm run build:plugin` succeeds for all three plugins
