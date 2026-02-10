---
name: helm-scaffolding
description: Scaffolds Helm charts for SDD components, driven by component settings.
user-invocable: false
---

# Helm Scaffolding Skill

Scaffolds Helm charts for deploying SDD components to Kubernetes. Charts are generated based on component settings from `.sdd/sdd-settings.yaml`.

## Skills

Use the following skills for reference:
- `project-settings` — Authoritative source for helm component settings schema (deploys, deploy_type, deploy_modes, ingress, assets)

## When to Use

Use when creating Helm chart components. Creates Helm charts that integrate with the SDD config system.

## Settings-Driven Scaffolding

Helm charts are scaffolded based on their settings in `.sdd/sdd-settings.yaml`. Refer to the `project-settings` skill for the complete helm settings schema and defaults.

### Template Selection Logic

```typescript
// Pseudocode for settings-driven template selection
const scaffoldHelmChart = async (helmComponent: HelmComponent): Promise<void> => {
  const { settings } = helmComponent;

  // Always include base templates
  await copyTemplate('_helpers.tpl');
  await copyTemplate('configmap.yaml');

  if (settings.deploy_type === 'server') {
    // Server-specific templates
    await copyTemplate('servicemonitor.yaml'); // All servers get metrics

    const deployModes = settings.deploy_modes ?? [serverSettings.server_type];

    if (deployModes.length > 1) {
      // Multiple modes = separate deployments per mode
      if (deployModes.includes('api')) await copyTemplate('deployment-api.yaml');
      if (deployModes.includes('worker')) await copyTemplate('deployment-worker.yaml');
      if (deployModes.includes('cron')) await copyTemplate('cronjob.yaml');
    } else if (deployModes[0] === 'cron') {
      await copyTemplate('cronjob.yaml');
    } else {
      await copyTemplate('deployment.yaml');
    }

    // Service only if deploying api mode and server provides contracts
    if (deployModes.includes('api') && serverSettings.provides_contracts.length > 0) {
      await copyTemplate('service.yaml');
    }
  } else {
    // Webapp templates
    await copyTemplate('deployment.yaml');
    await copyTemplate('service.yaml');
  }

  // Ingress from helm settings
  if (settings.ingress) {
    await copyTemplate('ingress.yaml');
  }
};
```

## Directory Structure

Helm charts live at `components/helm_charts/<name>/`:

| Component Name | Directory |
|----------------|-----------|
| `main-server-api` | `components/helm_charts/main-server-api/` |
| `admin-dashboard` | `components/helm_charts/admin-dashboard/` |
| `umbrella` | `components/helm_charts/umbrella/` |

## What It Creates

### Server Chart Structure

```text
components/helm_charts/<name>/
├── Chart.yaml                # Chart metadata
├── values.yaml               # Default values
└── templates/
    ├── _helpers.tpl          # Template helpers (always)
    ├── configmap.yaml        # Config mount (always)
    ├── servicemonitor.yaml   # Metrics integration (always)
    ├── deployment.yaml       # Single-mode deployment
    ├── deployment-api.yaml   # Hybrid: API mode deployment
    ├── deployment-worker.yaml # Hybrid: Worker mode deployment
    ├── cronjob.yaml          # Cron mode
    ├── service.yaml          # When provides_contracts (conditional)
    └── ingress.yaml          # When ingress: true (conditional)
```

### Webapp Chart Structure

```text
components/helm_charts/<name>/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── _helpers.tpl
    ├── deployment.yaml       # nginx with config injection
    ├── service.yaml
    ├── configmap.yaml        # App config + nginx config
    └── ingress.yaml          # When ingress: true (conditional)
```

### Umbrella Chart Structure

```text
components/helm_charts/umbrella/
├── Chart.yaml                # Lists all charts as dependencies
└── values.yaml               # Enable/disable individual charts
```

## Template Variables

| Variable | Description |
|----------|-------------|
| `{{CHART_NAME}}` | Helm chart name |
| `{{CHART_DESCRIPTION}}` | Helm chart description |
| `{{DEPLOYS_COMPONENT}}` | Name of component this chart deploys |
| `{{APP_VERSION}}` | Application version |
| `{{PROJECT_NAME}}` | Project name |
| `{{IS_HYBRID}}` | True if deploying multiple modes |
| `{{DEPLOY_MODES}}` | List of modes being deployed |
| `{{HAS_SERVICE}}` | True if server provides contracts |
| `{{HAS_INGRESS}}` | True if ingress enabled |

## Templates Location

Templates are organized by deployment target:

```text
skills/components/helm/helm-scaffolding/
├── templates/                 # Legacy (single deployment)
├── templates-server/          # Server charts
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── _helpers.tpl
│       ├── deployment.yaml
│       ├── deployment-api.yaml
│       ├── deployment-worker.yaml
│       ├── cronjob.yaml
│       ├── service.yaml
│       ├── ingress.yaml
│       ├── servicemonitor.yaml
│       └── configmap.yaml
├── templates-webapp/          # Webapp charts
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── _helpers.tpl
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── ingress.yaml
│       └── configmap.yaml
└── templates-umbrella/        # Umbrella chart
    ├── Chart.yaml
    └── values.yaml
```

