---
id: 35
title: Checksumming and drift detection for specs/components
priority: inbox
status: open
created: 2026-01-25
blocks: [39, 50]
---

# Task 35: Checksumming and drift detection for specs/components

## Description

Create a skill for snapshot management and drift detection:
- **Snapshots**: Compute checksums of components and domain specs, store in `.sdd/` (committed to VCS)
- **Drift detection**: New command `/sdd-check-drift` or commit hook to detect when code drifts from specs
- Compare current code state against:
  - `specs/domain/` (domain concepts, glossary)
  - `specs/architecture/` (architectural decisions)
  - Active change specs in `specs/changes/`
- Identify violations or inconsistencies with specs
- Report what's out of sync and suggest remediation
- Goal: discourage direct changes but handle them gracefully when they occur

## Related

- Merged: #36 (Drift detection for direct code changes)
