---
name: database-scaffolding
description: Scaffolds PostgreSQL database component with migrations, seeds, and management scripts.
user-invocable: false
---

# Database Scaffolding Skill

Creates database component structure for PostgreSQL-based projects.

## What It Creates

The directory path depends on the component name as defined in `.sdd/sdd-settings.yaml`. Delegate to the `project-settings` skill for directory path resolution — it maps component type (`database`) + name to a filesystem path (e.g., `type=database, name=app-db` → `components/databases/app-db/`). Database components support multiple instances (e.g., `database-app-db/`, `database-analytics-db/`).

```text
components/database[-<name>]/
├── package.json              # Component package metadata
├── README.md                 # Component documentation
├── migrations/
│   └── 001_initial_schema.sql
└── seeds/
    └── 001_seed_data.sql
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

After scaffolding, database operations are performed via the system CLI:

```bash
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database setup <component-name>
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database teardown <component-name>
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database migrate <component-name>
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database seed <component-name>
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database reset <component-name>
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database port-forward <component-name>
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database psql <component-name>
```

## Prerequisites

The CLI commands require:
- PostgreSQL 14+ (client tools: `psql`, `createdb`, `dropdb`)
- Environment variables set:
  - `PGHOST` - Database host
  - `PGPORT` - Database port
  - `PGUSER` - Database user
  - `PGPASSWORD` - Database password
  - `PGDATABASE` - Database name

## Migration Conventions

Create numbered SQL files for sequential execution:

```text
migrations/
├── 001_initial_schema.sql
├── 002_add_users_table.sql
├── 003_add_orders_table.sql
└── 004_add_indexes.sql
```

Each migration should:
- Be wrapped in `BEGIN`/`COMMIT` for transactional safety
- Be idempotent where possible (use `IF NOT EXISTS`)
- Delegate to the `postgresql` skill for SQL syntax patterns, index strategies, and constraint conventions

## Seed Conventions

Create numbered SQL files for seed data:

```text
seeds/
├── 001_lookup_data.sql
├── 002_admin_users.sql
└── 003_sample_data.sql
```

Each seed file should:
- Use `ON CONFLICT DO NOTHING` for idempotency
- Be wrapped in transactions
- Delegate to the `postgresql` skill for seed data patterns and idempotent insert conventions

## Integration with Server Component

The database component works alongside the server component:

```text
components/
├── database/           # Schema, migrations, seeds
│   └── migrations/
└── server/
    └── src/dal/        # Data access layer queries
```

The server's DAL layer imports types and executes queries against the schema defined in the database component.

## Config Schema

When scaffolding a database component, the following config section is added to `components/config/`:

### Minimal Config (envs/default/config.yaml)

```yaml
database-{name}:
  host: localhost
  port: 5432
  name: appdb
  user: app
  passwordSecret: db-credentials
  pool: 10
```

### TypeScript Type (types/database.ts)

```typescript
export type DatabaseConfig = Readonly<{
  host: string;
  port: number;
  name: string;
  user: string;
  passwordSecret: string;
  pool: number;
}>;
```

### JSON Schema (schemas/config.schema.json)

```json
{
  "database-{name}": {
    "type": "object",
    "properties": {
      "host": { "type": "string" },
      "port": { "type": "number", "default": 5432 },
      "name": { "type": "string" },
      "user": { "type": "string" },
      "passwordSecret": { "type": "string" },
      "pool": { "type": "number", "default": 10 }
    },
    "required": ["host", "port", "name", "user", "passwordSecret"]
  }
}
```

---

## Scaffold Spec

To scaffold a database component, build a spec and invoke the engine:

```bash
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding apply --spec spec.json
```

### Variables

| Variable | Source |
|----------|--------|
| `PROJECT_NAME` | From `sdd-settings.yaml` project name |

### Operations

```json
{
  "target_dir": "<project-root>",
  "base_dir": "<plugin-root>/skills",
  "variables": { "PROJECT_NAME": "<project-name>" },
  "operations": [
    {
      "type": "template_dir",
      "source": "components/database/database-scaffolding/templates",
      "dest": "components/databases/<database-name>"
    }
  ]
}
```

No conditions needed.

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts database name and optional project name for migration and seed template generation.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns the scaffolding engine result: created files, directories, and scripts; skipped paths; errors; and a human-readable summary.

## Related Skills

- `project-settings` — Authoritative source for database component settings schema and directory mappings.
- `postgresql` — Delegate to this for SQL patterns, Docker/K8s deployment, schema management, and performance tuning. Provides migration SQL templates, seed data patterns, and introspection queries.
- `backend-scaffolding` — Generates the server component that contains the DAL layer querying this database. The server's repository layer imports database connection config and executes queries against the schema defined here.
