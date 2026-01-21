---
name: project-settings
description: Manage project settings in sdd-settings.yaml for persisting configuration choices and project state.
---

# Project Settings Skill

## Purpose

Manage the `sdd-settings.yaml` file that stores project configuration and state. This file persists project choices and can be read/updated to maintain consistency across workflows.

## File Location

Settings file: `sdd-settings.yaml` (project root, git-tracked)

## Schema

```yaml
sdd:
  plugin_version: "3.0.1"      # SDD plugin version that created this project
  initialized_at: "2026-01-21" # Date project was initialized
  last_updated: "2026-01-21"   # Date settings were last modified

project:
  name: "my-app"
  description: "A task management SaaS application"
  domain: "Task Management"
  type: "fullstack"            # fullstack | backend | frontend | custom

components:
  contract: true
  server: true
  webapp: true
  config: true
  helm: false
  testing: true
  cicd: true
```

## Operations

### Operation: `create`

Initialize a new settings file.

**Input:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `plugin_version` | Yes | Current SDD plugin version |
| `project_name` | Yes | Project name |
| `project_description` | Yes | Project description |
| `project_domain` | Yes | Primary domain |
| `project_type` | Yes | One of: `fullstack`, `backend`, `frontend`, `custom` |
| `components` | Yes | Object with component flags |

**Workflow:**

1. Check if `sdd-settings.yaml` already exists
   - If exists: Warn and ask for confirmation to overwrite
   - If confirmed or doesn't exist: Continue

2. Get current date in `YYYY-MM-DD` format

3. Create settings object:
   ```yaml
   sdd:
     plugin_version: <plugin_version>
     initialized_at: <current_date>
     last_updated: <current_date>

   project:
     name: <project_name>
     description: <project_description>
     domain: <project_domain>
     type: <project_type>

   components:
     contract: <components.contract or false>
     server: <components.server or false>
     webapp: <components.webapp or false>
     config: <components.config or false>
     helm: <components.helm or false>
     testing: <components.testing or false>
     cicd: <components.cicd or false>
   ```

4. Write to `sdd-settings.yaml` with proper YAML formatting

5. Return:
   ```yaml
   success: true
   path: sdd-settings.yaml
   ```

**Example:**

```
Input:
  plugin_version: "3.0.1"
  project_name: "my-app"
  project_description: "A task management SaaS application"
  project_domain: "Task Management"
  project_type: "fullstack"
  components:
    contract: true
    server: true
    webapp: true
    config: true
    helm: false
    testing: true
    cicd: true

Output:
  success: true
  path: sdd-settings.yaml
```

---

### Operation: `read`

Load and return current settings.

**Input:**

None (reads from standard location)

**Workflow:**

1. Check if `sdd-settings.yaml` exists
   - If not: Return error with `exists: false`

2. Read and parse YAML file

3. Validate required fields exist:
   - `sdd.plugin_version`
   - `sdd.initialized_at`
   - `project.name`
   - `project.type`
   - `components` (object)

4. Return parsed settings

**Output:**

```yaml
exists: true
settings:
  sdd:
    plugin_version: "3.0.1"
    initialized_at: "2026-01-21"
    last_updated: "2026-01-21"
  project:
    name: "my-app"
    description: "A task management SaaS application"
    domain: "Task Management"
    type: "fullstack"
  components:
    contract: true
    server: true
    webapp: true
    config: true
    helm: false
    testing: true
    cicd: true
```

**Error Output (file not found):**

```yaml
exists: false
error: "sdd-settings.yaml not found."
```

---

### Operation: `update`

Merge partial updates into existing settings.

**Input:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `updates` | Yes | Partial settings object to merge |

**Workflow:**

1. Call `read` operation to get current settings
   - If file doesn't exist: Return error

2. Deep merge `updates` into current settings:
   - Top-level keys in `updates` replace corresponding keys
   - Nested objects are merged recursively
   - `null` values remove keys

3. Update `sdd.last_updated` to current date

4. Write merged settings to `sdd-settings.yaml`

5. Return updated settings

**Example - Update description:**

```
Input:
  updates:
    project:
      description: "An enterprise task management platform"

Output:
  success: true
  settings:
    sdd:
      plugin_version: "3.0.1"
      initialized_at: "2026-01-21"
      last_updated: "2026-01-21"  # Updated to today
    project:
      name: "my-app"
      description: "An enterprise task management platform"  # Updated
      domain: "Task Management"
      type: "fullstack"
    components:
      contract: true
      server: true
      webapp: true
      config: true
      helm: false
      testing: true
      cicd: true
```

**Example - Add a component:**

```
Input:
  updates:
    components:
      helm: true

Output:
  success: true
  settings:
    # ... (helm is now true, last_updated changed)
```

---

## Error Handling

| Error | Handling |
|-------|----------|
| File not found (read/update) | Return `exists: false` with helpful message |
| Invalid YAML | Return parse error with line number if possible |
| Missing required fields | Return validation error listing missing fields |
| Permission denied | Return error with suggestion to check file permissions |
| File exists (create) | Warn and ask for confirmation before overwriting |

## Validation

### Project Type Values

Valid values for `project.type`:
- `fullstack` - Full-stack application (contract + server + webapp)
- `backend` - Backend API only (contract + server)
- `frontend` - Frontend only (webapp)
- `custom` - Custom component selection

### Component Flags

All component flags must be boolean:
- `contract` - OpenAPI specification
- `server` - Node.js backend
- `webapp` - React frontend
- `config` - YAML configuration
- `helm` - Kubernetes Helm charts
- `testing` - Test setup (Testkube)
- `cicd` - GitHub Actions workflows
