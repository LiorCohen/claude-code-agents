# PostgreSQL Permissions Setup

Roles, users, grants, row-level security, and access control.

---

## Initial Setup Checklist

1. Create database
2. Create schema
3. Create roles (groups)
4. Revoke PUBLIC privileges
5. Grant schema usage
6. Set default privileges
7. Create users and assign roles

```sql
-- Complete initial setup
CREATE DATABASE myapp;
\c myapp

-- Create schema
CREATE SCHEMA app;

-- Create roles
CREATE ROLE app_readonly;
CREATE ROLE app_readwrite;
CREATE ROLE app_admin;

-- Revoke default public access
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE myapp FROM PUBLIC;

-- Grant schema usage
GRANT USAGE ON SCHEMA app TO app_readonly, app_readwrite, app_admin;
GRANT CREATE ON SCHEMA app TO app_admin;

-- Grant table permissions
GRANT SELECT ON ALL TABLES IN SCHEMA app TO app_readonly;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO app_readwrite;
GRANT ALL ON ALL TABLES IN SCHEMA app TO app_admin;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA app TO app_readwrite, app_admin;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA app
    GRANT SELECT ON TABLES TO app_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA app
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_readwrite;
ALTER DEFAULT PRIVILEGES IN SCHEMA app
    GRANT ALL ON TABLES TO app_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA app
    GRANT USAGE ON SEQUENCES TO app_readwrite, app_admin;

-- Create users
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT app_readwrite TO app_user;

CREATE USER readonly_user WITH PASSWORD 'secure_password';
GRANT app_readonly TO readonly_user;

-- Set default schema
ALTER ROLE app_user SET search_path TO app, public;
ALTER ROLE readonly_user SET search_path TO app, public;
```

---

## Roles and Users

### CREATE ROLE vs CREATE USER

```sql
-- CREATE ROLE: cannot login by default
CREATE ROLE app_role;

-- CREATE USER: can login by default (same as CREATE ROLE WITH LOGIN)
CREATE USER app_user WITH PASSWORD 'password';

-- Equivalent statements
CREATE ROLE app_user WITH LOGIN PASSWORD 'password';
CREATE USER app_user WITH PASSWORD 'password';
```

### Role Options

```sql
CREATE ROLE developer WITH
    LOGIN                    -- Can connect
    PASSWORD 'secure_pwd'    -- Set password
    CREATEDB                 -- Can create databases
    CREATEROLE              -- Can create other roles
    INHERIT                  -- Inherits privileges from roles
    CONNECTION LIMIT 10      -- Max connections
    VALID UNTIL '2025-01-01'; -- Password expiration
```

| Option | Description |
|--------|-------------|
| `LOGIN` / `NOLOGIN` | Can/cannot connect |
| `SUPERUSER` / `NOSUPERUSER` | Bypass all permission checks |
| `CREATEDB` / `NOCREATEDB` | Can/cannot create databases |
| `CREATEROLE` / `NOCREATEROLE` | Can/cannot create roles |
| `INHERIT` / `NOINHERIT` | Inherit privileges from granted roles |
| `REPLICATION` | Can initiate streaming replication |
| `BYPASSRLS` | Bypass row-level security |
| `CONNECTION LIMIT` | Max simultaneous connections |
| `PASSWORD` | Set password |
| `VALID UNTIL` | Password expiration timestamp |

### ALTER ROLE

```sql
-- Change password
ALTER ROLE app_user WITH PASSWORD 'new_password';

-- Add capabilities
ALTER ROLE app_user WITH CREATEDB;

-- Set configuration parameters
ALTER ROLE app_user SET statement_timeout = '30s';
ALTER ROLE app_user SET search_path TO app, public;

-- Rename role
ALTER ROLE old_name RENAME TO new_name;
```

### DROP ROLE

```sql
-- Drop role (must have no owned objects or privileges)
DROP ROLE app_user;

-- Drop if exists
DROP ROLE IF EXISTS app_user;
```

### Reassign and Drop Owned

Before dropping a role, handle its objects:

```sql
-- Reassign all owned objects to another role
REASSIGN OWNED BY old_role TO new_role;

-- Drop all objects owned by role
DROP OWNED BY old_role;

-- Now drop the role
DROP ROLE old_role;
```

