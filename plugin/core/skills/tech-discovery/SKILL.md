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
- During `/sdd I want to create a new feature` interactive mode to identify needed components

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

Returns a list of components with names, types, and settings.

Component settings from this output (server_type, databases, provides_contracts, etc.) flow into the SPEC.md `## Components` section's Settings column, where they inform the scaffolding phase during implementation.

## Skills

Use the following skills for reference:
- `techpacks` — Gateway for all tech-pack interactions. Use `techpacks.listComponents` to get available component types and `techpacks.routeSkills(phase: component-discovery)` to load tech-specific discovery knowledge.

## Available Components

Invoke `techpacks.listComponents` for the active tech pack namespace to get the full list of available component types, their descriptions, directory patterns, and whether they support multiple instances. Do NOT hardcode component types — the tech pack manifest is the source of truth.

## Workflow

### Step 1: Analyze Requirements

Map discovered information to technical needs:

Map discovered information to component types from the tech pack. Use `techpacks.routeSkills(phase: component-discovery)` to load the tech-specific discovery knowledge that maps requirements to component types and settings.

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

Before returning, validate discovered configuration against the `project-settings` skill's cross-reference rules: databases referenced by servers must exist as database components, contracts must exist as contract components, helm `deploy_modes` must be valid for the server's `server_type`, and `deploys` must reference an existing server or webapp.

### Step 6: Return Configuration

Return the final configuration with all settings.

## Examples

### Example 1: Standard Full-Stack

```yaml
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
- Component list is stored in context.md. During spec solicitation, the `spec-solicitation` skill populates the Components section of SPEC.md using discovered components and solicited technical details
- Always validate settings dependencies before accepting the final configuration
- **Config is MANDATORY**: Always include `{type: config, name: config, settings: {}}` first
- Settings drive what gets scaffolded - they are not just metadata
- For external specs, run ONCE before decomposition (not per-item)
