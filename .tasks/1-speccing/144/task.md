---
id: 144
title: "Three-command structure: /sdd + /sdd-run + /sdd-help"
status: speccing
priority: null
created: 2026-02-15
---

# Three-command structure: /sdd + /sdd-run + /sdd-help

## Description

Redesign the plugin's user-facing command surface from 6 separate commands (`sdd-change`, `sdd-config`, `sdd-init`, `sdd-run`, `sdd-settings`, `sdd-version`) into 3 commands with distinct personas:

1. **`/sdd-help`** — A tutor that introduces SDD to novices, explains concepts, and guides discovery of what's possible. Addresses the unknown-unknowns problem: users who don't yet know what questions to ask.
2. **`/sdd`** — A context-aware workflow assistant ("Jarvis") that reads project state, suggests the next step, and accepts direction. Knows about both `/sdd-help` and `/sdd-run` and refers users to them when appropriate.
3. **`/sdd-run`** — A kubectl-style explicit command with namespaced subcommands covering all functionality. The concrete command where work gets done.

These map to a natural learning curve: **learn → guided → direct**.

`/sdd` is the hub — it's aware of the other two commands and cross-references them. If a novice asks `/sdd` something foundational, it refers them to `/sdd-help`. If a user wants to do something specific, it shows them the `/sdd-run` equivalent.

## Motivation

The current 6-command surface creates friction:
- Users must remember which command handles which concern (`sdd-config` vs `sdd-settings` vs `sdd-run`)
- Some commands (`sdd-config`, `sdd-settings`) are operator-level — users rarely invoke them directly
- No unified entry point that understands "where am I?" and guides the user
- Complete novices have no way to discover what SDD can do — they have unknown unknowns

The three-command model provides:
- A tutor (`/sdd-help`) for users who need to learn what's possible before they can ask the right questions
- A workflow guide (`/sdd`) for users who know the tool and want context-aware next-step guidance
- A power tool (`/sdd-run`) for users who know exactly what they want
- A clean, discoverable namespace hierarchy instead of 6 flat commands

## Scope

### `/sdd-run` — Explicit command

Absorbs all current functionality under namespaced subcommands. Complete mapping:

