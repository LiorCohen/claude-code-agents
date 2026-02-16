---
id: 144
title: "Three-command structure: /sdd + /sdd-run + /sdd-help"
status: reviewing
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
| `change` | `create [--type <type>] [--spec <path>]` | `/sdd-change new` | `/sdd-run change create` | Renamed + action renamed |
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

When invoked with no arguments (`/sdd-run`): shows help — lists all namespaces and their subcommands. `/sdd-run help` produces the same output. Help is inline in sdd-run.md (not dispatched to an orchestrator or system-run.sh).

**Global options** (preserved from current sdd-run): `--json`, `--verbose`, `--help`.

**Execution model**: For pass-through namespaces (database, contract, permissions), the action maps directly to `system-run.sh <namespace> <action> [args] [options]` — same as current sdd-run. For orchestrated namespaces (change, init, config, version, local-env), sdd-run.md INVOKEs the corresponding orchestrator skill, which may internally call `system-run.sh`. Note: the system CLI uses `env` as the namespace name; the `local-env` orchestrator maps `local-env` (user-facing) → `env` (system CLI).

#### Namespace documentation

Each namespace must include: a description, when to use it, and a concrete usage scenario showing the command in context.

**`change`** — Manage the full change lifecycle: create, spec, plan, implement, verify, review.
When to use: You're building a feature, fixing a bug, or refactoring — any work that follows the spec-driven lifecycle. This is the primary namespace most users interact with.
Scenario: You've been asked to add user authentication. You create a change (`change create --type feature`), iterate on the spec with your stakeholder, approve it (`change approve spec C1`), plan the implementation (`change plan C1`), approve the plan, implement, verify, and review. If open questions come up during spec review, you answer them (`change answer C1 O1 "Use JWT tokens"`). If the spec needs rework after planning, you regress (`change regress C1 --to soliciting`).

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

**Internal namespaces** (NOT user-facing, NOT shown in `/sdd-run help`): `scaffolding`, `spec`, `hook`, `contract generate-types`, `settings`, `workflow`, `archive`. These are invoked internally by skills/commands via `system-run.sh` and remain unchanged. Settings was never user-facing — it is managed internally by the `project-settings` skill (invoked during init, change workflows, and by `/sdd` when users describe settings changes in natural language).

**Dispatcher architecture**: sdd-run.md is a pure thin dispatcher — it contains no inlined logic. Each namespace delegates to either an orchestrator skill or a trivial pass-through. sdd-run.md itself only contains: namespace routing, help output, global options, and namespace documentation with usage scenarios.

**Orchestrator skills** (`plugin/skills/orchestrators/`): A new organizational layer for all namespace delegation. Each sdd-run namespace with non-trivial logic delegates to an orchestrator skill. sdd-run.md INVOKEs the orchestrator, and the orchestrator holds the full workflow logic:

- `change-orchestration/` — Multi-step change lifecycle (14 actions). Broken into phase-based sub-files to keep each file focused:
  - `SKILL.md` — Dispatcher: routes action → sub-file, shared validation, common output patterns
  - `creation.md` — `create` action (external spec handling, component discovery, spec solicitation INVOKE)
  - `spec-review.md` — `approve spec`, `answer`, `assume` (spec review phase operations)
  - `planning.md` — `plan`, `approve plan` (plan creation and approval)
  - `implementation.md` — `implement` (enters implementation mode, branch creation)
  - `verification.md` — `verify`, `review` (post-implementation verification and review)
  - `management.md` — `status`, `list`, `continue`, `regress`, `request-changes` (cross-cutting lifecycle operations)
- `init-orchestration/SKILL.md` — 6-phase init workflow (version check, env verification, scaffolding, git init)
- `config-orchestration/SKILL.md` — Config operations: generate, validate, diff, add-env (4 actions, each a `system-run.sh` call with arg validation and output formatting)
- `version-orchestration/SKILL.md` — Version display: read plugin.json + sdd-settings.yaml, semver compare, 4 output scenarios
- `local-env-orchestration/SKILL.md` — Local k8s environment management (moved from `plugin/skills/local-env/`). 9 actions: create, destroy, start, stop, status, deploy, undeploy, forward, infra

Namespaces with **trivial pass-through** (no orchestrator needed — single `system-run.sh` call with no workflow logic):
- `database` → pass-through to `system-run.sh database` (~5 lines per action)
- `contract` → pass-through to `system-run.sh contract` (single action)
- `permissions` → pass-through to `system-run.sh permissions` (single action)

