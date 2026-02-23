---
name: init-orchestration
description: Orchestrates SDD project initialization — version detection, environment verification, scaffolding, and git setup.
user-invocable: false
---

# Init Orchestration

Initialize a new spec-driven project with minimal structure. Components are scaffolded during implementation when the plan includes a scaffolding phase.

## Input

Invoked by `sdd-run.md` with no arguments. Project name is derived from the current directory.

## Workflow

This skill follows an approval-based workflow that verifies environment, creates minimal structure, and prepares for change-driven development.

| Phase | Purpose |
|-------|---------|
| 1     | Version detection + plugin build (if existing project with version mismatch) |
| 2     | Detect project name from current directory (or load from existing settings) |
| 3     | Environment verification (plugin, settings, permissions, reconciliation) |
| 4     | Tech pack registration + tech-specific prerequisite verification |
| 5     | Create minimal structure (config component only) — skipped for existing projects |
| 6     | Git init + commit — skipped for existing projects |
| 7     | Completion message |

---

## Phase Tracking (CRITICAL)

**You MUST complete ALL phases before declaring initialization complete.** Use this checklist to track progress:

```
[ ] Phase 1: Version check completed (or skipped for new projects)
[ ] Phase 2: Project name detected and confirmed
[ ] Phase 3: Environment verified (plugin, settings, permissions, reconciliation)
[ ] Phase 4: Tech packs registered and prerequisites verified
[ ] Phase 5: Minimal structure created (or skipped for existing projects)
[ ] Phase 6: Git repository initialized and committed (or skipped for existing projects)
[ ] Phase 7: Completion report displayed
```

**DO NOT:**
- Stop after environment verification without completing structure creation
- Declare "initialization complete" until Phase 6 is finished
- Ask the user "should I continue?" between phases - just proceed

---

### Phase 1: Version Detection & Plugin Build

**This phase runs BEFORE any other logic.** If plugin code has changed, all subsequent logic (validation, reconciliation, CLI commands) would run against stale built code.

1. Check if `sdd/sdd-settings.yaml` exists
2. If it exists, raw-parse the YAML and read version from `sdd.updated_by_plugin_version` (or legacy `sdd.plugin_version` for pre-reconciliation files)
3. Read current plugin version from `<plugin-root>/.claude-plugin/plugin.json` → `version` field
4. If versions differ:
   - Run `npm install` in `<plugin-root>/system/`
   - Run `npm run build` in `<plugin-root>/system/`
   - Only proceed once plugin is built with current code
5. If no settings file exists, this is a new project — skip version check, proceed to Phase 2

---

### Phase 2: Detect Project Name

**If `sdd/sdd-settings.yaml` exists** (existing project):
- Load `project.name` from the settings file
- **Do NOT prompt** for project name — it's already configured
- Switch to **upgrade/repair mode** (see below)

**If new project** (no settings file):
Derive project name from the current directory:

```
Initializing SDD project...

Detected project name: my-app (from current directory)
Is this correct? (yes/no)
```

**Project Name Rules:**
- Derived from `basename(pwd)` (current directory name)
- Validated: lowercase letters, numbers, hyphens only
- Spaces/special chars: prompt user to provide a valid name
- Empty directory name: prompt user to provide a name

If user says no: Ask for project name interactively.

**Existing Project — Upgrade/Repair Mode:**

```
Existing SDD project detected: <project-name>

Running environment check...
  ✓ Plugin v6.5.0 (up to date)
  ✓ All required tools available
  ✓ Permissions configured

Checking project structure...
  ✓ sdd/sdd-settings.yaml exists
  ✓ specs/INDEX.md exists
  ⚠ Required components missing (per tech pack)

Would you like to add missing components? (yes/no)
```

If yes: Add only missing pieces, **never overwrite existing files**.
If no: Exit gracefully.

**Running init multiple times is always safe.**

---

### Phase 3: Environment Verification

#### 3.1 Platform Check (HARD BLOCKER)

The SDD plugin requires a Unix environment. Check the runtime platform. If unsupported (native Windows without WSL), **STOP** immediately:

```
SDD requires a Unix environment (macOS or Linux).
On Windows, use WSL (Windows Subsystem for Linux): https://learn.microsoft.com/en-us/windows/wsl/install
```

#### 3.2 Plugin Installation Verification (HARD BLOCKER)

This must pass before any other checks. The agent knows the plugin's absolute path from its Claude Code plugin context.

1. Use the known plugin path from your plugin context. If the plugin path cannot be determined, fall back to searching `~/.claude/plugins` recursively for the SDD plugin (look for `plugin.json` marker files). If neither finds the plugin: **STOP** — display installation instructions and exit.
2. Verify the plugin path exists and contains expected marker files (`plugin.json`)
3. Check core system build readiness:
   - `<plugin-root>/core/system/dist/` exists (core system built)
   - `<plugin-root>/core/system/node_modules/` exists (dependencies installed)
4. If `dist/` exists: core system is ready (this is the normal case for installed plugins)
5. If `dist/` missing but `core/system/package.json` exists: run `npm install && npm run build` in `<plugin-root>/core/system/` (development mode)
6. If repairs fail: **STOP** — display error details and exit

**This is a hard blocker.** If the plugin is not installed, not built, or not functional after repair attempts, do NOT continue to other phases.

#### 3.3 Plugin Update Check

