# PostgreSQL Performance Tuning

Query optimization, index strategies, and configuration tuning.

---

## EXPLAIN Output

### Basic EXPLAIN

```sql
EXPLAIN SELECT * FROM app.users WHERE email = 'alice@example.com';
```

### EXPLAIN ANALYZE (Actually Runs Query)

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM app.users WHERE email = 'alice@example.com';
```

### EXPLAIN Options

| Option | Description |
|--------|-------------|
| `ANALYZE` | Actually execute, show real times |
| `BUFFERS` | Show buffer usage (requires ANALYZE) |
| `COSTS` | Show cost estimates (default on) |
| `TIMING` | Show actual timing (requires ANALYZE) |
| `VERBOSE` | Show additional detail |
| `FORMAT` | TEXT, JSON, YAML, XML |

### Node Types

| Node | Description | Action |
|------|-------------|--------|
| `Seq Scan` | Full table scan | Consider index if large table |
| `Index Scan` | Uses index, fetches from table | Good for selective queries |
| `Index Only Scan` | Uses covering index | Best case for indexed queries |
| `Bitmap Index Scan` | Builds bitmap of matching rows | Good for medium selectivity |
| `Bitmap Heap Scan` | Fetches rows from bitmap | Follows bitmap scan |

### Join Types

| Join | Description | Performance |
|------|-------------|-------------|
| `Nested Loop` | For each outer row, scan inner | Best for small datasets |
| `Hash Join` | Build hash table, probe it | Good for larger equi-joins |
| `Merge Join` | Merge sorted inputs | Good for pre-sorted data |

### Key Metrics to Check

```
Seq Scan on users  (cost=0.00..35.50 rows=1 width=100) (actual time=0.015..0.250 rows=1 loops=1)
  Filter: (email = 'alice@example.com'::text)
  Rows Removed by Filter: 999
  Buffers: shared hit=15
Planning Time: 0.150 ms
Execution Time: 0.300 ms
```

| Metric | Issue If |
|--------|----------|
| `Seq Scan` on large table | Missing index |
| `actual rows` >> `rows` | Stale statistics, run ANALYZE |
| `Rows Removed by Filter` high | Index might help |
| `shared read` >> `shared hit` | Poor cache ratio |
| `loops` high | Consider different join strategy |

---

## Slow Query Identification

### Enable pg_stat_statements

```sql
-- Check if available
SELECT * FROM pg_available_extensions WHERE name = 'pg_stat_statements';

-- Enable
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Configure (postgresql.conf)
-- shared_preload_libraries = 'pg_stat_statements'
-- pg_stat_statements.track = all
```

### Top Queries by Total Time

```sql
SELECT
    round(total_exec_time::numeric, 2) AS total_time_ms,
    calls,
    round(mean_exec_time::numeric, 2) AS avg_time_ms,
    round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 2) AS pct,
    query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

### Top Queries by Average Time

```sql
SELECT
    round(mean_exec_time::numeric, 2) AS avg_time_ms,
    calls,
    round(total_exec_time::numeric, 2) AS total_time_ms,
    query
FROM pg_stat_statements
WHERE calls > 10
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Queries with High Buffer Usage

```sql
SELECT
    query,
    calls,
    shared_blks_hit,
    shared_blks_read,
    round(100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0), 2) AS hit_pct
FROM pg_stat_statements
WHERE shared_blks_hit + shared_blks_read > 1000
ORDER BY shared_blks_read DESC
LIMIT 20;
```

### Reset Statistics

```sql
SELECT pg_stat_statements_reset();
```

---

## Index Types

### B-tree (Default)

Best for: equality and range queries.

```sql
CREATE INDEX idx_users_email ON app.users (email);
CREATE INDEX idx_orders_created ON app.orders (created_at);

-- Good for:
WHERE email = 'alice@example.com'
WHERE email LIKE 'alice%'  -- prefix only
WHERE created_at > '2024-01-01'
WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY created_at
```

### Hash

Best for: equality only (rarely needed, B-tree usually better).

```sql
CREATE INDEX idx_users_email_hash ON app.users USING hash (email);

-- Good for:
WHERE email = 'alice@example.com'

-- NOT good for:
WHERE email LIKE 'alice%'
WHERE email > 'alice'
```

### GIN (Generalized Inverted Index)

Best for: arrays, JSONB, full-text search.

```sql
-- For JSONB containment
CREATE INDEX idx_events_payload ON app.events USING gin (payload);

-- Good for:
WHERE payload @> '{"type": "login"}'
WHERE payload ? 'email'
WHERE payload ?& ARRAY['email', 'name']

-- For arrays
CREATE INDEX idx_posts_tags ON app.posts USING gin (tags);

