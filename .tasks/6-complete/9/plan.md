# Plan: Task #9 - sdd-init Should Produce Ready-to-Work Components

## Status: COMPLETED ✓

**Completed:** 2026-01-28
**Version:** 5.0.0

---

## Executive Summary

"Ready-to-work" means:
1. Developer understands what they're looking at
2. Developer knows what to do next
3. Clean slate follows the SDD methodology (no orphaned code)

**Decision**: Remove greetings example entirely. Generate a clean skeleton with no business logic. User's first feature IS the example.

---

## Problems Being Solved

### Problem 1: Greetings Example Violates SDD

The templates include a complete "greetings" example across all layers, but this code exists NOWHERE in specs. This violates the core SDD principle: "Specs are truth."

### Problem 2: In-Memory Database Hack

The backend has an in-memory database stub that pretends to be a database. This masks the real requirement (PostgreSQL) and creates confusion.

### Problem 3: Unclear Next Steps

After `sdd-init`, developers don't know what to do next. The completion report is misleading.

### Problem 4: specs/ Directory Structure is Confusing

Currently `specs/changes/` and `specs/external/` are inside specs. Changes and external specs should be at project root.

---

## Implementation Plan

### Phase 1: Update scaffolding.ts Directory Structure

**File**: `plugin/skills/scaffolding/scaffolding.ts`

#### 1.1 Update specsDirs (lines 226-234)

Change from:
```typescript
const specsDirs = [
  'specs',
  'specs/domain',
  'specs/domain/definitions',
  'specs/domain/use-cases',
  'specs/architecture',
  'specs/changes',
  'specs/external',
];
```

To:
```typescript
const specsDirs = [
  'specs',
  'specs/domain',
  'specs/domain/definitions',
  'specs/domain/use-cases',
  'specs/architecture',
];

// Separate directories at project root
const rootDirs = [
  'changes',   // Change specs (not inside specs/)
  'archive',   // External specs (audit only, never read again)
];
```

Add loop for `rootDirs` after the specsDirs loop.

#### 1.2 Add .gitkeep Files for Empty Directories

Empty directories won't be committed to git. Add `.gitkeep` placeholder files:

```typescript
// Create .gitkeep files for empty directories that need to exist
const emptyDirs = [
  'specs/domain/definitions',
  'specs/domain/use-cases',
  'specs/architecture',
  'changes',
  'archive',
];

for (const dir of emptyDirs) {
  const gitkeepPath = path.join(target, dir, '.gitkeep');
  await fsp.writeFile(gitkeepPath, '# This file ensures the directory is tracked by git\n');
  createdFiles.push(`${dir}/.gitkeep`);
  console.log(`  Created: ${dir}/.gitkeep`);
}
```

#### 1.3 Add .claudeignore Creation

After creating directories, add:
```typescript
// Create .claudeignore with archive/ ignored
const claudeignore = path.join(target, '.claudeignore');
await fsp.writeFile(claudeignore, 'archive/\n');
createdFiles.push('.claudeignore');
console.log('  Created: .claudeignore');
```

---

### Phase 2: Remove Greetings from Backend Templates

**Base path**: `plugin/skills/backend-scaffolding/templates/`

#### 2.1 Files to DELETE

| File | Contents |
|------|----------|
| `src/controller/http_handlers/greetings.ts` | HTTP POST/GET handlers |
| `src/model/definitions/greeting.ts` | Greeting type definition |
| `src/model/use-cases/create_greeting.ts` | Create greeting business logic |
| `src/model/use-cases/get_greeting.ts` | Get greeting business logic |
| `src/dal/find_greeting_by_id.ts` | Database query function |
| `src/dal/insert_greeting.ts` | Database insert function |

#### 2.2 Files to REPLACE (empty barrel exports)

**`src/controller/http_handlers/index.ts`** - Replace with:
```typescript
// HTTP handlers index
// Add router exports here as features are implemented
// Example: export { createUsersRouter } from './users';
```

**`src/model/definitions/index.ts`** - Replace with:
```typescript
// Model Definitions: Domain types
// Add type exports here as entities are defined
// Example: export type { User, CreateUserInput } from './user';
```

