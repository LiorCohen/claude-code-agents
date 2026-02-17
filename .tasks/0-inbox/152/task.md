---
id: 152
title: Add name field to workflow state
status: inbox
created: 2026-02-17 20:00 UTC
depends_on: []
blocks: []
---

# Task 152: Add name field to workflow state

## Description

Add a `name` field to `WorkflowState` so workflows have a short, memorable human-readable label in addition to their machine-generated `id`.

## Acceptance Criteria

- [ ] `WorkflowState` type includes a `name: string` field
- [ ] Workflow YAML schema docs reflect the new field
- [ ] Any code that creates workflows sets the `name` field
