---
id: 99
title: sdd-init should ensure sdd-settings are updated during plugin updates
status: open
priority: high
created: 2026-02-08
depends_on: []
blocks: []
---

# Task 99: sdd-init should ensure sdd-settings are updated during plugin updates

## Description

When a user updates the SDD plugin to a newer version, `sdd-init` should detect the version change and ensure the project is properly reconciled with the new plugin version. This includes building the plugin, reconciling sdd-settings with schema changes, and handling existing projects intelligently.

Currently, `sdd-init` is too naive:
1. It doesn't check if the plugin needs to be built before running
2. It asks for the application name even when the project already exists
3. It doesn't reconcile existing sdd-settings with newer schema versions
4. Users could be running with stale plugin builds or incomplete settings after upgrading

## Philosophy

**CRITICAL**: sdd-settings reflects what IS, not what should be - capturing actual project state at any given point in time.

Reconciliation must be:
- **Additive**: Add new optional fields with defaults when missing
- **Preservative**: Keep all existing values as-is (they reflect current reality)
- **Permissive**: Accept structural variations (flat vs type-based directories)
- **Non-destructive**: Never force-update existing values to "ideal" defaults

### Concrete Examples

**Example 1: Adding a new section (v6.3.6 → v6.3.7 added `system.logging`)**

v6.3.7 introduced the `system` section. When reconciling a v6.3.6 project:
- Add `system.logging` with defaults `{enabled: true, level: "info"}`
- Do NOT touch anything else in the file

**Example 2: Making fields optional (v6.3.7 → v6.4.0 made arrays optional)**

v6.4.0 made `databases`, `provides_contracts`, `consumes_contracts`, `contracts`, and `helm` optional. When reconciling:
- If a server has `databases: ["users-db"]` → keep it (reflects reality)
- If a server has `databases: []` → keep it (still valid, user wrote it)
- Do NOT strip empty arrays or normalize to "minimal" form — respect what the user has

**Example 3: Adding a required field (v6.4.0 added `path` to components)**

v6.4.0 made `path` required on all components. When reconciling a pre-v6.4.0 project:
- A component `{name: "api-server", type: "server"}` needs a `path` added
- Infer from filesystem or generate using `generateComponentPath("server", "api-server")` → `"components/servers/api-server"`
- Do NOT move any files — just record where the component currently lives

**Example 4: Full reconciliation scenario (v6.3.6 → v6.4.0)**

Before (v6.3.6):
```yaml
sdd:
  plugin_version: "6.3.6"
  initialized_at: "2025-12-01"
  last_updated: "2025-12-01"
project:
  name: "my-app"
  description: "My application"
  domain: "ecommerce"
  type: "fullstack"
components:
  - name: "api-server"
    type: "server"
    settings:
      server_type: "api"
      databases: ["main-db"]
      provides_contracts: ["user-api"]
      consumes_contracts: []
      helm: true
```

After reconciliation to v6.4.0:
```yaml
sdd:
  initialized_by_plugin_version: "6.3.6"            # Migrated from plugin_version (preserved)
  updated_by_plugin_version: "6.4.0"                 # Set to current version
  initialized_at: "2025-12-01 00:00:00 +0000"              # Migrated (original date, time unknown)
  updated_at: "2026-02-09 14:30:00 +0200"                  # Migrated from last_updated, set to now
project:
  name: "my-app"                       # Preserved
  description: "My application"        # Preserved
  # domain and type removed (deprecated — functionality moved to sdd-change)
components:
  - name: "api-server"                 # Preserved
    type: "server"                     # Preserved
    path: "components/servers/api-server"  # Added (inferred)
    settings:
      server_type: "api"               # Preserved
      databases: ["main-db"]           # Preserved (non-empty)
      provides_contracts: ["user-api"] # Preserved (non-empty)
      consumes_contracts: []           # Preserved (user wrote it)
      helm: true                       # Preserved (user set it)
system:                                # Added (new section)
  logging:
    enabled: true
    level: "info"
```

Note: `consumes_contracts: []` and `helm: true` are preserved even though they match defaults — we don't normalize what the user has written.

## Existing Infrastructure

The following infrastructure already exists (as of v6.4.0):

### Version Tracking (current — to be changed)
```typescript
// Current (v6.4.0):
interface SddMetadata {
  readonly plugin_version: string;      // Single version field
  readonly initialized_at: string;      // Date only (YYYY-MM-DD)
  readonly last_updated: string;        // Date only (YYYY-MM-DD)
}

// Proposed (this task):
interface SddMetadata {
  readonly initialized_by_plugin_version: string;  // Version that first created the project
  readonly updated_by_plugin_version: string;       // Version that last reconciled settings
  readonly initialized_at: string;                  // Full datetime with timezone, human readable
  readonly updated_at: string;                      // Full datetime with timezone, human readable
}
```

