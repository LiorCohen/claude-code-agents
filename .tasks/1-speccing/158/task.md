---
id: 158
title: Split plugin into core/ and fullstack-typescript/ subdirectories
status: speccing
created: 2026-02-22 12:00 UTC
depends_on: []
blocks: []
---

# Task 158: Split plugin into core/ and fullstack-typescript/ subdirectories

## Description

Split the plugin directory into two subdirectories that separate the SDD methodology from the tech stack implementation:

- `plugin/core/` — Core SDD methodology (tech-agnostic). Defines the spec-driven development lifecycle, commands, and integration points that tech packs fill.
- `plugin/fullstack-typescript/` — Fullstack TypeScript tech pack (Node.js/CMDO, React/MVVM, PostgreSQL, OpenAPI, Helm). Provides agents, standards, scaffolding skills, and a system CLI for this specific stack.

Core defines a **component registry contract** — a set of integration points that tech packs implement. Core never hardcodes tech-pack-specific names (no agent names, no standards names, no component type names). Everything is discovered from the registry at runtime.

Tech packs can be **internal** (inside the plugin directory, shipped with the plugin) or **external** (in the user's project or elsewhere, installed separately via `sdd-run tech-pack install`).

## Glossary

| Term | Definition |
|---|---|
| **Plugin** | A Claude Code plugin — a directory containing a `plugin.json` manifest that registers commands, skills, and agents for Claude to use. |
| **Command** | A markdown file (`.md`) registered in `plugin.json` that defines a user-invocable `/slash-command`. Commands orchestrate skills. |
| **Skill** | A markdown file (`SKILL.md`) with optional schemas that provides domain knowledge or step-by-step instructions to Claude. Skills are invoked by commands, agents, or other skills — not directly by users. |
| **Agent** | A markdown file (`.md`) registered in `plugin.json` that defines a specialized persona with specific skills and constraints. Agents are assigned to components during planning and implementation phases. |
| **Standards skill** | A skill that defines coding conventions, architecture patterns, and best practices for a specific domain (e.g., `backend-standards` defines CMDO architecture rules). |
| **Scaffolding skill** | A skill that defines the file structure and templates for creating a new component instance. |
| **Orchestrator** | A skill that coordinates multi-step workflows by invoking other skills and system commands in sequence. |
| **System CLI** (`system-run.sh`) | A shell entrypoint to a TypeScript CLI binary that performs file operations skills cannot do directly (scaffolding, settings I/O, spec parsing, workflow state management). Skills invoke it via `system-run.sh <command> [args]`. |
| **`plugin.json`** | The Claude Code plugin manifest — declares which commands, skills, and agents the plugin provides, with paths to each file. |
| **`sdd-settings.yaml`** | Core-owned per-project configuration at `sdd/sdd-settings.yaml`. Stores project name, SDD version, installed tech packs, and a minimal component manifest (name, type, directory). Tech-specific component details live in separate tech pack settings files (`sdd/<namespace>-settings.yaml`). |
| **Tech pack registry** (`techpack.yaml`) | A static declaration file at the tech pack root that tells core what the tech pack offers — component types, agents, standards, scaffolding skills, templates, and lifecycle integration points. |
| **Tech pack** | A self-contained directory providing agents, standards, scaffolding skills, templates, and a system CLI for a specific technology stack. Fills integration points declared in the component registry. |
| **Integration point** | A named slot in the registry contract that core reads at runtime to discover tech-pack-provided capabilities (e.g., `components.server.agent` → which agent handles server components). |

## Current State

The current `plugin/` directory is a flat monolith — SDD methodology and fullstack-typescript implementation are interleaved with no separation:

```
plugin/
├── .claude-plugin/
│   └── plugin.json
├── agents/                            # All agents (tech-specific)
│   ├── api-designer.md
│   ├── backend-dev.md
│   ├── frontend-dev.md
│   ├── db-advisor.md
│   ├── devops.md
│   ├── tester.md
│   └── reviewer.md
├── commands/                          # All commands (methodology)
│   ├── sdd.md
│   ├── sdd-run.md
│   └── sdd-help.md
├── hooks/                             # Hook system (tech-specific safe dirs)
│   ├── hooks.json
│   ├── hook-runner.sh
│   ├── recommended-permissions.json
│   └── PERMISSIONS.md
├── skills/
│   ├── change-creation/               # Core methodology
│   ├── commit-standards/              # Core methodology
│   ├── component-discovery/           # Core (but hardcodes tech names)
│   ├── domain-population/             # Core methodology
│   ├── external-spec-integration/     # Core methodology
│   ├── planning/                      # Core (but hardcodes agent/standards)
│   ├── project-scaffolding/           # Core (but hardcodes tech templates)
│   ├── project-settings/              # Core (but hardcodes type→dir mapping)
│   ├── scaffolding/                   # Router (hardcoded delegation table)
│   ├── testing-standards/             # Tech-specific
│   ├── typescript-standards/          # Tech-specific
│   ├── unit-testing/                  # Tech-specific
│   ├── workflow-state/                # Core methodology
│   ├── spec-decomposition/            # Core methodology
│   ├── spec-index/                    # Core methodology
│   ├── spec-solicitation/             # Core methodology
│   ├── spec-writing/                  # Core methodology
│   ├── orchestrators/
│   │   ├── change-orchestration/      # Core methodology
│   │   ├── config-orchestration/      # Tech-specific
│   │   ├── init-orchestration/        # Core (but checks tech dirs)
│   │   ├── local-env-orchestration/   # Tech-specific
│   │   └── version-orchestration/     # Core methodology
│   └── components/                    # All tech-specific
│       ├── backend/
│       ├── frontend/
│       ├── database/
│       ├── contract/
│       ├── config/
│       ├── helm/
│       ├── cicd/
│       ├── integration-testing/
│       └── e2e-testing/
└── system/                            # Single CLI (mixed commands)
    ├── src/
    │   ├── cli.ts
    │   └── commands/
    │       ├── archive/               # Core
    │       ├── config/                # Tech-specific
    │       ├── contract/              # Tech-specific
    │       ├── database/              # Tech-specific
    │       ├── env/                   # Tech-specific
    │       ├── hook/                  # Tech-specific
    │       ├── permissions/           # Core
    │       ├── scaffolding/           # Core
    │       ├── settings/              # Core
    │       ├── spec/                  # Core
    │       └── workflow/              # Core
    ├── dist/
    ├── package.json
    ├── tsconfig.json
    └── system-run.sh
```

Core methodology and tech-specific implementation are annotated above to show the split boundary.

## Motivation

The current plugin is a monolith — SDD methodology and fullstack-typescript implementation are interleaved. This creates several problems:

1. **No reuse of the methodology.** Teams using a different stack (Python/Django, Go, etc.) cannot use SDD without the fullstack-typescript baggage.
2. **Tight coupling.** Core skills hardcode agent names (`backend-dev`), standards names (`backend-standards`), and component types (`server`, `webapp`). Changes to the tech stack ripple into core.
3. **No extensibility.** There's no way to add a new tech stack without modifying core files.
4. **Unclear boundaries.** It's not obvious which files are methodology vs tech stack, making the codebase harder to reason about.

## Scope

### In scope

- Directory restructuring: move files into `plugin/core/` and `plugin/fullstack-typescript/`
- Component registry contract (`techpack.yaml`) — schema and integration points
- Inter-system CLI protocol (facade pattern, namespaced commands)
- Settings namespace (`tech_packs.fs-ts` in `sdd-settings.yaml`)
- Core integration points (planning, verification, testing — per-component and lifecycle-level)
- Core system CLI changes (tech-pack routing, `tech-pack install|list|remove` commands)
- Tech pack system CLI (own binary, abstracts core commands behind own API)
- Update `plugin.json` manifest paths
- Update all internal references (skill paths, system-run.sh paths, template paths)

### Out of scope

- Creating a second tech pack (validates the architecture but not part of this task)
- External tech pack installation workflow (design the interface, implement internal only)
- Splitting into separate repositories or npm packages
- Changing the SDD lifecycle itself
- User-facing UX changes to `/sdd`, `/sdd-run`, `/sdd-help` (routing changes are internal)

## Constraints

- **Single plugin.** One `plugin.json` manifest. Both `core/` and `fullstack-typescript/` are registered in it.
- **No soft references.** All cross-boundary references are declared in the component registry. No casual "delegate to backend-standards" in prose — every reference traces to a registry entry.
- **Explicit integration point attribution.** When core loads a tech pack skill, it explicitly indicates which tech pack, which integration point, and which skill file is being used.
- **Core assumes nothing about the user project's directory structure** aside from the `sdd/` directory and the root `CLAUDE.md` file. All directory conventions (`components/servers/`, `components/config/`, etc.) are tech pack knowledge, declared via `directory_pattern` in the registry.
- **Zero functionality loss.** Every command, skill, agent, standard, scaffolding template, plan template, and system CLI command that exists before the split must exist and work identically after. This is a structural refactor — no capabilities, knowledge, or content may be dropped. A pre-split inventory must be created and verified against the post-split result.
- **Backward compatibility.** Existing SDD projects must continue to work. The `sdd-settings.yaml` migration adds the `tech_packs` namespace.
- **Build rules.** Each system directory has its own `package.json`, `tsconfig.json`, and build step. Root `package.json` scripts must continue to work.

## Changes

### 1. Component Registry Contract

Tech packs provide a `techpack.yaml` at their root declaring everything they offer:

```yaml
tech_pack:
  name: fullstack-typescript
  namespace: fs-ts
  version: "1.0.0"
  min_core_version: "8.0.0"
  system_path: ./system/system-run.sh

requires_core:
  - project-settings
  - project-scaffolding

components:
  server:
    description: "Node.js/TypeScript backend (CMDO architecture)"
    directory_pattern: "components/servers/{name}/"
    scaffolding: backend-scaffolding
    agent: backend-dev
  webapp:
    description: "React/TypeScript frontend (MVVM architecture)"
    directory_pattern: "components/webapps/{name}/"
    scaffolding: frontend-scaffolding
    agent: frontend-dev
  database:
    description: "PostgreSQL database (migrations and seeds)"
    directory_pattern: "components/databases/{name}/"
    scaffolding: database-scaffolding
    agent: db-advisor
  contract:
    description: "OpenAPI specification and type generation"
    directory_pattern: "components/contracts/{name}/"
    scaffolding: contract-scaffolding
    agent: api-designer
  config:
    description: "YAML configuration (mandatory singleton)"
    directory_pattern: components/config/
    scaffolding: config-scaffolding
  helm:
    description: "Kubernetes Helm charts"
    directory_pattern: "components/helm_charts/{name}/"
    scaffolding: helm-scaffolding
    agent: devops
  integration-testing:
    description: "Integration test suites (Testkube)"
    directory_pattern: "components/testing/integration/{name}/"
    scaffolding: integration-testing-scaffolding
    agent: tester
  e2e-testing:
    description: "End-to-end test suites (Testkube)"
    directory_pattern: "components/testing/e2e/{name}/"
    scaffolding: e2e-testing-scaffolding
    agent: tester
  cicd:
    description: "CI/CD pipelines (GitHub Actions)"
    directory_pattern: "components/cicds/{name}/"
    scaffolding: cicd-scaffolding
    agent: devops

project_templates: templates/project/             # tech-pack-specific project init templates
plan_templates: templates/plans/                 # tech-pack-specific plan phase descriptions

documentation:
  capabilities: skills/capabilities/SKILL.md    # intent→command mappings loaded into /sdd context
  help: skills/help-content/SKILL.md            # tech pack section loaded into /sdd-help context

standards_router: skills/standards-router/SKILL.md   # single entry point for all standards loading

lifecycle:
  verification:
    agent: reviewer
  testing:
    agent: tester

dependency_graph:
  config: []
  contract: [config]
  database: [config]
  server: [contract, config, database]
  webapp: [contract]
  helm: [server, webapp]
  integration-testing: [contract, server, database, helm]
  e2e-testing: [server, webapp, database, helm]
  cicd: [helm]

orchestrator: skills/orchestrators/orchestrator/SKILL.md
```

**Core defines the integration points** that tech packs can fill:

| Integration Point | Scope | When Core Uses It |
|---|---|---|
| `components.*.description` | Per-component | Discovery phase — displayed to user when listing available component types |
| `components.*.directory_pattern` | Per-component | Path resolution — core resolves `{name}` to get the component's directory in the user project |
| `components.*.scaffolding` | Per-component (required) | Scaffolding phase — invokes the skill to create file structure |
| `components.*.agent` | Per-component | Plan generation — assigns agent to component phase |
| `project_templates` | Tech-pack-level | Project init — core generates generic base, then applies tech pack's project templates (CLAUDE.md tech section, README.md tech section, package.json) |
| `plan_templates` | Tech-pack-level | Plan generation — core provides generic plan structure (phases, acceptance criteria), tech pack contributes phase-specific content (agent assignments, standards, architecture-specific tasks like "CMDO layers", "MVVM layers") |
| `documentation.capabilities` | Tech-pack-level | `/sdd` command — loaded into context so core can map natural language to tech pack commands (e.g., "set up my database" → `fs-ts database setup`) |
| `documentation.help` | Tech-pack-level | `/sdd-help` command — loaded into context to display tech-pack-specific help (available commands, stack description, getting started) |
| `standards_router` | Tech-pack-level | **Sole authority for all standards loading.** Core loads this single skill into context whenever standards are needed (implementation, planning, verification, testing). The router contains a table mapping component types and lifecycle phases to their standards skills, with explicit instructions for Claude to load only the subset relevant to the current context. Replaces per-component `standards` fields and lifecycle-level `standards` fields. |
| `lifecycle.verification.agent` | Tech-pack-level | Review phase — assigns the reviewer agent |
| `lifecycle.testing.agent` | Tech-pack-level | Testing phase — assigns the tester agent |
| `orchestrator` | Tech-pack-level | `sdd-run <namespace> *` routing — core delegates all namespaced commands to this single entry point skill, which handles internal routing within the tech pack |
| `dependency_graph` | Tech-pack-level | Plan generation and scaffolding order — core reads the DAG to determine component build order and validate dependency references |

**Registry field requirements:**

| Field | Required | Notes |
|---|---|---|
| `tech_pack.*` | Yes | All tech pack metadata fields (name, namespace, version, min_core_version, system_path) |
| `components.*.description` | Yes | Core displays this during component discovery |
| `components.*.directory_pattern` | Yes | Core needs this for all path resolution |
| `components.*.scaffolding` | Yes | Every component must declare a scaffolding skill |
| `components.*.agent` | No | Components without an agent won't have one assigned during planning |
| `project_templates` | No | If absent, core generates generic project files only |
| `plan_templates` | No | If absent, core generates generic plan structure only |
| `documentation.capabilities` | No | If absent, `/sdd` won't show tech-pack-specific command mappings |
| `documentation.help` | No | If absent, `/sdd-help` won't show tech-pack-specific help |
| `standards_router` | Yes | Single entry point for all standards loading — prevents Claude from loading all standards at once |
| `lifecycle.*` | No | If absent, lifecycle phases use no tech-pack-specific agents |
| `orchestrator` | Yes | Required for `sdd-run <namespace> *` command routing |
| `dependency_graph` | Yes | Required for scaffolding order and plan generation |
| `requires_core` | No | Declares which core skills the tech pack depends on |

### 2. Directory Structure

```
plugin/
├── .claude-plugin/
│   └── plugin.json                    # Single manifest, paths to both dirs
├── core/
│   ├── commands/
│   │   ├── sdd.md
│   │   ├── sdd-run.md
│   │   └── sdd-help.md
│   ├── skills/
│   │   ├── change-creation/
│   │   ├── commit-standards/
│   │   ├── component-discovery/
│   │   ├── domain-population/
│   │   ├── external-spec-integration/
│   │   ├── planning/
│   │   ├── project-scaffolding/
│   │   ├── project-settings/
│   │   ├── techpacks/                  # NEW: registry reader, validator, integration point resolver
│   │   └── orchestrators/
│   │       ├── change-orchestration/
│   │       ├── init-orchestration/
│   │       └── version-orchestration/
│   └── system/
│       ├── src/
│       │   ├── cli.ts
│       │   ├── commands/
│       │   │   ├── scaffolding/
│       │   │   ├── spec/
│       │   │   ├── workflow/
│       │   │   ├── settings/
│       │   │   ├── archive/
│       │   │   ├── permissions/
│       │   │   └── tech-pack/        # NEW: validate, list, info, install, remove
│       │   ├── lib/
│       │   ├── settings/
│       │   └── types/
│       ├── dist/
│       ├── package.json
│       ├── tsconfig.json
│       └── system-run.sh
└── fullstack-typescript/
    ├── README.md                      # Tech pack description, components, usage
    ├── techpack.yaml
    ├── agents/
    │   ├── api-designer.md
    │   ├── backend-dev.md
    │   ├── frontend-dev.md
    │   ├── db-advisor.md
    │   ├── devops.md
    │   ├── tester.md
    │   └── reviewer.md
    ├── skills/
    │   ├── capabilities/               # documentation.capabilities — /sdd intent mappings
    │   ├── help-content/               # documentation.help — /sdd-help tech pack section
    │   ├── planning-standards/         # internal: loaded via standards-router during planning
    │   ├── standards-router/              # standards_router — index of all standards with loading instructions
    │   ├── typescript-standards/          # internal: loaded via standards-router when TS code is involved
    │   ├── unit-testing/                  # internal: loaded via standards-router or agents
    │   ├── orchestrators/
    │   │   ├── orchestrator/          # single entry point for sdd-run fs-ts *
    │   │   ├── config-orchestration/
    │   │   └── local-env-orchestration/
    │   └── components/
    │       ├── backend/
    │       │   ├── backend-scaffolding/
    │       │   └── backend-standards/
    │       ├── frontend/
    │       │   ├── frontend-scaffolding/
    │       │   └── frontend-standards/
    │       ├── database/
    │       │   ├── database-scaffolding/
    │       │   ├── database-standards/
    │       │   └── postgresql/            # internal: engine-specific knowledge for db-advisor agent
    │       ├── contract/
    │       │   ├── contract-scaffolding/
    │       │   └── contract-standards/
    │       ├── config/
    │       │   ├── config-scaffolding/
    │       │   └── config-standards/
    │       ├── helm/
    │       │   ├── helm-scaffolding/
    │       │   └── helm-standards/
    │       ├── cicd/
    │       │   ├── cicd-scaffolding/
    │       │   └── cicd-standards/
    │       ├── integration-testing/
    │       │   ├── integration-testing-scaffolding/
    │       │   └── integration-testing-standards/
    │       └── e2e-testing/
    │           ├── e2e-testing-scaffolding/
    │           └── e2e-testing-standards/
    ├── templates/                         # non-skill template files
    │   ├── project/                       # project init templates
    │   │   ├── CLAUDE.md.tmpl             # tech stack section for project CLAUDE.md
    │   │   ├── README.md.tmpl             # tech-specific README content
    │   │   └── package.json.tmpl          # npm workspace config
    │   └── plans/                         # plan phase templates
    │       ├── plan-feature.md            # agent assignments, standards, architecture tasks
    │       ├── plan-bugfix.md
    │       ├── plan-refactor.md
    │       └── plan-epic.md
    └── system/
        ├── src/
        │   ├── cli.ts
        │   ├── commands/
        │   │   ├── config/
        │   │   ├── contract/
        │   │   ├── database/
        │   │   └── env/              # check-tools, deploy — tech-specific
        │   ├── lib/
        │   └── types/
        ├── dist/
        ├── package.json
        ├── tsconfig.json
        └── system-run.sh
```

### 3. Inter-System CLI Protocol

```
FACADE RULE
  Each side's skills ONLY call their own system.
  Core skills → core/system/system-run.sh
  Tech skills → fullstack-typescript/system/system-run.sh

ABSTRACTION
  Tech system exposes its OWN command API to tech skills.
  Tech system is self-contained — it has no knowledge of core's
  system path, commands, or API.

ROUTING
  Core system handles core commands natively.
  Core system reads the registry and delegates tech-namespaced commands
  to the tech system (e.g., `core/system-run.sh fs-ts database setup main-db`
  → delegates to `fullstack-typescript/system/system-run.sh database setup main-db`).

  Tech system handles tech commands natively.
  Tech system NEVER calls core system — it is fully self-contained.

NAMESPACING
  Tech commands through core use the namespace prefix: fs-ts
  Core commands are top-level (no prefix).
  This prevents conflicts between core and tech pack commands.

INPUT/OUTPUT CONTRACT
  Exit 0 = success, non-zero = failure.
  Stdout: JSON for machine-readable operations, text for human-readable.
  Stderr: error messages and diagnostics only.

SIDE EFFECTS CONTRACT
  When core delegates a command to the tech system, the tech system
  may return structured JSON declaring side effects that require
  core-owned state changes. Core processes these after the tech
  command completes successfully.

  Tech system stdout (on success):
  {
    "result": { ... },               // tech-specific output
    "side_effects": [                 // optional, core processes these
      { "action": "register_component", "name": "main-db", "type": "database", "directory": "components/databases/main-db" },
      { "action": "unregister_component", "name": "main-db" }
    ]
  }

  Core defines the set of valid side effect actions. Tech system
  never writes core state directly — it declares intent, core executes.
  If side_effects is absent or empty, core takes no additional action.

SHARED STATE
  Filesystem only — no shared memory, no IPC.

  sdd/sdd-settings.yaml:
    Owner: core (read/write).
    Tech system: no access.
    Contains: project metadata, SDD version, installed tech packs
    list, and a minimal component manifest per tech pack (name,
    type, directory only — enough for planning and routing).

  sdd/<namespace>-settings.yaml (e.g., sdd/fs-ts-settings.yaml):
    Owner: tech pack (read/write).
    Core: no access.
    Contains: full component details including depends_on,
    capabilities, and tech-specific settings. Tech system reads
    and writes this file directly.

  sdd/system-logs/:
    Both write (separate log files per system).
```

### 4. Settings Namespace

**Three configuration layers:**

| File | Owner | Purpose |
|------|-------|---------|
| `techpack.yaml` | Tech pack (static, ships with plugin) | Declares what the tech pack *offers* — component types, agents, standards, scaffolding, templates, lifecycle integration points. Read-only at runtime. |
| `sdd/sdd-settings.yaml` | Core (read/write) | Per-project configuration — project metadata, SDD version, installed tech packs, and a minimal component manifest (name, type, directory) for planning and routing. |
| `sdd/<namespace>-settings.yaml` | Tech pack (read/write) | Per-project tech-specific state — full component details including dependencies, capabilities, and tech-specific settings. |

**`sdd/sdd-settings.yaml`** (core-owned):

```yaml
sdd:
  version: "8.0.0"
project:
  name: my-project
tech_packs:
  fs-ts:
    name: fullstack-typescript
    namespace: fs-ts
    version: "1.0.0"
    mode: internal                        # or "external"
    path: fullstack-typescript            # relative to plugin root if internal
    components:                           # minimal manifest — written via side effects
      - name: main-server
        type: server
        directory: components/servers/main-server
      - name: main-db
        type: database
        directory: components/databases/main-db
```

**`sdd/fs-ts-settings.yaml`** (tech-pack-owned):

```yaml
components:
  - name: main-server
    type: server
    directory: components/servers/main-server
    depends_on: [main-db, main-api]
    capabilities: [http-api, background-jobs]
    settings:
      server_type: hybrid
      modes: [api, worker]
      databases: [main-db]
      provides_contracts: [main-api]
  - name: main-db
    type: database
    directory: components/databases/main-db
    depends_on: []
    capabilities: [postgresql]
    settings:
      engine: postgresql
```

**Core defines `TechPackEntry` schema (for core settings):**

```typescript
type TechPackEntry = {
  readonly name: string;
  readonly namespace: string;
  readonly version: string;
  readonly mode: 'internal' | 'external';
  readonly path: string;
  readonly components: readonly ComponentManifest[];
};

type ComponentManifest = {
  readonly name: string;
  readonly type: string;
  readonly directory: string;
};
```

Core validates: name uniqueness, required fields present, directory paths don't collide.
Tech pack validates its own settings file: `type` is a known type, `depends_on` references resolve, `settings` matches the schema for that type, `capabilities` are valid.

### 5. Core Skill Changes

Core skills that currently hardcode tech-specific names must be rewritten to read from the registry:

| Core Skill | Current Behavior | New Behavior |
|---|---|---|
| `project-settings` | Hardcoded type→directory mapping table (`server → components/servers/`), component type definitions | Split: core owns the settings *mechanism* (read/write `sdd-settings.yaml`, base schema validation). Type→directory mapping removed — core reads `components.*.directory_pattern` from registry. Component type definitions removed — types come from registry `components` keys. |
| `planning` | Hardcoded agent→component table, standards names | Reads `components.*.agent` from registry for agent assignments. Standards loaded via standards router (not from registry directly). |
| `change-creation` | Hardcoded dependency graph, agent assignments, plan templates reference CMDO/MVVM/TailwindCSS | Reads `dependency_graph` and `components.*.agent` from registry. Plan templates split — generic structure stays in core, tech-specific phase descriptions move to tech pack (see Templates below). |
| `component-discovery` | Hardcoded "Available Components" table with tech descriptions ("Node.js backend (CMDO)", "React frontend (MVVM)", "PostgreSQL", "Testkube") and scaffolding skill names | Reads `components` keys from registry. Component descriptions come from registry (new `description` field per component). |
| `project-scaffolding` | References tech scaffolding skills by name, hardcoded template source/dest paths, project templates (`CLAUDE.md`, `README.md`) hardcode entire tech stack | Reads `components.*.scaffolding` from registry. Template paths resolved via tech pack. Project templates split (see Templates below). |
| `init-orchestration` | Checks for `components/config/` as mandatory | Delegates prerequisite verification to tech pack via orchestrator. Core does not check specific directories. |
| `change-orchestration/verification` | Hardcoded standards-per-component table with tech names | Reads `lifecycle.verification.agent` from registry for reviewer agent. Standards loaded via standards router (not from registry directly). |
| `change-orchestration/implementation` | Hardcoded agent names | Reads `components.*.agent` from registry |
| `scaffolding` (router skill) | Hardcoded delegation table | **Eliminated** — core reads registry directly |

**New core skill:**

| Skill | Purpose |
|---|---|
| `techpacks` | Single point of contact for all tech pack knowledge in core. Responsibilities: (1) parse and validate `techpack.yaml` for installed tech packs (via `tech-pack validate` system command), (2) resolve integration points to concrete skill paths, (3) load tech pack `documentation.capabilities` and `documentation.help` skills when requested by commands, (4) answer questions about available component types, agents, standards, and commands, (5) validate registry schema on install/update. Referenced by `sdd.md`, `sdd-help.md`, `component-discovery`, `planning`, and other core skills that need registry data. |

**Templates split:**

The `project-scaffolding/templates/project/` directory currently generates project files that hardcode the tech stack (`CLAUDE.md` lists "Node.js 20, React 19, PostgreSQL 15, Helm", `README.md` describes tech-specific directory structure). These must be split:

| Template | Stays in Core | Moves to Tech Pack |
|---|---|---|
| `CLAUDE.md` (project) | Generic SDD rules (commit style, spec-driven workflow, component structure) | Tech stack section (languages, frameworks, architecture patterns), component type→standards mapping |
| `README.md` (project) | Generic project description, SDD workflow reference | Tech-specific directory structure, tech stack badges, framework-specific getting started |
| `package.json` (project) | — | **Entirely tech-pack-specific** (npm workspaces, Node.js scripts) |

Core's project scaffolding invokes the tech pack's template contribution after generating the generic base. The tech pack declares a `project_templates` path in the registry.

**Commands that need tech-specific content removed:**

| File | Current Issue | Fix |
|---|---|---|
| `sdd.md` | Common Mappings table hardcodes tech pack commands (`config generate`, `local-env create`, `database setup`) | Remove tech-specific mappings. Reference `techpacks` skill, which loads `documentation.capabilities` from active tech packs. |
| `sdd-help.md` | "SDD currently scaffolds Node.js/TypeScript backends, React/TypeScript frontends, PostgreSQL databases..." | Replace with generic text. Reference `techpacks` skill, which loads `documentation.help` from active tech packs. |
| `sdd-run.md` | `--spec <path>` flag defaults to `components/<component>/openapi.yaml` | Remove OpenAPI-specific default. Tech pack provides defaults via registry. |

**System CLI commands that move to tech pack:**

| Command | Reason |
|---|---|
| `env/check-tools.ts` | Checks for Node.js, npm, kubectl, helm — tech-specific tool requirements |
| `env/deploy.ts` | Kubernetes/Helm deployment — entirely tech-specific |

**Removed entirely:**

| Directory | Reason |
|---|---|
| `plugin/hooks/` | Hooks (`validate-write`, `prompt-commit`, `hook-runner.sh`, `hooks.json`, permissions files) are removed. The hook system CLI command (`hook/`) is also removed. These hooks hardcoded tech-specific safe directories and may not work reliably. |

Skills that move to the tech pack:

| Skill | Reason |
|---|---|
| `config-orchestration` | Config management is tech-specific |
| `local-env-orchestration` | Kubernetes local environments are tech-specific |

When core loads a tech pack skill at an integration point, it must explicitly attribute it:

```
Loading tech pack skill: standards-router
  Tech pack: fs-ts (fullstack-typescript)
  Integration point: standards_router
  Path: <resolved-path>/skills/standards-router/SKILL.md
```

### 6. Tech Pack Skill Changes

Tech pack skills that reference core skills must do so through declared `requires_core` dependencies:

- Remove all `commit-standards` references from `cicd-standards` (cicd-standards does not depend on core)
- `typescript-standards`, `unit-testing`, `integration-testing-standards`, `e2e-testing-standards` move to tech pack — all internal references stay within the pack
- Agents stop declaring `skills:` in frontmatter that reference core skills — core loads the appropriate skills via integration points
- All `system-run.sh` references change to use the tech pack's own system binary

### 7. Tech Pack Management Commands

Core gains a `tech-pack` command namespace in the system CLI:

| System Command | Purpose |
|---|---|
| `tech-pack validate <path>` | Parse and validate `techpack.yaml` at the given path. Checks: required fields present, integration point names are valid, referenced skill paths exist, dependency graph is a valid DAG, namespace is valid. Returns structured validation result. |
| `tech-pack info <namespace>` | Read a tech pack's registry and return structured data: name, version, component types, lifecycle integration points, documentation paths. Used by the `techpacks` skill. |
| `tech-pack list` | List all installed tech packs with namespace, version, mode (internal/external), component count. |
| `tech-pack install <path>` | Register an external tech pack: validate its registry, build its system CLI, add to `sdd-settings.yaml` under `tech_packs`. |
| `tech-pack remove <namespace>` | Unregister a tech pack: remove from `sdd-settings.yaml`, warn if components are still configured. |

Exposed through `sdd-run`:

```
sdd-run tech-pack validate <path>
sdd-run tech-pack info <namespace>
sdd-run tech-pack list
sdd-run tech-pack install <path>
sdd-run tech-pack remove <namespace>
```

`sdd-run` command routing becomes three tiers:

1. **Core orchestrated** → core skills (`change`, `init`, `version`)
2. **Core pass-through** → core system (`permissions`, `tech-pack`)
3. **`<namespace> *`** → tech pack orchestrator. Core reads the registry, finds the tech pack by namespace, and delegates everything after the namespace to the tech pack's single orchestrator entry point. The tech pack handles all internal routing. Example: `sdd-run fs-ts database setup main-db` → core invokes the fs-ts orchestrator with args `database setup main-db`

## Open Questions (Resolve During Planning)

### OQ-1: CLI Build Architecture

Two separate system directories each need their own `package.json`, `tsconfig.json`, and build step. Both need shared utilities (logger, path resolution, settings reader). Options:

- **a)** npm workspace with a shared `@sdd/system-lib` package
- **b)** Each system duplicates the shared code
- **c)** Tech system depends on core system as a build dependency

