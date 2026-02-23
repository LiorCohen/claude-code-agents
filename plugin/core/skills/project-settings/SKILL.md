---
name: project-settings
description: Manage project settings in sdd/sdd-settings.yaml including component settings that drive scaffolding.
user-invocable: false
---

# Project Settings

Single source of truth for the `sdd/sdd-settings.yaml` schema, component settings, validation rules, and directory mappings. Component types and their settings schemas are defined by the active tech pack — invoke `techpacks.listComponents` and `techpacks.routeSkills` rather than hardcoding type-specific knowledge.

---

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts operation type and operation-specific parameters for managing sdd-settings.yaml.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns success status, file path, and current component configurations.

## Purpose

Manage the `sdd/sdd-settings.yaml` file that stores project configuration and component settings. Component settings are structural decisions that drive scaffolding, config initialization, and deployment.

## File Location

Settings file: `sdd/sdd-settings.yaml` (git-tracked)

The `sdd/` directory contains all SDD metadata. Create this directory if it doesn't exist.

## Migration from Legacy Location

If `sdd-settings.yaml` exists at project root (legacy location):
1. Create `sdd/` directory
2. Move `sdd-settings.yaml` to `sdd/sdd-settings.yaml`
3. Delete the root file
4. Commit the change

Quick migration command:
```bash
mkdir -p sdd && mv sdd-settings.yaml sdd/ && git add -A && git commit -m "Migrate sdd-settings.yaml to sdd/"
```

## Schema

**Formal definition:** [`schemas/sdd-settings.schema.json`](./schemas/sdd-settings.schema.json) (JSON Schema Draft 2020-12)

The schema defines three top-level sections: `sdd` (plugin metadata), `project` (project metadata), and `components` (list of typed components with settings). Component types and their settings schemas are defined by the active tech pack.

### Example

```yaml
sdd:
  initialized_by_plugin_version: "7.0.0"
  updated_by_plugin_version: "7.1.0"
  initialized_at: "2026-02-07 00:00:00Z"
  updated_at: "2026-02-09 14:30:00Z"

project:
  name: "my-app"
  description: "A task management SaaS application"

techpacks:
  <namespace>:
    name: <tech-pack-name>
    namespace: <namespace>
    version: "1.0.0"
    mode: internal  # or external, git
    path: <tech-pack-directory>

components:
  my-component:
    type: <type-from-tech-pack>
    techpack: <namespace>
    directory: <directory-from-tech-pack-pattern>

  other-component:
    type: <type-from-tech-pack>
    techpack: <namespace>
    directory: <directory-from-tech-pack-pattern>
```

## Settings vs Config

| Aspect | Settings | Config |
|--------|----------|--------|
| **What** | Structural capabilities | Runtime values |
| **When set** | At component creation, changeable | Per-environment |
| **Examples** | `depends_on`, component-type-specific fields | `port: 3000`, `replicas: 3` |
| **Affects** | What gets scaffolded | Values in scaffolded files |
| **Stored in** | `sdd/sdd-settings.yaml` | Config component `envs/` directory |

## Component Settings

Component types and their settings schemas are defined by the active tech pack. Core does not hardcode component type definitions.

To discover available component types and their settings schemas:

```
Invoke techpacks.listComponents for the active tech pack namespace.
```

To load type-specific settings schemas during validation:

```
Invoke techpacks.routeSkills with:
  namespace: <active-namespace>
  phase: implementation
```

The tech pack's `techpack-settings` skill contains the full component type definitions, settings tables per type, directory patterns, and validation rules.

## Directory Structure

Component directory patterns are defined in the tech pack manifest under `components.<type>.directory_pattern`. Invoke `techpacks.listComponents` to get the directory pattern for each component type. Do NOT hardcode type→directory mappings.

## Validation Rules

- **Config mandatory singleton**: Every project must have exactly one config component (if the tech pack defines a `config` component type)
- **Component references**: Cross-references between components (e.g., `depends_on`) must reference existing component instances
- **Tech-pack-specific validation**: Additional validation rules are provided by the tech pack. Invoke `techpacks.routeSkills(phase: implementation)` for component-type-specific settings schemas.

## Operations

### Operation: `create`

Initialize a new settings file.

**Input:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `initialized_by_plugin_version` | Yes | Current SDD plugin version |
| `project_name` | Yes | Project name |
| `project_description` | No | Project description |
| `components` | Yes | List of components with settings |

### Operation: `read`

Load and return current settings.

### Operation: `update`

Merge partial updates into existing settings. Triggers automatic sync of affected artifacts.

### Operation: `get_component_dirs`

Get the actual directory names for all components.

## Settings Lifecycle

```text
┌─────────────────┐
│   /sdd (init)   │  Settings defined during project creation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Scaffolding    │  Settings drive what files/templates are created
│  (initial)      │  Settings drive initial config values
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Development    │  Settings changes come from:
│                 │  - Specs (new components, capability changes)
│                 │  - Plans (implementation decisions)
│                 │  - /sdd with natural language about settings (manual adjustments)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Settings Sync  │  Changes propagate to affected artifacts
│  (incremental)  │  Only adds/updates, never deletes user content
└─────────────────┘
```

## Naming Rules

- Names must be lowercase
- Use hyphens, not underscores
- No spaces allowed
- Names should be multi-word and domain-specific
  - Good: `order-service`, `analytics-db`, `customer-portal`, `task-api`
  - Avoid: `api`, `public`, `primary`, `main`, `server`
- Exception: `config` (singleton)

## Minimal Template

Template for initializing a new `sdd/sdd-settings.yaml`:

```yaml
# ============================================================================
# SDD PROJECT SETTINGS - DO NOT EDIT MANUALLY
# ============================================================================
# This file is generated and maintained by SDD commands.
# To modify settings, use: /sdd with natural language about settings
# ============================================================================

sdd:
  initialized_by_plugin_version: "{{PLUGIN_VERSION}}"
  updated_by_plugin_version: "{{PLUGIN_VERSION}}"
  initialized_at: "{{CURRENT_UTC_DATETIME}}"
  updated_at: "{{CURRENT_UTC_DATETIME}}"

project:
  name: "{{PROJECT_NAME}}"

# Tech packs and components are added here during init and implementation.

techpacks:
  <namespace>:
    name: <tech-pack-name>
    namespace: <namespace>
    version: "1.0.0"
    mode: internal
    path: <tech-pack-directory>

components:
  my-component:
    type: <type-from-tech-pack>
    techpack: <namespace>
    directory: <directory-from-tech-pack-pattern>
```
