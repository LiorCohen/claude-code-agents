---
id: 158
title: Split plugin into core/ and fullstack-typescript/ subdirectories
status: planning
created: 2026-02-22 12:00 UTC
depends_on: []
blocks: []
---

# Task 158: Split plugin into core/ and fullstack-typescript/ subdirectories

## Description

Split the plugin directory into two subdirectories that separate the SDD methodology from the tech stack implementation:

- `plugin/core/` — Core SDD methodology (tech-agnostic). Defines the spec-driven development lifecycle, commands, and integration points that tech packs fill.
- `plugin/fullstack-typescript/` — Fullstack TypeScript tech pack (Node.js/CMDO, React/MVVM, PostgreSQL, OpenAPI, Helm). Provides agents, standards, scaffolding skills, and a system CLI for this specific stack.

Core defines a **tech pack manifest contract** — a set of integration points that tech packs implement. Core never hardcodes tech-pack-specific names (no agent names, no standards names, no component type names). Everything is discovered from the manifest at runtime.

Tech packs can be **internal** (inside the plugin directory, shipped with the plugin) or **external** (in the user's project or elsewhere, installed separately via `sdd-run tech-pack install`).

## Glossary

| Term | Definition |
|---|---|
| **Plugin** | A Claude Code plugin — a directory containing a `plugin.json` file that registers commands, skills, and agents for Claude to use. |
| **Command** | A markdown file (`.md`) registered in `plugin.json` that defines a user-invocable `/slash-command`. Commands orchestrate skills. |
| **Skill** | A markdown file (`SKILL.md`) with optional schemas that provides domain knowledge or step-by-step instructions to Claude. Skills are invoked by commands, agents, or other skills — not directly by users. |
| **Agent** | A markdown file (`.md`) registered in `plugin.json` that defines a specialized persona with specific skills and constraints. Agents are assigned to components during planning and implementation phases. |
| **Standards skill** | A skill that defines coding conventions, architecture patterns, and best practices for a specific domain (e.g., `backend-standards` defines CMDO architecture rules). |
| **Scaffolding skill** | A skill that defines the file structure and templates for creating a new component instance. |
| **Skills router** | A tech pack skill that is the single entry point for all tech pack skill loading. Contains a mapping table of contexts (component types, lifecycle phases, agent contexts) to specific skills. Core loads this whenever it needs tech-pack-specific knowledge. Declared in the manifest as `skills.router`. |
| **Command router** | A tech pack skill that receives all `sdd-run <namespace> *` commands and dispatches them internally. Declared in the manifest as `commands.router`. |
| **Orchestrator** | A skill that coordinates multi-step workflows by invoking other skills and system commands in sequence (e.g., `config-orchestration`, `local-env-orchestration`). |
| **System CLI** (`system-run.sh`) | A shell entrypoint to a TypeScript CLI binary for deterministic, performance-sensitive operations (scaffolding, settings I/O, spec parsing, workflow state management). Skills can do these things directly but non-deterministically and slowly — the system CLI provides fast, reliable execution. Skills invoke it via `system-run.sh <command> [args]`. |
| **`plugin.json`** | The Claude Code plugin configuration file — declares which commands, skills, and agents the plugin provides, with paths to each file. Not to be confused with `techpack.yaml` (the tech pack manifest). |
| **`sdd-settings.yaml`** | Core-owned per-project configuration at `sdd/sdd-settings.yaml`. Stores project name, SDD version, installed tech packs, and a minimal component list (name, type, directory). Tech-specific component details live in separate tech pack settings files (`sdd/<namespace>-settings.yaml`). |
| **Tech pack manifest** (`techpack.yaml`) | A static declaration file at the tech pack root that tells core what the tech pack offers — component types, agents, scaffolding skills, command and skills routers, documentation skills, and lifecycle integration points. |
| **Tech pack** | A self-contained directory providing agents, standards, scaffolding skills, templates, and a system CLI for a specific technology stack. Fills integration points declared in the tech pack manifest (`techpack.yaml`). |
| **Integration point** | A named slot in the manifest contract that core reads at runtime to discover tech-pack-provided capabilities (e.g., `components.server.agent` → which agent handles server components). |

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
- Tech pack manifest contract (`techpack.yaml`) — schema and integration points
- Inter-system CLI protocol (facade pattern, namespaced commands)
- Settings namespace (`tech_packs.fs-ts` in `sdd-settings.yaml`)
- Core integration points (planning, verification, testing — per-component and lifecycle-level)
- Core system CLI changes (tech-pack routing, `tech-pack install|list|remove` commands)
- Tech pack system CLI (own binary, abstracts core commands behind own API)
- Update `plugin.json` paths
- Update all internal references (skill paths, system-run.sh paths, template paths)

### Out of scope

- Creating a second tech pack (validates the architecture but not part of this task)
- External tech pack installation workflow (design the interface, implement internal only)
- Splitting into separate repositories or npm packages
- Changing the SDD lifecycle itself
- User-facing UX changes to `/sdd`, `/sdd-run`, `/sdd-help` (routing changes are internal)

## Constraints

- **Single plugin.** One `plugin.json` file. Only `core/` artifacts (commands, skills) are registered in it. Tech pack artifacts are not registered in plugin.json — they are loaded dynamically at runtime via the techpacks. This applies equally to internal and external tech packs.
- **No soft references.** All cross-boundary references are declared in the tech pack manifest. No casual "delegate to backend-standards" in prose — every reference traces to a manifest entry.
- **Explicit integration point attribution.** When core loads a tech pack skill, it explicitly indicates which tech pack, which integration point, and which skill file is being used.
- **Core assumes nothing about the user project's directory structure** aside from the `sdd/` directory and the root `CLAUDE.md` file. All directory conventions (`components/servers/`, `components/config/`, etc.) are tech pack knowledge, declared via `directory_pattern` in the manifest.
- **Zero functionality loss, except where explicitly removed.** Every command, skill, agent, standard, scaffolding template, plan template, and system CLI command that exists before the split must exist and work identically after — unless explicitly listed in the "Removed entirely" section of the Changes. The hook system (`plugin/hooks/`) is the only intentional removal: it hardcoded tech-specific safe directories and is superseded by Claude Code's native permission system. All other capabilities must be preserved. A pre-split inventory must be created and verified against the post-split result.
- **Backward compatibility.** Existing SDD projects must continue to work after migration. Two migrations are required: (1) `.sdd/` → `sdd/` directory rename (v8.0.0 breaking change), (2) `sdd-settings.yaml` gains a `tech_packs` namespace. The system CLI `sdd-migrate` command handles both. See OQ-5 for migration scope.
- **Build rules.** Each system directory has its own `package.json`, `tsconfig.json`, and build step. Root `package.json` scripts must continue to work.
- **Test coverage for both systems.** Tests must cover both core and tech system CLIs. `npm test` runs all tests across both systems.
- **Single entry point.** All core→tech-pack interactions flow through the `techpacks` skill. No other core file reads `techpack.yaml` directly, resolves tech pack paths, or loads tech pack skills on its own. The `techpacks` skill is the only place that imports/reads tech pack artifacts.

### Techpacks Skill — Single Entry Point

Every interaction between core and a tech pack is funneled through the `techpacks` core skill, which exposes a finite set of typed operations. It is not a separate module or binary — it's a set of instructions in the `techpacks` skill that other core skills load when they need tech pack data or artifacts. Some operations delegate to the core system CLI (e.g., `agent frontmatter`, `log`, `tech-pack validate`), but the orchestration lives in the skill. This makes all touch points greppable, auditable, and validatable.

**Operations (exhaustive list):**

| Operation | Purpose | Returns |
|---|---|---|
| `techpacks.readManifest(namespace)` | Parse and return validated `techpack.yaml` | Typed manifest object |
| `techpacks.resolvePath(namespace, path)` | Resolve a relative path from manifest to absolute path | Absolute file path |
| `techpacks.loadSkill(namespace, skillPath, context)` | Load a tech pack skill into Claude's context with attribution | Skill content + attribution block |
| `techpacks.loadAgent(namespace, agentRef)` | Read agent file, parse frontmatter, resolve skills, spawn as Task subagent | Task subagent with composed prompt |
| `techpacks.routeCommand(namespace, command, args)` | Validate command against `commands.available`, load command router | Router skill content + context block |
| `techpacks.routeSkills(namespace, context)` | Load skills router with structured context | Router skill content + context block |
| `techpacks.listComponents(namespace)` | Read component types from manifest | Component type list with metadata |
| `techpacks.dependencyOrder(namespace)` | Build and return topologically sorted dependency graph | Ordered component type list |

**Agent loading via `techpacks.loadAgent`:**

Agents are loaded through `techpacks` as Task subagents. This is a universal mechanism that works identically for internal and external tech packs.

**Prompt isolation guarantee:** The agent's markdown body and resolved skill contents NEVER enter the main conversation context. The main context only receives structured frontmatter metadata (name, model, tools, skills list) via a system CLI call — enough for orchestration decisions but no prompt leakage. The subagent self-bootstraps by reading its own agent file and skill files.

The `techpacks` skill:

1. Calls `system-run.sh agent frontmatter <agent-path>` — the system CLI reads the agent `.md` file, parses YAML frontmatter, and returns ONLY the structured metadata as JSON: `{"name", "model", "tools", "skills": [...]}`. The agent's markdown body is never returned to the main context.
2. Resolves skill paths — maps each skill name from the frontmatter `skills` list to its absolute file path using the manifest. This is path resolution only (string manipulation from manifest data), not file reading.
3. Logs attribution via `system-run.sh log` before spawning.
4. Spawns a Task subagent with a bootstrap prompt and the specified `model`. The bootstrap prompt instructs the subagent to read and follow the agent file, and to load the resolved skill files:

   ```
   You are a tech pack agent. Read and follow your instructions from:
     Agent: <agent-path>
     Skills: <skill-path-1>, <skill-path-2>, ...

   Read the agent file first, then read each skill file. Follow all
   instructions from the agent file. The skill files provide domain
   knowledge and standards you must follow.
   ```

5. The subagent reads the agent `.md` file and skill files itself — these contents exist only in the subagent's context, never in the main conversation.

Core reads agent names via `techpacks.readManifest` (`components.*.agent.name`, `lifecycle.*.agent.name`) during planning and writes them into plans. During implementation, core invokes `techpacks.loadAgent` with the agent ref to spawn the subagent.

**Enforcement rules:**

1. **Grep-auditable.** Every tech pack interaction in core must call `techpacks.*`. Running `grep -r "techpacks\." core/` produces the complete list of touch points.
2. **No direct reads.** Core skills and system commands never read `techpack.yaml`, tech pack skill files, or tech pack agent files directly. They always go through `techpacks`.
3. **Agent prompt isolation.** Agent markdown bodies and resolved skill contents must NEVER appear in the main conversation context. `techpacks` uses `system-run.sh agent frontmatter` to extract only structured metadata — it never reads the agent file directly. The subagent self-bootstraps by reading its own files. This prevents prompt pollution and keeps the main context focused on orchestration.
4. **Attribution and logging on every load.** Every tech pack artifact load is both attributed in context and logged to disk via `system-run.sh log`. This dual mechanism enables runtime coverage verification (see Skill Coverage Matrix in Acceptance Criteria).
   - **Skills** (`loadSkill`, `routeSkills`, `routeCommand`): emit an attribution block into Claude's context AND write a structured log entry:
     ```
     [TECH PACK SKILL]
       Tech pack: fs-ts (fullstack-typescript)
       Integration point: components.server.scaffolding
       Path: <resolved-path>
     ```
     ```
     system-run.sh log --level info --source techpacks.loadSkill \
       --message "Loading tech pack skill" \
       --data '{"tech_pack":"fs-ts","skill":"backend-standards","integration_point":"components.server.standards","path":"<resolved-path>"}'
     ```
   - **Agents** (`loadAgent`): write a structured log entry via `system-run.sh log` before spawning. The subagent runs in its own isolated context and doesn't see the attribution:
     ```
     system-run.sh log --level info --source techpacks.loadAgent \
       --message "Spawning tech pack agent" \
       --data '{"tech_pack":"fs-ts","agent":"backend-dev","integration_point":"components.server.agent","path":"<resolved-path>"}'
     ```
5. **Validation at registration.** Tech packs are validated when registered — during `sdd-run init` (internal tech packs) or `tech-pack install` (future, external). Validation parses the manifest, checks referenced paths exist, validates dependency graphs are acyclic, and verifies schema compliance. If validation fails, the tech pack is not registered. After successful registration, core trusts the manifest. Explicit re-validation available via `system-run.sh tech-pack validate`.
6. **Typed operations.** `techpacks` exposes only the operations listed above. Adding a new interaction type requires extending `techpacks` — no backdoors.

**Core files that use `techpacks` (expected list):**

| Core File | Gateway Operations Used |
|---|---|
| `techpacks` skill | `readManifest`, `listComponents`, `resolvePath`, `loadSkill` |
| `planning` skill | `readManifest` (agent names), `routeSkills`, `dependencyOrder` |
| `project-scaffolding` skill | `routeSkills`, `resolvePath` |
| `tech-discovery` skill | `routeSkills` |
| `change-creation` skill | `readManifest` (agent names), `routeSkills`, `dependencyOrder` |
| `change-orchestration/verification` skill | `loadAgent`, `routeSkills` |
| `change-orchestration/implementation` skill | `loadAgent`, `routeSkills` |
| `init-orchestration` skill | `routeCommand` |
| `sdd.md` command | `loadSkill` (documentation.capabilities) |
| `sdd-help.md` command | `loadSkill` (documentation.help) |
| `sdd-run.md` command | `routeCommand` |
| Core system CLI | `readManifest` |

## Changes

### 1. Tech Pack Manifest Contract

Tech packs provide a `techpack.yaml` at their root declaring everything they offer:

```yaml
tech_pack:
  name: fullstack-typescript
  namespace: fs-ts
  description: >
    Production-ready fullstack TypeScript stack. Node.js backends
    with CMDO architecture, React frontends with MVVM, PostgreSQL
    databases, OpenAPI contracts with generated types, Kubernetes
    deployment via Helm, and CI/CD through GitHub Actions.
  version: "1.0.0"
  min_sdd_version: "8.0.0"
  system_path: ./system/system-run.sh

components:

  config:
    description: >
      Centralized YAML configuration for the project. Mandatory singleton
      that all other components read from. Generates environment-specific
      config files from a single source of truth.
    directory_pattern: components/config/
    depends_on: []
    scaffolding: skills/components/config/config-scaffolding/SKILL.md

  contract:
    description: >
      OpenAPI 3.x specifications that define the API surface between
      frontend and backend. Generates TypeScript types, request/response
      validators, and API client code from the spec.
    directory_pattern: "components/contracts/{name}/"
    depends_on: [config]
    scaffolding: skills/components/contract/contract-scaffolding/SKILL.md
    agent:
      name: api-designer
      path: agents/api-designer.md

  database:
    description: >
      PostgreSQL database with versioned migrations, seed data, and
      a data access layer. Manages schema evolution through sequential
      migration files and provides typed query functions.
    directory_pattern: "components/databases/{name}/"
    depends_on: [config]
    scaffolding: skills/components/database/database-scaffolding/SKILL.md
    agent:
      name: db-advisor
      path: agents/db-advisor.md

  server:
    description: >
      Node.js/TypeScript backend following CMDO architecture
      (Controller → Model → DAL → Orchestrator). Exposes HTTP APIs
      defined by contracts, connects to databases, and runs
      background workers.
    directory_pattern: "components/servers/{name}/"
    depends_on: [contract, config, database]
    scaffolding: skills/components/backend/backend-scaffolding/SKILL.md
    agent:
      name: backend-dev
      path: agents/backend-dev.md

  webapp:
    description: >
      React/TypeScript frontend following MVVM architecture
      (View → ViewModel → Model). Consumes contracts for type-safe
      API calls via TanStack Query and renders UI with a component
      library.
    directory_pattern: "components/webapps/{name}/"
    depends_on: [contract]
    scaffolding: skills/components/frontend/frontend-scaffolding/SKILL.md
    agent:
      name: frontend-dev
      path: agents/frontend-dev.md

  helm:
    description: >
      Kubernetes Helm charts that package servers and webapps for
      deployment. Defines services, deployments, ingress rules,
      config maps, and secrets. Supports local dev (minikube/kind)
      and production clusters.
    directory_pattern: "components/helm_charts/{name}/"
    depends_on: [server, webapp]
    scaffolding: skills/components/helm/helm-scaffolding/SKILL.md
    agent:
      name: devops
      path: agents/devops.md

  integration-testing:
    description: >
      Integration test suites that verify component interactions
      against real dependencies (databases, APIs). Runs via Vitest
      with Testkube for Kubernetes-native execution.
    directory_pattern: "components/testing/integration/{name}/"
    depends_on: [contract, server, database, helm]
    scaffolding: skills/components/integration-testing/integration-testing-scaffolding/SKILL.md
    agent:
      name: tester
      path: agents/tester.md

  e2e-testing:
    description: >
      End-to-end test suites that verify complete user workflows
      through the browser. Runs via Playwright with Testkube for
      Kubernetes-native execution against a running stack.
    directory_pattern: "components/testing/e2e/{name}/"
    depends_on: [server, webapp, database, helm]
    scaffolding: skills/components/e2e-testing/e2e-testing-scaffolding/SKILL.md
    agent:
      name: tester
      path: agents/tester.md

  cicd:
    description: >
      CI/CD pipeline definitions for GitHub Actions. Automates
      build, test, lint, and deploy workflows. Depends on Helm
      charts for deployment stages.
    directory_pattern: "components/cicds/{name}/"
    depends_on: [helm]
    scaffolding: skills/components/cicd/cicd-scaffolding/SKILL.md
    agent:
      name: devops
      path: agents/devops.md

# --- Commands ---
# Tech-pack-specific CLI commands, routed via sdd-run <namespace> <command>.
# Core validates command names against `available` before dispatching to the router.
#
# user_facing: true  — exposed via sdd-run, shown in help and autocomplete.
# user_facing: false — internal, invoked by skills via system-run.sh only.

commands:
  router: skills/command-router/SKILL.md
  available:

    # config
    - name: config generate
      description: "Generate merged config file for a target environment"
      user_facing: false
      args:
        env:
          type: string
          mandatory: true
          description: "Target environment (e.g., local, staging, production)"
        component:
          type: string
          mandatory: false
          description: "Extract config for a single component"
        output:
          type: string
          mandatory: false
          description: "Write output to file path instead of stdout"

    - name: config validate
      description: "Validate config files against JSON schema"
      user_facing: false
      args:
        env:
          type: string
          mandatory: false
          description: "Validate a specific environment (default: all)"

    - name: config add-env
      description: "Add a new environment configuration"
      user_facing: true
      args:
        env_name:
          type: string
          mandatory: true
          description: "Environment name (e.g., staging, production)"

    - name: config diff
      description: "Show differences between two environment configs"
      user_facing: true
      args:
        env_a:
          type: string
          mandatory: true
          description: "First environment to compare"
        env_b:
          type: string
          mandatory: true
          description: "Second environment to compare"

    # contract
    - name: contract generate-types
      description: "Generate TypeScript types from OpenAPI spec"
      user_facing: false
      args:
        name:
          type: string
          mandatory: true
          description: "Contract component name"

    - name: contract validate
      description: "Validate OpenAPI spec for correctness"
      user_facing: false
      args:
        name:
          type: string
          mandatory: true
          description: "Contract component name"

    # database
    - name: database setup
      description: "Initialize database schema, run migrations, and seed"
      user_facing: true
      args:
        name:
          type: string
          mandatory: true
          description: "Database component name"
        env:
          type: string
          mandatory: false
          default: local
          description: "Target environment"

    - name: database migrate
      description: "Run pending database migrations"
      user_facing: false
      args:
        name:
          type: string
          mandatory: true
          description: "Database component name"
        env:
          type: string
          mandatory: false
          default: local
          description: "Target environment"

    - name: database seed
      description: "Populate database with seed data"
      user_facing: false
      args:
        name:
          type: string
          mandatory: true
          description: "Database component name"
        env:
          type: string
          mandatory: false
          default: local
          description: "Target environment"

    - name: database reset
      description: "Drop and recreate database from scratch"
      user_facing: true
      args:
        name:
          type: string
          mandatory: true
          description: "Database component name"
        env:
          type: string
          mandatory: false
          default: local
          description: "Target environment"

    - name: database teardown
      description: "Remove database and all associated resources"
      user_facing: true
      args:
        name:
          type: string
          mandatory: true
          description: "Database component name"
        env:
          type: string
          mandatory: false
          default: local
          description: "Target environment"

    - name: database psql
      description: "Open interactive PostgreSQL shell"
      user_facing: true
      args:
        name:
          type: string
          mandatory: true
          description: "Database component name"
        env:
          type: string
          mandatory: false
          default: local
          description: "Target environment"

    - name: database port-forward
      description: "Forward local port to database pod in Kubernetes"
      user_facing: true
      args:
        name:
          type: string
          mandatory: true
          description: "Database component name"
        env:
          type: string
          mandatory: false
          default: local
          description: "Target environment"

    # local-env
    - name: local-env check-tools
      description: "Verify required toolchain is installed (node, npm, kubectl, helm)"
      user_facing: true

    - name: local-env create
      description: "Create local Kubernetes cluster for development"
      user_facing: true

    - name: local-env destroy
      description: "Remove local Kubernetes cluster and all resources"
      user_facing: true

    - name: local-env start
      description: "Start a stopped local Kubernetes cluster"
      user_facing: true

    - name: local-env stop
      description: "Stop the local Kubernetes cluster without destroying it"
      user_facing: true

    - name: local-env status
      description: "Show status of local cluster, pods, and services"
      user_facing: true

    - name: local-env restart
      description: "Restart the local Kubernetes cluster"
      user_facing: true

    - name: local-env deploy
      description: "Deploy application to Kubernetes via Helm charts"
      user_facing: true

    - name: local-env undeploy
      description: "Remove deployed application from Kubernetes"
      user_facing: true

    - name: local-env forward
      description: "Forward local ports to running services"
      user_facing: true

    - name: local-env config
      description: "Show or update local environment configuration"
      user_facing: true

    - name: local-env infra
      description: "Manage infrastructure components (ingress, cert-manager)"
      user_facing: true

# --- Skills ---
# Single entry point for all tech pack skill loading. Core loads the
# skills router with a structured context (phase, component_type, agent)
# and the router maps it to the minimal set of relevant skills.

skills:
  router: skills/skills-router/SKILL.md

# --- Lifecycle ---
# Agents assigned to cross-cutting lifecycle phases. Core reads these
# during verification (code review) and testing (test execution).

lifecycle:
  verification:
    agent:
      name: reviewer
      path: agents/reviewer.md
  testing:
    agent:
      name: tester
      path: agents/tester.md

# --- Documentation ---
# Skills loaded into context when core commands need tech-pack-specific
# knowledge for user-facing help and intent-to-command mapping.

documentation:
  capabilities: skills/capabilities/SKILL.md
  help: skills/help-content/SKILL.md
```

**Core defines the integration points** that tech packs can fill:

| Integration Point | Scope | When Core Uses It |
|---|---|---|
| `components.*.description` | Per-component | Discovery phase — displayed to user when listing available component types |
| `components.*.directory_pattern` | Per-component | Path resolution — core resolves `{name}` to get the component's directory in the user project |
| `components.*.scaffolding` | Per-component (required) | Scaffolding phase — invokes the skill to create file structure |
| `components.*.agent` | Per-component | Plan generation — assigns agent to component phase |
| `documentation.capabilities` | Tech-pack-level | `/sdd` command — loaded into context so core can map natural language to tech pack commands (e.g., "set up my database" → `fs-ts database setup`) |
| `documentation.help` | Tech-pack-level | `/sdd-help` command — loaded into context to display tech-pack-specific help (available commands, stack description, getting started) |
| `skills.router` | Tech-pack-level | **Single entry point for all tech pack skill loading.** Core loads this skill with a structured context block (phase, component_type, agent). The router maps context to specific skills. See **Skills router contract** below for required sections and invocation format. |
| `lifecycle.verification.agent` | Tech-pack-level | Review phase — assigns the reviewer agent |
| `lifecycle.testing.agent` | Tech-pack-level | Testing phase — assigns the tester agent |
| `commands.router` | Tech-pack-level | `sdd-run <namespace> *` routing — core validates the command name against `commands.available`, then loads this skill with a structured context block (command, args, namespace). See **Command router contract** below for required sections and invocation format. |
| `commands.available` | Tech-pack-level | Command manifest — core reads this to display help text, validate command names, and provide autocomplete for tech pack commands |
| `components.*.depends_on` | Per-component | Plan generation and scaffolding order — core builds the DAG from per-component `depends_on` arrays to determine build order and validate dependency references |

**Manifest field requirements:**

| Field | Required | Notes |
|---|---|---|
| `tech_pack.*` | Yes | All tech pack metadata fields (name, namespace, version, min_sdd_version, system_path) |
| `components.*.description` | Yes | Core displays this during component discovery |
| `components.*.directory_pattern` | Yes | Core needs this for all path resolution |
| `components.*.scaffolding` | Yes | Every component must declare a scaffolding skill |
| `components.*.agent` | No | Components without an agent won't have one assigned during planning |
| `documentation.capabilities` | No | If absent, `/sdd` won't show tech-pack-specific command mappings |
| `documentation.help` | No | If absent, `/sdd-help` won't show tech-pack-specific help |
| `skills.router` | Yes | Single entry point for all tech pack skill loading — prevents Claude from loading all skills at once |
| `lifecycle.*` | No | If absent, lifecycle phases use no tech-pack-specific agents |
| `commands.router` | Yes | Required for `sdd-run <namespace> *` command routing |
| `commands.available` | Yes | Core needs this for help, validation, and autocomplete |
| `components.*.depends_on` | Yes | Core builds dependency DAG from these arrays |

**Router contracts:**

Both routers follow a defined contract between core and the tech pack. Core provides structured context when invoking a router; the router skill must contain specific sections that fulfill the contract.

**Skills router contract (`skills.router`):**

Core invokes the skills router by loading it into Claude's context with a structured context block:

```
SKILLS ROUTER CONTEXT:
  phase: <project-scaffolding|plan-generation|implementation|verification|testing>
  component_type: <server|webapp|database|...>    # if applicable
  component_name: <name>                           # if applicable
  agent: <agent-name>                              # if applicable
```

The skills router SKILL.md must contain:

| Required Section | Purpose |
|---|---|
| **Component Standards Table** | Maps `component_type` → list of skills to load (e.g., `server` → `backend-standards`, `typescript-standards`) |
| **Phase Skills Table** | Maps `phase` → list of skills to load (e.g., `planning` → `planning-standards`, `project-scaffolding` → project template skill, `plan-generation` → plan template skill) |
| **Agent Context Table** | Maps `agent` → list of internal skills to load (e.g., `db-advisor` → `postgresql/`) |
| **Loading Instructions** | Explicit instructions for Claude: "Load ONLY the skills matching the provided context. Do NOT load all skills." |

Each table entry contains relative paths to the skill files within the tech pack. Claude reads the router, matches the context, and loads only the relevant subset.

**Command router contract (`commands.router`):**

Core invokes the command router by loading it into Claude's context with a structured context block:

```
COMMAND ROUTER CONTEXT:
  command: <command-name>          # e.g., "database setup"
  args:                            # named arguments only (no positional)
    name: main-db
    env: local
  namespace: <tech-pack-namespace> # e.g., "fs-ts"
```

The command router SKILL.md must contain:

| Required Section | Purpose |
|---|---|
| **Dispatch Table** | Maps `command` → skill or system action to invoke (e.g., `config generate` → `skills/orchestrators/config-orchestration/SKILL.md`, `database setup` → `system-run.sh database setup`, `local-env check-tools` → `system-run.sh local-env check-tools`) |
| **Dispatch Instructions** | Explicit instructions for Claude: "Match the command against the dispatch table. Load the target skill or invoke the system command. Do NOT load unrelated skills." |

Core validates the command name against `commands.available` in the manifest *before* invoking the command router. The router can assume the command is valid.

### 2. Directory Structure

```
plugin/
├── .claude-plugin/
│   └── plugin.json                    # Core paths only (tech packs loaded via `techpacks`)
├── core/
│   ├── commands/
│   │   ├── sdd.md
│   │   ├── sdd-run.md
│   │   └── sdd-help.md
│   ├── skills/
│   │   ├── change-creation/
│   │   ├── commit-standards/
│   │   ├── tech-discovery/
│   │   ├── domain-population/
│   │   ├── external-spec-integration/
│   │   ├── planning/
│   │   ├── project-scaffolding/
│   │   ├── project-settings/
│   │   ├── spec-decomposition/
│   │   ├── spec-index/
│   │   ├── spec-solicitation/
│   │   ├── spec-writing/
│   │   ├── workflow-state/
│   │   ├── techpacks/                  # NEW: single entry point for all tech pack interactions — manifest I/O, skill/agent loading, command routing
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
│       │   │   ├── agent/             # NEW: frontmatter extraction for prompt isolation
│       │   │   ├── log/              # NEW: structured logging for prompt-layer operations
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
    │   ├── techpack-settings/             # component types, settings schema, directory patterns — replaces project-settings in agents
    │   ├── scaffolding/                 # scaffolding entry point — ordering, delegation table, directory patterns
    │   ├── component-discovery/         # internal: loaded via skills router during component discovery
    │   ├── capabilities/               # documentation.capabilities — /sdd intent mappings
    │   ├── help-content/               # documentation.help — /sdd-help tech pack section
    │   ├── planning-standards/         # internal: loaded via skills router during planning
    │   ├── skills-router/                 # skills.router — maps contexts to skills with loading instructions
    │   ├── typescript-standards/          # internal: loaded via skills router when TS code is involved
    │   ├── unit-testing/                  # internal: loaded via skills router or agents
    │   ├── command-router/                # commands.router — single entry point for sdd-run fs-ts *
    │   ├── orchestrators/
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
        │   │   └── local-env/         # all 21 env/ files — backs `sdd-run fs-ts local-env *`
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
  Core system reads the manifest and delegates tech-namespaced commands
  to the tech system (e.g., `core/system-run.sh fs-ts database setup --name main-db`
  → delegates to `fullstack-typescript/system/system-run.sh database setup --name main-db`).

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

DECLARED ACTIONS CONTRACT
  When a tech pack operation needs to modify core-owned state, it
  declares actions. Core processes these after the operation
  completes successfully. This applies to both transport mechanisms:

  System CLI → system CLI (stdout JSON):
  {
    "result": { ... },               // tech-specific output
    "actions": [                      // optional, core processes these
      { "action": "register_component", "name": "main-db", "type": "database", "directory": "components/databases/main-db" },
      { "action": "unregister_component", "name": "main-db" }
    ]
  }

  Skill → core (prompt-layer structured block):
  Tech pack skills that need core state changes output a declared
  actions block in the same JSON format:

  [DECLARED ACTIONS]
  [{"action": "register_component", "name": "main-db", "type": "database", "directory": "components/databases/main-db"}]

  The calling core skill (or the `techpacks` skill) recognizes this
  block and invokes core's system CLI to process the actions.

  Same action types, same format, different transport. Tech pack
  never writes core state directly — it declares intent, core executes.
  If no actions are declared, core takes no additional action.

  FAILURE AND RECONCILIATION
  If the tech system succeeds but core fails to process declared
  actions, the two settings files may be out of sync. This is a
  known limitation — the user re-runs the command. Tech system
  writes are idempotent, so retrying is safe. No automatic
  reconciliation mechanism is provided.

SHARED STATE
  Filesystem only — no shared memory, no IPC.

  sdd/sdd-settings.yaml:
    Owner: core (read/write).
    Tech system: no direct access.
    Contains: project metadata, SDD version, installed tech packs
    list, and a minimal component manifest per tech pack (name,
    type, directory only — enough for planning and routing).
    When the tech system needs project metadata (e.g., project name
    for Kubernetes namespace naming), core passes it as args during
    delegation — the tech system never reads this file itself.

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
    components:                           # minimal manifest — written via declared actions
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

Core skills that currently hardcode tech-specific names must be rewritten to read from the manifest:

| Core Skill | Current Behavior | New Behavior |
|---|---|---|
| `project-settings` | Hardcoded type→directory mapping table (`server → components/servers/`), component type definitions | Split: core owns the settings *mechanism* (read/write `sdd-settings.yaml`, base schema validation). Type→directory mapping removed — core reads `components.*.directory_pattern` from manifest. Component type definitions removed — types come from manifest `components` keys. |
| `planning` | Hardcoded agent→component table, standards names | Reads `components.*.agent` from manifest for agent assignments. Standards loaded via skills router (not from manifest directly). |
| `change-creation` | Hardcoded dependency graph, agent assignments, plan templates reference CMDO/MVVM/TailwindCSS | Reads `components.*.depends_on` and `components.*.agent` from manifest. Plan templates split — generic structure stays in core, tech-specific phase descriptions loaded via skills router (`phase: plan-generation`). |
| `component-discovery` → `tech-discovery` | Hardcoded "Available Components" table with tech descriptions ("Node.js backend (CMDO)", "React frontend (MVVM)", "PostgreSQL", "Testkube") and scaffolding skill names | Renamed. Core keeps the discovery framework (process, questioning approach). Tech-specific content (component types, descriptions, discovery question sets) moves to tech pack's `component-discovery` skill, loaded via skills router (`phase: component-discovery`). |
| `project-scaffolding` | References tech scaffolding skills by name, hardcoded template source/dest paths, project templates (`CLAUDE.md`, `README.md`) hardcode entire tech stack | Reads `components.*.scaffolding` from manifest. Template paths resolved via tech pack. Project templates split (see Templates below). Scaffolding handoff flow: (1) core calls `techpacks.routeSkills` with `phase: project-scaffolding`, (2) tech pack's `scaffolding` skill loads — knows orchestration order and delegation table, (3) each component scaffolding skill builds a declarative JSON spec with absolute template paths within the tech pack, (4) Claude invokes core's `system-run.sh scaffolding apply --spec <path>`, (5) the engine executes the spec. Core's engine never needs to know where templates are — it follows the spec. |
| `init-orchestration` | Checks for `components/config/` as mandatory | Delegates prerequisite verification to tech pack via command router. Core does not check specific directories. |
| `change-orchestration/verification` | Hardcoded standards-per-component table with tech names | Reads `lifecycle.verification.agent` from manifest for reviewer agent. Standards loaded via skills router (not from manifest directly). |
| `change-orchestration/implementation` | Hardcoded agent names | Reads `components.*.agent` from manifest |
| `scaffolding` (router skill) | Hardcoded delegation table | **Split** — generic engine stays in core system CLI, tech-specific orchestration (ordering, delegation, directory patterns) moves to new tech pack `scaffolding` skill |

**Core skills with no changes needed:** `workflow-state`, `spec-index`, `spec-solicitation`, `spec-writing`, `domain-population`, `commit-standards`, `version-orchestration`. These are pure SDD methodology with no tech-specific references.

**Core skills with minor changes needed:** `external-spec-integration` (strip generic "Infrastructure / DevOps" category label from `resources/workflow-steps.md` line 228 — replace with tech-agnostic term like "Infrastructure"), `spec-decomposition` (strip "Infrastructure / DevOps last" from `resources/outline-modes.md` line 173 — replace with "Infrastructure last").

**New core skill:**

| Skill | Purpose |
|---|---|
| `techpacks` | Single point of contact for all tech pack knowledge in core. Responsibilities: (1) parse and validate `techpack.yaml` for installed tech packs (via `tech-pack validate` system command), (2) resolve integration points to concrete skill paths, (3) load tech pack `documentation.capabilities` and `documentation.help` skills when requested by commands, (4) answer questions about available component types, agents, standards, and commands, (5) validate manifest schema on install/update. Referenced by `sdd.md`, `sdd-help.md`, `tech-discovery`, `planning`, and other core skills that need manifest data. |

**Templates split:**

The `project-scaffolding/templates/project/` directory currently generates project files that hardcode the tech stack (`CLAUDE.md` lists "Node.js 20, React 19, PostgreSQL 15, Helm", `README.md` describes tech-specific directory structure). These must be split:

| Template | Stays in Core | Moves to Tech Pack |
|---|---|---|
| `CLAUDE.md` (project) | Generic SDD rules (commit style, spec-driven workflow, component structure) | Tech stack section (languages, frameworks, architecture patterns), component type→standards mapping |
| `README.md` (project) | Generic project description, SDD workflow reference | Tech-specific directory structure, tech stack badges, framework-specific getting started |
| `package.json` (project) | — | **Entirely tech-pack-specific** (npm workspaces, Node.js scripts) |

Core's project scaffolding invokes the skills router with `phase: project-scaffolding`, which routes to the tech pack's template contribution skill. The skill knows where its template files are and how to apply them.

**Commands that need tech-specific content removed:**

| File | Current Issue | Fix |
|---|---|---|
| `sdd.md` | Common Mappings table hardcodes tech pack commands (`config generate`, `local-env create`, `database setup`) | Remove tech-specific mappings. Reference `techpacks` skill, which loads `documentation.capabilities` from active tech packs. |
| `sdd-help.md` | "SDD currently scaffolds Node.js/TypeScript backends, React/TypeScript frontends, PostgreSQL databases..." | Replace with generic text. Reference `techpacks` skill, which loads `documentation.help` from active tech packs. |
| `sdd-run.md` | `--spec <path>` flag defaults to `components/<component>/openapi.yaml` | Remove OpenAPI-specific default. Tech pack provides defaults via manifest. |

**System CLI command directories that move to tech pack:**

| Directory | Files | Reason |
|---|---|---|
| `env/` → `local-env/` | 21 files (check-tools, config, create, deploy, destroy, forward, handler, index, infra, restart, schema, start, status, stop, types, undeploy + 4 provider files + provider index) | Kubernetes/minikube/kind local environment management — entirely tech-specific |
| `config/` | All files | YAML config generation and validation — tech-specific |
| `contract/` | All files | OpenAPI spec processing — tech-specific |
| `database/` | All files | PostgreSQL migrations and seed — tech-specific |

**Breaking change — project metadata directory rename:**

`.sdd/` → `sdd/` (hidden → visible). All project metadata files (`sdd-settings.yaml`, `<namespace>-settings.yaml`, `system-logs/`) move from `.sdd/` to `sdd/`. This is a v8.0.0 breaking change. Existing projects must rename the directory. The migration path is covered by OQ-5.

**Removed entirely:**

| Directory | Reason |
|---|---|
| `plugin/hooks/` | Hooks (`validate-write`, `prompt-commit`, `hook-runner.sh`, `hooks.json`, permissions files) are removed. The hook system CLI command (`hook/`) is also removed. These hooks hardcoded tech-specific safe directories and may not work reliably. |

Skills that move to the tech pack:

| Skill | Reason |
|---|---|
| `config-orchestration` | Config management is tech-specific |
| `local-env-orchestration` | Kubernetes local environments are tech-specific |

**Tech pack artifact loading (context isolation model):**

- **Skills** are loaded into Claude's main context with an inline attribution block (see Tech Pack Gateway Pattern, enforcement rule 4). Skills become part of the main conversation and are visible to the orchestrating agent.
- **Agents** are loaded via `techpacks.loadAgent` and spawned as **Task subagents** in a separate context. The main context receives only structured frontmatter metadata via `system-run.sh agent frontmatter` — it never reads the agent file directly. The subagent self-bootstraps: it receives a bootstrap prompt with paths to the agent file and resolved skill files, reads them itself, and follows the instructions. This ensures:
  - Agent instructions never enter the main conversation context (the system CLI extracts only metadata)
  - Resolved skill contents are scoped to the subagent that reads them
  - The main context stays focused on orchestration — it sees only agent name, model, tools, and skill names
  - Works identically for internal and external tech packs

  Core reads agent names via `techpacks.readManifest` (`components.*.agent.name`, `lifecycle.*.agent.name`) during planning and writes them into plans. During implementation, core invokes `techpacks.loadAgent` with the agent ref — the main context never reads the agent file directly.

### 6. Tech Pack Skill Changes

Tech pack skills never directly reference core skills. Core drives all interactions via integration points. Changes needed:

- Remove all `commit-standards` references from `cicd-standards` (cicd-standards is fully internal to the tech pack)
- `typescript-standards`, `unit-testing`, `integration-testing-standards`, `e2e-testing-standards` move to tech pack — all internal references stay within the pack
- Agent frontmatter `skills:` fields reference tech pack skills by name. `techpacks` resolves skill names to absolute paths using the manifest (string manipulation, no file reading), then passes those paths to the subagent's bootstrap prompt. The subagent reads and loads the skills itself — skill contents never enter the main context (see enforcement rule 3: prompt isolation). Agents must NOT reference core skills in frontmatter; core loads its own skills independently via its own mechanisms.
- All `system-run.sh` references change to use the tech pack's own system binary

### 7. New Core System Commands

#### 7.1 Agent Command

Core gains an `agent` command in the system CLI to support prompt isolation for agent loading. This command reads agent files at the system layer and returns only structured metadata, so the prompt layer never needs to read agent files directly.

| System Command | Purpose |
|---|---|
| `agent frontmatter <agent-path>` | Read an agent `.md` file, parse YAML frontmatter, return structured JSON. Returns only metadata — never the markdown body. |

Output format:

```json
{
  "name": "backend-dev",
  "model": "sonnet",
  "tools": ["Read", "Write", "Grep", "Glob", "Bash"],
  "skills": ["backend-standards", "typescript-standards", "unit-testing"]
}
```

The `skills` field contains skill names as declared in the agent's frontmatter. `techpacks` maps these names to absolute paths using the manifest — this is string manipulation, not file I/O.

Not exposed through `sdd-run` — this is an internal command used by `techpacks.loadAgent` only.

#### 7.2 Log Command

Core gains a `log` command in the system CLI for prompt-layer operations (skills, commands, agents) to write structured log entries to the same log files that system operations use.

| System Command | Purpose |
|---|---|
| `log --level <level> --source <source> --message <text> [--data <json>]` | Write a structured log entry. `level`: `debug`, `info`, `warn`, `error`. `source`: dot-path identifier (e.g., `techpacks.loadAgent`, `planning.phaseStart`). `data`: optional JSON blob for structured context. |

Usage from prompt-layer operations:

```
system-run.sh log --level info --source techpacks.loadSkill \
  --message "Loading tech pack skill" \
  --data '{"tech_pack":"fs-ts","integration_point":"components.server.scaffolding","path":"..."}'
```

Writes to `sdd/system-logs/` alongside existing system CLI logs. Prompt-layer and system-layer entries are interleaved chronologically, distinguishable by `source`.

Not exposed through `sdd-run` — this is an internal command for prompt-layer use only.

#### 7.3 Tech Pack Management Commands

Core gains a `tech-pack` command namespace in the system CLI:

| System Command | Purpose |
|---|---|
| `tech-pack validate <path>` | Parse and validate `techpack.yaml` at the given path. Checks: required fields present, integration point names are valid, referenced skill paths exist, dependency graph is a valid DAG, namespace is valid. Returns structured validation result. |
| `tech-pack info <namespace>` | Read a tech pack's manifest and return structured data: name, version, component types, lifecycle integration points, documentation paths. Used by the `techpacks` skill. |
| `tech-pack list` | List all installed tech packs with namespace, version, mode (internal/external), component count. |
| `tech-pack install <path>` | Register an external tech pack: (1) validate its manifest, (2) build its system CLI, (3) add to `sdd-settings.yaml` under `tech_packs`. Agents and skills are loaded at runtime via `techpacks` (not pre-registered with Claude Code). |
| `tech-pack remove <namespace>` | Unregister a tech pack: (1) remove from `sdd-settings.yaml`, (2) warn if components are still configured. |

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
2. **Core pass-through** → core system (`permissions`, `tech-pack`, `scaffolding`, `settings`, `archive`, `spec`, `workflow`). Note: `log` is internal-only — not exposed through `sdd-run`.
3. **`<namespace> *`** → tech pack command router. Core reads `commands.available` from the manifest to validate the command name, then delegates to `commands.router` with the remaining args. The command router handles all internal dispatch. Example: `sdd-run fs-ts database setup --name main-db` → core validates `database setup` exists in `commands.available`, then invokes the command router with command=`database setup`, args=`{name: "main-db"}`.

**Command name parsing:** All tech pack command arguments are named (`--key value`), never positional. The command name is all tokens before the first `--` flag. This makes parsing unambiguous: in `sdd-run fs-ts database setup --name main-db`, the namespace is `fs-ts`, the command name is `database setup`, and `--name main-db` is a named argument.

### 8. Schemas

All contracts and configuration files have a JSON Schema (2020-12) definition. These schemas are the source of truth for validation at build time and runtime.

#### 8.1 techpack.yaml

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://sdd.dev/schemas/techpack.json",
  "title": "Tech Pack Manifest",
  "description": "Declares everything a tech pack offers to the SDD core.",
  "type": "object",
  "required": ["tech_pack", "components", "commands", "skills"],
  "additionalProperties": false,
  "properties": {
    "tech_pack": {
      "type": "object",
      "required": ["name", "namespace", "description", "version", "min_sdd_version", "system_path"],
      "additionalProperties": false,
      "properties": {
        "name":            { "type": "string", "pattern": "^[a-z][a-z0-9-]+$" },
        "namespace":       { "type": "string", "pattern": "^[a-z][a-z0-9-]+$", "maxLength": 10 },
        "description":     { "type": "string" },
        "version":         { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
        "min_sdd_version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
        "system_path":     { "type": "string", "description": "Relative path to system CLI entrypoint" }
      }
    },
    "components": {
      "type": "object",
      "minProperties": 1,
      "additionalProperties": {
        "$ref": "#/$defs/component"
      }
    },
    "commands": {
      "type": "object",
      "required": ["router", "available"],
      "additionalProperties": false,
      "properties": {
        "router": { "type": "string", "description": "Relative path to command router skill" },
        "available": {
          "type": "array",
          "items": { "$ref": "#/$defs/command" }
        }
      }
    },
    "skills": {
      "type": "object",
      "required": ["router"],
      "additionalProperties": false,
      "properties": {
        "router": { "type": "string", "description": "Relative path to skills router skill" }
      }
    },
    "lifecycle": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "verification": { "$ref": "#/$defs/lifecycle_phase" },
        "testing":      { "$ref": "#/$defs/lifecycle_phase" }
      }
    },
    "documentation": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "capabilities": { "type": "string", "description": "Relative path to capabilities skill" },
        "help":         { "type": "string", "description": "Relative path to help content skill" }
      }
    }
  },
  "$defs": {
    "component": {
      "type": "object",
      "required": ["description", "directory_pattern", "depends_on", "scaffolding"],
      "additionalProperties": false,
      "properties": {
        "description":       { "type": "string" },
        "directory_pattern":  { "type": "string" },
        "depends_on": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Component type keys this component depends on"
        },
        "scaffolding": { "type": "string", "description": "Relative path to scaffolding skill" },
        "agent":       { "$ref": "#/$defs/agent_ref", "description": "Agent assigned to this component type" }
      }
    },
    "command": {
      "type": "object",
      "required": ["name", "description", "user_facing"],
      "additionalProperties": false,
      "properties": {
        "name":        { "type": "string" },
        "description": { "type": "string" },
        "user_facing": { "type": "boolean" },
        "args": {
          "type": "object",
          "additionalProperties": { "$ref": "#/$defs/command_arg" }
        }
      }
    },
    "command_arg": {
      "type": "object",
      "required": ["type", "mandatory", "description"],
      "additionalProperties": false,
      "properties": {
        "type":        { "type": "string", "enum": ["string", "number", "boolean"] },
        "mandatory":   { "type": "boolean" },
        "description": { "type": "string" },
        "default":     {}
      }
    },
    "lifecycle_phase": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "agent": { "$ref": "#/$defs/agent_ref" }
      }
    },
    "agent_ref": {
      "type": "object",
      "required": ["name", "path"],
      "additionalProperties": false,
      "properties": {
        "name": { "type": "string", "description": "Agent name as registered with Claude Code (matches frontmatter name)" },
        "path": { "type": "string", "description": "Relative path to agent .md file within the tech pack" }
      }
    }
  }
}
```

#### 8.2 sdd-settings.yaml (core-owned)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://sdd.dev/schemas/sdd-settings.json",
  "title": "SDD Project Settings",
  "description": "Core-owned per-project configuration.",
  "type": "object",
  "required": ["sdd", "project"],
  "additionalProperties": false,
  "properties": {
    "sdd": {
      "type": "object",
      "required": ["version"],
      "additionalProperties": false,
      "properties": {
        "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" }
      }
    },
    "project": {
      "type": "object",
      "required": ["name"],
      "additionalProperties": false,
      "properties": {
        "name": { "type": "string", "pattern": "^[a-z][a-z0-9-]+$" }
      }
    },
    "tech_packs": {
      "type": "object",
      "additionalProperties": {
        "$ref": "#/$defs/tech_pack_entry"
      }
    }
  },
  "$defs": {
    "tech_pack_entry": {
      "type": "object",
      "required": ["name", "namespace", "version", "mode", "path"],
      "additionalProperties": false,
      "properties": {
        "name":      { "type": "string" },
        "namespace": { "type": "string" },
        "version":   { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
        "mode":      { "type": "string", "enum": ["internal", "external"] },
        "path":      { "type": "string", "description": "Relative to plugin root if internal" },
        "components": {
          "type": "array",
          "items": { "$ref": "#/$defs/component_manifest" }
        }
      }
    },
    "component_manifest": {
      "type": "object",
      "required": ["name", "type", "directory"],
      "additionalProperties": false,
      "properties": {
        "name":      { "type": "string", "pattern": "^[a-z][a-z0-9-]+$" },
        "type":      { "type": "string" },
        "directory": { "type": "string" }
      }
    }
  }
}
```

#### 8.3 Tech pack settings (e.g., fs-ts-settings.yaml)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://sdd.dev/schemas/techpack-settings.json",
  "title": "Tech Pack Settings",
  "description": "Tech-pack-owned per-project component configuration.",
  "type": "object",
  "required": ["components"],
  "additionalProperties": false,
  "properties": {
    "components": {
      "type": "array",
      "items": { "$ref": "#/$defs/component_settings" }
    }
  },
  "$defs": {
    "component_settings": {
      "type": "object",
      "required": ["name", "type", "directory", "depends_on"],
      "additionalProperties": false,
      "properties": {
        "name":      { "type": "string", "pattern": "^[a-z][a-z0-9-]+$" },
        "type":      { "type": "string" },
        "directory": { "type": "string" },
        "depends_on": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Component instance names this component depends on (e.g., ['main-db', 'main-api']). Distinct from manifest depends_on which references component types."
        },
        "capabilities": {
          "type": "array",
          "items": { "type": "string" }
        },
        "settings": {
          "type": "object",
          "additionalProperties": true,
          "description": "Tech-specific settings — schema defined by the tech pack per component type"
        }
      }
    }
  }
}
```

