# PostgreSQL System Views

Monitoring views, statistics, and diagnostic queries.

---

## Version Compatibility

| View / Column | Minimum Version |
|---------------|-----------------|
| `pg_stat_activity` | 8.1+ |
| `pg_stat_activity.wait_event_type` | 9.6+ |
| `pg_blocking_pids()` | 9.6+ |
| `pg_stat_progress_vacuum` | 9.6+ |
| `pg_stat_progress_create_index` | 12+ |
| `pg_stat_progress_analyze` | 13+ |
| `pg_stat_wal` | 14+ |
| `pg_stat_checkpointer` | 17+ |

---

## pg_stat_activity

Active sessions and queries.

### Key Columns

| Column | Description |
|--------|-------------|
| `pid` | Process ID |
| `usename` | Username |
| `datname` | Database name |
| `application_name` | Client application name |
| `client_addr` | Client IP address |
| `backend_start` | When session started |
| `xact_start` | Current transaction start |
| `query_start` | Current query start |
| `state` | Current state |
| `wait_event_type` | Wait event category |
| `wait_event` | Specific wait event |
| `query` | Current/last query text |

### States

| State | Description |
|-------|-------------|
| `active` | Executing query |
| `idle` | Waiting for command |
| `idle in transaction` | In transaction, waiting |
| `idle in transaction (aborted)` | Transaction failed, waiting |
| `fastpath function call` | Executing fast-path function |
| `disabled` | track_activities disabled |

### Active Queries with Duration

```sql
SELECT
    pid,
    usename,
    datname,
    application_name,
    client_addr,
    now() - query_start AS duration,
    state,
    query
FROM pg_stat_activity
WHERE state = 'active'
    AND query NOT ILIKE '%pg_stat_activity%'
ORDER BY duration DESC;
```

### Idle in Transaction

```sql
SELECT
    pid,
    usename,
    now() - xact_start AS transaction_duration,
    now() - query_start AS idle_duration,
    query
FROM pg_stat_activity
WHERE state = 'idle in transaction'
    AND now() - xact_start > interval '5 minutes';
```

### Wait Events

```sql
SELECT
    pid,
    wait_event_type,
    wait_event,
    state,
    query
FROM pg_stat_activity
WHERE wait_event IS NOT NULL
    AND state = 'active';
```

### Connections by Application

```sql
SELECT
    application_name,
    state,
    count(*) AS connections
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY application_name, state
ORDER BY connections DESC;
```

---

## pg_stat_user_tables

Table access and modification statistics.

### Key Columns

| Column | Description |
|--------|-------------|
| `schemaname` | Schema name |
| `relname` | Table name |
| `seq_scan` | Sequential scans initiated |
| `seq_tup_read` | Rows fetched by sequential scans |
| `idx_scan` | Index scans initiated |
| `idx_tup_fetch` | Rows fetched by index scans |
| `n_tup_ins` | Rows inserted |
| `n_tup_upd` | Rows updated |
| `n_tup_del` | Rows deleted |
| `n_live_tup` | Estimated live rows |
| `n_dead_tup` | Estimated dead rows |
| `last_vacuum` | Last manual vacuum |
| `last_autovacuum` | Last autovacuum |
| `last_analyze` | Last manual analyze |
| `last_autoanalyze` | Last autoanalyze |

### Tables with Poor Index Usage

```sql
SELECT
    schemaname,
    relname,
    seq_scan,
    idx_scan,
    CASE
        WHEN seq_scan + idx_scan > 0
        THEN round(100.0 * seq_scan / (seq_scan + idx_scan), 2)
        ELSE 0
    END AS seq_scan_pct,
    n_live_tup
FROM pg_stat_user_tables
WHERE n_live_tup > 10000
    AND seq_scan > idx_scan
ORDER BY seq_scan DESC
LIMIT 20;
```

### Tables with High Dead Tuple Ratio

```sql
SELECT
    schemaname,
    relname,
    n_live_tup,
    n_dead_tup,
    CASE
        WHEN n_live_tup > 0
        THEN round(100.0 * n_dead_tup / n_live_tup, 2)
        ELSE 0
    END AS dead_pct,
    last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC
LIMIT 20;
```

