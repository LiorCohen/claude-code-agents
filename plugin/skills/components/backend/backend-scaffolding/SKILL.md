---
name: backend-scaffolding
description: Scaffolds Node.js/TypeScript backend components with CMDO architecture, driven by component settings.
user-invocable: false
---

# Backend Scaffolding Skill

Creates a Node.js/TypeScript backend component following the CMDO (Config, Model, DAL, Operator) architecture. Scaffolding is driven by **component settings** defined in `.sdd/sdd-settings.yaml` (refer to the `project-settings` skill for the authoritative schema).

## When to Use

Use when creating server components. Supports multiple named instances (e.g., `main-server`, `background-worker`).

## Settings-Driven Scaffolding

Server components are scaffolded based on their settings in `.sdd/sdd-settings.yaml`. Refer to the `project-settings` skill for the complete server settings schema and defaults.

### Conditional Scaffolding Logic

```typescript
// Pseudocode for settings-driven scaffolding
const scaffoldServer = async (component: ServerComponent): Promise<void> => {
  // Always scaffold: core structure, operator lifecycle, model layer
  await scaffoldCore(component);

  // Conditional: HTTP routes (only if server provides contracts)
  if (component.settings.provides_contracts.length > 0) {
    await scaffoldRoutes(component, component.settings.provides_contracts);
  }

  // Conditional: API clients (only if server consumes contracts)
  if (component.settings.consumes_contracts.length > 0) {
    await scaffoldApiClients(component, component.settings.consumes_contracts);
  }

  // Conditional: DAL layer per database
  for (const db of component.settings.databases) {
    await scaffoldDAL(component, db);
  }
};
```

## What It Creates

### Base Structure (Always Created)

```text
components/servers/<name>/
├── package.json
├── tsconfig.json
├── .gitignore
└── src/
    ├── index.ts                    # Entry point
    ├── config/
    │   ├── index.ts
    │   └── load_config.ts          # Config loading
    ├── operator/
    │   ├── index.ts
    │   ├── create_operator.ts      # Operator factory
    │   ├── lifecycle_probes.ts     # Health/ready endpoints (port 9090)
    │   ├── logger.ts               # Structured logging
    │   ├── metrics.ts              # Metrics collection
    │   └── state_machine.ts        # Lifecycle state machine
    ├── controller/
    │   ├── index.ts
    │   └── create_controller.ts    # Controller factory
    └── model/
        ├── index.ts
        ├── dependencies.ts         # Dependency injection interface
        ├── definitions/
        │   └── index.ts            # Empty barrel
        └── use-cases/
            └── index.ts            # Empty barrel
```

### Conditional: HTTP Server (when `server_type` includes `api`)

```text
└── src/
    └── operator/
        └── create_http_server.ts   # HTTP server setup (port 3000)
```

### Conditional: HTTP Handlers (when `provides_contracts` is non-empty)

```text
└── src/
    └── controller/
        └── http_handlers/
            └── index.ts            # Route handlers for contracts
```

### Conditional: DAL Layer (when `databases` is non-empty)

For each database in `databases`, creates:

```text
└── src/
    └── dal/
        └── <database-name>/
            └── index.ts            # DAL functions for this database
    └── operator/
        └── create_database_<name>.ts  # Database connection setup
```

### Conditional: API Clients (when `consumes_contracts` is non-empty)

For each contract in `consumes_contracts`, generates API client from contract spec.

## CMDO Architecture

| Layer | Purpose | Location |
|-------|---------|----------|
| **C**onfig | Configuration loading and validation | `src/config/` |
| **M**odel | Business logic, definitions, use cases | `src/model/` |
| **D**AL | Data Access Layer, database operations | `src/dal/` |
| **O**perator | Application lifecycle, servers, telemetry | `src/operator/` |

Plus **Controller** for HTTP request handling.

## Directory Structure

Servers live at `components/servers/<name>/`:

| Component Name | Directory |
|----------------|-----------|
| `main-server` | `components/servers/main-server/` |
| `background-worker` | `components/servers/background-worker/` |

## Template Variables