-- Good for:
WHERE tags @> ARRAY['postgresql']
WHERE tags && ARRAY['postgresql', 'mysql']

-- For full-text search
CREATE INDEX idx_posts_search ON app.posts USING gin (to_tsvector('english', title || ' ' || body));

-- Good for:
WHERE to_tsvector('english', title || ' ' || body) @@ to_tsquery('postgresql & performance')
```

### GiST (Generalized Search Tree)

Best for: geometric data, range types, full-text (with ts_vector).

```sql
-- For range types
CREATE INDEX idx_reservations_period ON app.reservations USING gist (period);

-- Good for:
WHERE period && '[2024-01-01, 2024-01-31]'::daterange

-- For geometric
CREATE INDEX idx_locations_point ON app.locations USING gist (point);

-- Good for:
WHERE point <@ box '((0,0),(10,10))'
```

### BRIN (Block Range Index)

Best for: large tables with naturally ordered data (time-series).

```sql
CREATE INDEX idx_events_created ON app.events USING brin (created_at);

-- Good for very large tables where:
-- - Data is physically ordered by the indexed column
-- - Queries filter by ranges
```

BRIN advantages:
- Very small index size
- Fast to build
- Good for append-only tables

BRIN limitations:
- Only effective if data is physically ordered
- Less effective for point queries

---

## Index Maintenance

### Find Unused Indexes

```sql
SELECT
    schemaname,
    relname AS table_name,
    indexrelname AS index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
    AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Find Missing Indexes (Sequential Scans on Large Tables)

```sql
SELECT
    schemaname,
    relname AS table_name,
    seq_scan,
    seq_tup_read,
    idx_scan,
    n_live_tup,
    round(seq_tup_read::numeric / nullif(seq_scan, 0), 0) AS avg_rows_per_scan
FROM pg_stat_user_tables
WHERE seq_scan > 100
    AND n_live_tup > 10000
    AND seq_scan > idx_scan
ORDER BY seq_tup_read DESC
LIMIT 20;
```

### Find Bloated Indexes

```sql
SELECT
    schemaname,
    relname AS table_name,
    indexrelname AS index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    pg_size_pretty(pg_relation_size(relid)) AS table_size,
    round(100.0 * pg_relation_size(indexrelid) / nullif(pg_relation_size(relid), 0), 2) AS index_to_table_pct
FROM pg_stat_user_indexes
JOIN pg_index USING (indexrelid)
WHERE pg_relation_size(indexrelid) > 10485760  -- > 10MB
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Find Duplicate Indexes

```sql
SELECT
    pg_size_pretty(sum(pg_relation_size(idx))::bigint) AS total_size,
    array_agg(idx) AS indexes
FROM (
    SELECT
        indexrelid::regclass AS idx,
        indrelid,
        indkey::text
    FROM pg_index
    WHERE indisvalid
) sub
GROUP BY indrelid, indkey
HAVING count(*) > 1
ORDER BY sum(pg_relation_size(idx)) DESC;
```

### Rebuild Bloated Index

```sql
-- Concurrent (no lock, PG12+)
REINDEX INDEX CONCURRENTLY app.idx_users_email;

-- Non-concurrent (locks table)
REINDEX INDEX app.idx_users_email;
```

---

## Memory Settings

### Key Parameters

| Parameter | Description | Starting Point |
|-----------|-------------|----------------|
| `shared_buffers` | Buffer cache size | 25% of RAM (max ~8GB) |
| `work_mem` | Per-operation memory for sorts/hashes | 64MB-256MB |
| `maintenance_work_mem` | Memory for VACUUM, CREATE INDEX | 512MB-2GB |
| `effective_cache_size` | Planner's estimate of OS cache | 50-75% of RAM |

### Check Current Settings

```sql
SHOW shared_buffers;
SHOW work_mem;
SHOW maintenance_work_mem;
SHOW effective_cache_size;
```

### work_mem Tuning

```sql
-- Check for disk sorts/hashes (indicates work_mem too low)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM app.orders ORDER BY created_at;

-- If you see "Sort Method: external merge Disk" - increase work_mem

-- Set for session
SET work_mem = '256MB';

-- Set globally (requires reload)
ALTER SYSTEM SET work_mem = '128MB';
SELECT pg_reload_conf();
```

---

## Autovacuum Tuning

### Key Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `autovacuum_vacuum_threshold` | 50 | Min rows to trigger vacuum |
| `autovacuum_vacuum_scale_factor` | 0.2 | Fraction of table to trigger |
| `autovacuum_analyze_threshold` | 50 | Min rows to trigger analyze |
| `autovacuum_analyze_scale_factor` | 0.1 | Fraction to trigger analyze |

Vacuum triggers when: `dead_tuples > threshold + scale_factor * table_size`

### Per-Table Autovacuum Settings

```sql
-- For high-churn tables, vacuum more frequently
ALTER TABLE app.events SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02
);

