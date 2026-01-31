---
id: 62
title: Unified CLI system
priority: high
status: complete
created: 2026-01-29
completed: 2026-01-30
plan: ../../plans/complete/PLAN-task-62-unified-cli-system.md
---

# Task 62: Consolidate all plugin TypeScript into unified CLI system ✓

## Summary

Created a new `plugin/system/` directory containing a unified TypeScript CLI tool that consolidates all plugin scripting functionality:
- Single entry point CLI (`sdd-system`) with namespaced commands
- **Namespaces:** scaffolding, spec, version, hook, database, contract
- Migrated all TypeScript scripts from `plugin/scripts/` to unified location
- Converted shell hook scripts to TypeScript (single `hook-runner.sh` wrapper remains)
- Unified build process with npm workspaces
- Type-safe command handlers with consistent error handling
- JSON output mode for all commands
- Source maps for debugging

**Files Created:**
- `plugin/system/` - New CLI package (~30 files)
- `plugin/hooks/hook-runner.sh` - Thin shell wrapper for hooks
- `plugin/commands/sdd-run.md` - Unified `/sdd-run` command
- `plugin/system/src/lib/schema-validator.ts` - JSON Schema validation utility
- JSON Schema definitions in all 6 command namespace index files

**Files Deleted:**
- `plugin/scripts/` directory (5 files)
- `plugin/skills/scaffolding/scaffolding.ts`
- `plugin/skills/domain-population/domain-population.ts`
- `plugin/hooks/validate-sdd-writes.sh`
- `plugin/hooks/prompt-commit-after-write.sh`
- `plugin/package.json`
- `plugin/tsconfig.json`

**Supersedes:** #58 (shell→TS), #61 (consolidate TS files)
