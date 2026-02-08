---
id: 103
title: Validate sdd-settings writes against schema during sdd-change workflows
status: planning
created: 2026-02-08
depends_on: []
blocks: []
---

# Task 103: Validate sdd-settings writes against schema during sdd-change workflows

## Description

During `sdd-change` workflows, settings are frequently added to `sdd-settings.yaml` that do not comply with the defined schema. This leads to invalid or unexpected entries accumulating in the settings file over time.

All writes to `sdd-settings.yaml` must be validated against the schema before being persisted. Non-compliant entries should be rejected with a clear error message rather than silently written.

## Acceptance Criteria

- [ ] All sdd-settings writes are validated against the schema before persisting
- [ ] Non-compliant entries are rejected with a clear error describing the violation
- [ ] Existing sdd-change workflows cannot introduce invalid settings
- [ ] Schema validation covers required fields, allowed values, and structure
- [ ] No regression in valid sdd-change workflows