-- For large tables, use lower scale factor
ALTER TABLE app.logs SET (
    autovacuum_vacuum_scale_factor = 0.01,
    autovacuum_vacuum_threshold = 1000
);
```

### Check Autovacuum Status

```sql
SELECT
    schemaname,
    relname,
    n_dead_tup,
    n_live_tup,
    round(100.0 * n_dead_tup / nullif(n_live_tup, 0), 2) AS dead_pct,
    last_autovacuum,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```

---

## Common Performance Issues

### Issue: Sequential Scans on Large Tables

**Symptoms**: Slow queries, high seq_scan count.

**Solutions**:
1. Add appropriate index
2. Check if statistics are stale (run ANALYZE)
3. Check if planner is choosing wrong plan (random_page_cost too high)

```sql
-- Add index
CREATE INDEX CONCURRENTLY idx_orders_user ON app.orders (user_id);

-- Update statistics
ANALYZE app.orders;

-- Check random_page_cost (lower for SSD)
SHOW random_page_cost;  -- Default 4.0, try 1.1-1.5 for SSD
```

### Issue: Index Not Being Used

**Symptoms**: Index exists but planner chooses seq scan.

**Causes**:
1. Table too small (seq scan faster)
2. Low selectivity (too many matching rows)
3. Type mismatch in query
4. Function on column prevents index use

```sql
-- Check: Type mismatch
-- Bad: user_id is bigint, but using integer literal
WHERE user_id = 123  -- Cast might prevent index
-- Fix:
WHERE user_id = 123::bigint

-- Check: Function prevents index use
-- Bad:
WHERE lower(email) = 'alice@example.com'
-- Fix: Create expression index
CREATE INDEX idx_users_email_lower ON app.users (lower(email));

-- Check: Force index use (for testing only)
SET enable_seqscan = off;
EXPLAIN SELECT * FROM app.users WHERE email = 'alice@example.com';
SET enable_seqscan = on;
```

### Issue: Table Bloat

**Symptoms**: Table size much larger than data, slow scans.

```sql
-- Check bloat
SELECT
    schemaname,
    relname,
    n_live_tup,
    n_dead_tup,
    round(100.0 * n_dead_tup / nullif(n_live_tup + n_dead_tup, 0), 2) AS bloat_pct,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 10000
ORDER BY n_dead_tup DESC;
```

**Solutions**:
```sql
-- Regular vacuum
VACUUM app.orders;

-- Full vacuum (rewrites table, requires exclusive lock)
VACUUM FULL app.orders;

-- Alternative: pg_repack (online, no lock)
-- pg_repack -d myapp -t app.orders
```

### Issue: Too Many Connections

**Symptoms**: "too many clients" errors, high memory usage.

```sql
-- Check connections
SELECT count(*), state
FROM pg_stat_activity
GROUP BY state;

-- Check max connections
SHOW max_connections;

-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
    AND query_start < NOW() - INTERVAL '1 hour';
```

**Solutions**:
1. Use connection pooling (PgBouncer)
2. Lower application pool sizes
3. Increase max_connections (requires more memory)

### Issue: Lock Contention

**Symptoms**: Queries waiting, blocked processes.

```sql
-- Find blocking queries
SELECT
    blocked.pid AS blocked_pid,
    blocked.query AS blocked_query,
    blocking.pid AS blocking_pid,
    blocking.query AS blocking_query,
    now() - blocked.query_start AS blocked_duration
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking ON blocking.pid = ANY(pg_blocking_pids(blocked.pid))
WHERE blocked.pid != blocking.pid;

-- Kill blocking query
SELECT pg_cancel_backend(blocking_pid);  -- Graceful
SELECT pg_terminate_backend(blocking_pid);  -- Force
```

**Solutions**:
1. Keep transactions short
2. Use appropriate isolation levels
3. Avoid long-running queries during DDL
4. Use NOWAIT or SKIP LOCKED for queue patterns

---

## Query Optimization Checklist

1. **Check EXPLAIN ANALYZE** - Understand the actual execution plan
2. **Look for Seq Scans** - Add indexes for filtered columns
3. **Check row estimates** - Run ANALYZE if estimates are off
4. **Review join order** - Consider query restructuring
5. **Check for N+1 patterns** - Use JOINs instead of loops
6. **Limit result sets** - Use LIMIT when possible
7. **Consider partial indexes** - For queries with common WHERE clauses
8. **Use covering indexes** - Include columns needed by query
9. **Avoid SELECT *** - Select only needed columns
10. **Batch operations** - Combine multiple queries when possible
