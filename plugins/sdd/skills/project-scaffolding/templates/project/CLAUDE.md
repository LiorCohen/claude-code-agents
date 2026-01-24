# Project: {{PROJECT_NAME}}

## Tech Stack

- **API Contract:** OpenAPI 3.x in `components/contract/`
- **Backend:** Node.js 20, TypeScript 5, Express (CMDO architecture)
- **Frontend:** React 18, TypeScript 5, Vite (MVVM architecture)
- **Database:** PostgreSQL 15
- **Testing:** Vitest (unit), Testkube (integration/E2E)
- **Deployment:** Kubernetes, Helm

## Components

| Component | Path | Purpose |
|-----------|------|---------|
| Config | `components/config/` | Environment configuration |
| Contract | `components/contract/` | OpenAPI spec, type generation |
| Server | `components/server*/` | Backend (CMDO architecture) |
| Webapp | `components/webapp*/` | React frontend (MVVM) |
| Helm | `components/helm/` | Kubernetes deployment |
| Testing | `components/testing/` | Testkube test definitions |

Note: Server and webapp components support multiple named instances (e.g., `server-api/`, `webapp-admin/`).

## Backend Architecture (CMDO)

**C**ontroller **M**odel **D**AL **O**perator - strict separation of concerns:

```
Operator → Controller → Model Use Cases
   ↓            ↓              ↑
Config → [All layers] → Dependencies
                              ↓
                            DAL
```

## Spec-Driven Development

1. **Specs are truth:** Every change needs a SPEC.md
2. **Change types:** Changes can be `feature`, `bugfix`, or `refactor`
3. **Issue required:** Every spec references a tracking issue
4. **Git = state machine:** PR = draft, merged = active

## Key Paths

| Path | Purpose |
|------|---------|
| `specs/INDEX.md` | Registry of all specs |
| `specs/changes/` | Change specifications (features, bugfixes, refactors) |
| `components/contract/openapi.yaml` | API contract |
| `sdd-settings.yaml` | Project settings (components, domains) |

## Claude Code Commands

- `/sdd-init --name [name]` - Initialize new project
- `/sdd-new-change --type [type] --name [name]` - Start new change
- `/sdd-implement-change` - Implement plan
- `/sdd-verify-change` - Verify implementation
- `/sdd-generate-snapshot` - Regenerate snapshot