This split is important because:
- `initialized_by_plugin_version` is immutable — set once during first `sdd-init`, never changes
- `updated_by_plugin_version` tracks the most recent plugin version that touched settings
- Full datetimes with timezone (e.g., `"2026-02-09 14:30:00 +0200"`) are more useful than date-only strings
- Renaming `last_updated` → `updated_at` for consistency with `initialized_at`

### Backwards Compatibility Pattern
- Optional fields with defaults: `helm?: boolean`, `databases?: string[]`, etc.
- Component `path` field supports both flat and type-based directory structures
- Nullish coalescing pattern: `?? []` fallbacks for safe array access
- Dual functions: `generateComponentPath()` for new, `getComponentDir()` for existing

## Architecture Decision: No Heavyweight Migration Framework

We considered three approaches:
- **Option A**: Full migration system with versioned migration scripts
- **Option B**: Detect mismatches and prompt user to fix manually
- **Option C**: Schema flexibility + additive reconciliation

**Chosen: Option C.** The v6.4.0 changes demonstrate that most migrations can be handled through schema flexibility (optional fields with defaults, stored paths, `?? []` fallbacks) rather than explicit migration code. This keeps the implementation simple and avoids maintaining a migration chain.

## Scope

### 1. Plugin Version Detection & Build (MUST BE FIRST)
- Compare `sdd.updated_by_plugin_version` (from `.sdd/sdd-settings.yaml`) with current plugin version (from `plugin/.claude-plugin/plugin.json`)
- **This must happen before any other sdd-init logic runs**, because if the plugin code has changed, all subsequent logic (validation, reconciliation, CLI commands) would run against stale built code and produce incorrect results
- If version changed:
  - Run `npm install` in plugin workspace
  - Run `npm run build:plugin`
  - Only proceed once plugin is built with current code

### 2. Existing Project Detection (independent of version mismatch)
- If `.sdd/sdd-settings.yaml` exists, this is an existing project
- Load `project.name` from settings instead of prompting
- Skip all "new project" prompts for already-configured values
- This applies regardless of whether a version mismatch was detected — even when versions match, don't re-ask for information that already exists

### 3. Settings Reconciliation (if version changed)
- Load existing sdd-settings
- Migrate `sdd` metadata fields:
  - `plugin_version` → `initialized_by_plugin_version` (preserve original value) + `updated_by_plugin_version` (set to current)
  - `initialized_at` → keep name, convert date-only to full datetime with timezone (append `00:00:00 +0000` for unknown times)
  - `last_updated` → rename to `updated_at`, set to current datetime
  - Remove old field names after migration
- Remove deprecated `project` fields:
  - `domain` and `type` are leftovers from earlier sdd-init iterations — that functionality now lives in sdd-change
  - `ProjectMetadata` should only contain `name` and `description`
- Add missing optional fields with schema defaults (additive only)
- Update `sdd.updated_by_plugin_version` to current version
- Update `sdd.updated_at` to current datetime
- Validate result against current schema
- Inform user of changes made

### 4. Directory Structure Mismatch Detection
- Check for mismatches between what sdd-settings describes and what exists on the filesystem:
  - Component `path` in settings points to a directory that doesn't exist on disk
  - Directories exist on disk that aren't tracked in sdd-settings
  - The current plugin version expects a different layout than what earlier versions created (e.g., flat `components/{name}` vs type-based `components/{type-plural}/{name}`)
- Respect existing component `path` values (no forced migrations)
- New components use current conventions via `generateComponentPath()`
- Report discrepancies to user but do NOT auto-fix directory structure — just record where things currently live

## Acceptance Criteria

- [ ] `sdd-init` detects plugin version changes before any other logic runs
- [ ] Plugin dependencies are installed and built when version changes detected
- [ ] Existing project detection prevents redundant prompts (independent of version mismatch)
- [ ] Settings reconciliation adds missing optional fields with defaults
- [ ] Existing values are preserved unchanged (reflect current reality)
- [ ] Directory structure mismatches are detected and reported (not auto-fixed)
- [ ] Component directory structures are respected (no forced migrations)
- [ ] `sdd` metadata migrated to new schema (`initialized_by_plugin_version`, `updated_by_plugin_version`, `initialized_at`, `updated_at`)
- [ ] `sdd.updated_by_plugin_version` and `sdd.updated_at` are updated after reconciliation
- [ ] `sdd.initialized_by_plugin_version` and `sdd.initialized_at` are preserved (immutable after first init)
- [ ] Deprecated `project.domain` and `project.type` fields removed during reconciliation
- [ ] User is informed of any fields added or removed during reconciliation
- [ ] Schema validation confirms reconciled settings are valid
