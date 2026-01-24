---
name: scaffolding
description: Orchestrates project scaffolding using component-specific scaffolding skills.
---

# Scaffolding Skill

Orchestrates project scaffolding by delegating to component-specific scaffolding skills.

## Architecture

This skill coordinates multiple component scaffolding skills:

| Skill | Purpose | Templates Location |
|-------|---------|-------------------|
| `project-scaffolding` | Root files, specs, config | `skills/project-scaffolding/templates/` |
| `backend-scaffolding` | Server components (CMDO) | `skills/backend-scaffolding/templates/` |
| `frontend-scaffolding` | Webapp components (MVVM) | `skills/frontend-scaffolding/templates/` |
| `contract-scaffolding` | OpenAPI contract | `skills/contract-scaffolding/templates/` |
| `database-scaffolding` | PostgreSQL database | `skills/database-scaffolding/templates/` |

## When to Use

Use this skill when you need to create the SDD project structure after the user has approved the project configuration.

## Usage

After gathering project configuration in `/sdd-init`, call the scaffold script:

```bash
# 1. Create a config JSON file
cat > /tmp/sdd-scaffold-config.json << 'EOF'
{
    "project_name": "<user-provided-name>",
    "project_description": "<user-provided-description>",
    "primary_domain": "<user-provided-domain>",
    "target_dir": "<absolute-path-to-project-directory>",
    "components": ["contract", "server", "webapp", "config", "testing", "cicd"],
    "skills_dir": "<path-to-plugin>/skills"
}
EOF

# 2. Run the scaffold script
python3 <path-to-plugin>/skills/scaffolding/scaffolding.py --config /tmp/sdd-scaffold-config.json

# 3. Clean up config file
rm /tmp/sdd-scaffold-config.json
```

## Config Fields

| Field | Required | Description |
|-------|----------|-------------|
| `project_name` | Yes | Project name (used for variable substitution) |
| `project_description` | No | Brief description (defaults to "A {name} project") |
| `primary_domain` | No | Primary business domain (defaults to "General") |
| `target_dir` | Yes | Absolute path to create project in |
| `components` | Yes | List of components to create (see below for formats) |
| `skills_dir` | Yes | Path to the skills directory (templates are colocated) |

## Component Naming

Components can be specified in two formats:

### Simple Format (Single Instance)

```json
["contract", "server", "webapp", "config", "testing", "cicd"]
```

Creates: `components/contract/`, `components/server/`, `components/webapp/`

### Named Format (Multiple Instances)

```json
["contract", "server:api", "server:worker", "webapp:admin", "webapp:public", "config", "testing", "cicd"]
```

Creates: `components/server-api/`, `components/server-worker/`, `components/webapp-admin/`, `components/webapp-public/`

### Naming Rules

| Rule | Example | Notes |
|------|---------|-------|
| Lowercase | `webapp:admin` ✓ | All names must be lowercase |
| Hyphens allowed | `server:background-worker` ✓ | Use hyphens, not underscores |
| No spaces | `server:my server` ✗ | Spaces not allowed |
| Type prefix auto-added | `server:api` → `server-api/` | Directory gets type prefix |

## Available Components

| Component | Scaffolding Skill | Multiple Instances |
|-----------|-------------------|-------------------|
| `contract` | `contract-scaffolding` | No |
| `server` | `backend-scaffolding` | Yes |
| `webapp` | `frontend-scaffolding` | Yes |
| `database` | `database-scaffolding` | No |
| `config` | `project-scaffolding` | No (always included) |
| `helm` | (inline) | No |
| `testing` | (inline) | No |
| `cicd` | (inline) | No |

## Component Presets

**Full-Stack Application (default):**
```json
["contract", "server", "webapp", "config", "testing", "cicd"]
```

**Backend API Only:**
```json
["contract", "server", "config", "testing", "cicd"]
```

**Frontend Only:**
```json
["webapp", "config", "testing", "cicd"]
```

**Multi-Backend:**
```json
["contract", "server:api", "server:worker", "config", "testing", "cicd"]
```

**Multi-Frontend:**
```json
["contract", "server", "webapp:admin", "webapp:public", "config", "testing", "cicd"]
```

**Backend with Database:**
```json
["contract", "server", "database", "config", "testing", "cicd"]
```

## Scaffolding Order

The script executes in this order:

1. **Project scaffolding** - Root files, specs, config (always first)
2. **Contract scaffolding** - OpenAPI spec (if selected)
3. **Backend scaffolding** - Server components (for each instance)
4. **Frontend scaffolding** - Webapp components (for each instance)
5. **Database scaffolding** - Migrations, seeds, scripts (if selected)
6. **Infrastructure** - Helm, testing, CI/CD (inline, if selected)

## Template Locations

Templates are colocated with their scaffolding skills:

```
skills/
├── project-scaffolding/
│   ├── SKILL.md
│   └── templates/
│       ├── project/          # README.md, CLAUDE.md, package.json
│       ├── specs/            # INDEX.md, SNAPSHOT.md, glossary.md
│       └── config/           # config.yaml, schemas/
├── backend-scaffolding/
│   ├── SKILL.md
│   └── templates/            # Server component files
├── frontend-scaffolding/
│   ├── SKILL.md
│   └── templates/            # Webapp component files
├── contract-scaffolding/
│   ├── SKILL.md
│   └── templates/            # openapi.yaml, package.json
├── database-scaffolding/
│   ├── SKILL.md
│   └── templates/            # migrations/, seeds/, scripts/
└── scaffolding/
    ├── SKILL.md              # This file (orchestrator)
    └── scaffolding.py        # Python script
```

## After Scaffolding

1. **Initialize git** (if not already in a repo):
   ```bash
   cd <project-dir> && git init && git add . && git commit -m "Initial project setup"
   ```

2. **Verify structure** with `tree` command

3. **Display next steps** to the user
