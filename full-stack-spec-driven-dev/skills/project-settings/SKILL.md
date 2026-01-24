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
  plugin_version: "3.5.3"      # SDD plugin version that created this project
  initialized_at: "2026-01-23" # Date project was initialized
  last_updated: "2026-01-23"   # Date settings were last modified

project:
  name: "my-app"
  description: "A task management SaaS application"
  domain: "Task Management"
  type: "fullstack"            # fullstack | backend | frontend | custom

components:
  # Single-instance components (boolean)
  contract: true
  config: true
  database: true
  helm: false
  testing: true
  cicd: true

  # Multi-instance components (list of names, or true for single unnamed instance)
  server: true                 # Single server: components/server/
  webapp: true                 # Single webapp: components/webapp/

  # OR for multiple instances:
  # server:                    # Multiple servers
  #   - api                    # components/server-api/
  #   - worker                 # components/server-worker/
  # webapp:                    # Multiple webapps
  #   - admin                  # components/webapp-admin/
  #   - public                 # components/webapp-public/
```

## Component Format

### Single-Instance Components

These components only support one instance:

| Component | Format | Example |
|-----------|--------|---------|
| `contract` | `true/false` | `contract: true` |
| `config` | `true/false` | `config: true` |
| `database` | `true/false` | `database: true` |
| `helm` | `true/false` | `helm: false` |
| `testing` | `true/false` | `testing: true` |
| `cicd` | `true/false` | `cicd: true` |

### Multi-Instance Components

`server` and `webapp` support multiple named instances:

**Single instance (default):**
```yaml
server: true    # Creates components/server/
webapp: true    # Creates components/webapp/
```

**Multiple instances:**
```yaml
server:         # Creates components/server-api/ and components/server-worker/
  - api
  - worker
webapp:         # Creates components/webapp-admin/ and components/webapp-public/
  - admin
  - public
```

**Mixed:**
```yaml
server:
  - api
  - worker
webapp: true    # Single webapp is fine with multiple servers
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
| `components` | Yes | Object with component configuration |

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
     server: <components.server or false>      # Can be true, false, or list
     webapp: <components.webapp or false>      # Can be true, false, or list
     database: <components.database or false>
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

**Example - Standard Full-Stack:**

```
Input:
  plugin_version: "3.5.3"
  project_name: "my-app"
  project_description: "A task management SaaS application"
  project_domain: "Task Management"
  project_type: "fullstack"
  components:
    contract: true
    server: true
    webapp: true
    database: false
    config: true
    helm: false
    testing: true
    cicd: true

Output:
  success: true
  path: sdd-settings.yaml
```

**Example - Multi-Component:**

```
Input:
  plugin_version: "3.5.3"
  project_name: "my-platform"
  project_description: "A multi-tenant SaaS platform"
  project_domain: "Platform"
  project_type: "custom"
  components:
    contract: true
    server:
      - api
      - worker
      - scheduler
    webapp:
      - admin
      - public
    config: true
    helm: true
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
    plugin_version: "3.5.3"
    initialized_at: "2026-01-23"
    last_updated: "2026-01-23"
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

**Example - Add a server component:**

```
Input:
  updates:
    components:
      server:
        - api
        - worker

Output:
  success: true
  settings:
    # ... (server is now a list, last_updated changed)
```

---

### Operation: `get_component_dirs`

Get the actual directory names for all components.

**Input:**

None (reads from settings)

**Output:**

```yaml
directories:
  contract: "components/contract"           # or null if disabled
  config: "components/config"               # always present
  database: "components/database"           # or null if disabled
  server:                                   # list of server directories
    - "components/server"                   # if server: true
    # OR
    - "components/server-api"               # if server: [api, worker]
    - "components/server-worker"
  webapp:                                   # list of webapp directories
    - "components/webapp"                   # if webapp: true
    # OR
    - "components/webapp-admin"             # if webapp: [admin, public]
    - "components/webapp-public"
  helm: null                                # null if disabled
  testing: "components/testing"             # or null if disabled
```

This operation is useful for agents that need to know which directories exist.

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

### Component Values

**Single-instance components** (boolean only):
- `contract` - OpenAPI specification
- `config` - YAML configuration
- `database` - PostgreSQL migrations and seeds
- `helm` - Kubernetes Helm charts
- `testing` - Test setup (Testkube)
- `cicd` - GitHub Actions workflows

**Multi-instance components** (boolean or list):
- `server` - Node.js backend(s)
  - `true` → single `components/server/`
  - `false` → no server
  - `["api", "worker"]` → `components/server-api/`, `components/server-worker/`
- `webapp` - React frontend(s)
  - `true` → single `components/webapp/`
  - `false` → no webapp
  - `["admin", "public"]` → `components/webapp-admin/`, `components/webapp-public/`

### Instance Naming Rules

When using lists for `server` or `webapp`:
- Names must be lowercase
- Use hyphens, not underscores
- No spaces allowed
- Examples: `api`, `worker`, `admin`, `public`, `background-jobs`
