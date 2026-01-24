# Database Component

PostgreSQL database migrations, seeds, and management scripts.

## Prerequisites

- PostgreSQL 14+
- Environment variables: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

## Usage

```bash
npm run migrate   # Run all migrations
npm run seed      # Run all seed files
npm run reset     # Drop, recreate, migrate, and seed
```

## Adding Migrations

Create numbered SQL files in `migrations/`:

```
migrations/
├── 001_initial_schema.sql
├── 002_add_users.sql
└── 003_add_orders.sql
```

Migration files run in alphabetical order. Each migration should:
- Use a transaction (`BEGIN`/`COMMIT`)
- Be idempotent where possible
- Include rollback comments for reference

## Adding Seeds

Create numbered SQL files in `seeds/`:

```
seeds/
├── 001_reference_data.sql
└── 002_test_users.sql
```

Seed files should use `ON CONFLICT` for idempotency:

```sql
INSERT INTO users (id, email) VALUES (1, 'admin@example.com')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
```

## Environment Setup

Set these environment variables before running scripts:

```bash
export PGHOST=localhost
export PGPORT=5432
export PGUSER=app_user
export PGPASSWORD=your_password
export PGDATABASE={{PROJECT_NAME}}
```

Or use a `.env` file with your preferred env loader.

## Reference

See [PostgreSQL Skill](../../../skills/postgresql/SKILL.md) for SQL patterns and best practices.
