---
task_id: 136
title: Remove version bump command from system CLI
status: draft
---

# Plan: Remove version bump command from system CLI

## Overview

Remove the `version` command namespace from the system CLI. It contains a single action (`bump`) that violates the plugin boundary rule by navigating to the plugin's source repo root to modify `marketplace.json`. Version bumping is handled by the commit skill via Claude's Edit tool — the CLI command is unused dead code.

## Steps

### Step 1: Delete version command directory

Delete `plugin/system/src/commands/version/` (4 files: `bump.ts`, `handler.ts`, `index.ts`, `schema.ts`).

### Step 2: Remove version registration from cli.ts

In `plugin/system/src/cli.ts`:
- Remove import: `import { handleVersion } from '@/commands/version';` (line 33)
- Remove `'version'` from `NAMESPACES` array (line 44)
- Remove `version: handleVersion` from `COMMAND_HANDLERS` (line 136)
- Remove version entries from JSDoc header comment (line 10) and `HELP_TEXT` (lines 62-63, 123)

### Step 3: Remove dead types from config.ts

In `plugin/system/src/types/config.ts`, remove:
- `VersionInfo` type (lines 5-9) — only used by `bump.ts`
- `MarketplaceJson` type (lines 17-19) — only used by `bump.ts`
- `MarketplacePlugin` type (lines 21-25) — only used by `bump.ts`

Keep `PluginJson` and all hook-related types (legitimately plugin-scoped).

### Step 4: Update types/index.ts re-exports

In `plugin/system/src/types/index.ts`, remove `VersionInfo`, `MarketplaceJson`, `MarketplacePlugin` from the export statement.

## Verification

- `npm run build:plugin` — typecheck + build succeeds
- `npm test` — tests pass
- Verify no remaining imports of deleted types
