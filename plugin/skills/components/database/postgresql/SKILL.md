---
name: postgresql
description: "PostgreSQL database agent: deploy locally (Docker/K8s), manage schemas, run queries, analyze performance, configure permissions, and seed data."
user-invocable: false
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

## Resource Files

For detailed guidance, read these on-demand:
- [deployment.md](resources/deployment.md) — Docker, Docker Compose, Kubernetes setups
- [schema-management.md](resources/schema-management.md) — Tables, indexes, migrations
- [monitoring.md](resources/monitoring.md) — System views, performance analysis
- [administration.md](resources/administration.md) — Permissions, backup, import/export

---

## Input / Output

This skill defines no input parameters or structured output.
