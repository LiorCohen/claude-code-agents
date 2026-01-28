# Plan: Add npm Run Scripts for Component Lifecycle Management

**Task:** TASKS.md #2 - Add npm run scripts for component lifecycle management

## Overview

Add root-level npm scripts that allow running/building/testing individual components. Currently the root `package.json` has generic `--workspaces --if-present` commands that aren't useful:
- They run everything in parallel without respecting dependencies
- No way to target a specific component
- Contract types don't get generated before dependent components build

**Approach:** First introduce component-specific scripts, then (optionally) add meta-scripts that orchestrate them with proper ordering.

## Naming Convention

**Pattern:** `npm run <component-name>:<action>`

Examples for a project with components `api` (contract), `backend` (server), `frontend` (webapp), `db` (database):
- `npm run api:generate` - Generate types from OpenAPI spec
- `npm run backend:dev` - Start backend in watch mode
- `npm run frontend:build` - Build webapp
- `npm run db:migrate` - Run database migrations

## Component-Specific Scripts Reference

The root `package.json` delegates to each component's own `package.json` using npm workspaces (`-w` flag). The actual commands are defined in the component templates.

### contract

API specification and type generation.

**Component package.json scripts:**
| Script | Command | Description |
|--------|---------|-------------|
| `generate:types` | `openapi-typescript openapi.yaml -o generated/types.ts` | Generate TypeScript types from OpenAPI spec |
| `validate` | `spectral lint openapi.yaml` | Validate OpenAPI spec against linting rules |

**Root package.json scripts (delegates to component):**
| Script | Delegates to |
|--------|--------------|
| `<name>:generate` | `npm run generate:types -w @<project>/<name>` |
| `<name>:validate` | `npm run validate -w @<project>/<name>` |

**Must run before:** server, webapp (they depend on generated types)

---

### server

Node.js/TypeScript backend service with CMDO architecture.

**Component package.json scripts:**
| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `tsx watch src/index.ts` | Start in watch mode with hot reload |
| `build` | `tsc` | Compile TypeScript to dist/ |
| `start` | `node dist/index.js` | Run compiled production build |
| `test` | `vitest` | Run unit tests |
| `lint` | `eslint src/` | Lint source code |
| `typecheck` | `tsc --noEmit` | Type check without emitting |

**Root package.json scripts (delegates to component):**
| Script | Delegates to |
|--------|--------------|
| `<name>:dev` | `npm run dev -w @<project>/<name>` |
| `<name>:build` | `npm run build -w @<project>/<name>` |
| `<name>:start` | `npm run start -w @<project>/<name>` |
| `<name>:test` | `npm run test -w @<project>/<name>` |

**Depends on:** contract (for API types)

---

### webapp

React/TypeScript frontend with MVVM architecture.

**Component package.json scripts:**
| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start Vite dev server with HMR |
| `build` | `tsc && vite build` | Type check and bundle for production |
| `preview` | `vite preview` | Preview production build locally |
| `test` | `vitest` | Run unit tests |
| `lint` | `eslint src/` | Lint source code |
| `typecheck` | `tsc --noEmit` | Type check without emitting |

**Root package.json scripts (delegates to component):**
| Script | Delegates to |
|--------|--------------|
| `<name>:dev` | `npm run dev -w @<project>/<name>` |
| `<name>:build` | `npm run build -w @<project>/<name>` |
| `<name>:preview` | `npm run preview -w @<project>/<name>` |
| `<name>:test` | `npm run test -w @<project>/<name>` |

**Depends on:** contract (for API types)

---

### database

PostgreSQL database with migrations and seed data. Runs on local Kubernetes cluster.

**Component package.json scripts:**
| Script | Command | Description |
|--------|---------|-------------|
| `setup` | `./scripts/setup.sh` | Deploy database to local k8s (creates PVC, deploys PostgreSQL) |
| `teardown` | `./scripts/teardown.sh` | Remove database from local k8s |
| `migrate` | `./scripts/migrate.sh` | Apply all pending migrations |
| `seed` | `./scripts/seed.sh` | Load seed data |
| `reset` | `./scripts/reset.sh` | Drop, recreate, migrate, and seed |
| `port-forward` | `./scripts/port-forward.sh` | Forward local port to database pod |
| `psql` | `./scripts/psql.sh` | Connect to database via psql |

