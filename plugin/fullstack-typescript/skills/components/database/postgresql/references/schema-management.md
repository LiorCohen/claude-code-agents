# PostgreSQL Schema Management

Creating, modifying, and managing database schemas, tables, indexes, and constraints.

---

## Creating Databases

### Basic Database

```sql
CREATE DATABASE myapp;
```

### With Options

```sql
CREATE DATABASE myapp
    OWNER = app_user
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0
    CONNECTION LIMIT = 100;
```

### Create Schema

```sql
-- Create schema
CREATE SCHEMA IF NOT EXISTS app;

-- Set search path for session
SET search_path TO app, public;

-- Set default search path for database
ALTER DATABASE myapp SET search_path TO app, public;
```

---

## Creating Tables

### Basic Table with IDENTITY

Prefer `GENERATED ALWAYS AS IDENTITY` over `SERIAL` (PostgreSQL 10+):

```sql
CREATE TABLE app.users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### With All Constraint Types

```sql
CREATE TABLE app.orders (
    -- Primary key
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- Foreign key
    user_id BIGINT NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,

    -- Unique constraint
    order_number VARCHAR(50) NOT NULL UNIQUE,

    -- Check constraint
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),

    -- Not null
    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    -- Multiple column check
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Common Data Types

| Type | Description | Example |
|------|-------------|---------|
| `BIGINT` | 8-byte integer (-9.2e18 to 9.2e18) | IDs, counts |
| `INTEGER` | 4-byte integer (-2.1e9 to 2.1e9) | Smaller integers |
| `SMALLINT` | 2-byte integer (-32768 to 32767) | Small values |
| `NUMERIC(p, s)` | Exact decimal | Money, precise values |
| `REAL` | 4-byte floating point | Approximate values |
| `DOUBLE PRECISION` | 8-byte floating point | Scientific data |
| `VARCHAR(n)` | Variable-length string | Names, emails |
| `TEXT` | Unlimited text | Descriptions, content |
| `BOOLEAN` | true/false | Flags |
| `DATE` | Calendar date | Birth dates |
| `TIME` | Time of day | Schedules |
| `TIMESTAMP` | Date and time (no timezone) | Avoid this |
| `TIMESTAMPTZ` | Date and time with timezone | Prefer this |
| `UUID` | Universally unique identifier | Distributed IDs |
| `JSONB` | Binary JSON | Flexible schema |
| `BYTEA` | Binary data | Files, images |
| `ARRAY` | Array of any type | Tags, lists |

### IDENTITY vs SERIAL

```sql
-- IDENTITY (preferred, PostgreSQL 10+)
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY

-- SERIAL (legacy)
id BIGSERIAL PRIMARY KEY
```

IDENTITY advantages:
- SQL standard compliant
- Cannot be overridden without `OVERRIDING SYSTEM VALUE`
- Explicit about intent

### Partitioned Tables

#### Range Partitioning (by date)

```sql
CREATE TABLE app.events (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create partitions
CREATE TABLE app.events_2024_01 PARTITION OF app.events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE app.events_2024_02 PARTITION OF app.events
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Default partition for unmatched values
CREATE TABLE app.events_default PARTITION OF app.events DEFAULT;
```

#### List Partitioning (by category)

```sql
CREATE TABLE app.orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    region VARCHAR(10) NOT NULL,
    total NUMERIC(10, 2) NOT NULL
) PARTITION BY LIST (region);

CREATE TABLE app.orders_us PARTITION OF app.orders
    FOR VALUES IN ('us-east', 'us-west');

CREATE TABLE app.orders_eu PARTITION OF app.orders
    FOR VALUES IN ('eu-west', 'eu-central');
```

---

## Modifying Tables

### Add Column

```sql
-- Add nullable column (instant, no table rewrite)
ALTER TABLE app.users ADD COLUMN phone VARCHAR(20);

-- Add column with default (table rewrite in PG < 11, instant in PG 11+)
ALTER TABLE app.users ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;
```

### Alter Column

```sql
-- Change data type
ALTER TABLE app.users ALTER COLUMN name TYPE VARCHAR(200);

-- Change type with conversion
ALTER TABLE app.users ALTER COLUMN phone TYPE BIGINT USING phone::bigint;

-- Set default
ALTER TABLE app.users ALTER COLUMN status SET DEFAULT 'active';

-- Remove default
ALTER TABLE app.users ALTER COLUMN status DROP DEFAULT;

-- Add NOT NULL (requires all rows to have values)
ALTER TABLE app.users ALTER COLUMN phone SET NOT NULL;

-- Remove NOT NULL
ALTER TABLE app.users ALTER COLUMN phone DROP NOT NULL;
```

