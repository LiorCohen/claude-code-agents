# PostgreSQL Seed Data

Inserting, importing, and generating data for development and testing.

---

## Basic INSERT

### Single Row

```sql
INSERT INTO app.users (email, name)
VALUES ('alice@example.com', 'Alice');
```

### Multiple Rows

```sql
INSERT INTO app.users (email, name) VALUES
    ('alice@example.com', 'Alice'),
    ('bob@example.com', 'Bob'),
    ('carol@example.com', 'Carol');
```

### With RETURNING

Get inserted values back:

```sql
INSERT INTO app.users (email, name)
VALUES ('alice@example.com', 'Alice')
RETURNING id, email, created_at;

-- Return all columns
INSERT INTO app.users (email, name)
VALUES ('bob@example.com', 'Bob')
RETURNING *;
```

### INSERT from SELECT

```sql
-- Copy from another table
INSERT INTO app.archived_users (id, email, name, archived_at)
SELECT id, email, name, NOW()
FROM app.users
WHERE active = false;

-- Transform data
INSERT INTO app.user_emails (user_id, email_lower)
SELECT id, lower(email)
FROM app.users;
```

---

## Upsert (ON CONFLICT)

### Insert or Update

```sql
INSERT INTO app.users (email, name)
VALUES ('alice@example.com', 'Alice Updated')
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();
```

### Insert or Nothing

```sql
INSERT INTO app.users (email, name)
VALUES ('alice@example.com', 'Alice')
ON CONFLICT (email) DO NOTHING;
```

### With Condition

```sql
INSERT INTO app.users (email, name, created_at)
VALUES ('alice@example.com', 'Alice New', NOW())
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW()
WHERE app.users.updated_at < EXCLUDED.created_at;
```

### Multiple Conflict Targets

```sql
-- Using constraint name
INSERT INTO app.users (email, name)
VALUES ('alice@example.com', 'Alice')
ON CONFLICT ON CONSTRAINT uq_users_email DO UPDATE SET
    name = EXCLUDED.name;
```

---

## Bulk Insert Patterns

### Multi-Value INSERT

Most efficient for moderate datasets (100-10000 rows):

```sql
INSERT INTO app.events (event_type, user_id, payload) VALUES
    ('login', 1, '{"ip": "192.168.1.1"}'),
    ('page_view', 1, '{"page": "/home"}'),
    ('click', 1, '{"element": "button"}'),
    -- ... more rows
    ('logout', 1, '{}');
```

### Batched Inserts

For large datasets, insert in batches:

```sql
-- Batch 1
INSERT INTO app.events (event_type, user_id) VALUES
    ('event_1', 1), ('event_2', 1), ... ('event_1000', 1);

-- Batch 2
INSERT INTO app.events (event_type, user_id) VALUES
    ('event_1001', 1), ('event_1002', 1), ... ('event_2000', 1);
```

### Disable Indexes for Bulk Load

For very large loads:

```sql
-- Disable indexes
DROP INDEX app.idx_events_user_id;
DROP INDEX app.idx_events_created_at;

-- Insert data
INSERT INTO app.events ...

-- Recreate indexes
CREATE INDEX idx_events_user_id ON app.events (user_id);
CREATE INDEX idx_events_created_at ON app.events (created_at);

-- Update statistics
ANALYZE app.events;
```

---

## COPY Command

### \copy vs COPY

| Command | Runs On | File Location | Use Case |
|---------|---------|---------------|----------|
| `\copy` | Client | Local machine | Development |
| `COPY` | Server | Server filesystem | Production |

### Import CSV

```sql
-- \copy from client (psql)
\copy app.users (email, name) FROM 'users.csv' WITH (FORMAT csv, HEADER true);

-- COPY from server
COPY app.users (email, name) FROM '/var/lib/postgresql/data/users.csv'
    WITH (FORMAT csv, HEADER true);
```

### Export CSV

```sql
-- \copy to client
\copy (SELECT * FROM app.users WHERE active = true) TO 'active_users.csv'
    WITH (FORMAT csv, HEADER true);

-- COPY to server
COPY app.users TO '/tmp/users.csv' WITH (FORMAT csv, HEADER true);
```

### CSV Options

```sql
\copy app.data FROM 'data.csv' WITH (
    FORMAT csv,
    HEADER true,
    DELIMITER ',',
    NULL '\N',
    QUOTE '"',
    ESCAPE '"',
    ENCODING 'UTF8'
);
```

