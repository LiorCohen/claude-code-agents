---
name: scaffolding
description: Orchestrates project scaffolding using component-specific scaffolding skills.
user-invocable: false
---

# Scaffolding Skill

Orchestrates project scaffolding by delegating to component-specific scaffolding skills.

## Architecture

This skill coordinates multiple component scaffolding skills:

| Skill | Purpose |
|-------|---------|
| `project-scaffolding` | Root files, specs |
| `config-scaffolding` | Config component (mandatory) |
| `backend-scaffolding` | Server components (CMDO) |
| `frontend-scaffolding` | Webapp components (MVVM) |
| `contract-scaffolding` | OpenAPI contract |
| `database-scaffolding` | PostgreSQL database |
| `helm-scaffolding` | Helm charts for K8s deployment |

## When to Use

Use this skill when you need to create the SDD project structure after the user has approved the project configuration.

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts project name, target directory, component list, and optional description, domain, and skills directory.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns success status, list of scaffolded components, and next steps.

## Scaffolding Engine

All scaffolding operations are executed by the generic scaffolding engine. Component skills define a declarative JSON spec that the engine executes.

### Invocation

```bash
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding apply --spec <path-to-spec.json> [--dry-run]
```

### Spec Format

```json
{
  "target_dir": "<project-root>",
  "base_dir": "<plugin-root>/skills",
  "variables": { "PROJECT_NAME": "my-app", "...": "..." },
  "context": { "has_databases": true, "...": "..." },
  "operations": [
    { "type": "template_dir", "source": "...", "dest": "..." },
    { "type": "template_file", "source": "...", "dest": "...", "when": { "key": "flag", "equals": true } },
    { "type": "mkdir", "path": "...", "gitkeep": true },
    { "type": "write_file", "path": "...", "content": "...", "if_exists": "skip" },
    { "type": "package_json_scripts", "scripts": { "name:dev": "..." } }
  ]
}
```

### Workflow

For each component to scaffold:

1. **Compute context flags** from component settings (e.g., `has_databases`, `has_ingress`)
2. **Build a spec JSON** following the component skill's documented spec format
3. **Write the spec** to a temp file
4. **Invoke the engine** with `scaffolding apply --spec <path>`
5. **For hybrid components** (e.g., config): run the engine for base structure, then compute dynamic content and invoke additional `write_file` operations

See each component's `SKILL.md` for the complete spec format and context flag derivation.

## Project Scaffolding

The `scaffolding project` command uses the engine internally — it builds a spec from the project config and executes it.

```bash
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding project --config <config.json>
```

## Usage

After gathering project configuration in `/sdd-init`, run `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding project` with a config JSON file containing the project settings. The config must include:

```json
{
    "project_name": "<user-provided-name>",
    "project_description": "<user-provided-description>",
    "primary_domain": "<user-provided-domain>",
    "target_dir": "<absolute-path-to-project-directory>",
    "components": [
        {"type": "config", "name": "config"},
        {"type": "contract", "name": "task-api"},
        {"type": "server", "name": "task-service"},
        {"type": "webapp", "name": "task-dashboard"},
        {"type": "testing", "name": "testing"},
        {"type": "cicd", "name": "cicd"}
    ],
    "skills_dir": "<path-to-plugin>/skills"
}
```

## Config Fields

| Field | Required | Description |
|-------|----------|-------------|
| `project_name` | Yes | Project name (used for variable substitution) |
| `project_description` | No | Brief description (defaults to "A {name} project") |
| `primary_domain` | No | Primary business domain (defaults to "General") |
| `target_dir` | Yes | Absolute path to create project in |
| `components` | Yes | List of components to create (config is mandatory, always first) |
| `skills_dir` | Yes | Path to the skills directory (templates are colocated) |

## Component Format

Components are specified as a list of objects with `type` and `name` (both required):

```yaml
components:
  - type: config
    name: config                     # -> components/config/ (MANDATORY)
  - type: contract
    name: task-api                   # -> components/contracts/task-api/
  - type: server
    name: task-service               # -> components/servers/task-service/
  - type: webapp
    name: task-dashboard             # -> components/webapps/task-dashboard/
  - type: database
    name: task-db                    # -> components/databases/task-db/
  - type: helm
    name: task-service               # -> components/helm-charts/task-service/
  - type: testing
    name: e2e                        # -> components/testing/e2e/
  - type: cicd
    name: github                     # -> components/cicds/github/
```

