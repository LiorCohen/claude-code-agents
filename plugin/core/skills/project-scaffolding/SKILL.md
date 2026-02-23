---
name: project-scaffolding
description: Scaffolds project-level structure (root files, specs).
user-invocable: false
---

# Project Scaffolding Skill

Creates the non-component parts of an SDD project: root files and specs directory.

## Modes

### Minimal Mode (Default for `/sdd I want to initialize a new project`)

Creates only the essential structure needed to start. Additional components are scaffolded during implementation when the plan includes a scaffolding phase.

```yaml
mode: minimal
project_name: my-app
target_dir: /path/to/project
```

**Creates:**

```text
project/
├── sdd/
│   └── sdd-settings.yaml     # Minimal settings
├── specs/
│   └── INDEX.md              # Empty spec registry
├── package.json              # Root project (from tech pack template)
├── README.md
├── CLAUDE.md
└── .gitignore
```

**NOT created in minimal mode:**
- `changes/` directory
- `specs/domain/` subdirectories
- `specs/architecture/`
- `specs/SNAPSHOT.md`

### Full Mode (Legacy)

Creates the complete structure. Used when upgrading or explicitly requested.

```yaml
mode: full
project_name: my-app
project_description: My application
primary_domain: Task Management
target_dir: /path/to/project
```

**Creates:**

```text
project/
├── sdd/
│   └── sdd-settings.yaml
├── specs/
│   ├── INDEX.md
│   ├── SNAPSHOT.md
│   └── domain/
│       ├── glossary.md
│       ├── definitions/
│       └── use-cases/
├── changes/
│   └── INDEX.md
├── README.md
├── CLAUDE.md
├── package.json
└── .gitignore
```

## Non-Destructive Behavior (CRITICAL)

This skill NEVER overwrites existing files:

- Before writing any file, check if it exists
- If exists: skip (log that file was skipped)
- If missing: create

This makes it safe to run multiple times for repair/upgrade scenarios.

## When to Use

Use during:
- `/sdd I want to initialize a new project` in minimal mode
- Upgrade/repair workflows in full mode

## Template Variables

| Variable | Description |
|----------|-------------|
| `{{PROJECT_NAME}}` | Project name (lowercase, hyphens) |
| `{{PROJECT_DESCRIPTION}}` | Brief project description |
| `{{PRIMARY_DOMAIN}}` | Primary business domain |
| `{{PLUGIN_VERSION}}` | SDD plugin version |
| `{{CURRENT_DATE}}` | Current date (YYYY-MM-DD) |

## Minimal sdd-settings.yaml Template

Use the minimal template defined in the `project-settings` skill (see its "Minimal Template" section). That skill is the authoritative source for the sdd-settings.yaml schema and template format.

## Minimal specs/INDEX.md Template

```markdown
# Specifications Index

This file tracks all specifications in the project.

## Changes

No changes yet. Create your first change with:

```
/sdd I want to create a new feature
```text

## Domain Knowledge

Domain knowledge (glossary, personas, use cases) is populated when you create changes.
```

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts scaffolding mode, project name, target directory, and optional description and domain.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns success status and list of created files.

## Templates Location

Templates are in this skill's `templates/` directory:

```text
skills/project-scaffolding/templates/
├── project/
│   ├── package.json        # Root project package.json
│   ├── README.md
│   └── CLAUDE.md
├── specs/
│   ├── SNAPSHOT.md
│   └── glossary.md
└── changes/
    └── INDEX.md
```

## .gitignore Rules

**CRITICAL: The `sdd/` directory MUST be version controlled.**

The generated `.gitignore` should:
- Include standard ignores (node_modules, build artifacts, IDE files)
- **NEVER include `sdd/` or any `sdd/*` patterns**
- **NEVER include `specs/` or `changes/` directories**

### Required .gitignore Content

```gitignore
# Dependencies
node_modules/

# Build outputs
dist/
build/
*.tsbuildinfo

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local
.env.*.local

# Logs
*.log
logs/

# Test coverage
coverage/

# IMPORTANT: sdd/ is NOT ignored - it contains version-controlled SDD artifacts
# Do NOT add sdd/ to this file
```

### Repair Behavior

When running in repair/upgrade mode, check existing `.gitignore`:
1. If `.sdd` or `sdd/` pattern exists, remove it
2. If `specs/` pattern exists, remove it
3. If `changes/` pattern exists, remove it
4. Log warning: "Removed .sdd from .gitignore - SDD artifacts must be version controlled"

## Scaffold Spec

Project scaffolding uses the scaffolding engine internally. The `scaffolding project` command builds a spec from the project config and calls `executeSpec`. You do not need to invoke `scaffolding apply` separately for project-level files — the CLI handles it.

### Engine Integration

The project scaffolding CLI:

1. Translates `ScaffoldingConfig` into a `ScaffoldSpec`
2. Maps each component to `template_dir` operations (using colocated templates in each component skill)
3. Generates inline content (`.gitignore`, `.claudeignore`, architecture overview) as `write_file` operations
4. Computes per-component scripts and adds `package_json_scripts` operations
5. Executes the full spec via the engine

### Example Spec (generated internally)

```json
{
  "target_dir": "<project-root>",
  "base_dir": "<plugin-root>/skills",
  "variables": {
    "PROJECT_NAME": "my-app",
    "PROJECT_DESCRIPTION": "My application",
    "PRIMARY_DOMAIN": "Task Management"
  },
  "operations": [
    {
      "type": "template_dir",
      "source": "project-scaffolding/templates/project",
      "dest": "."
    },
    {
      "type": "write_file",
      "path": ".gitignore",
      "content": "<computed-content>",
      "if_exists": "skip"
    }
  ]
}
```

## Related Skills

Component scaffolding skills are provided by the active tech pack. Invoke `techpacks.routeSkills(phase: project-scaffolding)` to load the tech-specific scaffolding orchestration skill. For each component type, the manifest's `components.<type>.scaffolding` field points to the scaffolding skill. Use `techpacks.resolvePath` to get absolute paths for template directories passed to the scaffolding engine.
