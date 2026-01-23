---
name: backend-standards
description: CMDO architecture standards for Node.js/TypeScript backends with strict layer separation.
---


# Backend Standards Skill

CMDO ("Commando") architecture for Node.js/TypeScript backends with strict separation between infrastructure and domain concerns.

---

## Architecture: CMDO (Controller Model DAL Operator)

```
Operator → Controller → Model Use Cases
   ↓            ↓              ↑
Config → [All layers] → Dependencies (injected by Controller)
                               ↓
                             DAL
```

### Key Distinction: Infrastructure vs Domain

| Layer | Knows About | Example |
|-------|-------------|---------|
| **Operator** | Infrastructure only | "Here's a DB connection and generic HTTP client" |
| **Config** | URLs and settings | `paymentGatewayUrl: "https://api.stripe.com"` |
| **Controller** | Domain concerns | "Use httpClient + paymentGatewayUrl to charge a card" |
| **Model** | Business logic only | "Calculate total, then call chargePayment()" |

**Key Principle:** Operator provides raw I/O capabilities (generic HTTP client, cache client, DB connection) with NO domain knowledge. Controller combines I/O + config to create domain-specific operations.

---

## Layer Overview

| Layer | Path | Responsibility |
|-------|------|----------------|
| **Entry Point** | `src/index.ts` | Bootstrap only (ONLY file with side effects) |
| **Operator** | `src/operator/` | Raw I/O capabilities (DB, HTTP clients, cache), lifecycle management, state machine |
| **Config** | `src/config/` | Environment parsing, validation, type-safe config |
| **Controller** | `src/controller/` | Request/response handling, combines I/O + config for domain calls, creates Dependencies for Model |
| **Model** | `src/model/` | Business logic (definitions + use-cases), receives Dependencies |
| **DAL** | `src/dal/` | Data access, queries, mapping DB ↔ domain objects |

---

## Entry Point: src/index.ts

**Rules:**
- `src/index.ts` is the ONLY file that runs code on import (exception to the "index.ts exports only" rule for application entry points)
- All other files export functions/types with NO side effects when imported
- NO logic beyond importing and starting the operator
- NO configuration loading, validation, or setup logic

```typescript
// src/index.ts - Entry point (exception to index.ts rule for entry points)
import { createOperator } from "./operator";
import { loadConfig } from "./config";

const main = async (): Promise<void> => {
    const config = loadConfig();
    const operator = createOperator({ config });
    await operator.start();
};

main().catch((error) => {
    console.error("Failed to start operator:", error);
    process.exit(1);
});
```

---

## Layer 1: Operator

Provides raw I/O capabilities and orchestrates application lifecycle. **NO domain knowledge** - only infrastructure.

**What Operator Does:**
- Creates database connection pool (raw I/O capability)
- Creates generic HTTP client (for external calls - if needed)
- Creates cache client (if needed)
- Binds DAL functions with database client
- Creates Controller, passing raw I/O + DAL + config
- Manages lifecycle via state machine (IDLE → STARTING → RUNNING → STOPPING → STOPPED)
- Manages HTTP server for API endpoints
- Manages lifecycle probes on separate port (health/readiness for Kubernetes)
- Handles Unix signals for graceful shutdown (SIGTERM, SIGINT, SIGHUP)
- Initializes telemetry (logger, metrics) before other modules

**What Operator Does NOT Do:**
- NO domain-specific calls (e.g., "call payment gateway", "fetch user from auth service")
- NO business logic
- NO knowledge of what the raw I/O will be used for

**Lifecycle State Machine:**
```
IDLE → STARTING:PROBES → STARTING:DATABASE → STARTING:HTTP_SERVER → RUNNING
                                                                        ↓
STOPPED ← STOPPING:PROBES ← STOPPING:DATABASE ← STOPPING:HTTP_SERVER ←─┘
```

**Unix Signal Handling:**

| Signal | Source | Action |
|--------|--------|--------|
| `SIGTERM` | Kubernetes pod termination, `kill` command | Graceful shutdown |
| `SIGINT` | Ctrl+C from terminal | Graceful shutdown |
| `SIGHUP` | Terminal hangup | Graceful shutdown |

When a signal is received:
1. Log the signal with info level
2. Initiate graceful shutdown via `stop()`
3. Wait for all connections to drain
4. Exit with code 0 (success) or 1 (error)