### HOT Update Efficiency

```sql
SELECT
    schemaname,
    relname,
    n_tup_upd,
    n_tup_hot_upd,
    CASE
        WHEN n_tup_upd > 0
        THEN round(100.0 * n_tup_hot_upd / n_tup_upd, 2)
        ELSE 0
    END AS hot_update_pct
FROM pg_stat_user_tables
WHERE n_tup_upd > 1000
ORDER BY n_tup_upd DESC;
```

---

## pg_stat_user_indexes

Index usage statistics.

### Key Columns

| Column | Description |
|--------|-------------|
| `indexrelname` | Index name |
| `idx_scan` | Index scans initiated |
| `idx_tup_read` | Index entries returned |
| `idx_tup_fetch` | Table rows fetched |

### Unused Indexes

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
    AND indexrelname NOT LIKE '%_unique'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Most Used Indexes

```sql
SELECT
    schemaname,
    relname AS table_name,
    indexrelname AS index_name,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 20;
```

### Index Efficiency

```sql
SELECT
    indexrelname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    CASE
        WHEN idx_tup_read > 0
        THEN round(100.0 * idx_tup_fetch / idx_tup_read, 2)
        ELSE 0
    END AS fetch_pct
FROM pg_stat_user_indexes
WHERE idx_scan > 100
ORDER BY fetch_pct ASC
LIMIT 20;
```

---

## pg_statio_user_tables / pg_statio_user_indexes

I/O statistics for cache analysis.

### Cache Hit Ratio (Tables)

```sql
SELECT
    schemaname,
    relname,
    heap_blks_read,
    heap_blks_hit,
    CASE
        WHEN heap_blks_hit + heap_blks_read > 0
        THEN round(100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read), 2)
        ELSE 100
    END AS cache_hit_pct
FROM pg_statio_user_tables
WHERE heap_blks_read + heap_blks_hit > 1000
ORDER BY cache_hit_pct ASC
LIMIT 20;
```

### Cache Hit Ratio (Indexes)

```sql
SELECT
    schemaname,
    indexrelname,
    idx_blks_read,
    idx_blks_hit,
    CASE
        WHEN idx_blks_hit + idx_blks_read > 0
        THEN round(100.0 * idx_blks_hit / (idx_blks_hit + idx_blks_read), 2)
        ELSE 100
    END AS cache_hit_pct
FROM pg_statio_user_indexes
WHERE idx_blks_read + idx_blks_hit > 100
ORDER BY cache_hit_pct ASC
LIMIT 20;
```

### Overall Cache Hit Ratio

```sql
SELECT
    sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) AS table_cache_hit_ratio,
    sum(idx_blks_hit) / nullif(sum(idx_blks_hit) + sum(idx_blks_read), 0) AS index_cache_hit_ratio
FROM pg_statio_user_tables;
```

Target: > 0.99 (99% cache hit ratio)

---

## pg_stat_replication

Replication monitoring (primary server).

### Key Columns

| Column | Description |
|--------|-------------|
| `pid` | WAL sender process ID |
| `usename` | Replication user |
| `application_name` | Standby name |
| `client_addr` | Standby address |
| `state` | Streaming state |
| `sent_lsn` | Last WAL position sent |
| `write_lsn` | Last WAL position written |
| `flush_lsn` | Last WAL position flushed |
| `replay_lsn` | Last WAL position replayed |
| `sync_state` | Sync state (async/sync) |

### Replication Lag

```sql
SELECT
    application_name,
    client_addr,
    state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    pg_wal_lsn_diff(sent_lsn, replay_lsn) AS replay_lag_bytes,
    pg_size_pretty(pg_wal_lsn_diff(sent_lsn, replay_lsn)) AS replay_lag
FROM pg_stat_replication;
```

---

## pg_stat_bgwriter

Background writer and checkpoint statistics.

### Key Columns

