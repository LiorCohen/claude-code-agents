---
id: 50
title: Move sdd-settings.yaml to .sdd/ directory
priority: inbox
status: open
created: 2026-01-25
depends_on: [35]
---

# Task 50: Move sdd-settings.yaml to .sdd/ directory

## Description

Move the `sdd-settings.yaml` configuration file into the `.sdd/` directory:
- Consolidates all SDD project state/config in one location
- `.sdd/` becomes the single source for SDD metadata (settings, checksums, snapshots)
- Update all references to `sdd-settings.yaml` path
- Ensure backwards compatibility or migration path for existing projects
