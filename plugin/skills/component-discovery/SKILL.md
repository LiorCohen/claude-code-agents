---
name: component-discovery
description: Discover required technical components through targeted questions based on classified requirements.
user-invocable: false
---

# Component Discovery Skill

Identifies required technical components through analysis of classified requirements and targeted discovery questions. **This skill is purely analytical - it never modifies sdd-settings.yaml or scaffolds components.**

## Purpose

Based on transformation output (classified requirements):
- Ask targeted discovery questions to determine WHICH components are needed
- Analyze requirements + answers to identify component types
- Ask component-specific questions to understand scope
- Document discovered components in SPEC.md (not in system files)
- Return component list for spec writing

**IMPORTANT**: This skill does NOT:
- Modify `sdd-settings.yaml`
- Scaffold components
- Make any system changes

It only analyzes and documents. Implementation decides when to actually create components.

## When to Use

- After transformation step in external spec workflow
- Runs ONCE after transformation, before decomposition
- During `/sdd-change new` interactive mode to identify needed components

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts change name, type, existing components, and optionally classified requirements from external spec processing.

## Discovery Questions

### Core Discovery Questions (determine if component needed)

| Question | If Yes → Component |
|----------|-------------------|
| Does data need to be persisted? | **database** |
| Are there user actions that modify data? | **server** |
| Do external clients need to call this system? | **contract** |
| Is there a user interface? | **webapp** |
| Does this need to be deployed to Kubernetes? | **helm** |

### Component-Specific Discovery Questions

Once a component type is identified, ask deeper questions:

#### Backend (server + database) - HIGH PRIORITY

External specs typically lack backend details. These must be DERIVED from UI descriptions + explicit questions.

**YAGNI Principle**: Only derive operations explicitly shown in UI. Do NOT assume full CRUD.

| Category | Discovery Question | Derivation Hint |
|----------|-------------------|-----------------|
| **Entities** | What pieces of data need to be stored? | Look at what's DISPLAYED in UI |
| **Relationships** | What are the relationships between data? | Look at lists, dropdowns, links |
| **User Actions** | What user actions modify data? | Look at buttons, forms, CTAs |
| **Action Effects** | How does each action affect data? | Only operations visible in UI |
| **Business Rules** | What validation/constraints apply? | Often missing - verify or ask |
| **Authorization** | Who can perform each action? | Often missing - verify or ask |

#### API Contract - TYPICALLY DERIVED

Derive from UI + ask clarifying questions:

| Category | Discovery Question |
|----------|-------------------|
| **Endpoints** | What operations are needed? (Only UI-visible actions) |
| **Consumers** | Who calls this API? (webapp, mobile, external) |
| **Error Cases** | What can go wrong? |

#### Frontend (webapp) - TYPICALLY WELL-SPECIFIED

External specs usually have good detail here. Extract rather than ask:

| Category | Discovery Question | Where to Find |
|----------|-------------------|---------------|
| **Pages/Views** | What screens does the user see? | Mockups |
| **Forms** | What data does the user input? | Form mockups |
| **States** | Loading, empty, error states? | May be missing |

### Visual Assets Prompt

When UI/UX is involved and spec doesn't include visual assets:

```text
Do you have any visual assets I can reference?
  - Mockups or wireframes (Figma, Sketch, etc.)
  - Screenshots of existing UI
  - Rough sketches or drawings
  - Reference images from other products

If you can share images, I can extract much more accurate
requirements than from text descriptions alone.
```

**Skip this if** spec already includes images or links to design tools.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns detected project type and a list of components with names, types, and settings.

## Skills

Use the following skills for reference:
- `project-settings` — Authoritative source for component settings schema, types, defaults, validation rules, and directory mappings

## Available Components

The Scaffolding Skill column shows which skill handles scaffolding for each component type. These are informational references — this skill does not invoke them.

| Component | Description | Scaffolding Skill | Multi-Instance |
|-----------|-------------|-------------------|----------------|
| `config` | YAML configuration (MANDATORY) | `config-scaffolding` | No (singleton) |
| `contract` | OpenAPI specification | `contract-scaffolding` | Yes |
| `server` | Node.js backend (CMDO pattern) | `backend-scaffolding` | Yes |
| `webapp` | React frontend (MVVM pattern) | `frontend-scaffolding` | Yes |
| `database` | PostgreSQL migrations/seeds | `database-scaffolding` | Yes |
| `helm` | Kubernetes Helm charts | `helm-scaffolding` | Yes |
| `testing` | Testkube test setup | (inline) | Yes |
| `cicd` | GitHub Actions workflows | (inline) | Yes |

## Workflow

### Step 1: Analyze Requirements

Map discovered information to technical needs:

