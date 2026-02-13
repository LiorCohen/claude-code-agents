# Project: {{PROJECT_NAME}}

## Tech Stack

- **API Contract:** OpenAPI 3.x (path depends on contract component name in `.sdd/sdd-settings.yaml`)
- **Backend:** Node.js 20, TypeScript 5, Express (CMDO architecture)
- **Frontend:** React 19, TypeScript 5.9, Vite (MVVM architecture)
- **Database:** PostgreSQL 15
- **Testing:** Vitest (unit), Testkube (integration/E2E)
- **Deployment:** Kubernetes, Helm

## Components

| Component | Path | Purpose |
|-----------|------|---------|
| Config | `components/config/` | Environment configuration (mandatory singleton) |
| Contract | `components/contracts/{name}/` | OpenAPI spec, type generation |
| Server | `components/servers/{name}/` | Backend (CMDO architecture) |
| Webapp | `components/webapps/{name}/` | React frontend (MVVM) |
| Database | `components/databases/{name}/` | PostgreSQL migrations and seeds |
| Helm | `components/helm_charts/{name}/` | Kubernetes deployment |
| Testing | `components/testing/{name}/` | Testkube test definitions |

Component directories follow the pattern `components/{type-plural}/{name}/` (e.g., `components/contracts/public-api/`, `components/servers/main/`).

## Backend Architecture (CMDO)

**C**ontroller **M**odel **D**AL **O**perator - strict separation of concerns:

```
Operator → Controller → Model Use Cases
   ↓            ↓              ↑
Config → [All layers] → Dependencies
                              ↓
                            DAL
```

## Coding Standards (MANDATORY)

**You MUST follow the project's standards skills when writing or modifying code.** Before starting any implementation work, read the relevant standards skill to load the coding patterns. These are mandatory, not optional.

| When working on... | Standards skill to follow |
|---------------------|--------------------------|
| Any TypeScript code | `typescript-standards` |
| Backend (server) components | `backend-standards` |
| Frontend (webapp) components | `frontend-standards` |
| Database migrations/schema | `database-standards` |
| API contracts (OpenAPI) | `contract-standards` |
| Helm charts / Kubernetes | `helm-standards` |
| CI/CD pipelines | `cicd-standards` |
| Configuration | `config-standards` |
| Tests (any type) | `testing-standards` |
| Commits | `commit-standards` |

**Multiple standards apply simultaneously.** For example, backend work requires both `typescript-standards` AND `backend-standards`. Database work in a backend context requires `typescript-standards`, `backend-standards`, AND `database-standards`.

**This applies to ALL code changes** — whether through agent workflows, direct prompts, corrections, or ad-hoc requests. Never write code without first loading the relevant standards.

## Spec-Driven Development

1. **Specs are truth:** Every change needs a SPEC.md
2. **Change types:** Changes can be `feature`, `bugfix`, or `refactor`
3. **Issue required:** Every spec references a tracking issue
4. **Git = state machine:** PR = draft, merged = active

## Key Paths

| Path | Purpose |
|------|---------|
| `changes/INDEX.md` | Registry of all change specs |
| `changes/` | Change specifications (features, bugfixes, refactors) |
| `specs/` | Static domain knowledge (glossary, definitions, architecture) |
| `components/contracts/{name}/openapi.yaml` | API contract |
| `.sdd/sdd-settings.yaml` | Project settings (components, domains) |

## Claude Code Commands

- `/sdd-init --name [name]` - Initialize new project
- `/sdd-change new --type [type] --name [name]` - Start new change
- `/sdd-change new --spec [path]` - Import changes from external spec
- `/sdd-change status` - Show workflow status
- `/sdd-change continue` - Resume current workflow
- `/sdd-change approve spec [id]` - Approve spec, create plan
- `/sdd-change approve plan [id]` - Approve plan, enable implementation
- `/sdd-change implement [id]` - Implement change
- `/sdd-change verify [id]` - Verify implementation
