---
id: 157
title: Extract sdd-core from monolithic plugin into core + tech pack architecture
priority: high
status: rejected
rejected_reason: Obsolete — trying a different approach
created: 2026-02-21 18:00 UTC
depends_on: []
blocks: []
---

# Task 157: Extract sdd-core from monolithic plugin into core + tech pack architecture

## Description

Separate the SDD plugin into two layers: **sdd-core** (pure methodology framework) and **tech packs** (technology-specific extensions). The current monolithic `plugin/` is preserved as a transitional legacy copy.

sdd-core provides the spec-driven development methodology — spec writing, domain modeling, change lifecycle, planning, workflow enforcement, hooks, and config management. It works for any project regardless of language, framework, or infrastructure. It is both a **standalone Claude Code plugin** and a **build-time framework** for composing tech pack plugins.

Tech packs are technology-specific extensions that compose with sdd-core at **build time** (not runtime) to produce standalone Claude Code plugins. Users install one plugin — either sdd-core alone or a composed tech pack plugin. There is no runtime tech pack discovery, no subprocess delegation, and no multi-plugin coordination on the user's machine.

## Motivation

- Need to use SDD capabilities in another Claude Code plugin without the opinionated fullstack-ts stack
- sdd-core should be able to manage many different kinds of user projects
- Third-party tech pack authors should be able to create tech packs using SDD itself (dogfooding)

## Scope

- Preserve current `plugin/` as transitional legacy copy (`plugins/sdd/`)
- Extract core methodology into `plugins/sdd-core/` — a standalone Claude Code plugin
- Define extension point schema for sdd-core's composable skill/agent/command templates
- Build the composition tool — CLI that merges core templates + tech pack fragments into a composed plugin
- Create `sdd-fullstack-ts` tech pack with fragments extracted from current plugin
- Compose `plugins/sdd-fullstack-ts/` — a standalone plugin combining core + fullstack-ts
- Create tech pack scaffolder so authors can bootstrap new tech packs
- Ship `tech-pack.schema.json` for validating tech pack structure

## Constraints

- **No shared code** between core and tech packs — file-based contract only (YAML manifests, JSON Schema, markdown templates)
- **No runtime tech pack management** — composition happens at build/release time, not on the user's machine
- **Build-time composition produces a standalone Claude Code plugin** — users install one plugin, all skills/agents/commands are native
- **sdd-core must not assume anything about the user's project structure** aside from the `sdd/` directory it manages
- **sdd-core must not touch language/framework files** — `package.json`, `tsconfig.json`, lock files, etc. are tech pack territory
- **Legacy `plugins/sdd/` is transitional** — removed once sdd-core + composed tech pack achieve feature parity and tests pass
- **Component types are declared by tech packs, selected by users** — no file-scanning discovery; tech pack manifest declares available component types, users choose during init

## Resolved Questions

### RQ-1: Where do methodology artifacts live?

**Decision:** All SDD-managed artifacts live in a visible `sdd/` directory at the project root. No hidden `.sdd/` directory.

```
project/
├── sdd/
│   ├── settings.yaml       # project settings
│   ├── specs/              # architecture, domain, change specs
│   ├── changes/            # change lifecycle tracking
│   ├── logs/               # system logs
│   └── ...
├── CLAUDE.md               # generated (stays at root — Claude Code requires it)
└── <everything else>       # tech pack's / user's domain
```

**Rationale:** Specs, changes, and domain models are project documentation — first-class artifacts that developers should see and browse, not hidden tool internals. A single visible directory keeps things simple and signals "this project uses SDD."

**Ownership boundary:**
- sdd-core owns `sdd/` and nothing outside it (except root `CLAUDE.md` which Claude Code mandates at project root)
- Tech packs own everything outside `sdd/` — they scaffold `src/`, `components/`, `package.json`, `tsconfig.json`, etc.
- Language/framework files (`package.json`, lock files, etc.) are strictly tech pack territory — sdd-core never touches them

### RQ-2: How do tech pack skills integrate into the SDD workflow?