| Option | Description | Default |
|--------|-------------|---------|
| `FORMAT` | csv, text, binary | text |
| `HEADER` | First row is header | false |
| `DELIMITER` | Column separator | , (csv), tab (text) |
| `NULL` | String representing NULL | empty (csv), \N (text) |
| `QUOTE` | Quote character | " |
| `ESCAPE` | Escape character | " |
| `ENCODING` | File encoding | database encoding |

### Performance Tips for COPY

```sql
-- Disable triggers during load
ALTER TABLE app.events DISABLE TRIGGER ALL;

\copy app.events FROM 'events.csv' WITH (FORMAT csv, HEADER true);

ALTER TABLE app.events ENABLE TRIGGER ALL;

-- Use UNLOGGED tables for staging (no WAL, faster)
CREATE UNLOGGED TABLE app.staging_events (LIKE app.events);
\copy app.staging_events FROM 'events.csv' WITH (FORMAT csv, HEADER true);
INSERT INTO app.events SELECT * FROM app.staging_events;
DROP TABLE app.staging_events;
```

---

## Generating Test Data

### generate_series for Numbers

```sql
-- Numbers 1 to 100
SELECT generate_series(1, 100);

-- Even numbers
SELECT generate_series(2, 100, 2);

-- Insert numbered users
INSERT INTO app.users (email, name)
SELECT
    'user' || n || '@example.com',
    'User ' || n
FROM generate_series(1, 1000) AS n;
```

### generate_series for Dates

```sql
-- Daily dates for a year
SELECT generate_series(
    '2024-01-01'::date,
    '2024-12-31'::date,
    '1 day'::interval
);

-- Hourly timestamps
SELECT generate_series(
    '2024-01-01 00:00:00'::timestamptz,
    '2024-01-01 23:59:59'::timestamptz,
    '1 hour'::interval
);

-- Insert daily metrics
INSERT INTO app.daily_metrics (date, views, visitors)
SELECT
    d::date,
    floor(random() * 1000 + 100)::int,
    floor(random() * 500 + 50)::int
FROM generate_series('2024-01-01'::date, '2024-12-31'::date, '1 day') AS d;
```

### Random Data Generation

```sql
-- Random integer (1-100)
SELECT floor(random() * 100 + 1)::int;

-- Random numeric (0.00 - 999.99)
SELECT round((random() * 1000)::numeric, 2);

-- Random boolean
SELECT random() < 0.5;

-- Random selection from array
SELECT (ARRAY['pending', 'active', 'completed'])[floor(random() * 3 + 1)::int];

-- Random timestamp in range
SELECT timestamp '2024-01-01' + random() * interval '365 days';

-- Random UUID
SELECT gen_random_uuid();

-- Random text (using md5)
SELECT substr(md5(random()::text), 1, 10);

-- Random email
SELECT 'user_' || substr(md5(random()::text), 1, 8) || '@example.com';
```

### Complete Test Data Example

```sql
-- Generate 10,000 users with random data
INSERT INTO app.users (email, name, created_at)
SELECT
    'user_' || substr(md5(random()::text), 1, 8) || '@example.com',
    (ARRAY['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank'])[floor(random() * 6 + 1)::int]
        || ' '
        || (ARRAY['Smith', 'Jones', 'Brown', 'Wilson', 'Taylor'])[floor(random() * 5 + 1)::int],
    timestamp '2023-01-01' + random() * interval '730 days'
FROM generate_series(1, 10000);

-- Generate orders for users
INSERT INTO app.orders (user_id, total, status, created_at)
SELECT
    u.id,
    round((random() * 500 + 10)::numeric, 2),
    (ARRAY['pending', 'processing', 'completed', 'cancelled'])[floor(random() * 4 + 1)::int],
    u.created_at + random() * interval '365 days'
FROM app.users u
CROSS JOIN generate_series(1, floor(random() * 5 + 1)::int);
```

### Related Data Generation

```sql
-- Users with guaranteed orders
WITH new_users AS (
    INSERT INTO app.users (email, name)
    SELECT
        'user' || n || '@example.com',
        'User ' || n
    FROM generate_series(1, 100) AS n
    RETURNING id
)
INSERT INTO app.orders (user_id, total, status)
SELECT
    u.id,
    round((random() * 100 + 10)::numeric, 2),
    'pending'
FROM new_users u
CROSS JOIN generate_series(1, 3);  -- 3 orders per user
```