### Rename

```sql
-- Rename column
ALTER TABLE app.users RENAME COLUMN name TO full_name;

-- Rename table
ALTER TABLE app.users RENAME TO customers;
```

### Drop Column

```sql
ALTER TABLE app.users DROP COLUMN phone;

-- Drop if exists
ALTER TABLE app.users DROP COLUMN IF EXISTS phone;
```

---

## Indexes

### Create Index

```sql
-- Basic B-tree index
CREATE INDEX idx_users_email ON app.users (email);

-- Unique index
CREATE UNIQUE INDEX idx_users_email_unique ON app.users (email);

-- Composite index (multi-column)
CREATE INDEX idx_orders_user_status ON app.orders (user_id, status);

-- Partial index (filtered)
CREATE INDEX idx_orders_pending ON app.orders (created_at)
    WHERE status = 'pending';

-- Expression index
CREATE INDEX idx_users_email_lower ON app.users (lower(email));

-- Covering index (INCLUDE columns, PG11+)
CREATE INDEX idx_orders_user_covering ON app.orders (user_id)
    INCLUDE (status, total);
```

### Create Index Concurrently

Avoid locking the table during index creation:

```sql
CREATE INDEX CONCURRENTLY idx_users_name ON app.users (name);
```

**Note**: CONCURRENTLY cannot be used in a transaction block.

### Index Types

| Type | Use Case | Example |
|------|----------|---------|
| B-tree | Default, equality and range | `WHERE x = 1`, `WHERE x > 10` |
| Hash | Equality only | `WHERE x = 1` (rarely used) |
| GIN | Arrays, JSONB, full-text | `WHERE tags @> ARRAY['tag']` |
| GiST | Geometric, range types, full-text | `WHERE point <@ box` |
| BRIN | Large tables with natural ordering | `WHERE created_at > '2024-01-01'` |

```sql
-- GIN for JSONB
CREATE INDEX idx_events_payload ON app.events USING gin (payload);

-- GIN for array containment
CREATE INDEX idx_posts_tags ON app.posts USING gin (tags);

-- BRIN for time-series data
CREATE INDEX idx_events_created ON app.events USING brin (created_at);
```

### Drop Index

```sql
DROP INDEX app.idx_users_email;

-- Drop concurrently (no lock)
DROP INDEX CONCURRENTLY app.idx_users_email;
```

---

## Constraints

### Add Constraint

```sql
-- Primary key
ALTER TABLE app.users ADD PRIMARY KEY (id);

-- Foreign key
ALTER TABLE app.orders
    ADD CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES app.users(id) ON DELETE CASCADE;

-- Unique
ALTER TABLE app.users
    ADD CONSTRAINT uq_users_email UNIQUE (email);

-- Check
ALTER TABLE app.orders
    ADD CONSTRAINT chk_orders_total CHECK (total >= 0);
```

### Foreign Key Actions

| Action | Description |
|--------|-------------|
| `CASCADE` | Delete/update child rows |
| `SET NULL` | Set child FK to NULL |
| `SET DEFAULT` | Set child FK to default |
| `RESTRICT` | Prevent if children exist (immediate) |
| `NO ACTION` | Prevent if children exist (deferred) |

```sql
-- Different actions for delete vs update
ALTER TABLE app.orders
    ADD CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES app.users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;
```

### Drop Constraint

```sql
ALTER TABLE app.orders DROP CONSTRAINT fk_orders_user;

-- Drop if exists
ALTER TABLE app.orders DROP CONSTRAINT IF EXISTS fk_orders_user;
```

### NOT VALID + VALIDATE Pattern

Add constraint without checking existing data, then validate separately:

```sql
-- Add without validating (fast, no full table scan)
ALTER TABLE app.orders
    ADD CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES app.users(id)
    NOT VALID;

-- Validate later (can be concurrent with reads)
ALTER TABLE app.orders VALIDATE CONSTRAINT fk_orders_user;
```

---

## Views

### Standard View

```sql
CREATE VIEW app.active_users AS
    SELECT id, email, name, created_at
    FROM app.users
    WHERE active = true;

-- Replace existing
CREATE OR REPLACE VIEW app.active_users AS
    SELECT id, email, name, created_at, updated_at
    FROM app.users
    WHERE active = true;
```

