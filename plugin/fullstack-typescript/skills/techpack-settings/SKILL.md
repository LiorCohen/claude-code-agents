---
name: techpack-settings
description: Component type definitions, settings schemas, directory patterns, and validation rules for the fullstack-typescript tech pack.
user-invocable: false
---

# Techpack Settings

Component type definitions, settings schemas, directory patterns, and validation rules for the fullstack-typescript tech pack. This skill is loaded by core's `project-settings` skill to provide tech-pack-specific component knowledge.

---

## Component Types

| Type | Directory Pattern | Description |
|------|-------------------|-------------|
| `config` | `components/config` | Singleton configuration management |
| `server` | `components/servers/{name}` | Node.js/Express backend (CMDO architecture) |
| `webapp` | `components/webapps/{name}` | React/Vite frontend (MVVM architecture) |
| `database` | `components/databases/{name}` | PostgreSQL database |
| `contract` | `components/contracts/{name}` | OpenAPI 3.x specification |
| `helm` | `components/helm_charts/{name}` | Kubernetes Helm chart |
| `integration-testing` | `components/integration-testing` | Integration test suite |
| `e2e-testing` | `components/e2e-testing` | E2E test suite (Playwright) |
| `cicd` | `components/cicd` | CI/CD pipeline (GitHub Actions) |

---

## Settings Schema by Type

### Server Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `server_type` | `api\|worker\|cron\|hybrid` | `api` | Communication pattern(s) |
| `modes` | `(api\|worker\|cron)[]` | — | For hybrid: which modes (2+ required) |
| `databases` | string[] | `[]` | Database components this server uses |
| `provides_contracts` | string[] | `[]` | Contracts this server implements |
| `consumes_contracts` | string[] | `[]` | Contracts this server calls |
| `helm` | boolean | `true` | Whether to generate helm chart |

**Impact:**
- `server_type` determines operator lifecycle(s)
- `databases` drives DAL layer per database, config sections
- `provides_contracts` drives HTTP routes, Service in helm chart
- `consumes_contracts` drives API clients, config sections
- `helm: false` skips helm chart scaffolding

### Webapp Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `contracts` | string[] | `[]` | Contracts this webapp uses |
| `helm` | boolean | `true` | Whether to generate helm chart |

**Impact:**
- `contracts` drives API clients, config sections

### Helm Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `deploys` | string | — | Component to deploy (required) |
| `deploy_type` | `server\|webapp` | — | Type being deployed (required) |
| `deploy_modes` | `(api\|worker\|cron)[]` | — | For servers: which modes |
| `ingress` | boolean | `true` | External HTTP access |
| `assets` | `bundled\|entrypoint` | `bundled` | For webapps: asset strategy |

**Impact:**
- `deploy_modes` creates separate deployments for multi-mode servers
- `ingress` includes/excludes ingress.yaml
- `assets` determines webapp build strategy

### Database Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `provider` | `postgresql` | `postgresql` | Database provider |
| `dedicated` | boolean | `false` | Needs own DB server |

### Contract Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `visibility` | `public\|internal` | `internal` | External consumers allowed |

### Config Settings

Config component has no settings (it is a singleton).

### Testing Settings

Testing components (integration-testing, e2e-testing) have no settings. Structure is driven by testing standards skills.

### CI/CD Settings

CI/CD component has no settings. Structure is driven by the cicd-standards skill.

---

## Validation Rules

1. **Config is a mandatory singleton** — every project must have exactly one `config` component.
2. **Database references must exist** — any name in a server's `databases` array must match an existing `database` component.
3. **Contract references must exist** — any name in `provides_contracts`, `consumes_contracts`, or `contracts` must match an existing `contract` component.
4. **Helm `deploys` must reference existing component** — the `deploys` field must reference an existing `server` or `webapp` component.
5. **Helm `deploy_modes` must be valid** — each mode in `deploy_modes` must be a valid mode for the referenced server's `server_type` (e.g., a server with `server_type: api` cannot have `deploy_modes: [worker]`).

---

## Naming Rules

- Names must be lowercase
- Use hyphens, not underscores or spaces
- Names should be multi-word and domain-specific
  - Good: `order-service`, `analytics-db`, `customer-portal`, `task-api`
  - Avoid: `api`, `public`, `primary`, `main`, `server`
- Exception: `config` (singleton)

---

## Input / Output

This skill defines no input parameters or structured output.