#### 8.4 Declared actions response

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://sdd.dev/schemas/declared-actions-response.json",
  "title": "Tech System Declared Actions Response",
  "description": "Structured JSON returned by the tech system on successful command execution.",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "result": {
      "type": "object",
      "additionalProperties": true,
      "description": "Tech-specific command output"
    },
    "actions": {
      "type": "array",
      "items": { "$ref": "#/$defs/declared_action" },
      "description": "Declared state changes for core to execute"
    }
  },
  "$defs": {
    "declared_action": {
      "type": "object",
      "required": ["action"],
      "oneOf": [
        { "$ref": "#/$defs/register_component" },
        { "$ref": "#/$defs/unregister_component" }
      ]
    },
    "register_component": {
      "type": "object",
      "required": ["action", "name", "type", "directory"],
      "additionalProperties": false,
      "properties": {
        "action":    { "const": "register_component" },
        "name":      { "type": "string", "pattern": "^[a-z][a-z0-9-]+$" },
        "type":      { "type": "string" },
        "directory": { "type": "string" }
      }
    },
    "unregister_component": {
      "type": "object",
      "required": ["action", "name"],
      "additionalProperties": false,
      "properties": {
        "action": { "const": "unregister_component" },
        "name":   { "type": "string" }
      }
    }
  }
}
```

#### 8.5 Skills router context

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://sdd.dev/schemas/skills-router-context.json",
  "title": "Skills Router Context",
  "description": "Structured context block core passes when invoking the skills router.",
  "type": "object",
  "required": ["phase"],
  "additionalProperties": false,
  "properties": {
    "phase": {
      "type": "string",
      "enum": ["component-discovery", "project-scaffolding", "plan-generation", "implementation", "verification", "testing"]
    },
    "component_type": {
      "type": "string",
      "description": "Component type key from the manifest (e.g., server, webapp)"
    },
    "component_name": {
      "type": "string",
      "description": "Instance name of the component (e.g., main-server)"
    },
    "agent": {
      "type": "string",
      "description": "Agent currently active (e.g., backend-dev)"
    }
  }
}
```