| Namespace | Action | Old Command | New Command | Change |
|-----------|--------|-------------|-------------|--------|
| `change` | `new [--type <type>] [--spec <path>]` | `/sdd-change new` | `/sdd-run change new` | Renamed |
| `change` | `status [<change-id>]` | `/sdd-change status` | `/sdd-run change status` | Renamed + optional change-id arg |
| `change` | `continue <change-id>` | `/sdd-change continue` | `/sdd-run change continue` | Renamed + added change-id arg |
| `change` | `list` | `/sdd-change list` | `/sdd-run change list` | Renamed |
| `change` | `approve spec <change-id>` | `/sdd-change approve spec` | `/sdd-run change approve spec` | Renamed |
| `change` | `approve plan <change-id>` | `/sdd-change approve plan` | `/sdd-run change approve plan` | Renamed |
| `change` | `plan <change-id>` | `/sdd-change plan` | `/sdd-run change plan` | Renamed + added change-id arg |
| `change` | `implement <change-id>` | `/sdd-change implement` | `/sdd-run change implement` | Renamed |
| `change` | `verify <change-id>` | `/sdd-change verify` | `/sdd-run change verify` | Renamed |
| `change` | `review <change-id>` | `/sdd-change review` | `/sdd-run change review` | Renamed |
| `change` | `answer <change-id> <q-id> "<answer>"` | `/sdd-change answer` | `/sdd-run change answer` | Renamed + added change-id arg |
| `change` | `assume <change-id> <q-id> "<assumption>"` | `/sdd-change assume` | `/sdd-run change assume` | Renamed + added change-id arg |
| `change` | `regress <change-id> --to <phase>` | `/sdd-change regress` | `/sdd-run change regress` | Renamed |
| `change` | `request-changes <change-id>` | `/sdd-change request-changes` | `/sdd-run change request-changes` | Renamed |
| `init` | *(no action — runs full workflow)* | `/sdd-init` | `/sdd-run init` | Renamed |
| `local-env` | `create [--name] [--provider] [--skip-infra]` | `/sdd-run env create` | `/sdd-run local-env create` | Namespace renamed |
| `local-env` | `destroy [--name]` | `/sdd-run env destroy` | `/sdd-run local-env destroy` | Namespace renamed |
| `local-env` | `start [--name]` | `/sdd-run env start` | `/sdd-run local-env start` | Namespace renamed |
| `local-env` | `stop [--name]` | `/sdd-run env stop` | `/sdd-run local-env stop` | Namespace renamed |
| `local-env` | `status [--name]` | `/sdd-run env status` | `/sdd-run local-env status` | Namespace renamed |
| `local-env` | `deploy [chart] [--namespace] [--skip-db] [--skip-migrate] [--exclude]` | `/sdd-run env deploy` | `/sdd-run local-env deploy` | Namespace renamed |
| `local-env` | `undeploy [chart] [--namespace]` | `/sdd-run env undeploy` | `/sdd-run local-env undeploy` | Namespace renamed |
| `local-env` | `forward [start\|stop\|list] [--namespace]` | `/sdd-run env forward` | `/sdd-run local-env forward` | Namespace renamed |
| `local-env` | `infra [--reinstall]` | `/sdd-run env infra` | `/sdd-run local-env infra` | Namespace renamed |
| `database` | `setup <component> --env <env>` | `/sdd-run database setup` | `/sdd-run database setup` | Added --env |
| `database` | `teardown <component> --env <env>` | `/sdd-run database teardown` | `/sdd-run database teardown` | Added --env |
| `database` | `migrate <component> --env <env>` | `/sdd-run database migrate` | `/sdd-run database migrate` | Added --env |
| `database` | `seed <component> --env <env>` | `/sdd-run database seed` | `/sdd-run database seed` | Added --env |
| `database` | `reset <component> --env <env>` | `/sdd-run database reset` | `/sdd-run database reset` | Added --env |
| `database` | `port-forward <component> --env <env>` | `/sdd-run database port-forward` | `/sdd-run database port-forward` | Added --env |
| `database` | `psql <component> --env <env>` | `/sdd-run database psql` | `/sdd-run database psql` | Added --env |
| `contract` | `validate <component>` | `/sdd-run contract validate` | `/sdd-run contract validate` | Unchanged |
| `config` | `generate --env <env> [--component <name>]` | `/sdd-config generate` | `/sdd-run config generate` | Renamed |
| `config` | `validate [--env <env>]` | `/sdd-config validate` | `/sdd-run config validate` | Renamed |
| `config` | `diff <env1> <env2>` | `/sdd-config diff` | `/sdd-run config diff` | Renamed |
| `config` | `add-env <env-name>` | `/sdd-config add-env` | `/sdd-run config add-env` | Renamed |
| `permissions` | `configure` | `/sdd-run permissions configure` | `/sdd-run permissions configure` | Unchanged |
| `version` | *(no action — displays version info)* | `/sdd-version` | `/sdd-run version` | Renamed |
| `help` | *(no action — lists all namespaces)* | *(new)* | `/sdd-run help` | New |

When invoked with no arguments (`/sdd-run`): shows help — lists all namespaces and their subcommands.

**Global options** (preserved from current sdd-run): `--json`, `--verbose`, `--help`.

**Execution model**: Each namespace+action maps to `system-run.sh <namespace> <action> [args] [options]` — same as current sdd-run. The new sdd-run.md preserves this execution section.

#### Namespace documentation

Each namespace must include: a description, when to use it, and a concrete usage scenario showing the command in context.

**`change`** — Manage the full change lifecycle: create, spec, plan, implement, verify, review.
When to use: You're building a feature, fixing a bug, or refactoring — any work that follows the spec-driven lifecycle. This is the primary namespace most users interact with.
Scenario: You've been asked to add user authentication. You create a change (`change new --type feature`), iterate on the spec with your stakeholder, approve it (`change approve spec C1`), plan the implementation (`change plan C1`), approve the plan, implement, verify, and review. If open questions come up during spec review, you answer them (`change answer C1 O1 "Use JWT tokens"`). If the spec needs rework after planning, you regress (`change regress C1 --to soliciting`).

