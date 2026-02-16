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

Absorbs all current functionality under namespaced subcommands:

```
/sdd-run change <action>         ← from /sdd-change
  new [--type <type>] [--spec <path>]
  status
  continue
  list
  approve spec <change-id>
  approve plan <change-id>
  plan
  implement <change-id>
  verify <change-id>
  review <change-id>
  answer <q-id> "<answer>"
  assume <q-id> "<assumption>"
  regress <change-id> --to <phase>
  request-changes <change-id>

/sdd-run init                    ← from /sdd-init

/sdd-run env <action>            ← from /sdd-run env (stays the same)
  create | destroy | start | stop | restart | status
  deploy | undeploy | forward | config | infra | check-tools

/sdd-run database <action>       ← from /sdd-run database (stays the same)
  setup | teardown | migrate | seed | reset | port-forward | psql

/sdd-run contract <action>       ← from /sdd-run contract (stays the same)
  validate

/sdd-run config <action>         ← from /sdd-config
  generate --env <env> [--component <name>]
  validate [--env <env>]
  diff <env1> <env2>
  add-env <env-name>

/sdd-run settings [<component>] [<setting>] [<action>] [<value>]  ← from /sdd-settings

/sdd-run permissions <action>    ← from /sdd-run permissions (stays the same)
  configure

/sdd-run version                 ← from /sdd-version

/sdd-run help                    ← show all namespaces and subcommands
```

### `/sdd` — Context-aware workflow assistant (Jarvis)

The hub command. Aware of `/sdd-help` and `/sdd-run` and cross-references them.

**Strict approval protocol:** The Jarvis NEVER executes actions without explicit user approval. Every interaction follows this pattern:
1. **Understand** — read context, interpret the user's request
2. **Explain** — tell the user what it understood and what it intends to do (including the specific `/sdd-run` command it would invoke)
3. **Ask** — request explicit approval before proceeding
4. **Execute** — only after the user approves

This is non-negotiable. The Jarvis interprets natural language, which means it can misinterpret. The approval step catches misunderstandings before they become actions.

When invoked with no arguments:
1. Reads project context:
   - Current git branch (feature branch → active task)
   - Workflow state in `.sdd/workflows/` (active changes, current phase)
   - Project initialization state (is this an SDD project?)
   - `sdd-settings.yaml` (what components are configured)
2. Explains what it sees and suggests the most likely next action
3. Waits for user approval or redirection

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

### File changes

- **Delete**: `plugin/commands/sdd-change.md`, `sdd-config.md`, `sdd-init.md`, `sdd-settings.md`, `sdd-version.md`
- **Rewrite**: `plugin/commands/sdd-run.md` as the unified explicit command
- **Create**: `plugin/commands/sdd.md` as the Jarvis command
- **Create**: `plugin/commands/sdd-help.md` as the tutor command
- **Update**: All agent and skill references from old command names to new names
  - `plugin/agents/devops.md` — already uses `/sdd-run env`, may need minor updates
  - `plugin/skills/` — update references to `/sdd-change` → `/sdd-run change`, etc.
  - `plugin/skills/commit-standards/SKILL.md` — update command references
  - `plugin/skills/external-spec-integration/SKILL.md` — update entry point reference
  - `plugin/skills/spec-writing/resources/frontmatter-validation.md` — update `/sdd-change` references

## Constraints

- **Clean break**: Old command names are deleted entirely — no aliases or deprecation period
- **System CLI untouched**: The internal `system-run.sh` CLI and its handlers are not modified
- **Skills/agents untouched in logic**: Only command *references* in skills and agents are updated; no behavioral changes
- **Backwards incompatible**: Users of current commands must learn the new names. This is acceptable given the plugin's maturity stage.
- **Single command file per command**: Each command (`sdd.md`, `sdd-run.md`, `sdd-help.md`) is one markdown file in `plugin/commands/`
- **Tutor is read-only**: `/sdd-help` teaches and demonstrates but does not execute actions or modify project state

