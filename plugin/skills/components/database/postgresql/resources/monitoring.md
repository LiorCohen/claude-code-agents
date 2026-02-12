# Monitoring

Performance analysis and system monitoring queries.

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
