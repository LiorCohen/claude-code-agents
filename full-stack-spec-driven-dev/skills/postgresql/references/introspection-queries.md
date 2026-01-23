# PostgreSQL Introspection Queries

SQL queries for exploring and documenting database schemas.

---

## Tables

### List Tables (Simple)

```sql
-- psql command
\dt app.*

-- Query
SELECT tablename
FROM pg_tables
WHERE schemaname = 'app'
ORDER BY tablename;
```

### List Tables (Detailed)

```sql
SELECT
    t.table_schema,
    t.table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))) AS total_size,
    pg_size_pretty(pg_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))) AS table_size,
    (SELECT count(*) FROM pg_indexes WHERE schemaname = t.table_schema AND tablename = t.table_name) AS index_count,
    obj_description((quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))::regclass) AS comment
FROM information_schema.tables t
WHERE t.table_schema = 'app'
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;
```

### Tables with Row Counts

```sql
SELECT
    schemaname,
    relname AS table_name,
    n_live_tup AS estimated_row_count
FROM pg_stat_user_tables
WHERE schemaname = 'app'
ORDER BY n_live_tup DESC;
```

---

## Columns

### List Columns (Simple)

```sql
-- psql command
\d app.users

-- Query
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'app' AND table_name = 'users'
ORDER BY ordinal_position;
```

### List Columns (Detailed)

```sql
SELECT
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.numeric_precision,
    c.numeric_scale,
    c.is_nullable,
    c.column_default,
    CASE WHEN c.is_identity = 'YES' THEN 'IDENTITY' ELSE NULL END AS identity,
    col_description(
        (quote_ident(c.table_schema) || '.' || quote_ident(c.table_name))::regclass,
        c.ordinal_position
    ) AS comment
FROM information_schema.columns c
WHERE c.table_schema = 'app' AND c.table_name = 'users'
ORDER BY c.ordinal_position;
```

### Columns with Types (Using pg_catalog)

```sql
SELECT
    a.attname AS column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
    NOT a.attnotnull AS is_nullable,
    pg_get_expr(d.adbin, d.adrelid) AS column_default,
    col_description(a.attrelid, a.attnum) AS comment
FROM pg_catalog.pg_attribute a
LEFT JOIN pg_catalog.pg_attrdef d ON a.attrelid = d.adrelid AND a.attnum = d.adnum
WHERE a.attrelid = 'app.users'::regclass
    AND a.attnum > 0
    AND NOT a.attisdropped
ORDER BY a.attnum;
```

---

## Primary Keys

### List Primary Keys

```sql
SELECT
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'app'
GROUP BY tc.table_schema, tc.table_name, tc.constraint_name
ORDER BY tc.table_name;
```

### Primary Key for Specific Table

```sql
SELECT
    kcu.column_name,
    kcu.ordinal_position
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'app'
    AND tc.table_name = 'users'
ORDER BY kcu.ordinal_position;
```

---

## Foreign Keys

### List Foreign Keys (Simple)

```sql
SELECT
    tc.table_name AS from_table,
    kcu.column_name AS from_column,
    ccu.table_name AS to_table,
    ccu.column_name AS to_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'app'
ORDER BY tc.table_name, kcu.column_name;
```

### List Foreign Keys (With Actions)

```sql
SELECT
    tc.constraint_name,
    tc.table_name AS from_table,
    kcu.column_name AS from_column,
    ccu.table_name AS to_table,
    ccu.column_name AS to_column,
    rc.update_rule AS on_update,
    rc.delete_rule AS on_delete
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'app'
ORDER BY tc.table_name;
```

### Foreign Keys Referencing a Table

```sql
SELECT
    tc.table_name AS referencing_table,
    kcu.column_name AS referencing_column,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_schema = 'app'
    AND ccu.table_name = 'users';
```

---

## Unique Constraints

```sql
SELECT
    tc.table_name,
    tc.constraint_name,
    string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = 'app'
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name;
```

---

## Check Constraints

```sql
SELECT
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
    AND tc.table_schema = 'app'
    AND tc.constraint_name NOT LIKE '%_not_null'  -- Exclude NOT NULL
ORDER BY tc.table_name;
```

---

## Indexes

### List Indexes (Simple)

```sql
-- psql command
\di app.*

-- Query
SELECT
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE schemaname = 'app'
ORDER BY tablename, indexname;
```

### List Indexes (Detailed)

```sql
SELECT
    i.relname AS index_name,
    t.relname AS table_name,
    am.amname AS index_type,
    array_agg(a.attname ORDER BY k.n) AS columns,
    idx.indisunique AS is_unique,
    idx.indisprimary AS is_primary,
    pg_size_pretty(pg_relation_size(i.oid)) AS index_size,
    s.idx_scan AS scans,
    s.idx_tup_read AS tuples_read
FROM pg_index idx
JOIN pg_class i ON i.oid = idx.indexrelid
JOIN pg_class t ON t.oid = idx.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
JOIN pg_am am ON am.oid = i.relam
JOIN LATERAL unnest(idx.indkey) WITH ORDINALITY AS k(attnum, n) ON true
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
LEFT JOIN pg_stat_user_indexes s ON s.indexrelid = i.oid
WHERE n.nspname = 'app'
GROUP BY i.relname, t.relname, am.amname, idx.indisunique, idx.indisprimary, i.oid, s.idx_scan, s.idx_tup_read
ORDER BY t.relname, i.relname;
```