**Root package.json scripts (delegates to component):**
| Script | Delegates to |
|--------|--------------|
| `<name>:setup` | `npm run setup -w @<project>/<name>` |
| `<name>:teardown` | `npm run teardown -w @<project>/<name>` |
| `<name>:migrate` | `npm run migrate -w @<project>/<name>` |
| `<name>:seed` | `npm run seed -w @<project>/<name>` |
| `<name>:reset` | `npm run reset -w @<project>/<name>` |
| `<name>:port-forward` | `npm run port-forward -w @<project>/<name>` |
| `<name>:psql` | `npm run psql -w @<project>/<name>` |

**Requires:** Local Kubernetes cluster (Docker Desktop, minikube, kind, etc.)

---

### helm

Kubernetes Helm deployment charts.

**Component package.json scripts:** (none - uses helm CLI directly)

**Root package.json scripts:**
| Script | Command |
|--------|---------|
| `<name>:lint` | `helm lint components/<dir>` |

**No runtime:** Charts are deployed to clusters, not run locally

---

### testing

Testkube test suite definitions.

**No npm scripts.** Tests are run via Testkube CLI in-cluster.

---

### cicd

GitHub Actions workflow definitions.

**No npm scripts.** Workflows are triggered by GitHub events.

---

## Meta-Scripts (Optional, Built from Component Scripts)

These orchestrate component scripts with proper dependency ordering:
- `npm run dev` - Generate contract types, then start server+webapp in parallel
- `npm run build` - Generate contract types, then build all in parallel
- `npm run test` - Generate contract types, then test all in parallel
- `npm run start` - Start server+webapp in production mode

These are composed from the component-specific scripts, not generic `--workspaces` calls.

## Implementation

### Files to Modify

1. **`plugin/skills/scaffolding/scaffolding.ts`** - Main change
   - After creating root `package.json`, enrich it with component-specific scripts
   - Generate scripts based on component names and types from config
   - Build orchestration scripts respecting `depends_on`

2. **`plugin/skills/project-scaffolding/templates/project/package.json`** - Add npm-run-all dependency
   - Add `npm-run-all` to devDependencies for orchestration

### Changes to `scaffolding.ts`

Add new function after line ~545 (after CI/CD section, before summary):

