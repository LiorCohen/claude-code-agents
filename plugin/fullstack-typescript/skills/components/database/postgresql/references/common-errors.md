# PostgreSQL Common Errors

Error messages, causes, and solutions.

---

## Connection Errors

### FATAL: password authentication failed for user "username"

**Cause**: Wrong password or user doesn't exist.

**Solutions**:
```sql
-- Check if user exists
SELECT usename FROM pg_user WHERE usename = 'username';

-- Reset password
ALTER USER username WITH PASSWORD 'new_password';

-- Create user if missing
CREATE USER username WITH PASSWORD 'password';
```

### FATAL: no pg_hba.conf entry for host "x.x.x.x", user "username", database "dbname"

**Cause**: Connection not allowed by pg_hba.conf.

**Solutions**:
```bash
# Find pg_hba.conf location
psql -c "SHOW hba_file;"

# Add entry to pg_hba.conf
# TYPE  DATABASE    USER        ADDRESS         METHOD
host    myapp       app_user    192.168.1.0/24  scram-sha-256

# Reload configuration
SELECT pg_reload_conf();
# Or: pg_ctl reload
```

### could not connect to server: Connection refused

**Cause**: PostgreSQL not running or wrong host/port.

**Solutions**:
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Check port binding
netstat -an | grep 5432

# Start PostgreSQL
# Linux: sudo systemctl start postgresql
# macOS: brew services start postgresql
# Docker: docker start postgres
```

### FATAL: sorry, too many clients already

**Cause**: Connection limit reached.

**Solutions**:
```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Check limit
SHOW max_connections;

-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
    AND query_start < NOW() - INTERVAL '5 minutes';

-- Increase limit (requires restart)
ALTER SYSTEM SET max_connections = 200;
```

**Better solution**: Use connection pooling (PgBouncer).

### SSL connection has been closed unexpectedly / SSL SYSCALL error

**Cause**: SSL configuration mismatch or network issues.

**Solutions**:
```bash
# Try without SSL
psql "postgresql://user:pass@host/db?sslmode=disable"

# Or require SSL
psql "postgresql://user:pass@host/db?sslmode=require"

# Check server SSL config
SHOW ssl;
```

---

## Query Errors

### ERROR: relation "tablename" does not exist

**Cause**: Table doesn't exist or wrong schema.

**Solutions**:
```sql
-- Check schema search path
SHOW search_path;

-- List tables in all schemas
SELECT schemaname, tablename FROM pg_tables WHERE tablename = 'users';

-- Use fully qualified name
SELECT * FROM app.users;

-- Or set search path
SET search_path TO app, public;
```

### ERROR: column "columnname" does not exist

**Cause**: Column doesn't exist or typo in column name.

**Solutions**:
```sql
-- Check actual column names
\d app.users

-- Column names are case-sensitive if quoted
SELECT "Email" FROM app.users;  -- Requires exact case
SELECT email FROM app.users;    -- Case-insensitive
```

### ERROR: syntax error at or near "..."

**Cause**: SQL syntax error.

**Common issues**:
```sql
-- Missing comma
SELECT id name FROM users;  -- Wrong
SELECT id, name FROM users; -- Correct

-- Reserved word as identifier
SELECT user FROM users;     -- 'user' is reserved
SELECT "user" FROM users;   -- Quote it

-- Missing quotes
WHERE name = Alice;         -- Wrong
WHERE name = 'Alice';       -- Correct

-- Wrong string quotes
WHERE name = "Alice";       -- Wrong (double quotes are for identifiers)
WHERE name = 'Alice';       -- Correct
```

### ERROR: division by zero

**Cause**: Dividing by zero.

**Solutions**:
```sql
-- Use NULLIF to avoid division by zero
SELECT total / NULLIF(count, 0) AS average FROM stats;

-- Or use CASE
SELECT
    CASE WHEN count = 0 THEN 0
    ELSE total / count
    END AS average
FROM stats;
```

### ERROR: operator does not exist: character varying = integer

**Cause**: Type mismatch in comparison.

**Solutions**:
```sql
-- Cast to correct type
WHERE user_id = '123'::integer;
WHERE user_id = 123;  -- Use correct type

-- Check column type
\d app.users
```

---

## Constraint Violations

### ERROR: duplicate key value violates unique constraint "..."

**Cause**: Inserting duplicate value in unique column.

**Solutions**:
```sql
-- Use ON CONFLICT to handle duplicates
INSERT INTO app.users (email, name)
VALUES ('alice@example.com', 'Alice')
ON CONFLICT (email) DO NOTHING;

-- Or update on conflict
INSERT INTO app.users (email, name)
VALUES ('alice@example.com', 'Alice Updated')
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

