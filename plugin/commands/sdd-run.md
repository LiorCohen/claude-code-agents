---
name: sdd-run
description: Manage local development environment and validate artifacts.
---

# /sdd-run

Manage your local development environment and validate artifacts.

## Usage

```
/sdd-run <namespace> <action> [args] [options]
```

### When Called Without Arguments

When invoked without namespace and action, displays a usage guide:

```
⚠ Missing required arguments.

USAGE:
  /sdd-run <namespace> <action> [args] [options]

NAMESPACES:
  database      Manage local PostgreSQL databases (setup, migrate, seed, reset, psql)
  contract      Validate OpenAPI specifications
  env           Manage local Kubernetes environments (create, deploy, status)
  permissions   Configure Claude Code permissions for SDD

EXAMPLES:
  /sdd-run database setup my-db
  /sdd-run contract validate my-api
  /sdd-run env create
  /sdd-run env deploy
  /sdd-run permissions configure

GLOBAL OPTIONS:
  --json       Output in JSON format
  --verbose    Enable verbose logging
  --help       Show help for namespace/action

NEXT STEPS:
  Run /sdd-run <namespace> <action> to get started, or see details below.
```

## When to Use

While workflow commands (`/sdd-init`, `/sdd-change`, etc.) orchestrate multi-step processes with agents, `/sdd-run` gives you direct control over local dev operations—spinning up databases, running migrations, or validating your API contract.

## Database Operations

Manage your local PostgreSQL database:

```bash
# Start a local database
/sdd-run database setup my-db

# Run migrations
/sdd-run database migrate my-db

# Seed with test data
/sdd-run database seed my-db

# Reset database (teardown + setup + migrate + seed)
/sdd-run database reset my-db

# Open psql shell for debugging
/sdd-run database psql my-db

# Port forward to access remote database locally
/sdd-run database port-forward my-db

# Tear down when done
/sdd-run database teardown my-db
```

## Contract Validation

Validate your OpenAPI specification:

```bash
# Validate the API contract
/sdd-run contract validate my-api
```

## Environment Commands

Manage local Kubernetes development environments.

### Create Environment

```bash
/sdd-run env create [--name=cluster-name] [--provider=kind|minikube|docker-desktop] [--skip-infra]
```

Creates a local k8s cluster and installs the observability stack (Victoria Metrics + Victoria Logs).

Options:
- `--name`: Cluster name (default: sdd-local)
- `--provider`: Cluster provider (default: auto-detected)
  - `kind`: Kubernetes IN Docker (fast, lightweight)
  - `minikube`: Full-featured local k8s
  - `docker-desktop`: Uses Docker Desktop's built-in Kubernetes
- `--skip-infra`: Skip installing observability stack

### Destroy Environment

```bash
/sdd-run env destroy [--name=cluster-name]
```

Completely removes the local cluster (not available for docker-desktop).

### Start/Stop Environment

```bash
/sdd-run env start [--name=cluster-name]
/sdd-run env stop [--name=cluster-name]
```

Pause and resume the cluster. State is preserved when stopped.

### Environment Status

```bash
/sdd-run env status [--name=cluster-name]
```

Shows cluster status, node health, and deployed workloads.

### Deploy Applications

```bash
/sdd-run env deploy [chart-name] [--namespace=<app-name>] [--skip-db] [--skip-migrate] [--exclude=name,...]
```

Deploys the full application stack in order:
1. **Databases** - Sets up PostgreSQL instances for each `type: database` component
2. **Migrations** - Runs database migrations
3. **Helm charts** - Deploys application charts from `components/helm_charts/`

Options:
- `--namespace`: Override namespace (default: app name from sdd-settings.yaml)
- `--skip-db`: Skip database setup (useful for redeploying apps only)
- `--skip-migrate`: Skip running migrations
- `--exclude`: Comma-separated list of charts to skip (for hybrid development)

### Hybrid Development

Run most services in k8s while developing one locally:

```bash
# Deploy everything except main-server
/sdd-run env deploy --exclude=main-server-api

# Start port forwards
/sdd-run env forward

# Run your service locally
cd components/servers/main-server && npm run dev
```

### Undeploy Applications

```bash
/sdd-run env undeploy [chart-name] [--namespace=<app-name>]
```

Removes deployed applications (keeps infrastructure).

### Port Forwarding

```bash
/sdd-run env forward [start|stop|list] [--namespace=<app-name>]
```

Manages port forwards for local access to services.

### Generate Local Config

```bash
/sdd-run env config
```

Generates [local/config.yaml](components/config/envs/local/config.yaml) with localhost URLs matching port-forwarded services.

### Install Infrastructure

```bash
/sdd-run env infra [--reinstall]
```

Install or reinstall the observability infrastructure stack.

## Permission Management

Configure Claude Code permissions for SDD.

### Configure Permissions

```bash
/sdd-run permissions configure
```

Merges SDD recommended permissions into your project's `.claude/settings.local.json`:

1. Creates backup of existing settings (if any)
2. Reads SDD recommended permissions from `~/.claude/plugins/sdd/hooks/recommended-permissions.json`
3. Merges permissions (preserving your existing settings, adding SDD permissions)
4. Writes updated settings file

This is typically invoked during `/sdd-init` but can be run manually to refresh permissions after a plugin update or to add permissions to an existing project.

## Global Options

| Option | Description |
|--------|-------------|
| `--json` | Output in JSON format |
| `--verbose` | Enable verbose logging |
| `--help` | Show help for namespace/action |

## Execution

When you invoke `/sdd-run`, execute the following:

```bash
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" <namespace> <action> [args] [options]
```

Where `CLAUDE_PLUGIN_ROOT` is the path to the SDD plugin directory.

---

## Internal Namespaces

The following namespaces are used internally by other commands and should not be invoked directly:

- `scaffolding` - Used by `/sdd-init` for project setup
- `spec` - Used for spec validation, indexing, and snapshots
- `version` - Used by the commit skill for version bumping
- `hook` - Hook handlers for internal use
- `contract generate-types` - Invoked automatically during implementation plans
- `permissions` - Used by `/sdd-init` for auto-configuring permissions
