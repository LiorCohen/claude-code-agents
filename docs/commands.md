# SDD Commands

<!--
This file is maintained by the docs-writer agent.
To update, invoke the docs-writer agent with your changes.
-->

> Reference for all SDD slash commands.

## /sdd-init

Initialize a new SDD project.

```
/sdd-init --name <project-name> [--spec <path>]
```

**Arguments:**
- `--name` (required) - Your project name
- `--spec` (optional) - Path to an external spec to import

**What it does:**
1. Runs interactive product discovery
2. Recommends components based on your needs
3. Creates project structure after your approval
4. Populates domain glossary and definitions

**Example:**
```
/sdd-init --name inventory-tracker
```

---

## /sdd-new-change

Start a new feature, bugfix, refactor, or epic.

```
/sdd-new-change --type <type> --name <name>
```

**Arguments:**
- `--type` (required) - One of: `feature`, `bugfix`, `refactor`, `epic`
- `--name` (required) - Short identifier for the change

**What it does:**
1. Collects information about the change
2. Creates a spec (`SPEC.md`) with acceptance criteria
3. Creates an implementation plan (`PLAN.md`)
4. Places files in `specs/changes/YYYY/MM/DD/<name>/`

**Example:**
```
/sdd-new-change --type feature --name user-preferences
```

---

## /sdd-implement-change

Execute an implementation plan.

```
/sdd-implement-change <change-dir>
```

**Arguments:**
- `<change-dir>` (required) - Path to the change directory containing `PLAN.md`

**What it does:**
1. Reads the implementation plan
2. Executes each phase using specialized agents
3. Runs tests as specified in the plan

**Example:**
```
/sdd-implement-change specs/changes/2026/01/15/user-preferences
```

---

## /sdd-verify-change

Verify implementation matches the spec.

```
/sdd-verify-change <change-dir>
```

**Arguments:**
- `<change-dir>` (required) - Path to the change directory containing `SPEC.md`

**What it does:**
1. Reads the spec and acceptance criteria
2. Reviews the implemented code
3. Reports any discrepancies

**Example:**
```
/sdd-verify-change specs/changes/2026/01/15/user-preferences
```

---

## Next Steps

- [Getting Started](getting-started.md) - First project tutorial
- [Workflows](workflows.md) - How to use these commands together
- [Agents](agents.md) - The specialized agents behind the commands