| Column | Description |
|--------|-------------|
| `checkpoints_timed` | Scheduled checkpoints |
| `checkpoints_req` | Requested checkpoints |
| `checkpoint_write_time` | Time writing checkpoint files |
| `checkpoint_sync_time` | Time syncing checkpoint files |
| `buffers_checkpoint` | Buffers written by checkpoints |
| `buffers_clean` | Buffers written by background writer |
| `buffers_backend` | Buffers written by backends |
| `buffers_alloc` | Buffers allocated |

### Checkpoint Analysis

```sql
SELECT
    checkpoints_timed,
    checkpoints_req,
    round(100.0 * checkpoints_req / nullif(checkpoints_timed + checkpoints_req, 0), 2) AS pct_requested,
    buffers_checkpoint,
    buffers_clean,
    buffers_backend,
    round(100.0 * buffers_backend / nullif(buffers_checkpoint + buffers_clean + buffers_backend, 0), 2) AS pct_backend_writes
FROM pg_stat_bgwriter;
```

High `pct_backend_writes` indicates backends are doing too much I/O (tune bgwriter/checkpointer).

---

## pg_stat_wal (PostgreSQL 14+)

WAL generation statistics.

```sql
SELECT
    wal_records,
    wal_fpi,
    wal_bytes,
    pg_size_pretty(wal_bytes) AS wal_size,
    wal_buffers_full,
    stats_reset
FROM pg_stat_wal;
```

---

## pg_stat_database

Database-wide statistics.

### Key Columns

| Column | Description |
|--------|-------------|
| `numbackends` | Active connections |
| `xact_commit` | Committed transactions |
| `xact_rollback` | Rolled back transactions |
| `blks_read` | Disk blocks read |
| `blks_hit` | Buffer cache hits |
| `tup_returned` | Rows returned by queries |
| `tup_fetched` | Rows fetched by queries |
| `tup_inserted` | Rows inserted |
| `tup_updated` | Rows updated |
| `tup_deleted` | Rows deleted |
| `conflicts` | Recovery conflicts |
| `temp_files` | Temp files created |
| `temp_bytes` | Temp file bytes |
| `deadlocks` | Deadlocks detected |

### Database Health Overview

```sql
SELECT
    datname,
    numbackends AS connections,
    xact_commit AS commits,
    xact_rollback AS rollbacks,
    round(100.0 * blks_hit / nullif(blks_hit + blks_read, 0), 2) AS cache_hit_pct,
    temp_files,
    pg_size_pretty(temp_bytes) AS temp_size,
    deadlocks,
    conflicts
FROM pg_stat_database
WHERE datname = current_database();
```

---

## pg_locks

Lock information and blocking analysis.

### Lock Types

| Type | Description |
|------|-------------|
| `relation` | Table lock |
| `tuple` | Row lock |
| `transactionid` | Transaction ID lock |
| `virtualxid` | Virtual transaction ID lock |
| `advisory` | Advisory lock |

### Lock Modes (from weakest to strongest)

| Mode | Conflicts With |
|------|----------------|
| `AccessShareLock` | AccessExclusiveLock |
| `RowShareLock` | ExclusiveLock, AccessExclusiveLock |
| `RowExclusiveLock` | ShareLock, ShareRowExclusiveLock, ExclusiveLock, AccessExclusiveLock |
| `ShareUpdateExclusiveLock` | ShareUpdateExclusiveLock, ShareLock, ShareRowExclusiveLock, ExclusiveLock, AccessExclusiveLock |
| `ShareLock` | RowExclusiveLock, ShareUpdateExclusiveLock, ShareRowExclusiveLock, ExclusiveLock, AccessExclusiveLock |
| `ShareRowExclusiveLock` | RowExclusiveLock, ShareUpdateExclusiveLock, ShareLock, ShareRowExclusiveLock, ExclusiveLock, AccessExclusiveLock |
| `ExclusiveLock` | RowShareLock, RowExclusiveLock, ShareUpdateExclusiveLock, ShareLock, ShareRowExclusiveLock, ExclusiveLock, AccessExclusiveLock |
| `AccessExclusiveLock` | All lock modes |

