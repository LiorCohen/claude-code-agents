---
name: postgresql
description: "PostgreSQL database agent: deploy locally (Docker/K8s), manage schemas, run queries, analyze performance, configure permissions, and seed data."
---

# PostgreSQL Skill

SQL-native PostgreSQL operations via `psql`. No Python dependencies required.

---

## Version Compatibility

| Feature | Minimum Version |
|---------|-----------------|
| Core functionality | PostgreSQL 12+ |
| `pg_blocking_pids()` | 9.6+ |
| `REINDEX CONCURRENTLY` | 12+ |
| `pg_stat_progress_*` views | 12+ |
| `VACUUM PARALLEL` | 13+ |
| `pg_stat_wal` | 14+ |
| `pg_stat_checkpointer` | 17+ |

**Recommended**: PostgreSQL 14+

---

## Local Deployment

### Docker (Quick Start)

```bash
docker run -d \
  --name postgres \
  -e POSTGRES_USER=app \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=myapp \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16
```

### Docker Compose

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: myapp
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d myapp"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

### Kubernetes

```bash
# Simple pod for testing
kubectl run postgres --image=postgres:16 \
  --env="POSTGRES_PASSWORD=secret" \
  --port=5432

# Port forward for local access
kubectl port-forward pod/postgres 5432:5432
```

See [references/deployment.md](references/deployment.md) for StatefulSet, PVC, and production patterns.

---

## Connection

### Environment Variables

```bash
export PGHOST=localhost
export PGPORT=5432
export PGUSER=app
export PGPASSWORD=secret
export PGDATABASE=myapp
```

### Connect via psql

```bash
# Using environment variables
psql

# Using connection string
psql "postgresql://app:secret@localhost:5432/myapp"

# Docker
docker exec -it postgres psql -U app -d myapp

# Kubernetes
kubectl exec -it postgres -- psql -U postgres
```

---

## Initial Setup

```sql
-- Create database
CREATE DATABASE myapp;

-- Create application role
CREATE ROLE app_role;
GRANT CONNECT ON DATABASE myapp TO app_role;

-- Create user with role
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT app_role TO app_user;

-- Create schema
\c myapp
CREATE SCHEMA IF NOT EXISTS app;

-- Grant permissions
GRANT USAGE ON SCHEMA app TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO app_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_role;

-- Set search path
ALTER DATABASE myapp SET search_path TO app, public;
```

---

## Schema Management

### Create Table

```sql
CREATE TABLE app.users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON app.users (email);
```

### Alter Table

```sql
-- Add column (safe - nullable first)
ALTER TABLE app.users ADD COLUMN phone VARCHAR(20);

-- Add NOT NULL constraint after backfilling
UPDATE app.users SET phone = '' WHERE phone IS NULL;
ALTER TABLE app.users ALTER COLUMN phone SET NOT NULL;

-- Add index concurrently (no lock)
CREATE INDEX CONCURRENTLY idx_users_phone ON app.users (phone);
```

### Foreign Keys

```sql
CREATE TABLE app.orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    total NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

See [references/schema-management.md](references/schema-management.md) for migrations, partitioning, and advanced patterns.

---

## Seed Data

### Basic Insert

```sql
INSERT INTO app.users (email, name) VALUES
    ('alice@example.com', 'Alice'),
    ('bob@example.com', 'Bob')
RETURNING id, email;
```

### Upsert

```sql
INSERT INTO app.users (email, name)
VALUES ('alice@example.com', 'Alice Updated')
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();
```

### Generate Test Data

```sql
INSERT INTO app.users (email, name)
SELECT
    'user' || n || '@example.com',
    'User ' || n
FROM generate_series(1, 1000) AS n;
```

### COPY from CSV

```sql
\copy app.users (email, name) FROM 'users.csv' WITH (FORMAT csv, HEADER true);
```

See [references/seed-data.md](references/seed-data.md) for bulk loading and test data generation.

---

## Schema Exploration

### List Tables

```sql
\dt app.*

-- Or via query
SELECT tablename FROM pg_tables WHERE schemaname = 'app';
```

### Describe Table

```sql
\d app.users

-- Detailed column info
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'app' AND table_name = 'users'
ORDER BY ordinal_position;
```

### List Indexes

```sql
\di app.*

-- With size and usage
SELECT indexrelname, pg_size_pretty(pg_relation_size(indexrelid)) AS size,
       idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'app';
```

### Foreign Keys

```sql
SELECT
    tc.table_name, kcu.column_name,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'app';
```

See [references/introspection-queries.md](references/introspection-queries.md) for comprehensive schema queries.

---

## Query Execution

### Parameterized Queries

**CRITICAL**: Always use parameterized queries to prevent SQL injection.

```sql
-- In psql with variables
\set user_id 123
SELECT * FROM app.users WHERE id = :user_id;

-- Prepared statements
PREPARE get_user(bigint) AS
    SELECT * FROM app.users WHERE id = $1;
EXECUTE get_user(123);
```

### Transactions

```sql
BEGIN;
    UPDATE app.accounts SET balance = balance - 100 WHERE id = 1;
    UPDATE app.accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- With savepoint
BEGIN;
    INSERT INTO app.orders (user_id, total) VALUES (1, 99.99);
    SAVEPOINT before_items;
    INSERT INTO app.order_items (order_id, product_id) VALUES (1, 999);
    -- Oops, rollback just the items
    ROLLBACK TO before_items;
COMMIT;
```

---

## Performance Analysis

### EXPLAIN ANALYZE

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM app.users WHERE email = 'alice@example.com';
```

