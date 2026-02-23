# SDD Fullstack TypeScript Tech Pack

Production-ready fullstack TypeScript stack for SDD projects.

## Stack

- **Backend**: Node.js with CMDO architecture (Controller → Model → DAL → Orchestrator)
- **Frontend**: React with MVVM architecture (View → ViewModel → Model)
- **Database**: PostgreSQL with versioned migrations
- **API Contracts**: OpenAPI 3.x with generated TypeScript types
- **Deployment**: Kubernetes via Helm charts
- **CI/CD**: GitHub Actions
- **Testing**: Vitest (unit/integration), Playwright (e2e), Testkube (k8s-native)

## Component Types

| Type | Directory Pattern | Description |
|------|------------------|-------------|
| config | `components/config/` | Centralized YAML configuration (singleton) |
| contract | `components/contracts/{name}/` | OpenAPI specs with generated types |
| database | `components/databases/{name}/` | PostgreSQL with migrations and seed data |
| server | `components/servers/{name}/` | Node.js backend services |
| webapp | `components/webapps/{name}/` | React frontend applications |
| helm | `components/helm_charts/{name}/` | Kubernetes Helm charts |
| integration-testing | `components/testing/integration/{name}/` | Integration test suites |
| e2e-testing | `components/testing/e2e/{name}/` | End-to-end test suites |
| cicd | `components/cicds/{name}/` | CI/CD pipeline definitions |

## Agents

| Agent | Role |
|-------|------|
| api-designer | Designs OpenAPI contracts and type generation |
| backend-dev | Implements server components with CMDO architecture |
| frontend-dev | Implements webapp components with MVVM architecture |
| db-advisor | Designs database schemas, migrations, and queries |
| devops | Manages Helm charts, CI/CD, and infrastructure |
| tester | Writes integration and e2e tests |
| reviewer | Reviews code across all component types |

## Structure

```
fullstack-typescript/
├── techpack.yaml              # Tech pack manifest
├── agents/                    # 7 specialist agents
├── skills/
│   ├── capabilities/          # /sdd intent mappings
│   ├── command-router/        # Command dispatch
│   ├── component-discovery/   # Component type discovery
│   ├── help-content/          # /sdd-help content
│   ├── planning-standards/    # Architecture patterns
│   ├── scaffolding/           # Scaffolding orchestration
│   ├── skills-router/         # Skills dispatch
│   ├── techpack-settings/     # Settings schema per component type
│   └── components/            # Per-component skills
│       ├── backend/           # Backend standards + scaffolding
│       ├── contract/          # Contract standards + scaffolding
│       ├── config/            # Config standards + scaffolding + orchestration
│       ├── database/          # Database standards + scaffolding
│       ├── frontend/          # Frontend standards + scaffolding
│       ├── helm/              # Helm standards + scaffolding
│       ├── cicd/              # CI/CD standards + scaffolding
│       ├── integration-testing/ # Integration testing standards + scaffolding
│       └── e2e-testing/       # E2E testing standards + scaffolding
├── templates/
│   ├── project/               # Project init templates (.tmpl)
│   └── plans/                 # Plan templates by change type
└── system/                    # Tech pack CLI (fs-ts-system)
```

## Tech Pack Manifest

The `techpack.yaml` defines the contract between this tech pack and the SDD core:

- **Components**: Types, directory patterns, dependencies, scaffolding skills, and agent assignments
- **Commands**: Tech-specific commands routed through the command router
- **Skills**: Skills router for context-based skill loading
- **Lifecycle**: Verification and testing agent assignments
- **Documentation**: Capabilities and help content skills
