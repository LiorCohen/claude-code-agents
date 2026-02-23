---
name: component-discovery
description: Component type definitions, discovery questions, and settings validation for fullstack-typescript projects.
user-invocable: false
---

# Component Discovery

Tech-specific discovery content for the fullstack-typescript tech pack. Loaded by the core `component-discovery` skill via `techpacks.routeSkills(phase: component-discovery)` to provide component type mappings, discovery questions, settings validation rules, and example configurations.

## Core Discovery Questions

Use these questions to determine which component types are needed:

| Question | If Yes | Component Type |
|----------|--------|----------------|
| Do you need to persist data? | yes | `database` |
| Does it have a backend/API? | yes | `server` |
| Does the server expose an API consumed by other components? | yes | `contract` |
| Does it have a user-facing frontend? | yes | `webapp` |
| Will it be deployed to Kubernetes? | yes | `helm` (one per deployment mode) |

## Component-Specific Discovery Questions

Once a component type is identified, ask deeper questions to understand scope and settings.

### Backend (server + database)

External specs typically lack backend details. These must be derived from UI descriptions and explicit questions.

**YAGNI Principle**: Only derive operations explicitly shown in the UI. Do not assume full CRUD.

| Category | Discovery Question | Source |
|----------|-------------------|--------|
| **Entities** | What pieces of data need to be stored? | Look at what is displayed in the UI |
| **Relationships** | What are the relationships between data? | Look at lists, dropdowns, links between views |
| **User Actions** | What user actions modify data? | Look at buttons, forms, CTAs |
| **Action Effects** | How does each action affect data? | Only operations visible in the UI |
| **Business Rules** | What validation or constraints apply? | Often missing from specs -- verify or ask |
| **Authorization** | Who can perform each action? | Often missing from specs -- verify or ask |

### API Contract

Derive from UI analysis and ask clarifying questions:

| Category | Discovery Question |
|----------|-------------------|
| **Endpoints** | What operations are needed? List each with HTTP verb, path, and description. Only include operations visible in the UI. |
| **Consumers** | Who calls this API? (webapp, mobile app, external service) |
| **Error Cases** | What can go wrong? (validation errors, not found, unauthorized, conflicts) |

### Frontend (webapp)

External specs usually have good UI detail. Extract rather than ask:

| Category | Discovery Question | Where to Find |
|----------|-------------------|---------------|
| **Pages/Views** | What screens does the user see? | Mockups, wireframes, user flow diagrams |
| **Forms** | What data does the user input? | Form mockups, input field descriptions |
| **States** | Loading, empty, error states? | May be missing from specs -- ask if absent |

## Visual Assets Prompt

When UI/UX is involved and the spec does not include visual assets, ask:

```text
Do you have any visual assets I can reference?
  - Mockups or wireframes (Figma, Sketch, etc.)
  - Screenshots of existing UI
  - Rough sketches or drawings
  - Reference images from other products

If you can share images, I can extract much more accurate
requirements than from text descriptions alone.
```

Skip this prompt if the spec already includes images or links to design tools.

## Multiple Component Instances

### Hybrid Servers

A single server can handle multiple processing modes. Ask:

```text
Should the backend be a single service or multiple?
- Single API server
- API + Worker (hybrid mode in one deployment)
- Separate API and Worker servers (independent scaling)
```

- **Hybrid**: One server with `server_type: hybrid`, `modes: [api, worker]`
- **Separate**: Two servers, potentially two helm charts with different `deploy_modes`

### Multiple Helm Charts per Server

A single server can have multiple helm charts for independent scaling:

- `order-service-api` with `deploy_modes: [api]` and `ingress: true`
- `order-service-worker` with `deploy_modes: [worker]` and `ingress: false`

This allows API and worker processes to scale independently.

## Settings Validation

Before accepting the final component configuration, validate these cross-reference rules:

| Rule | Validation |
|------|-----------|
| **Database references** | Every database name in a server's `databases` array must exist as a `database` component |
| **Contract references** | Every contract name in `provides_contracts` or `consumes_contracts` must exist as a `contract` component |
| **Webapp contract references** | Every contract name in a webapp's `contracts` array must exist as a `contract` component |
| **Helm deploy target** | Every helm chart's `deploys` value must reference an existing `server` or `webapp` component |
| **Helm deploy modes** | A helm chart's `deploy_modes` must be valid for the target server's `server_type` (e.g., `[worker]` is only valid if `server_type` is `worker` or `hybrid` with `worker` in `modes`) |
| **Config singleton** | Exactly one `config` component must exist |

## Examples

### Minimal Single-Server Project

```yaml
components:
  - name: config
    type: config
    settings: {}
  - name: task-api
    type: contract
    settings:
      visibility: internal
  - name: task-db
    type: database
    settings:
      provider: postgresql
      dedicated: false
  - name: task-server
    type: server
    settings:
      server_type: api
      databases: [task-db]
      provides_contracts: [task-api]
      consumes_contracts: []
      helm: true
  - name: task-app
    type: webapp
    settings:
      contracts: [task-api]
      helm: true
  - name: task-server-chart
    type: helm
    settings:
      deploys: task-server
      deploy_type: server
      deploy_modes: [api]
      ingress: true
  - name: task-app-chart
    type: helm
    settings:
      deploys: task-app
      deploy_type: webapp
      ingress: true
      assets: bundled
```

### Full Multi-Component Project

```yaml
components:
  - name: config
    type: config
    settings: {}

  # Contracts
  - name: orders-api
    type: contract
    settings:
      visibility: internal
  - name: notifications-api
    type: contract
    settings:
      visibility: internal
  - name: admin-api
    type: contract
    settings:
      visibility: internal

  # Databases
  - name: orders-db
    type: database
    settings:
      provider: postgresql
      dedicated: false
  - name: notifications-db
    type: database
    settings:
      provider: postgresql
      dedicated: false

  # Servers
  - name: order-service
    type: server
    settings:
      server_type: hybrid
      modes: [api, worker]
      databases: [orders-db]
      provides_contracts: [orders-api]
      consumes_contracts: [notifications-api]
      helm: true
  - name: notification-service
    type: server
    settings:
      server_type: worker
      databases: [notifications-db]
      provides_contracts: [notifications-api]
      consumes_contracts: []
      helm: true

  # Webapps
  - name: admin-dashboard
    type: webapp
    settings:
      contracts: [admin-api, orders-api]
      helm: true
  - name: customer-portal
    type: webapp
    settings:
      contracts: [orders-api]
      helm: true

  # Helm charts (separate charts for independent scaling)
  - name: order-service-api
    type: helm
    settings:
      deploys: order-service
      deploy_type: server
      deploy_modes: [api]
      ingress: true
  - name: order-service-worker
    type: helm
    settings:
      deploys: order-service
      deploy_type: server
      deploy_modes: [worker]
      ingress: false
  - name: notification-service-chart
    type: helm
    settings:
      deploys: notification-service
      deploy_type: server
      ingress: false
  - name: admin-dashboard-chart
    type: helm
    settings:
      deploys: admin-dashboard
      deploy_type: webapp
      ingress: true
      assets: bundled
  - name: customer-portal-chart
    type: helm
    settings:
      deploys: customer-portal
      deploy_type: webapp
      ingress: true
      assets: bundled

  # Testing
  - name: order-integration
    type: integration-testing
    settings: {}
  - name: order-e2e
    type: e2e-testing
    settings: {}

  # CI/CD
  - name: main-pipeline
    type: cicd
    settings: {}
```

## Input / Output

This skill defines no input parameters or structured output.
