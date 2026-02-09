# SDD Commands

<!--
This file is maintained by the docs-writer agent.
To update, invoke the docs-writer agent with your changes.
-->

> Reference for all SDD slash commands.

## /sdd-init

Initialize a new SDD project with minimal structure.

```
/sdd-init
```

**No arguments required.** Project name is derived from the current directory.

**What it does:**
1. Detects project name from current directory
2. Verifies environment (required tools, plugin, permissions)
3. Asks about planned components (informational only)
4. Creates minimal structure (config component only)
5. Initializes git and commits

**What it does NOT do (deferred to implementation):**
- Domain population (glossary, entity definitions, use-cases)
- Full component scaffolding

**Example:**
```bash
cd inventory-tracker
/sdd-init
```

---

## /sdd-change

Unified command for managing change workflows. All state is persisted in `.sdd/workflows/`.

### Subcommands

#### /sdd-change new

Start a new feature, bugfix, refactor, epic, or import from an external spec.

```
/sdd-change new --type <type> --name <name>
/sdd-change new --spec <path>
```

**Arguments:**
- `--type` (required without `--spec`) - One of: `feature`, `bugfix`, `refactor`, `epic`
- `--name` (required without `--spec`) - Short identifier for the change
- `--spec` (alternative mode) - Path to external specification file

**What it does:**

*Interactive mode (`--type` and `--name`):*
1. Creates a workflow in `.sdd/workflows/<workflow-id>/`
2. Runs guided requirements gathering (solicitation)
3. Recommends affected components
4. **Scaffolds components on-demand** (if not yet scaffolded)
5. Updates domain glossary with new entities
6. Creates a spec (`SPEC.md`) with Domain Model and Specs Directory Changes sections
7. Status becomes `spec_review` - awaiting approval

*External spec mode (`--spec`):*
1. Archives spec to `.sdd/archive/external-specs/`
2. Analyzes with thinking step (domain extraction, gap analysis)
3. Creates workflow items with context files
4. Status becomes `spec_review` for each item

**Examples:**
```bash
# Interactive mode
/sdd-change new --type feature --name user-preferences

# From external spec
/sdd-change new --spec /path/to/requirements.md
```

---

#### /sdd-change status

Show current workflow status.

```
/sdd-change status
```

**What it shows:**
- Active workflow ID and current item
- Workflow status (spec_review, plan_review, implementing, etc.)
- Items pending, in progress, and completed
- Next action to take

---

#### /sdd-change continue

Resume the current workflow from where you left off.

```
/sdd-change continue
```

**What it does:**
1. Reads workflow state from `.sdd/workflows/<workflow-id>/workflow.yaml`
2. Determines current status and next action
3. Continues from that point (spec solicitation, plan review, implementation, etc.)

---

#### /sdd-change list

List all active workflows.

```
/sdd-change list
```

---

#### /sdd-change approve spec

Approve a spec and create an implementation plan.

```
/sdd-change approve spec <change-id>
```

**What it does:**
1. Validates the spec is complete
2. Creates `PLAN.md` with implementation phases
3. Advances status to `plan_review`

---

#### /sdd-change approve plan

Approve a plan and enable implementation.

```
/sdd-change approve plan <change-id>
```

**What it does:**
1. Validates the plan is complete
2. Advances status to `plan_approved`
3. Implementation can now begin

---

#### /sdd-change implement

Execute an approved implementation plan.

```
/sdd-change implement <change-id>
```

**What it does:**
1. Creates a feature branch
2. Executes each phase using specialized agents
3. Creates checkpoint commits after each phase
4. Runs tests as specified in the plan

---

#### /sdd-change verify

Verify implementation matches the spec.

```
/sdd-change verify <change-id>
```

**What it does:**
1. Reads the spec and acceptance criteria
2. Reviews the implemented code
3. Reports any discrepancies
4. Advances status to `complete` on success

---

## /sdd-config

Manage project configuration.

```
/sdd-config <operation> [options]
```

**Operations:**
- `generate` - Generate merged config for an environment
- `validate` - Validate config against schemas
- `diff` - Show differences between environments
- `add-env` - Add a new environment

**Examples:**
```bash
# Generate config for local development
/sdd-config generate --env local --component server-task-service --output ./local-config.yaml

# Validate all environments
/sdd-config validate

# Compare local vs production
/sdd-config diff local production

# Add staging environment
/sdd-config add-env staging
```

See [Configuration Guide](config-guide.md) for detailed usage.

---

## /sdd-run

Manage your local development environment and validate artifacts.

```
/sdd-run <namespace> <action> [args] [options]
```

**When to use:** While workflow commands (`/sdd-init`, `/sdd-change`, etc.) orchestrate multi-step processes with agents, `/sdd-run` gives you direct control over local dev operations—spinning up databases, running migrations, or validating your API contract.

### Database Operations

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

### Contract Validation

Validate your OpenAPI specification:

```bash
# Validate the API contract
/sdd-run contract validate my-api
```

### Permission Management

Configure Claude Code permissions for SDD:

```bash
# Merge SDD recommended permissions into your settings
/sdd-run permissions configure
```

**Global Options:**
- `--json` - Output in JSON format
- `--verbose` - Enable verbose logging
- `--help` - Show help for namespace/action

---

## /sdd-version

Show the installed plugin version and the project's plugin version, highlighting when the project is outdated.

```
/sdd-version
```

**No arguments required.**

**What it shows:**
- The installed SDD plugin version (from `plugin.json`)
- The project's plugin version (from `.sdd/sdd-settings.yaml`)
- Whether the project is up to date, outdated, or newer than the installed plugin

**Example output (versions match):**
```
SDD Plugin

  Installed:  6.5.0
  Project:    6.5.0  ✓ match
```

**Example output (project outdated):**
```
SDD Plugin

  Installed:  6.5.0
  Project:    6.2.0  ⚠ outdated

The project was created with an older plugin version.
Run /sdd-init to upgrade project settings and repair any drift.
```

---

## Next Steps

- [Getting Started](getting-started.md) - First project tutorial
- [Workflows](workflows.md) - How to use these commands together
- [Agents](agents.md) - The specialized agents behind the commands
- [Configuration Guide](config-guide.md) - Config system details