### Index Definitions

```sql
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'app'
    AND tablename = 'users';
```

---

## All Constraints

Combined view of all constraint types:

```sql
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    CASE
        WHEN tc.constraint_type = 'CHECK' THEN cc.check_clause
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN
            ccu.table_name || '(' || ccu.column_name || ')'
        ELSE
            string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position)
    END AS details
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
    AND tc.constraint_type = 'FOREIGN KEY'
LEFT JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
    AND tc.constraint_type = 'CHECK'
WHERE tc.table_schema = 'app'
    AND tc.constraint_name NOT LIKE '%_not_null'
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type, cc.check_clause, ccu.table_name, ccu.column_name
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;
```

---

## Functions

### List Functions

```sql
-- psql command
\df app.*

-- Query
SELECT
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    pg_get_function_result(p.oid) AS return_type,
    CASE p.prokind
        WHEN 'f' THEN 'function'
        WHEN 'p' THEN 'procedure'
        WHEN 'a' THEN 'aggregate'
        WHEN 'w' THEN 'window'
    END AS kind
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'app'
ORDER BY p.proname;
```

### Function Definition

```sql
SELECT pg_get_functiondef('app.my_function'::regproc);
```

---

## Triggers

```sql
SELECT
    trigger_name,
    event_manipulation AS event,
    event_object_table AS table_name,
    action_timing AS timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'app'
ORDER BY event_object_table, trigger_name;
```

---

## Schemas

```sql
-- psql command
\dn

-- Query
SELECT
    nspname AS schema_name,
    pg_catalog.pg_get_userbyid(nspowner) AS owner,
    obj_description(oid, 'pg_namespace') AS comment
FROM pg_catalog.pg_namespace
WHERE nspname NOT IN ('pg_catalog', 'information_schema')
    AND nspname NOT LIKE 'pg_toast%'
    AND nspname NOT LIKE 'pg_temp%'
ORDER BY nspname;
```

---

## Users and Roles

```sql
-- psql command
\du

-- Query
SELECT
    rolname AS name,
    rolsuper AS superuser,
    rolcreaterole AS create_role,
    rolcreatedb AS create_db,
    rolcanlogin AS can_login,
    rolconnlimit AS connection_limit,
    rolvaliduntil AS valid_until
FROM pg_roles
WHERE rolname NOT LIKE 'pg_%'
ORDER BY rolname;
```

---

## Sequences

```sql
SELECT
    sequencename,
    start_value,
    min_value,
    max_value,
    increment_by,
    cycle AS is_cyclic,
    cache_size,
    last_value
FROM pg_sequences
WHERE schemaname = 'app'
ORDER BY sequencename;
```

---

## Extensions

```sql
SELECT
    extname AS name,
    extversion AS version,
    obj_description(oid, 'pg_extension') AS comment
FROM pg_extension
ORDER BY extname;
```

---

## Duplicate Index Detection

Find indexes that may be redundant:

```sql
SELECT
    pg_size_pretty(sum(pg_relation_size(idx))::bigint) AS total_size,
    array_agg(idx) AS indexes,
    (array_agg(indexrelid::regclass))[1] AS suggested_keep,
    count(*) AS index_count
FROM (
    SELECT
        indexrelid::regclass AS idx,
        indexrelid,
        indrelid,
        indkey::text,
        indclass::text,
        coalesce(indpred::text, '') AS pred
    FROM pg_index
    WHERE indisvalid
) sub
GROUP BY indrelid, indkey, indclass, pred
HAVING count(*) > 1
ORDER BY sum(pg_relation_size(idx)) DESC;
```

---

## Table Dependencies

### Tables that depend on a table (via FK)

```sql
SELECT DISTINCT
    tc.table_name AS dependent_table
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_schema = 'app'
    AND ccu.table_name = 'users';
```

### Tables that a table depends on (via FK)

```sql
SELECT DISTINCT
    ccu.table_name AS referenced_table
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'app'
    AND tc.table_name = 'orders';
```

---

## Generate DDL

### Table DDL

```sql
SELECT
    'CREATE TABLE ' || quote_ident(table_schema) || '.' || quote_ident(table_name) || ' (' ||
    string_agg(
        quote_ident(column_name) || ' ' ||
        data_type ||
        CASE WHEN character_maximum_length IS NOT NULL THEN '(' || character_maximum_length || ')' ELSE '' END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
        ', ' ORDER BY ordinal_position
    ) || ');' AS ddl
FROM information_schema.columns
WHERE table_schema = 'app' AND table_name = 'users'
GROUP BY table_schema, table_name;
```

Note: For complete DDL including constraints and indexes, use `pg_dump -s -t app.users`.

---

## Quick Schema Summary

```sql
SELECT
    'Tables' AS object_type,
    count(*) AS count
FROM information_schema.tables
WHERE table_schema = 'app' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 'Views', count(*)
FROM information_schema.views
WHERE table_schema = 'app'
UNION ALL
SELECT 'Indexes', count(*)
FROM pg_indexes
WHERE schemaname = 'app'
UNION ALL
SELECT 'Functions', count(*)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'app'
UNION ALL
SELECT 'Triggers', count(*)
FROM information_schema.triggers
WHERE trigger_schema = 'app'
UNION ALL
SELECT 'Sequences', count(*)
FROM pg_sequences
WHERE schemaname = 'app';
```