-- Check existing value
SELECT * FROM app.users WHERE email = 'alice@example.com';
```

### ERROR: insert or update on table "..." violates foreign key constraint "..."

**Cause**: Referenced row doesn't exist.

**Solutions**:
```sql
-- Check if parent exists
SELECT * FROM app.users WHERE id = 123;

-- Insert parent first
INSERT INTO app.users (id, email, name) VALUES (123, 'alice@example.com', 'Alice');

-- Then insert child
INSERT INTO app.orders (user_id, total) VALUES (123, 99.99);

-- Or disable FK temporarily (use with caution)
SET session_replication_role = 'replica';
-- ... do inserts ...
SET session_replication_role = 'origin';
```

### ERROR: null value in column "..." violates not-null constraint

**Cause**: Inserting NULL into NOT NULL column.

**Solutions**:
```sql
-- Provide a value
INSERT INTO app.users (email, name) VALUES ('alice@example.com', 'Alice');

-- Or add default value to column
ALTER TABLE app.users ALTER COLUMN name SET DEFAULT 'Unknown';

-- Or make column nullable
ALTER TABLE app.users ALTER COLUMN name DROP NOT NULL;
```

### ERROR: new row for relation "..." violates check constraint "..."

**Cause**: Value doesn't satisfy CHECK constraint.

**Solutions**:
```sql
-- Check the constraint definition
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'app.orders'::regclass;

-- Provide valid value
INSERT INTO app.orders (total) VALUES (99.99);  -- total >= 0

-- Or modify constraint (requires dropping and recreating)
ALTER TABLE app.orders DROP CONSTRAINT chk_orders_total;
ALTER TABLE app.orders ADD CONSTRAINT chk_orders_total CHECK (total >= -100);
```

---

## Permission Errors

### ERROR: permission denied for table "..."

**Cause**: User lacks required privileges.

**Solutions**:
```sql
-- Grant needed permissions
GRANT SELECT ON app.users TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON app.users TO app_role;

-- Grant on all tables in schema
GRANT SELECT ON ALL TABLES IN SCHEMA app TO app_readonly;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA app
    GRANT SELECT ON TABLES TO app_readonly;
```

### ERROR: permission denied for schema "..."

**Cause**: User lacks USAGE on schema.

**Solutions**:
```sql
-- Grant schema usage
GRANT USAGE ON SCHEMA app TO app_user;

-- Also grant CREATE if needed
GRANT USAGE, CREATE ON SCHEMA app TO app_admin;
```

### ERROR: must be owner of table "..."

**Cause**: Operation requires ownership (like ALTER TABLE).

**Solutions**:
```sql
-- Change owner
ALTER TABLE app.users OWNER TO app_admin;

-- Or grant role membership
GRANT app_admin TO app_user;
```

---

## Resource Errors

### ERROR: out of memory

**Cause**: Query requires more memory than available.

**Solutions**:
```sql
-- Reduce work_mem for this query
SET work_mem = '64MB';

-- Add LIMIT to reduce result size
SELECT * FROM app.large_table LIMIT 1000;

-- Use cursors for large result sets
DECLARE my_cursor CURSOR FOR SELECT * FROM app.large_table;
FETCH 100 FROM my_cursor;

-- Check current settings
SHOW work_mem;
SHOW maintenance_work_mem;
```

### ERROR: could not extend file "...": No space left on device

**Cause**: Disk full.

**Solutions**:
```bash
# Check disk usage
df -h

# Check database size
psql -c "SELECT pg_size_pretty(pg_database_size('myapp'));"

# Clean up
# - Remove old WAL files
# - VACUUM FULL large tables
# - Delete unused data
# - Add disk space
```

### ERROR: canceling statement due to statement timeout

**Cause**: Query exceeded statement_timeout.

**Solutions**:
```sql
-- Check current timeout
SHOW statement_timeout;

-- Increase timeout for session
SET statement_timeout = '5min';

-- Increase timeout for specific query
SET LOCAL statement_timeout = '10min';
SELECT * FROM app.large_table;
RESET statement_timeout;

-- Optimize query instead (better solution)
EXPLAIN ANALYZE SELECT * FROM app.large_table WHERE ...;
```

---

## Data Type Errors

### ERROR: invalid input syntax for type integer: "abc"

**Cause**: Can't convert string to integer.

**Solutions**:
```sql
-- Check data before casting
SELECT * FROM app.data WHERE NOT value ~ '^\d+$';

-- Use safe conversion
SELECT
    CASE WHEN value ~ '^\d+$' THEN value::integer
    ELSE NULL
    END AS safe_value
FROM app.data;

