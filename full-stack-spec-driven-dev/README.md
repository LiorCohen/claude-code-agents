# Spec-Driven Development (SDD) Plugin

A comprehensive Claude Code plugin for spec-driven development methodology designed for full-stack TypeScript/React teams.

## Overview

This plugin implements a complete workflow where **specifications are the source of truth**. Every change (feature, bugfix, or refactor) lives in markdown specifications before it lives in code.

```
Specs → Plans → Implementation → Tests → Validation
  ↑                                           |
  └───────────── Feedback Loop ───────────────┘
```

### Core Methodology

**Specifications are Truth**: Every change starts with a spec in `specs/changes/YYYY/MM/DD/<change-name>/SPEC.md` before any code is written. Specs include:
- Frontmatter with metadata (title, type, status, domain, issue tracking)
- Type-specific sections (user stories for features, symptoms for bugfixes, goals for refactors)
- Acceptance criteria (Given/When/Then format)
- Domain concepts and constraints
- References to related specs and glossary terms

**Change Types**: The plugin supports three types of changes:
- **feature** - New functionality with full 6-phase implementation
- **bugfix** - Fix existing behavior with streamlined 4-phase process
- **refactor** - Code restructuring with streamlined 4-phase process

**Git as State Machine**: Pull requests represent draft specs. Merging to main activates them. No separate "draft" status field needed.

**Issue Tracking Required**: Every spec must reference a tracking issue (JIRA, GitHub, etc.) in the frontmatter `issue` field.

### Key Files in `specs/`

| File | Purpose |
|------|---------|
| `INDEX.md` | Registry of all specifications with type indicators - automatically updated when specs are created/modified |
| `SNAPSHOT.md` | Current state of the product - living document that describes all active changes and capabilities |
| `domain/glossary.md` | Domain terminology dictionary - single source of truth for business terms |
| `domain/definitions/` | Domain definitions - core business objects |
| `domain/use-cases/` | Business use case definitions - key workflows and scenarios |
| `architecture/` | Architecture decision records and overviews |
| `changes/YYYY/MM/DD/<name>/` | Change specifications organized by date |
| `external/` | Original external specifications (when imported) |

**INDEX.md** lists all specifications in the project with their type, making it easy to discover what exists:
- Active changes (currently implemented) with type indicator (feature, bugfix, refactor)
- Deprecated specifications (superseded or no longer used)
- External specifications (imported from external sources)

**SNAPSHOT.md** provides a high-level view of the product's current state:
- What features exist
- What capabilities the product has
- How everything fits together
- Regenerated using `/sdd-generate-snapshot` when changes are made

## Key Features

### 10 Specialized Agents
Agents handle different aspects of the development lifecycle:
- **spec-writer** (opus) - Create/maintain specifications
- **planner** (opus) - Break specs into implementation phases
- **api-designer** (sonnet) - Design OpenAPI contracts
- **frontend-dev** (sonnet) - React components (MVVM architecture)
- **backend-dev** (sonnet) - CMDO architecture Node.js backend
- **db-advisor** (opus) - Database performance review
- **devops** (sonnet) - Kubernetes, Helm, Testkube
- **ci-dev** (sonnet) - CI/CD pipelines
- **tester** (sonnet) - Test automation via Testkube
- **reviewer** (opus) - Code review and spec compliance

### 5 Slash Commands
Project lifecycle automation:
- `/sdd-init` - Initialize new project from template
- `/sdd-new-change` - Create change spec and plan (feature, bugfix, or refactor)
- `/sdd-implement-plan` - Execute implementation plan
- `/sdd-verify-spec` - Verify implementation matches spec
- `/sdd-generate-snapshot` - Regenerate product snapshot

### Architectural Patterns
- **CMDO Backend Architecture** - "Commando" (Controller Model DAL Operator) with strict infrastructure/domain separation
- **MVVM Frontend Architecture** - Model-View-ViewModel with TanStack ecosystem
- **Contract-First API Design** - OpenAPI specs generate TypeScript types for both frontend and backend
- **Immutability Enforced** - `readonly` everywhere, no mutations, native JavaScript only
- **OpenTelemetry by Default** - Full observability with structured logs, metrics, and traces

### Built-in Observability
- Structured logging with Pino + OpenTelemetry context injection
- Standard metrics: HTTP request duration/count, DB operations, business operations
- Custom spans for business operations with semantic attributes
- Trace context propagation across services

## Quick Start

### Installation

Add the marketplace and install the SDD plugin using the Claude CLI:

```bash
claude plugin marketplace add https://github.com/LiorCohen/claude-code-plugins
claude plugin install sdd
```

Or inside Claude Code:

```
/plugin marketplace add https://github.com/LiorCohen/claude-code-plugins
/plugin install sdd
```

Once installed, all commands, agents, and skills will be available immediately.

### Usage

1. **Initialize a new project**:
   ```
   /sdd-init --name my-app
   ```

2. **Create your first feature**:
   ```
   /sdd-new-change --type feature --name user-authentication
   ```

3. **Or create a bugfix**:
   ```
   /sdd-new-change --type bugfix --name fix-session-timeout
   ```

