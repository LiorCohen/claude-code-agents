---
id: 117
title: Generic scaffolding engine in system CLI
priority: high
status: open
created: 2026-02-10
depends_on: []
blocks: []
---

# Task 117: Generic scaffolding engine in system CLI

## Description

Create a generic, declarative scaffolding engine in the system CLI that component skills can invoke with different configurations. Instead of duplicating the same copy-templates-substitute-variables pattern across multiple CLI commands or leaving deterministic file operations in skill prompts, build one engine that accepts a declarative "scaffold spec" and executes it.

Skills remain the domain experts (they know what a backend component needs, which files are conditional on settings). The CLI owns the execution (template copying, variable substitution, conditional evaluation, package.json script addition, non-destructive checks).

## Current State

- `scaffolding project` in `project.ts` (~900 lines) already handles bulk project scaffolding — directories, template copying, variable substitution, npm scripts
- 6 component-specific scaffolding skills describe settings-driven conditional logic in prose (backend, frontend, config, contract, database, helm)
- The conditional logic is deterministic (no LLM judgment needed) but currently executed by the LLM reading skill descriptions

## Proposed Architecture

A `scaffolding apply` command that accepts a declarative spec:

```json
{
  "target_dir": "/path/to/project",
  "variables": {
    "PROJECT_NAME": "my-app",
    "SERVER_NAME": "task-service"
  },
  "operations": [
    {
      "type": "template_dir",
      "source": "path/to/templates",
      "dest": "components/servers/task-service"
    },
    {
      "type": "template_dir",
      "source": "path/to/templates-dal",
      "dest": "components/servers/task-service/src/dal/primary-db",
      "when": { "setting": "databases", "not_empty": true }
    },
    {
      "type": "mkdir",
      "path": "components/servers/task-service/src/controller/http_handlers",
      "when": { "setting": "provides_contracts", "not_empty": true }
    },
    {
      "type": "write_file",
      "path": "components/servers/task-service/.gitignore",
      "content": "node_modules/\ndist/\n"
    },
    {
      "type": "package_json_scripts",
      "scripts": {
        "task-service:dev": "npm run dev -w components/servers/task-service",
        "task-service:build": "npm run build -w components/servers/task-service"
      }
    }
  ]
}
```

## Key Design Decisions

1. **Spec format** — declarative JSON with simple conditionals (`not_empty`, `equals`, `contains`)
2. **Engine primitives** — extracted from existing `project.ts` (template copying, variable substitution, directory creation, file writing, script addition)
3. **Non-destructive** — skip existing files by default (already implemented in project.ts)
4. **Settings integration** — engine reads `sdd-settings.yaml` for conditional evaluation
5. **No meta-scripts** — drop the cross-component `dev`/`build`/`test`/`start` meta-scripts entirely. Each component spec is self-contained, only adding its own scripts. Eliminates `npm-run-all` dependency and the `generateMetaScripts` logic. Users compose their own orchestration if needed.
6. **Repeating elements** — support `for_each` for settings arrays (e.g., one DAL directory per database, one config section per contract)
7. **Template set selection** — support choosing between template directories based on settings (e.g., Helm picks `templates-server/` vs `templates-webapp/` based on component type)

## Operation Types

| Operation | Description | Example Use |
|-----------|-------------|-------------|
| `template_dir` | Copy directory of templates with variable substitution | Backend CMDO structure, frontend MVVM |
| `template_file` | Copy single template file with substitution | Individual config files |
| `mkdir` | Create directory (with optional .gitkeep) | Empty barrel directories |
| `write_file` | Write file with literal content | .gitignore, .claudeignore |
| `package_json_scripts` | Add scripts to root package.json | Per-component dev/build/test scripts |

## Complexity Tiers

### Tier 1: Straightforward (engine handles directly)
- **Frontend** — template copy + variable substitution, no conditionals
- **Contract** — template copy + variable substitution + .gitignore
- **Database** — template copy, no conditionals
- **Project structure** — directories, root files, .gitkeep files

### Tier 2: Conditional (engine handles with `when` + `for_each`)
- **Backend** — base structure always, DAL per database, HTTP handlers per contract
- **Helm** — template set selection based on deployment type, conditional ingress/service

### Tier 3: Dynamic generation (skills handle, engine assists)
- **Config sections** — generated dynamically per component from settings (not template-based). Skills build the YAML content, engine writes it with append-only semantics.
- **Architecture overview** — generated from component list. Skill builds content, engine writes it.

## Acceptance Criteria

- [ ] Generic scaffolding engine extracted from project.ts into shared module
- [ ] Declarative spec schema defined (JSON Schema)
- [ ] `scaffolding apply --spec spec.json` command works
- [ ] All operation types implemented: `template_dir`, `template_file`, `mkdir`, `write_file`, `package_json_scripts`
- [ ] Conditional operations work (`when` clauses based on settings)
- [ ] `for_each` support for repeating elements
- [ ] Template set selection support
- [ ] `scaffolding project` refactored to use the engine internally
- [ ] Meta-scripts removed from project scaffolding
- [ ] Component skills updated to emit specs instead of describing file creation in prose
- [ ] Non-destructive behavior preserved (skip existing files)
- [ ] Existing tests pass, new tests cover the engine