**`src/model/use-cases/index.ts`** - Replace with:
```typescript
// Use cases index
// Add use case exports here as features are implemented
// Example: export { createUser } from './create_user';
```

**`src/dal/index.ts`** - Replace with:
```typescript
// DAL index
// Add DAL function exports here as data access is implemented
// Example: export { findUserById } from './find_user_by_id';
```

**`src/model/index.ts`** - Replace with:
```typescript
// Model index
export type { Dependencies } from './dependencies';
// Add type and use case exports here as features are implemented
```

#### 2.3 Files to MODIFY

**`src/controller/create_controller.ts`** - Replace entirely with:
```typescript
// Controller: Assembles routers and creates Dependencies for Model
import type { Router } from 'express';
import { Router as createRouter } from 'express';

export type ControllerDependencies = {
  // Add DAL dependencies here as features are implemented
  // Example:
  // readonly dal: {
  //   readonly findUserById: Dependencies['findUserById'];
  // };
};

export type Controller = {
  readonly router: Router;
};

export const createController = (_deps: ControllerDependencies): Controller => {
  const router = createRouter();

  // Mount feature routers here
  // Example:
  // const usersRouter = createUsersRouter({ modelDeps });
  // router.use('/users', usersRouter);

  return { router };
};
```

**`src/model/dependencies.ts`** - Replace entirely with:
```typescript
// Model Dependencies: Interface defining what use-cases need from DAL
// The Controller wires these when creating use-cases

export type Dependencies = {
  // Add DAL function signatures here as features are implemented
  // Example:
  // readonly findUserById: (id: string) => Promise<User | null>;
  // readonly insertUser: (input: InsertUserInput) => Promise<User>;
};
```

#### 2.4 Add PostgreSQL Dependencies

**`package.json`** - Add `pg` to dependencies and `@types/pg` to devDependencies:

```json
"dependencies": {
  "pg": "^8.11.3",
  ...existing dependencies...
},
"devDependencies": {
  "@types/pg": "^8.10.9",
  ...existing devDependencies...
}
```

**`src/config/load_config.ts`** - Add `databaseUrl` to config:

```typescript
import dotenv from 'dotenv';

export type Config = Readonly<{
  readonly port: number;
  readonly probesPort: number;
  readonly nodeEnv: string;
  readonly logLevel: string;
  readonly databaseUrl: string;
}>;

export const loadConfig = (): Config => {
  dotenv.config();

  const port = parseInt(process.env.PORT ?? '3000', 10);
  const probesPort = parseInt(process.env.PROBES_PORT ?? '9090', 10);
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const logLevel = process.env.LOG_LEVEL ?? 'info';
  const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/{{PROJECT_NAME}}';

  return { port, probesPort, nodeEnv, logLevel, databaseUrl };
};
```

#### 2.5 Remove In-Memory Database Hack

**`src/operator/create_database.ts`** - Replace the in-memory implementation with PostgreSQL stub:

```typescript
// Database: Connection factory using PostgreSQL
import { Pool, type PoolConfig } from 'pg';
import type pino from 'pino';

import type { Config } from '../config';

export type Database = {
  readonly connect: () => Promise<void>;
  readonly query: <T>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }>;
  readonly close: () => Promise<void>;
};

type DatabaseDependencies = Readonly<{
  readonly config: Config;
  readonly logger: pino.Logger;
}>;

export const createDatabase = (deps: DatabaseDependencies): Database => {
  const logger = deps.logger.child({ component: 'database' });

  // PostgreSQL connection pool
  // Configure via DATABASE_URL environment variable
  const poolConfig: PoolConfig = {
    connectionString: deps.config.databaseUrl,
  };

  const pool = new Pool(poolConfig);

  return {
    connect: async () => {
      // Test connection
      const client = await pool.connect();
      client.release();
      logger.info('Database connected');
    },
    query: async <T>(sql: string, params?: unknown[]): Promise<{ rows: T[] }> => {
      const result = await pool.query(sql, params);
      return { rows: result.rows as T[] };
    },
    close: async () => {
      await pool.end();
      logger.info('Database connection closed');
    },
  };
};
```