### List Roles

```sql
-- psql command
\du

-- Query
SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin
FROM pg_roles
WHERE rolname NOT LIKE 'pg_%'
ORDER BY rolname;
```

---

## Privileges

### GRANT on Tables

```sql
-- Individual privileges
GRANT SELECT ON app.users TO app_readonly;
GRANT INSERT, UPDATE ON app.users TO app_writer;
GRANT DELETE ON app.users TO app_admin;

-- All privileges
GRANT ALL ON app.users TO app_admin;

-- All tables in schema
GRANT SELECT ON ALL TABLES IN SCHEMA app TO app_readonly;

-- Specific columns
GRANT SELECT (id, name, email) ON app.users TO limited_role;
GRANT UPDATE (name) ON app.users TO limited_role;
```

### GRANT on Schemas

```sql
-- Usage allows access to objects in schema
GRANT USAGE ON SCHEMA app TO app_role;

-- Create allows creating objects in schema
GRANT CREATE ON SCHEMA app TO app_admin;

-- Both
GRANT USAGE, CREATE ON SCHEMA app TO app_admin;
```

### GRANT on Databases

```sql
-- Connect allows connections
GRANT CONNECT ON DATABASE myapp TO app_role;

-- Create allows creating schemas
GRANT CREATE ON DATABASE myapp TO app_admin;

-- Temporary allows creating temp tables
GRANT TEMPORARY ON DATABASE myapp TO app_role;
```

### GRANT on Sequences

```sql
-- Usage allows CURRVAL and NEXTVAL
GRANT USAGE ON SEQUENCE app.users_id_seq TO app_role;

-- Select allows CURRVAL only
GRANT SELECT ON SEQUENCE app.users_id_seq TO app_role;

-- Update allows SETVAL
GRANT UPDATE ON SEQUENCE app.users_id_seq TO app_admin;

-- All sequences in schema
GRANT USAGE ON ALL SEQUENCES IN SCHEMA app TO app_role;
```

### GRANT on Functions

```sql
GRANT EXECUTE ON FUNCTION app.calculate_total(bigint) TO app_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO app_role;
```

### Column-Level Privileges

```sql
-- Grant access to specific columns only
GRANT SELECT (id, name, email) ON app.users TO public_api;
GRANT UPDATE (name, bio) ON app.profiles TO user_role;

-- Useful for hiding sensitive data
-- password_hash, ssn, etc. are not accessible
```

### REVOKE

```sql
-- Revoke specific privilege
REVOKE INSERT ON app.users FROM app_role;

-- Revoke all privileges
REVOKE ALL ON app.users FROM app_role;

-- Revoke from PUBLIC (everyone)
REVOKE ALL ON SCHEMA public FROM PUBLIC;
```

### ALTER DEFAULT PRIVILEGES

Set privileges for objects created in the future:

```sql
-- For current user's future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA app
    GRANT SELECT ON TABLES TO app_readonly;

-- For specific role's future objects
ALTER DEFAULT PRIVILEGES FOR ROLE app_admin IN SCHEMA app
    GRANT SELECT ON TABLES TO app_readonly;

-- For sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA app
    GRANT USAGE ON SEQUENCES TO app_role;

-- For functions
ALTER DEFAULT PRIVILEGES IN SCHEMA app
    GRANT EXECUTE ON FUNCTIONS TO app_role;
```

### Check Privileges

```sql
-- Check table privileges
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'app' AND table_name = 'users';

-- Check column privileges
SELECT grantee, column_name, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'app' AND table_name = 'users';

-- Check schema privileges
SELECT nspname, pg_catalog.array_agg(acl.privilege_type) as privileges
FROM pg_namespace ns
CROSS JOIN LATERAL aclexplode(nspacl) acl
WHERE nspname = 'app'
GROUP BY nspname;

-- Using has_*_privilege functions
SELECT has_table_privilege('app_user', 'app.users', 'SELECT');
SELECT has_schema_privilege('app_user', 'app', 'USAGE');
SELECT has_database_privilege('app_user', 'myapp', 'CONNECT');
```

---

## Row-Level Security (RLS)

### Enable RLS