## Config Integration

### Server Config Injection

Config is mounted as a file at `/app/config/config.yaml`. The application reads config using the `SDD_CONFIG_PATH` environment variable:

```yaml
# templates/configmap.yaml
data:
  config.yaml: |
    {{- toYaml .Values.config | nindent 4 }}
```

The ConfigMap is mounted in deployments and `SDD_CONFIG_PATH` is set automatically.

Deployment workflow:
```bash
# Generate merged config
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" config generate --env production --component main-server \
  --output production-config.yaml

# Deploy with config
helm install my-release ./components/helm_charts/main-server-api \
  -f values-production.yaml \
  --set-file config=production-config.yaml
```

### Webapp Config Injection

Config is injected into HTML at deploy time via init container:

1. Webapp exports: `export const startApp = (config: AppConfig) => { ... }`
2. Helm chart's index.html has: `startApp(__SDD_CONFIG__)`
3. Init container replaces `__SDD_CONFIG__` with JSON from ConfigMap
4. App receives config as parameter

## Observability Integration

All server charts include:

- **ServiceMonitor** - Registers app with Prometheus/Victoria Metrics
- **Metrics endpoint** - Port 9090 for health/metrics
- **Structured logging** - JSON logs to stdout (collector picks up)

Cluster-level observability (Victoria Metrics, Victoria Logs) is set up separately (see task #47).

---

## Scaffold Spec

To scaffold a Helm chart, build a spec with context flags derived from helm + server settings and invoke the engine:

```bash
"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding apply --spec spec.json
```

### Variables

| Variable | Source |
|----------|--------|
| `PROJECT_NAME` | From `sdd-settings.yaml` project name |
| `CHART_NAME` | Helm component name |
| `CHART_DESCRIPTION` | `"Helm chart for <chart-name>"` |
| `DEPLOYS_COMPONENT` | Name of the component this chart deploys |
| `IS_HYBRID` | `"true"` or `"false"` |
| `HAS_SERVICE` | `"true"` or `"false"` |
| `HAS_INGRESS` | `"true"` or `"false"` |

### Context Flags (derived from settings)

| Flag | Derived From |
|------|-------------|
| `deploy_type` | `settings.deploy_type` (`"server"` or `"webapp"`) |
| `is_hybrid` | `deploy_modes.length > 1` |
| `is_cron_only` | `deploy_modes === ["cron"]` |
| `has_api_mode` | `deploy_modes.includes("api")` |
| `has_worker_mode` | `deploy_modes.includes("worker")` |
| `has_cron_mode` | `deploy_modes.includes("cron")` |
| `needs_service` | `has_api_mode && provides_contracts.length > 0` |
| `has_ingress` | `settings.ingress === true` |

### Example Spec (server chart)

See the full Helm chart spec example in the task description. Each template file is a separate `template_file` operation with appropriate `when` conditions based on the pre-computed context flags.

### Operations Pattern

```json
{
  "target_dir": "<project-root>",
  "base_dir": "<plugin-root>/skills",
  "variables": { "CHART_NAME": "<chart-name>", "..." : "..." },
  "context": {
    "is_hybrid": false,
    "is_cron_only": false,
    "has_api_mode": true,
    "needs_service": true,
    "has_ingress": true
  },
  "operations": [
    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/Chart.yaml", "dest": "components/helm_charts/<chart-name>/Chart.yaml" },
    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/values.yaml", "dest": "components/helm_charts/<chart-name>/values.yaml" },
    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/templates/_helpers.tpl", "dest": "components/helm_charts/<chart-name>/templates/_helpers.tpl" },
    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/templates/configmap.yaml", "dest": "components/helm_charts/<chart-name>/templates/configmap.yaml" },
    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/templates/servicemonitor.yaml", "dest": "components/helm_charts/<chart-name>/templates/servicemonitor.yaml" },
    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/templates/deployment.yaml", "dest": "components/helm_charts/<chart-name>/templates/deployment.yaml", "when": [{ "key": "is_hybrid", "equals": false }, { "key": "is_cron_only", "equals": false }] },
    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/templates/service.yaml", "dest": "components/helm_charts/<chart-name>/templates/service.yaml", "when": { "key": "needs_service", "equals": true } },
    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/templates/ingress.yaml", "dest": "components/helm_charts/<chart-name>/templates/ingress.yaml", "when": { "key": "has_ingress", "equals": true } },
    { "type": "package_json_scripts", "scripts": { "<chart-name>:lint": "helm lint components/helm_charts/<chart-name>" } }
  ]
}
```

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts chart name, deploy target, deployment type, and optional settings for modes, ingress, and webapp assets.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns the scaffolding engine result: created files, directories, and scripts; skipped paths; errors; and a human-readable summary.

## Related Skills

- `helm-standards` — Generated Helm charts must follow these standards. Defines `values.yaml` structure, template patterns, settings-driven configuration, and release naming conventions.
