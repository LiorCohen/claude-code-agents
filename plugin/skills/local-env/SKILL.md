---
name: local-env
description: Manage local Kubernetes development environments for SDD projects.
user-invocable: false
---

# Local Environment Skill

Manage local Kubernetes development environments for SDD projects.

## Prerequisites

- Docker installed and running
- kubectl installed
- helm installed
- One of the following cluster providers:
  - **kind** (`brew install kind`) - recommended
  - **minikube** (`brew install minikube`)
  - **Docker Desktop** with Kubernetes enabled

## Quick Start

```bash
# Create local env (auto-detects best provider)
/sdd-run env create

# Deploy your application
/sdd-run env deploy

# Start port forwards
/sdd-run env forward

# Check status
/sdd-run env status

# Stop when done (preserves state)
/sdd-run env stop

# Resume later
/sdd-run env start

# Full cleanup
/sdd-run env destroy
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

## Commands Reference

| Command | Description |
|---------|-------------|
| `env create` | Create cluster + install infra |
| `env destroy` | Delete cluster entirely |
| `env start` | Resume stopped cluster |
| `env stop` | Pause cluster (preserves state) |
| `env restart` | Restart cluster (stop + start) |
| `env status` | Show cluster and workload status |
| `env deploy` | Set up databases, run migrations, deploy helm charts |
| `env undeploy` | Remove helm deployments (databases persist) |
| `env forward` | Manage port forwards |
| `env config` | Generate local environment config file |
| `env infra` | Install/reinstall observability infrastructure |

## Integration with Settings

The deploy command reads `.sdd/sdd-settings.yaml` (delegate to the `project-settings` skill for the settings schema — it returns the project `name`, component list with types, and per-component settings) to:
1. Get the app `name` (used as the Kubernetes namespace)
2. Find all `type: database` components to set up
3. Find all `type: helm` components to deploy

Running `env deploy`:
1. Sets up `primary-db` PostgreSQL in the `acme-backend` namespace
2. Runs migrations from `components/databases/primary-db/migrations/`
3. Deploys `main-server-api` helm chart

## Hybrid Development

Run most services in k8s while developing one locally for faster iteration:

```bash
# Deploy everything except the service you're working on
/sdd-run env deploy --exclude=main-server-api

# Start port forwards so your local service can reach k8s
/sdd-run env forward

# Run your service locally
cd components/servers/main-server
npm run dev
```

Your local service connects to:
- **Databases**: via port-forwarded PostgreSQL (localhost:5432)
- **Other APIs**: via port-forwarded services (localhost:8080+)
- **Telemetry**: Victoria Metrics at localhost:9090

The local config is auto-generated at `components/config/envs/local/config.yaml` during deploy with the correct localhost URLs.

## Troubleshooting

### Cluster won't start

```bash
# Check Docker is running
docker ps

# Check kind clusters
kind get clusters

# Delete and recreate
/sdd-run env destroy
/sdd-run env create
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
/sdd-run env forward list

# Stop all and restart
/sdd-run env forward stop
/sdd-run env forward start
```

---

## Input / Output

This skill defines no input parameters or structured output.