```sql
-- Enable RLS on table
ALTER TABLE app.posts ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owner
ALTER TABLE app.posts FORCE ROW LEVEL SECURITY;
```

### Create Policies

```sql
-- SELECT policy: users see only their own posts
CREATE POLICY users_see_own_posts ON app.posts
    FOR SELECT
    TO app_user
    USING (user_id = current_user_id());

-- INSERT policy: users can only insert their own posts
CREATE POLICY users_insert_own_posts ON app.posts
    FOR INSERT
    TO app_user
    WITH CHECK (user_id = current_user_id());

-- UPDATE policy: users update only their own posts
CREATE POLICY users_update_own_posts ON app.posts
    FOR UPDATE
    TO app_user
    USING (user_id = current_user_id())
    WITH CHECK (user_id = current_user_id());

-- DELETE policy: users delete only their own posts
CREATE POLICY users_delete_own_posts ON app.posts
    FOR DELETE
    TO app_user
    USING (user_id = current_user_id());

-- ALL operations
CREATE POLICY users_own_posts ON app.posts
    FOR ALL
    TO app_user
    USING (user_id = current_user_id())
    WITH CHECK (user_id = current_user_id());
```

### USING vs WITH CHECK

- **USING**: Filters rows for SELECT, UPDATE (existing rows), DELETE
- **WITH CHECK**: Validates new rows for INSERT, UPDATE (new values)

```sql
-- Users can see published posts OR their own drafts
CREATE POLICY view_posts ON app.posts
    FOR SELECT
    USING (
        status = 'published'
        OR user_id = current_user_id()
    );

-- Users can only create posts with their own user_id
CREATE POLICY create_posts ON app.posts
    FOR INSERT
    WITH CHECK (user_id = current_user_id());
```

### Multi-Tenant RLS

```sql
-- Helper function to get current tenant
CREATE OR REPLACE FUNCTION app.current_tenant_id()
RETURNS bigint AS $$
    SELECT current_setting('app.tenant_id', true)::bigint;
$$ LANGUAGE sql STABLE;

-- Set tenant for session
SET app.tenant_id = '123';

-- Policy using tenant
CREATE POLICY tenant_isolation ON app.data
    FOR ALL
    USING (tenant_id = app.current_tenant_id())
    WITH CHECK (tenant_id = app.current_tenant_id());
```

### Helper Functions

```sql
-- Get current user's ID from session variable
CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS bigint AS $$
    SELECT NULLIF(current_setting('app.user_id', true), '')::bigint;
$$ LANGUAGE sql STABLE;

-- Set user for session
SET app.user_id = '456';

-- Use in policy
CREATE POLICY user_data ON app.user_data
    FOR ALL
    USING (user_id = app.current_user_id());
```

### Admin Bypass

```sql
-- Policy that allows admins to see everything
CREATE POLICY admin_all ON app.posts
    FOR ALL
    TO app_admin
    USING (true)
    WITH CHECK (true);
```

### Drop Policy

```sql
DROP POLICY users_see_own_posts ON app.posts;
DROP POLICY IF EXISTS old_policy ON app.posts;
```

### List Policies

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'app';
```

---

## Connection Security

### pg_hba.conf Patterns

```
# TYPE  DATABASE    USER        ADDRESS         METHOD

# Local connections
local   all         postgres                    peer
local   all         all                         md5

# IPv4 local connections
host    all         all         127.0.0.1/32    scram-sha-256
host    myapp       app_user    10.0.0.0/8      scram-sha-256

# IPv6 local connections
host    all         all         ::1/128         scram-sha-256

# Require SSL for remote connections
hostssl myapp       all         0.0.0.0/0       scram-sha-256

# Reject all other connections
host    all         all         0.0.0.0/0       reject
```

### Authentication Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| `trust` | No authentication | Local development only |
| `peer` | OS username must match | Local Unix socket |
| `md5` | MD5 password hash | Legacy, avoid |
| `scram-sha-256` | SCRAM authentication | Recommended |
| `password` | Plain text | Never use |
| `cert` | SSL certificate | High security |
| `reject` | Always reject | Block unwanted |

### SSL Configuration

```sql
-- Check if SSL is enabled
SHOW ssl;

