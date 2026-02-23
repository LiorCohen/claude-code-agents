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

CORE NAMESPACES:
  change        Manage the full change lifecycle (create, approve, implement, verify)
  init          Initialize or upgrade an SDD project
  permissions   Configure Claude Code permissions for SDD
  version       Show installed and project plugin versions

TECH PACK NAMESPACES:
  (Loaded from active tech packs — run /sdd-run help for current list)

GLOBAL OPTIONS:
  --json        Output in JSON format
  --verbose     Enable verbose logging
  --help        Show help for namespace/action

EXAMPLES:
  /sdd-run change create --type feature --name user-auth
  /sdd-run init
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

For **core orchestrated namespaces** (change, init, version), the orchestrator skill handles insufficient arguments — INVOKE the skill and let it display its own sub-help.

For **core pass-through namespaces** (permissions), validate arguments **before** calling `system-run.sh`. Display the sub-help blocks defined in each namespace section below.

For **tech pack namespaces** (any namespace not recognized as core), route to the tech pack command router — it handles its own argument validation and sub-help.

### Destructive Action Confirmation

Some actions destroy data, remove deployments, or reset progress. These **must not execute without explicit user authorization**.

**Severity levels:**

| Level | Meaning | Required |
|-------|---------|----------|
| `🔴 destructive` | Irreversible data loss or removal | Warning + explicit "yes" confirmation |
| `🟡 caution` | Overwrites data or resets progress, but recoverable | Warning + confirmation |

**Destructive actions (core):**

| Namespace | Action | Level | What it affects |
|-----------|--------|-------|-----------------|
| `change` | `regress` | 🟡 | Rolls workflow back to an earlier phase — plan or implementation work is archived but progress is reset |
| `change` | `request-changes` | 🟡 | Resets implementation status from complete to in-progress, requiring rework |

Tech packs may define additional destructive actions. The tech pack's command router provides its own destructive action table.

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

Read and follow `./core/skills/orchestrators/change-orchestration/SKILL.md` with:

```yaml
action: <action>
args: <remaining args>
```

**Actions:** `create`, `status`, `continue`, `list`, `approve spec`, `approve plan`, `plan`, `implement`, `verify`, `review`, `answer`, `assume`, `regress`, `request-changes`

**When to use:** You're building a feature, fixing a bug, or refactoring — any work that follows the spec-driven lifecycle. This is the primary namespace most users interact with.

**Scenario:** You've been asked to add user authentication. You create a change (`change create --type feature --name user-auth`), iterate on the spec with your stakeholder, approve it (`change approve spec user-auth-1`), plan the implementation (`change plan user-auth-1`), approve the plan, implement, verify, and review. If open questions come up during spec review, you answer them (`change answer user-auth-1 O1 "Use token-based auth"`). If the spec needs rework after planning, you regress (`change regress user-auth-1 --to soliciting`).

---

### `init` — Initialize or upgrade an SDD project

Read and follow `./core/skills/orchestrators/init-orchestration/SKILL.md`.

No arguments — runs the full 7-phase workflow.

**When to use:** You're starting a new project from scratch, or you've upgraded the plugin and need to reconcile settings with the new version.

**Scenario:** You create a new directory for your project, open Claude Code, and run `/sdd-run init`. It detects the project name, verifies your environment (permissions), registers tech packs, verifies tech-pack-specific prerequisites, scaffolds the minimal config structure, and commits. On an existing project after a plugin upgrade, it detects the version mismatch, reconciles settings, and reports what changed.

---

### `permissions` — Configure Claude Code permissions for SDD

Pass-through to system CLI:

```bash
<plugin-root>/core/system/system-run.sh permissions configure
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

Read and follow `./core/skills/orchestrators/version-orchestration/SKILL.md`.

No arguments — displays version info.

**When to use:** You want to check if your project is up to date with the installed plugin, or diagnose version mismatches.

**Scenario:** Your team reports that a command isn't working as expected. You run `version` and see the project was last reconciled with v6.2.0 but the installed plugin is v7.0.0. The output tells you to run `/sdd-run init` to reconcile.

---

## Tech Pack Namespace Routing (Tier 3)

When a namespace is not recognized as a core namespace, route it to the active tech pack's command router:

```yaml
INVOKE techpacks.routeCommand with:
  command: <namespace>
  args: [<action>, <remaining args>]
```

The tech pack command router handles:
- Argument validation and sub-help display
- Destructive action confirmation
- Dispatching to the appropriate tech pack skill or system CLI

To display available tech pack namespaces in the help output, read `commands.available` from the tech pack manifest via `techpacks.readManifest`.

---

## Internal Namespaces

The following namespaces are used internally by other skills and should not be invoked directly by users. They are NOT shown in the help output:

- `scaffolding` - Used by `./core/skills/orchestrators/init-orchestration/` for project setup
- `spec` - Used for spec validation, indexing, and snapshots
- `settings` - Used internally by the `project-settings` skill
- `workflow` - Workflow state management
- `archive` - Archive storage management

## Execution

For core pass-through namespaces (permissions), execute:

```bash
<plugin-root>/core/system/system-run.sh <namespace> <action> [args] [options]
```

Where `<plugin-root>` is the plugin's absolute path, resolved by the agent from its Claude Code plugin context.

For core orchestrated namespaces (change, init, version), INVOKE the corresponding orchestrator skill which may internally call `core/system/system-run.sh`.

For tech pack namespaces, route via `techpacks.routeCommand` — the tech pack handles its own system CLI dispatch.
