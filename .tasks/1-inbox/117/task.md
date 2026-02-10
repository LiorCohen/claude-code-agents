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

Skills remain the domain experts (they know what a backend component needs, which files are conditional on settings). The CLI owns the execution (template copying, variable substitution, conditional evaluation, package.json merging, non-destructive checks).

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
      "type": "package_json_scripts",
      "scripts": {
        "task-service:dev": "npm run dev -w components/servers/task-service"
      }
    }
  ]
}
```

## Key Design Decisions

1. **Spec format** — declarative JSON with simple conditionals (`not_empty`, `equals`, `contains`)
2. **Engine primitives** — extracted from existing `project.ts` (template copying, variable substitution, directory creation, script generation)
3. **Non-destructive** — skip existing files by default (already implemented in project.ts)
4. **Settings integration** — engine reads `sdd-settings.yaml` for conditional evaluation

## Acceptance Criteria

- [ ] Generic scaffolding engine extracted from project.ts into shared module
- [ ] Declarative spec schema defined (JSON Schema)
- [ ] `scaffolding apply --spec spec.json` command works
- [ ] `scaffolding project` refactored to use the same engine internally
- [ ] Component skills updated to emit specs instead of describing file creation in prose
- [ ] Conditional operations work (when clauses based on settings)
- [ ] Non-destructive behavior preserved
- [ ] Existing tests pass, new tests cover the engine
