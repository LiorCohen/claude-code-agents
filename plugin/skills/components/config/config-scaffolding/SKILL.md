---
name: config-scaffolding
description: Scaffolds the config component for centralized configuration management, driven by component settings.
user-invocable: false
---

# Config Scaffolding Skill

Scaffolds the mandatory config component for centralized configuration management. Config sections are generated based on component settings from `.sdd/sdd-settings.yaml` (refer to the `project-settings` skill for the authoritative schema).

## When to Use

Use during project initialization to create the config component. The config component is **mandatory** — every SDD project has exactly one.

## What It Creates

```text
components/config/
├── package.json                # Minimal package for workspace imports
├── tsconfig.json               # TypeScript config for type exports
├── envs/
│   ├── default/
│   │   └── config.yaml         # Base config (sections per component)
│   └── local/
│       └── config.yaml         # Local overrides (empty)
├── schemas/
│   └── config.schema.json      # Main schema (minimal)
└── types/
    └── index.ts                # Re-exports config types
```

## Settings-Driven Config Generation

Config sections are generated based on component settings in `.sdd/sdd-settings.yaml`:

### Server Config Sections

**API Server with database:**
```yaml
# Settings:
- name: main-server
  type: server
  settings:
    server_type: api
    databases: [primary-db]
    provides_contracts: [public-api]

# Generated config:
main-server:
  port: 3000                    # Business API port (has provides_contracts)
  probesPort: 9090              # Health/metrics port (always)
  logLevel: info                # Logging level (always)
  databases:
    primary-db:                 # Section per database
      host: localhost
      port: 5432
      name: myapp
      ssl: false
```

**Worker without database:**
```yaml
# Settings:
- name: background-worker
  type: server
  settings:
    server_type: worker
    databases: []
    consumes_contracts: [public-api]

# Generated config:
background-worker:
  probesPort: 9090              # Health/metrics port (always)
  logLevel: info                # Logging level (always)
  queue:                        # Queue config for worker
    url: amqp://localhost:5672
  apis:
    public-api:                 # Section per consumed contract
      base_url: http://main-server:3000
```

**Hybrid server (api + worker):**
```yaml
# Settings:
- name: main-server
  type: server
  settings:
    server_type: hybrid
    modes: [api, worker]
    databases: [primary-db]
    provides_contracts: [public-api]

# Generated config:
main-server:
  port: 3000                    # Business API port (has provides_contracts)
  probesPort: 9090              # Health/metrics port (always)
  logLevel: info                # Logging level (always)
  databases:
    primary-db:
      host: localhost
      port: 5432
      name: myapp
      ssl: false
  queue:                        # Queue config (has worker mode)
    url: amqp://localhost:5672
```

### Webapp Config Sections

```yaml
# Settings:
- name: admin-dashboard
  type: webapp
  settings:
    contracts: [public-api]

# Generated config:
admin-dashboard:
  apis:
    public-api:                 # Section per consumed contract
      base_url: http://localhost:3000
```

### Config Section Rules

| Setting | Config Impact |
|---------|---------------|
| `server_type: api` | Adds `port: 3000` (business API) |
| `server_type: worker` | Adds `queue: { url: ... }` |
| `server_type: cron` | Adds `schedule: {}` placeholder |
| `provides_contracts: [...]` | Adds `port: 3000` (business API) |
| `consumes_contracts: [...]` | Adds `apis: { <name>: { base_url: ... } }` per contract |
| `databases: [...]` | Adds `databases: { <name>: { host, port, name, ssl } }` per database |
| `contracts: [...]` (webapp) | Adds `apis: { <name>: { base_url: ... } }` per contract |

### All Servers Get

- `probesPort: 9090` - Health check and metrics endpoint
- `logLevel: info` - Logging level

## Config Component Purpose

The config component is a minimal TypeScript project with no runtime code. It exists so:

1. **Other components can import types** via workspace package `@{project}/config/types`
2. **YAML files are the source of truth** for configuration values
3. **The system CLI** (via `/sdd-config`) generates merged configs for each environment

## Environment Structure

Each environment has its own directory under `envs/`:

| Directory | Purpose |
|-----------|---------|
| `envs/default/` | Base configuration - all environments inherit from this |
| `envs/local/` | Local development overrides (always present) |
| `envs/{env}/` | Other environments added as needed (staging, production, etc.) |

**Merge order:** `envs/default/` → `envs/{env}/`

## Template Variables

| Variable | Description |
|----------|-------------|
| `{{PROJECT_NAME}}` | Project name (lowercase, hyphens) |

## Templates Location

All templates are colocated in this skill's `templates/` directory:

```text
skills/components/config/config-scaffolding/templates/
├── package.json
├── tsconfig.json
├── envs/
│   ├── default/
│   │   └── config.yaml
│   └── local/
│       └── config.yaml
├── schemas/
│   └── config.schema.json
└── types/
    └── index.ts
```

## Sync Behavior

When settings change (via `/sdd-settings`), the config component is automatically synced:

1. **New component added** → Config section added with defaults
2. **Database added to server** → Database subsection added
3. **Contract added to consumes_contracts** → API subsection added
4. **Existing sections** → Never modified or deleted (preserves user changes)

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts the full list of project components whose settings drive dynamic config section generation.

## Related Skills

- `config-standards` — Generated config files must follow these standards. Defines naming conventions, validation patterns, environment-specific overrides, and TypeScript type generation rules.
