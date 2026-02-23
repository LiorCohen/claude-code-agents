---
name: planning-standards
description: Agent assignment guidance, architecture patterns, and dependency ordering for fullstack-typescript plans.
user-invocable: false
---

# Planning Standards Skill

Tech-specific plan generation guidance for the fullstack-typescript stack. Provides agent assignment rules, architecture patterns, and dependency ordering that the core `planning` skill uses when generating PLAN.md files for this tech pack.

---

## Agent Assignment Rules

Each plan phase is assigned to the agent best suited for that component type. Agents are defined in the tech pack manifest (`techpack.yaml` under `components.<type>.agent` and `lifecycle.<phase>.agent`).

| Phase Type | Agent | Notes |
|------------|-------|-------|
| API / Contract design | `api-designer` | OpenAPI spec authoring, schema design, type generation |
| Backend / Server implementation | `backend-dev` | CMDO architecture, Node.js/TypeScript services |
| Frontend / Webapp implementation | `frontend-dev` | MVVM architecture, React/TanStack/TailwindCSS |
| Database / Migration work | `backend-dev` | Load `database-standards` skill alongside backend standards |
| Testing (integration, E2E) | `tester` | Vitest integration suites, Playwright E2E flows |
| Infrastructure / Helm / CI/CD | `devops` | Helm charts, GitHub Actions pipelines, Kubernetes |
| Review / Verification | reviewer | Not an explicit agent file -- use the `lifecycle.verification` path in the manifest |

### Agent Selection Logic

1. Read `components.<type>.agent` from `techpack.yaml` for component implementation phases.
2. Read `lifecycle.testing.agent` for integration and E2E testing phases.
3. Read `lifecycle.verification.agent` for review phases.
4. When a phase touches multiple component types, assign the agent for the primary component and list secondary standards as additional skill references.

---

## Architecture Patterns

### Backend: CMDO (Controller-Model-DAL-Operator)

All server components follow the CMDO architecture. Plans referencing backend work should assume this layering.

| Layer | Responsibility |
|-------|----------------|
| **Controller** | HTTP handlers, request validation, dependency injection. Receives raw I/O from Operator and combines with config to create domain-specific operations. |
| **Model** | Business logic split into `definitions/` (TypeScript types only) and `use-cases/` (one function per file, receives Dependencies). No external imports. |
| **DAL** | Data Access Layer. One function per file, parameterized queries, maps DB rows to domain objects. No repository pattern. |
| **Operator** | Process lifecycle management. Creates database connections, HTTP servers, telemetry. Manages startup/shutdown state machine and Unix signals. No domain knowledge. |

Plan phases for backend work should follow the implementation order: Contract first, then Model, then DAL, then Controller, then Operator (only if new infrastructure is needed).

### Frontend: MVVM (Model-View-ViewModel)

All webapp components follow the MVVM architecture. Plans referencing frontend work should assume this layering.

| Layer | Responsibility |
|-------|----------------|
| **View** | React components styled with TailwindCSS and Shadcn UI. No business logic -- only renders data from ViewModel and calls ViewModel handlers. |
| **ViewModel** | TanStack Query hooks for server state management. `useReducer` + Context for global client state. Connects Views to Models. |
| **Model** | Business logic with no React dependencies. Framework-agnostic functions for formatting, validation, permissions, and transformations. |

Plan phases for frontend work should follow: API types consumed from contract packages first, then Model (business logic), then ViewModel (hooks), then View (components).

---

## Dependency Ordering (API-First)

Plans must order phases by the tech pack's dependency graph. The fullstack-typescript stack follows an API-first approach where contracts define the interface before implementations are built.

| Order | Component Type | Rationale |
|-------|---------------|-----------|
| 1 | API Contracts / Interfaces | Define the API surface before anything consumes or implements it |
| 2 | Data Models / Database | Schema and migrations before services that read/write data |
| 3 | Backend Services / Business Logic | Implement API endpoints and business rules using contracts and database |
| 4 | Frontend Components / UI | Consume contracts for type-safe API calls, render UI |
| 5 | Infrastructure / DevOps | Helm charts and CI/CD pipelines after deployable components exist |

### Scaffolding Phase

If any components listed in SPEC.md do not yet exist in `sdd-settings.yaml`, prepend a **Phase 1: Component Scaffolding** before the implementation phases. Scaffolding order follows the same dependency ordering above. See the `scaffolding` skill for orchestration details.

### Testing Phases

After all implementation phases:

1. **Integration Testing** -- after server and database phases are complete.
2. **E2E Testing** -- after server and webapp phases are complete.

### Review Phase

Always the final phase. Uses the verification lifecycle from the manifest, not a dedicated agent file.

---

## Standards per Phase

Each plan phase must reference the applicable standards skills so the assigned agent loads them during implementation.

| Phase | Standards Skills |
|-------|-----------------|
| Contract | `typescript-standards`, `contract-standards` |
| Backend | `typescript-standards`, `backend-standards`, `database-standards`, `unit-testing` |
| Frontend | `typescript-standards`, `frontend-standards`, `unit-testing` |
| Integration Testing | `integration-testing-standards` |
| E2E Testing | `e2e-testing-standards` |
| Infrastructure | `helm-standards`, `cicd-standards` |

Standards are resolved via the skills router: invoke `techpacks.routeSkills(phase: implementation, component_type: <type>)` to get the exact skill paths for the active tech pack.

---

## Input / Output

This skill defines no input parameters or structured output. It is consumed as guidance by the core `planning` skill during plan generation.
