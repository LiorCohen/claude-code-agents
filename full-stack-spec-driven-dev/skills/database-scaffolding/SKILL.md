---
name: database-scaffolding
description: Scaffolds PostgreSQL database component with migrations, seeds, and management scripts.
---

# Database Scaffolding Skill

Creates database component structure for PostgreSQL-based projects.

## What It Creates

```
components/database/
├── package.json              # npm scripts for database operations
├── README.md                 # Component documentation
├── migrations/
│   └── 001_initial_schema.sql
├── seeds/
│   └── 001_seed_data.sql
└── scripts/
    ├── migrate.sh            # Run all migrations
    ├── seed.sh               # Run all seed files
    └── reset.sh              # Drop, recreate, migrate, seed
```

## Template Variables

| Variable | Description |
|----------|-------------|
| `{{PROJECT_NAME}}` | Project name for naming and comments |

## When to Use

Use when your project needs:
- PostgreSQL database with version-controlled schema
- Migration-based schema management
- Seed data for development/testing
- Scripts for database lifecycle management

## Usage

After scaffolding, the database component provides:

```bash
# From components/database/
npm run migrate   # Run all migrations in order
npm run seed      # Run all seed files in order
npm run reset     # Full reset: drop, create, migrate, seed
```

## Prerequisites

The scripts require:
- PostgreSQL 14+ (client tools: `psql`, `createdb`, `dropdb`)
- Environment variables set:
  - `PGHOST` - Database host
  - `PGPORT` - Database port
  - `PGUSER` - Database user
  - `PGPASSWORD` - Database password
  - `PGDATABASE` - Database name

## Migration Conventions

Create numbered SQL files for sequential execution:

```
migrations/
├── 001_initial_schema.sql
├── 002_add_users_table.sql
├── 003_add_orders_table.sql
└── 004_add_indexes.sql
```

Each migration should:
- Be wrapped in `BEGIN`/`COMMIT` for transactional safety
- Be idempotent where possible (use `IF NOT EXISTS`)
- Follow patterns from the [postgresql skill](../postgresql/SKILL.md)

## Seed Conventions

Create numbered SQL files for seed data:

```
seeds/
├── 001_lookup_data.sql
├── 002_admin_users.sql
└── 003_sample_data.sql
```

Each seed file should:
- Use `ON CONFLICT DO NOTHING` for idempotency
- Be wrapped in transactions
- Follow patterns from [postgresql seed-data reference](../postgresql/references/seed-data.md)

## Integration with Server Component

The database component works alongside the server component:

```
components/
├── database/           # Schema, migrations, seeds
│   └── migrations/
└── server/
    └── src/dal/        # Data access layer queries
```

The server's DAL layer imports types and executes queries against the schema defined in the database component.

## Related Skills

- [postgresql](../postgresql/SKILL.md) - SQL patterns, deployment, and best practices
- [backend-scaffolding](../backend-scaffolding/SKILL.md) - Server component with DAL layer
