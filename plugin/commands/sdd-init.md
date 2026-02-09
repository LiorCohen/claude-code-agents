---
name: sdd-init
description: Initialize a new SDD project with minimal structure.
---

# /sdd-init

Initialize a new spec-driven project with minimal structure. Components are scaffolded on-demand when you create changes that need them.

## Usage

```
/sdd-init
```

**No arguments required.** Project name is derived from the current directory.

**Examples:**
```bash
cd my-app
/sdd-init
```

## Workflow

This command follows an approval-based workflow that verifies environment, creates minimal structure, and prepares for change-driven development.

| Phase | Purpose |
|-------|---------|
| 0     | Version detection + plugin build (if existing project with version mismatch) |
| 1     | Detect project name from current directory (or load from existing settings) |
| 2     | Environment verification (plugin, tools, settings, permissions) |
| 2.7   | Settings reconciliation (if existing project with version mismatch) |
| 3     | Create minimal structure (config component only) — skipped for existing projects |
| 4     | Git init + commit — skipped for existing projects |
| 5     | Completion message |

---

## Phase Tracking (CRITICAL)

**You MUST complete ALL phases before declaring initialization complete.** Use this checklist to track progress:

```
[ ] Phase 0: Version check completed (or skipped for new projects)
[ ] Phase 1: Project name detected and confirmed
[ ] Phase 2: Environment verified (plugin, tools, settings, permissions)
[ ] Phase 2.7: Settings reconciled (or skipped if versions match / new project)
[ ] Phase 3: Minimal structure created (or skipped for existing projects)
[ ] Phase 4: Git repository initialized and committed (or skipped for existing projects)
[ ] Phase 5: Completion report displayed
```

**DO NOT:**
- Stop after environment verification without completing structure creation
- Declare "initialization complete" until Phase 5 is finished
- Ask the user "should I continue?" between phases - just proceed

---

### Phase 0: Version Detection & Plugin Build

**This phase runs BEFORE any other logic.** If plugin code has changed, all subsequent logic (validation, reconciliation, CLI commands) would run against stale built code.

1. Check if `.sdd/sdd-settings.yaml` exists
2. If it exists, raw-parse the YAML and read version from `sdd.updated_by_plugin_version` (or legacy `sdd.plugin_version` for pre-reconciliation files)
3. Read current plugin version from `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json` → `version` field
4. If versions differ:
   - Run `npm install` in `${CLAUDE_PLUGIN_ROOT}/system/`
   - Run `npm run build` in `${CLAUDE_PLUGIN_ROOT}/system/`
   - Only proceed once plugin is built with current code
5. If no settings file exists, this is a new project — skip version check, proceed to Phase 1

---

### Phase 1: Detect Project Name

**If `.sdd/sdd-settings.yaml` exists** (existing project):
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
  ✓ .sdd/sdd-settings.yaml exists
  ✓ specs/INDEX.md exists
  ⚠ components/config/ missing

Would you like to add missing components? (yes/no)
```

If yes: Add only missing pieces, **never overwrite existing files**.
If no: Exit gracefully.

**Running sdd-init multiple times is always safe.**

---

### Phase 2: Environment Verification

#### 2.1 Platform Check (HARD BLOCKER)

The SDD plugin requires a Unix environment. This is checked by the `check-tools` CLI command (Phase 2.5) via its `platform` field. If the platform is unsupported (native Windows without WSL), **STOP** immediately:

```
SDD requires a Unix environment (macOS or Linux).
On Windows, use WSL (Windows Subsystem for Linux): https://learn.microsoft.com/en-us/windows/wsl/install
```

#### 2.2 Plugin Installation Verification (HARD BLOCKER)

This must pass before any other checks. The plugin's absolute path is available via `${CLAUDE_PLUGIN_ROOT}` (set by Claude when the plugin loads).

1. Check `${CLAUDE_PLUGIN_ROOT}`. If set, use it as the plugin path. If not set, fall back to searching `~/.claude/plugins` recursively for the SDD plugin (look for `marketplace.json` or `plugin.json` marker files). If neither finds the plugin: **STOP** — display installation instructions and exit.
2. Verify the plugin path exists and contains expected marker files (`plugin.json` or `.claude-plugin/marketplace.json`)
3. Check build readiness:
   - `${CLAUDE_PLUGIN_ROOT}/system/dist/` exists (plugin built)
   - `${CLAUDE_PLUGIN_ROOT}/system/node_modules/` exists (dependencies installed)
4. If `dist/` exists: plugin is ready (this is the normal case for installed plugins)
5. If `dist/` missing but `system/package.json` exists: run `npm install && npm run build` in `${CLAUDE_PLUGIN_ROOT}/system/` (development mode)
6. If repairs fail: **STOP** — display error details and exit

**This is a hard blocker.** If the plugin is not installed, not built, or not functional after repair attempts, do NOT continue to other phases.

#### 2.3 Plugin Update Check

```
Checking for plugin updates...

