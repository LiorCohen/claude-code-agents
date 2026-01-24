# CLAUDE.md - SDD Plugin

This file provides guidance to Claude Code when working with the Spec-Driven Development (SDD) plugin.

## Plugin Overview

This is the **Spec-Driven Development (SDD) plugin** for Claude Code. It provides specialized agents, commands, and templates for full-stack TypeScript/React development with strict architectural patterns.

## Core Methodology

This plugin implements a **specification-driven workflow**:

1. **Specifications are truth** - Every change lives in a SPEC.md before implementation
2. **Change types** - Changes can be `feature`, `bugfix`, or `refactor` with type-specific templates
3. **Issue tracking required** - Every spec must reference a tracking issue (JIRA, GitHub, etc.)
4. **Git as state machine** - PR = draft spec, merged to main = active spec
5. **Contract-first API** - OpenAPI specs generate TypeScript types for both frontend and backend
6. **CMDO backend architecture** - "Commando" (Controller Model DAL Operator) with strict infrastructure/domain separation
7. **Immutability enforced** - `readonly` everywhere, no mutations, native JavaScript only
8. **OpenTelemetry by default** - All services emit structured logs, metrics, and traces

## Key Components

### Agents (`agents/`)

10 specialized agents, each with specific roles and model assignments:

| Agent | Model | Purpose |
|-------|-------|---------|
| `spec-writer` | opus | Create/maintain specifications |
| `planner` | opus | Break specs into implementation phases |
| `api-designer` | sonnet | Design OpenAPI contracts |
| `frontend-dev` | sonnet | React components (MVVM architecture) |
| `backend-dev` | sonnet | CMDO architecture Node.js backend |
| `db-advisor` | opus | Database performance review |
| `devops` | sonnet | Kubernetes, Helm, Testkube |
| `ci-dev` | sonnet | CI/CD pipelines |
| `tester` | sonnet | Test automation via Testkube |
| `reviewer` | opus | Code review and spec compliance |

### Commands (`commands/`)

5 slash commands for project lifecycle:

- `/sdd-init --name [name]` - Initialize new project structure
- `/sdd-new-change --type [type] --name [name]` - Create spec and plan for new change
- `/sdd-implement-change [path]` - Orchestrate implementation across agents
- `/sdd-verify-spec [path]` - Verify implementation matches spec
- `/sdd-generate-snapshot` - Regenerate product state snapshot

### Change Types

The plugin supports three types of changes:

| Type | Purpose | Plan Phases |
|------|---------|-------------|
| `feature` | New functionality | Domain → Contract → Backend → Frontend → Testing → Review |
| `bugfix` | Fix existing behavior | Investigation → Implementation → Testing → Review |
| `refactor` | Code restructuring | Preparation → Implementation → Testing → Review |

### Validation Scripts (`scripts/`)

Python utilities for spec management:

```bash
# Validate single spec
python scripts/validate-spec.py specs/changes/2026/01/21/my-change/SPEC.md

# Validate all specs
python scripts/validate-spec.py --all --specs-dir specs/

# Generate specs index
python scripts/generate-index.py --specs-dir specs/

# Generate product snapshot
python scripts/generate-snapshot.py --specs-dir specs/
```

## Core Architectural Patterns

| Pattern | Component | Description |
|---------|-----------|-------------|
| **CMDO** | Server | Controller Model DAL Operator - strict infrastructure/domain separation |
| **MVVM** | Webapp | Model-View-ViewModel with TanStack ecosystem |
| **Database** | Database | PostgreSQL migrations, seeds, management scripts |
| **Contract-First** | Contract | OpenAPI specs generate TypeScript types |

## Backend Architecture: CMDO ("Commando")

The `backend-dev` agent enforces strict **C**ontroller **M**odel **D**AL **O**perator architecture:

```
Operator → Controller → Model Use Cases
   ↓            ↓              ↑
Config → [All layers] → Dependencies (injected by Controller)
                               ↓
                             DAL
```

**Key principles:**
- **Operator layer**: Raw I/O capabilities (DB, HTTP clients, cache) - **NO domain knowledge**
  - Manages lifecycle via state machine (IDLE → STARTING → RUNNING → STOPPING → STOPPED)
  - Lifecycle probes run on separate port (default 9090) for Kubernetes health checks
  - Graceful startup and shutdown with proper sequencing
- **Config layer**: Environment parsing, validation, type-safe config objects, URLs and settings
- **Controller layer**: Combines I/O + config for domain-specific operations, creates Dependencies for Model
- **Model layer**: Business logic (definitions + use-cases), never imports from outside
- **DAL layer**: Data access, queries, DB ↔ domain object mapping

**Infrastructure vs Domain separation:**
| Layer | Knows About | Example |
|-------|-------------|---------|
| **Operator** | Infrastructure only | "Here's a DB connection and generic HTTP client" |
| **Config** | URLs and settings | `paymentGatewayUrl: "https://api.stripe.com"` |
| **Controller** | Domain concerns | "Use httpClient + paymentGatewayUrl to charge a card" |
| **Model** | Business logic only | "Calculate total, then call chargePayment()" |

