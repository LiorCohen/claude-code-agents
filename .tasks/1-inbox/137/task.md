---
id: 137
title: Split system CLI commands into internal and public categories
status: inbox
priority: high
created: 2026-02-14
---

# Split system CLI commands into internal and public categories

Split the system CLI's command namespaces into two categories:

- **Public** — User-facing commands that users can call directly (via `/sdd-run` or similar)
- **Internal** — Commands used only by the plugin internally (scaffolding, hooks, workflow gates, etc.)

## Current namespaces and proposed classification

| Namespace | Proposed | Rationale |
|-----------|----------|-----------|
| `database` | Public | Users manage their own databases |
| `contract` | Public | Users generate types, validate specs |
| `env` | Public | Users manage local environments |
| `config` | Public | Users generate/validate/diff configs |
| `permissions` | Internal | Called by `/sdd-init` only |
| `scaffolding` | Internal | Called by skills/agents |
| `spec` | Internal | Called by skills for validation/indexing |
| `version` | Internal | Called by commit skill |
| `hook` | Internal | Called by hook-runner.sh |
| `workflow` | Internal | Called by skills for phase gating |
| `settings` | Internal | Called by `/sdd-init` for reconciliation |
| `archive` | Internal | Called by skills for file archival |

## Motivation

- Users should be able to discover and run public commands without wading through internal ones
- Internal commands should be protected from accidental user invocation
- Clear separation improves documentation and help output
