---
id: 162
title: Split SDD into sdd-engine org repos (sdd-core + sdd-fullstack-typescript-techpack)
priority: high
status: speccing
created: 2026-02-23 20:00 UTC
depends_on: []
blocks: []
---

# Task 162: Split SDD into sdd-engine org repos (sdd-core + sdd-fullstack-typescript-techpack)

## Description

Create two new public repositories under the `sdd-engine` GitHub org:
- `sdd-engine/sdd-core` — core plugin (commands, skills, system CLI, permissions)
- `sdd-engine/sdd-fullstack-typescript-techpack` — fullstack TypeScript tech pack (agents, skills, templates, techpack.yaml)

The existing `LiorCohen/sdd` repository remains as-is for current users.

## Acceptance Criteria

- [ ] `sdd-engine/sdd-core` repo exists with core plugin contents
- [ ] `sdd-engine/sdd-fullstack-typescript-techpack` repo exists with techpack contents
- [ ] Both repos are public
- [ ] Both repos have proper README, plugin.json/marketplace.json manifests
- [ ] `LiorCohen/sdd` remains unchanged
