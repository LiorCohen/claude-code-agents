# Administration

Maintenance operations, permissions, backup, and data import/export.

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

## VACUUM and ANALYZE

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

## REINDEX

```sql
-- Rebuild index (locks table)
REINDEX INDEX app.idx_users_email;

-- Rebuild concurrently (PG12+, no lock)
REINDEX INDEX CONCURRENTLY app.idx_users_email;
```

## Database Size

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