### Materialized View

Stores results physically for faster queries:

```sql
CREATE MATERIALIZED VIEW app.user_stats AS
    SELECT
        user_id,
        COUNT(*) AS order_count,
        SUM(total) AS total_spent,
        MAX(created_at) AS last_order_at
    FROM app.orders
    GROUP BY user_id;

-- Add index on materialized view
CREATE UNIQUE INDEX idx_user_stats_user ON app.user_stats (user_id);

-- Refresh (blocks reads)
REFRESH MATERIALIZED VIEW app.user_stats;

-- Refresh concurrently (requires unique index)
REFRESH MATERIALIZED VIEW CONCURRENTLY app.user_stats;
```

---

## Migration Patterns

### Safe Column Addition

```sql
-- Step 1: Add nullable column (instant)
ALTER TABLE app.users ADD COLUMN phone VARCHAR(20);

-- Step 2: Backfill data in batches
UPDATE app.users SET phone = '' WHERE phone IS NULL AND id BETWEEN 1 AND 10000;
UPDATE app.users SET phone = '' WHERE phone IS NULL AND id BETWEEN 10001 AND 20000;
-- ... continue batching

-- Step 3: Add NOT NULL constraint
ALTER TABLE app.users ALTER COLUMN phone SET NOT NULL;
```

### Safe Column Removal

```sql
-- Step 1: Remove references in application code first
-- Step 2: Drop column
ALTER TABLE app.users DROP COLUMN phone;
```

### Safe Index Creation

```sql
-- Use CONCURRENTLY to avoid locking
CREATE INDEX CONCURRENTLY idx_users_phone ON app.users (phone);

-- Verify index is valid
SELECT indexrelname, idx_scan
FROM pg_stat_user_indexes
WHERE indexrelname = 'idx_users_phone';
```

### Safe Type Change

```sql
-- For compatible types (e.g., VARCHAR(50) to VARCHAR(100))
ALTER TABLE app.users ALTER COLUMN name TYPE VARCHAR(200);

-- For incompatible types, use multi-step approach:
-- Step 1: Add new column
ALTER TABLE app.users ADD COLUMN age_int INTEGER;

-- Step 2: Backfill with conversion
UPDATE app.users SET age_int = age_text::integer WHERE age_int IS NULL;

-- Step 3: Drop old column
ALTER TABLE app.users DROP COLUMN age_text;

-- Step 4: Rename new column
ALTER TABLE app.users RENAME COLUMN age_int TO age;
```

### Adding FK to Large Table

```sql
-- Step 1: Add constraint without validation (instant)
ALTER TABLE app.orders
    ADD CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES app.users(id)
    NOT VALID;

-- Step 2: Validate in background (acquires weaker lock)
ALTER TABLE app.orders VALIDATE CONSTRAINT fk_orders_user;
```

---

## Migration File Conventions

### File Naming

```
migrations/
├── 001_create_users.sql
├── 002_create_orders.sql
├── 003_add_user_phone.sql
└── 004_create_order_items.sql
```

### Migration Tracking Table

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Migration File Template

```sql
-- Migration: 003_add_user_phone.sql
-- Description: Add phone column to users table

BEGIN;

-- Check if already applied
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '003') THEN
        RAISE EXCEPTION 'Migration 003 already applied';
    END IF;
END $$;

-- Migration
ALTER TABLE app.users ADD COLUMN phone VARCHAR(20);
CREATE INDEX CONCURRENTLY idx_users_phone ON app.users (phone);

-- Record migration
INSERT INTO schema_migrations (version) VALUES ('003');

COMMIT;
```

### Running Migrations

```bash
# Run single migration
psql -d myapp -f migrations/003_add_user_phone.sql

# Run all pending migrations
for f in migrations/*.sql; do
    psql -d myapp -f "$f"
done
```

---

## Drop Operations

### Drop Table

```sql
DROP TABLE app.orders;

-- Drop if exists
DROP TABLE IF EXISTS app.orders;

-- Drop with dependencies
DROP TABLE app.orders CASCADE;
```

### Drop Schema

```sql
DROP SCHEMA app;

-- Drop with all objects
DROP SCHEMA app CASCADE;
```

### Drop Database

```sql
-- Must be connected to a different database
DROP DATABASE myapp;

-- Force disconnect users (PG13+)
DROP DATABASE myapp WITH (FORCE);
```
