-- Seed: 001_seed_data
-- Description: Initial seed data for {{PROJECT_NAME}}
-- Created: {{DATE}}

BEGIN;

SET search_path TO app, public;

-- Use ON CONFLICT for idempotent seeds
-- See: skills/postgresql/references/seed-data.md

-- Example: Reference data
-- INSERT INTO app.status_types (code, name) VALUES
--     ('active', 'Active'),
--     ('inactive', 'Inactive'),
--     ('pending', 'Pending')
-- ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- Example: Test user (development only)
-- INSERT INTO app.users (id, email) VALUES
--     ('00000000-0000-0000-0000-000000000001', 'admin@example.com')
-- ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

-- Add your seed data here

COMMIT;