4. **Review the generated spec and plan**, then implement:
   ```
   /sdd-implement-plan specs/changes/2026/01/21/user-authentication/PLAN.md
   ```

5. **Verify implementation matches spec**:
   ```
   /sdd-verify-spec specs/changes/2026/01/21/user-authentication/SPEC.md
   ```

## Project Structure

When you initialize a project with `/sdd-init`, you get:

```
your-project/
├── specs/
│   ├── INDEX.md                   # Registry of all specifications
│   ├── SNAPSHOT.md                # Current product state
│   ├── domain/
│   │   ├── glossary.md           # Domain terminology definitions
│   │   └── definitions/          # Domain definitions
│   ├── architecture/             # Architecture documentation
│   └── changes/                  # Change specifications
│       └── YYYY/MM/DD/<change-name>/
│           ├── SPEC.md           # Change specification
│           └── PLAN.md           # Implementation plan
├── components/
│   ├── config/                   # Environment configuration
│   ├── contract/                 # OpenAPI specs (types generated here)
│   ├── server/                   # Node.js backend (CMDO architecture)
│   ├── webapp/                   # React frontend (MVVM architecture)
│   ├── database/                 # PostgreSQL migrations, seeds, scripts
│   ├── helm/                     # Kubernetes deployment charts
│   └── testing/                  # Testkube test definitions
└── .github/workflows/            # CI/CD pipelines
```

## Core Principles

1. **Specifications are truth** - Every change lives in a SPEC.md before implementation
2. **Issue tracking required** - Every spec must reference a tracking issue (JIRA, GitHub, etc.)
3. **Git as state machine** - PR = draft spec, merged to main = active spec
4. **Contract-first API** - OpenAPI specs generate TypeScript types for both frontend and backend
5. **Test in Kubernetes** - Testkube for environment parity (integration/E2E tests run in K8s)
6. **Observable by default** - OpenTelemetry for all services from day one

## Backend Architecture: CMDO ("Commando")

**C**ontroller **M**odel **D**AL **O**perator - strict separation between infrastructure and domain concerns:

```
Operator → Controller → Model Use Cases
   ↓            ↓              ↑
Config → [All layers] → Dependencies (injected by Controller)
                               ↓
                             DAL
```

**Layer Responsibilities:**
- **Operator layer**: Raw I/O capabilities (DB, HTTP clients, cache) - **NO domain knowledge**
  - Manages lifecycle via state machine (IDLE → STARTING → RUNNING → STOPPING → STOPPED)
  - Lifecycle probes run on separate port (default 9090) for Kubernetes health checks (`/health`, `/readiness`)
- **Config layer**: Environment parsing, validation, type-safe config objects, URLs and settings
- **Controller layer**: Combines I/O + config for domain-specific operations, creates Dependencies for Model
- **Model layer**: Business logic (definitions + use-cases), never imports from outside
- **DAL layer**: Data access, queries, DB ↔ domain object mapping

**Key Distinction:**
| Layer | Knows About | Example |
|-------|-------------|---------|
| **Operator** | Infrastructure only | "Here's a DB connection and generic HTTP client" |
| **Config** | URLs and settings | `paymentGatewayUrl: "https://api.stripe.com"` |
| **Controller** | Domain concerns | "Use httpClient + paymentGatewayUrl to charge a card" |
| **Model** | Business logic only | "Calculate total, then call chargePayment()" |

**Immutability Rules:**
- All interfaces use `readonly` properties
- Use `ReadonlyArray<T>`, `Readonly<T>`, `ReadonlyMap<K,V>`, `ReadonlySet<T>`
- Arrow functions only (no `function` keyword)
- Native JavaScript only (no lodash, ramda, immer)
- Spread operators for updates (never mutation)

**Use Case Pattern (Mandatory):**
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

**Directory Structure:**
```
src/
├── pages/                    # Page components (Views)
│   └── UserProfile/
│       ├── index.ts         # Exports only
│       ├── UserProfile.tsx  # View component
│       └── useUserProfileViewModel.ts  # ViewModel hook
├── components/              # Shared presentational components
├── viewmodels/             # Shared ViewModel hooks
├── models/                 # Domain logic (the "M" in MVVM)
├── services/               # API clients
├── types/                  # Generated types from OpenAPI
├── stores/                 # Global state (Zustand)
└── utils/                  # Pure utility functions
```

**TanStack Ecosystem (Mandatory):**
- **TanStack Router** - All routing and navigation
- **TanStack Query** - All server state management
- **TanStack Table** - All tabular data
- **TanStack Form** - Complex forms with validation

**Styling:**
- **TailwindCSS only** - No CSS files, no inline styles, no CSS-in-JS
- Responsive design with mobile-first approach
- Dark mode support with `dark:` variants

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

## Validation Scripts

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

## Documentation

- [Quick Start Guide](./QUICKSTART.md) - Getting started tutorial
- [Changelog](./CHANGELOG.md) - Version history and updates

## Support

For issues or questions:
- Open an issue in the [marketplace repository](https://github.com/LiorCohen/claude-code-plugins)
- Check the [Claude Code documentation](https://docs.anthropic.com/claude/docs/claude-code)

## License

MIT
