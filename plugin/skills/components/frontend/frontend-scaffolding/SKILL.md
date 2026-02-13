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
├── .gitignore
├── components.json
├── eslint.config.js
├── eslint-rules/
│   └── allowed-structure.js
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── index.html
    ├── index.ts
    ├── index.css
    ├── main.tsx              # Entry point
    ├── app.tsx               # Root app component
    ├── vite-env.d.ts
    ├── components/
    │   ├── index.ts
    │   ├── layout/
    │   │   ├── index.ts
    │   │   └── layout.tsx
    │   ├── sidebar/
    │   │   ├── index.ts
    │   │   └── sidebar.tsx
    │   └── ui/
    │       ├── index.ts
    │       ├── button.tsx
    │       └── card.tsx
    ├── hooks/
    │   ├── index.ts
    │   ├── use_app_config.tsx
    │   ├── use_app_router.ts
    │   └── use_query_client.ts
    ├── lib/
    │   ├── index.ts
    │   └── utils.ts
    ├── pages/
    │   ├── index.ts
    │   └── home_page/
    │       ├── index.ts
    │       └── home_page.tsx
    ├── routes/
    │   ├── index.ts
    │   └── routes.tsx
    ├── services/
    │   └── index.ts
    └── types/
        └── index.ts
```

## MVVM Architecture

| Layer | Purpose | Location |
|-------|---------|----------|
| **V**iew | React components (pages, layout, UI primitives) | `src/pages/`, `src/components/` |
| **V**iew**M**odel | State and logic hooks | `src/hooks/` |
| **M**odel | API client services | `src/services/` |
| Utilities | `cn()`, shared helpers | `src/lib/` |
| Routes | TanStack Router route definitions | `src/routes/` |
| Types | Shared type definitions | `src/types/` |

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| TypeScript 5.9 | Type safety |
| Vite 7 | Build tool and dev server |
| Vitest 4 | Unit testing framework |
| ESLint 9 | Linting (flat config) |
| Tailwind CSS 4 | Utility-first CSS (CSS-based config) |
| TanStack Router | Type-safe routing |
| TanStack Query | Server state management |
| TanStack Table | Headless table primitives |
| TanStack Form | Type-safe form management |
| Radix UI / Shadcn | Accessible component primitives |
| class-variance-authority, clsx, tailwind-merge | Style composition utilities |

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
| `{{CONTRACT_PACKAGE}}` | Workspace package name for API contract types (e.g., `@my-project/api-types`) |
| `{{CONFIG_PACKAGE}}` | Workspace package name for webapp configuration types (e.g., `@my-project/config`) |

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
├── .gitignore
├── components.json
├── eslint.config.js
├── eslint-rules/
│   └── allowed-structure.js
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── index.html
    ├── index.ts
    ├── index.css
    ├── main.tsx
    ├── app.tsx
    ├── vite-env.d.ts
    ├── components/
    │   ├── index.ts
    │   ├── layout/
    │   ├── sidebar/
    │   └── ui/
    ├── hooks/
    ├── lib/
    ├── pages/
    ├── routes/
    ├── services/
    └── types/
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

## Scaffold Spec

To scaffold a frontend component, build a spec and invoke the engine:

```bash
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding apply --spec spec.json
```

### Variables

| Variable | Source |
|----------|--------|
| `PROJECT_NAME` | From `sdd-settings.yaml` project name |
| `CONTRACT_PACKAGE` | Workspace package name for API contract types |
| `CONFIG_PACKAGE` | Workspace package name for webapp configuration types |

### Operations

```json
{
  "target_dir": "<project-root>",
  "base_dir": "<plugin-root>/skills",
  "variables": { "PROJECT_NAME": "<project-name>", "CONTRACT_PACKAGE": "<contract-package>", "CONFIG_PACKAGE": "<config-package>" },
  "operations": [
    {
      "type": "template_dir",
      "source": "components/frontend/frontend-scaffolding/templates",
      "dest": "components/webapps/<webapp-name>"
    },
    {
      "type": "package_json_scripts",
      "scripts": {
        "<webapp-name>:dev": "npm run dev -w @<project-name>/<webapp-name>",
        "<webapp-name>:build": "npm run build -w @<project-name>/<webapp-name>",
        "<webapp-name>:preview": "npm run preview -w @<project-name>/<webapp-name>",
        "<webapp-name>:test": "npm run test -w @<project-name>/<webapp-name>"
      }
    }
  ]
}
```

No conditions needed.

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts webapp name, project metadata, and optional contract list for API client generation.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns the scaffolding engine result: created files, directories, and scripts; skipped paths; errors; and a human-readable summary.

## Related Skills

- `frontend-standards` — Generated frontend code must follow these standards. Defines MVVM architecture with TanStack Router/Query, component structure, and state management patterns.
- `typescript-standards` — Generated TypeScript files must follow these coding conventions. Defines strict typing, readonly patterns, branded types, and import standards.
- `unit-testing` — Generated test files must follow these patterns. Defines Vitest setup, mocking strategies, fixture patterns, and assertion conventions for frontend components.