```typescript
// Generate component-specific npm scripts in root package.json
const generateRootScripts = async (
  config: Config,
  targetDir: string
): Promise<void> => {
  const pkgPath = path.join(targetDir, 'package.json');
  const pkgContent = await fsp.readFile(pkgPath, 'utf-8');
  const pkg = JSON.parse(pkgContent);

  const scripts: Record<string, string> = { ...pkg.scripts };
  const contracts: string[] = [];
  const servers: string[] = [];
  const webapps: string[] = [];

  for (const component of config.components) {
    const dirName = componentDirName(component);
    const workspace = `-w @${config.project_name}/${component.name}`;

    switch (component.type) {
      case 'contract':
        contracts.push(component.name);
        scripts[`${component.name}:generate`] = `npm run generate:types ${workspace}`;
        scripts[`${component.name}:validate`] = `npm run validate ${workspace}`;
        break;
      case 'server':
        servers.push(component.name);
        scripts[`${component.name}:dev`] = `npm run dev ${workspace}`;
        scripts[`${component.name}:build`] = `npm run build ${workspace}`;
        scripts[`${component.name}:start`] = `npm run start ${workspace}`;
        scripts[`${component.name}:test`] = `npm run test ${workspace}`;
        break;
      case 'webapp':
        webapps.push(component.name);
        scripts[`${component.name}:dev`] = `npm run dev ${workspace}`;
        scripts[`${component.name}:build`] = `npm run build ${workspace}`;
        scripts[`${component.name}:preview`] = `npm run preview ${workspace}`;
        scripts[`${component.name}:test`] = `npm run test ${workspace}`;
        break;
      case 'database':
        scripts[`${component.name}:migrate`] = `npm run migrate ${workspace}`;
        scripts[`${component.name}:seed`] = `npm run seed ${workspace}`;
        scripts[`${component.name}:reset`] = `npm run reset ${workspace}`;
        break;
      case 'helm':
        scripts[`${component.name}:lint`] = `helm lint components/${dirName}`;
        break;
    }
  }

  // Orchestration scripts with dependency ordering
  const generateAll = contracts.map(c => `${c}:generate`).join(' ');
  const devAll = [...servers, ...webapps].map(c => `${c}:dev`).join(' ');
  const buildAll = [...servers, ...webapps].map(c => `${c}:build`).join(' ');
  const testAll = [...servers, ...webapps].map(c => `${c}:test`).join(' ');
  const startAll = [...servers.map(c => `${c}:start`), ...webapps.map(c => `${c}:preview`)].join(' ');

  if (contracts.length > 0) {
    scripts['generate'] = `npm-run-all ${generateAll}`;
    scripts['dev'] = `npm-run-all generate --parallel ${devAll}`;
    scripts['build'] = `npm-run-all generate --parallel ${buildAll}`;
    scripts['test'] = `npm-run-all generate --parallel ${testAll}`;
    scripts['start'] = `npm-run-all --parallel ${startAll}`;
  } else if (servers.length > 0 || webapps.length > 0) {
    scripts['dev'] = `npm-run-all --parallel ${devAll}`;
    scripts['start'] = `npm-run-all --parallel ${startAll}`;
  }

  pkg.scripts = scripts;
  await fsp.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
};
```

Call this function after creating template files.

### Example Output

For a project with `api` (contract), `backend` (server), `frontend` (webapp), `db` (database):

```json
{
  "scripts": {
    "api:generate": "npm run generate:types -w @my-app/api",
    "api:validate": "npm run validate -w @my-app/api",
    "backend:dev": "npm run dev -w @my-app/backend",
    "backend:build": "npm run build -w @my-app/backend",
    "backend:start": "npm run start -w @my-app/backend",
    "backend:test": "npm run test -w @my-app/backend",
    "frontend:dev": "npm run dev -w @my-app/frontend",
    "frontend:build": "npm run build -w @my-app/frontend",
    "frontend:preview": "npm run preview -w @my-app/frontend",
    "frontend:test": "npm run test -w @my-app/frontend",
    "db:migrate": "npm run migrate -w @my-app/db",
    "db:seed": "npm run seed -w @my-app/db",
    "db:reset": "npm run reset -w @my-app/db",
    "generate": "npm-run-all api:generate",
    "dev": "npm-run-all generate --parallel backend:dev frontend:dev",
    "build": "npm-run-all generate --parallel backend:build frontend:build",
    "test": "npm-run-all generate --parallel backend:test frontend:test",
    "start": "npm-run-all --parallel backend:start frontend:preview"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "npm-run-all": "^4.1.5"
  }
}
```

**Note:** The old generic scripts (`lint`, `typecheck`, `test`, `build` with `--workspaces --if-present`) are removed in favor of the component-specific scripts. The meta-scripts (`dev`, `build`, `test`, `start`) now explicitly call component scripts in the correct order.

## Verification

1. **Unit test**: Add test in `tests/` that runs scaffolding with sample config and verifies root package.json contains expected scripts
2. **Manual test**:
   - Run `sdd-init` on a test project
   - Verify root package.json has component scripts
   - Run `npm run <component>:dev` and verify it works
   - Run `npm run dev` and verify orchestration works

## Notes

- "Stop" functionality deferred (use Ctrl+C for now; can add pm2 later if needed)
- helm/testing/cicd components have minimal or no lifecycle scripts (they're not runtime components)
- Scripts use component `name` not `type` for clarity with multiple instances