**Multiple instances of the same type:**
```yaml
components:
  - type: config
    name: config                      # Always exactly one config
  - type: server
    name: order-service               # -> components/servers/order-service/
  - type: server
    name: notification-worker         # -> components/servers/notification-worker/
  - type: webapp
    name: admin-portal                # -> components/webapps/admin-portal/
  - type: webapp
    name: customer-app                # -> components/webapps/customer-app/
```

### Directory Naming

| Component | Directory Created |
|-----------|-------------------|
| `{type: config, name: config}` | `components/config/` |
| `{type: server, name: main}` | `components/servers/main/` |
| `{type: server, name: order-service}` | `components/servers/order-service/` |
| `{type: webapp, name: admin-portal}` | `components/webapps/admin-portal/` |
| `{type: contract, name: public-api}` | `components/contracts/public-api/` |
| `{type: helm, name: main}` | `components/helm-charts/main/` |

### Rules

- Both `type` and `name` are ALWAYS required
- Names must be lowercase, hyphens allowed, no spaces
- Directory structure is `components/{type-plural}/{name}/`
- Config component is **mandatory** - exactly one at `components/config/`

## Available Components

| Component | Scaffolding Skill | Multiple Instances |
|-----------|-------------------|-------------------|
| `config` | `config-scaffolding` | No (mandatory singleton) |
| `contract` | `contract-scaffolding` | Yes |
| `server` | `backend-scaffolding` | Yes |
| `webapp` | `frontend-scaffolding` | Yes |
| `database` | `database-scaffolding` | Yes |
| `helm` | `helm-scaffolding` | Yes |
| `testing` | (inline) | Yes |
| `cicd` | (inline) | Yes |

## Component Presets

**Full-Stack Application (default):**
```yaml
- {type: config, name: config}
- {type: contract, name: task-api}
- {type: server, name: task-service}
- {type: webapp, name: task-dashboard}
- {type: database, name: task-db}
- {type: testing, name: testing}
- {type: cicd, name: cicd}
```

**Backend API Only:**
```yaml
- {type: config, name: config}
- {type: contract, name: task-api}
- {type: server, name: task-service}
- {type: testing, name: testing}
- {type: cicd, name: cicd}
```

**Frontend Only:**
```yaml
- {type: config, name: config}
- {type: webapp, name: task-dashboard}
- {type: testing, name: testing}
- {type: cicd, name: cicd}
```

**Multi-Backend:**
```yaml
- {type: config, name: config}
- {type: contract, name: order-api}
- {type: server, name: order-service}
- {type: server, name: notification-worker}
- {type: testing, name: testing}
- {type: cicd, name: cicd}
```

**Multi-Frontend:**
```yaml
- {type: config, name: config}
- {type: contract, name: storefront-api}
- {type: server, name: storefront-service}
- {type: webapp, name: admin-portal}
- {type: webapp, name: customer-app}
- {type: testing, name: testing}
- {type: cicd, name: cicd}
```

**Backend with Database:**
```yaml
- {type: config, name: config}
- {type: contract, name: inventory-api}
- {type: server, name: inventory-service}
- {type: database, name: inventory-db}
- {type: testing, name: testing}
- {type: cicd, name: cicd}
```

**Full-Stack with Helm Deployment:**
```yaml
- {type: config, name: config}
- {type: contract, name: task-api}
- {type: server, name: task-service}
- {type: webapp, name: task-dashboard}
- {type: database, name: task-db}
- {type: helm, name: task-service}
- {type: testing, name: testing}
- {type: cicd, name: cicd}
```

## Scaffolding Order

The script executes in this order:

1. **Project scaffolding** - Root files, specs (always first)
2. **Config scaffolding** - Config component at `components/config/` (always second, mandatory)
3. **Contract scaffolding** - OpenAPI spec (if selected)
4. **Backend scaffolding** - Server components (for each instance)
5. **Frontend scaffolding** - Webapp components (for each instance)
6. **Database scaffolding** - Migrations, seeds, scripts (if selected)
7. **Helm scaffolding** - Kubernetes deployment charts (for each instance)
8. **Infrastructure** - Testing, CI/CD (inline, if selected)

## After Scaffolding

1. **Initialize git** (if not already in a repo):
   ```bash
   cd <project-dir> && git init && git add . && git commit -m "Initial project setup"
   ```

2. **Verify structure** with `tree` command

3. **Display next steps** to the user