### OQ-2: Template Path Resolution

Scaffolding specs reference template paths like `components/backend/backend-scaffolding/templates`. After the split, these templates live in the tech pack directory. How do paths resolve?

- **a)** Relative to tech pack root (tech skills provide full path)
- **b)** Core scaffolding engine receives a base path from the registry and resolves relative to it

### OQ-3: Settings Reconciliation Handoff

Core validates the base `TechPackSettings` schema. Tech pack validates component-specific `settings` fields. What's the mechanical handoff?

- **a)** Core validates base, then calls tech system's validation command
- **b)** Core validates base, tech pack provides a JSON schema that core uses
- **c)** Core validates base only, tech skills validate at usage time

### OQ-4: sdd-init Integration

How does `sdd-init` interact with tech packs?

- **a)** Auto-registers all internal tech packs during init
- **b)** Asks user which tech pack to activate during init
- **c)** Init only sets up core; tech pack registration is a separate step

### OQ-5: Existing Project Migration

Existing SDD projects have `sdd-settings.yaml` without a `tech_packs` namespace and components defined at the top level. How do they migrate?

- **a)** `sdd-init` detects the old format and auto-migrates (moves components under `tech_packs.fs-ts`)
- **b)** A one-time `sdd-run tech-pack migrate` command
- **c)** Core reads both old and new formats during a transition period