**`init`** — Initialize or upgrade an SDD project.
When to use: You're starting a new project from scratch, or you've upgraded the plugin and need to reconcile settings with the new version.
Scenario: You create a new directory for your project, open Claude Code, and run `/sdd-run init`. It detects the project name, verifies your environment (tools, permissions), scaffolds the minimal config structure, and commits. On an existing project after a plugin upgrade, it detects the version mismatch, reconciles settings, and reports what changed.

**`local-env`** — Manage local Kubernetes development environments.
When to use: You need a local k8s cluster to test your application stack — databases, services, helm charts — as they'd run in production, but on your machine.
Scenario: You're ready to test your server with its database and dependencies. You create a cluster (`local-env create`), deploy everything (`local-env deploy`), then set up port forwards (`local-env forward start`) so your locally-running service can reach the in-cluster database. When done for the day, you stop the cluster (`local-env stop`) and resume tomorrow (`local-env start`).

**`database`** — Manage PostgreSQL databases across environments.
When to use: You need to set up, migrate, seed, reset, or connect to a database. The `--env` flag specifies which environment's database you're targeting.
Scenario: You've added a new migration file. You run `database migrate my-db --env local` to apply it locally. To verify the seed data, you open a shell with `database psql my-db --env local`. Before a demo, you reset everything clean with `database reset my-db --env local`. To debug a staging issue, you port-forward the staging database: `database port-forward my-db --env staging`.

**`contract`** — Validate OpenAPI specifications.
When to use: You've modified an API contract and want to verify it's valid before generating types or deploying.
Scenario: You've added a new endpoint to your OpenAPI spec. You run `contract validate my-api` to check for schema errors, missing references, or invalid patterns before the types get generated.

**`config`** — Manage project configuration across environments.
When to use: You're working with environment-specific config — generating merged configs, validating them, comparing environments, or adding new environments.
Scenario: You've added a new service and need config for it. You add a staging environment (`config add-env staging`), generate the merged config (`config generate --env staging`), then diff it against production to verify the differences are intentional (`config diff staging production`). Before deploying, you validate all environments (`config validate`).

**`permissions`** — Configure Claude Code permissions for SDD.
When to use: After installing or upgrading the plugin, you need to set up the recommended permissions so SDD commands can run without constant approval prompts.
Scenario: You've just initialized a project and the init workflow offered to configure permissions. You declined then, but now you want them: `permissions configure`. It merges SDD's recommended permissions into `.claude/settings.local.json`. You restart your session for them to take effect.

**`version`** — Show installed and project plugin versions.
When to use: You want to check if your project is up to date with the installed plugin, or diagnose version mismatches.
Scenario: Your team reports that a command isn't working as expected. You run `version` and see the project was last reconciled with v6.2.0 but the installed plugin is v7.0.0. The output tells you to run `/sdd-run init` to reconcile.

**Internal namespaces** (NOT user-facing, NOT shown in `/sdd-run help`): `scaffolding`, `spec`, `hook`, `contract generate-types`, `settings`. These are invoked internally by skills/commands via `system-run.sh` and remain unchanged. Settings was never user-facing — it is managed internally by the `project-settings` skill (invoked during init, change workflows, and by `/sdd` when users describe settings changes in natural language).

**Dispatcher architecture**: sdd-run.md does not inline all logic from the 6 old commands. Each namespace section uses INVOKE to delegate to skills. For simple namespaces (database, contract, config, permissions, version), sdd-run.md INVOKEs existing skills directly or inlines the logic (each action is a single `system-run.sh` call). For complex namespaces (change, init), sdd-run.md INVOKEs new **orchestrator skills** that hold the multi-step workflow logic previously in the deleted command files.