---

### Phase 3: Remove Greetings from Frontend Templates

**Base path**: `plugin/skills/frontend-scaffolding/templates/`

#### 3.1 Files to DELETE

| File | Contents |
|------|----------|
| `src/pages/greeter.tsx` | Greeter page component |
| `src/hooks/use-greetings.ts` | React Query hooks for greetings |
| `src/api/greetings.ts` | API client for greetings |

#### 3.2 Files to REPLACE (empty barrel exports)

**`src/pages/index.ts`** - Replace with:
```typescript
// Pages index
export { HomePage } from './home';
// Add page exports here as features are implemented
// Example: export { UsersPage } from './users';
```

**`src/api/index.ts`** - Replace with:
```typescript
// API index
// Add API client exports here as features are implemented
// Example: export { usersApi } from './users';
```

**`src/hooks/index.ts`** - Replace with:
```typescript
// Hooks index
// Add hook exports here as features are implemented
// Example: export { useUser, useCreateUser } from './use-users';
```

#### 3.3 Files to MODIFY

**`src/app.tsx`** - Replace entirely with:
```typescript
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components';
import { HomePage } from './pages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const PageRouter = ({ currentPage }: { currentPage: string }): JSX.Element => {
  switch (currentPage) {
    case 'home':
    default:
      return <HomePage />;
  }
};

export const App = (): JSX.Element => {
  const [currentPage, setCurrentPage] = useState('home');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100 flex">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
        <main className="flex-1">
          <PageRouter currentPage={currentPage} />
        </main>
      </div>
    </QueryClientProvider>
  );
};
```

**`src/components/sidebar.tsx`** - Replace `navItems` array:
```typescript
const navItems: readonly NavItem[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  // Add navigation items here as pages are implemented
  // Example: { id: 'users', label: 'Users', icon: '👥' },
];
```

---

### Phase 4: Remove Greetings from Contract Templates

**Base path**: `plugin/skills/contract-scaffolding/templates/`

#### 4.1 Files to MODIFY

**`openapi.yaml`** - Replace entirely with base structure only:

```yaml
openapi: 3.0.3
info:
  title: {{PROJECT_NAME}} API
  version: 1.0.0
  description: API specification for {{PROJECT_NAME}}

servers:
  - url: /api/v1
    description: API v1

paths:
  # NOTE: Health check endpoints (/health, /readiness, /liveness) are NOT defined here.
  # They are infrastructure endpoints implemented directly in the controller.
  #
  # Add your API endpoints here as features are implemented.
  # Example:
  # /users:
  #   post:
  #     operationId: createUser
  #     ...

components:
  schemas:
    # Add your domain schemas here as entities are defined.
    # Example:
    # User:
    #   type: object
    #   required:
    #     - id
    #     - email
    #   properties:
    #     id:
    #       type: string
    #     email:
    #       type: string

    Error:
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: string
          description: Error code
        message:
          type: string
          description: Human-readable error message
        details:
          type: object
          description: Additional error details

  responses:
    BadRequest:
      description: Invalid request
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                $ref: '#/components/schemas/Error'

    Unauthorized:
      description: Unauthorized
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                $ref: '#/components/schemas/Error'

    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                $ref: '#/components/schemas/Error'

    InternalError:
      description: Internal server error
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                $ref: '#/components/schemas/Error'
```

---

### Phase 5: Update Project Templates

**Base path**: `plugin/skills/project-scaffolding/templates/`

#### 5.1 Empty Glossary

**`specs/glossary.md`** - Replace entirely with:

```markdown
# Domain Glossary

Canonical terminology for {{PROJECT_NAME}}.

## Terms

| Term | Definition |
|------|------------|

## Conventions

- Use singular nouns for definitions (User, not Users)
- Use past tense for events (UserCreated, not CreateUser)
- Be consistent with terminology across all specs
```

#### 5.2 Local Database via Kubernetes