`sdd-settings.md` is already covered by the existing `project-settings` skill (internal, not user-facing).

### `/sdd` — Context-aware workflow assistant (Jarvis)

The hub command. Aware of `/sdd-help` and `/sdd-run` and cross-references them.

**Strict approval protocol:** The Jarvis NEVER executes actions without explicit user approval. Every interaction follows this pattern:
1. **Understand** — read context, interpret the user's request
2. **Explain** — tell the user what it understood and what it intends to do (including the specific `/sdd-run` command it would invoke)
3. **Ask** — request explicit approval before proceeding
4. **Execute** — only after the user approves, by invoking the Skill tool with the `sdd-run` command (e.g., `Skill(sdd-run, args: "change create --type feature")`)

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
2. Explains: "I understand you want to create a new feature change. I would run `/sdd-run change create --type feature`."
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
- **References use `/sdd` with natural language prompts**: All user-facing references to commands — in docs, README, scaffolding templates, and orchestrator output messages — are replaced with `/sdd` and a relevant natural language prompt, NOT with `/sdd-run` equivalents. The goal is to funnel users through the Jarvis hub. Example: "Run `/sdd I want to create a new feature`" instead of "Run `/sdd-run change create --type feature`". Exceptions where `/sdd-run` is appropriate: (1) the `/sdd` command itself cross-references `/sdd-run` as "you can also run this directly", (2) `docs/commands.md` documents all three commands explicitly, (3) tests verify explicit `/sdd-run` command behavior, (4) marketplace skills (`.claude/skills/`) that describe how to author commands/skills. Agents are non-interactive and use internal invocations (INVOKE orchestrator skills or `system-run.sh`), not user-facing command references.
- **Command output messages updated**: Several commands have structured NEXT STEPS sections in their user-facing output that reference other commands by name (e.g., sdd-init Phase 6 says `/sdd-change new`, sdd-version says `/sdd-init`). These output patterns inside orchestrator skills must use `/sdd` with natural language prompts.
- **Backwards incompatible**: Users of current commands must learn the new names. This is acceptable given the plugin's maturity stage.
- **Concrete replacement mapping** (user-facing context — skills, docs, README, scaffolding templates, orchestrator output messages):

