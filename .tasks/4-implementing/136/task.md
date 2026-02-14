---
id: 136
title: Remove version bump command from system CLI
status: implementing
created: 2026-02-14 12:00 UTC
depends_on: []
blocks: []
---

# Task 136: Remove version bump command from system CLI

## Description

The `version bump` command (`plugin/system/src/commands/version/bump.ts`) operates on `marketplace.json` at the repo root, violating the plugin boundary rule. It reaches outside `plugin/` via `path.resolve(pluginRoot, '..')` to update the root-level `.claude-plugin/marketplace.json`.

Version bumping is a marketplace/release concern handled by the commit skill (`.claude/skills/commit/`), not a plugin system CLI responsibility.

### What to remove

The `bump` action and the `version` namespace (since `bump` is the only action). If future plugin-scoped version actions are needed (e.g., reading the current plugin version), the namespace can be re-added with properly scoped commands.

**Files to remove:**
- `plugin/system/src/commands/version/bump.ts`
- `plugin/system/src/commands/version/handler.ts`
- `plugin/system/src/commands/version/index.ts`
- `plugin/system/src/commands/version/schema.ts`

**Files to update:**
- `plugin/system/src/cli.ts` — remove `version` command registration

### Types to audit

- `VersionInfo` — pure semver struct, may be used elsewhere. Keep if referenced outside version commands.
- `MarketplaceJson` / `MarketplacePlugin` — describe a repo-root file. Remove if only used by `bump.ts`. If used elsewhere (e.g., hooks), evaluate whether those uses also violate the boundary.
- `PluginJson` — describes `plugin.json`, legitimately plugin-scoped. Keep.

## Acceptance Criteria

- [ ] `plugin/system/src/commands/version/` directory is deleted
- [ ] `version` command registration removed from `cli.ts`
- [ ] `MarketplaceJson`/`MarketplacePlugin` types removed if only used by bump (or boundary violations flagged)
- [ ] `VersionInfo` kept only if referenced outside version commands
- [ ] No dead types or exports left behind
- [ ] `npm run build:plugin` succeeds
- [ ] `npm test` passes
- [ ] Commit skill still handles version bumping independently