Current version: 5.11.0
Latest version:  5.12.0

A newer version is available. It's recommended to upgrade before initializing.
Would you like to stop and upgrade? (yes/no)
```

If yes: Exit with instructions to run `claude plugins update sdd`
If no: Continue with current version

#### 2.4 .claude/settings.json Verification

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

#### 2.5 Required Tools Check (via System CLI)

Run `sdd-system env check-tools --json` and interpret the result:
- Display the human-readable tool summary
- If all tools installed: continue to next phase
- If any tools are missing: list the missing tools with their install hints

**On macOS (brew)** — offer to auto-install since `brew` doesn't require sudo:
```
Missing tools:
  ✗ docker — brew install docker
  ✗ jq — brew install jq

How would you like to proceed?
1. Install for me — I'll run: brew install docker jq
2. I'll install them myself — tell me when you're ready and I'll re-check
```
- Option 1: run the install commands, then re-run `check-tools` to verify
- Option 2: wait for the user to install manually, then re-run `check-tools` when they say they're ready

**On Linux/WSL** — do NOT offer auto-install (package managers require `sudo`, which Claude cannot run). Show the commands for the user to run:
```
Missing tools:
  ✗ docker — sudo apt-get install docker.io
  ✗ jq — sudo apt-get install jq

Please install the missing tools and tell me when you're ready. I'll re-check.
```

All tools must be installed before proceeding. There is no skip option.

#### 2.6 Permissions Check

```
Checking permissions...

  ⚠ SDD permissions not configured

Would you like me to configure recommended permissions automatically? (yes/no)
```

**If yes:**
Run `/sdd-run permissions configure` to merge SDD permissions into `.claude/settings.local.json`.

**If no:**
```
You can configure permissions later by running:

  /sdd-run permissions configure

This will merge SDD recommended permissions into your .claude/settings.local.json
```

Note: permissions written to `.claude/settings.local.json` do NOT take effect mid-session. The session restart requirement is communicated in Phase 5.

---

### Phase 2.7: Settings Reconciliation (Existing Projects Only)

**Skip this phase if:** this is a new project (no existing `.sdd/sdd-settings.yaml`), or if versions already match.

If this is an existing project with a version mismatch (detected in Phase 0):

1. Run `sdd-system settings reconcile` to migrate settings to the latest schema
2. Display the command output (it prints a summary of changes and any directory warnings)
3. **Skip Phase 3 and Phase 4** — structure already exists, git already initialized
4. Jump to Phase 5 with upgrade-specific messaging

---

### Phase 3: Create Minimal Structure

**Skip this phase for existing projects** (upgrade/repair mode skips to Phase 5).

**INVOKE the `project-scaffolding` skill** with:

```yaml
mode: minimal
project_name: <from Phase 1>
target_dir: <current directory>
```

Create only:

```
<project>/
├── .sdd/
│   └── sdd-settings.yaml    # Contains only config component
├── specs/
│   └── INDEX.md             # Empty spec registry
├── components/
│   └── config/              # Only config is scaffolded
│       ├── package.json
│       ├── tsconfig.json
│       ├── envs/
│       │   ├── default/config.yaml
│       │   └── local/config.yaml
│       ├── schemas/config.schema.json
│       └── types/index.ts
├── package.json              # Workspace root (empty scripts initially)
├── .gitignore
├── README.md
└── CLAUDE.md
```

**sdd-settings.yaml format:** Use the minimal template from the `project-settings` skill (see its "Minimal Template" section).

---

### Phase 4: Git Init + Commit

Initialize git repository (if not already in one):
```bash
git init
```

Stage and commit all created files:

```bash
git add .
git commit -m "$(cat <<'EOF'
Initialize SDD project: <project-name>

- Created minimal SDD structure
- Config component ready
- Spec registry initialized

Components will be scaffolded on-demand as changes are created.

Co-Authored-By: SDD Plugin vX.Y.Z
EOF
)"
```

---

### Phase 5: Completion Message

```
═══════════════════════════════════════════════════════════════
 PROJECT INITIALIZED: my-app
═══════════════════════════════════════════════════════════════

Location: /path/to/my-app

ENVIRONMENT:
  ✓ Plugin v5.11.0 (up to date)
  ✓ All required tools available
  ✓ Permissions configured

WHAT'S INCLUDED:
  ✓ SDD configuration (.sdd/sdd-settings.yaml)
  ✓ Config component (components/config/)
  ✓ Spec registry (specs/INDEX.md)

IMPORTANT: Start a new Claude session before using SDD commands.
  Settings and permissions configured during init require a session restart to take effect.

NEXT STEPS:

  Start with a feature idea:
    /sdd-change new --type feature --name <your-first-feature>

  Or import an existing spec:
    /sdd-change new --spec path/to/requirements.md

  Components will be scaffolded on-demand when your changes need them.
```
