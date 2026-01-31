---
task_id: 11
title: Deeper config integration
status: complete
created: 2026-01-30
completed: 2026-01-30
version: v5.5.0
---

# Plan: Deeper Config Integration (Task 11) ✓

## Problem Summary

Configuration is fragmented and not integrated into the component model. Need a config component that:
- Lives in `components/config/` (user-owned, not marketplace abstraction)
- Provides typed config sections per component
- Uses directory-per-environment structure for config merging
- Minimizes environment variables (single `SDD_CONFIG_PATH`)

## Target Architecture

### Config as a Component

**Mandatory singleton** - every project has exactly one config component.

```
components/
├── config/                         # MANDATORY - always present, exactly one
│   ├── package.json                # Minimal package for workspace imports
│   ├── tsconfig.json               # TypeScript config for type exports
│   ├── envs/
│   │   ├── default/                # Base configuration (always merged first)
│   │   │   └── config.yaml
│   │   ├── local/                  # Local dev (always present)
│   │   │   └── config.yaml
│   │   └── {env}/                  # Other envs added as needed (staging, production, etc.)
│   │       └── config.yaml
│   ├── schemas/
│   │   └── config.schema.json      # Main schema (minimal, users extend)
│   └── types/                      # TypeScript type definitions
│       ├── index.ts                # Re-exports config types
│       └── {component}.ts          # Per-component types (added as needed)
│
├── server-task-service/
│   └── src/
│       ├── config/
│       │   └── load_config.ts      # Imports type from @config/types
│       └── index.ts
│
├── frontend-task-dashboard/
│   └── src/
│       └── config.ts               # Build-time config (see Frontend Config below)
│
└── contract-task-api/
    └── ...
```

### Directory Per Environment

Each environment has its own directory. Environments are **user-defined** - we don't assume which exist.

**Initial structure (scaffolded):**
```
components/config/
├── package.json                # Minimal package for workspace imports
├── tsconfig.json               # TypeScript config for type exports
├── envs/
│   ├── default/
│   │   └── config.yaml         # Base config (empty sections)
│   └── local/
│       └── config.yaml         # Local overrides (empty)
├── schemas/
│   └── config.schema.json      # Main schema (minimal)
└── types/
    ├── index.ts                # Re-exports config types
    └── server.ts               # Example type (minimal)
```

**Users add environments as needed:**
```
components/config/
├── envs/
│   ├── default/
│   ├── local/
│   ├── staging/       # Added when needed
│   └── production/    # Added when needed
└── schemas/
```

**Note:** Config is a minimal TypeScript project (no runtime code). It exists in the workspace so other components can import types from it. The YAML files are the source of truth. Config is propagated to components by `sdd-system` (invoked via `/sdd-config`). All config must adhere to the `config-standards` skill.

**Merge order:** `envs/default/` → `envs/{env}/`

Future-proof: Each env directory can be split into multiple files (servers.yaml, databases.yaml, etc.).

### Config Structure

```yaml
# components/config/envs/default/config.yaml

global: {}  # Reserved for future cross-cutting concerns

# Each component gets a section matching its directory name
# Users add properties as needed - these are just placeholders
server-task-service: {}
webapp-task-dashboard: {}
database-taskdb: {}
helm-task-service: {}
```

### Frontend Config (Build-Time)

Frontend components (webapps) **cannot** use `SDD_CONFIG_PATH` at runtime because browsers don't have filesystem access. Frontend config is handled differently:

1. **Build-time injection** - Config values are injected during build via Vite's `import.meta.env`
2. **Type sharing only** - Frontend imports types from `@project/config/types` for type safety
3. **Config generation** - `/sdd-config generate --env local --component frontend-task-dashboard` outputs values that are then set as build env vars

**Frontend config flow:**
```bash
# Generate frontend config as JSON
sdd-system config generate --env local --component frontend-task-dashboard --format json > .env.local.json

# Build script reads .env.local.json and sets VITE_* env vars
# Or: manually set VITE_API_URL, VITE_FEATURE_FLAGS, etc.
```

**Note:** Frontend config is simpler than backend - typically just API URLs and feature flags. Sensitive config never goes to frontend.

