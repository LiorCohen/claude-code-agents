---
name: contract-standards
description: OpenAPI contract standards for API specification, versioning, and type generation.
---

# Contract Standards Skill

Standards for OpenAPI contract components that define API specifications and generate TypeScript types.

---

## Purpose

Contract components are the single source of truth for API types:

1. **Define API shape** in OpenAPI 3.0 YAML
2. **Generate TypeScript types** consumed by server and webapp
3. **Validate API consistency** via Spectral linting
4. **Enable type-safe development** across the stack

---

## Directory Structure

```text
components/contract[-{name}]/
├── package.json          # Build scripts (generate:types, validate)
├── tsconfig.json         # TypeScript config for generated types
├── openapi.yaml          # OpenAPI 3.0 specification
├── .spectral.yaml        # Spectral linting rules (optional)
├── .gitignore            # Ignores generated/ directory
└── generated/            # Git-ignored generated output
    └── api-types.ts      # Generated TypeScript types
```

---

## Config Schema

Contract components do not require application config from `components/config/`. They are build-time artifacts, not runtime services. The `contract-scaffolding` skill generates an `openapi.yaml`, `package.json` with type generation scripts, and a `generated/` directory for TypeScript types.

---

## OpenAPI Specification Standards

### Info Section

```yaml
openapi: '3.0.3'
info:
  title: Project API
  version: '1.0.0'
  description: API description
```

### Path Naming

| Pattern | Example | Use Case |
|---------|---------|----------|
| `/resources` | `/users` | Collection endpoint |
| `/resources/{id}` | `/users/{userId}` | Single resource |
| `/resources/{id}/subresources` | `/users/{userId}/orders` | Nested resources |

**Rules:**
- Use plural nouns for collections (`/users`, not `/user`)
- Use kebab-case for multi-word paths (`/user-profiles`)
- Use camelCase for path parameters (`{userId}`)
- Avoid verbs in paths (use HTTP methods instead)

### Operation IDs

Operation IDs become handler function names:

```yaml
paths:
  /users:
    get:
      operationId: listUsers      # -> handleListUsers
    post:
      operationId: createUser     # -> handleCreateUser
  /users/{userId}:
    get:
      operationId: getUser        # -> handleGetUser
    put:
      operationId: updateUser     # -> handleUpdateUser
    delete:
      operationId: deleteUser     # -> handleDeleteUser
```

**Rules:**
- Use camelCase
- Start with verb: `get`, `list`, `create`, `update`, `delete`
- Be specific: `getUserProfile`, not `getProfile`

### Request/Response Schemas

```yaml
components:
  schemas:
    User:
      type: object
      required:
        - id
        - email
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
        createdAt:
          type: string
          format: date-time

    CreateUserRequest:
      type: object
      required:
        - email
      properties:
        email:
          type: string
          format: email
        name:
          type: string

    Error:
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: string
        message:
          type: string
```

**Naming Conventions:**
- Resource schemas: `User`, `Order`, `Task`
- Request schemas: `CreateUserRequest`, `UpdateOrderRequest`
- Response wrappers (if needed): `UserListResponse`, `PaginatedResponse`
- Errors: `Error`, `ValidationError`

### Standard Error Responses

Define reusable error responses:

```yaml
components:
  responses:
    BadRequest:
      description: Invalid request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
```

### Health Endpoints

**Health check endpoints are NOT defined in the contract.** They are infrastructure endpoints implemented directly in the Operator layer:

- `/health` - Liveness probe
- `/readiness` - Readiness probe

These run on a separate port (e.g., 9090) from the main API.

---

## Type Generation

### Running Generation

```bash
cd components/contract  # path depends on component name
npm run generate:types
```

### Generated Type Usage

Server and webapp consume types via workspace dependency:

```typescript
// In server or webapp
import type { components, paths } from '@project/contract';

// Schema types
type User = components['schemas']['User'];
type CreateUserRequest = components['schemas']['CreateUserRequest'];

// Path types (for typed API clients)
type GetUserPath = paths['/users/{userId}']['get'];
```

### Type Import Rules

- **Always use `import type`** - Contract types are compile-time only
- **Never modify generated files** - Regenerate instead
- **Add to workspace dependencies** - Use `"workspace:*"` version

---

## Versioning

### API Versioning Strategy

| Strategy | When to Use |
|----------|-------------|
| URL path (`/v1/users`) | Breaking changes require new version |
| No versioning | Internal APIs, rapid iteration |

For most SDD projects, avoid versioning until you have external consumers.

### Schema Versioning

Track changes in `info.version`:

```yaml
info:
  version: '1.0.0'  # Bump on breaking changes
```

---

## Validation

### Spectral Linting

```bash
npm run validate
```

Uses `.spectral.yaml` for custom rules (optional).

### Required Validations

1. **All paths have operationId**
2. **All schemas have required fields defined**
3. **Response schemas match request context**
4. **No unused schemas**

---

## Implementation Order

When adding a new endpoint:

### Step 1: Design the Endpoint

1. Add path to `openapi.yaml`
2. Define request schema (if POST/PUT/PATCH)
3. Define response schema
4. Add operationId

### Step 2: Validate

```bash
npm run validate
```

### Step 3: Generate Types

```bash
npm run generate:types
```

### Step 4: Implement in Server

Server endpoint implementation must follow `backend-standards` — it defines the CMDO handler → orchestrator → repository layering that contract endpoints are built upon.

---

## Multi-Contract Projects

When a project has multiple contracts (e.g., public API vs internal API):

```text
components/contracts/
├── public-api/           # External-facing API
│   └── openapi.yaml
└── internal-api/         # Service-to-service API
    └── openapi.yaml
```

Each contract:
- Has its own package name (`@project/public-api`)
- Generates its own types
- Is consumed independently by servers/webapps

---

## Summary Checklist

Before committing contract changes:

- [ ] All paths have operationId
- [ ] Operation IDs follow camelCase verb convention
- [ ] Request/response schemas are defined
- [ ] Required fields are specified
- [ ] Standard error responses are used
- [ ] Types regenerated after spec changes
- [ ] Validation passes (`npm run validate`)
- [ ] No health endpoints in contract (they're infrastructure)

---

## Input / Output

This skill defines no input parameters or structured output.


---

## Related Skills

- `backend-standards` — Delegate to this for server-side endpoint implementation. Defines the CMDO handler → orchestrator → repository layering that contract endpoints are built upon.
- `frontend-standards` — Delegate to this for webapp consumption of generated types. Defines MVVM patterns and TanStack Query hooks that use the TypeScript types generated from OpenAPI specs.
