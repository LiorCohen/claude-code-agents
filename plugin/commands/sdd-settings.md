---
name: sdd-settings
description: View and modify component settings in sdd-settings.yaml
---

# /sdd-settings Command

View and modify component settings stored in `.sdd/sdd-settings.yaml`.

## Usage

```bash
# View all component settings
/sdd-settings

# View specific component
/sdd-settings main-server

# Modify a setting
/sdd-settings main-server databases add primary-db
/sdd-settings main-server ingress true
```

## What Are Settings?

**Settings** are structural decisions about a component that affect scaffolding, config, and deployment. Refer to the `project-settings` skill for the complete schema, component settings by type, defaults, and validation rules.

## Operations

### View All Settings

```
/sdd-settings
```

Displays all components and their settings grouped by type.

### View Component Settings

```
/sdd-settings <component-name>
```

Displays settings for a specific component.

### Modify Settings

```
/sdd-settings <component> <setting> <action> [value]
```

**Actions for array settings:**
- `add <value>` - Add to array
- `remove <value>` - Remove from array

**Actions for boolean settings:**
- `true` or `false` - Set value

**Actions for enum settings:**
- `<value>` - Set to valid enum value

## Setting Changes Workflow

When you modify settings, the following happens automatically:

1. **Working tree check** - If uncommitted changes exist:
   ```
   You have uncommitted changes in:
   - [model/user.ts](components/servers/main-server/model/user.ts)
   - [envs/default/config.yaml](components/config/envs/default/config.yaml)

   Settings changes may modify these files. Options:
   [1] Auto-commit current changes (recommended)
   [2] Continue without committing (risky)
   [3] Cancel
   ```

2. **Validation** - Verify the change is valid (e.g., referenced component exists)

3. **Preview** - Show what will happen:
   ```
   Adding database 'reporting-db' to main-server will:
   - Add DAL layer for reporting-db in [dal/](components/servers/main-server/dal/)
   - Add database config section in [envs/*/config.yaml](components/config/envs/)
   - Update helm chart values with new DB connection

   Proceed? [y/n]
   ```

4. **Apply** - Update `.sdd/sdd-settings.yaml`

5. **Sync** - Automatically scaffold/update affected artifacts

6. **Report** - Show what was created/modified

## Component Settings and Validation

Refer to the `project-settings` skill for:
- Complete settings schema per component type (server, webapp, helm, database, contract)
- Default values for each setting
- Validation rules (cross-reference checks, hybrid mode constraints, etc.)

## Examples

### Add Database to Server

```
/sdd-settings main-server databases add analytics-db
```

Result:
- Adds DAL layer at [dal/analytics-db/](components/servers/main-server/dal/analytics-db/)
- Adds config section:
  ```yaml
  main-server:
    databases:
      analytics-db:
        host: localhost
        port: 5432
        name: main_server
        ssl: false
  ```

### Enable Ingress on Helm Chart

```
/sdd-settings main-server-api ingress true
```

Result:
- Adds [templates/ingress.yaml](components/helm-charts/main-server-api/templates/ingress.yaml) to the helm chart
- Updates [values.yaml](components/helm-charts/main-server-api/values.yaml) with ingress configuration

### Convert Server to Hybrid

```
/sdd-settings main-server server_type hybrid
/sdd-settings main-server modes add api
/sdd-settings main-server modes add worker
```

Result:
- Updates server scaffolding with multiple lifecycles
- Updates helm chart with separate deployments per mode
- Updates config with queue settings for worker mode

## Related Commands

- `/sdd-init` - Initialize project with initial settings
- `/sdd-config` - Manage runtime configuration
- `/sdd-change` - Create changes that may affect settings