| Discovery Element | Technical Implication | Settings Impact |
|-------------------|----------------------|-----------------|
| Multiple user types with different UIs | Consider separate webapps | Each webapp has `contracts` |
| Data persistence mentioned | Database component | Server has `databases` |
| Background processing | Worker server | `server_type: worker` or `hybrid` |
| Scheduled jobs | Cron server | `server_type: cron` or `hybrid` |
| API/backend workflows | Server with contract | `provides_contracts` |
| Calling external APIs | | `consumes_contracts` |
| External HTTP access | Ingress needed | `ingress: true` |
| Internal service only | No ingress | `ingress: false` |

### Step 2: Present Recommendation with Settings

```text
Based on what you've described, I recommend:

**Components:**
- **Backend API Server** - to handle <workflows>
  - Provides: task-api contract
  - Uses: task-db database
  - Mode: API server with HTTP ingress

- **Web Frontend** - for <user types>
  - Consumes: task-api contract
  - Deployment: Bundled assets with ingress

- **Database** - to persist <entities>
  - PostgreSQL (shared in local dev)

[Additional components with justification]

Does this match what you had in mind?
```

### Step 3: Handle Adjustments

If user wants changes, update both components and settings:

1. **Adding database to server**: Add to `databases` array
2. **Adding contract**: Ask if provides or consumes
3. **Enabling background processing**: Change `server_type` to `hybrid`, add `worker` to `modes`
4. **Disabling ingress**: Set `ingress: false` on helm chart

### Step 4: Multiple Component Instances

**For Server (if multiple processing needs):**

```text
Should the backend be a single service or multiple?
- Single API server
- API + Worker (hybrid mode in one deployment)
- Separate API and Worker servers (independent scaling)
```

If hybrid: One server with `server_type: hybrid`, `modes: [api, worker]`
If separate: Two servers, potentially two helm charts with different `deploy_modes`

**For Helm (multiple deployment configurations):**

A single server can have multiple helm charts:
- `main-server-api` with `deploy_modes: [api]` and `ingress: true`
- `main-server-worker` with `deploy_modes: [worker]` and `ingress: false`

This allows independent scaling of API and worker processes.

### Step 5: Settings Validation

Before returning, validate the discovered configuration against the rules defined in the `project-settings` skill (cross-reference validation for databases, contracts, helm, hybrid modes, and deploy modes).

### Step 6: Return Configuration

Return the final configuration with all settings.

## Examples

### Example 1: Standard Full-Stack

```yaml
project_type: "fullstack"
components:
  - name: config
    type: config
    settings: {}
  - name: public-api
    type: contract
    settings:
      visibility: internal
  - name: app-db
    type: database
    settings:
      provider: postgresql
      dedicated: false
  - name: main-server
    type: server
    settings:
      server_type: api
      databases: [app-db]
      provides_contracts: [public-api]
      consumes_contracts: []
      helm: true
  - name: web-app
    type: webapp
    settings:
      contracts: [public-api]
      helm: true
  - name: main-server-api
    type: helm
    settings:
      deploys: main-server
      deploy_type: server
      deploy_modes: [api]
      ingress: true
  - name: web-app-chart
    type: helm
    settings:
      deploys: web-app
      deploy_type: webapp
      ingress: true
      assets: bundled
```

### Example 2: Microservices with Hybrid Server

```yaml
project_type: "custom"
components:
  - name: config
    type: config
    settings: {}
  - name: orders-api
    type: contract
    settings:
      visibility: internal
  - name: notifications-api
    type: contract
    settings:
      visibility: internal
  - name: orders-db
    type: database
    settings:
      provider: postgresql
      dedicated: false
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
      databases: []
      provides_contracts: [notifications-api]
      consumes_contracts: []
      helm: true
  # Separate helm charts for independent scaling
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
```

## Notes

### Critical: No System Modifications

- **NEVER modifies `sdd-settings.yaml`** - only documents in SPEC.md
- **NEVER scaffolds components** - that's implementation phase
- **NEVER creates any files** - purely analytical

### Workflow Position

```text
External Spec → Transformation → **Component Discovery** → Decomposition → SPEC.md
                                        ↓
                                  Documents in SPEC.md
                                  (no system changes)
```

### When Components Are Created

Components are actually created during **implementation phase**:
1. SPEC.md documents needed components
2. PLAN.md confirms components to scaffold
3. Implementation phase updates `sdd-settings.yaml`
4. Implementation phase scaffolds new components

### General Notes

- This skill is conversational and handles user interaction for adjustments
- The output is used by `spec-writing` skill to populate Components section
- Always validate settings dependencies before accepting the final configuration
- **Config is MANDATORY**: Always include `{type: config, name: config, settings: {}}` first
- Settings drive what gets scaffolded - they are not just metadata
- For external specs, run ONCE before decomposition (not per-item)
