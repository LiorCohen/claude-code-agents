---
task: 162
title: Split SDD into sdd-engine org repos
generated: 2026-02-24 08:13 UTC
---

# Changes Summary

## Overview

Split the monolithic `LiorCohen/sdd` plugin into 4 independent repos under the `sdd-engine` GitHub organization. Phase A made all code changes on a feature branch (settings rename, git-mode tech pack install, top-level components, version bump to 7.3.0), merged to main locally (never pushed). Phase B created the 4 repos and distributed code from merged main.

## Repos Created

| Repo | Visibility | Description |
|------|-----------|-------------|
| `sdd-engine/sdd-core` | Public | Core SDD plugin (commands, skills, system CLI, permissions, docs) |
| `sdd-engine/sdd-fullstack-typescript-techpack` | Public | Fullstack TypeScript tech pack (agents, skills, templates, system CLI) |
| `sdd-engine/sdd-vscode-extension` | Public | VS Code extension for workflow visualization |
| `sdd-engine/workspace` | Private | Dev workspace (skills, tasks, critic, tests, changelogs) |

## Phase A — Code Changes (LiorCohen/sdd, local only)

| File/Area | Change |
|-----------|--------|
| `types/settings.ts` | Renamed `tech_packs` → `techpacks`, added `mode: 'git'`, `repo`, `ref`, `install_path` fields, moved components to top-level |
| `settings/schema.ts` | Updated JSON schema for new `techpacks` key, git-mode fields, top-level components |
| `settings/validate.ts` | Updated validation for top-level components, techpack back-reference |
| `settings/reconcile.ts` | Added migration: `tech_packs` → `techpacks`, nested components → top-level |
| `settings/sync.ts` | Renamed all `tech_packs` references, updated component diffing |
| `tech-pack/*.ts` | Added git clone flow, no-args reinstall, `mode: git` path resolution |
| `scaffolding/project.ts` | Added `sdd/.techpacks/` to generated `.gitignore` |
| `techpack.yaml` | Renamed `tech_pack:` → `techpack:`, updated `min_sdd_version` |
| JSON schemas | Updated `sdd-settings.schema.json` and `techpack.schema.json` |
| Skill markdown files | Renamed `tech_pack`/`tech_packs` → `techpack`/`techpacks` throughout |

## Phase B — Repo Population

### sdd-core
- Flattened `plugin/core/` → `plugin/` (no `core/` prefix)
- Created `plugin.json` (0.1.0) and `marketplace.json` (0.1.0)
- Copied core docs (getting-started, commands, workflows, tutorial, external-specs, workflow-progress)
- Created `.github/workflows/release.yml`
- Fresh README.md, CLAUDE.md, CONTRIBUTING.md, CHANGELOG.md

### sdd-fullstack-typescript-techpack
- Moved `plugin/fullstack-typescript/` → `techpack/`
- Renamed `getPluginRoot` → `getTechpackRoot` with deprecated alias
- Added `SDD_TECHPACK_ROOT` env var (fallback to `CLAUDE_PLUGIN_ROOT`)
- Copied tech-pack docs (agents, components, config-guide)
- Created `.github/workflows/release.yml`

### sdd-vscode-extension
- Copied `vscode-extension/` contents to repo root
- Added `repository`, `license` fields to package.json
- Created `.vscodeignore`, `docs/architecture.md`
- Created `.github/workflows/release.yml`

### workspace
- Copied `.claude/` skills adapted for multi-repo (`repos/<name>/` awareness)
- Copied `.tasks/` with full history, `.critic/`, `changelog/` (v1-v7), `tests/`
- Updated build commands in skills for per-repo structure

## Iteration Fixes (5 rounds)

| Iteration | Repos | Files Fixed | Key Fixes |
|-----------|-------|-------------|-----------|
| 2 | 2 | 19 | Stale paths, outdated schema, broken links |
| 3 | 4 | 14 | Stale structure diagrams, monorepo paths in workspace |
| 4 | 4 | 35 | 12 stale `core/` paths, ~54 stale `plugin-root/fullstack-typescript/` paths, docs broken links |
| 5 | 2 | 14 | `.sdd/` → `sdd/` in vscode extension (CRITICAL: watcher watched wrong dir), tech-pack-specific content removed from core docs, `vscode:prepublish` script added |
