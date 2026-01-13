# Spec-Driven Development (SDD) Plugin

**Version:** 1.9.0

A comprehensive Claude Code plugin for spec-driven development methodology designed for full-stack TypeScript/React teams.

## Overview

This plugin implements a complete workflow where **specifications are the source of truth**. Every feature, abstraction, and domain concept lives in markdown specifications before it lives in code.

```
Specs → Plans → Implementation → Tests → Validation
  ↑                                           |
  └───────────── Feedback Loop ───────────────┘
```

## Key Features

### 10 Specialized Agents
Agents handle different aspects of the development lifecycle:
- **spec-writer** (opus) - Create/maintain specifications
- **planner** (opus) - Break specs into implementation phases
- **api-designer** (sonnet) - Design OpenAPI contracts
- **frontend-dev** (sonnet) - React components (MVVM architecture)
- **backend-dev** (sonnet) - 5-layer Node.js backend
- **db-advisor** (opus) - Database performance review
- **devops** (sonnet) - Kubernetes, Helm, Testkube
- **ci-dev** (sonnet) - CI/CD pipelines
- **tester** (sonnet) - Test automation via Testkube
- **reviewer** (opus) - Code review and spec compliance

### 5 Slash Commands
Project lifecycle automation:
- `/sdd-init` - Initialize new project from template
- `/sdd-new-feature` - Create feature spec and plan
- `/sdd-implement-plan` - Execute implementation plan
- `/sdd-verify-spec` - Verify implementation matches spec
- `/sdd-generate-snapshot` - Regenerate product snapshot

### Architectural Patterns
- **5-Layer Backend Architecture** - Strict separation: Server → Controller → Model → Dependencies → DAL
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

1. Clone the marketplace repository:
   ```bash
   git clone https://github.com/LiorCohen/claude-code-plugins.git
   cd claude-code-plugins
   ```

2. Configure Claude Code to use this marketplace (add to settings)

3. The plugin will be automatically discovered and available

### Usage

1. **Initialize a new project**:
   ```
   /sdd-init my-app
   ```

2. **Create your first feature**:
   ```
   /sdd-new-feature user-authentication
   ```

3. **Review the generated spec and plan**, then implement:
   ```
   /sdd-implement-plan specs/features/2026/01/13/user-authentication/PLAN.md
   ```

4. **Verify implementation matches spec**:
   ```
   /sdd-verify-spec specs/features/2026/01/13/user-authentication/SPEC.md
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
│   │   └── entities/             # Entity specifications
│   ├── architecture/             # Architecture documentation
│   └── features/                 # Feature specifications
│       └── YYYY/MM/DD/<feature-name>/
│           ├── SPEC.md           # Feature specification
│           └── PLAN.md           # Implementation plan
├── components/
│   ├── contract/                 # OpenAPI specs (types generated here)
│   ├── server/                   # Node.js backend (5-layer architecture)
│   ├── webapp/                   # React frontend (MVVM architecture)
│   ├── helm/                     # Kubernetes deployment charts
│   └── testing/                  # Testkube test definitions
└── .github/workflows/            # CI/CD pipelines
```

## Core Principles

1. **Specifications are truth** - Every feature lives in a SPEC.md before implementation
2. **Issue tracking required** - Every spec must reference a tracking issue (JIRA, GitHub, etc.)
3. **Git as state machine** - PR = draft spec, merged to main = active spec
4. **Contract-first API** - OpenAPI specs generate TypeScript types for both frontend and backend
5. **Test in Kubernetes** - Testkube for environment parity (integration/E2E tests run in K8s)
6. **Observable by default** - OpenTelemetry for all services from day one

## Backend Architecture (5 Layers)

Strict architectural separation enforced by the `backend-dev` agent:

```
Server → Controller → Model Use Cases
   ↓         ↓            ↑
Config → [All layers] → Dependencies (injected)
                           ↓
                         DAL
```

**Layer Responsibilities:**
- **Server layer**: HTTP lifecycle, middleware, routes, graceful shutdown
- **Config layer**: Environment parsing, validation, type-safe config objects
- **Controller layer**: Request/response handling, creates Dependencies for Model
- **Model layer**: Business logic (definitions + use-cases), never imports from outside
- **DAL layer**: Data access, queries, DB ↔ domain object mapping

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
├── models/                 # Business logic and data models
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
5. Implement backend with `backend-dev` agent (5-layer architecture)
6. Implement frontend with `frontend-dev` agent (consume generated types)
7. Add tests with `tester` agent (Testkube)
8. Review with `reviewer` and `db-advisor` agents
9. Validate spec compliance with `/sdd-verify-spec`

## Validation Scripts

Python utilities for spec management:

```bash
# Validate single spec
python scripts/validate-spec.py specs/features/2026/01/11/my-feature/SPEC.md

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
title: Feature Name
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
