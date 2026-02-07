---
name: contract-scaffolding
description: Scaffolds OpenAPI contract component with type generation.
user-invocable: false
---

# Contract Scaffolding Skill

Creates an OpenAPI contract component that defines the API specification and generates TypeScript types for use by server and webapp components.

## When to Use

Use when creating a contract component. Contract components support multiple instances (e.g., `contracts/customer-api/`, `contracts/back-office-api/`).

## Prerequisites

- `sdd-system` CLI available in PATH (installed via the SDD plugin's npm package)

## What It Creates

The directory path is `components/contracts/{name}/` based on the component name in `.sdd/sdd-settings.yaml` (refer to the `project-settings` skill for directory mappings).

```text
components/contracts/{name}/
├── package.json          # Build scripts (call sdd-system CLI)
├── openapi.yaml          # OpenAPI 3.0 specification
├── .gitignore            # Ignores generated/ directory
└── generated/            # Generated types (git-ignored)
    └── api-types.ts      # Generated after npm run generate:types
```

## OpenAPI Template

The template `openapi.yaml` includes:

- Basic info section with project name and description
- Placeholder for paths (add endpoints as features are implemented)
- Reusable Error schema and standard error responses

Note: Health check endpoints (`/health`, `/readiness`, `/liveness`) are NOT defined in the OpenAPI spec. They are infrastructure endpoints implemented directly in the controller.

## Type Generation

The contract component generates TypeScript types from the OpenAPI spec:

```bash
cd components/contract  # path depends on component name
npm run generate:types
npm run validate        # Validate OpenAPI spec with Spectral
```

Or use the CLI directly:

```bash
sdd-system contract generate-types <component-name>
sdd-system contract validate <component-name>
```

This creates `generated/api-types.ts` inside the contract component. The contract is published as a workspace package — server and webapp components consume types by declaring a workspace dependency and importing:

```typescript
import type { components } from '@project-name/contract';

type Greeting = components['schemas']['Greeting'];
```

## Template Variables

| Variable | Description |
|----------|-------------|
| `{{PROJECT_NAME}}` | Project name (used in API info) |
| `{{PROJECT_DESCRIPTION}}` | API description |

## Usage

Generates the contract component directory with an OpenAPI spec and type generation scripts. Invoked by the `scaffolding` skill during project creation.

## Templates Location

All templates are colocated in this skill's `templates/` directory:

```text
skills/components/contract/contract-scaffolding/templates/
├── package.json
└── openapi.yaml
```

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts contract name and optional project metadata for OpenAPI spec generation.

## Root Package.json Update

After scaffolding, update the root `package.json`:

1. If root `package.json` doesn't exist, create it from the `project-scaffolding` skill template (`templates/project/package.json`)
2. Add component scripts:
   - `"<name>:generate": "npm run generate:types -w components/contracts/<name>"`
   - `"<name>:validate": "npm run validate -w components/contracts/<name>"`
3. Update meta-scripts (`generate`) to include this component

## Related Skills

- `project-settings` — Authoritative source for contract component settings schema and directory mappings.
- `typescript-standards` — Generated TypeScript types must follow these coding conventions. Defines strict typing, readonly patterns, and import standards.

## Integration with Other Components

```text
                    ┌─────────────────┐
                    │    contract/    │
                    │  openapi.yaml   │
                    └────────┬────────┘
                             │
                    npm run generate:types
                             │
                    ┌────────▼────────┐
                    │   generated/    │
                    │    types.ts     │
                    │ (workspace pkg) │
                    └────────┬────────┘
                             │
              import type from '@project/contract'
                             │
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────▼─────────┐       ┌───────────▼───────────┐
    │      server/      │       │        webapp/        │
    │  "workspace:*"    │       │    "workspace:*"      │
    └───────────────────┘       └───────────────────────┘
```