| Old | New |
|-----|-----|
| `/sdd-change new --type feature --name X` | `/sdd I want to create a new feature` |
| `/sdd-change new --spec path/to/spec.md` | `/sdd I want to import an external spec` |
| `/sdd-change status` | `/sdd` (no-arg — reads context, shows status) |
| `/sdd-change continue` | `/sdd` (no-arg — reads context, suggests resumption) |
| `/sdd-change approve spec <id>` | `/sdd I want to approve the spec` |
| `/sdd-change approve plan <id>` | `/sdd I want to approve the plan` |
| `/sdd-change plan` | `/sdd I want to start planning` |
| `/sdd-change implement <id>` | `/sdd I want to start implementing` |
| `/sdd-change verify <id>` | `/sdd I want to verify the implementation` |
| `/sdd-change review <id>` | `/sdd I want to submit for review` |
| `/sdd-change answer <id> "..."` | `/sdd I want to answer an open question` |
| `/sdd-change regress <id> --to spec` | `/sdd I want to go back to the spec phase` |
| `/sdd-init` | `/sdd I want to initialize a new project` |
| `/sdd-config generate --env local` | `/sdd I want to generate config for local` |
| `/sdd-config validate` | `/sdd I want to validate my config` |
| `/sdd-config diff local production` | `/sdd I want to compare local and production config` |
| `/sdd-version` | `/sdd What version am I running?` |
| `/sdd-run env create` | `/sdd I want to create a local environment` |
| `/sdd-run env deploy` | `/sdd I want to deploy to my local environment` |
| `/sdd-run permissions configure` | `/sdd I want to configure permissions` |
| `/sdd-run database setup my-db` | `/sdd I want to set up my database` |
- **Single command file per command**: Each command (`sdd.md`, `sdd-run.md`, `sdd-help.md`) is one markdown file in `plugin/commands/`
- **Tutor is read-only**: `/sdd-help` teaches and demonstrates but does not execute actions or modify project state
- **Major version bump**: This is a breaking change (entire command surface replaced). Triggers version 7.0.0. A new `changelog/v7.md` file will be created.
- **Full standards audit during review**: Before task completion, the implementation must pass the full standards audit suite — `/critic`, `commands-standards`, `skills-standards`, `agents-standards`, `system-cli-standards`, `docs-standards`, and `plugin-product-standards`. Any hard-block findings must be resolved before the task can move to complete.

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
| `plugin/skills/orchestrators/change-orchestration/SKILL.md` | Create | Dispatcher: routes action → sub-file |
| `plugin/skills/orchestrators/change-orchestration/creation.md` | Create | `create` action (spec solicitation, external spec, component discovery) |
| `plugin/skills/orchestrators/change-orchestration/spec-review.md` | Create | `approve spec`, `answer`, `assume` actions |
| `plugin/skills/orchestrators/change-orchestration/planning.md` | Create | `plan`, `approve plan` actions |
| `plugin/skills/orchestrators/change-orchestration/implementation.md` | Create | `implement` action |
| `plugin/skills/orchestrators/change-orchestration/verification.md` | Create | `verify`, `review` actions |
| `plugin/skills/orchestrators/change-orchestration/management.md` | Create | `status`, `list`, `continue`, `regress`, `request-changes` actions |
| `plugin/skills/orchestrators/init-orchestration/SKILL.md` | Create | 6-phase init workflow logic (from sdd-init.md) |
| `plugin/skills/orchestrators/config-orchestration/SKILL.md` | Create | Config operations: generate, validate, diff, add-env (from sdd-config.md) |
| `plugin/skills/orchestrators/version-orchestration/SKILL.md` | Create | Version display: semver compare, 4 output scenarios (from sdd-version.md) |
| `plugin/skills/orchestrators/local-env-orchestration/SKILL.md` | Create | Local env management (moved from `plugin/skills/local-env/`) |
| `plugin/skills/local-env/SKILL.md` | Delete | Moved to `plugin/skills/orchestrators/local-env-orchestration/` |
| `plugin/system/src/commands/database/schema.ts` | Update | Add `env` property to database args schema |
| `plugin/system/src/commands/database/handler.ts` | Update | Thread `--env` arg to action functions |
| `plugin/system/src/commands/database/*.ts` (7 action files) | Update | Accept and use env parameter |
| `plugin/skills/` (19 files, includes scaffolding template) | Update | Replace old command refs with `/sdd` + natural language prompts |
| `plugin/agents/` | Update | Replace command refs with internal invocations (INVOKE orchestrator skills or `system-run.sh` calls) — agents are non-interactive |
| `.claude/skills/` (4 files) | Update | Update command refs in marketplace skills (these use `/sdd-run` since they describe command authoring) |
| `tests/` (14 files) | Update | Update command refs to `/sdd-run` equivalents + rename test files named after old commands (`sdd-change-new.test.ts` → `change-create.test.ts`, `sdd-change-new-external.test.ts` → `change-create-external.test.ts`, `sdd-config.test.ts` → `config.test.ts`, `sdd-init.test.ts` → `init.test.ts`) |
| `README.md` | Update | Replace command refs with `/sdd` prompts (18 refs) |
| `docs/commands.md` | Rewrite | Restructure around 3 new commands (documents all three explicitly) |
| `docs/getting-started.md` | Update | Replace command refs with `/sdd` prompts |
| `docs/workflows.md` | Update | Replace command refs with `/sdd` prompts |
| `docs/external-specs.md` | Update | Replace command refs with `/sdd` prompts |
| `docs/tutorial.md` | Update | Replace command refs with `/sdd` prompts |
| `docs/config-guide.md` | Update | Replace command refs with `/sdd` prompts |
| `docs/components.md` | Update | Replace command refs with `/sdd` prompts |
| `docs/agents.md` | Update | Replace command refs with `/sdd` prompts |
| `docs/workflow-progress.md` | Update | Replace command refs with `/sdd` prompts |
| `plugin/.claude-plugin/plugin.json` | Update | Version bump to 7.0.0 + add `./skills/orchestrators/` to `skills` array |
| `.claude-plugin/marketplace.json` | Update | Version bump to 7.0.0 |
| `changelog/v7.md` | Create | New major version changelog |
| `changelog/README.md` | Update | Add v7 summary paragraph + version table row |

## Acceptance Criteria

1. **Exactly three user-facing commands exist**: The `plugin/commands/` directory contains only `sdd.md`, `sdd-run.md`, and `sdd-help.md`. All old command files (`sdd-change.md`, `sdd-config.md`, `sdd-init.md`, `sdd-settings.md`, `sdd-version.md`) are deleted. Verify: `ls plugin/commands/ | sort` outputs exactly these 3 files.

