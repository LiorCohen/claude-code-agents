---
name: database-standards
description: PostgreSQL database standards for migrations, seeds, and schema management.
---

# Database Standards Skill

Standards for PostgreSQL database components with migrations, seeds, and schema management.

---

## Purpose

Database components manage schema evolution and seed data:

1. **Version-controlled schema** via numbered migrations
2. **Repeatable seed data** for development and testing
3. **Idempotent operations** for safe re-runs
4. **Transactional safety** for atomic changes

---

## Directory Structure

```text
components/database[-{name}]/
├── package.json              # Component package metadata
├── migrations/               # Schema migrations (numbered)
│   ├── 001_initial_schema.sql
│   ├── 002_add_users_table.sql
│   └── 003_add_indexes.sql
└── seeds/                    # Seed data (numbered)
    ├── 001_lookup_data.sql
    └── 002_test_users.sql
```

---

## Config Schema

Database components require connection configuration from `components/config/`. The `database-scaffolding` skill generates the initial database structure including a minimal config schema with `host`, `port`, `database`, `user`, and `password` fields.

---

## Migration Standards

### File Naming

```text
migrations/
├── 001_initial_schema.sql
├── 002_add_users_table.sql
├── 003_add_orders_table.sql
└── 004_add_indexes.sql
```

**Rules:**
- Three-digit prefix: `001_`, `002_`, etc.
- Descriptive name in snake_case
- `.sql` extension
- Never rename or reorder existing migrations

### Migration Structure

```sql
-- migrations/002_add_users_table.sql
BEGIN;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

COMMIT;
```

**Required Patterns:**

| Pattern | Why |
|---------|-----|
| `BEGIN`/`COMMIT` | Atomic transaction |
| `IF NOT EXISTS` | Idempotent (safe to re-run) |
| `TIMESTAMPTZ` | Timezone-aware timestamps |
| `gen_random_uuid()` | PostgreSQL native UUIDs |

### Migration Types

| Type | When | Example |
|------|------|---------|
| Schema creation | New tables | `CREATE TABLE IF NOT EXISTS` |
| Schema modification | Add/modify columns | `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` |
| Index creation | Performance | `CREATE INDEX IF NOT EXISTS` |
| Data migration | Transform existing data | `UPDATE ... WHERE ...` |
| Constraint addition | Add validation | `ALTER TABLE ... ADD CONSTRAINT` |

### Column Conventions

| Type | PostgreSQL Type | Notes |
|------|-----------------|-------|
| Primary key | `UUID` | Use `gen_random_uuid()` |
| Timestamps | `TIMESTAMPTZ` | Always timezone-aware |
| Money | `NUMERIC(19,4)` | Never `FLOAT` or `MONEY` |
| Enums | `VARCHAR` + CHECK | Or PostgreSQL `ENUM` type |
| JSON | `JSONB` | Never `JSON` |

### Rollback Strategy

**Migrations are forward-only.** If you need to undo:

1. Create a new migration that reverses the change
2. Never modify or delete existing migrations
3. Never use `DROP TABLE` without careful consideration

```sql
-- migrations/005_remove_legacy_column.sql
BEGIN;

ALTER TABLE users DROP COLUMN IF EXISTS legacy_field;

COMMIT;
```

---

## Seed Standards

### File Naming

```text
seeds/
├── 001_lookup_data.sql
├── 002_admin_users.sql
└── 003_sample_data.sql
```

**Rules:**
- Three-digit prefix matching execution order
- Descriptive name in snake_case
- Seeds run AFTER migrations

### Seed Structure

```sql
-- seeds/001_lookup_data.sql
BEGIN;

INSERT INTO status_types (code, label) VALUES
    ('pending', 'Pending'),
    ('active', 'Active'),
    ('completed', 'Completed')
ON CONFLICT (code) DO NOTHING;

COMMIT;
```

**Required Patterns:**

| Pattern | Why |
|---------|-----|
| `BEGIN`/`COMMIT` | Atomic transaction |
| `ON CONFLICT DO NOTHING` | Idempotent |
| `ON CONFLICT DO UPDATE` | Upsert when updates needed |

### Seed Categories

| Category | Purpose | Example |
|----------|---------|---------|
| Lookup data | Reference tables | Status codes, countries |
| Admin data | Initial admin users | System accounts |
| Test data | Development/testing | Sample users, orders |

### Environment-Specific Seeds

Seeds run in all environments. For test-only data:

```sql
-- seeds/003_test_data.sql
-- Only populate if specific flag table exists
BEGIN;

DO $$
BEGIN
    -- Check if we should seed test data
    -- This is controlled by a flag in the environment's config
    INSERT INTO users (email, name)
    SELECT 'test@example.com', 'Test User'
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'test@example.com');
END $$;

COMMIT;
```

---

## Implementation Order

When adding database changes:

### Step 1: Design Schema

1. Define tables and relationships
2. Choose appropriate data types
3. Plan indexes for query patterns

### Step 2: Create Migration

1. Create new numbered migration file
2. Wrap in `BEGIN`/`COMMIT`
3. Use `IF NOT EXISTS` for idempotency

### Step 3: Test Migration

```bash
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database migrate <component-name>
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database psql <component-name>  # Verify schema
```

### Step 4: Add Seeds (if needed)

1. Create seed file for initial data
2. Use `ON CONFLICT` for idempotency

### Step 5: Update Server DAL

The backend DAL layer must follow `backend-standards` — it defines CMDO architecture with strict layer separation, including repository patterns for database queries, connection pooling rules, and typed result mapping.

---

## Database Commands

```bash
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database setup <component-name>        # Deploy PostgreSQL to k8s
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database teardown <component-name>     # Remove PostgreSQL from k8s
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database migrate <component-name>      # Run all migrations
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database seed <component-name>         # Run all seeds
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database reset <component-name>        # Full reset: teardown + setup + migrate + seed
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database port-forward <component-name> # Port forward to local
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database psql <component-name>         # Open psql shell
```

---

## Multi-Database Projects

When a project has multiple databases:

```text
components/
├── database-orders/      # Orders domain
│   └── migrations/
└── database-analytics/   # Analytics domain
    └── migrations/
```

Each database:
- Has its own config section (`database-orders`, `database-analytics`)
- Runs migrations independently
- Has separate connection pools in server

---

## Summary Checklist

Before committing database changes:

- [ ] Migration file uses three-digit prefix
- [ ] Migration wrapped in `BEGIN`/`COMMIT`
- [ ] Uses `IF NOT EXISTS` or `IF EXISTS` for idempotency
- [ ] Uses `TIMESTAMPTZ` for all timestamps
- [ ] Uses `UUID` for primary keys
- [ ] Seeds use `ON CONFLICT` for idempotency
- [ ] No `DROP TABLE` without explicit approval
- [ ] Migration tested locally

---

## Input / Output

This skill defines no input parameters or structured output.


---

## Related Skills

- `backend-standards` — Delegate to this for DAL implementation patterns. Defines CMDO repository layer for database queries, connection pooling, and typed result mapping.
- `config-standards` — Delegate to this for database connection configuration. Defines how `host`, `port`, `database`, `user`, and `password` fields are structured in the config component.
- `helm-standards` — Delegate to this for Kubernetes deployment of database components. Defines how database secrets and connection strings are injected via Helm values.
