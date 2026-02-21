# SDD-Core / Tech Pack Split Map

## Overview

This document maps every file in `plugin/` to either **sdd-core** (methodology) or **tech-pack** (opinionated stack). The goal: sdd-core works for any project regardless of language, framework, or infrastructure. Tech packs are separate Claude Code plugins that register with sdd-core.

---

## Architecture: Plugin Composition Model

### Repository structure

```
sdd/
├── plugins/
│   ├── sdd/                        # Current monolithic plugin (unchanged, backwards compat)
│   │   ├── .claude-plugin/
│   │   ├── commands/
│   │   ├── skills/
│   │   ├── agents/
│   │   ├── hooks/
│   │   └── system/
│   ├── sdd-core/                   # Extracted core methodology
│   │   ├── .claude-plugin/
│   │   ├── commands/
│   │   ├── skills/
│   │   ├── hooks/
│   │   └── system/                 # Core CLI (top-level namespaces only)
│   └── sdd-fullstack-ts/           # Extracted tech pack
│       ├── .claude-plugin/
│       ├── skills/
│       ├── agents/
│       ├── system/                 # Tech pack CLI (scoped namespace only)
│       ├── schemas/
│       └── tech-pack.yaml          # Registration manifest (source of truth)
├── tests/
├── .claude-plugin/
│   └── marketplace.json
├── CLAUDE.md
├── CHANGELOG.md
└── package.json
```

### How it works

