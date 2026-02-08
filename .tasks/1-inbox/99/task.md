---
id: 99
title: sdd-init should ensure sdd-settings are updated during plugin updates
status: open
priority: high
created: 2026-02-08
depends_on: []
blocks: []
---

# Task 99: sdd-init should ensure sdd-settings are updated during plugin updates

## Description

When a user updates the SDD plugin to a newer version, `sdd-init` should detect that sdd-settings may be outdated and ensure they are updated to reflect any new settings, defaults, or schema changes introduced by the plugin update.

Currently, `sdd-init` handles initial setup but may not reconcile existing sdd-settings with newer plugin versions. This means users could be running with stale or incomplete settings after upgrading.

## Acceptance Criteria

- [ ] `sdd-init` detects when the plugin version has changed since last init
- [ ] Existing sdd-settings are reconciled with the current plugin's settings schema
- [ ] New settings introduced in the updated plugin are added with defaults
- [ ] Existing user-customized settings are preserved (not overwritten)
- [ ] Removed/deprecated settings are handled gracefully
- [ ] User is informed of any settings changes made during the update