```
Checking for plugin updates...

Current version: 5.11.0
Latest version:  5.12.0

A newer version is available. It's recommended to upgrade before initializing.
Would you like to stop and upgrade? (yes/no)
```

If yes: Exit with instructions to run `claude plugins update sdd`
If no: Continue with current version

#### 3.4 .claude/settings.json Verification

Check the project's `.claude/settings.json` for required entries:

```json
{
  "extraKnownMarketplaces": {
    "sdd": {
      "source": {
        "source": "github",
        "repo": "LiorCohen/sdd"
      }
    }
  },
  "enabledPlugins": {
    "sdd@sdd": true
  }
}
```

If missing: create or merge the required entries (preserve existing settings).

#### 3.5 Permissions Check

```
Checking permissions...

  ⚠ SDD permissions not configured

Would you like me to configure recommended permissions automatically? (yes/no)
```

**If yes:**
Run `<plugin-root>/system/system-run.sh permissions configure` to merge SDD permissions into `.claude/settings.local.json`.

**If no:**
```
You can configure permissions later:
  /sdd I want to configure permissions

This will merge SDD recommended permissions into your .claude/settings.local.json
```

Note: permissions written to `.claude/settings.local.json` do NOT take effect mid-session. The session restart requirement is communicated in Phase 6.

#### 3.6 Settings Reconciliation (Existing Projects Only)

**Skip this step if:** this is a new project (no existing `sdd/sdd-settings.yaml`), or if versions already match.

If this is an existing project with a version mismatch (detected in Phase 1):

1. Run `<plugin-root>/core/system/system-run.sh settings reconcile` to migrate settings to the latest schema
2. Display the command output (it prints a summary of changes and any directory warnings)
3. **Skip Phase 5 and Phase 6** — structure already exists, git already initialized
4. Jump to Phase 7 with upgrade-specific messaging

---

### Phase 4: Tech Pack Registration + Prerequisites

**Auto-register internal tech packs.** Scan `<plugin-root>/` for directories containing `techpack.yaml`. For each found:

1. Validate the manifest: `<plugin-root>/core/system/system-run.sh tech-pack validate <tech-pack-path> --json`
2. If valid, register in `sdd/sdd-settings.yaml` under `techpacks`:
   ```yaml
   techpacks:
     <namespace>:
       path: <relative-path-to-tech-pack>
       version: <from manifest>
   ```
3. Build the tech pack system CLI if needed:
   - Check `<tech-pack-path>/system/dist/` exists
   - If missing: run `npm install && npm run build` in `<tech-pack-path>/system/`

**Tech-pack-specific prerequisite verification:**

After registration, delegate tool/environment checks to each registered tech pack:

```yaml
INVOKE techpacks.routeCommand with:
  namespace: <tech-pack-namespace>
  command: check-prerequisites
```

Each tech pack defines its own required tools and verification logic. Display results per tech pack:

```
Tech pack: <tech-pack-name>
  ✓ All prerequisites met
```

If any tech pack prerequisites fail, display the tech pack's install hints and wait for the user to resolve before proceeding.

---

### Phase 5: Create Minimal Structure

**Skip this phase for existing projects** (upgrade/repair mode skips to Phase 7).

**INVOKE the `project-scaffolding` skill** with:

```yaml
mode: minimal
project_name: <from Phase 2>
target_dir: <current directory>
```

---

### Phase 6: Git Init + Commit

Initialize git repository (if not already in one):
```bash
git init
```

Stage and commit all created files following the `commit-standards` skill.

---

### Phase 7: Completion Message

```
═══════════════════════════════════════════════════════════════
 PROJECT INITIALIZED: my-app
═══════════════════════════════════════════════════════════════

Location: /path/to/my-app

ENVIRONMENT:
  ✓ Plugin v7.0.0 (up to date)
  ✓ Tech packs registered
  ✓ Prerequisites verified
  ✓ Permissions configured

WHAT'S INCLUDED:
  ✓ SDD configuration (sdd/sdd-settings.yaml)
  ✓ Initial components (per tech pack)
  ✓ Spec registry (specs/INDEX.md)

TECH PACKS:
  ✓ <tech-pack-name> v<version>

IMPORTANT: Start a new Claude session before using SDD commands.
  Settings and permissions configured during init require a session restart to take effect.

NEXT STEPS:

  Start with a feature idea:
    /sdd I want to create a new feature

  Or import an existing spec:
    /sdd I want to import an external spec

  Available component types are defined by the active tech pack.
  Components are scaffolded during implementation when the plan includes them.
```

## Important Notes

### Zero Session Context

All workflow state is persisted. A new session can resume at any point by reading the files - no conversation history needed.

### Two-Stage Approval

Implementation cannot begin until both SPEC.md and PLAN.md are explicitly approved:
1. Spec created → spec_review → user approves → plan created
2. Plan created → plan_review → user approves → implementation enabled

### Checkpoint Commits

All state changes create checkpoint commits on feature branches:
- Checkpoints use `--no-verify` to skip hooks
- Checkpoints can be squashed into final commit
- Enables recovery from any interruption

### Change IDs

- Format: `<name>-<seq>` (e.g., `user-auth-1`)
- Derived from the workflow's user-chosen name
- Unique across concurrent workflows (different names = different prefixes)
- Displayed in all status output
- Used for all commands that operate on a specific change

## Output

Returns the Phase 7 completion message or an error if any hard blocker is encountered.
