---
id: 79
title: Use project-name-derived component names in on-demand scaffolding
priority: medium
status: inbox
created: 2026-02-02
depends_on: [78]
blocks: []
---

# Task 79: Use project-name-derived component names in on-demand scaffolding

## Description

When components are scaffolded on-demand (via sdd-change new), they should use project-name-derived names instead of generic names like `task-api`, `task-server`.

With the minimal sdd-init redesign (#78), scaffolding happens when the first change targets an unscaffolded component. At that point, the component should be named `{project-name}-{type}` (e.g., `my-app-api`, `my-app-server`).

## Acceptance Criteria

- [ ] On-demand scaffolding uses project name from sdd-settings.yaml
- [ ] Components are named `{project-name}-{type}` (e.g., `my-app-api`, `my-app-server`, `my-app-db`)
- [ ] Update scaffolding skill to derive names from project context
- [ ] Update sdd-change new to pass project name when triggering scaffolding
- [ ] Update skill examples to show project-name-based naming