-- Or use NULLIF for empty strings
SELECT NULLIF(value, '')::integer FROM app.data;
```

### ERROR: date/time field value out of range: "..."

**Cause**: Invalid date format or value.

**Solutions**:
```sql
-- Check date style
SHOW datestyle;

-- Set expected format
SET datestyle = 'ISO, MDY';  -- YYYY-MM-DD, MM/DD/YYYY
SET datestyle = 'ISO, DMY';  -- YYYY-MM-DD, DD/MM/YYYY

-- Use explicit format
SELECT to_date('31/12/2024', 'DD/MM/YYYY');
SELECT to_timestamp('2024-12-31 23:59:59', 'YYYY-MM-DD HH24:MI:SS');
```

### ERROR: value too long for type character varying(...)

**Cause**: String exceeds column length limit.

**Solutions**:
```sql
-- Check column definition
\d app.users

-- Truncate data
INSERT INTO app.users (name) VALUES (substring('Very long name...' FOR 100));

-- Or increase column size
ALTER TABLE app.users ALTER COLUMN name TYPE VARCHAR(200);
```

---

## Transaction Errors

### ERROR: current transaction is aborted, commands ignored until end of transaction block

**Cause**: Previous command in transaction failed, transaction must be rolled back.

**Solutions**:
```sql
-- Rollback the transaction
ROLLBACK;

-- Then start fresh
BEGIN;
-- ... your commands ...
COMMIT;
```

### ERROR: deadlock detected

**Cause**: Two transactions waiting for each other's locks.

**Solutions**:
```sql
-- PostgreSQL automatically aborts one transaction
-- Retry the aborted transaction

-- Prevention strategies:
-- 1. Access tables in consistent order
-- 2. Keep transactions short
-- 3. Use NOWAIT or SKIP LOCKED for queue patterns

-- Example with NOWAIT
SELECT * FROM app.tasks WHERE status = 'pending' FOR UPDATE NOWAIT;
-- Fails immediately if row is locked

-- Example with SKIP LOCKED
SELECT * FROM app.tasks WHERE status = 'pending'
FOR UPDATE SKIP LOCKED LIMIT 1;
-- Skips locked rows, returns unlocked ones
```

### ERROR: could not serialize access due to concurrent update

**Cause**: Serializable isolation conflict.

**Solutions**:
```sql
-- Retry the transaction
-- Application code should handle serialization failures

-- Or use lower isolation level if acceptable
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
-- ... commands ...
COMMIT;
```

---

## psql-Specific Issues

### Password: (prompt hangs or fails)

**Cause**: psql waiting for password interactively.

**Solutions**:
```bash
# Use PGPASSWORD environment variable
PGPASSWORD=secret psql -h localhost -U app -d myapp

# Or use .pgpass file
# ~/.pgpass format: hostname:port:database:username:password
echo "localhost:5432:myapp:app:secret" >> ~/.pgpass
chmod 600 ~/.pgpass

# Or use connection string
psql "postgresql://app:secret@localhost:5432/myapp"
```

### \copy: could not open file "...": Permission denied

**Cause**: psql can't read/write the file.

**Solutions**:
```bash
# Check file permissions
ls -la data.csv

# Use absolute path
\copy app.users FROM '/home/user/data.csv' WITH (FORMAT csv);

# Check directory permissions
ls -la /home/user/

# Run from directory with correct permissions
cd /home/user && psql -d myapp
```

### psql: command not found

**Cause**: psql not in PATH.

**Solutions**:
```bash
# Find psql location
which psql
find /usr -name "psql" 2>/dev/null

# Add to PATH (example for PostgreSQL 16)
export PATH="/usr/lib/postgresql/16/bin:$PATH"

# Or use full path
/usr/lib/postgresql/16/bin/psql -d myapp

# macOS with Homebrew
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
```

---

## Quick Troubleshooting

### Check Server Status

```bash
# Is PostgreSQL running?
pg_isready -h localhost -p 5432

# Check logs
# Linux: /var/log/postgresql/
# macOS: /usr/local/var/log/postgres.log
# Docker: docker logs postgres
```

### Check Current Connections

```sql
SELECT pid, usename, datname, state, query
FROM pg_stat_activity
WHERE datname = current_database();
```

### Check Locks

```sql
SELECT
    blocked.pid AS blocked_pid,
    blocking.pid AS blocking_pid,
    blocked.query AS blocked_query
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking ON blocking.pid = ANY(pg_blocking_pids(blocked.pid));
```

### Kill a Query

```sql
-- Graceful cancel
SELECT pg_cancel_backend(pid);

-- Force terminate
SELECT pg_terminate_backend(pid);
```