#### 8.6 Command router context

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://sdd.dev/schemas/command-router-context.json",
  "title": "Command Router Context",
  "description": "Structured context block core passes when invoking the command router.",
  "type": "object",
  "required": ["command", "namespace"],
  "additionalProperties": false,
  "properties": {
    "command": {
      "type": "string",
      "description": "Validated command name (e.g., database setup)"
    },
    "args": {
      "type": "object",
      "additionalProperties": true,
      "description": "Parsed arguments matching the command's args schema"
    },
    "namespace": {
      "type": "string",
      "description": "Tech pack namespace (e.g., fs-ts)"
    }
  }
}
```

## Open Questions (Resolve During Planning)

### OQ-1: CLI Build Architecture

Two separate system directories each need their own `package.json`, `tsconfig.json`, and build step. Both need shared utilities (logger, path resolution, settings reader). Options:

- **a)** npm workspace with a shared `@sdd/system-lib` package
- **b)** Each system duplicates the shared code
- **c)** Tech system depends on core system as a build dependency

### OQ-2: Template Path Resolution

Scaffolding specs reference template paths like `components/backend/backend-scaffolding/templates`. After the split, these templates live in the tech pack directory. How do paths resolve?

- **a)** Relative to tech pack root (tech skills provide full path)
- **b)** Core scaffolding engine receives a base path from the manifest and resolves relative to it

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

Existing SDD projects have `.sdd/sdd-settings.yaml` without a `tech_packs` namespace and components defined at the top level. How do they migrate?

Migration scope (not just a namespace move):
- Directory rename: `.sdd/` → `sdd/`
- Drop fields: `initialized_by_plugin_version`, `updated_by_plugin_version`, `initialized_at`, `updated_at`, `project.description`
- Simplify `sdd` section: replace plugin version fields with single `version`
- Move top-level `components` array (with full settings) under `tech_packs.fs-ts.components` (stripped to name, type, directory only)
- Create `sdd/fs-ts-settings.yaml` with the full component details (depends_on, capabilities, settings)

Options:
- **a)** `sdd-init` detects the old format and auto-migrates
- **b)** A one-time `sdd-run tech-pack migrate` command
- **c)** Core reads both old and new formats during a transition period

## Acceptance Criteria

- [ ] `plugin/core/` contains only SDD methodology files — no tech-specific names, agents, or standards — **verify:** `grep -ri "backend-dev\|frontend-dev\|api-designer\|db-advisor\|devops\|tester\|reviewer\|CMDO\|MVVM\|postgresql\|React\|Node\.js\|Helm\|Kubernetes\|TailwindCSS\|TanStack\|Vitest\|Playwright\|Testkube\|OpenAPI\|npm.workspaces" plugin/core/` returns zero matches
- [ ] `plugin/fullstack-typescript/` contains all tech-specific files — **verify:** `ls plugin/fullstack-typescript/agents/ plugin/fullstack-typescript/skills/components/` shows all 7 agents and all component skill directories
- [ ] `techpack.yaml` exists and is valid — **verify:** `plugin/core/system/system-run.sh tech-pack validate plugin/fullstack-typescript` passes with no errors
- [ ] Core planning skill reads from manifest, not hardcoded tables — **verify:** `grep -c "backend-dev\|frontend-dev\|api-designer" plugin/core/skills/planning/SKILL.md` returns 0
- [ ] Inter-system protocol works — **verify:** `plugin/core/system/system-run.sh fs-ts database --help` routes to tech system and returns usage text
- [ ] Tech system abstracts core — **verify:** `grep -r "core/system" plugin/fullstack-typescript/skills/` returns zero matches (tech skills never reference core's system)
- [ ] Settings namespace works — **verify:** `npm test` passes with updated settings schema including `tech_packs` key
- [ ] Single `plugin.json` — **verify:** `cat plugin/.claude-plugin/plugin.json` lists only `core/` paths (commands, skills). No `fullstack-typescript/` paths — tech pack artifacts are loaded dynamically via the techpacks.
- [ ] No soft cross-boundary references — **verify:** `grep -rn "techpacks\." plugin/core/skills/ plugin/core/commands/` returns only calls through the `techpacks` skill operations (`techpacks.readManifest`, `techpacks.loadSkill`, `techpacks.loadAgent`, `techpacks.routeSkills`, `techpacks.routeCommand`, `techpacks.listComponents`, `techpacks.dependencyOrder`, `techpacks.resolvePath`). No core file references a tech pack skill or agent by filename or path outside of a `techpacks.*` call.
- [ ] `techpacks` skill works — **verify:** invoking `tech-pack info fs-ts` returns component list, lifecycle integration points, and documentation paths
- [ ] `tech-pack validate` catches errors — **verify:** a malformed manifest (missing required field) returns a clear validation error
- [ ] **Skill coverage — static matrix.** Every pre-split artifact (38 skills, 7 agents) maps to a post-split loading path in the Skill Coverage Matrix below. No artifact is orphaned. **Verify:** every row in the matrix has a non-empty "Post-split mechanism" column. Cross-check with `find plugin/ -name "SKILL.md" -o -name "*.md" -path "*/agents/*" | wc -l` pre-split to confirm no artifact is missing from the matrix.
- [ ] **Skill coverage — log-based runtime verification.** Every `techpacks` operation writes a structured log entry via `system-run.sh log` (see enforcement rule 4). Run each scenario in the Scenario Verification Checklist and verify `sdd/system-logs/` contains the expected `techpacks.*` entries. **Verify:** `grep "techpacks\." sdd/system-logs/*.log` produces entries matching every row in the checklist. No scenario produces fewer entries than expected.
- [ ] Zero file loss (except hooks) — **verify:** every file that existed before the split (except `plugin/hooks/` and `hook/` system command) is present in either `core/` or `fullstack-typescript/`. Run `find plugin/ -name "*.md" -o -name "*.ts" | sort` pre-split and post-split, diff the lists.
- [ ] `npm run build:plugin` succeeds — **verify:** builds both core and tech system CLIs without errors
- [ ] `npm run typecheck:plugin` passes — **verify:** type checking passes for both system directories
- [ ] Existing tests pass — **verify:** `npm test` passes

### Skill Coverage Matrix

**Purpose:** Guarantee zero skill loss across the split. Every pre-split artifact maps to exactly one post-split loading path. Gaps flagged here must be resolved during planning.

**Post-split loading mechanisms:**
- **direct** — registered in `plugin.json`, resolved by Claude's built-in skill discovery (unchanged from pre-split)
- **techpacks.loadAgent** — `techpacks` skill spawns a Task subagent; subagent self-bootstraps and reads its own skills
- **techpacks.routeSkills** — `techpacks` skill loads the tech pack's skills router, which loads the target skill(s) into main context
- **techpacks.routeCommand** — `techpacks` skill loads the tech pack's command router, which dispatches to the target
- **subagent bootstrap** — skill path resolved by `techpacks` and passed to subagent; subagent reads it directly (contents stay in subagent context)
- **eliminated** — intentionally removed (documented in Changes section)

#### A. Core Skills (plugin.json — direct loading)

| # | Skill | Post-split Status |
|---|---|---|
| 1 | change-creation | modified — reads manifest for dependency graph, agent assignments. Plan templates split: generic structure stays in core, tech-specific content (CMDO/MVVM/TailwindCSS references) moves to tech pack `templates/plans/` |
| 2 | commit-standards | unchanged |
| 3 | component-discovery → **tech-discovery** | renamed + heavy rewrite: 71 tech-specific references stripped. Core keeps the discovery framework; tech pack supplies component types, descriptions, and discovery question sets via skills router (`phase: component-discovery`) |
| 4 | domain-population | unchanged |
| 5 | external-spec-integration | modified (minor) — strip generic "DevOps" category label from `resources/workflow-steps.md` |
| 6 | planning | modified — reads manifest for agent assignments, standards via skills router |
| 7 | project-scaffolding | modified — delegates to tech pack for component scaffolding and templates |
| 8 | project-settings | modified — type→directory mapping removed, reads manifest |
| 9 | spec-decomposition | modified (minor) — strip generic "DevOps" reference from `resources/outline-modes.md` |
| 10 | spec-index | unchanged |
| 11 | spec-solicitation | unchanged |
| 12 | spec-writing | unchanged |
| 13 | workflow-state | unchanged |
| 14 | change-orchestration | modified — reads manifest for agent assignments |
| 15 | init-orchestration | modified — delegates prerequisites to tech pack |
| 16 | version-orchestration | unchanged |
| 17 | techpacks | **NEW** — single entry point for all tech pack interactions |

#### B. Tech Pack Skills — Agent Context (loaded by subagent self-bootstrap)

Skills loaded into agent subcontexts. Pre-split these were registered in `plugin.json` and loaded directly. Post-split they live in the tech pack and are loaded by subagents via file paths resolved by the techpacks.

| # | Skill | Agents That Load It |
|---|---|---|
| 18 | typescript-standards | api-designer, backend-dev, frontend-dev, reviewer |
| 19 | unit-testing | backend-dev, frontend-dev, reviewer |
| 20 | backend-standards | backend-dev, reviewer |
| 21 | frontend-standards | frontend-dev, reviewer |
| 22 | database-standards | backend-dev, db-advisor |
| 23 | contract-standards | api-designer |
| 24 | postgresql | db-advisor, devops |
| 25 | helm-standards | devops |
| 26 | cicd-standards | devops |
| 27 | testing-standards → **split** into integration-testing-standards (#28) and e2e-testing-standards (#29) | tester (no longer loads this directly) |
| 28 | integration-testing → integration-testing-standards | tester |
| 29 | e2e-testing → e2e-testing-standards | tester |
| — | techpack-settings | api-designer, backend-dev, frontend-dev, devops, tester — **NEW**, replaces `project-settings` in agent frontmatter |

#### C. Tech Pack Skills — Main Context (loaded via techpacks.routeSkills)

Skills loaded into the main conversation context via the techpacks. Pre-split these were registered in `plugin.json`. Post-split the `techpacks` skills router determines which to load based on context.

| # | Skill | Gateway Context | Loaded During |
|---|---|---|---|
| 30 | backend-scaffolding | phase: project-scaffolding, component_type: server | init, component scaffolding |
| 31 | frontend-scaffolding | phase: project-scaffolding, component_type: webapp | init, component scaffolding |
| 32 | database-scaffolding | phase: project-scaffolding, component_type: database | init, component scaffolding |
| 33 | contract-scaffolding | phase: project-scaffolding, component_type: contract | init, component scaffolding |
| 34 | config-scaffolding | phase: project-scaffolding, component_type: config | init, component scaffolding |
| 35 | helm-scaffolding | phase: project-scaffolding, component_type: helm | init, component scaffolding |
| 36 | config-standards | internal to tech pack — used by `config-orchestration` directly, not loaded via `techpacks` | config management |
| — | scaffolding | phase: project-scaffolding (no component_type) | init (main context via techpacks.routeSkills), feature impl Phase 1 (agent subcontext via devops) — **NEW**, entry point that orchestrates component scaffolding skills |
| — | component-discovery | phase: component-discovery | spec creation — **NEW**, tech-specific component types, descriptions, discovery question sets |

#### D. Tech Pack Skills — Command-Routed (loaded via techpacks.routeCommand)

| # | Skill | Command Route | Loaded During |
|---|---|---|---|
| 37 | config-orchestration | `sdd-run fs-ts config *` | config management |
| 38 | local-env-orchestration | `sdd-run fs-ts local-env *` | local env management |

#### E. Tech Pack Skills — NEW (did not exist pre-split)

These are new skills introduced by the split. They don't need "coverage" (nothing to lose), but are listed for completeness.

| Skill | Purpose |
|---|---|
| techpack-settings | Tech-pack-equivalent of `project-settings` — component type definitions, settings schema per type, directory patterns, `fs-ts-settings.yaml` schema. Replaces `project-settings` in agent frontmatter. |
| scaffolding | Scaffolding entry point and knowledge center — orchestration order, delegation table (component type → scaffolding skill), directory naming patterns. Core's `project-scaffolding` loads this via `techpacks`; it coordinates the component-specific scaffolding skills. Absorbs the tech-specific content from the pre-split `scaffolding` skill. |
| component-discovery | Component types, descriptions, and discovery question sets. Core's `tech-discovery` loads this via the skills router (`phase: component-discovery`). Absorbs the tech-specific content (71 references) from the pre-split `component-discovery` skill. |
| planning-standards | Phase: plan-generation — tech-specific plan content |
| capabilities | documentation.capabilities — /sdd intent mappings |
| help-content | documentation.help — /sdd-help tech section |
| skills-router | Entry point for techpacks.routeSkills — maps context to skills |
| command-router | Entry point for techpacks.routeCommand — maps commands to targets |
| cicd-scaffolding | Scaffolding skill for CI/CD components. Formalizes what was previously inline scaffolding in the pre-split `scaffolding` router. |
| integration-testing-scaffolding | Scaffolding skill for integration test suites. Formalizes what was previously inline scaffolding. |
| e2e-testing-scaffolding | Scaffolding skill for end-to-end test suites. Formalizes what was previously inline scaffolding. |

#### F. Agents (loaded via techpacks.loadAgent → subagent)

All 7 agents move from `plugin/agents/` to `plugin/fullstack-typescript/agents/`. Pre-split they were registered in `plugin.json`. Post-split they are loaded exclusively via `techpacks.loadAgent`, spawned as Task subagents.

| # | Agent | Post-split Skills (subagent reads these) |
|---|---|---|
| 39 | api-designer | techpack-settings, typescript-standards, contract-standards |
| 40 | backend-dev | techpack-settings, typescript-standards, backend-standards, database-standards, unit-testing |
| 41 | frontend-dev | techpack-settings, typescript-standards, frontend-standards, unit-testing |
| 42 | tester | techpack-settings, integration-testing-standards, e2e-testing-standards |
| 43 | reviewer | typescript-standards, backend-standards, frontend-standards, unit-testing |
| 44 | db-advisor | postgresql, database-standards |
| 45 | devops | techpack-settings, scaffolding, postgresql, helm-standards, cicd-standards |

**`project-settings` → `techpack-settings` in agents:** Pre-split, `project-settings` is listed in the frontmatter of 5 agents. Post-split, `project-settings` is a core skill (base mechanism: read/write `sdd-settings.yaml`, schema validation). The tech-specific content — component type definitions, settings tables per type, directory patterns, tech-specific validation rules — moves to a new `techpack-settings` skill in the tech pack. This replaces `project-settings` in agent frontmatter for the same 5 agents. `reviewer` and `db-advisor` don't need it (they review code, not project structure).

**`scaffolding` in devops agent:** Pre-split, devops agent lists `scaffolding` as a skill dependency. Post-split, the pre-split scaffolding skill is split: the generic engine stays in core's system CLI, and the tech-specific orchestration (ordering, delegation, directory patterns) moves to the new tech pack `scaffolding` skill. The devops agent's post-split skill list should reference the tech pack `scaffolding` skill instead.

#### G. Eliminated

| Artifact | Type | Reason |
|---|---|---|
| scaffolding (router skill) | skill | Split: generic engine stays in core system CLI, tech-specific orchestration (ordering, delegation, directory patterns) moves to new tech pack `scaffolding` skill |
| plugin/hooks/ (validate-write, prompt-commit, hook-runner.sh, hooks.json) | hooks | hook system removed entirely |
| hook/ (system command) | system cmd | hook system removed entirely |

#### Scenario Verification Checklist

Run each scenario and verify `sdd/system-logs/` contains the expected `techpacks.*` log entries:

| # | Scenario | Trigger | Expected Log Entries |
|---|---|---|---|
| 1 | Component discovery | spec creation (external spec workflow) | `techpacks.routeSkills`: component-discovery |
| 2 | Feature planning | `sdd-run change create --type feature` | `techpacks.routeSkills`: planning-standards |
| 3 | Feature impl: scaffolding | plan phase 1 | `techpacks.loadAgent`: devops |
| 4 | Feature impl: contract | plan phase 2 | `techpacks.loadAgent`: api-designer |
| 5 | Feature impl: backend | plan phase 3 | `techpacks.loadAgent`: backend-dev |
| 6 | Feature impl: frontend | plan phase 4 | `techpacks.loadAgent`: frontend-dev |
| 7 | Feature impl: testing | plan phase 5 | `techpacks.loadAgent`: tester |
| 8 | Feature impl: review | plan phase 6 | `techpacks.loadAgent`: reviewer + db-advisor (if DB changes) |
| 9 | Bugfix planning | `sdd-run change create --type bugfix` | `techpacks.routeSkills`: planning-standards |
| 10 | Refactor planning | `sdd-run change create --type refactor` | `techpacks.routeSkills`: planning-standards |
| 11 | Project init | `sdd-run init` | `techpacks.routeSkills`: scaffolding (entry point), per-component scaffolding skills, project templates |
| 12 | Config management | `sdd-run fs-ts config generate` | `techpacks.routeCommand`: config generate → config-orchestration |
| 13 | Local env | `sdd-run fs-ts local-env create` | `techpacks.routeCommand`: local-env create → local-env-orchestration |
| 14 | DB management | `sdd-run fs-ts database setup --name main-db` | `techpacks.routeCommand`: database setup → system CLI delegation |
| 15 | Contract management | `sdd-run fs-ts contract validate` | `techpacks.routeCommand`: contract validate → system CLI delegation |
| 16 | /sdd hub | `/sdd` (with active tech pack) | `techpacks.loadSkill`: documentation.capabilities |
| 17 | /sdd-help | `/sdd-help` | `techpacks.loadSkill`: documentation.help |
| 18 | Scaffolding: server | component scaffolding | `techpacks.routeSkills`: backend-scaffolding |
| 19 | Scaffolding: webapp | component scaffolding | `techpacks.routeSkills`: frontend-scaffolding |
| 20 | Scaffolding: database | component scaffolding | `techpacks.routeSkills`: database-scaffolding |
| 21 | Scaffolding: contract | component scaffolding | `techpacks.routeSkills`: contract-scaffolding |
| 22 | Scaffolding: config | component scaffolding | `techpacks.routeSkills`: config-scaffolding |
| 23 | Scaffolding: helm | component scaffolding | `techpacks.routeSkills`: helm-scaffolding |
| 24 | Scaffolding: cicd | component scaffolding | `techpacks.routeSkills`: cicd-scaffolding |
| 25 | Scaffolding: integration-testing | component scaffolding | `techpacks.routeSkills`: integration-testing-scaffolding |
| 26 | Scaffolding: e2e-testing | component scaffolding | `techpacks.routeSkills`: e2e-testing-scaffolding |