**Decision:** Build-time skill composition. No runtime discovery, no reliance on Claude to find and load tech pack content.

sdd-core's skills, agents, and commands ship as **composable templates** with named extension points. Tech packs provide **fragments** — markdown content that maps to specific extension points. A build tool composes them into final skills at release time, producing a standalone Claude Code plugin with all tech pack content baked into the skill text.

**Rationale:** Tech packs must interject at many lifecycle points (planning, scaffolding, implementation, review, hooks). Relying on Claude to discover and apply tech pack skills at runtime is unreliable. Build-time composition guarantees tech pack content is literally present in the loaded skill text — deterministic, not contextual.

**Mechanism:**
1. Core skill template defines extension points: `<!-- ext:planning -->`, `<!-- ext:implementation -->`, etc.
2. Tech pack manifest maps fragments to extension points
3. Build tool reads templates + fragments, outputs composed skills
4. Composed skills are written into the output plugin's `skills/` directory
5. Claude Code loads them as native skills — no special runtime needed

### RQ-3: How are tech packs managed?

**Decision:** SDD manages tech packs as a build-time framework. Tech packs are NOT separate Claude Code plugins and are NOT discovered/installed at runtime on the user's machine.

**For users:** Install one Claude Code plugin (either `sdd-core` standalone or a composed tech pack plugin like `sdd-fullstack-ts`). No tech pack management needed.

**For tech pack authors:** Use sdd-core's scaffolder and build tool to create and compose tech packs during development. The output is a regular Claude Code plugin ready for publishing.

### RQ-4: What is the tech pack contract?

**Decision:** Purely file-based. No shared packages, no shared types, no shared libraries.

Communication between core and tech pack happens only through:
1. **Extension point schema** — core defines named slots, tech packs provide fragments
2. **JSON Schema files** — for validation (just `.json` files, no shared code)
3. **YAML manifests** — tech pack declares components, fragments, templates
4. **Markdown files** — skill/agent/command content

## Open Questions

(none)

## Changes

- New directory structure: `plugins/{sdd,sdd-core,sdd-fullstack-ts}/`
- Define extension point schema for composable skill/agent/command templates
- Build composition CLI tool (core templates + tech pack fragments = composed plugin)
- Extract core methodology skills into composable templates with extension points
- Extract tech-specific content into fullstack-ts tech pack fragments
- Refactor settings to use `sdd/` directory (was `.sdd/`)
- Refactor component types from hardcoded to tech-pack-declared
- Refactor scaffolding from hardcoded templates to tech-pack-provided templates
- Create tech pack scaffolder for authors

## Acceptance Criteria

- [ ] `plugins/sdd/` exists unchanged from current `plugin/` — verified by `diff -r plugin/ plugins/sdd/`
- [ ] `plugins/sdd-core/` installs as a standalone Claude Code plugin (`claude plugin add ./plugins/sdd-core`) and provides full SDD methodology without any tech pack — verified by running `sdd-system` CLI commands
- [ ] Build tool composes `sdd-core` + `sdd-fullstack-ts` fragments into a standalone plugin — verified by running the build and checking output has no unresolved extension points (`grep -r '<!-- ext:' plugins/sdd-fullstack-ts/`)
- [ ] Composed `plugins/sdd-fullstack-ts/` installs as a standalone Claude Code plugin and provides all current capabilities — verified by `claude plugin add ./plugins/sdd-fullstack-ts`
- [ ] Core uses `sdd/` directory for all methodology artifacts — verified by `grep -r '\.sdd/' plugins/sdd-core/` returning no matches
- [ ] `sdd/settings.yaml` works as the project settings file — verified by `sdd-system settings show`
- [ ] Tech pack scaffolder creates a valid tech pack project structure — verified by running scaffolder and then composing with sdd-core successfully
- [ ] `tech-pack.schema.json` validates the fullstack-ts tech pack manifest — verified by `sdd-system tech-pack validate`
- [ ] All existing tests pass — verified by `npm test`
- [ ] Build succeeds for all plugins — verified by `npm run build:plugin` (or equivalent for new structure)
