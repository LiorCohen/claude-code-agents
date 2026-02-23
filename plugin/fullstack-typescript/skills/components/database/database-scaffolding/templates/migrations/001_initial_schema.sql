-- Migration: 001_initial_schema
-- Description: Initial database schema for {{PROJECT_NAME}}
-- Created: {{DATE}}

BEGIN;

-- Create application schema
CREATE SCHEMA IF NOT EXISTS app;

-- Set search path for this session
SET search_path TO app, public;

-- Example table structure (customize for your domain)
-- See: skills/postgresql/references/schema-management.md

-- CREATE TABLE app.users (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     email TEXT UNIQUE NOT NULL,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- CREATE TABLE app.audit_log (
--     id BIGSERIAL PRIMARY KEY,
--     table_name TEXT NOT NULL,
--     record_id UUID NOT NULL,
--     action TEXT NOT NULL,
--     changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     changed_by UUID REFERENCES app.users(id)
-- );

-- Add your initial schema here

COMMIT;