-- Check connection encryption
SELECT pg_ssl.pid, pg_ssl.ssl, pg_ssl.version
FROM pg_stat_ssl pg_ssl
JOIN pg_stat_activity pg_act ON pg_ssl.pid = pg_act.pid;
```

### Connection Limits

```sql
-- Set max connections for role
ALTER ROLE app_user CONNECTION LIMIT 10;

-- Check current connections by user
SELECT usename, count(*)
FROM pg_stat_activity
GROUP BY usename;
```

---

## Common Permission Patterns

### Read-Only User

```sql
CREATE ROLE readonly_role;
GRANT CONNECT ON DATABASE myapp TO readonly_role;
GRANT USAGE ON SCHEMA app TO readonly_role;
GRANT SELECT ON ALL TABLES IN SCHEMA app TO readonly_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT SELECT ON TABLES TO readonly_role;

CREATE USER readonly_user WITH PASSWORD 'password';
GRANT readonly_role TO readonly_user;
```

### Application User

```sql
CREATE ROLE app_role;
GRANT CONNECT ON DATABASE myapp TO app_role;
GRANT USAGE ON SCHEMA app TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO app_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA app TO app_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA app
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA app
    GRANT USAGE ON SEQUENCES TO app_role;

CREATE USER app_user WITH PASSWORD 'password';
GRANT app_role TO app_user;
```

### Admin User

```sql
CREATE ROLE admin_role;
GRANT CONNECT ON DATABASE myapp TO admin_role;
GRANT ALL ON SCHEMA app TO admin_role;
GRANT ALL ON ALL TABLES IN SCHEMA app TO admin_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA app TO admin_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA app TO admin_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT ALL ON TABLES TO admin_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT ALL ON SEQUENCES TO admin_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT ALL ON FUNCTIONS TO admin_role;

CREATE USER admin_user WITH PASSWORD 'password' CREATEROLE;
GRANT admin_role TO admin_user;
```

### Backup User

```sql
-- PostgreSQL 14+ has built-in roles
CREATE USER backup_user WITH PASSWORD 'password';
GRANT pg_read_all_data TO backup_user;  -- Read all tables
GRANT pg_read_all_stats TO backup_user; -- Read statistics

-- Or manually for older versions
CREATE ROLE backup_role;
GRANT CONNECT ON DATABASE myapp TO backup_role;
GRANT USAGE ON SCHEMA app TO backup_role;
GRANT SELECT ON ALL TABLES IN SCHEMA app TO backup_role;
```

---

## Auditing Privileges

### Privilege Audit Query

```sql
-- All table privileges in schema
SELECT
    grantee,
    table_schema,
    table_name,
    array_agg(privilege_type ORDER BY privilege_type) as privileges
FROM information_schema.table_privileges
WHERE table_schema = 'app'
GROUP BY grantee, table_schema, table_name
ORDER BY grantee, table_name;
```

### Role Membership

```sql
SELECT
    r.rolname as role,
    m.rolname as member
FROM pg_auth_members am
JOIN pg_roles r ON am.roleid = r.oid
JOIN pg_roles m ON am.member = m.oid
ORDER BY role, member;
```

### Effective Permissions

```sql
-- What can a user do on a table?
SELECT
    'users' as table_name,
    has_table_privilege('app_user', 'app.users', 'SELECT') as can_select,
    has_table_privilege('app_user', 'app.users', 'INSERT') as can_insert,
    has_table_privilege('app_user', 'app.users', 'UPDATE') as can_update,
    has_table_privilege('app_user', 'app.users', 'DELETE') as can_delete;
```

---

## Security Best Practices

1. **Use roles, not individual grants**: Create roles for permission sets, grant roles to users

2. **Revoke PUBLIC privileges**: Remove default PUBLIC access from schemas and databases

3. **Use SCRAM-SHA-256**: Prefer over MD5 for password authentication

4. **Require SSL for remote**: Use `hostssl` in pg_hba.conf for non-local connections

5. **Apply least privilege**: Grant minimum permissions needed for each role

6. **Use separate roles per application**: Don't share credentials between apps

7. **Set connection limits**: Prevent single role from consuming all connections

8. **Use RLS for multi-tenant**: Row-level security for data isolation

9. **Audit regularly**: Review privileges and role memberships

10. **Never use superuser for apps**: Reserve superuser for administration only
