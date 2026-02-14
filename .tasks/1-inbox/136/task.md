---
id: 136
title: Remove version bump command from system CLI
status: inbox
created: 2026-02-14 12:00 UTC
depends_on: []
blocks: []
---

# Task 136: Remove version bump command from system CLI

## Description

The `version bump` command (`plugin/system/src/commands/version/bump.ts`) operates on `marketplace.json` at the repo root, violating the plugin boundary rule. It reaches outside `plugin/` via `path.resolve(pluginRoot, '..')` to update the root-level `.claude-plugin/marketplace.json`.

Version bumping is a marketplace/release concern handled by the commit skill (`.claude/skills/commit/`), not a plugin system CLI responsibility. The entire `version` command namespace should be removed from the system CLI.

**Files to remove:**
- `plugin/system/src/commands/version/bump.ts`
- `plugin/system/src/commands/version/handler.ts`
- `plugin/system/src/commands/version/index.ts`
- `plugin/system/src/commands/version/schema.ts`

**Files to update:**
- `plugin/system/src/cli.ts` — remove `version` command registration
- Any types referenced only by the version command

## Acceptance Criteria

- [ ] `plugin/system/src/commands/version/` directory is deleted
- [ ] `version` command registration removed from `cli.ts`
- [ ] No dead types left behind from the removal
- [ ] `npm run build:plugin` succeeds
- [ ] `npm test` passes
- [ ] Commit skill still handles version bumping independently
