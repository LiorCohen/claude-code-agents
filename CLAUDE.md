# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **Claude Code plugin** for spec-driven development methodology. It provides specialized agents, commands, and templates for full-stack TypeScript/React development with strict architectural patterns.

## Project Structure

```
sdd/
├── plugin/
│   ├── agents/          # 10 specialized agents (spec-writer, backend-dev, etc.)
│   ├── commands/        # 5 slash commands (/project:init-project, /project:new-feature, etc.)
│   ├── skills/          # 4 reusable skills
│   ├── templates/       # Project scaffolding (contract, server, webapp, helm)
│   ├── scripts/         # Python validation utilities
│   ├── plugin.json      # Plugin configuration
│   ├── README.md        # Plugin documentation
│   └── QUICKSTART.md    # Getting started guide
```

## Core Methodology

This plugin implements a **specification-driven workflow**:

1. **Specifications are truth** - Every feature lives in a SPEC.md before implementation
2. **Issue tracking required** - Every spec must reference a tracking issue (JIRA, GitHub, etc.)
3. **Git as state machine** - PR = draft spec, merged to main = active spec
4. **Contract-first API** - OpenAPI specs generate TypeScript types for both frontend and backend
5. **5-layer backend architecture** - Strict separation: Server → Controller → Model → Dependencies → DAL
6. **Immutability enforced** - `readonly` everywhere, no mutations, native JavaScript only
7. **OpenTelemetry by default** - All services emit structured logs, metrics, and traces

## Key Components

### Agents (`plugin/agents/`)

10 specialized agents, each with specific roles and model assignments:

| Agent | Model | Purpose |
|-------|-------|---------|
| `spec-writer` | opus | Create/maintain specifications |
| `planner` | opus | Break specs into implementation phases |
| `api-designer` | sonnet | Design OpenAPI contracts |
| `frontend-dev` | sonnet | React components (consumes generated types) |
| `backend-dev` | sonnet | 5-layer Node.js backend |
| `db-advisor` | opus | Database performance review |
| `devops` | sonnet | Kubernetes, Helm, Testkube |
| `ci-dev` | sonnet | CI/CD pipelines |
| `tester` | sonnet | Test automation via Testkube |
| `reviewer` | opus | Code review and spec compliance |

### Commands (`plugin/commands/`)

5 slash commands for project lifecycle:

- `/project:init-project [name]` - Initialize new project structure
- `/project:new-feature [name]` - Create spec and plan for new feature
- `/project:implement-spec [path]` - Orchestrate implementation across agents
- `/project:verify-spec [path]` - Verify implementation matches spec
- `/project:generate-snapshot` - Regenerate product state snapshot

### Validation Scripts (`plugin/scripts/`)

Python utilities for spec management:

```bash
# Validate single spec
python scripts/validate-spec.py specs/features/my-feature/SPEC.md

# Validate all specs
python scripts/validate-spec.py --all --specs-dir specs/

# Generate specs index
python scripts/generate-index.py --specs-dir specs/

# Generate product snapshot
python scripts/generate-snapshot.py --specs-dir specs/
```

## Backend Architecture (5 Layers)

The `backend-dev` agent enforces strict architectural separation:

```
Server → Controller → Model Use Cases
   ↓         ↓            ↑
Config → [All layers] → Dependencies (injected)
                           ↓
                         DAL
```

**Key principles:**
- **Server layer**: HTTP lifecycle, middleware, routes, graceful shutdown
- **Config layer**: Environment parsing, validation, type-safe config objects
- **Controller layer**: Request/response handling, creates Dependencies for Model
- **Model layer**: Business logic (definitions + use-cases), never imports from outside
- **DAL layer**: Data access, queries, DB ↔ domain object mapping

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

## Frontend Architecture

The `frontend-dev` agent enforces:

- **No implicit global code** - All code must be explicitly invoked
- **Type consumption only** - Never hand-write API types, consume from `components/contract/`
- **React Query** for server state
- **Zustand or Context** for client state
- **TypeScript strict mode** - No `any`, prefer `readonly` for props

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

## Tech Stack

- **API Contract**: OpenAPI 3.x
- **Backend**: Node.js 20, TypeScript 5, Express
- **Frontend**: React 18, TypeScript 5, Vite
- **Database**: PostgreSQL 15
- **Testing**: Vitest (unit), Testkube (integration/E2E)
- **Deployment**: Kubernetes, Helm
- **Observability**: OpenTelemetry

## Development Workflow

1. Create spec with `spec-writer` agent (requires issue reference)
2. Generate plan with `planner` agent
3. Design API contract with `api-designer` agent (OpenAPI)
4. Generate TypeScript types from OpenAPI spec
5. Implement backend with `backend-dev` agent (5-layer architecture)
6. Implement frontend with `frontend-dev` agent (consume generated types)
7. Add tests with `tester` agent (Testkube)
8. Review with `reviewer` and `db-advisor` agents
9. Validate spec compliance with `/project:verify-spec`

## Important Files

When using this plugin to initialize projects:

| File | Purpose |
|------|---------|
| `specs/INDEX.md` | Registry of all specifications |
| `specs/SNAPSHOT.md` | Current product state snapshot |
| `specs/domain/glossary.md` | Domain terminology definitions |
| `components/contract/openapi.yaml` | API contract (source of truth for types) |

## Notes for Claude Code

- This is a **plugin repository**, not a project using the plugin
- The plugin files define agents, commands, and templates
- To use the plugin: Install it in Claude Code, then run `/project:init-project` in a new directory
- All agent definitions enforce strict patterns (immutability, 5-layer architecture, type safety)
- Specs are validated by Python scripts that check for required frontmatter fields

### Version Management (CRITICAL)

When making changes to the plugin, you MUST follow this exact sequence:

1. **Make your code changes** to agents, commands, skills, templates, etc.
2. **Bump the version** in both:
   - `plugin/.claude-plugin/plugin.json`
   - `.claude-plugin/marketplace.json`
3. **Update CHANGELOG.md** with a new version entry that includes:
   - Version number and date
   - Clear description of what changed
   - Category (Added, Enhanced, Fixed, Removed, etc.)
4. **Commit all changes together** (code changes + version bump + CHANGELOG update)

**NEVER commit a version bump without a corresponding CHANGELOG entry.**

Example workflow:
```
1. Edit plugin/agents/backend-dev.md (add new feature)
2. Update version 1.1.0 → 1.1.1 in both plugin.json files
3. Add [1.1.1] entry to plugin/CHANGELOG.md describing the feature
4. git commit -am "Add feature X, bump to 1.1.1"
```
