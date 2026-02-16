---
name: local-env-orchestration
description: Orchestrates local Kubernetes development environment management.
user-invocable: false
---

# Local Environment Orchestration

Manage local Kubernetes development environments for SDD projects.

## Input

Invoked by `sdd-run.md` with:
- `action` — The local-env action to perform
- `args` — Remaining arguments after the action

## Prerequisites

- Docker installed and running
- kubectl installed
- helm installed
- One of the following cluster providers:
  - **kind** (`brew install kind`) - recommended
  - **minikube** (`brew install minikube`)
  - **Docker Desktop** with Kubernetes enabled

## Actions

| Action | Description |
|--------|-------------|
| `create` | Create cluster + install infra |
| `destroy` | Delete cluster entirely |
| `start` | Resume stopped cluster |
| `stop` | Pause cluster (preserves state) |
| `status` | Show cluster and workload status |
| `deploy` | Set up databases, run migrations, deploy helm charts |
| `undeploy` | Remove helm deployments (databases persist) |
| `forward` | Manage port forwards |
| `infra` | Install/reinstall observability infrastructure |

## No Arguments

When invoked without an action, display usage:

```
⚠ Missing required action argument.

USAGE:
  /sdd-run local-env <action> [args] [options]

ACTIONS:
  create     Create local k8s cluster + install infra
  destroy    Delete cluster entirely
  start      Resume stopped cluster
  stop       Pause cluster (preserves state)
  status     Show cluster and workload status
  deploy     Set up databases, run migrations, deploy helm charts
  undeploy   Remove helm deployments
  forward    Manage port forwards (start|stop|list)
  infra      Install/reinstall observability infrastructure

EXAMPLES:
  /sdd-run local-env create
  /sdd-run local-env deploy
  /sdd-run local-env forward start
  /sdd-run local-env status
```

## Action Details

### create

```
/sdd-run local-env create [--name=cluster-name] [--provider=kind|minikube|docker-desktop] [--skip-infra]
```

Creates a local k8s cluster and installs the observability stack (Victoria Metrics + Victoria Logs).

Options:
- `--name`: Cluster name (default: sdd-local)
- `--provider`: Cluster provider (default: auto-detected)
  - `kind`: Kubernetes IN Docker (fast, lightweight)
  - `minikube`: Full-featured local k8s
  - `docker-desktop`: Uses Docker Desktop's built-in Kubernetes
- `--skip-infra`: Skip installing observability stack

**Implementation:**
```bash
<plugin-root>/system/system-run.sh env create [--name=cluster-name] [--provider=kind|minikube|docker-desktop] [--skip-infra]
```

### destroy

```
/sdd-run local-env destroy [--name=cluster-name]
```

Completely removes the local cluster (not available for docker-desktop).

**Implementation:**
```bash
<plugin-root>/system/system-run.sh env destroy [--name=cluster-name]
```

### start / stop

```
/sdd-run local-env start [--name=cluster-name]
/sdd-run local-env stop [--name=cluster-name]
```

Pause and resume the cluster. State is preserved when stopped.

**Implementation:**
```bash
<plugin-root>/system/system-run.sh env start [--name=cluster-name]
<plugin-root>/system/system-run.sh env stop [--name=cluster-name]
```

### status

```
/sdd-run local-env status [--name=cluster-name]
```

Shows cluster status, node health, and deployed workloads.

**Implementation:**
```bash
<plugin-root>/system/system-run.sh env status [--name=cluster-name]
```

### deploy

```
/sdd-run local-env deploy [chart-name] [--namespace=<app-name>] [--skip-db] [--skip-migrate] [--exclude=name,...]
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

**Implementation:**
```bash
<plugin-root>/system/system-run.sh env deploy [chart-name] [--namespace=<app-name>] [--skip-db] [--skip-migrate] [--exclude=name,...]
```

### undeploy

```
/sdd-run local-env undeploy [chart-name] [--namespace=<app-name>]
```

Removes deployed applications (keeps infrastructure).

**Implementation:**
```bash
<plugin-root>/system/system-run.sh env undeploy [chart-name] [--namespace=<app-name>]
```

### forward

```
/sdd-run local-env forward [start|stop|list] [--namespace=<app-name>]
```

Manages port forwards for local access to services.

**Implementation:**
```bash
<plugin-root>/system/system-run.sh env forward [start|stop|list] [--namespace=<app-name>]
```

### infra

```
/sdd-run local-env infra [--reinstall]
```

Install or reinstall the observability infrastructure stack.

**Implementation:**
```bash
<plugin-root>/system/system-run.sh env infra [--reinstall]
```

## Architecture

### Cluster Providers

| Provider | Best For | Create Time | Notes |
|----------|----------|-------------|-------|
| `kind` | CI/CD, disposable clusters | ~30 seconds | Default, recommended |
| `minikube` | Feature-rich local dev | ~60 seconds | Supports addons |
| `docker-desktop` | Simple local dev | Already running | Uses existing cluster |

**Auto-detection order:**
1. If Docker Desktop k8s is running → `docker-desktop`
2. If minikube is installed → `minikube`
3. Default → `kind`

### Infrastructure Stack

The telemetry namespace contains:
- **Victoria Metrics**: Metrics collection and storage
- **Victoria Logs**: Log aggregation
- **Log Collector**: DaemonSet collecting logs from all pods

### Namespace Layout

| Namespace | Contents |
|-----------|----------|
| `telemetry` | Observability stack |
| `<app-name>` | Application deployments (from sdd-settings.yaml `name` field) |

## Integration with Settings

The deploy action reads `.sdd/sdd-settings.yaml` (delegate to the `project-settings` skill for the settings schema — it returns the project `name`, component list with types, and per-component settings) to:
1. Get the app `name` (used as the Kubernetes namespace)
2. Find all `type: database` components to set up
3. Find all `type: helm` components to deploy

## Hybrid Development

Run most services in k8s while developing one locally:

```bash
# Deploy everything except the service you're working on
/sdd-run local-env deploy --exclude=main-server-api

# Start port forwards so your local service can reach k8s
/sdd-run local-env forward start

# Run your service locally
cd components/servers/main-server
npm run dev
```

Your local service connects to:
- **Databases**: via port-forwarded PostgreSQL (localhost:5432)
- **Other APIs**: via port-forwarded services (localhost:8080+)
- **Telemetry**: Victoria Metrics at localhost:9090

## Troubleshooting

### Cluster won't start

```bash
# Check Docker is running
docker ps

# Check kind clusters
kind get clusters

# Delete and recreate
/sdd-run local-env destroy
/sdd-run local-env create
```

### Pods not starting

```bash
# Check pod status
kubectl get pods -A

# Check pod logs
kubectl logs <pod-name> -n <namespace>

# Describe pod for events
kubectl describe pod <pod-name> -n <namespace>
```

### Port forward not working

```bash
# List active forwards
/sdd-run local-env forward list

# Stop all and restart
/sdd-run local-env forward stop
/sdd-run local-env forward start
```

## Output

Returns the system CLI output for the requested action.
