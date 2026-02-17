# Components

<!--
This file is maintained by the docs-writer agent.
To update, invoke the docs-writer agent with your changes.
-->

> Reference for all SDD component types.

## Overview

Components are the building blocks of an SDD project. Each component lives under `components/` and is recommended during project initialization based on your project's needs.

## Available Components

| Component | Description |
|-----------|-------------|
| `config` | Centralized configuration (mandatory singleton) |
| `contract` | OpenAPI specification |
| `server` | Node.js backend (CMDO pattern) |
| `webapp` | React frontend (MVVM pattern) |
| `database` | PostgreSQL migrations and seeds |
| `helm` | Kubernetes Helm charts |
| `testing` | Testkube test setup and definitions |
| `cicd` | GitHub Actions CI/CD workflows |

Most component types support multiple instances. See [Multi-Instance Components](#multi-instance-components) below. The `config` component is a mandatory singleton.

## Component Details

### Contract

API-first design using OpenAPI specifications. Defines the shared interface between server and client components. Generated TypeScript types are published as npm workspace packages, consumed by server and webapp components via `"workspace:*"` dependencies.

**Directory:** `components/<name>/` (e.g., `components/contract/`, `components/contract-task-api/`)

**Workspace package:** Each contract exports `generated/types.ts` via its `package.json` `exports` field. Consumers import types from the package:

```typescript
import type { components } from '@project-name/contract';
```

### Server

Node.js/TypeScript backend following the CMDO (Controller, Model, Data, Operator) architecture pattern. Implements the API contract and contains business logic.

**Directory:** `components/<name>/` (e.g., `components/server/`, `components/server-api/`)

### Webapp

React/TypeScript frontend following the MVVM (Model-View-ViewModel) architecture pattern. Consumes the API contract for type-safe client calls.

**Directory:** `components/<name>/` (e.g., `components/webapp/`, `components/webapp-admin/`)

### Database

PostgreSQL database component with migrations, seeds, and management scripts. Handles schema evolution and test data.

**Directory:** `components/<name>/` (e.g., `components/database/`, `components/database-analytics/`)

### Config

YAML-based configuration management with validation schemas. **Mandatory singleton** - every project has exactly one config component.

**Directory:** `components/config/` (always, no name variants)

**Features:**
- Environment layering (`envs/default/` → `envs/{env}/`)
- JSON Schema validation
- TypeScript type exports for type-safe config access
- Single env var (`SDD_CONFIG_PATH`) for servers

**Structure:**
```
components/config/
├── package.json          # Workspace package for type imports
├── tsconfig.json
├── envs/
│   ├── default/config.yaml    # Base configuration
│   ├── local/config.yaml      # Local dev overrides
│   └── {env}/config.yaml      # Other environments
├── schemas/
│   └── config.schema.json
└── types/
    ├── index.ts
    └── server.ts         # Per-component types
```

See [Configuration Guide](config-guide.md) for details.

### Helm

Kubernetes Helm deployment charts and container definitions for production deployment.

**Directory:** `components/<name>/` (e.g., `components/helm/`, `components/helm-services/`)

### Testing

Testkube test setup and definitions for integration and end-to-end testing.

**Directory:** `components/<name>/` (e.g., `components/testing/`, `components/testing-e2e/`)

### CI/CD

GitHub Actions workflows for continuous integration and deployment, including PR checks and release pipelines.

**Directory:** `components/<name>/` (e.g., `components/cicd/`, `components/cicd-deploy/`)

## Multi-Instance Components

All component types support multiple instances. Each component is listed in `.sdd/sdd-settings.yaml` with a `type` and `name`. The directory is always `components/<name>/`. Examples:

- `contract` and `contract-task-api` for separate API contracts
- `server-api` and `server-worker` for separate API and background processing services
- `webapp-admin` and `webapp-public` for separate admin and public-facing interfaces
- `database` and `database-analytics` for separate database schemas

## Dependencies

Components declare dependencies using the `depends_on` field in `.sdd/sdd-settings.yaml`. This enables multi-contract architectures where each server or webapp specifies which contract it consumes.

| Component | Depends On |
|-----------|------------|
| Contract | - |
| Server | Contract (via `depends_on`) |
| Webapp | Contract (via `depends_on`) |
| Database | Server |
| Helm | Server |
| Testing | Server or Webapp |
| CI/CD | Server or Webapp |

The scaffolding engine resolves `depends_on` to set the `{{CONTRACT_PACKAGE}}` template variable, ensuring generated imports point to the correct contract workspace package.

## Next Steps

- [Getting Started](getting-started.md) - Create your first project
- [Commands](commands.md) - Full command reference
- [Agents](agents.md) - Specialized agents that work with components