**Key metrics to check:**
- `Seq Scan` on large tables = missing index
- `actual rows` >> `estimated rows` = stale statistics
- `Buffers: shared read` >> `shared hit` = poor cache ratio

### Table Statistics

```sql
SELECT
    relname AS table_name,
    n_live_tup AS live_rows,
    n_dead_tup AS dead_rows,
    last_vacuum,
    last_analyze
FROM pg_stat_user_tables
WHERE schemaname = 'app';
```

### Index Usage

```sql
SELECT
    indexrelname AS index,
    idx_scan AS scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'app'
ORDER BY idx_scan DESC;
```

### Cache Hit Ratio

```sql
SELECT
    sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) AS ratio
FROM pg_statio_user_tables;
```

Target: > 0.99 (99% cache hit ratio)

See [references/performance-tuning.md](references/performance-tuning.md) for optimization strategies.

---

## System Monitoring

### Active Queries

```sql
SELECT pid, now() - pg_stat_activity.query_start AS duration,
       query, state
FROM pg_stat_activity
WHERE state != 'idle'
    AND query NOT ILIKE '%pg_stat_activity%'
ORDER BY duration DESC;
```

### Blocked Queries

```sql
SELECT
    blocked.pid AS blocked_pid,
    blocked.query AS blocked_query,
    blocking.pid AS blocking_pid,
    blocking.query AS blocking_query
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking ON blocking.pid = ANY(pg_blocking_pids(blocked.pid))
WHERE blocked.pid != blocked.pid;
```

### Long-Running Queries (> 5 minutes)

```sql
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active'
    AND now() - query_start > interval '5 minutes';
```

### Kill Query

```sql
-- Graceful termination
SELECT pg_cancel_backend(pid);

-- Force termination
SELECT pg_terminate_backend(pid);
```

See [references/system-views.md](references/system-views.md) for comprehensive monitoring queries.

---

## Administration

### VACUUM and ANALYZE

```sql
-- Analyze table statistics
ANALYZE app.users;

-- Reclaim dead tuple space
VACUUM app.users;

-- Full vacuum (rewrites table, requires lock)
VACUUM FULL app.users;

-- Vacuum with parallel workers (PG13+)
VACUUM (PARALLEL 4) app.users;
```

### REINDEX

```sql
-- Rebuild index (locks table)
REINDEX INDEX app.idx_users_email;

-- Rebuild concurrently (PG12+, no lock)
REINDEX INDEX CONCURRENTLY app.idx_users_email;
```

### Database Size

```sql
SELECT pg_size_pretty(pg_database_size('myapp')) AS db_size;

-- Table sizes
SELECT
    relname AS table,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_relation_size(relid)) AS table_size,
    pg_size_pretty(pg_indexes_size(relid)) AS index_size
FROM pg_stat_user_tables
WHERE schemaname = 'app'
ORDER BY pg_total_relation_size(relid) DESC;
```

---

## Data Export/Import

### Export to CSV

```sql
\copy (SELECT * FROM app.users) TO 'users.csv' WITH (FORMAT csv, HEADER true);
```

### Import from CSV

```sql
\copy app.users (email, name) FROM 'users.csv' WITH (FORMAT csv, HEADER true);
```

### pg_dump / pg_restore

```bash
# Export database
pg_dump -Fc myapp > myapp.dump

# Export specific tables
pg_dump -Fc -t 'app.users' -t 'app.orders' myapp > tables.dump

# Restore
pg_restore -d myapp myapp.dump

# Schema only
pg_dump -s myapp > schema.sql
```

---

## Safety Guidelines

**CRITICAL**: Follow these rules to prevent data loss and security issues.

1. **Always use parameterized queries** - Never concatenate user input into SQL strings
2. **Wrap modifications in transactions** - Use BEGIN/COMMIT for multi-statement changes
3. **Always include WHERE clause** - Never run UPDATE/DELETE without WHERE
4. **Test on non-production first** - Validate queries on dev/staging before production
5. **Use CONCURRENTLY for indexes** - Avoid locking tables during index operations
6. **Backup before migrations** - Always have a restore point before schema changes
7. **Limit query results** - Use LIMIT during exploration to avoid memory issues

---

## psql Quick Reference

| Command | Description |
|---------|-------------|
| `\l` | List databases |
| `\c dbname` | Connect to database |
| `\dt` | List tables |
| `\dt schema.*` | List tables in schema |
| `\d tablename` | Describe table |
| `\di` | List indexes |
| `\df` | List functions |
| `\du` | List roles/users |
| `\dn` | List schemas |
| `\x` | Toggle expanded display |
| `\timing` | Toggle query timing |
| `\i file.sql` | Execute SQL file |
| `\copy` | Import/export CSV |
| `\q` | Quit |

---

## References

Detailed documentation for specific topics:

- [Deployment](references/deployment.md) - Docker, Compose, Kubernetes, init scripts
- [Schema Management](references/schema-management.md) - Tables, indexes, migrations, partitioning
- [Seed Data](references/seed-data.md) - Bulk insert, COPY, test data generation
- [Permissions Setup](references/permissions-setup.md) - Roles, grants, RLS, security
- [System Views](references/system-views.md) - pg_stat_* views, monitoring queries
- [Introspection Queries](references/introspection-queries.md) - Schema exploration
- [Performance Tuning](references/performance-tuning.md) - EXPLAIN, indexes, configuration
- [Common Errors](references/common-errors.md) - Error messages and solutions