### Find Blocking Queries

```sql
SELECT
    blocked.pid AS blocked_pid,
    blocked.usename AS blocked_user,
    now() - blocked.query_start AS blocked_duration,
    blocked.query AS blocked_query,
    blocking.pid AS blocking_pid,
    blocking.usename AS blocking_user,
    now() - blocking.query_start AS blocking_duration,
    blocking.query AS blocking_query
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking ON blocking.pid = ANY(pg_blocking_pids(blocked.pid))
WHERE blocked.pid != blocking.pid;
```

### Lock Summary

```sql
SELECT
    locktype,
    mode,
    granted,
    count(*) AS lock_count
FROM pg_locks
GROUP BY locktype, mode, granted
ORDER BY lock_count DESC;
```

### Detailed Lock Information

```sql
SELECT
    l.pid,
    a.usename,
    l.locktype,
    l.relation::regclass AS relation,
    l.mode,
    l.granted,
    a.query
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE NOT l.granted
ORDER BY a.query_start;
```

---

## Progress Views

### pg_stat_progress_vacuum

```sql
SELECT
    pid,
    datname,
    relid::regclass AS table_name,
    phase,
    heap_blks_total,
    heap_blks_scanned,
    heap_blks_vacuumed,
    CASE
        WHEN heap_blks_total > 0
        THEN round(100.0 * heap_blks_vacuumed / heap_blks_total, 2)
        ELSE 0
    END AS pct_complete
FROM pg_stat_progress_vacuum;
```

### pg_stat_progress_create_index (PostgreSQL 12+)

```sql
SELECT
    pid,
    datname,
    relid::regclass AS table_name,
    index_relid::regclass AS index_name,
    phase,
    blocks_total,
    blocks_done,
    CASE
        WHEN blocks_total > 0
        THEN round(100.0 * blocks_done / blocks_total, 2)
        ELSE 0
    END AS pct_complete
FROM pg_stat_progress_create_index;
```

### pg_stat_progress_analyze (PostgreSQL 13+)

```sql
SELECT
    pid,
    datname,
    relid::regclass AS table_name,
    phase,
    sample_blks_total,
    sample_blks_scanned,
    CASE
        WHEN sample_blks_total > 0
        THEN round(100.0 * sample_blks_scanned / sample_blks_total, 2)
        ELSE 0
    END AS pct_complete
FROM pg_stat_progress_analyze;
```

---

## Statistics Maintenance

### Reset Statistics

```sql
-- Reset all statistics for current database
SELECT pg_stat_reset();

-- Reset statistics for specific table
SELECT pg_stat_reset_single_table_counters('app.users'::regclass);

-- Reset bgwriter statistics
SELECT pg_stat_reset_shared('bgwriter');
```

### Statistics Configuration

```sql
-- Check current settings
SHOW track_activities;      -- Track query activity
SHOW track_counts;          -- Track table/index statistics
SHOW track_io_timing;       -- Track I/O timing (requires EXPLAIN BUFFERS)
SHOW track_functions;       -- Track function statistics

-- Enable I/O timing (requires restart or superuser)
ALTER SYSTEM SET track_io_timing = on;
SELECT pg_reload_conf();
```

---

## Quick Diagnostics

### Database Overview

```sql
SELECT
    'Database Size' AS metric,
    pg_size_pretty(pg_database_size(current_database())) AS value
UNION ALL
SELECT
    'Active Connections',
    count(*)::text
FROM pg_stat_activity
WHERE state = 'active'
UNION ALL
SELECT
    'Cache Hit Ratio',
    round(100.0 * sum(blks_hit) / nullif(sum(blks_hit) + sum(blks_read), 0), 2)::text || '%'
FROM pg_stat_database
WHERE datname = current_database()
UNION ALL
SELECT
    'Deadlocks (since reset)',
    deadlocks::text
FROM pg_stat_database
WHERE datname = current_database();
```

### Active Session Summary

```sql
SELECT
    state,
    count(*) AS count,
    max(now() - query_start) AS max_duration
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state
ORDER BY count DESC;
```
