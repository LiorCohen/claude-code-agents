---
name: frontend-scaffolding
description: Scaffolds React/TypeScript frontend components with MVVM architecture.
user-invocable: false
---

# Frontend Scaffolding Skill

Creates a React/TypeScript frontend component following the MVVM (Model-View-ViewModel) architecture with TanStack ecosystem.

## When to Use

Use when creating webapp components. Supports multiple named instances (e.g., `webapp-admin`, `webapp-public`).

## What It Creates

```text
components/<webapp-name>/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── .gitignore
└── src/
    ├── main.tsx              # Entry point
    ├── app.tsx               # Root app component
    ├── index.css             # Global styles (Tailwind)
    ├── pages/
    │   ├── index.ts          # Empty barrel (add pages as features are implemented)
    │   └── home.tsx          # Home page
    ├── components/
    │   ├── index.ts
    │   └── sidebar.tsx       # Navigation sidebar
    ├── viewmodels/           # ViewModel hooks (empty, for user)
    ├── models/               # Domain models (empty, for user)
    ├── services/             # API services (empty, for user)
    ├── stores/               # State stores (empty, for user)
    ├── types/                # Type definitions (empty, for user)
    ├── utils/                # Utilities (empty, for user)
    ├── hooks/
    │   └── index.ts          # Empty barrel (add hooks as features are implemented)
    └── api/
        └── index.ts          # Empty barrel (add API clients as features are implemented)
```

## MVVM Architecture

| Layer | Purpose | Location |
|-------|---------|----------|
| **M**odel | Domain types and business logic | `src/models/` |
| **V**iew | React components (pages, components) | `src/pages/`, `src/components/` |
| **V**iew**M**odel | State and logic hooks | `src/viewmodels/` |

Plus supporting directories for services, stores, and API clients.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool and dev server |
| TailwindCSS v4 | Utility-first CSS (CSS-based config) |
| TanStack Router | Type-safe routing |
| TanStack Query | Server state management |

## Multiple Instances

Supports multiple named frontend instances:

| Input | Directory Created |
|-------|-------------------|
| `{type: webapp, name: main}` | `components/webapps/main/` |
| `{type: webapp, name: admin}` | `components/webapps/admin/` |
| `{type: webapp, name: public}` | `components/webapps/public/` |

## Template Variables

| Variable | Description |
|----------|-------------|
| `{{PROJECT_NAME}}` | Project name |
| `{{PROJECT_DESCRIPTION}}` | Project description |
| `{{PRIMARY_DOMAIN}}` | Primary business domain |

## Usage

Called programmatically by the scaffolding script:

```typescript
import { scaffoldFrontend } from './frontend-scaffolding';

scaffoldFrontend({
  targetDir: '/path/to/project',
  componentName: 'admin',         // Creates webapp-admin/
  projectName: 'my-app',
});
```

## Templates Location

All templates are colocated in this skill's `templates/` directory:

```text
skills/components/frontend/frontend-scaffolding/templates/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── .gitignore
└── src/
    ├── main.tsx
    ├── app.tsx
    ├── index.css
    ├── pages/
    ├── components/
    ├── hooks/
    └── api/
```

## Config Schema

When scaffolding a webapp component, the following config section is added to `components/config/`:

### Minimal Config (envs/default/config.yaml)

```yaml
webapp-{name}:
  apiBaseUrl: /api
```

### TypeScript Type (types/webapp.ts)

```typescript
export type WebappConfig = Readonly<{
  apiBaseUrl: string;
}>;
```

### JSON Schema (schemas/config.schema.json)

```json
{
  "webapp-{name}": {
    "type": "object",
    "properties": {
      "apiBaseUrl": { "type": "string", "default": "/api" }
    },
    "required": ["apiBaseUrl"]
  }
}
```

### Optional Extensions

Features may extend the config as needed:

```yaml
webapp-{name}:
  apiBaseUrl: /api
  features:
    darkMode: true
    analytics: false
```

---

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts webapp name, project metadata, and optional contract list for API client generation.

## Root Package.json Update

After scaffolding, update the root `package.json`:

1. If root `package.json` doesn't exist, create it from the `project-scaffolding` skill template (`templates/project/package.json`)
2. Add component scripts:
   - `"<name>:dev": "npm run dev -w components/webapps/<name>"`
   - `"<name>:build": "npm run build -w components/webapps/<name>"`
   - `"<name>:preview": "npm run preview -w components/webapps/<name>"`
   - `"<name>:test": "npm run test -w components/webapps/<name>"`
3. Update meta-scripts (`dev`, `build`, `test`) to include this component

## Related Skills

- `frontend-standards` — Generated frontend code must follow these standards. Defines MVVM architecture with TanStack Router/Query, component structure, and state management patterns.
- `typescript-standards` — Generated TypeScript files must follow these coding conventions. Defines strict typing, readonly patterns, branded types, and import standards.
- `unit-testing` — Generated test files must follow these patterns. Defines Vitest setup, mocking strategies, fixture patterns, and assertion conventions for frontend components.
