---
name: helm-standards
description: Standards for Helm charts in SDD projects, including settings-driven patterns.
---

# Helm Standards Skill

Standards for Helm charts in SDD projects. Charts are generated based on component settings from `.sdd/sdd-settings.yaml`.

## Skills

Use the following skills for reference:
- `project-settings` — Authoritative source for helm component settings schema, validation rules, and the chart-per-deployment pattern

## Chart-per-Deployment Pattern

Each deployment configuration gets its own helm chart. A single server can have multiple helm charts (e.g., one for API mode with ingress, one for worker mode without). Refer to the `project-settings` skill for the complete helm settings schema and how `deploy_modes`, `ingress`, and `assets` affect chart structure.

## Prerequisites

- `sdd-system` CLI available in PATH (installed via the SDD plugin's npm package)

## Directory Structure

Helm charts live at `components/helm_charts/<name>/`:

```text
components/helm_charts/
├── main-server-api/          # API deployment
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── _helpers.tpl
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── ingress.yaml
│       ├── configmap.yaml
│       └── servicemonitor.yaml
├── main-server-worker/       # Worker deployment (no ingress)
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── _helpers.tpl
│       ├── deployment.yaml
│       ├── configmap.yaml
│       └── servicemonitor.yaml
├── admin-dashboard/          # Webapp deployment
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── _helpers.tpl
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── ingress.yaml
│       └── configmap.yaml
└── umbrella/                 # Optional: installs all charts
    ├── Chart.yaml
    └── values.yaml
```

## Values File Conventions

| File | Purpose |
|------|---------|
| `values.yaml` | Default values (development-safe) |
| `values-{env}.yaml` | Environment overrides (local, staging, production) |

## Required Values

Every Helm chart must define these values:

```yaml
# Infrastructure settings (NOT application config)
nodeEnv: development          # NODE_ENV for libraries (Express caching, etc.)

# Application config (from config component)
config: {}                    # Merged config from components/config/envs/{env}/
```

## Server Chart Values

### Single Mode Server

```yaml
replicaCount: 1
nodeEnv: development

image:
  repository: main-server
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 3000

observability:
  metrics:
    enabled: true
    port: 9090
    serviceMonitor:
      enabled: false
      interval: 30s

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

config: {}
```

### Hybrid Server (Multiple Modes)

```yaml
nodeEnv: development

image:
  repository: main-server
  tag: latest
  pullPolicy: IfNotPresent

# Each mode gets independent scaling
api:
  enabled: true
  replicaCount: 2
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 100m
      memory: 128Mi

worker:
  enabled: true
  replicaCount: 5
  resources:
    limits:
      cpu: 1000m
      memory: 1Gi
    requests:
      cpu: 200m
      memory: 256Mi

service:
  type: ClusterIP
  port: 3000

observability:
  metrics:
    enabled: true
    port: 9090
    serviceMonitor:
      enabled: false
      interval: 30s

config: {}
```

## Webapp Chart Values

```yaml
replicaCount: 1
nodeEnv: development

image:
  repository: nginx
  tag: alpine
  pullPolicy: IfNotPresent

assets:
  type: bundled              # bundled | entrypoint
  path: /usr/share/nginx/html

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: app.example.com
      paths:
        - path: /
          pathType: Prefix

config: {}                   # Injected into HTML at deploy time
```

## Observability Integration

All server charts include observability by default:

### ServiceMonitor (Prometheus/Victoria Metrics)

```yaml
# templates/servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ include "common.fullname" . }}
spec:
  selector:
    matchLabels:
      {{- include "common.selectorLabels" . | nindent 6 }}
  endpoints:
    - port: metrics
      interval: {{ .Values.observability.metrics.serviceMonitor.interval }}
      path: /metrics
```

### Metrics Endpoint

All servers expose metrics on port 9090:
- `/metrics` - Prometheus format metrics
- `/health/live` - Liveness probe
- `/health/ready` - Readiness probe

### Structured Logging

Applications output JSON logs to stdout. The cluster's log collector (Victoria Logs) picks them up automatically.

**Note:** Cluster-level observability infrastructure is set up separately (see task #47).

## Config Injection Pattern

### Server Config

Config is mounted via ConfigMap at `/app/config/config.yaml`:

```yaml
# templates/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "common.fullname" . }}-config
data:
  config.yaml: |
    {{- toYaml .Values.config | nindent 4 }}
```

### Webapp Config

Config is injected into HTML at deploy time:

1. Webapp exports: `export const startApp = (config: AppConfig) => { ... }`
2. Helm chart's index.html has: `startApp(__SDD_CONFIG__)`
3. Init container replaces `__SDD_CONFIG__` with JSON from ConfigMap

## Populating Config at Deploy Time

```bash
# Generate config for production environment
sdd-system config generate --env production --component main-server \
  --output helm-values-config.yaml

# Deploy with config
helm install my-release ./components/helm_charts/main-server-api \
  -f values-production.yaml \
  --set-file config=helm-values-config.yaml
```

## Environment Variables

| Var | Source | Purpose |
|-----|--------|---------|
| `NODE_ENV` | `.Values.nodeEnv` | Library behavior (Express caching, etc.) |
| `SDD_CONFIG_PATH` | Static `/app/config/config.yaml` | Path to mounted config |
| `SDD_SERVER_MODE` | Set per deployment | For hybrid: which mode (api, worker, cron) |

## Secret References

Config contains secret **names**, not values. Applications use K8s `secretKeyRef` to load the actual values:

```yaml
# values-production.yaml
config:
  database:
    host: db.production.internal
    passwordSecret: "my-db-credentials"  # K8s Secret name
```

```yaml
# templates/deployment.yaml - Using secretKeyRef
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: {{ .Values.config.database.passwordSecret }}
        key: password
```

## Best Practices

1. **Chart-per-deployment** - Separate charts for different deployment configurations
2. **Settings-driven templates** - Use component settings to determine what's included
3. **Never hardcode environment values** - Use values files for all environment differences
4. **Keep secrets external** - Reference K8s Secrets by name only
5. **Config component is source of truth** - Helm just mounts it
6. **Validate config before deploy** - Use `/sdd-config validate` in CI/CD
7. **Independent scaling** - Use separate deployments for hybrid modes

---

## Input / Output

This skill defines no input parameters or structured output.


## Related Skills

- `config-standards` — Delegate to this for config naming and structure conventions. Defines the config schema patterns that Helm `values.yaml` must align with.
