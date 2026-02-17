---
name: config-orchestration
description: Orchestrates project configuration operations — generate, validate, diff, and add-env.
user-invocable: false
---

# Config Orchestration

Manage project configuration for SDD projects. Each operation delegates to the system CLI.

## Input

Invoked by `sdd-run.md` with:
- `operation` — The config operation to perform
- `args` — Remaining arguments after the operation

## Operations

| Operation | Description |
|-----------|-------------|
| `generate` | Generate merged config file for a target environment |
| `validate` | Validate config against schemas |
| `diff` | Show differences between environments |
| `add-env` | Add a new environment directory |

## No Arguments

When invoked without an operation, display usage:

```
⚠ Missing required operation argument.

USAGE:
  /sdd-run config <operation> [options]

OPERATIONS:
  generate    Generate merged config file for a target environment
  validate    Validate config against schemas
  diff        Show differences between environments
  add-env     Add a new environment directory

EXAMPLES:
  /sdd-run config generate --env production
  /sdd-run config validate
  /sdd-run config diff local production
  /sdd-run config add-env staging
```

---

### generate

Generate a merged config file for a target environment.

```
/sdd-run config generate --env <env> [--component <name>] [--output <path>]
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

**Implementation:**
```bash
<plugin-root>/system/system-run.sh config generate --env <env> [--component <name>] [--output <path>]
```

---

### validate

Validate config files against schemas.

```
/sdd-run config validate [--env <env>]
```

**Arguments:**
- `--env <env>` (optional): Validate only this environment. If omitted, validates all environments.

**Behavior:**
1. Reads config YAML files from `envs/{env}/`
2. Validates against JSON Schema in `schemas/config.schema.json`
3. Reports all schema violations with line numbers

**Implementation:**
```bash
<plugin-root>/system/system-run.sh config validate [--env <env>]
```

---

### diff

Show differences between two environments.

```
/sdd-run config diff <env1> <env2>
```

**Arguments:**
- `<env1>` (required): First environment to compare
- `<env2>` (required): Second environment to compare

**Behavior:**
1. Generates merged config for both environments
2. Shows additions, removals, and changes between them
3. Outputs in a readable format

**Implementation:**
```bash
<plugin-root>/system/system-run.sh config diff <env1> <env2>
```

---

### add-env

Add a new environment directory.

```
/sdd-run config add-env <env-name>
```

**Arguments:**
- `<env-name>` (required): Name of the new environment

**Behavior:**
1. Creates `envs/{env-name}/` directory
2. Creates `config.yaml` with schema reference and empty structure
3. Config inherits from `envs/default/`

**Implementation:**
```bash
<plugin-root>/system/system-run.sh config add-env <env-name>
```

---

## Merge Algorithm

When merging `envs/default/` → `envs/{env}/`:

- **Objects**: Recursively merged (both levels' keys preserved)
- **Arrays**: Replaced entirely (env array replaces default array)
- **Primitives**: Env value replaces default value
- **Null values**: Explicitly setting `null` removes the key

## Related

- `config-scaffolding` skill - Creates the config component
- `config-standards` skill - Standards for configuration management
- `helm-standards` skill - How Helm charts consume config
- `docs/config-guide.md` - User-facing guide covering Local Development workflows, Production deployment, and SDD_CONFIG_PATH usage

## Output

Returns the system CLI output for the requested operation.