2. **`/sdd-run` documents all 8 namespaces**: The rewritten `sdd-run.md` includes help output listing every user-facing namespace — change, init, local-env, database, contract, config, permissions, version — each with a description, when-to-use guidance, and a usage scenario. Verify: `grep -c "^/sdd-run " plugin/commands/sdd-run.md` ≥ 8.

3. **`/sdd-run` preserves all current functionality**: Every action from the old commands exists under its `/sdd-run` namespace (except settings, which becomes internal). No functionality is lost — only the entry point changes. Verify: grep `sdd-run.md` for each action — `change create`, `init`, `local-env create`, `database setup`, `contract validate`, `config generate`, `permissions configure`, `version`.

4. **`/sdd` is context-aware**: The Jarvis command reads project state on invocation — git branch (to detect active workflows), `.sdd/workflows/` (current phase), project init state, and `sdd-settings.yaml` (configured components) — then suggests the most relevant next action. Verify: `grep -E "git branch|workflows/|sdd-settings" plugin/commands/sdd.md` returns matches.

5. **`/sdd` cross-references both other commands**: The hub command explicitly references `/sdd-help` (for novice concepts) and `/sdd-run` (for direct command equivalents), guiding users to the right tool for their experience level. Verify: `grep -c "sdd-help\|sdd-run" plugin/commands/sdd.md` ≥ 2.

6. **`/sdd` never auto-executes**: The Jarvis follows a strict approval protocol — understand the request, explain the intended action (including the specific `/sdd-run` command), ask for confirmation, then execute only after approval. This is non-negotiable because natural language interpretation can misfire. Verify: `grep -E "approval|NEVER execute|confirm|approve" plugin/commands/sdd.md` returns matches.

7. **`/sdd-help` teaches SDD concepts**: The tutor covers SDD methodology (why specs before code), capability discovery (what SDD can do), concept explanations (specs, plans, workflows), prompt examples (exact `/sdd` prompts to type), and guided walkthroughs with progressive disclosure from simple to complex. Verify: `grep -E "methodology|capability|walkthrough|progressive" plugin/commands/sdd-help.md` returns matches.

8. **`/sdd-help` is read-only and unaware of `/sdd-run`**: The tutor teaches and demonstrates but never executes actions — no system CLI calls, no file writes, no Bash. It only references `/sdd` for doing work; users discover `/sdd-run` organically through `/sdd`'s cross-references when they're ready for direct commands. Verify: `grep -E "system-run|Bash|Write|Edit|sdd-run" plugin/commands/sdd-help.md` returns zero matches.

9. **No stale command references in plugin directory**: Every reference to the old command names (`sdd-change`, `sdd-config`, `sdd-init`, `sdd-settings`, `sdd-version`) across all plugin markdown files — skills, orchestrators, commands, templates — has been replaced. Both slash-prefixed (`/sdd-change`) and bare (`sdd-change`) references are caught; `sdd-settings.yaml` file paths are excluded since that file still exists. Verify: `grep -r "sdd-change\|sdd-config\|sdd-init\|\/sdd-settings\|sdd-version" plugin/ --include="*.md" | grep -v "sdd-settings\."` returns zero matches.

10. **No stale command references in tests**: All test files have been updated — describe blocks, assertion strings, file path references, and prompt content no longer use old command names. Test files named after old commands have been renamed (`sdd-change-new.test.ts` → `change-create.test.ts`, etc.). Verify: `grep -r "sdd-change\|sdd-config\|sdd-init\|sdd-settings\|sdd-version" tests/ --include="*.ts" | grep -v "sdd-settings\."` returns zero matches.

11. **Scaffolding template funnels through `/sdd`**: The project CLAUDE.md template (what new users see after `init`) uses `/sdd` with natural language prompts, not `/sdd-run` direct commands. This ensures new users interact through the Jarvis hub first. Verify: `grep "/sdd " plugin/skills/project-scaffolding/templates/project/CLAUDE.md` returns matches AND `grep "/sdd-run" plugin/skills/project-scaffolding/templates/project/CLAUDE.md` returns zero matches.

12. **No stale command references in docs or README**: All documentation files and the root README have been updated — command references, quick-start examples, workflow walkthroughs, and code blocks all use the new command names. `docs/commands.md` is fully rewritten around the 3-command structure. Verify: `grep -r "sdd-change\|sdd-config\|sdd-init\|\/sdd-settings\|sdd-version" docs/ README.md | grep -v "sdd-settings\."` returns zero matches.

