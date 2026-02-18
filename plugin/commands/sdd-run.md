---
name: sdd-run
description: Explicit command with namespaced subcommands covering all SDD functionality.
---

# /sdd-run

The explicit command for all SDD operations. Each namespace maps to a specific domain — use this when you know exactly what you want to do.

## Usage

```
/sdd-run <namespace> <action> [args] [options]
```

## Global Options

| Option | Description |
|--------|-------------|
| `--json` | Output in JSON format |
| `--verbose` | Enable verbose logging |
| `--help` | Show help for namespace/action |

---

## When Called Without Arguments (or with `help`)

When invoked without a namespace, or with `help`, display the full namespace reference:

```
SDD Run — Explicit command interface

USAGE:
  /sdd-run <namespace> <action> [args] [options]

NAMESPACES:
  change        Manage the full change lifecycle (create, approve, implement, verify)
  init          Initialize or upgrade an SDD project
  local-env     Manage local Kubernetes development environments
  database      Manage PostgreSQL databases across environments
  contract      Validate OpenAPI specifications
  config        Manage project configuration across environments
  permissions   Configure Claude Code permissions for SDD
  version       Show installed and project plugin versions

GLOBAL OPTIONS:
  --json        Output in JSON format
  --verbose     Enable verbose logging
  --help        Show help for namespace/action

EXAMPLES:
  /sdd-run change create --type feature --name user-auth
  /sdd-run init
  /sdd-run local-env create
  /sdd-run database setup my-db --env local
  /sdd-run config generate --env production
  /sdd-run version

TIP: Use /sdd for guided, context-aware assistance.
     Use /sdd-help to learn SDD concepts and methodology.
```

---

## Pre-Execution Checks

Two checks run **before executing any namespace**: argument validation and destructive action confirmation.

### Argument Validation — Sub-Help

Validate that sufficient arguments are provided. If not, display the namespace-specific sub-help instead of running the command.

**Rules:**
1. **No namespace** → show the full namespace reference (above)
2. **Namespace provided, action missing** → show that namespace's sub-help
3. **Namespace + action provided, required args missing** → show action-specific help

For **orchestrated namespaces** (change, init, config, version, local-env), the orchestrator skill handles insufficient arguments — INVOKE the skill and let it display its own sub-help.

For **pass-through namespaces** (database, contract, permissions), validate arguments **before** calling `system-run.sh`. Display the sub-help blocks defined in each namespace section below.

### Destructive Action Confirmation

Some actions destroy data, remove deployments, or reset progress. These **must not execute without explicit user authorization**.

**Severity levels:**

| Level | Meaning | Required |
|-------|---------|----------|
| `🔴 destructive` | Irreversible data loss or removal | Warning + explicit "yes" confirmation |
| `🟡 caution` | Overwrites data or resets progress, but recoverable | Warning + confirmation |

**Destructive actions:**

| Namespace | Action | Level | What it affects |
|-----------|--------|-------|-----------------|
| `database` | `teardown` | 🔴 | Removes PostgreSQL deployment and all its data from k8s |
| `database` | `reset` | 🔴 | Tears down, rebuilds, and re-seeds — all existing data is lost |
| `database` | `seed` | 🟡 | Runs seed SQL files — typically TRUNCATE tables before inserting |
| `local-env` | `destroy` | 🔴 | Deletes the entire local k8s cluster and all workloads |
| `local-env` | `undeploy` | 🟡 | Removes deployed applications from the cluster (infra persists) |
| `change` | `regress` | 🟡 | Rolls workflow back to an earlier phase — plan or implementation work is archived but progress is reset |
| `change` | `request-changes` | 🟡 | Resets implementation status from complete to in-progress, requiring rework |

**Warning format:**

```
⚠ <LEVEL>: <action description>

This will <specific consequence>.

Target: <component/cluster/change being affected>
Environment: <env if applicable>

Confirm? (yes/no)
```

**NEVER** skip this confirmation, even if the user seems to expect immediate execution. The cost of accidental data loss far outweighs the friction of one confirmation prompt.

---

## Namespace Routing

### `change` — Manage the full change lifecycle

Route to the change-orchestration skill:

```yaml
INVOKE change-orchestration skill with:
  action: <action>
  args: <remaining args>
```

**Actions:** `create`, `status`, `continue`, `list`, `approve spec`, `approve plan`, `plan`, `implement`, `verify`, `review`, `answer`, `assume`, `regress`, `request-changes`