**Structure:**
```
src/operator/
├── create_operator.ts      # Main factory, state machine, lifecycle
├── create_database.ts      # Database connection pool
├── create_http_server.ts   # HTTP server wrapper
├── lifecycle_probes.ts     # Health/readiness endpoints (separate port)
├── state_machine.ts        # Generic state machine implementation
├── logger.ts               # Pino logger with OpenTelemetry
├── metrics.ts              # OpenTelemetry metrics
└── index.ts                # Exports only
```

---

## Layer 2: Config

Environment parsing, validation, type-safe config objects.

**CRITICAL: Use dotenv for ALL environment variable access.** Direct `process.env` access is FORBIDDEN outside the Config layer.

**Environment Variable Rules:**
1. **dotenv is mandatory**: Always use `dotenv.config()` inside `loadConfig()` (not at module level)
2. **Config layer ONLY**: `process.env` access is ONLY allowed in src/config/
3. **Type-safe access**: All other layers receive typed Config object
4. **Validation required**: Validate required vars and throw if missing
5. **Default values**: Provide sensible defaults for optional vars
6. **NO direct access elsewhere**: NEVER use `process.env` in Operator, Controller, Model, or DAL layers

**What it does NOT contain:** Business logic, database queries.

**Structure:**
```
src/config/
├── index.ts                # loadConfig() function, Config type
└── validation.ts           # Optional: validation helpers
```

---

## Layer 3: Controller

Request/response handling, combines I/O + config for domain-specific operations, creates Dependencies object for Model.

**Controller's Key Role:**
- Receives raw I/O capabilities from Operator (generic httpClient, cache, etc.)
- Receives Config with URLs and settings
- **Combines I/O + config** to create domain-specific operations (e.g., `httpClient + config.paymentUrl` → `chargePayment`)
- Creates Model Dependencies by stitching together DAL + domain operations

**HTTP Handlers:** Each file in `http_handlers/` corresponds to an API namespace (e.g., `/users`, `/orders`) and exports a router. The `create_controller.ts` imports these routers and wires them together with the Dependencies object for Model use-cases.

**Handler Naming:** Use `operationId` from OpenAPI spec with `handle` prefix (e.g., `createUser` → `handleCreateUser`).

**Health Check Endpoints:** Lifecycle probes (`/health`, `/readiness`) are handled by Operator on a separate port, NOT in the Controller.

**What it does NOT contain:** Database queries, business logic (delegates to Model).

**Structure:**
```
src/controller/
├── http_handlers/          # One file per API namespace
│   ├── users.ts            # Exports usersRouter
│   ├── orders.ts           # Exports ordersRouter
│   └── index.ts            # Re-exports all routers
├── create_controller.ts    # Assembles routers, creates Dependencies for Model
└── index.ts                # Exports only
```

---

## Layer 4: Model

Business logic via definitions + use-cases. Model **never imports from outside its module**.

**Definitions Rules:**
- Use **TypeScript types only** (`type` or `interface`)
- **NO Zod, Yup, io-ts, or similar validation libraries**
- Validation belongs in the Controller layer (input) or Operator layer (middleware)
- Definitions are compile-time constructs, not runtime validators

**Use Case Rules:**
- One use-case per file
- Each use-case receives Dependencies as first argument
- Return discriminated unions for success/failure

```typescript
// ✅ GOOD: Discriminated union results
type CreateUserResult =
    | { readonly success: true; readonly user: User }
    | { readonly success: false; readonly error: 'email_exists' | 'invalid_email' };

const createUser = async (
    deps: Dependencies,
    args: CreateUserArgs
): Promise<CreateUserResult> => {
    // Business logic using only injected dependencies
};
```

**What it does NOT contain:** HTTP handling, direct database queries, external imports.

**Structure:**
```
src/model/
├── definitions/            # TypeScript types ONLY (no Zod/validation)
│   ├── user.ts
│   └── index.ts
├── use-cases/              # One function per file
│   ├── create_user.ts
│   ├── update_user.ts
│   └── index.ts
├── dependencies.ts         # Dependencies interface
└── index.ts                # Exports only
```

---

## Layer 5: DAL

Data access functions that directly handle database queries. **No repository pattern** - use simple, focused functions instead.

**DAL Rules:**
- One function per file, named after the function (e.g., `find_user_by_id.ts`)
- Each function receives its dependencies as the first argument
- No classes, no repository interfaces, no abstraction layers
- Direct database queries with proper parameterization
- `index.ts` re-exports all functions
- No assumed grouping - add subdirectories only if explicitly instructed

**What it does NOT contain:** Business logic, HTTP handling, repository abstractions.

