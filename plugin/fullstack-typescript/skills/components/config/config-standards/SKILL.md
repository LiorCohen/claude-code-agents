---
name: config-standards
description: Standards and patterns for SDD configuration management.
---

# Config Standards Skill

Standards and patterns for SDD configuration management.

## Principles

1. **Single source of truth** - All config lives in `components/config/`
2. **Environment layering** - `envs/default/` → `envs/{env}/` merge order
3. **Minimal env vars** - Only `SDD_CONFIG_PATH` allowed for servers
4. **Secrets as references** - Config contains K8s Secret names, not values
5. **Fail fast** - Validate config at startup, crash on invalid
6. **Environment agnosticism** - Components never know which environment they're in

## Directory Structure

```text
components/config/
├── package.json                # Workspace package for type imports
├── tsconfig.json               # TypeScript config
├── envs/
│   ├── default/
│   │   └── config.yaml         # Base configuration (always merged first)
│   ├── local/
│   │   └── config.yaml         # Local development overrides
│   ├── staging/
│   │   └── config.yaml         # Staging overrides (add as needed)
│   └── production/
│       └── config.yaml         # Production overrides (add as needed)
├── schemas/
│   └── config.schema.json      # JSON Schema for validation
└── types/
    ├── index.ts                # Re-exports all config types
    └── {component}.ts          # Per-component type definitions
```

## Naming Conventions

- Config sections match component names
- Use kebab-case for all names
- Secret references end with `Secret` suffix (e.g., `passwordSecret`)

```yaml
# Section names match component names
task-service:            # -> components/servers/task-service/
  port: 3000

task-dashboard:          # -> components/webapps/task-dashboard/
  apiBaseUrl: /api

taskdb:                  # -> components/databases/taskdb/
  host: localhost
```

## Config Structure

```yaml
# envs/default/config.yaml

global: {}  # Reserved for future cross-cutting concerns

# Each component gets a section matching its directory name
server-task-service:
  port: 3000
  probesPort: 9090
  logLevel: info
  database:
    host: db.internal
    port: 5432
    name: taskdb
    user: app
    passwordSecret: task-service-db-credentials
    pool: 10

webapp-task-dashboard:
  apiBaseUrl: /api
  features:
    darkMode: true
```

## Environment Agnosticism

**Components are environment-agnostic.** Server, frontend, database, contract components never know which environment they're running in. They receive config values and use them.

**Only two places know about environments:**
1. `components/config/` - has `envs/local/`, `envs/production/`, etc.
2. `components/helm-*/` - has `values-local.yaml`, `values-production.yaml`, etc.

**A server component:**
- ✅ Reads `config.port` and listens on it
- ✅ Reads `config.database.host` and connects to it
- ❌ Never checks "am I in production?"
- ❌ Never has `if (env === 'local')` logic

## Type Definitions

Types are defined in `components/config/types/`:

```typescript
// types/server.ts
export type ServerConfig = Readonly<{
  port?: number;
  probesPort?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  database?: Readonly<{
    host?: string;
    port?: number;
    name?: string;
    user?: string;
    passwordSecret?: string;
    pool?: number;
  }>;
}>;
```

Components import types via workspace package:

```typescript
// In server component
import type { ServerConfig } from '@my-project/config/types';
```

## Schema Management

- Main schema (`schemas/config.schema.json`) validates all config
- Start minimal, extend as config evolves
- Schema is validated at generate time AND at runtime

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "global": { "type": "object" },
    "server-task-service": {
      "type": "object",
      "properties": {
        "port": { "type": "number" },
        "logLevel": { "enum": ["debug", "info", "warn", "error"] }
      }
    }
  }
}
```

## Local Development Workflow

1. **Add config property** to `components/config/envs/default/config.yaml`
2. **Add override** (if needed) to `components/config/envs/local/config.yaml`
3. **Update schema** in `components/config/schemas/config.schema.json`
4. **Update types** in `components/config/types/{component}.ts`
5. **Generate merged config**:
   ```bash
   /sdd I want to generate config
   ```
6. **Start server**:
   ```bash
   SDD_CONFIG_PATH=./local-config.yaml npm start
   ```

## Secret Handling

Config contains secret **references** (K8s Secret names), not values:

```yaml
# In config YAML
server-task-service:
  database:
    host: db.production.internal
    passwordSecret: "task-service-db-credentials"  # K8s Secret name
```

At deploy time, Helm maps these references to actual secrets:

```yaml
# In helm-task-service/templates/deployment.yaml
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: {{ .Values.config.database.passwordSecret }}
        key: password
```

The application reads DB_PASSWORD from environment, not from config YAML.

## Gitignore

Generated config files should be gitignored:

```gitignore
# Generated config files in server components (never commit)
components/server-*/local-config.yaml
components/server-*/*.schema.json
```

All `envs/` directories ARE committed - they contain references only.

## NODE_ENV Handling

NODE_ENV is an **infrastructure exception**, not application config. It exists because third-party libraries check it for optimizations.

**Application code NEVER reads NODE_ENV.** It's injected by Helm for library behavior only.

| Environment | NODE_ENV | Set By |
|-------------|----------|--------|
| Local dev | Not set | (libraries default to development) |
| K8s staging | `development` | Helm values |
| K8s production | `production` | Helm values |

## Validation Rules

1. **Required fields** - Schema can mark fields as required
2. **Type checking** - Schema validates types (string, number, object)
3. **Enum values** - Schema constrains to allowed values
4. **Pattern matching** - Schema can validate string patterns

Validation happens:
- At `/sdd I want to generate config` time (CLI)
- At server startup (runtime)

---

## Input / Output

This skill defines no input parameters or structured output.