**Immutability rules:**
- All interfaces use `readonly` properties
- Use `ReadonlyArray<T>`, `Readonly<T>`, `ReadonlyMap<K,V>`, `ReadonlySet<T>`
- Arrow functions only (no `function` keyword)
- Native JavaScript only (no lodash, ramda, immer)
- Spread operators for updates (never mutation)

**Use case pattern (mandatory):**
```typescript
// One use-case per file in src/model/use-cases/
const createUser = async (
  deps: Dependencies,
  args: CreateUserArgs
): Promise<CreateUserResult> => {
  // Business logic using only injected dependencies
};
```

## Frontend Architecture (MVVM)

The `frontend-dev` agent enforces strict MVVM architecture:

- **Model Layer** (`src/models/`, `src/services/`) - Business logic, API communication
- **ViewModel Layer** (`src/viewmodels/`, page-specific hooks) - React hooks connecting Model to View
- **View Layer** (`src/pages/`, `src/components/`) - React components with TailwindCSS

**TanStack Ecosystem (Mandatory):**
- TanStack Router for all navigation
- TanStack Query for all server state
- TanStack Table for tabular data
- TanStack Form for complex forms

**Key Rules:**
- No implicit global code - all code must be explicitly invoked
- Type consumption only - never hand-write API types, consume from `components/contract/`
- TailwindCSS only - no CSS files, no inline styles, no CSS-in-JS
- Prefer `readonly` for all props and state types

## Telemetry Requirements

All backend services must include:

1. **Structured logging** with Pino + OpenTelemetry context injection
2. **Required log fields**: `level`, `time`, `component`, `msg`, `traceId`, `spanId`
3. **Standard metrics**: HTTP request duration/count, DB operation duration, business operation count
4. **Custom spans** for business operations with semantic attributes
5. **Initialize first** - Import telemetry before any other code

## Spec File Format

All specs in `specs/` must include frontmatter:

```yaml
---
title: Change Name
type: feature | bugfix | refactor
status: active | deprecated | superseded | archived
domain: Identity | Billing | Core | ...
issue: PROJ-1234                    # Required: tracking issue
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

**Acceptance criteria** must use Given/When/Then format:

```markdown
- [ ] **AC1:** Given [precondition], when [action], then [result]
```

## Tech Stack

- **API Contract**: OpenAPI 3.x
- **Backend**: Node.js 20, TypeScript 5, Express
- **Frontend**: React 18, TypeScript 5, Vite
- **Database**: PostgreSQL 15
- **Testing**: Vitest (unit), Testkube (integration/E2E)
- **Deployment**: Kubernetes, Helm
- **Observability**: OpenTelemetry, Pino

## Development Workflow

1. Create spec with `spec-writer` agent (requires issue reference)
2. Generate plan with `planner` agent
3. Design API contract with `api-designer` agent (OpenAPI)
4. Generate TypeScript types from OpenAPI spec
5. Implement backend with `backend-dev` agent (CMDO architecture)
6. Implement frontend with `frontend-dev` agent (consume generated types)
7. Add tests with `tester` agent (Testkube)
8. Review with `reviewer` and `db-advisor` agents
9. Validate spec compliance with `/sdd-verify-spec`

## Important Files (For Generated Projects)

When this plugin initializes projects, it creates:

| File/Directory | Purpose |
|----------------|---------|
| `specs/INDEX.md` | Registry of all specifications with type indicators |
| `specs/SNAPSHOT.md` | Current product state snapshot |
| `specs/domain/glossary.md` | Domain terminology definitions |
| `specs/changes/YYYY/MM/DD/<change-name>/` | Change specifications and plans (date-organized) |
| `components/contract/openapi.yaml` | API contract (source of truth for types) |

## Version Management (CRITICAL)

When making changes to this plugin, you MUST follow this exact sequence:

1. **Make your code changes** to agents, commands, skills, templates, etc.
2. **Bump the version** in both:
   - `.claude-plugin/plugin.json` (this plugin's manifest)
   - `../.claude-plugin/marketplace.json` (marketplace manifest)
3. **Update CHANGELOG.md** with a new version entry that includes:
   - Version number and date
   - Clear description of what changed
   - Category (Added, Enhanced, Fixed, Removed, etc.)
4. **Commit all changes together** (code changes + version bump + CHANGELOG update)

**NEVER commit a version bump without a corresponding CHANGELOG entry.**

Example workflow:
```
1. Edit agents/backend-dev.md (add new feature)
2. Update version in both plugin.json and marketplace.json
3. Add new entry to CHANGELOG.md describing the feature
4. git commit -am "Add feature X, bump to X.Y.Z"
```

## Notes for Claude Code

- This is a **plugin**, designed to be used via Claude Code
- The plugin files define agents, commands, and skills
- Users install this plugin, then run `/sdd-init` to create new projects
- All agent definitions enforce strict patterns (immutability, CMDO architecture, type safety)
- Specs are validated by Python scripts that check for required frontmatter fields
- When working on this plugin, test changes by using the plugin in a sample project
