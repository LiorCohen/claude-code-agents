# SDD Commands

<!--
This file is maintained by the docs-writer agent.
To update, invoke the docs-writer agent with your changes.
-->

> Reference for all SDD slash commands.

SDD has three commands:

| Command | Purpose |
|---------|---------|
| `/sdd` | The hub — context-aware entry point for all workflows |
| `/sdd-run` | Direct access to namespaced system CLI operations |
| `/sdd-help` | Interactive tutor for learning SDD concepts |

---

## /sdd

The main entry point for all SDD workflows. Context-aware — it reads your project state and guides you to the right action.

### No Arguments (Context-Aware)

```
/sdd
```

When invoked without arguments, `/sdd` reads your current project state and determines what to do:
- If no project exists, offers to initialize one
- If a workflow is active, shows status and suggests the next action
- If no workflow is active, asks what you'd like to do

### Natural Language Prompts

Tell `/sdd` what you want in plain English:

#### Project Initialization

```
/sdd I want to initialize a new project
```

Creates a new SDD project with minimal structure. Project name is derived from the current directory.

**What it does:**
1. Detects project name from current directory
2. Verifies environment (required tools, plugin, permissions)
3. Asks about planned components (informational only)
4. Creates minimal structure (config component only)
5. Initializes git and commits

**Example:**
```bash
cd inventory-tracker
claude
/sdd I want to initialize a new project
```

#### Creating Changes

```
/sdd I want to create a new feature
```

Starts a new feature workflow. SDD guides you through requirements gathering (solicitation), recommends affected components, scaffolds components on-demand, updates the domain glossary, and creates a spec (`SPEC.md`).

Also works for other change types:
```
/sdd I want to create a bugfix
/sdd I want to create a refactor
/sdd I want to create an epic
```

#### Importing External Specs

```
/sdd I want to import an external spec
```

Imports an external product specification document and transforms it into SDD tech specs. Archives the original, analyzes gaps, asks clarifying questions, and decomposes into epics and features.

#### Spec and Plan Approval

```
/sdd I want to approve the spec
/sdd I want to approve the plan
```

Approving a spec validates it and creates an implementation plan (`PLAN.md`). Approving a plan enables implementation.

#### Planning and Implementation

```
/sdd I want to start planning
/sdd I want to start implementing
```

Planning creates `PLAN.md` files for approved specs. Implementation creates a feature branch and executes each phase using specialized agents, with checkpoint commits after each phase.

#### Verification and Review

```
/sdd I want to verify the implementation
/sdd I want to submit for review
```

Verification checks that implementation matches the spec and acceptance criteria. Review submits the implementation for user review.

#### Continuing Work

```
/sdd I want to continue
```

Resumes the current workflow from where you left off. Reads workflow state and determines the next action.

#### Open Questions

```
/sdd I want to answer an open question
```

Answers or assumes open questions that block spec approval. SDD will ask which question and what the answer is.

#### Regression and Changes

```
/sdd I want to go back to the spec phase
/sdd I want to request changes
```

Regression archives discarded work and moves back to an earlier phase. Requesting changes during review sends the implementation back for revision.

#### Listing Changes

```
/sdd I want to list my changes
```

Lists all active workflows and their statuses.

#### Configuration

```
/sdd I want to generate config for local
/sdd I want to validate my config
/sdd I want to compare local and production config
/sdd I want to add a staging environment
```

Manages project configuration — generating merged configs, validating against schemas, comparing environments, and adding new environments.

#### Version

```
/sdd What version am I running?
```

Shows the installed plugin version, the project's current plugin version, and whether the project is up to date.

---

## /sdd-run

Direct access to namespaced system CLI operations. Use this when you need explicit control over specific operations.

```
/sdd-run <namespace> <action> [args] [options]
```

### Namespaces

#### database

Manage local PostgreSQL databases:

```bash
/sdd-run database setup <name>          # Start a local database
/sdd-run database migrate <name>        # Run migrations
/sdd-run database seed <name>           # Seed with test data
/sdd-run database reset <name>          # Teardown + setup + migrate + seed
/sdd-run database psql <name>           # Open psql shell
/sdd-run database port-forward <name>   # Port forward remote database
/sdd-run database teardown <name>       # Tear down database
```

#### contract

Validate API specifications:

```bash
/sdd-run contract validate <name>       # Validate OpenAPI spec
```

#### permissions

Configure Claude Code permissions for SDD:

```bash
/sdd-run permissions configure          # Merge SDD recommended permissions
```

#### config

Configuration operations:

```bash
/sdd-run config generate --env <env> --component <name> --output <path>
/sdd-run config validate [--env <env>]
/sdd-run config diff <env-a> <env-b>
/sdd-run config add-env <name>
```

#### workflow

Workflow state operations:

```bash
/sdd-run workflow status                # Show workflow status
/sdd-run workflow list                  # List all workflows
```

#### scaffold

Component scaffolding:

```bash
/sdd-run scaffold <component-type> <name>   # Scaffold a component
```

#### domain

Domain management:

```bash
/sdd-run domain glossary                # Show domain glossary
```

#### version

Version information:

```bash
/sdd-run version                        # Show plugin version info
```

### Global Options

- `--json` - Output in JSON format
- `--verbose` - Enable verbose logging
- `--help` - Show help for namespace/action

---

## /sdd-help

Interactive tutor for learning SDD concepts and getting help.

```
/sdd-help
```

Ask questions about SDD in natural language:

```
/sdd-help What is a spec?
/sdd-help How do I create a feature?
/sdd-help What agents are available?
/sdd-help How does config work?
```

**What it does:**
- Answers questions about SDD concepts, workflows, and commands
- Provides examples and guidance
- Links to relevant documentation

---

## Next Steps

- [Getting Started](getting-started.md) - First project tutorial
- [Workflows](workflows.md) - How to use these commands together
- [Agents](agents.md) - The specialized agents behind the commands
- [Configuration Guide](config-guide.md) - Config system details
