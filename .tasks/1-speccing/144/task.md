---
id: 144
title: Remove user-facing commands sdd-config, sdd-run, and sdd-settings
status: speccing
priority: null
created: 2026-02-15
---

# Remove user-facing commands sdd-config, sdd-run, and sdd-settings

These are operator-level commands that users don't need to invoke directly — agents already handle calling the underlying system CLI.

## Scope

- Remove the command `.md` files from `plugin/commands/`:
  - `sdd-config.md`
  - `sdd-run.md`
  - `sdd-settings.md`
- Remove references to these as user-invocable commands (e.g., marketplace manifest, skill system reminders)

## Out of scope

- The underlying skills (config-standards, project-settings, local-env, etc.) remain intact
- The system CLI handlers remain intact
- `sdd-settings.yaml` and its management functionality remain intact
- Agent references to the system CLI (agents call the CLI directly, not through these commands)
