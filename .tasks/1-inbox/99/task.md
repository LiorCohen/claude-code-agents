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
  plugin_version: "6.4.0"              # Updated
  initialized_at: "2025-12-01"         # Preserved
  last_updated: "2026-02-09"           # Updated
project:
  name: "my-app"                       # Preserved
  description: "My application"        # Preserved
  domain: "ecommerce"                  # Preserved
  type: "fullstack"                    # Preserved
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

### Version Tracking
```typescript
interface SddMetadata {
  readonly plugin_version: string;      // Version that created the project
  readonly initialized_at: string;
  readonly last_updated: string;
}
```

### Backwards Compatibility Pattern
- Optional fields with defaults: `helm?: boolean`, `databases?: string[]`, etc.
- Component `path` field supports both flat and type-based directory structures
- Nullish coalescing pattern: `?? []` fallbacks for safe array access
- Dual functions: `generateComponentPath()` for new, `getComponentDir()` for existing

## Scope

### 1. Plugin Version Detection & Build
- Check if plugin version has changed (compare with `sdd.plugin_version`)
- **Before doing anything else**, if version changed:
  - Run `npm install` in plugin workspace
  - Run `npm run build:plugin`
  - Only proceed once plugin is built with current code

### 2. Existing Project Detection
- If `.sdd/sdd-settings.yaml` exists, this is an existing project
- Load `project.name` from settings instead of prompting
- Skip all "new project" prompts for already-configured values

### 3. Settings Reconciliation (if version changed)
- Load existing sdd-settings
- Add missing optional fields with schema defaults (additive only)
- Update `sdd.plugin_version` to current version
- Update `sdd.last_updated` to today's date
- Validate result against current schema
- Inform user of changes made

### 4. Directory Structure
- Respect existing component `path` values (no forced migrations)
- New components use current conventions via `generateComponentPath()`
- No assumptions about flat vs type-based structure

## Acceptance Criteria

- [ ] `sdd-init` detects plugin version changes before any other logic runs
- [ ] Plugin dependencies are installed and built when version changes detected
- [ ] Existing project detection prevents redundant prompts for app name
- [ ] Settings reconciliation adds missing optional fields with defaults
- [ ] Existing values are preserved unchanged (reflect current reality)
- [ ] Component directory structures are respected (no forced migrations)
- [ ] `sdd.plugin_version` and `sdd.last_updated` are updated after reconciliation
- [ ] User is informed of any fields added during reconciliation
- [ ] Schema validation confirms reconciled settings are valid