| Variable | Description |
|----------|-------------|
| `{{PROJECT_NAME}}` | Project name |
| `{{PROJECT_DESCRIPTION}}` | Project description |
| `{{PRIMARY_DOMAIN}}` | Primary business domain |
| `{{SERVER_NAME}}` | Server component name |

## Templates Location

All templates are colocated in this skill's `templates/` directory:

```text
skills/components/backend/backend-scaffolding/templates/
├── package.json
├── tsconfig.json
├── .gitignore
└── src/
    ├── index.ts
    ├── config/
    ├── operator/
    ├── controller/
    ├── model/
    └── dal/
```

## Config Integration

When scaffolding a server component, the config section is generated based on settings.

### Example: API Server with Database

Settings:
```yaml
- name: main-server
  type: server
  settings:
    server_type: api
    databases: [primary-db]
    provides_contracts: [public-api]
```

Generated config (`components/config/envs/default/config.yaml`):
```yaml
main-server:
  port: 3000
  probesPort: 9090
  logLevel: info
  databases:
    primary-db:
      host: localhost
      port: 5432
      name: myapp
      ssl: false
```

### Example: Worker without Database

Settings:
```yaml
- name: background-worker
  type: server
  settings:
    server_type: worker
    databases: []
    provides_contracts: []
    consumes_contracts: [public-api]
```

Generated config:
```yaml
background-worker:
  probesPort: 9090
  logLevel: info
  queue:
    url: amqp://localhost:5672
  apis:
    public-api:
      base_url: http://main-server:3000
```

---

## Scaffold Spec

To scaffold a backend component, build a spec with context flags derived from settings and invoke the engine:

```bash
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding apply --spec spec.json
```

### Variables

| Variable | Source |
|----------|--------|
| `PROJECT_NAME` | From `sdd-settings.yaml` project name |
| `SERVER_NAME` | Component name |
| `CONTRACT_PACKAGE` | `@<project-name>/<contract-name>` (from `depends_on`) |

### Context Flags (derived from settings)

| Flag | Derived From |
|------|-------------|
| `has_databases` | `settings.databases.length > 0` |
| `has_provides_contracts` | `settings.provides_contracts.length > 0` |
| `has_consumes_contracts` | `settings.consumes_contracts.length > 0` |

### Operations

```json
{
  "target_dir": "<project-root>",
  "base_dir": "<plugin-root>/skills",
  "variables": {
    "PROJECT_NAME": "<project-name>",
    "SERVER_NAME": "<server-name>",
    "CONTRACT_PACKAGE": "@<project-name>/<contract-name>"
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
      "dest": "components/servers/<server-name>"
    },
    {
      "type": "mkdir",
      "path": "components/servers/<server-name>/src/dal",
      "when": { "key": "has_databases", "equals": true }
    },
    {
      "type": "mkdir",
      "path": "components/servers/<server-name>/src/controller/http_handlers",
      "when": { "key": "has_provides_contracts", "equals": true }
    },
    {
      "type": "package_json_scripts",
      "scripts": {
        "<server-name>:dev": "npm run dev -w @<project-name>/<server-name>",
        "<server-name>:build": "npm run build -w @<project-name>/<server-name>",
        "<server-name>:start": "npm run start -w @<project-name>/<server-name>",
        "<server-name>:test": "npm run test -w @<project-name>/<server-name>"
      }
    }
  ]
}
```

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts component name, server type, and optional settings for databases, contracts, and Helm chart generation.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns the scaffolding engine result: created files, directories, and scripts; skipped paths; errors; and a human-readable summary.

## Related Skills

- `project-settings` — Authoritative source for server component settings schema, defaults, and validation rules.
- `backend-standards` — Generated server code must follow these standards. Defines CMDO architecture with handler → orchestrator → repository layering, strict layer separation, and dependency injection.
- `typescript-standards` — Generated TypeScript files must follow these coding conventions. Defines strict typing, readonly patterns, branded types, and import standards.
- `unit-testing` — Generated test files must follow these patterns. Defines Vitest setup, mocking strategies, and isolation conventions for backend services.
