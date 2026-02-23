# Schema Management

Table creation, alteration, indexing, and schema exploration patterns.

---

## Create Table

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

## Alter Table

```sql
-- Add column (safe - nullable first)
ALTER TABLE app.users ADD COLUMN phone VARCHAR(20);

-- Add NOT NULL constraint after backfilling
UPDATE app.users SET phone = '' WHERE phone IS NULL;
ALTER TABLE app.users ALTER COLUMN phone SET NOT NULL;

-- Add index concurrently (no lock)
CREATE INDEX CONCURRENTLY idx_users_phone ON app.users (phone);
```

## Foreign Keys

```sql
CREATE TABLE app.orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    total NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

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
