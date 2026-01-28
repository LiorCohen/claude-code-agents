# Database Component

PostgreSQL database migrations, seeds, and management scripts. Deployed to local Kubernetes cluster.

## Prerequisites

- Local Kubernetes cluster (Docker Desktop, minikube, or kind)
- kubectl configured and connected
- Helm 3 installed
- psql client (for direct database access)

## Quick Start

```bash
# 1. Deploy PostgreSQL to k8s
npm run setup

# 2. Forward port to access from localhost (run in separate terminal)
npm run port-forward

# 3. Run migrations
npm run migrate

# 4. (Optional) Load seed data
npm run seed
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run setup` | Deploy PostgreSQL to local Kubernetes cluster |
| `npm run teardown` | Remove PostgreSQL from cluster |
| `npm run port-forward` | Forward localhost:5432 to database pod |
| `npm run psql` | Connect to database via psql |
| `npm run migrate` | Run all pending migrations |
| `npm run seed` | Load seed data |
| `npm run reset` | Drop, recreate, migrate, and seed |

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

## Default Connection Settings

When using port-forward, scripts default to:

| Setting | Value |
|---------|-------|
| Host | localhost |
| Port | 5432 |
| Database | {{PROJECT_NAME}} |
| Username | {{PROJECT_NAME}} |
| Password | {{PROJECT_NAME}}-local |

Override with environment variables:

```bash
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE={{PROJECT_NAME}}
export PGUSER={{PROJECT_NAME}}
export PGPASSWORD=your_password
```

## Configuration

Customize deployment with environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_NAMESPACE` | default | Kubernetes namespace |
| `DB_RELEASE_NAME` | {{PROJECT_NAME}}-db | Helm release name |
| `DB_LOCAL_PORT` | 5432 | Local port for port-forward |