---

## Seed File Organization

### Directory Structure

```
seeds/
├── 01_lookup_tables/
│   ├── countries.sql
│   ├── currencies.sql
│   └── statuses.sql
├── 02_core_data/
│   ├── admin_users.sql
│   └── system_config.sql
└── 03_sample_data/
    ├── test_users.sql
    └── test_orders.sql
```

### Idempotent Seed Template

```sql
-- seeds/01_lookup_tables/statuses.sql
-- Seed order statuses (idempotent)

INSERT INTO app.order_statuses (code, name, description) VALUES
    ('pending', 'Pending', 'Order placed, awaiting processing'),
    ('processing', 'Processing', 'Order being prepared'),
    ('shipped', 'Shipped', 'Order shipped to customer'),
    ('delivered', 'Delivered', 'Order delivered'),
    ('cancelled', 'Cancelled', 'Order cancelled')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;
```

### Master Seed Script

```sql
-- seeds/seed_all.sql
-- Master seed script

\echo 'Seeding lookup tables...'
\i 01_lookup_tables/countries.sql
\i 01_lookup_tables/currencies.sql
\i 01_lookup_tables/statuses.sql

\echo 'Seeding core data...'
\i 02_core_data/admin_users.sql
\i 02_core_data/system_config.sql

\echo 'Seeding sample data...'
\i 03_sample_data/test_users.sql
\i 03_sample_data/test_orders.sql

\echo 'Seed complete!'
```

Run with:

```bash
psql -d myapp -f seeds/seed_all.sql
```

---

## Best Practices

### Use Transactions

```sql
BEGIN;

INSERT INTO app.users (email, name) VALUES ('alice@example.com', 'Alice');
INSERT INTO app.profiles (user_id, bio) VALUES (currval('app.users_id_seq'), 'Bio');

COMMIT;
```

### Make Seeds Idempotent

```sql
-- Use ON CONFLICT
INSERT INTO app.config (key, value)
VALUES ('site_name', 'My App')
ON CONFLICT (key) DO NOTHING;

-- Or check before insert
INSERT INTO app.users (email, name)
SELECT 'admin@example.com', 'Admin'
WHERE NOT EXISTS (SELECT 1 FROM app.users WHERE email = 'admin@example.com');
```

### Reset Sequences After Seeding

```sql
-- Reset sequence to max id + 1
SELECT setval('app.users_id_seq', COALESCE(MAX(id), 0) + 1, false)
FROM app.users;

-- Reset all sequences in schema
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT sequencename FROM pg_sequences WHERE schemaname = 'app'
    LOOP
        EXECUTE format('SELECT setval(''app.%I'', COALESCE((SELECT MAX(id) FROM app.%I), 0) + 1, false)',
            r.sequencename,
            replace(r.sequencename, '_id_seq', ''));
    END LOOP;
END $$;
```

### Disable Constraints for Bulk Load

```sql
BEGIN;

-- Disable foreign key checks
SET session_replication_role = 'replica';

-- Insert data
\copy app.orders FROM 'orders.csv' WITH (FORMAT csv, HEADER true);

-- Re-enable
SET session_replication_role = 'origin';

COMMIT;
```

### Verify Seed Data

```sql
-- Check row counts
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM app.users
UNION ALL
SELECT 'orders', COUNT(*) FROM app.orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM app.order_items;

-- Check for orphaned records
SELECT o.id
FROM app.orders o
LEFT JOIN app.users u ON o.user_id = u.id
WHERE u.id IS NULL;

-- Check for missing required relationships
SELECT u.id, u.email
FROM app.users u
LEFT JOIN app.profiles p ON u.id = p.user_id
WHERE p.id IS NULL;
```

---

## Truncate and Reset

### Truncate Table

```sql
-- Fast delete all rows
TRUNCATE TABLE app.orders;

-- With cascade (truncates dependent tables)
TRUNCATE TABLE app.users CASCADE;

-- Reset identity
TRUNCATE TABLE app.users RESTART IDENTITY;

-- Combined
TRUNCATE TABLE app.users RESTART IDENTITY CASCADE;
```

### Reset Database for Testing

```sql
-- Truncate all tables in schema
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'app'
    LOOP
        EXECUTE format('TRUNCATE TABLE app.%I RESTART IDENTITY CASCADE', r.tablename);
    END LOOP;
END $$;
```
