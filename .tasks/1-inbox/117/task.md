---
id: 117
title: Generic scaffolding engine in system CLI
priority: high
status: open
created: 2026-02-10
depends_on: []
blocks: []
---

# Task 117: Generic scaffolding engine in system CLI

## Description

Create a generic, declarative scaffolding engine in the system CLI that component skills can invoke with different configurations. Instead of duplicating the same copy-templates-substitute-variables pattern across multiple CLI commands or leaving deterministic file operations in skill prompts, build one engine that accepts a declarative "scaffold spec" and executes it.

Skills remain the domain experts (they know what a backend component needs, which files are conditional on settings). The CLI owns the execution (template copying, variable substitution, conditional evaluation, package.json script addition, non-destructive checks).

## Current State

- `scaffolding project` in `project.ts` (~900 lines) already handles bulk project scaffolding — directories, template copying, variable substitution, npm scripts
- 6 component-specific scaffolding skills describe settings-driven conditional logic in prose (backend, frontend, config, contract, database, helm)
- The conditional logic is deterministic (no LLM judgment needed) but currently executed by the LLM reading skill descriptions

---

## Scaffolding DSL Specification

### Top-Level Spec Schema

```json
{
  "target_dir": "/absolute/path/to/project",
  "base_dir": "/absolute/path/to/plugin/skills",
  "variables": {
    "PROJECT_NAME": "my-app",
    "SERVER_NAME": "task-service"
  },
  "context": {
    "has_databases": true,
    "has_provides_contracts": true,
    "server_type": "api"
  },
  "operations": [...]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `target_dir` | string | yes | Absolute path to project root. All `dest`/`path` fields are relative to this. |
| `base_dir` | string | yes | Absolute path to skills directory. All `source` fields are relative to this. |
| `variables` | object | yes | Key-value pairs for template variable substitution (`{{KEY}}` → value). |
| `context` | object | no | Key-value pairs for `when` condition evaluation. Skills pre-compute these from settings. |
| `operations` | array | yes | Ordered list of operations to execute. |

### Variable Substitution

Variables use `{{VARIABLE_NAME}}` syntax. Substitution is applied to file **contents** only (not paths) for these extensions: `.md`, `.json`, `.yaml`, `.yml`, `.ts`, `.tsx`, `.html`, `.css`, `.js`, `.sql`. Binary and other files are copied as-is.

`write_file` content also supports variable substitution.

**Built-in variable:** The engine provides `{{DATE}}` (current date in YYYY-MM-DD format) automatically. Used by project-scaffolding (SNAPSHOT.md, INDEX.md) and database-scaffolding (migration/seed files). All other variables must be provided in the `variables` field.

**Derived variables:** Some variables are computed from component relationships. For example, `{{CONTRACT_PACKAGE}}` is `@project-name/contract-name` — derived from a component's `depends_on` field. Skills compute these and pass them as regular entries in `variables`.

### Condition System (`when`)

Operations can include an optional `when` field. If present, the operation is only executed when the condition evaluates to true.

**Single condition:**
```json
"when": { "key": "has_databases", "equals": true }
```

**Multiple conditions (AND — all must be true):**
```json
"when": [
  { "key": "has_api_mode", "equals": true },
  { "key": "has_provides_contracts", "equals": true }
]
```

**Supported operators:**

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Exact value match | `{ "key": "server_type", "equals": "api" }` |
| `not_empty` | Array/string is non-empty | `{ "key": "databases", "not_empty": true }` |

Values in `key` are resolved from the spec's `context` object. If a key is not found in `context`, the condition evaluates to false.

**Design note:** Complex domain logic (e.g., Helm's "if hybrid AND has api mode AND provides contracts → needs service.yaml") is pre-computed by the skill into simple boolean flags in `context`. The engine only evaluates flat conditions — no nested logic, no expression language.

### Non-Destructive Semantics

All file-creating operations (`template_dir`, `template_file`, `write_file`) **skip existing files** by default. If a file already exists at the destination, it is not overwritten. The engine logs skipped files in its output.

`mkdir` is always safe (creates if missing, no-op if exists).

`package_json_scripts` **merges** — it adds new scripts but does not overwrite existing script entries.

---

### Operation Types

#### 1. `template_dir`

Copy an entire directory of template files with variable substitution.

```json
{
  "type": "template_dir",
  "source": "components/backend/backend-scaffolding/templates",
  "dest": "components/servers/task-service"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source` | string | yes | Directory path relative to `base_dir`. |
| `dest` | string | yes | Directory path relative to `target_dir`. |
| `when` | condition | no | Conditional execution. |

Behavior:
- Recursively walks `source` directory
- For each file, creates corresponding file under `dest`
- Applies variable substitution to supported file extensions
- Copies non-substitutable files as-is
- Creates intermediate directories as needed
- Skips files that already exist at destination

#### 2. `template_file`

Copy a single template file with variable substitution.

```json
{
  "type": "template_file",
  "source": "components/helm/helm-scaffolding/templates-server/templates/ingress.yaml",
  "dest": "components/helm-charts/task-service/templates/ingress.yaml"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source` | string | yes | File path relative to `base_dir`. |
| `dest` | string | yes | File path relative to `target_dir`. |
| `when` | condition | no | Conditional execution. |

Behavior:
- Same substitution rules as `template_dir` but for a single file
- Creates parent directories as needed
- Skips if destination file already exists

#### 3. `mkdir`

Create a directory, optionally with a `.gitkeep` file.

```json
{
  "type": "mkdir",
  "path": "components/servers/task-service/src/dal",
  "gitkeep": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | yes | Directory path relative to `target_dir`. |
| `gitkeep` | boolean | no | If true, creates `.gitkeep` inside the directory. Default: false. |
| `when` | condition | no | Conditional execution. |

#### 4. `write_file`

Write a file with literal content (with variable substitution).

```json
{
  "type": "write_file",
  "path": ".gitignore",
  "content": "node_modules/\ndist/\n.env\n"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | yes | File path relative to `target_dir`. |
| `content` | string | yes | File content. `{{VARIABLE}}` placeholders are substituted. |
| `when` | condition | no | Conditional execution. |

Behavior:
- Applies variable substitution to `content`
- Creates parent directories as needed
- Skips if file already exists

#### 5. `package_json_scripts`

Merge scripts into the root `package.json`.

```json
{
  "type": "package_json_scripts",
  "scripts": {
    "task-service:dev": "npm run dev -w @my-app/task-service",
    "task-service:build": "npm run build -w @my-app/task-service",
    "task-service:start": "npm run start -w @my-app/task-service",
    "task-service:test": "npm run test -w @my-app/task-service"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scripts` | object | yes | Key-value pairs to merge into `package.json` scripts. |
| `when` | condition | no | Conditional execution. |

Behavior:
- Reads `target_dir/package.json`
- Merges `scripts` into the existing `scripts` field
- Does NOT overwrite existing script entries (merge-only)
- Writes back formatted JSON
- Fails gracefully if `package.json` doesn't exist (logs warning, continues)

---

### CLI Interface

```bash
# Apply a scaffold spec
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding apply --spec spec.json

# Dry run (show what would be created without writing)
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding apply --spec spec.json --dry-run
```

### Engine Output

```json
{
  "success": true,
  "created": {
    "files": ["components/servers/task-service/package.json", "..."],
    "dirs": ["components/servers/task-service/src/dal/"],
    "scripts": ["task-service:dev", "task-service:build"]
  },
  "skipped": ["components/servers/task-service/package.json"],
  "summary": "Created 12 files, 6 directories, 4 scripts. Skipped 1 existing."
}
```

---

### Example Specs

#### Backend Server (Tier 2 — conditional)

The skill reads `sdd-settings.yaml`, pre-computes boolean flags, and emits:

```json
{
  "target_dir": "/path/to/project",
  "base_dir": "/path/to/plugin/skills",
  "variables": {
    "PROJECT_NAME": "my-app",
    "SERVER_NAME": "task-service",
    "CONTRACT_PACKAGE": "@my-app/public-api"
  },
  "context": {
    "has_databases": true,
    "has_provides_contracts": true,
    "has_consumes_contracts": false
  },
  "operations": [
    {
      "type": "template_dir",
      "source": "components/backend/backend-scaffolding/templates",
      "dest": "components/servers/task-service"
    },
    {
      "type": "mkdir",
      "path": "components/servers/task-service/src/dal",
      "when": { "key": "has_databases", "equals": true }
    },
    {
      "type": "mkdir",
      "path": "components/servers/task-service/src/controller/http_handlers",
      "when": { "key": "has_provides_contracts", "equals": true }
    },
    {
      "type": "package_json_scripts",
      "scripts": {
        "task-service:dev": "npm run dev -w @my-app/task-service",
        "task-service:build": "npm run build -w @my-app/task-service",
        "task-service:start": "npm run start -w @my-app/task-service",
        "task-service:test": "npm run test -w @my-app/task-service"
      }
    }
  ]
}
```

#### Frontend Webapp (Tier 1 — no conditionals)

```json
{
  "target_dir": "/path/to/project",
  "base_dir": "/path/to/plugin/skills",
  "variables": {
    "PROJECT_NAME": "my-app"
  },
  "operations": [
    {
      "type": "template_dir",
      "source": "components/frontend/frontend-scaffolding/templates",
      "dest": "components/webapps/admin-dashboard"
    },
    {
      "type": "package_json_scripts",
      "scripts": {
        "admin-dashboard:dev": "npm run dev -w @my-app/admin-dashboard",
        "admin-dashboard:build": "npm run build -w @my-app/admin-dashboard",
        "admin-dashboard:preview": "npm run preview -w @my-app/admin-dashboard",
        "admin-dashboard:test": "npm run test -w @my-app/admin-dashboard"
      }
    }
  ]
}
```

#### Contract (Tier 1 — no conditionals)

```json
{
  "target_dir": "/path/to/project",
  "base_dir": "/path/to/plugin/skills",
  "variables": {
    "PROJECT_NAME": "my-app"
  },
  "operations": [
    {
      "type": "template_dir",
      "source": "components/contract/contract-scaffolding/templates",
      "dest": "components/contracts/public-api"
    },
    {
      "type": "write_file",
      "path": "components/contracts/public-api/.gitignore",
      "content": "node_modules/\ngenerated/\n"
    }
  ]
}
```

#### Database (Tier 1 — no conditionals)

```json
{
  "target_dir": "/path/to/project",
  "base_dir": "/path/to/plugin/skills",
  "variables": {
    "PROJECT_NAME": "my-app"
  },
  "operations": [
    {
      "type": "template_dir",
      "source": "components/database/database-scaffolding/templates",
      "dest": "components/databases/primary-db"
    }
  ]
}
```

#### Helm Chart — Server (Tier 2 — conditional template selection)

The skill pre-computes deployment flags from Helm + server settings:

```json
{
  "target_dir": "/path/to/project",
  "base_dir": "/path/to/plugin/skills",
  "variables": {
    "PROJECT_NAME": "my-app",
    "CHART_NAME": "task-service",
    "CHART_DESCRIPTION": "Helm chart for task-service",
    "DEPLOYS_COMPONENT": "task-service",
    "IS_HYBRID": "false",
    "HAS_SERVICE": "true",
    "HAS_INGRESS": "true"
  },
  "context": {
    "deploy_type": "server",
    "is_hybrid": false,
    "is_cron_only": false,
    "has_api_mode": true,
    "has_worker_mode": false,
    "has_cron_mode": false,
    "needs_service": true,
    "has_ingress": true
  },
  "operations": [
    {
      "type": "template_file",
      "source": "components/helm/helm-scaffolding/templates-server/Chart.yaml",
      "dest": "components/helm-charts/task-service/Chart.yaml"
    },
    {
      "type": "template_file",
      "source": "components/helm/helm-scaffolding/templates-server/values.yaml",
      "dest": "components/helm-charts/task-service/values.yaml"
    },
    {
      "type": "template_file",
      "source": "components/helm/helm-scaffolding/templates-server/templates/_helpers.tpl",
      "dest": "components/helm-charts/task-service/templates/_helpers.tpl"
    },
    {
      "type": "template_file",
      "source": "components/helm/helm-scaffolding/templates-server/templates/configmap.yaml",
      "dest": "components/helm-charts/task-service/templates/configmap.yaml"
    },
    {
      "type": "template_file",
      "source": "components/helm/helm-scaffolding/templates-server/templates/servicemonitor.yaml",
      "dest": "components/helm-charts/task-service/templates/servicemonitor.yaml"
    },
    {
      "type": "template_file",
      "source": "components/helm/helm-scaffolding/templates-server/templates/deployment.yaml",
      "dest": "components/helm-charts/task-service/templates/deployment.yaml",
      "when": [
        { "key": "is_hybrid", "equals": false },
        { "key": "is_cron_only", "equals": false }
      ]
    },
    {
      "type": "template_file",
      "source": "components/helm/helm-scaffolding/templates-server/templates/deployment-api.yaml",
      "dest": "components/helm-charts/task-service/templates/deployment-api.yaml",
      "when": { "key": "has_api_mode", "equals": true }
    },
    {
      "type": "template_file",
      "source": "components/helm/helm-scaffolding/templates-server/templates/deployment-worker.yaml",
      "dest": "components/helm-charts/task-service/templates/deployment-worker.yaml",
      "when": { "key": "has_worker_mode", "equals": true }
    },
    {
      "type": "template_file",
      "source": "components/helm/helm-scaffolding/templates-server/templates/cronjob.yaml",
      "dest": "components/helm-charts/task-service/templates/cronjob.yaml",
      "when": { "key": "has_cron_mode", "equals": true }
    },
    {
      "type": "template_file",
      "source": "components/helm/helm-scaffolding/templates-server/templates/service.yaml",
      "dest": "components/helm-charts/task-service/templates/service.yaml",
      "when": { "key": "needs_service", "equals": true }
    },
    {
      "type": "template_file",
      "source": "components/helm/helm-scaffolding/templates-server/templates/ingress.yaml",
      "dest": "components/helm-charts/task-service/templates/ingress.yaml",
      "when": { "key": "has_ingress", "equals": true }
    },
    {
      "type": "package_json_scripts",
      "scripts": {
        "task-service:lint": "helm lint components/helm-charts/task-service"
      }
    }
  ]
}
```

#### Project Structure (Tier 1 — used by scaffolding project)

```json
{
  "target_dir": "/path/to/project",
  "base_dir": "/path/to/plugin/skills",
  "variables": {
    "PROJECT_NAME": "my-app",
    "PROJECT_DESCRIPTION": "My application",
    "PRIMARY_DOMAIN": "Task Management"
  },
  "operations": [
    {
      "type": "template_file",
      "source": "project-scaffolding/templates/project/package.json",
      "dest": "package.json"
    },
    {
      "type": "template_file",
      "source": "project-scaffolding/templates/project/README.md",
      "dest": "README.md"
    },
    {
      "type": "template_file",
      "source": "project-scaffolding/templates/project/CLAUDE.md",
      "dest": "CLAUDE.md"
    },
    {
      "type": "write_file",
      "path": ".gitignore",
      "content": "node_modules/\ndist/\nbuild/\n*.tsbuildinfo\n.idea/\n.vscode/\n*.swp\n.DS_Store\nThumbs.db\n.env\n.env.local\n.env.*.local\n*.log\nlogs/\ncoverage/\n"
    },
    {
      "type": "write_file",
      "path": ".claudeignore",
      "content": "archive/\n"
    },
    {
      "type": "template_file",
      "source": "project-scaffolding/templates/specs/SNAPSHOT.md",
      "dest": "specs/SNAPSHOT.md"
    },
    {
      "type": "template_file",
      "source": "project-scaffolding/templates/specs/glossary.md",
      "dest": "specs/domain/glossary.md"
    },
    {
      "type": "template_file",
      "source": "project-scaffolding/templates/changes/INDEX.md",
      "dest": "changes/INDEX.md"
    },
    {
      "type": "mkdir",
      "path": "specs/domain/definitions",
      "gitkeep": true
    },
    {
      "type": "mkdir",
      "path": "specs/domain/use-cases",
      "gitkeep": true
    },
    {
      "type": "mkdir",
      "path": "specs/architecture",
      "gitkeep": true
    },
    {
      "type": "mkdir",
      "path": "archive",
      "gitkeep": true
    }
  ]
}
```

---

## Key Design Decisions

1. **Spec format** — declarative JSON with simple conditionals (`equals`, `not_empty`)
2. **Engine primitives** — extracted from existing `project.ts` (template copying, variable substitution, directory creation, file writing, script merging)
3. **Non-destructive** — skip existing files by default (already implemented in project.ts)
4. **Context, not settings** — the engine does NOT read `sdd-settings.yaml`. Skills pre-compute all needed values into `context` (boolean flags, enum values). This keeps the engine generic and decoupled from SDD project structure.
5. **No meta-scripts** — drop the cross-component `dev`/`build`/`test`/`start` meta-scripts entirely. Each component spec is self-contained, only adding its own scripts. Eliminates `npm-run-all` dependency and the `generateMetaScripts` logic.
6. **No `for_each`** — not needed. Component-level iteration (scaffold each server, each webapp) is the orchestrator's job — it calls the engine once per component. Within a single component, all patterns are simple conditionals: a backend has at most one DAL, serves at most one contract (one per type in the future: OpenAPI, AsyncAPI), consumes contracts as a boolean condition. Config section generation is Tier 3 (skill builds content, engine writes it).
7. **AND conditions only** — `when` as an array means all conditions must be true. No OR, no nesting. Complex logic is pre-computed by the skill into simple boolean flags.
8. **Dry-run support** — `--dry-run` returns the same output structure without creating files.
9. **One built-in variable** — `{{DATE}}` is provided by the engine (YYYY-MM-DD). All other variables are computed by skills and passed explicitly.
10. **Domain population is out of scope** — `scaffolding domain` (entity stubs, glossary, SNAPSHOT updates) stays as its own CLI command. It's content generation with deduplication logic, not file scaffolding.
11. **Settings sync uses the same engine** — when `/sdd-settings` changes settings, the command diffs old vs new, determines affected artifacts, and emits a narrow spec covering only the incremental changes. The engine is the same; the spec is just smaller.

## Invocation Pattern (Migration)

**Current flow:** Skills describe scaffolding in prose → LLM reads skill → LLM creates files directly.

**New flow:** Skills define a spec (or instruct the LLM how to build one from context) → LLM invokes CLI with spec → engine creates files deterministically.

**Consumers of the engine:**
- `/sdd-init` Phase 3 → emits project structure spec + config component spec
- `/sdd-change new` Step 5 → emits per-component specs for each missing component
- `/sdd-settings` sync → emits narrow spec for incremental changes only
- `scaffolding project` (existing CLI) → refactored internally to use engine

## Complexity Tiers

### Tier 1: Straightforward (engine handles directly)
- **Frontend** — `template_dir` + `package_json_scripts`
- **Contract** — `template_dir` + `write_file` (.gitignore)
- **Database** — `template_dir` only
- **Project structure** — `template_file` + `write_file` + `mkdir`

### Tier 2: Conditional (engine handles with `when`)
- **Backend** — base `template_dir` always, `mkdir` for DAL/handlers conditional on `has_databases`/`has_provides_contracts`
- **Helm** — individual `template_file` operations per chart file, each with `when` conditions based on pre-computed deployment flags

### Tier 3: Dynamic generation (skills handle, engine assists)
- **Config sections** — generated dynamically per component from settings (not template-based). Skills build the YAML content, pass it via `write_file` with append-only semantics.
- **Architecture overview** — generated from component list. Skill builds content, passes via `write_file`.

## Out of Scope

These remain separate concerns, not handled by the engine:

- **Domain population** (`scaffolding domain`) — entity/use-case stubs, glossary updates, SNAPSHOT updates. Stays as its own CLI command.
- **Settings diffing** — determining what changed when settings are modified. Handled by the command/skill that invokes the engine.
- **Config section generation logic** — determining what YAML to write for a server's config section. Skill computes the content, engine writes it via `write_file`.
- **Pluralization** — `server` → `servers/`, `helm` → `helm-charts/`. Orchestrator resolves paths before building the spec.
- **Component discovery** — deciding which components are needed. Handled by `/sdd-change` workflow.

## Acceptance Criteria

- [ ] Generic scaffolding engine extracted from project.ts into shared module
- [ ] Declarative spec schema defined (JSON Schema)
- [ ] `scaffolding apply --spec spec.json` command works
- [ ] `scaffolding apply --spec spec.json --dry-run` command works
- [ ] All operation types implemented: `template_dir`, `template_file`, `mkdir`, `write_file`, `package_json_scripts`
- [ ] Conditional operations work (`when` with `equals` and `not_empty`, single and AND)
- [ ] `scaffolding project` refactored to use the engine internally
- [ ] Meta-scripts removed from project scaffolding
- [ ] Component skills updated to emit specs instead of describing file creation in prose
- [ ] Non-destructive behavior preserved (skip existing files)
- [ ] Existing tests pass, new tests cover the engine