- **sdd-core** is a standalone Claude Code plugin providing the SDD methodology
- **Tech packs** (e.g., `sdd-fullstack-ts`) are separate Claude Code plugins installed alongside sdd-core
- Both plugins' skills/agents/commands are loaded into the LLM context simultaneously
- Tech packs register with sdd-core via `.sdd/tech-packs.yaml` (a single pointer file in the user's project)
- Each plugin ships its own system CLI binary — core handles top-level namespaces, tech packs handle their scoped namespace

### CLI architecture: two separate binaries

Each plugin ships its own CLI. No dynamic loading or shared binary.

**sdd-core CLI** (`plugins/sdd-core/system/`):
- Handles all top-level namespaces: `spec`, `workflow`, `scaffolding`, `settings`, `archive`, `hook`, `permissions`, `config`, `version`
- When it receives an unknown namespace, it reads `.sdd/tech-packs.yaml`, resolves the tech pack's CLI path, and spawns it as a subprocess

**Tech pack CLI** (`plugins/sdd-fullstack-ts/system/`):
- Only handles actions within its own scope
- Invoked as: `sdd-fullstack-ts-system <action-group> <action> [args]`
- The core CLI delegates to it: `sdd-system fullstack-ts database setup` → spawns `sdd-fullstack-ts-system database setup`

### CLI Namespace Isolation

Tech packs **cannot** add top-level CLI namespaces. Each tech pack's CLI actions live under a single namespace scoped to its pack name:

```
# Core namespaces (owned by sdd-core, top-level)
sdd-system spec validate changes/2026/01/feature/SPEC.md
sdd-system workflow check-gate --phase implement
sdd-system scaffolding project --config config.json
sdd-system settings reconcile
sdd-system archive store ...
sdd-system hook validate-write ...
sdd-system permissions configure
sdd-system config generate --env local
sdd-system version bump patch

# Tech pack namespaces (scoped under pack name)
sdd-system fullstack-ts database setup my-db
sdd-system fullstack-ts database migrate my-db
sdd-system fullstack-ts contract validate api.yaml
sdd-system fullstack-ts contract generate-types api.yaml
sdd-system fullstack-ts env create
sdd-system fullstack-ts env deploy

# Another tech pack would get its own namespace
sdd-system python-api alembic migrate
sdd-system python-api docker compose-up
```

### Tech Pack Registration

A single file `.sdd/tech-packs.yaml` in the user's project lists all active tech packs with pointers to their manifests:

```yaml
# .sdd/tech-packs.yaml
tech_packs:
  - name: fullstack-ts
    version: 1.0.0
    installed_at: 2026-02-21
    updated_at: 2026-02-21
    manifest: .claude/plugins/sdd-fullstack-ts/tech-pack.yaml
  # - name: python-api
  #   version: 0.5.0
  #   manifest: .claude/plugins/sdd-python-api/tech-pack.yaml
```

Each tech pack ships a `tech-pack.yaml` in its own plugin directory (the source of truth — no copies):

```yaml
# plugins/sdd-fullstack-ts/tech-pack.yaml
name: fullstack-ts
version: 1.0.0
requires_sdd_core: ">=8.0.0"

# Component types this tech pack provides
component_types:
  server:
    description: "Node.js/TypeScript backend with CMDO architecture"
    settings_schema: ./schemas/server-settings.json
    scaffolding_skill: backend-scaffolding
    standards_skill: backend-standards
    agent: backend-dev
    scripts:
      dev: "npm run dev {{workspace}}"
      build: "npm run build {{workspace}}"
      start: "npm run start {{workspace}}"
      test: "npm run test {{workspace}}"
  webapp:
    description: "React/TypeScript frontend with MVVM pattern"
    settings_schema: ./schemas/webapp-settings.json
    scaffolding_skill: frontend-scaffolding
    standards_skill: frontend-standards
    agent: frontend-dev
    scripts:
      dev: "npm run dev {{workspace}}"
      build: "npm run build {{workspace}}"
      preview: "npm run preview {{workspace}}"
      test: "npm run test {{workspace}}"
  database:
    description: "PostgreSQL migrations, seeds, and management"
    settings_schema: ./schemas/database-settings.json
    scaffolding_skill: database-scaffolding
    standards_skill: database-standards
    agent: db-advisor
    scripts:
      setup: "npm run setup {{workspace}}"
      migrate: "npm run migrate {{workspace}}"
      seed: "npm run seed {{workspace}}"
  contract:
    description: "OpenAPI specifications and type generation"
    settings_schema: ./schemas/contract-settings.json
    scaffolding_skill: contract-scaffolding
    standards_skill: contract-standards
    agent: api-designer
    scripts:
      generate: "npm run generate:types {{workspace}}"
      validate: "npm run validate {{workspace}}"
  helm:
    description: "Kubernetes deployment charts"
    settings_schema: ./schemas/helm-settings.json
    scaffolding_skill: helm-scaffolding
    standards_skill: helm-standards
    agent: devops
  testing:
    description: "Testkube test definitions"
  cicd:
    description: "GitHub Actions CI/CD workflows"
    standards_skill: cicd-standards

# CLI actions available under `sdd-system fullstack-ts <action-group> <action>`
cli_actions:
  database:
    - setup
    - teardown
    - migrate
    - seed
    - reset
    - port-forward
    - psql
  contract:
    - generate-types
    - validate
  env:
    - create
    - destroy
    - start
    - stop
    - restart
    - status
    - deploy
    - undeploy
    - forward
    - config
    - infra
    - check-tools
```

### How sdd-core CLI discovers and delegates to tech packs

The core CLI router in `cli.ts`:

1. Parse the first arg as usual
2. If it matches a core namespace → route to core handler
3. If not → read `.sdd/tech-packs.yaml` and check if the arg matches a registered tech pack name
4. If found → follow the `manifest` pointer, resolve the tech pack's CLI binary path, spawn it as a subprocess with remaining args
5. If not found → error: "Unknown namespace"

### Versioning

**Tech pack manifest** declares:
- Its own semver (`version: 1.0.0`)
- Compatible core version range (`requires_sdd_core: ">=8.0.0"`)

**Project registration** (`.sdd/tech-packs.yaml`) tracks:
- Which version is currently active in the project (`version`)
- When it was installed/updated (`installed_at`, `updated_at`)

**Core CLI checks on reconcile:**
- If installed tech pack version > registered version → trigger tech pack reconciliation
- If core version < tech pack's `requires_sdd_core` → warn user to update core
- If core version has breaking changes → tech pack must update its `requires_sdd_core`

---

## 1. Plugin Manifests

### sdd-core plugin.json

```json
{
  "name": "sdd",
  "version": "8.0.0",
  "description": "Spec-driven development methodology — core plugin",
  "skills": [
    "./skills/",
    "./skills/orchestrators/"
  ]
}
```

### sdd-fullstack-ts plugin.json

```json
{
  "name": "sdd-fullstack-ts",
  "version": "1.0.0",
  "description": "SDD tech pack: Node.js/TypeScript + React + PostgreSQL + K8s",
  "skills": [
    "./skills/components/backend/",
    "./skills/components/frontend/",
    "./skills/components/database/",
    "./skills/components/contract/",
    "./skills/components/config/",
    "./skills/components/cicd/",
    "./skills/components/helm/",
    "./skills/components/e2e-testing/",
    "./skills/components/integration-testing/",
    "./skills/"
  ]
}
```

### sdd (legacy) plugin.json — unchanged

```json
{
  "name": "sdd",
  "version": "7.1.0",
  "description": "Spec-driven development methodology for full-stack teams",
  "skills": [
    "./skills/",
    "./skills/orchestrators/",
    "./skills/components/backend/",
    "./skills/components/frontend/",
    "./skills/components/database/",
    "./skills/components/contract/",
    "./skills/components/config/",
    "./skills/components/cicd/",
    "./skills/components/helm/",
    "./skills/components/e2e-testing/",
    "./skills/components/integration-testing/"
  ]
}
```

---

## 2. Commands

| File | Destination | Rationale |
|------|------------|-----------|
| `commands/sdd.md` | **sdd-core** | Main workflow entry point — pure methodology |
| `commands/sdd-run.md` | **sdd-core** | Action execution — pure methodology |
| `commands/sdd-help.md` | **sdd-core** | Documentation/learning — pure methodology |

---

## 3. Skills — Core SDD (methodology)

These stay in **sdd-core**. They work for any tech stack.

| Skill | Files | What it does |
|-------|-------|-------------|
| `spec-writing/` | SKILL.md + resources/ + schemas/ | Spec templates, validation, lifecycle |
| `spec-solicitation/` | SKILL.md + resources/ + schemas/ | Interactive requirements gathering |
| `spec-decomposition/` | SKILL.md + resources/ + schemas/ | Breaking specs into changes |
| `spec-index/` | SKILL.md + schemas/ | Spec indexing and organization |
| `planning/` | SKILL.md + schemas/ | Implementation plan generation |
| `domain-population/` | SKILL.md + schemas/ | Domain modeling (glossary, entities, use-cases) |
| `change-creation/` | SKILL.md + templates/ + schemas/ | Change lifecycle (epic/feature/bugfix/refactor) |
| `workflow-state/` | SKILL.md + resources/ + schemas/ | Workflow state tracking |
| `external-spec-integration/` | SKILL.md + resources/ + schemas/ | Importing external specs |
| `commit-standards/` | SKILL.md | Git commit methodology |
| `project-scaffolding/` | SKILL.md + templates/ + schemas/ | Core project structure templates |
| `scaffolding/` | SKILL.md + schemas/ | Generic scaffolding orchestration |

### Orchestrators (core)

| Skill | Destination | Rationale |
|-------|------------|-----------|
| `orchestrators/change-orchestration/` | **sdd-core** | Workflow coordination — pure methodology |
| `orchestrators/init-orchestration/` | **sdd-core** | Project initialization — pure methodology |
| `orchestrators/version-orchestration/` | **sdd-core** | Version management — pure methodology |
| `orchestrators/config-orchestration/` | **sdd-core** | Config workflow — pure methodology |
| `orchestrators/local-env-orchestration/` | **TECH-PACK** | K8s local env — infrastructure-specific |

### Borderline cases

| Skill | Destination | Rationale |
|-------|------------|-----------|
| `component-discovery/` | **sdd-core** | The *analysis* is generic ("do you need persistence? a UI?"). But the *output* currently maps to hardcoded types. Needs refactoring to output abstract component roles that tech packs resolve. |
| `project-settings/` | **SPLIT** | The *concept* of project settings is core. The *schema* (server=Node.js, webapp=React, etc.) is opinionated. Core defines the settings framework; tech packs register their component types + settings schemas via their manifest. |

---

## 4. Skills — Tech Pack (sdd-fullstack-ts)

These move to the **tech-pack**. Each is deeply tied to specific technologies.

### Backend (Node.js/TypeScript/CMDO)

| Skill | Files |
|-------|-------|
| `components/backend/backend-standards/` | SKILL.md |
| `components/backend/backend-scaffolding/` | SKILL.md + schemas/ + templates/ (22 template files) |
| `typescript-standards/` | SKILL.md + resources/ (5 resource files) |
| `unit-testing/` | SKILL.md |
| `testing-standards/` | SKILL.md |

### Frontend (React/Vite/TanStack/Tailwind)

| Skill | Files |
|-------|-------|
| `components/frontend/frontend-standards/` | SKILL.md + resources/ (4 resource files) |
| `components/frontend/frontend-scaffolding/` | SKILL.md + schemas/ + templates/ (37 template files) |

### Database (PostgreSQL)

| Skill | Files |
|-------|-------|
| `components/database/database-standards/` | SKILL.md |
| `components/database/database-scaffolding/` | SKILL.md + schemas/ + templates/ (4 template files) |
| `components/database/postgresql/` | SKILL.md + references/ (7 files) + resources/ (4 files) |

### API (OpenAPI/REST)

| Skill | Files |
|-------|-------|
| `components/contract/contract-standards/` | SKILL.md |
| `components/contract/contract-scaffolding/` | SKILL.md + schemas/ + templates/ (2 template files) |

### Infrastructure (K8s/Helm/GitHub Actions)

| Skill | Files |
|-------|-------|
| `components/helm/helm-standards/` | SKILL.md |
| `components/helm/helm-scaffolding/` | SKILL.md + schemas/ + templates/ (29 template files across server/webapp/umbrella variants) |
| `components/cicd/cicd-standards/` | SKILL.md |
| `components/config/config-standards/` | SKILL.md |
| `components/config/config-scaffolding/` | SKILL.md + schemas/ + templates/ (6 template files) |

### Testing (Playwright/Testkube)

| Skill | Files |
|-------|-------|
| `components/e2e-testing/e2e-testing/` | SKILL.md + resources/ (4 files) |
| `components/integration-testing/integration-testing/` | SKILL.md + resources/ (4 files) |

---

## 5. Agents

| Agent | Destination | Rationale |
|-------|------------|-----------|
| `agents/api-designer.md` | **TECH-PACK** | OpenAPI/REST-specific |
| `agents/backend-dev.md` | **TECH-PACK** | Node.js/CMDO-specific |
| `agents/frontend-dev.md` | **TECH-PACK** | React/MVVM-specific |
| `agents/db-advisor.md` | **TECH-PACK** | PostgreSQL-specific |
| `agents/devops.md` | **TECH-PACK** | K8s/Helm/GitHub Actions-specific |
| `agents/tester.md` | **TECH-PACK** | Playwright/Vitest-specific |
| `agents/reviewer.md` | **TECH-PACK** | References tech-specific standards. Could be made core if it delegated to tech-pack standards dynamically. |

**sdd-core agents: none currently.** The methodology doesn't need agents — it operates through skills + commands. Agents are the tech-specific "hands" that do the implementation work.

---

## 6. Hooks

| File | Destination | Rationale |
|------|------------|-----------|
| `hooks/hook-runner.sh` | **sdd-core** | Generic hook execution shell |
| `hooks/hooks.json` | **sdd-core** | Hook registration (validate-write + prompt-commit are generic) |
| `hooks/PERMISSIONS.md` | **sdd-core** | Permission documentation |
| `hooks/recommended-permissions.json` | **SPLIT** | Some permissions are core (spec writes), some are tech-specific (k8s commands) |

---

## 7. System CLI — Command Namespaces

### Core CLI (`plugins/sdd-core/system/`)

Top-level namespaces, owned exclusively by sdd-core:

| Namespace | Rationale |
|-----------|-----------|
| `scaffolding` | Engine + domain population. `project.ts` refactored to read component templates from tech pack manifest instead of hardcoding. |
| `spec` | Spec validation, indexing, snapshots — pure methodology |
| `workflow` | Phase gate checks — pure methodology |
| `archive` | File archival — pure methodology |
| `settings` | Reconciliation engine is generic. Tech packs register their component schemas via manifest. |
| `hook` | validate-write + prompt-commit — generic |
| `permissions` | Permission merging — generic |
| `config` | Config generate/validate/diff/add-env — generic YAML operations |
| `version` | Version bumping — generic |

### Tech pack CLI (`plugins/sdd-fullstack-ts/system/`)

Separate binary. Invoked by core CLI when namespace matches a registered tech pack name.

For `sdd-fullstack-ts`, actions under `sdd-system fullstack-ts <action-group> <action>`:

| Action group | Actions | Source files |
|-------------|---------|-------------|
| `database` | setup, teardown, migrate, seed, reset, port-forward, psql | 10 files |
| `contract` | generate-types, validate | 5 files |
| `env` | create, destroy, start, stop, restart, status, deploy, undeploy, forward, config, infra, check-tools | 17 files + 5 provider files |

### System CLI file-by-file split

#### sdd-core system (`plugins/sdd-core/system/src/`)

```
cli.ts                                → REFACTOR: add tech pack discovery + subprocess delegation
lib/args.ts                           → core
lib/config.ts                         → core
lib/frontmatter.ts                    → core
lib/fs.ts                             → core
lib/index.ts                          → core
lib/json-schema.ts                    → core
lib/logger.ts                         → core
lib/schema-validator.ts               → core
lib/spec-utils.ts                     → core
types/spec.ts                         → core
types/workflow.ts                     → core
types/config.ts                       → core (hook I/O types)
types/index.ts                        → REFACTOR: re-exports need updating
commands/spec/*                       → core (6 files)
commands/workflow/*                   → core (4 files)
commands/archive/*                    → core (4 files)
commands/hook/*                       → core (5 files)
commands/permissions/*                → core (4 files)
commands/config/*                     → core (7 files)
commands/version/*                    → core (4 files)
commands/scaffolding/engine.ts        → core (generic executor)
commands/scaffolding/apply.ts         → core (declarative spec runner)
commands/scaffolding/domain.ts        → core (domain population)
commands/scaffolding/handler.ts       → core (routing)
commands/scaffolding/index.ts         → core
commands/scaffolding/schema.ts        → core
commands/scaffolding/scaffold-spec.schema.json → core
```

#### tech-pack system (`plugins/sdd-fullstack-ts/system/src/`)

```
cli.ts                                → NEW: tech pack CLI entry point
commands/database/*                   → moved from core (10 files)
commands/contract/*                   → moved from core (5 files)
commands/env/*                        → moved from core (17 files + 5 provider files)
commands/scaffolding/project.ts       → moved from core (type→template mappings)
```

#### needs refactoring (split across both)

```
types/settings.ts                     → SPLIT:
                                        core: ComponentBase, SddMetadata, ProjectMetadata, SettingsFile, SystemSettings
                                        tech-pack: ServerSettings, WebappSettings, HelmSettings, DatabaseSettings,
                                                   ContractSettings, ComponentType union, type guards
types/component.ts                    → core (ComponentEntry is already generic — type is just a string)
settings/defaults.ts                  → tech-pack (all defaults are tech-specific)
settings/schema.ts                    → SPLIT: framework = core, component schemas = tech-pack registers
settings/validate.ts                  → core (generic validation engine)
settings/reconcile.ts                 → core (generic reconciliation engine)
settings/sync.ts                      → needs review
settings/sync-helm.ts                 → tech-pack (helm-specific sync)
settings/index.ts                     → core (re-exports)
commands/settings/*                   → core (handler + reconcile use generic engine)
```

---

## 8. Summary Counts

| Layer | Skills | Agents | Commands | CLI (own binary) | CLI Source Files |
|-------|--------|--------|----------|-------------------|-----------------|
| **sdd-core** | 16 | 0 | 3 | 9 top-level namespaces | ~50 |
| **sdd-fullstack-ts** | 20 | 7 | 0 | 3 action groups (scoped) | ~37 |
| **sdd (legacy)** | 36 | 7 | 3 | 11 namespaces (monolithic) | ~87 |
| **needs refactoring** | 2 | 0 | 0 | — | ~8 |

---

## 9. Key Refactoring Points

### 9.1 Settings Type System

**Current:** `ComponentType` is a fixed union (`'server' | 'webapp' | 'helm' | ...`). All components live in a flat `components` array.

**Target:** Core defines `ComponentBase` with `type: string`. Settings are namespaced per tech pack:

```yaml
# .sdd/sdd-settings.yaml

# Core envelope (owned by sdd-core)
sdd:
  initialized_by_plugin_version: "8.0.0"
  updated_by_plugin_version: "8.0.0"
  initialized_at: "2026-02-21 12:00:00Z"
  updated_at: "2026-02-21 12:00:00Z"

project:
  name: my-app
  description: "My application"

system:
  logging:
    enabled: true
    level: info

# Tech pack namespaced sections
tech_packs:
  fullstack-ts:
    components:
      - name: main-server
        type: server
        path: components/servers/main-server
        settings:
          server_type: api
          databases: [app-db]
      - name: app-db
        type: database
        path: components/databases/app-db
        settings:
          provider: postgresql
  # python-api:
  #   components:
  #     - name: ml-service
  #       type: server
  #       ...
```

- **Core owns** top-level keys (`sdd`, `project`, `system`)
- **Each tech pack owns** its section under `tech_packs.<name>`
- **No collisions** — two tech packs can both define `type: server` in separate namespaces
- **Validation** — core validates the envelope; delegates component validation to each tech pack's registered JSON schemas

### 9.2 Project Scaffolding

**Current:** `project.ts` has a `switch(component.type)` with hardcoded cases for each tech.

**Target:** `project.ts` moves to the tech pack. Core scaffolding engine (`engine.ts`) stays generic. When scaffolding a project, the core reads the active tech pack manifest to resolve:
- Template directories per component type
- Script definitions per component type
- Architecture description per component type

### 9.3 CLI Namespace Router

**Current:** `cli.ts` has a hardcoded `NAMESPACES` array and `COMMAND_HANDLERS` record.

**Target:** Core CLI defines its own top-level namespaces. When the first arg doesn't match a core namespace, the CLI reads `.sdd/tech-packs.yaml`, resolves the tech pack's CLI binary path from the manifest, and spawns it as a subprocess with remaining args.

```
sdd-system spec validate ...           → core handler (in-process)
sdd-system fullstack-ts database ...   → spawn tech pack CLI subprocess
sdd-system python-api alembic ...      → spawn different tech pack CLI subprocess
```

### 9.4 Component Discovery

**Current:** Outputs fixed component types (server, webapp, database, etc.).

**Target:** Outputs abstract roles ("needs persistence", "needs a UI", "needs an API contract"). Tech packs map roles to concrete component types via their manifest.

### 9.5 project-settings Skill

**Current:** Settings schema is hardcoded in the skill and in `sdd-settings.schema.json`.

**Target:** Core skill defines the settings envelope (`sdd`, `project`, `system` keys). The `tech_packs` key is a map of tech pack names to their data. Each tech pack's section contains a `components` array. Validation of component-specific settings is delegated to the tech pack's registered JSON schemas.

---

## 10. Compatibility Contract

### Contract surfaces

The compatibility contract between sdd-core and tech packs has these layers:

| # | Surface | Owner | Versioning impact |
|---|---------|-------|-------------------|
| 1 | **`tech-pack.yaml` manifest schema** | sdd-core defines, tech pack conforms | Breaking: new required fields. Additive: new optional fields. |
| 2 | **`.sdd/tech-packs.yaml` pointer schema** | sdd-core defines, tech pack writes entries | Breaking: renamed keys. Additive: new optional keys. |
| 3 | **`.sdd/sdd-settings.yaml` envelope** | sdd-core owns top-level keys; tech packs own their `tech_packs.<name>` section | Breaking: renamed top-level keys. Additive: new optional keys. |
| 4 | **CLI delegation protocol** | sdd-core spawns tech pack CLI | Breaking: changed arg format, changed exit codes. Additive: new global flags. |
| 5 | **Scaffolding engine operations** | sdd-core's `executeSpec()` | Breaking: removed operation type, changed semantics. Additive: new operation type. |
| 6 | **Skill/agent conventions** | sdd-core prompts reference tech pack skills by name patterns | Breaking: changed naming convention. Additive: new optional frontmatter fields. |
| 7 | **Directory conventions** | sdd-core expects `specs/`, `changes/`, `.sdd/` in user projects | Breaking: moved directories. Stable once established. |

### Versioning rules

sdd-core follows strict semver. The `requires_sdd_core` field in `tech-pack.yaml` is a semver range:

```yaml
# tech-pack.yaml
requires_sdd_core: ">=8.0.0 <9.0.0"
```

| Core version change | Meaning | Tech pack impact |
|---------------------|---------|------------------|
| **Patch** (8.0.0 → 8.0.1) | Bug fixes only. No contract changes. | None — always compatible. |
| **Minor** (8.0.0 → 8.1.0) | Additive changes. New optional manifest fields, new scaffolding operations, new optional settings keys. | None — old tech packs still work. New features available if tech pack opts in. |
| **Major** (8.x → 9.0.0) | Breaking contract changes. Required manifest fields added/renamed, CLI protocol changed, settings envelope restructured. | Tech pack must update and release a new version with `requires_sdd_core: ">=9.0.0"`. |

### Runtime validation

sdd-core validates compatibility at these points:

**1. Tech pack registration** (during project init or `sdd-system settings reconcile`):
- Read `.sdd/tech-packs.yaml`
- For each tech pack:
  - Follow `manifest` pointer to `tech-pack.yaml`
  - Parse `requires_sdd_core` — compare against core's own version
  - If **core version < minimum required** → error: "Tech pack X requires sdd-core >= Y, you have Z"
  - If **core version >= breaking boundary** (e.g., tech pack says `<9.0.0` but core is `9.1.0`) → warn: "Tech pack X may be incompatible with this core version"
  - Validate manifest against core's JSON schema for `tech-pack.yaml`
  - If missing required fields → error with specific field names
  - If unknown fields → ignore (forward compatibility)

**2. CLI delegation** (every time core spawns a tech pack CLI):
- Quick version check: read tech pack's `requires_sdd_core`, compare against core version
- If incompatible → error before spawning, don't execute stale/broken commands
- If compatible → spawn subprocess, forward exit code

**3. Settings reconciliation** (`sdd-system settings reconcile`):
- Core reconciles its own envelope (`sdd`, `project`, `system`)
- For each tech pack section under `tech_packs.<name>`:
  - Load the tech pack's registered component settings schemas
  - Validate each component's `settings` against its type's schema
  - Report validation errors scoped to the tech pack namespace
  - Tech pack version in `.sdd/tech-packs.yaml` vs tech pack's `tech-pack.yaml` → if mismatched, trigger tech pack-specific reconciliation

### Manifest JSON schema

sdd-core ships a JSON schema for `tech-pack.yaml` that tech pack authors can validate against:

```
plugins/sdd-core/schemas/tech-pack.schema.json
```

Required fields (v8.0.0):
- `name` (string) — tech pack identifier, used as CLI namespace
- `version` (string) — semver
- `requires_sdd_core` (string) — semver range

Optional fields:
- `component_types` (map) — keyed by type name
  - `description` (string)
  - `settings_schema` (string) — relative path to JSON schema
  - `scaffolding_skill` (string) — skill name
  - `standards_skill` (string) — skill name
  - `agent` (string) — agent name
  - `scripts` (map of string → string)
- `cli_actions` (map) — keyed by action group name
  - Array of action names (strings)
- `cli_entry_point` (string) — relative path to CLI binary (default: `system/dist/cli.js`)

---

## 11. What sdd-core Looks Like Alone

A project using only sdd-core (no tech pack) would get:

1. **Spec-driven workflow** — write specs, solicit requirements, decompose into changes
2. **Domain modeling** — glossary, entities, use-cases
3. **Change lifecycle** — epic/feature/bugfix/refactor with full phase gates
4. **Planning** — implementation plans from specs
5. **Project structure** — `specs/`, `changes/`, `.sdd/` directories
6. **Workflow enforcement** — phase gate checks, state tracking
7. **Hooks** — file write validation, prompt commit tracking
8. **Config management** — environment-based YAML config

It would NOT provide:
- Any scaffolding templates for actual code
- Any specialized agents (no backend-dev, frontend-dev, etc.)
- Any infrastructure management (no k8s, no helm)
- Any language/framework-specific standards

The user (or another plugin) would bring their own tech decisions and implementation approach. SDD-core provides the *methodology* — the discipline of speccing, planning, implementing, and reviewing.

---

## 11. Building Tech Packs with SDD

### Tech pack scaffolder

sdd-core includes a scaffolder that creates new tech pack projects. The scaffolded project is itself an SDD project — tech pack authors use sdd-core's own methodology to develop their packs.

```bash
# Inside a project with sdd-core installed
/sdd run create-techpack my-python-pack
```

This generates:

```
sdd-my-python-pack/
├── .claude-plugin/
│   └── plugin.json                    # Pre-filled Claude Code plugin manifest
├── tech-pack.yaml                     # Annotated manifest template (all fields documented)
├── CLAUDE.md                          # SDD project instructions (generated by sdd-core)
├── README.md                          # "How to build an SDD tech pack"
│
│  # ── SDD methodology structure (managed by sdd-core) ──
├── specs/
│   ├── SNAPSHOT.md
│   ├── domain/
│   │   ├── glossary.md
│   │   ├── definitions/
│   │   └── use-cases/
│   └── architecture/
├── changes/
│   └── INDEX.md
├── .sdd/
│   └── sdd-settings.yaml
│
│  # ── Tech pack content (what the author fills in) ──
├── skills/
│   └── components/
│       └── example-component/
│           ├── example-standards/
│           │   └── SKILL.md           # Template with required sections
│           └── example-scaffolding/
│               ├── SKILL.md
│               ├── schemas/
│               │   ├── input.schema.json
│               │   └── output.schema.json
│               └── templates/         # Add scaffolding template files here
├── agents/
│   └── example-dev.md                 # Template showing required frontmatter
├── system/                            # Tech pack CLI (optional, for CLI actions)
│   ├── src/
│   │   ├── cli.ts                     # Minimal CLI router
│   │   └── commands/
│   │       └── example/
│   │           └── handler.ts         # Shows how to wire a command
│   ├── package.json
│   └── tsconfig.json
└── schemas/                           # JSON Schemas for component settings
    └── example-settings.json          # Template for component settings validation
```

### Dogfooding: tech packs are SDD projects

Because the scaffolded project includes `specs/`, `changes/`, `.sdd/`, and `CLAUDE.md`, the tech pack author installs sdd-core and uses it to:

1. **Write specs** for their component types, standards, and agents
2. **Plan implementations** — break work into changes with phase gates
3. **Track workflow** — spec → plan → implement → review for each piece of the tech pack
4. **Use domain modeling** — define a glossary of their tech stack concepts

The tech pack itself has no dependency on sdd-core at build time or runtime. It's just a Claude Code plugin with a `tech-pack.yaml`. sdd-core is used purely as a development methodology tool during authoring.

### Tech pack author workflow

1. Scaffold: `/sdd run create-techpack my-python-pack`
2. Install sdd-core in the new project (as a dev tool)
3. Write specs for each component type (e.g., "Python FastAPI server component")
4. Implement skills, agents, CLI commands, templates following SDD workflow
5. Fill in `tech-pack.yaml` manifest
6. Test: install the tech pack alongside sdd-core in a real project
7. Publish as a Claude Code plugin

### Zero dependencies

The tech pack has **no code dependency** on sdd-core or any SDK:
- Its CLI is standalone TypeScript (or any language — the core just spawns it as a subprocess)
- Its skills/agents are plain markdown files following Claude Code plugin conventions
- Its `tech-pack.yaml` is a YAML file conforming to a documented schema
- The only "contract" is the manifest format — everything else is convention

### What a tech pack provides

A tech pack plugin (e.g., `sdd-fullstack-ts`) is a separate Claude Code plugin that:

1. **Is an independent repo/plugin** — no code dependency on sdd-core
2. **Registers via manifest** — `tech-pack.yaml` is the source of truth; pointer added to `.sdd/tech-packs.yaml` in user projects during init
3. **Provides component types** — declares what kinds of components it supports (server, webapp, database, etc.)
4. **Ships skills** — standards + scaffolding skills for each component type
5. **Ships agents** — specialized implementation agents (backend-dev, frontend-dev, etc.)
6. **Ships its own CLI binary** (optional) — handles scoped actions under `sdd-system <pack-name> <action>`
7. **Provides templates** — scaffolding templates for its component types
8. **Declares core compatibility** — `requires_sdd_core: ">=8.0.0"`

### First-party tech pack: sdd-fullstack-ts

Lives in this repo at `plugins/sdd-fullstack-ts/` as the reference implementation:

```
sdd-fullstack-ts/
├── .claude-plugin/
│   └── plugin.json                    # Claude Code plugin manifest
├── tech-pack.yaml                     # SDD registration manifest (source of truth)
├── skills/
│   ├── typescript-standards/          # Language standards
│   ├── testing-standards/             # Testing methodology
│   ├── unit-testing/                  # Unit test patterns
│   ├── components/
│   │   ├── backend/
│   │   │   ├── backend-standards/     # CMDO architecture
│   │   │   └── backend-scaffolding/   # Server boilerplate + templates
│   │   ├── frontend/
│   │   │   ├── frontend-standards/    # MVVM + TanStack
│   │   │   └── frontend-scaffolding/  # React/Vite boilerplate + templates
│   │   ├── database/
│   │   │   ├── database-standards/    # Migration patterns
│   │   │   ├── database-scaffolding/  # PostgreSQL setup + templates
│   │   │   └── postgresql/            # SQL reference
│   │   ├── contract/
│   │   │   ├── contract-standards/    # OpenAPI rules
│   │   │   └── contract-scaffolding/  # Contract boilerplate + templates
│   │   ├── helm/
│   │   │   ├── helm-standards/        # Chart patterns
│   │   │   └── helm-scaffolding/      # Chart templates (server/webapp/umbrella)
│   │   ├── config/
│   │   │   ├── config-standards/      # Config management
│   │   │   └── config-scaffolding/    # Config templates
│   │   ├── cicd/
│   │   │   └── cicd-standards/        # GitHub Actions
│   │   ├── e2e-testing/
│   │   │   └── e2e-testing/           # Playwright patterns
│   │   └── integration-testing/
│   │       └── integration-testing/   # API testing
│   └── orchestrators/
│       └── local-env-orchestration/   # K8s local env workflow
├── agents/
│   ├── api-designer.md
│   ├── backend-dev.md
│   ├── frontend-dev.md
│   ├── db-advisor.md
│   ├── devops.md
│   ├── tester.md
│   └── reviewer.md
├── system/                            # Tech pack CLI (separate binary)
│   ├── src/
│   │   ├── cli.ts                     # Entry point: routes action groups
│   │   ├── commands/
│   │   │   ├── database/              # setup, teardown, migrate, seed, ...
│   │   │   ├── contract/              # generate-types, validate
│   │   │   └── env/                   # create, destroy, deploy, ...
│   │   └── scaffolding/
│   │       └── project.ts             # Component type → template mapping
│   ├── package.json
│   └── tsconfig.json
└── schemas/                           # Settings schemas for component types
    ├── server-settings.json
    ├── webapp-settings.json
    ├── database-settings.json
    ├── contract-settings.json
    └── helm-settings.json
```

---

## 12. Migration Path

### Phase 1: Create directory structure
- Create `plugins/` directory
- Copy current `plugin/` → `plugins/sdd/` (unchanged, backwards compat)
- Create `plugins/sdd-core/` and `plugins/sdd-fullstack-ts/` (empty shells)

### Phase 2: Extract sdd-core
- Copy core skills, commands, hooks to `plugins/sdd-core/`
- Copy core CLI source files to `plugins/sdd-core/system/`
- Add tech pack discovery logic to core CLI
- Create core `plugin.json`

### Phase 3: Extract tech pack
- Copy opinionated skills, agents to `plugins/sdd-fullstack-ts/`
- Copy tech-specific CLI commands to `plugins/sdd-fullstack-ts/system/`
- Create tech pack CLI entry point
- Create `tech-pack.yaml` manifest
- Create component settings JSON schemas
- Create tech pack `plugin.json`

### Phase 4: Refactor shared boundaries
- Split `settings.ts` types (core envelope vs tech-specific component settings)
- Make `project.ts` scaffolding read from tech pack manifest
- Make settings validation delegate to tech pack schemas
- Refactor `component-discovery` to output abstract roles

### Phase 5: Validate
- Test sdd-core standalone (no tech pack) — workflow should work
- Test sdd-core + sdd-fullstack-ts — should match current monolithic behavior
- Test legacy `plugins/sdd/` — should still work unchanged
- Update build scripts in root `package.json`