## Changes

| File | Action | Description |
|------|--------|-------------|
| `plugin/commands/sdd.md` | Create | Jarvis command — context-aware workflow assistant, hub |
| `plugin/commands/sdd-run.md` | Rewrite | Unified explicit command with all namespaces |
| `plugin/commands/sdd-help.md` | Create | Tutor command — teaches SDD, progressive discovery |
| `plugin/commands/sdd-change.md` | Delete | Absorbed into `/sdd-run change` |
| `plugin/commands/sdd-config.md` | Delete | Absorbed into `/sdd-run config` |
| `plugin/commands/sdd-init.md` | Delete | Absorbed into `/sdd-run init` |
| `plugin/commands/sdd-settings.md` | Delete | Absorbed into `/sdd-run settings` |
| `plugin/commands/sdd-version.md` | Delete | Absorbed into `/sdd-run version` |
| `plugin/agents/devops.md` | Update | Update any stale command references |
| `plugin/skills/commit-standards/SKILL.md` | Update | Update command references |
| `plugin/skills/external-spec-integration/SKILL.md` | Update | Update entry point reference |
| `plugin/skills/spec-writing/resources/frontmatter-validation.md` | Update | Update `/sdd-change` references |
| Docs (`docs/*.md`, `README.md`) | Update | Update all command references |

## Acceptance Criteria

1. **Exactly three user-facing commands exist**: `ls plugin/commands/` shows `sdd.md`, `sdd-run.md`, and `sdd-help.md` — no other command files. Verify: `ls plugin/commands/ | sort` outputs exactly these 3 files.
2. **`/sdd-run help` shows all namespaces**: The `sdd-run.md` command file contains documentation for all namespaces: change, init, env, database, contract, config, settings, permissions, version. Verify: `grep -c "^/sdd-run " plugin/commands/sdd-run.md` shows at least 9 namespace entries.
3. **`/sdd-run` preserves all current functionality**: Every subcommand from the old commands exists under `/sdd-run`. Verify: grep the `sdd-run.md` file for each action — `change new`, `init`, `env create`, `database setup`, `contract validate`, `config generate`, `settings`, `permissions configure`, `version`.
4. **`/sdd` reads context and suggests**: The `sdd.md` command file includes instructions to read git branch, workflow state, project init state, and sdd-settings. Verify: `grep -E "git branch|workflows/|sdd-settings" plugin/commands/sdd.md` returns matches.
5. **`/sdd` cross-references other commands**: The `sdd.md` file explicitly references both `/sdd-help` and `/sdd-run`. Verify: `grep -c "sdd-help\|sdd-run" plugin/commands/sdd.md` returns at least 2.
6. **`/sdd` requires explicit approval before any action**: The `sdd.md` file includes the strict approval protocol — understand, explain, ask, execute. Verify: `grep -E "approval|NEVER execute|confirm|approve" plugin/commands/sdd.md` returns matches.
7. **`/sdd-help` covers core concepts**: The `sdd-help.md` file includes sections on SDD methodology, capability discovery, and guided walkthrough. Verify: `grep -E "methodology|capability|walkthrough|progressive" plugin/commands/sdd-help.md` returns matches.
8. **`/sdd-help` is read-only**: The tutor does not invoke system CLI, write files, or execute commands. Verify: `grep -E "system-run|Bash|Write|Edit" plugin/commands/sdd-help.md` returns zero matches.
9. **No stale references to old commands**: Verify: `grep -r "\/sdd-change\|\/sdd-config\|\/sdd-init\|\/sdd-settings\|\/sdd-version" plugin/ --include="*.md"` returns zero matches (excluding changelog/historical references).
10. **Agents still function**: The devops agent references `/sdd-run env` correctly. Verify: `grep "sdd-run env" plugin/agents/devops.md` returns matches.
11. **System CLI untouched**: No files under `plugin/system/src/` are modified. Verify: `git diff --name-only plugin/system/` returns empty.
