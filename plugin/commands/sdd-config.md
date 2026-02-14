---
name: sdd-config
description: Manage project configuration - generate merged configs, validate, diff environments.
---

# /sdd-config

Manage project configuration for SDD projects.

## Usage

```
/sdd-config <operation> [options]
```

**Operations:**
- `generate` - Generate merged config file for a target environment
- `validate` - Validate config against schemas
- `diff` - Show differences between environments
- `add-env` - Add a new environment directory

### When Called Without Arguments

When invoked without an operation, displays a usage guide:

```
⚠ Missing required operation argument.

USAGE:
  /sdd-config <operation> [options]

OPERATIONS:
  generate    Generate merged config file for a target environment
  validate    Validate config against schemas
  diff        Show differences between environments
  add-env     Add a new environment directory

EXAMPLES:
  /sdd-config generate --env production
  /sdd-config validate
  /sdd-config diff local production
  /sdd-config add-env staging

NEXT STEPS:
  Run /sdd-config <operation> to get started, or see details below.
```

## Operations

### generate

Generate a merged config file for a target environment.

```
/sdd-config generate --env <env> [--component <name>] [--output <path>]
```

**Arguments:**
- `--env <env>` (required): Target environment (e.g., `local`, `staging`, `production`)
- `--component <name>` (optional): Extract only this component's config section
- `--output <path>` (optional): Write to file instead of stdout

**Behavior:**
1. Merges `envs/default/config.yaml` with `envs/{env}/config.yaml`
2. Validates against `schemas/config.schema.json` before outputting (fails if invalid)
3. Places schema alongside output (e.g., `config.yaml` + `config.schema.json`) for runtime validation
4. If `--component` specified, extracts just that section (outputs section contents only, no wrapper key)

**Examples:**
```bash
# Generate full merged config for local environment
/sdd-config generate --env local

# Generate config for a specific component
/sdd-config generate --env local --component server-task-service

# Generate to file for server startup
/sdd-config generate --env local --component server-task-service --output ./local-config.yaml

# Generate production config for Helm deployment
/sdd-config generate --env production --component server-task-service --output helm-values-config.yaml
```

**Component Extraction Output:**
When using `--component`, the output contains only the section contents (no wrapper key):

```yaml
# Input: envs/default/config.yaml
server-task-service:
  port: 3000
  database:
    host: localhost

# Output with --component server-task-service:
port: 3000
database:
  host: localhost
```

---

### validate

Validate config files against schemas.

```
/sdd-config validate [--env <env>]
```

**Arguments:**
- `--env <env>` (optional): Validate only this environment. If omitted, validates all environments.

**Behavior:**
1. Reads config YAML files from `envs/{env}/`
2. Validates against JSON Schema in `schemas/config.schema.json`
3. Reports all schema violations with line numbers

**Examples:**
```bash
# Validate all environments
/sdd-config validate

# Validate specific environment
/sdd-config validate --env production
```

---

### diff

Show differences between two environments.

```
/sdd-config diff <env1> <env2>
```

**Arguments:**
- `<env1>` (required): First environment to compare
- `<env2>` (required): Second environment to compare

**Behavior:**
1. Generates merged config for both environments
2. Shows additions, removals, and changes between them
3. Outputs in a readable format

**Examples:**
```bash
# Compare local vs production
/sdd-config diff local production

# Compare staging vs production
/sdd-config diff staging production
```

---

### add-env

Add a new environment directory.

```
/sdd-config add-env <env-name>
```

**Arguments:**
- `<env-name>` (required): Name of the new environment

**Behavior:**
1. Creates `envs/{env-name}/` directory
2. Creates `config.yaml` with schema reference and empty structure
3. Config inherits from `envs/default/`

**Examples:**
```bash
# Add staging environment
/sdd-config add-env staging

# Add production environment
/sdd-config add-env production
```

---

## Merge Algorithm

When merging `envs/default/` → `envs/{env}/`:

- **Objects**: Recursively merged (both levels' keys preserved)
- **Arrays**: Replaced entirely (env array replaces default array)
- **Primitives**: Env value replaces default value
- **Null values**: Explicitly setting `null` removes the key

**Example:**
```yaml
# envs/default/config.yaml
server-task-service:
  port: 3000
  database:
    host: db.internal
    pool: 10

# envs/local/config.yaml
server-task-service:
  database:
    host: localhost

# Result (merged):
server-task-service:
  port: 3000        # Preserved from default
  database:
    host: localhost # Overridden by local
    pool: 10        # Preserved from default
```

---

## Workflow

### Local Development

```bash
# 1. Generate merged config for local environment
/sdd-config generate --env local --component task-service --output components/servers/task-service/local-config.yaml

# 2. Start server with config
SDD_CONFIG_PATH=./local-config.yaml npm start
```

### Production Deployment

```bash
# 1. Generate config for production
/sdd-config generate --env production --component task-service --output production-config.yaml

# 2. Deploy with Helm
helm install my-release ./components/helm_charts/task-service \
  -f values-production.yaml \
  --set-file config=production-config.yaml
```

---

## Implementation

This command invokes the system CLI via `system-run.sh`:

```bash
# generate
<plugin-root>/system/system-run.sh config generate --env <env> [--component <name>] [--output <path>]

# validate
<plugin-root>/system/system-run.sh config validate [--env <env>]

# diff
<plugin-root>/system/system-run.sh config diff <env1> <env2>

# add-env
<plugin-root>/system/system-run.sh config add-env <env-name>
```

The system CLI handles the actual merge logic, validation, and file operations.

---

## Related

- `config-scaffolding` skill - Creates the config component
- `config-standards` skill - Standards for configuration management
- `helm-standards` skill - How Helm charts consume config
