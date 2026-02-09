---
id: 112
title: Add sdd-version command showing project and installed plugin versions
status: complete
created: 2026-02-09
completed: 2026-02-09
depends_on: []
blocks: []
---

# Task 112: Add sdd-version command showing project and installed plugin versions

## Description

Add a new `/sdd-version` command that displays:
1. The project's plugin version from `.sdd/sdd-settings.yaml` (`sdd.plugin_version`)
2. The actual installed plugin version from `plugin.json` (`version`)

This helps users quickly see if their project was initialized with a different plugin version than what's currently installed.

## Acceptance Criteria

- [ ] New command file at `plugin/commands/sdd-version.md`
- [ ] Shows project plugin version from sdd-settings
- [ ] Shows installed plugin version from plugin.json
- [ ] Highlights version mismatch when they differ
