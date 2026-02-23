---
name: command-router
description: Routes /sdd-run commands to fullstack-typescript skills or system CLI.
user-invocable: false
---

# Command Router

Routes `techpacks.routeCommand(command, args)` requests to the appropriate fullstack-typescript skill or system CLI handler. Core never dispatches tech pack commands directly — it invokes this router, which handles argument validation, sub-help, destructive action confirmation, and dispatch.

## Input

Invoked by the techpacks gateway with a structured context block:

```yaml
command: <command-name>
namespace: <tech-pack-namespace>
args: <parsed-args>
```

Validated against `command-router-context.schema.json`.

---

## Dispatch Table

Maps the command namespace to its handler.

| Namespace | Handler | Description |
|-----------|---------|-------------|
| `local-env` | INVOKE `local-env-orchestration` skill | Orchestrates local Kubernetes environment management |
| `database` | Pass-through to tech system CLI | Database lifecycle operations |
| `contract` | Pass-through to tech system CLI | Contract generation and validation |
| `config` | INVOKE `config-orchestration` skill | Configuration management operations |

### Handler Details

**Skill-handled namespaces** (`local-env`, `config`): Load the orchestration skill via `techpacks.loadSkill` and pass the action and args. The skill handles argument validation, sub-help display, and execution.

**Pass-through namespaces** (`database`, `contract`): Execute directly via the tech system CLI:

```bash
<tech-pack-root>/system/system-run.sh <namespace> <action> <args>
```

### Skill Paths

| Skill Name | Path (relative to tech pack root) |
|------------|-----------------------------------|
| `local-env-orchestration` | `skills/orchestrators/local-env-orchestration/SKILL.md` |
| `config-orchestration` | `skills/orchestrators/config-orchestration/SKILL.md` |

### Tech System CLI Path

```
<tech-pack-root>/system/system-run.sh
```

Where `<tech-pack-root>` is the absolute path to the tech pack directory, resolved by the techpacks gateway via `techpacks.resolvePath`.

---

## Destructive Actions Table

Actions that destroy data or remove deployments. The `sdd-run` command checks this table before execution and requires explicit user confirmation.

| Command | Level | What it affects |
|---------|-------|-----------------|
| `database teardown` | destructive | Removes the database and all associated resources permanently |
| `database reset` | destructive | Drops and recreates the database from scratch — all data is lost |
| `database seed` | caution | Overwrites existing seed data — existing records may be replaced |
| `local-env destroy` | destructive | Deletes the local Kubernetes cluster and all resources within it |
| `local-env undeploy` | caution | Removes deployed applications from the cluster — databases persist |

### Confirmation Format

For destructive and caution actions, display a warning before executing:

```
<warning_level> <LEVEL>: <action description>

This will <specific consequence>.

Target: <component or cluster being affected>
Environment: <env if applicable>

Confirm? (yes/no)
```

---

## Sub-Help: `database`

When `/sdd-run database` is invoked without an action, display:

```
/sdd-run database — PostgreSQL database lifecycle management

USAGE:
  /sdd-run database <action> <name> [options]

ACTIONS:
  setup          Initialize schema, run migrations, and seed
  migrate        Run pending database migrations
  seed           Populate database with seed data                     caution
  reset          Drop and recreate database from scratch              destructive
  teardown       Remove database and all associated resources         destructive
  psql           Open interactive PostgreSQL shell
  port-forward   Forward local port to database pod in Kubernetes

REQUIRED:
  <name>         Database component name (from sdd-settings.yaml)

OPTIONS:
  --env <env>    Target environment (default: local)

EXAMPLES:
  /sdd-run database setup main-db
  /sdd-run database migrate main-db --env staging
  /sdd-run database psql main-db
  /sdd-run database reset main-db
```

## Sub-Help: `contract`

When `/sdd-run contract` is invoked without an action, display:

```
/sdd-run contract — OpenAPI contract management

USAGE:
  /sdd-run contract <action> <name>

ACTIONS:
  generate-types   Generate TypeScript types from OpenAPI spec
  validate         Validate OpenAPI spec for correctness

REQUIRED:
  <name>           Contract component name (from sdd-settings.yaml)

EXAMPLES:
  /sdd-run contract generate-types main-api
  /sdd-run contract validate main-api
```

## Sub-Help: `config`

When `/sdd-run config` is invoked without an action, the `config-orchestration` skill displays its own sub-help. See `skills/orchestrators/config-orchestration/SKILL.md`.

## Sub-Help: `local-env`

When `/sdd-run local-env` is invoked without an action, the `local-env-orchestration` skill displays its own sub-help. See `skills/orchestrators/local-env-orchestration/SKILL.md`.

---

## Namespace Mapping Note

The `local-env` namespace is the **user-facing** name. The `local-env-orchestration` skill maps this to the `env` namespace when calling the system CLI:

- User runs: `/sdd-run local-env create`
- Orchestrator executes: `<tech-pack-root>/system/system-run.sh env create`

This mapping is handled inside the `local-env-orchestration` skill, not in this router.

---

## Routing Logic

When the techpacks gateway invokes this router:

1. **Parse the context block** — extract `command`, `namespace`, and `args`.

2. **Extract the namespace** — the first word of the command (e.g., `database` from `database setup`).

3. **Check the Dispatch Table** — find the handler for the namespace.

4. **If skill-handled** — load the orchestration skill and pass the action and args to it.

5. **If pass-through** — check the Destructive Actions Table first. If the command matches a destructive or caution action, require confirmation before executing. Then run the system CLI command.

6. **If namespace not found** — return an error indicating the namespace is not supported by this tech pack.