13. **Agents use internal invocations, not user-facing commands**: Agent files reference orchestrator skills (via INVOKE) or `system-run.sh` (via Bash) for all operations. They never reference user-facing commands because agents are non-interactive — they can't use the Skill tool. Verify: `grep -rE "/sdd-change|/sdd-config|/sdd-init|/sdd-settings|/sdd-version|/sdd-run env " plugin/agents/ --include="*.md" | grep -v "sdd-settings\."` returns zero matches.

14. **No stale `sdd-run env` references anywhere**: The old `env` namespace has been renamed to `local-env` across all user-facing surfaces. Internal `system-run.sh env` calls are unchanged (the system CLI keeps `env` as its namespace name). Verify: `grep -r "sdd-run env" plugin/ docs/ tests/ README.md --include="*.md" --include="*.ts"` returns zero matches.

15. **No stale command references in marketplace skills**: The 4 marketplace skill files (`.claude/skills/`) that describe command authoring patterns have been updated. These use `/sdd-run` equivalents (not `/sdd` prompts) since they teach skill/command authors who need the explicit syntax. Verify: `grep -r "sdd-change\|sdd-config\|sdd-init\|\/sdd-settings\|sdd-version" .claude/skills/ --include="*.md" | grep -v "sdd-settings\."` returns zero matches.

16. **Database CLI accepts `--env` parameter**: The database schema adds an optional `env` property (string, default `"local"`) and the handler threads it to all 7 action functions (setup, teardown, migrate, seed, reset, port-forward, psql). This enables targeting different environments from the same command. Verify: `grep "env" plugin/system/src/commands/database/schema.ts` returns a match.

17. **Orchestrator skills exist with correct structure**: Five orchestrator directories exist under `plugin/skills/orchestrators/` — one per non-trivial namespace (change, init, config, version, local-env). Each contains a `SKILL.md`. The change-orchestration directory additionally contains 6 phase sub-files splitting the 1143-line sdd-change.md into focused modules. Verify: `ls plugin/skills/orchestrators/` shows all 5 directories; `ls plugin/skills/orchestrators/change-orchestration/` shows `SKILL.md`, `creation.md`, `spec-review.md`, `planning.md`, `implementation.md`, `verification.md`, `management.md`.

18. **`sdd-run.md` delegates to orchestrators via INVOKE**: The thin dispatcher routes each orchestrated namespace to its corresponding skill — it never inlines workflow logic. This keeps sdd-run.md focused on routing and namespace documentation while orchestrators own the business logic. Verify: `grep -E "INVOKE.*orchestration" plugin/commands/sdd-run.md` returns ≥ 5 matches (change, init, config, version, local-env).

19. **Old local-env skill location removed**: The skill at `plugin/skills/local-env/` has been moved to `plugin/skills/orchestrators/local-env-orchestration/`. The original directory no longer exists. Verify: `test ! -d plugin/skills/local-env/ && echo "removed"` outputs "removed".

20. **User-facing references use `/sdd` prompts, not `/sdd-run`**: Docs, README, and non-orchestrator skills guide users through the Jarvis hub with natural language prompts (e.g., `/sdd I want to create a new feature`). Direct `/sdd-run` syntax only appears in: `docs/commands.md` (which documents all three commands), orchestrator skills (internal dispatchers), and marketplace skills (command authoring context). Verify: `grep -rn "/sdd-run" plugin/skills/ docs/ README.md --include="*.md" | grep -v "docs/commands.md" | grep -v "orchestrators/"` returns zero matches.

21. **Plugin manifest discovers orchestrator skills**: The `skills` array in `plugin.json` includes `./skills/orchestrators/` as a single entry, which discovers all orchestrator subdirectories automatically — same pattern used by `./skills/components/backend/` etc. Verify: `grep "orchestrators" plugin/.claude-plugin/plugin.json` returns a match.

22. **Full standards audit passes**: Before completion, the implementation passes the complete standards audit suite — `/critic`, `commands-standards` (on all 3 new commands), `skills-standards` (on all orchestrator skills), `agents-standards` (on updated agents), `system-cli-standards` (on database --env changes), `docs-standards` (on all docs), and `plugin-product-standards` (overall coherence). Verify: all audits produce zero hard-block findings.
