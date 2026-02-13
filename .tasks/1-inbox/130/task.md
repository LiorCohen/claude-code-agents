---
id: 130
title: Add created_by_plugin_version to sdd-settings components
priority: high
status: inbox
created: 2026-02-13 15:00 UTC
depends_on: []
blocks: []
---

# Task 130: Add created_by_plugin_version to sdd-settings components

## Description

Add a `created_by_plugin_version` field to the different components in `sdd-settings.yaml`. This tracks which plugin version created each component, enabling future migration logic, debugging, and compatibility checks.

## Acceptance Criteria

- [ ] Each component entry in sdd-settings includes a `created_by_plugin_version` field
- [ ] The field is populated automatically when a component is created
- [ ] Existing components are backfilled or handled gracefully (field is optional for backwards compatibility)
- [ ] Schema is updated to include the new field