**When to use:** You're building a feature, fixing a bug, or refactoring — any work that follows the spec-driven lifecycle. This is the primary namespace most users interact with.

**Scenario:** You've been asked to add user authentication. You create a change (`change create --type feature --name user-auth`), iterate on the spec with your stakeholder, approve it (`change approve spec user-auth-1`), plan the implementation (`change plan user-auth-1`), approve the plan, implement, verify, and review. If open questions come up during spec review, you answer them (`change answer user-auth-1 O1 "Use JWT tokens"`). If the spec needs rework after planning, you regress (`change regress user-auth-1 --to soliciting`).

---

### `init` — Initialize or upgrade an SDD project

Route to the init-orchestration skill:

```yaml
INVOKE init-orchestration skill
```

No arguments — runs the full 6-phase workflow.

**When to use:** You're starting a new project from scratch, or you've upgraded the plugin and need to reconcile settings with the new version.

**Scenario:** You create a new directory for your project, open Claude Code, and run `/sdd-run init`. It detects the project name, verifies your environment (tools, permissions), scaffolds the minimal config structure, and commits. On an existing project after a plugin upgrade, it detects the version mismatch, reconciles settings, and reports what changed.

---

### `local-env` — Manage local Kubernetes development environments

Route to the local-env-orchestration skill:

```yaml
INVOKE local-env-orchestration skill with:
  action: <action>
  args: <remaining args>
```

**Actions:** `create`, `destroy`, `start`, `stop`, `status`, `deploy`, `undeploy`, `forward`, `infra`

**When to use:** You need a local k8s cluster to test your application stack — databases, services, helm charts — as they'd run in production, but on your machine.

**Scenario:** You're ready to test your server with its database and dependencies. You create a cluster (`local-env create`), deploy everything (`local-env deploy`), then set up port forwards (`local-env forward start`) so your locally-running service can reach the in-cluster database. When done for the day, you stop the cluster (`local-env stop`) and resume tomorrow (`local-env start`).

---

### `database` — Manage PostgreSQL databases across environments

Pass-through to system CLI:

```bash
<plugin-root>/system/system-run.sh database <action> <component> [--env <env>] [args]
```

**Actions:** `setup`, `teardown`, `migrate`, `seed`, `reset`, `port-forward`, `psql`

**When to use:** You need to set up, migrate, seed, reset, or connect to a database. The `--env` flag specifies which environment's database you're targeting.

**Scenario:** You've added a new migration file. You run `database migrate my-db --env local` to apply it locally. To verify the seed data, you open a shell with `database psql my-db --env local`. Before a demo, you reset everything clean with `database reset my-db --env local`. To debug a staging issue, you port-forward the staging database: `database port-forward my-db --env staging`.

#### Sub-help: no action provided

When invoked as `/sdd-run database` without an action, display:

```
/sdd-run database — Manage PostgreSQL databases

USAGE:
  /sdd-run database <action> <component> [--env <env>] [options]

ACTIONS:
  setup         Deploy PostgreSQL to local k8s cluster
  teardown      Remove PostgreSQL deployment from k8s          🔴 destructive
  migrate       Run all pending database migrations
  seed          Seed database with initial data                🟡 caution
  reset         Full reset (teardown + setup + migrate + seed) 🔴 destructive
  port-forward  Forward database port to localhost:5432
  psql          Open interactive PostgreSQL shell

REQUIRED:
  <component>   Name of the database component (e.g., my-db)

OPTIONS:
  --env <env>   Target environment (default: local)

EXAMPLES:
  /sdd-run database setup my-db
  /sdd-run database migrate my-db --env local
  /sdd-run database psql my-db
  /sdd-run database reset my-db --env staging
```

#### Sub-help: action provided but component missing

When invoked as `/sdd-run database <action>` without a component name, display:

```
⚠ Missing required <component> argument.

USAGE:
  /sdd-run database <action> <component> [--env <env>]

The <component> is the name of your database component as defined in
sdd-settings.yaml (e.g., my-db, users-db, analytics-db).

EXAMPLE:
  /sdd-run database <action> my-db --env local
```

(Replace `<action>` with the actual action the user typed.)

---

### `contract` — Validate OpenAPI specifications

Pass-through to system CLI:

```bash
<plugin-root>/system/system-run.sh contract validate <component>
```

**Actions:** `validate`

