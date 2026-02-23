---
name: version-orchestration
description: Displays installed and project plugin versions with mismatch detection.
user-invocable: false
---

# Version Orchestration

Display the installed SDD plugin version and the project's plugin version, highlighting when the project is outdated.

## Input

Invoked by `sdd-run.md` with no arguments.

## Preconditions

- Plugin is loaded (agent has access to plugin root path)

## Flow

1. Read the installed plugin version from `<plugin-root>/.claude-plugin/plugin.json` → `version` field
2. Check if `sdd/sdd-settings.yaml` exists in the current directory
3. If it exists, read the project plugin version from `sdd.updated_by_plugin_version` (with fallback to legacy `sdd.plugin_version` for pre-reconciliation files)
4. Optionally read `sdd.initialized_by_plugin_version` for context (the version that first created the project)
5. Compare versions using semver:
   - **Match** — installed and project versions are the same
   - **Project outdated** — project version is older than installed version (the common case after a plugin upgrade)
   - **Project newer** — project version is newer than installed (unusual — may indicate a downgraded plugin)
6. Display the version report

## Output Scenarios

### When versions match

```
SDD Plugin

  Installed:       6.5.0
  Project:         6.5.0  ✓ match
  Originally from: 6.2.0
```

### When project is outdated (installed is newer)

```
SDD Plugin

  Installed:       6.5.0
  Project:         6.2.0  ⚠ outdated
  Originally from: 6.0.0

The project settings were last reconciled with an older plugin version.
  /sdd I want to initialize a new project
```

### When project is newer than installed (unusual)

```
SDD Plugin

  Installed:       6.3.0
  Project:         6.5.0  ⚠ installed plugin is older than project
  Originally from: 6.0.0

The installed plugin is older than what this project expects.
Run: claude plugins update sdd
```

### When not inside an SDD project

```
SDD Plugin

  Installed:  6.5.0
  Project:    (no SDD project detected)

NEXT STEPS:
  /sdd I want to initialize a new project
```

## Related

- `project-settings` skill - Owns the `sdd-settings.yaml` schema

## Output

Returns the version report as formatted text.