Local PostgreSQL runs via Kubernetes (using the database component's k8s manifests). No docker-compose file needed.

The database component already includes:
- `scripts/setup.sh` - Creates k8s namespace and deploys PostgreSQL
- `scripts/teardown.sh` - Removes k8s resources
- `scripts/port-forward.sh` - Forwards PostgreSQL port to localhost

These are wired to npm scripts in the root package.json by scaffolding.ts:
- `npm run <db-component>:setup`
- `npm run <db-component>:teardown`
- `npm run <db-component>:port-forward`

#### 5.3 Simplify Project README

**`project/README.md`** - Update quick start section to:

```markdown
# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Getting Started

This project was scaffolded with SDD. To add your first feature:

```bash
/sdd-new-change --type feature --name <your-first-feature>
```

This will guide you through:
1. Creating a specification for your feature
2. Planning the implementation
3. Building it step by step

## Development

Once you have features implemented:

```bash
# Start local database (requires local Kubernetes cluster)
npm run database:setup
npm run database:port-forward

# Install dependencies and generate types
npm install
npm run generate

# Start development servers
npm run dev
```

## Project Structure

```
├── specs/                 # Static specifications
│   ├── domain/            # Domain definitions and use cases
│   ├── architecture/      # Architecture decisions
│   └── glossary.md        # Domain terminology
├── changes/               # Change specifications (features, fixes)
├── archive/               # Archived external specs (audit only)
├── components/            # Application components
│   ├── contract/          # OpenAPI specification
│   ├── server/            # Backend (CMDO architecture)
│   └── webapp/            # Frontend (React + Vite)
└── config/                # Configuration files
```
```

---

### Phase 6: Update sdd-init Command

**File**: `plugin/commands/sdd-init.md`

Update the completion report output based on whether external spec was provided:

**Without external spec:**
```
═══════════════════════════════════════════════════════════════
 PROJECT INITIALIZED: <project-name>
═══════════════════════════════════════════════════════════════

Location: <absolute-path>
Domain: <primary-domain>

WHAT'S INCLUDED:

  ✓ Full project structure (backend, frontend, contract)
  ✓ CMDO architecture ready for your features
  ✓ Empty specs directory (ready for your first feature)

NEXT STEP:

  /sdd-new-change --type feature --name <your-first-feature>

  This will guide you through:
  1. Creating a specification for your feature
  2. Planning the implementation
  3. Building it step by step
```

**With external spec:**
```
═══════════════════════════════════════════════════════════════
 PROJECT INITIALIZED: <project-name>
═══════════════════════════════════════════════════════════════

Location: <absolute-path>
Domain: <primary-domain>

CHANGES CREATED FROM EXTERNAL SPEC:

  [List of changes created from external spec]

NEXT STEPS:

  1. Review the generated change specs in changes/
  2. Run /sdd-implement-change to begin implementation
```

---

### Phase 7: Update SKILL.md Documentation

Update the SKILL.md files to reflect the clean skeleton without greeting examples.

**Files to update:**
- `plugin/skills/backend-scaffolding/SKILL.md` - Remove greeting references from examples
- `plugin/skills/frontend-scaffolding/SKILL.md` - Remove greeting references from examples
- `plugin/skills/contract-scaffolding/SKILL.md` - Remove greeting references from examples

---

### Phase 8: Update Path References Across Plugin

**18 files** reference the old `specs/changes/` or `specs/external/` paths. These must be updated to use the new paths:
- `specs/changes/` → `changes/`
- `specs/external/` → `archive/`

#### Files to Update

**Commands:**
| File | Changes |
|------|---------|
| `plugin/commands/sdd-init.md` | Update all path references |
| `plugin/commands/sdd-new-change.md` | Update path references |
| `plugin/commands/sdd-implement-change.md` | Update path references |
| `plugin/commands/sdd-verify-change.md` | Update path references |

**Agents:**
| File | Changes |
|------|---------|
| `plugin/agents/planner.md` | Update `specs/changes/` to `changes/` |
| `plugin/agents/spec-writer.md` | Update `specs/changes/` to `changes/` |
| `plugin/agents/tester.md` | Update `specs/changes/` to `changes/` |

**Skills:**
| File | Changes |
|------|---------|
| `plugin/skills/change-creation/SKILL.md` | Update path references |
| `plugin/skills/epic-planning/SKILL.md` | Update path references |
| `plugin/skills/external-spec-integration/SKILL.md` | Update `specs/external/` to `archive/` |
| `plugin/skills/integration-testing/SKILL.md` | Update path references |
| `plugin/skills/e2e-testing/SKILL.md` | Update path references |
| `plugin/skills/unit-testing/SKILL.md` | Update path references |
| `plugin/skills/planning/SKILL.md` | Update path references |
| `plugin/skills/spec-index/SKILL.md` | Update path references |
| `plugin/skills/spec-writing/SKILL.md` | Update path references |

**Templates:**
| File | Changes |
|------|---------|
| `plugin/skills/project-scaffolding/templates/project/CLAUDE.md` | Update path references |

---

### Phase 9: Add Component READMEs (Deferred)

This phase can be implemented later. The clean skeleton is functional without READMEs.

---

## File Changes Summary

### Files to DELETE (9 files)

| File | Reason |
|------|--------|
| `backend-scaffolding/templates/src/controller/http_handlers/greetings.ts` | Greeting handler |
| `backend-scaffolding/templates/src/model/definitions/greeting.ts` | Greeting type |
| `backend-scaffolding/templates/src/model/use-cases/create_greeting.ts` | Greeting logic |
| `backend-scaffolding/templates/src/model/use-cases/get_greeting.ts` | Greeting logic |
| `backend-scaffolding/templates/src/dal/find_greeting_by_id.ts` | Greeting DAL |
| `backend-scaffolding/templates/src/dal/insert_greeting.ts` | Greeting DAL |
| `frontend-scaffolding/templates/src/pages/greeter.tsx` | Greeter page |
| `frontend-scaffolding/templates/src/hooks/use-greetings.ts` | Greeting hooks |
| `frontend-scaffolding/templates/src/api/greetings.ts` | Greeting API |

### Files to CREATE (6 files, via scaffolding.ts)

| File | Purpose |
|------|---------|
| `.claudeignore` | Ignore archive/ directory |
| `specs/domain/definitions/.gitkeep` | Placeholder for empty directory |
| `specs/domain/use-cases/.gitkeep` | Placeholder for empty directory |
| `specs/architecture/.gitkeep` | Placeholder for empty directory |
| `changes/.gitkeep` | Placeholder for empty directory |
| `archive/.gitkeep` | Placeholder for empty directory |

### Files to MODIFY (39 files)

**Templates (23 files):**

| File | Changes |
|------|---------|
| `scaffolding/scaffolding.ts` | Update directory structure, add .claudeignore, .gitkeep |
| `backend-scaffolding/templates/package.json` | Add `pg` dependency |
| `backend-scaffolding/templates/src/config/load_config.ts` | Add `databaseUrl` config |
| `backend-scaffolding/templates/src/controller/create_controller.ts` | Empty controller |
| `backend-scaffolding/templates/src/controller/http_handlers/index.ts` | Empty barrel |
| `backend-scaffolding/templates/src/model/index.ts` | Empty barrel |
| `backend-scaffolding/templates/src/model/definitions/index.ts` | Empty barrel |
| `backend-scaffolding/templates/src/model/use-cases/index.ts` | Empty barrel |
| `backend-scaffolding/templates/src/model/dependencies.ts` | Empty interface |
| `backend-scaffolding/templates/src/dal/index.ts` | Empty barrel |
| `backend-scaffolding/templates/src/operator/create_database.ts` | PostgreSQL connection |
| `frontend-scaffolding/templates/src/app.tsx` | Remove greeter |
| `frontend-scaffolding/templates/src/pages/index.ts` | Empty barrel |
| `frontend-scaffolding/templates/src/api/index.ts` | Empty barrel |
| `frontend-scaffolding/templates/src/hooks/index.ts` | Empty barrel |
| `frontend-scaffolding/templates/src/components/sidebar.tsx` | Remove greeter nav |
| `contract-scaffolding/templates/openapi.yaml` | Base structure only |
| `project-scaffolding/templates/specs/glossary.md` | Empty table |
| `project-scaffolding/templates/project/README.md` | Simplified quick start |
| `project-scaffolding/templates/project/CLAUDE.md` | Update path references |
| `backend-scaffolding/SKILL.md` | Remove greeting references |
| `frontend-scaffolding/SKILL.md` | Remove greeting references |
| `contract-scaffolding/SKILL.md` | Remove greeting references |

**Commands (4 files):**

| File | Changes |
|------|---------|
| `commands/sdd-init.md` | Update completion report and path references |
| `commands/sdd-new-change.md` | Update path references |
| `commands/sdd-implement-change.md` | Update path references |
| `commands/sdd-verify-change.md` | Update path references |

**Agents (3 files):**

| File | Changes |
|------|---------|
| `agents/planner.md` | Update path references |
| `agents/spec-writer.md` | Update path references |
| `agents/tester.md` | Update path references |

**Skills (9 files):**

| File | Changes |
|------|---------|
| `skills/change-creation/SKILL.md` | Update path references |
| `skills/epic-planning/SKILL.md` | Update path references |
| `skills/external-spec-integration/SKILL.md` | Update path references |
| `skills/integration-testing/SKILL.md` | Update path references |
| `skills/e2e-testing/SKILL.md` | Update path references |
| `skills/unit-testing/SKILL.md` | Update path references |
| `skills/planning/SKILL.md` | Update path references |
| `skills/spec-index/SKILL.md` | Update path references |
| `skills/spec-writing/SKILL.md` | Update path references |

---

## Verification Checklist

Before marking complete, verify:

**Project Structure:**
- [ ] `scaffolding.ts` creates `changes/` and `archive/` at project root
- [ ] `scaffolding.ts` creates `.claudeignore` with `archive/`
- [ ] `specs/` contains only `domain/`, `architecture/`, glossary.md
- [ ] No `specs/changes/` or `specs/external/` directories created
- [ ] Empty directories have `.gitkeep` files: `specs/domain/definitions/`, `specs/domain/use-cases/`, `specs/architecture/`, `changes/`, `archive/`
- [ ] `specs/domain/glossary.md` has empty table (no pre-populated terms)

**Backend:**
- [ ] No greeting-related files exist
- [ ] All index files are empty barrels with helpful comments
- [ ] `create_controller.ts` has empty controller structure
- [ ] `dependencies.ts` has empty Dependencies type
- [ ] `create_database.ts` uses PostgreSQL (no in-memory hack)
- [ ] `package.json` includes `pg` dependency
- [ ] `load_config.ts` includes `databaseUrl` config
- [ ] Backend compiles with no errors

**Frontend:**
- [ ] No greeter page or greeting API/hooks
- [ ] `app.tsx` only routes to HomePage
- [ ] `sidebar.tsx` only shows Home nav item
- [ ] All index files are empty barrels with helpful comments
- [ ] Frontend compiles with no errors

**Contract:**
- [ ] OpenAPI has base structure only (no greetings endpoints)
- [ ] Error schema and response definitions remain
- [ ] Type generation works (produces empty types)

**Database:**
- [ ] Database component k8s scripts exist (setup, teardown, port-forward)
- [ ] Root package.json includes database npm scripts

**Completion Report:**
- [ ] Without external spec: shows `/sdd-new-change` as next step
- [ ] With external spec: shows changes list and `/sdd-implement-change`
- [ ] Neither variant mentions `npm run bootstrap`

**Path References (grep for old paths should return 0 results):**
- [ ] No references to `specs/changes/` in any plugin files
- [ ] No references to `specs/external/` in any plugin files
- [ ] All commands, agents, and skills use `changes/` and `archive/`

---

## Open Questions (All Resolved)

1. **Should we include a greetings example?** → No, remove it entirely.
2. **In-memory database or PostgreSQL?** → PostgreSQL via docker-compose.
3. **Should domain specs be pre-populated?** → No, always empty at scaffolding.
4. **Where should changes/ go?** → Project root, not inside specs/.
5. **What about archive/?** → Project root, added to .claudeignore.