**Orchestrator skills** (`plugin/skills/orchestrators/`): New skills that capture the orchestration logic from deleted commands. These are not behavioral changes — they preserve the exact same workflows, just housed in skills instead of commands:
- `change-orchestration/SKILL.md` — Multi-step change lifecycle (from `sdd-change.md`'s 14 actions, phase gates, INVOKE chains)
- `init-orchestration/SKILL.md` — 6-phase init workflow (from `sdd-init.md`'s version check, env verification, scaffolding, git init)

Commands that are simple enough to not need an orchestrator skill:
- `sdd-config.md` — each action (generate, validate, diff, add-env) is a single `system-run.sh` call; inlined in sdd-run.md's `config` namespace
- `sdd-version.md` — version display logic is trivial, inlined in sdd-run.md's `version` namespace
- `sdd-settings.md` — already covered by the existing `project-settings` skill (internal, not user-facing)

### `/sdd` — Context-aware workflow assistant (Jarvis)

The hub command. Aware of `/sdd-help` and `/sdd-run` and cross-references them.

**Strict approval protocol:** The Jarvis NEVER executes actions without explicit user approval. Every interaction follows this pattern:
1. **Understand** — read context, interpret the user's request
2. **Explain** — tell the user what it understood and what it intends to do (including the specific `/sdd-run` command it would invoke)
3. **Ask** — request explicit approval before proceeding
4. **Execute** — only after the user approves, by invoking the Skill tool with the `sdd-run` command (e.g., `Skill(sdd-run, args: "change new --type feature")`)

This is non-negotiable. The Jarvis interprets natural language, which means it can misinterpret. The approval step catches misunderstandings before they become actions.

**Invocation mechanism:** `/sdd` delegates to `/sdd-run` via the Skill tool — it does not inline `/sdd-run` logic. This keeps the two commands decoupled.

When invoked with no arguments:
1. Reads project context:
   - Current git branch (feature branch → active task)
   - Workflow state in `.sdd/workflows/` (active changes, current phase)
   - Project initialization state (is this an SDD project?)
   - `sdd-settings.yaml` (what components are configured)
2. **Multi-workflow handling:**
   - **On a feature branch**: focuses on the workflow matching that branch, suggests its next action
   - **On main**: lists all active workflows with their current phase, asks which one to work on (or offers to create a new change)
   - **No active workflows**: suggests creating a new change or shows general project status
3. Explains what it sees and suggests the most likely next action
4. Waits for user approval or redirection

When invoked with arguments (e.g., `/sdd I want to add user auth`):
1. Interprets the request
2. Explains: "I understand you want to create a new feature change. I would run `/sdd-run change new --type feature`."
3. Waits for user approval before executing

Cross-referencing behavior:
- If the user seems unfamiliar with a concept → "You can learn more about specs with `/sdd-help`"
- When completing an action → "You can also run this directly: `/sdd-run change approve spec C1`"
- On first use in an uninitialized project → suggests `/sdd-help` for orientation or `/sdd-run init` to get started

### `/sdd-help` — Tutor

A teaching-focused command for users who need to build understanding before they can work effectively. Addresses unknown unknowns through progressive disclosure.

Capabilities:
- **SDD methodology explainer**: What is spec-driven development? Why specs before code? What's a change lifecycle?
- **Capability discovery**: "What can SDD do for me?" — surfaces the full range of functionality without overwhelming
- **Concept explainer**: What's a spec? A plan? A workflow? Component settings? Why do they matter?
- **Prompt examples**: Shows the user exactly what to type with `/sdd` — e.g., "Try `/sdd I want to add a new feature`" or "Type `/sdd` to see what's next". Surfaces the right prompts so the user knows how to interact.
- **Guided walkthrough**: Narrates each step of a workflow, explains why it matters, and shows the exact `/sdd` prompts the user would use at each point
- **Progressive disclosure**: Starts simple (init → create change → write spec), layers on complexity (components, config, local env) as the user demonstrates readiness

The tutor does not execute actions itself — it teaches and demonstrates, referring only to `/sdd` for doing work. The tutor is not aware of `/sdd-run`; users discover `/sdd-run` organically through `/sdd`'s cross-references.

### Consolidated tasks

- **#66** (Single context-aware SDD command) — subsumed by `/sdd` Jarvis command

## Constraints

- **Clean break**: Old command names are deleted entirely — no aliases or deprecation period
- **System CLI mostly untouched**: The internal `system-run.sh` CLI and its handlers are not modified, except for the database namespace which adds `--env <env>` support (schema + handler changes in `plugin/system/src/commands/database/`)
- **Skills/agents untouched in logic**: Only command *references* in skills and agents are updated; no behavioral changes. Note: `system-run.sh` invocations in skills are internal CLI calls, NOT command references — they must NOT be changed.
- **Command output messages updated**: Several commands have structured NEXT STEPS sections in their user-facing output that reference other commands by name (e.g., sdd-init Phase 6 says `/sdd-change new`, sdd-version says `/sdd-init`). These output patterns inside sdd-run.md must reference the new command names.
- **Backwards incompatible**: Users of current commands must learn the new names. This is acceptable given the plugin's maturity stage.
- **Single command file per command**: Each command (`sdd.md`, `sdd-run.md`, `sdd-help.md`) is one markdown file in `plugin/commands/`
- **Tutor is read-only**: `/sdd-help` teaches and demonstrates but does not execute actions or modify project state
- **Major version bump**: This is a breaking change (entire command surface replaced). Triggers version 7.0.0. A new `changelog/v7.md` file will be created.

## Changes

| File | Action | Description |
|------|--------|-------------|
| `plugin/commands/sdd.md` | Create | Jarvis command — context-aware workflow assistant, hub |
| `plugin/commands/sdd-run.md` | Rewrite | Unified explicit command with all namespaces |
| `plugin/commands/sdd-help.md` | Create | Tutor command — teaches SDD, progressive discovery |
| `plugin/commands/sdd-change.md` | Delete | Absorbed into `/sdd-run change` |
| `plugin/commands/sdd-config.md` | Delete | Absorbed into `/sdd-run config` |
| `plugin/commands/sdd-init.md` | Delete | Absorbed into `/sdd-run init` |
| `plugin/commands/sdd-settings.md` | Delete | Never user-facing; settings managed internally by `project-settings` skill |
| `plugin/commands/sdd-version.md` | Delete | Absorbed into `/sdd-run version` |
| `plugin/skills/orchestrators/change-orchestration/SKILL.md` | Create | Multi-step change lifecycle logic (from sdd-change.md) |
| `plugin/skills/orchestrators/init-orchestration/SKILL.md` | Create | 6-phase init workflow logic (from sdd-init.md) |
| `plugin/system/src/commands/database/schema.ts` | Update | Add `env` property to database args schema |
| `plugin/system/src/commands/database/handler.ts` | Update | Thread `--env` arg to action functions |
| `plugin/system/src/commands/database/*.ts` (7 action files) | Update | Accept and use env parameter |
| `plugin/skills/` (33 files) | Update | Update old command references across all skills |
| `plugin/skills/project-scaffolding/templates/project/CLAUDE.md` | Update | Scaffolding template — generates project CLAUDE.md with command refs |
| `plugin/agents/` | Update | Update command references in agent files |
| `.claude/skills/` (3 files) | Update | Update old command references in marketplace skills (commands-standards, docs-standards, plugin-testing-standards) |
| `tests/` (14 files) | Update | Update old command references in test files |
| `README.md` | Update | Update command references (17 occurrences) |
| `docs/commands.md` | Rewrite | Restructure around 3 new commands |
| `docs/getting-started.md` | Update | Update command references |
| `docs/workflows.md` | Update | Update command references |
| `docs/external-specs.md` | Update | Update command references |
| `docs/tutorial.md` | Update | Update command references |
| `docs/config-guide.md` | Update | Update command references |
| `docs/components.md` | Update | Update command references |
| `docs/agents.md` | Update | Update command references |
| `docs/workflow-progress.md` | Update | Update command references |
| `plugin/.claude-plugin/plugin.json` | Update | Version bump to 7.0.0 |
| `.claude-plugin/marketplace.json` | Update | Version bump to 7.0.0 |
| `changelog/v7.md` | Create | New major version changelog |

## Acceptance Criteria

1. **Exactly three user-facing commands exist**: `ls plugin/commands/` shows `sdd.md`, `sdd-run.md`, and `sdd-help.md` — no other command files. Verify: `ls plugin/commands/ | sort` outputs exactly these 3 files.
2. **`/sdd-run help` shows all namespaces**: The `sdd-run.md` command file contains documentation for all user-facing namespaces: change, init, local-env, database, contract, config, permissions, version. Verify: `grep -c "^/sdd-run " plugin/commands/sdd-run.md` shows at least 8 namespace entries.
3. **`/sdd-run` preserves all current functionality**: Every subcommand from the old commands exists under `/sdd-run` (except settings, which becomes internal). Verify: grep the `sdd-run.md` file for each action — `change new`, `init`, `local-env create`, `database setup`, `contract validate`, `config generate`, `permissions configure`, `version`.
4. **`/sdd` reads context and suggests**: The `sdd.md` command file includes instructions to read git branch, workflow state, project init state, and sdd-settings. Verify: `grep -E "git branch|workflows/|sdd-settings" plugin/commands/sdd.md` returns matches.
5. **`/sdd` cross-references other commands**: The `sdd.md` file explicitly references both `/sdd-help` and `/sdd-run`. Verify: `grep -c "sdd-help\|sdd-run" plugin/commands/sdd.md` returns at least 2.
6. **`/sdd` requires explicit approval before any action**: The `sdd.md` file includes the strict approval protocol — understand, explain, ask, execute. Verify: `grep -E "approval|NEVER execute|confirm|approve" plugin/commands/sdd.md` returns matches.
7. **`/sdd-help` covers core concepts**: The `sdd-help.md` file includes sections on SDD methodology, capability discovery, and guided walkthrough. Verify: `grep -E "methodology|capability|walkthrough|progressive" plugin/commands/sdd-help.md` returns matches.
8. **`/sdd-help` is read-only**: The tutor does not invoke system CLI, write files, or execute commands. Verify: `grep -E "system-run|Bash|Write|Edit" plugin/commands/sdd-help.md` returns zero matches.
9. **No stale references to old commands in plugin**: Verify: `grep -r "\/sdd-change\|\/sdd-config\|\/sdd-init\|\/sdd-settings\|\/sdd-version" plugin/ --include="*.md"` returns zero matches.
10. **No stale references to old commands in tests**: Verify: `grep -r "sdd-change\|sdd-config\|sdd-init\|sdd-settings\|sdd-version" tests/ --include="*.ts"` returns zero matches.
11. **Scaffolding template updated**: The project CLAUDE.md template references new commands. Verify: `grep -E "sdd-run|/sdd " plugin/skills/project-scaffolding/templates/project/CLAUDE.md` returns matches.
12. **No stale references to old commands in docs**: Verify: `grep -r "\/sdd-change\|\/sdd-config\|\/sdd-init\|\/sdd-settings\|\/sdd-version" docs/ README.md` returns zero matches.
13. **Agents still function**: The devops agent references `/sdd-run local-env` correctly. Verify: `grep "sdd-run local-env" plugin/agents/devops.md` returns matches.
14. **No stale `sdd-run env` references**: The `env` namespace is renamed to `local-env`. Verify: `grep -r "sdd-run env" plugin/ docs/ tests/ README.md --include="*.md" --include="*.ts"` returns zero matches (excluding historical notes in task files).
15. **No stale references to old commands in marketplace skills**: Verify: `grep -r "\/sdd-change\|\/sdd-config\|\/sdd-init\|\/sdd-settings\|\/sdd-version" .claude/skills/ --include="*.md"` returns zero matches.
16. **Database CLI accepts --env**: The database schema and handlers accept an `env` parameter. Verify: `grep "env" plugin/system/src/commands/database/schema.ts` returns a match.
17. **Orchestrator skills exist**: The orchestration logic from deleted commands lives in dedicated skills. Verify: `ls plugin/skills/orchestrators/` shows `change-orchestration/`, `init-orchestration/` — each containing a `SKILL.md`.
18. **Orchestrator skills are INVOKEd by sdd-run**: The `sdd-run.md` command file delegates complex namespaces to orchestrator skills. Verify: `grep -E "INVOKE.*orchestration" plugin/commands/sdd-run.md` returns at least 2 matches (change, init).