## Design Principles

### Environment Agnosticism

**Components are environment-agnostic.** Server, frontend, database, contract components never know which environment they're running in. They receive config values and use them.

**Only two places know about environments:**
1. `components/config/` - has `envs/local/`, `envs/production/`, etc.
2. `components/helm-*/` - has `values-local.yaml`, `values-production.yaml`, etc.

**A server component:**
- ✅ Reads `config.port` and listens on it
- ✅ Reads `config.database.host` and connects to it
- ❌ Never checks "am I in production?"
- ❌ Never has `if (env === 'local')` logic

This separation means components are testable, portable, and predictable.

## Design Decisions

| Decision | Choice |
|----------|--------|
| Config component | **Mandatory** - exactly one per project, must be declared |
| In sdd-settings.yaml | Listed as `{type: config, name: config}` (singleton) |
| Section naming | Exact component directory names (`server-task-service`) |
| Schema authority | Config component defines all config schemas centrally |
| Components without config | Unlikely; most will have a section |
| Type definitions | Centralized in `components/config/types/`, imported by components |
| Environment variable | Single env var `SDD_CONFIG_PATH` for servers (see NODE_ENV note below) |
| sdd-system role | CLI tool only (generate, validate, diff) - NOT a library |
| Merge algorithm | **Deep merge** - nested objects merged recursively, arrays replaced (not concatenated) |
| Component extraction | Outputs section contents only (no wrapper key) - see below |
| Scaffolding order | Config component scaffolded **first**, before other components |

### Merge Algorithm Details

When merging `envs/default/` → `envs/{env}/`:

- **Objects**: Recursively merged (both levels' keys preserved)
- **Arrays**: Replaced entirely (env array replaces default array)
- **Primitives**: Env value replaces default value
- **Null values**: Explicitly setting `null` removes the key

Example:
```yaml
# envs/default/config.yaml
server-task-service:
  port: 3000
  database:
    host: db.internal
    pool: 10

# envs/local/config.yaml
server-task-service:
  database:
    host: localhost

# Result (merged):
server-task-service:
  port: 3000        # Preserved from default
  database:
    host: localhost # Overridden by local
    pool: 10        # Preserved from default
```

### Component Extraction Output

When using `--component`, the output contains **only the section contents** (no wrapper key):

```bash
sdd-system config generate --env local --component server-task-service
```

Output:
```yaml
port: 3000
database:
  host: localhost
  pool: 10
```

This allows `load_config.ts` to parse the file directly as `ServerConfig` without unwrapping.

### NODE_ENV Handling

**NODE_ENV is an infrastructure exception**, not application config. It exists because third-party libraries (Express, etc.) check it for performance optimizations.

**Key principle:** Application code NEVER reads NODE_ENV. It's injected by infrastructure for library behavior only.

- **Local development**: Not set. Libraries default to development behavior - fine.
- **K8s deployment**: Set via Helm values:

```yaml
# helm-{name}/values.yaml (default)
nodeEnv: development

# helm-{name}/values-production.yaml
nodeEnv: production
```

```yaml
# helm-{name}/templates/deployment.yaml
env:
  - name: NODE_ENV
    value: {{ .Values.nodeEnv }}
  - name: SDD_CONFIG_PATH
    value: /app/config/config.yaml
```

**What NODE_ENV controls (library behavior, NOT app logic):**
- Express view caching
- Express error verbosity
- Some npm packages' internal optimizations

**What NODE_ENV does NOT control (use config YAML instead):**
- Logging level → `config.logging.level`
- Feature flags → `config.features.*`
- API endpoints → `config.api.baseUrl`
- Any application behavior

## Implementation Summary

All phases completed successfully:

1. ✓ Config scaffolding skill with templates
2. ✓ Backend templates updated to use YAML config
3. ✓ Config is mandatory singleton component
4. ✓ Helm standards skill
5. ✓ Helm scaffolding skill
6. ✓ /sdd-config command
7. ✓ sdd-system CLI config namespace
8. ✓ Config standards skill
9. ✓ Documentation (config-guide.md)
10. ✓ 139+ tests covering all functionality