**When to use:** You've modified an API contract and want to verify it's valid before generating types or deploying.

**Scenario:** You've added a new endpoint to your OpenAPI spec. You run `contract validate my-api` to check for schema errors, missing references, or invalid patterns before the types get generated.

#### Sub-help: no action provided

When invoked as `/sdd-run contract` without an action, display:

```
/sdd-run contract — Validate OpenAPI specifications

USAGE:
  /sdd-run contract <action> <component> [options]

ACTIONS:
  validate      Validate OpenAPI spec using Spectral linter

REQUIRED:
  <component>   Name of the contract component (e.g., my-api)

OPTIONS:
  --spec <path>   Override spec file path (default: components/<component>/openapi.yaml)

EXAMPLES:
  /sdd-run contract validate my-api
  /sdd-run contract validate my-api --spec ./api.yml
```

#### Sub-help: action provided but component missing

When invoked as `/sdd-run contract validate` without a component name, display:

```
⚠ Missing required <component> argument.

USAGE:
  /sdd-run contract validate <component> [--spec <path>]

The <component> is the name of your contract component as defined in
sdd-settings.yaml (e.g., my-api, internal-api).

EXAMPLE:
  /sdd-run contract validate my-api
```

---

### `config` — Manage project configuration across environments

Route to the config-orchestration skill:

```yaml
INVOKE config-orchestration skill with:
  operation: <operation>
  args: <remaining args>
```

**Operations:** `generate`, `validate`, `diff`, `add-env`

**When to use:** You're working with environment-specific config — generating merged configs, validating them, comparing environments, or adding new environments.

**Scenario:** You've added a new service and need config for it. You add a staging environment (`config add-env staging`), generate the merged config (`config generate --env staging`), then diff it against production to verify the differences are intentional (`config diff staging production`). Before deploying, you validate all environments (`config validate`).

---

### `permissions` — Configure Claude Code permissions for SDD

Pass-through to system CLI:

```bash
<plugin-root>/system/system-run.sh permissions configure
```

**Actions:** `configure`

**When to use:** After installing or upgrading the plugin, you need to set up the recommended permissions so SDD commands can run without constant approval prompts.

**Scenario:** You've just initialized a project and the init workflow offered to configure permissions. You declined then, but now you want them: `permissions configure`. It merges SDD's recommended permissions into `.claude/settings.local.json`. You restart your session for them to take effect.

#### Sub-help: no action provided

When invoked as `/sdd-run permissions` without an action, display:

```
/sdd-run permissions — Configure Claude Code permissions for SDD

USAGE:
  /sdd-run permissions <action>

ACTIONS:
  configure     Merge SDD recommended permissions into .claude/settings.local.json

WHAT IT DOES:
  Reads the plugin's recommended permissions, merges them into your
  local settings (creating a backup first), and reports what changed.
  Restart your Claude Code session for changes to take effect.

EXAMPLE:
  /sdd-run permissions configure
```

---

### `version` — Show installed and project plugin versions

Route to the version-orchestration skill:

```yaml
INVOKE version-orchestration skill
```

No arguments — displays version info.

**When to use:** You want to check if your project is up to date with the installed plugin, or diagnose version mismatches.

**Scenario:** Your team reports that a command isn't working as expected. You run `version` and see the project was last reconciled with v6.2.0 but the installed plugin is v7.0.0. The output tells you to run `/sdd-run init` to reconcile.

---

## Internal Namespaces

The following namespaces are used internally by other skills and should not be invoked directly by users. They are NOT shown in the help output:

- `scaffolding` - Used by init-orchestration for project setup
- `spec` - Used for spec validation, indexing, and snapshots
- `hook` - Hook handlers for internal use
- `contract generate-types` - Invoked automatically during implementation plans
- `settings` - Used internally by the `project-settings` skill
- `workflow` - Workflow state management
- `archive` - Archive storage management

## Execution

For pass-through namespaces (database, contract, permissions), execute:

```bash
<plugin-root>/system/system-run.sh <namespace> <action> [args] [options]
```

Where `<plugin-root>` is the plugin's absolute path, resolved by the agent from its Claude Code plugin context.

For orchestrated namespaces (change, init, config, version, local-env), INVOKE the corresponding orchestrator skill which may internally call `system-run.sh`.

**Note:** The system CLI uses `env` as the namespace name; the `local-env` orchestrator maps `local-env` (user-facing) → `env` (system CLI).