**Structure:**
```
src/dal/
├── find_user_by_id.ts
├── insert_user.ts
├── update_user.ts
└── index.ts                # Re-exports all functions
```

---

## Telemetry (OpenTelemetry)

All observability follows OpenTelemetry standards. Telemetry is initialized by the Operator layer.

### Logging

Use Pino with OpenTelemetry context injection.

**Log Levels:**

| Level | When to use |
|-------|-------------|
| `debug` | Detailed debugging (disabled in production) |
| `info` | Normal operations, state changes, requests |
| `warn` | Recoverable issues, deprecations |
| `error` | Failures requiring attention |

**When to Use Info Logging:**

Log **before** and **after** every domain action or permanent state change:
- Database write operations (create, update, delete)
- User actions (login, logout, password change)
- Outgoing calls (HTTP requests to external services)
- State transitions (order placed, payment processed)
- Business events (subscription activated, invoice generated)

**Required Log Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `level` | Yes | Log level (debug, info, warn, error) |
| `time` | Yes | ISO 8601 timestamp |
| `component` | Yes | Source component (operator, controller, dal) |
| `msg` | Yes | Human-readable message |
| `traceId` | Auto | OpenTelemetry trace ID |
| `spanId` | Auto | OpenTelemetry span ID |
| `userId` | Context | User ID if authenticated |
| `requestId` | Context | Request correlation ID |
| `error` | On error | Error object with stack |

**Logging by Layer:** Loggers are created by the Operator layer and passed down. Each layer creates a child logger with its component name.

**Security Rule:** Never log sensitive data (passwords, tokens, credit cards, PII beyond IDs).

### Metrics

**Required Metrics:**

| Metric | Type | Labels | Layer |
|--------|------|--------|-------|
| `http.server.request.duration` | Histogram | method, route, status | Operator |
| `http.server.request.count` | Counter | method, route, status | Operator |
| `db.client.operation.duration` | Histogram | operation, table | DAL |
| `db.client.connection.pool.usage` | UpDownCounter | state (active/idle) | DAL |
| `business.operation.count` | Counter | operation, result | Model |

**Metric Naming:** Follow OpenTelemetry semantic conventions:
- Use `.` as separator (e.g., `http.server.request.duration`)
- Prefix with namespace (`http`, `db`, `business`)
- Include unit in name if not obvious (e.g., `duration`, `count`, `size`)

### Spans

Wrap business operations with spans using `@opentelemetry/api`.

**Span Attributes:** Use OpenTelemetry semantic conventions:

| Attribute | Type | Example |
|-----------|------|---------|
| `http.method` | string | `GET`, `POST` |
| `http.route` | string | `/api/users/:id` |
| `http.status_code` | int | `200`, `404` |
| `db.system` | string | `postgresql` |
| `db.operation` | string | `SELECT`, `INSERT` |
| `db.statement` | string | SQL query (sanitized) |
| `user.id` | string | User identifier |

### Telemetry Rules

1. **Initialize in Operator**: Telemetry is created in Operator before other modules
2. **Structured logs only**: All logs must be JSON with required fields
3. **Include trace context**: Use `withTraceContext()` for all logs
4. **No sensitive data**: Never log passwords, tokens, or PII
5. **Appropriate levels**: Use correct log level for each message
6. **Custom spans for business ops**: Wrap use-cases with spans
7. **Standard metric names**: Follow OpenTelemetry semantic conventions
8. **Layer-specific metrics**: Each layer records its own metrics

---

## File Naming

**CRITICAL: Use lowercase_with_underscores for ALL filenames**

```
✅ create_user.ts, find_user_by_id.ts, user_repository.ts
❌ createUser.ts (camelCase), CreateUser.ts (PascalCase), create-user.ts (kebab-case)
```

---

## Summary Checklist

Before committing backend code, verify:

- [ ] Entry point (`src/index.ts`) only imports and starts operator
- [ ] Operator provides raw I/O only - no domain knowledge
- [ ] Operator handles Unix signals (SIGTERM, SIGINT, SIGHUP) for graceful shutdown
- [ ] Config is the only layer accessing `process.env`
- [ ] Controller combines I/O + config for domain operations
- [ ] Model receives Dependencies, never imports external modules
- [ ] DAL has one function per file, no repository pattern
- [ ] All filenames use `lowercase_with_underscores`
- [ ] Telemetry initialized in Operator before other modules
- [ ] All layers use structured logging with required fields
- [ ] No sensitive data in logs