## Acceptance Criteria

- [ ] `plugin/core/` contains only SDD methodology files — no tech-specific names, agents, or standards — **verify:** `grep -r "backend-dev\|frontend-dev\|CMDO\|MVVM\|postgresql\|React\|Node.js" plugin/core/` returns zero matches
- [ ] `plugin/fullstack-typescript/` contains all tech-specific files — **verify:** `ls plugin/fullstack-typescript/agents/ plugin/fullstack-typescript/skills/components/` shows all 7 agents and all component skill directories
- [ ] `techpack.yaml` exists and is valid — **verify:** `plugin/core/system/system-run.sh tech-pack validate plugin/fullstack-typescript` passes with no errors
- [ ] Core planning skill reads from registry, not hardcoded tables — **verify:** `grep -c "backend-dev\|frontend-dev\|api-designer" plugin/core/skills/planning/SKILL.md` returns 0
- [ ] Inter-system protocol works — **verify:** `plugin/core/system/system-run.sh fs-ts database --help` routes to tech system and returns usage text
- [ ] Tech system abstracts core — **verify:** `grep -r "core/system" plugin/fullstack-typescript/skills/` returns zero matches (tech skills never reference core's system)
- [ ] Settings namespace works — **verify:** `npm test` passes with updated settings schema including `tech_packs` key
- [ ] Single plugin manifest — **verify:** `cat plugin/.claude-plugin/plugin.json` lists skills from both `core/` and `fullstack-typescript/`
- [ ] No soft cross-boundary references — **verify:** every skill name referenced in core traces to a registry integration point, not a hardcoded name
- [ ] `techpacks` skill works — **verify:** invoking `tech-pack info fs-ts` returns component list, lifecycle integration points, and documentation paths
- [ ] `tech-pack validate` catches errors — **verify:** a malformed registry (missing required field) returns a clear validation error
- [ ] Zero functionality loss — **verify:** every command, skill, agent, and system CLI command that existed before the split still works after. Create a pre-split inventory (`find plugin/ -name "*.md" -o -name "*.ts" | sort`) and verify every capability is present in either `core/` or `fullstack-typescript/`
- [ ] `npm run build:plugin` succeeds — **verify:** builds both core and tech system CLIs without errors
- [ ] `npm run typecheck:plugin` passes — **verify:** type checking passes for both system directories
- [ ] Existing tests pass — **verify:** `npm test` passes
