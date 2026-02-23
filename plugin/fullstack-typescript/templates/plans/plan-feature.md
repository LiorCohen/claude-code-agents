## Overview

Implementation plan for: <title>

Specification: [SPEC.md](./SPEC.md)

## Affected Components

<!-- Generated from sdd/sdd-settings.yaml -->
- <component-1> (contract)
- <component-2> (server)
- <component-3> (webapp)

## Prerequisites

> Only include if `prerequisites` provided

Complete implementation of the following changes before starting:
- <prerequisite_1>
- <prerequisite_2>

## Implementation Phases

<!-- Phases generated dynamically based on affected components -->
<!-- Domain updates are executed from SPEC.md ## Domain Updates section -->

### Phase 1: [Component Name] - API Contract
**Agent:** `api-designer`
**Component:** <component-name>
**Standards:** `typescript-standards`, `contract-standards`

Tasks:
- [ ] Define endpoints with operationId, request/response schemas per contract-standards
- [ ] Generate TypeScript types from OpenAPI spec

Deliverables:
- Updated OpenAPI spec with Spectral validation passing
- Generated TypeScript types

### Phase 2: [Component Name] - Backend Implementation
**Agent:** `backend-dev`
**Component:** <component-name>
**Standards:** `typescript-standards`, `backend-standards`, `database-standards`, `unit-testing`

Tasks:
- [ ] Implement Model layer (definitions + use-cases with dependency injection)
- [ ] Implement DAL layer (one function per file, parameterized queries)
- [ ] Wire Controller layer (HTTP handlers, create Dependencies)
- [ ] Write unit tests per layer using TDD (red-green-refactor)
- [ ] Add telemetry (structured logging, metrics, spans)

Deliverables:
- Working API endpoints following CMDO architecture
- Unit tests passing

### Phase 3: [Component Name] - Frontend Implementation
**Agent:** `frontend-dev`
**Component:** <component-name>
**Standards:** `typescript-standards`, `frontend-standards`, `unit-testing`

Tasks:
- [ ] Create View components (TailwindCSS only, no business logic)
- [ ] Create ViewModel hooks (TanStack Query for server state)
- [ ] Implement page-specific Model (business logic, no React dependencies)
- [ ] Write unit tests per layer using TDD (red-green-refactor)

Deliverables:
- Working UI following MVVM architecture
- Unit tests passing

### Phase N-1: Integration & E2E Testing
**Agent:** `tester`
**Standards:** `testing-standards`, `integration-testing`, `e2e-testing`

Tasks:
- [ ] Integration tests for API layer (test database, HTTP endpoints)
- [ ] E2E tests for user flows (Playwright, data-testid selectors)

Deliverables:
- Test suites passing

### Phase N: Review
**Agent:** `reviewer`, `db-advisor` (if DB changes)
**Standards:** `typescript-standards`, `backend-standards`, `frontend-standards`, `unit-testing`

Tasks:
- [ ] Spec compliance review
- [ ] Standards compliance verification (per-phase standards listed above)
- [ ] Database review (if applicable)

## Expected Files

> List files expected to be created or modified by this change

### Files to Create

| File | Component | Description |
|------|-----------|-------------|
| `path/to/new-file.ts` | server | [Purpose] |

### Files to Modify

| File | Component | Description |
|------|-----------|-------------|
| `path/to/existing-file.ts` | server | [What changes] |

## Implementation State

> Updated during implementation to track progress. Enables session resumption.

### Current Phase

- **Phase:** [Not started | 1 | 2 | ... | Complete]
- **Status:** [pending | in_progress | blocked | complete]
- **Last Updated:** YYYY-MM-DD HH:MM

### Completed Phases

| Phase | Completed | Notes |
|-------|-----------|-------|
| 1 | [ ] | |
| 2 | [ ] | |

### Actual Files Changed

> Updated during implementation with actual files created/modified

| File | Action | Phase | Notes |
|------|--------|-------|-------|
| | | | |

### Blockers

> Any blockers encountered during implementation

- (none)

### Resource Usage

> Track tokens, turns, and time consumed during implementation

| Phase | Tokens (Input) | Tokens (Output) | Turns | Duration | Notes |
|-------|----------------|-----------------|-------|----------|-------|
| 1 | - | - | - | | |
| 2 | - | - | - | | |
| ... | - | - | - | | |
| **Total** | **-** | **-** | **-** | **-** | |

## Dependencies

- [External dependencies or blockers]

## Risks

| Risk | Mitigation |
|------|------------|
| [Risk] | [How to mitigate] |
