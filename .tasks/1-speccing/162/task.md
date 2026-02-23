---
id: 162
title: Split SDD into sdd-engine org repos
priority: high
status: speccing
created: 2026-02-23 20:00 UTC
depends_on: []
blocks: []
---

# Split SDD into sdd-engine org repos

## Description

Create five repositories under the `sdd-engine` GitHub organization, splitting the current monolithic `LiorCohen/sdd` repo into independently distributable packages:

**Public repos:**
- **`sdd-engine/sdd-core`** — the core SDD plugin (commands, skills, system CLI, permissions). Installable as a Claude Code plugin via marketplace.
- **`sdd-engine/sdd-fullstack-typescript-techpack`** — the fullstack TypeScript tech pack (agents, skills, templates, system CLI, techpack.yaml). NOT a plugin — installed by core's `tech-pack install` command.
- **`sdd-engine/sdd-vscode-extension`** — the VS Code extension for SDD project status and workflow visibility.
- **`sdd-engine/docs`** — user-facing documentation (getting started, commands, workflows, agents, components).

**Private repo:**
- **`sdd-engine/workspace`** — development workspace. Contains all dev-time skills (.claude/), task management (.tasks/), and a `repos/` directory (gitignored) where the four public repos are cloned for local development.

The existing `LiorCohen/sdd` repository remains as-is for users already on the current monolithic structure.

Additionally, update the core's `tech-pack install` command to support git-based installation: cloning techpack repos into `sdd/.techpacks/<name>/` (gitignored, like `node_modules`), and supporting a no-args mode that reinstalls all registered techpacks from `sdd-settings.yaml`.

## Motivation

The monolithic plugin bundles core methodology with a specific tech stack (fullstack TypeScript), a VS Code extension, and documentation. This couples things that should be independent:

- Users who want SDD with a different stack (Python, Go, etc.) must take the TypeScript tech pack too
- Techpack authors can't iterate independently of core
- The VS Code extension has its own release cadence (marketplace publishing) unrelated to plugin versions
- Documentation updates shouldn't require changes to the plugin repo
- The plugin can't grow its ecosystem — every new stack requires changes to the core repo

Splitting into separate repos enables:
- Independent versioning and release cadence for each component
- Third-party techpack creation without touching core
- Cleaner installation: install core plugin, then install the techpack(s) you need
- `sdd/.techpacks/` as a gitignored dependency directory (like `node_modules`) with `sdd-settings.yaml` as the manifest
- VS Code extension published independently to the marketplace
- Documentation maintained and versioned separately
- Private workspace keeps dev tooling (skills, tasks, critic) out of public repos

## Scope

### In scope

- Create 4 public repos + 1 private workspace repo under `sdd-engine`
- Each public repo gets its own README.md and CLAUDE.md (fresh, repo-specific, up-to-date)
- Each public repo gets a 0.1.0 changelog with historical lineage from `LiorCohen/sdd`
- Workspace repo contains all dev-time `.claude/` skills (commit, tasks, critic, standards, etc.) and `.tasks/`
- Workspace has a multi-repo skill for commits, changelog management, and worktrees across repos
- Workspace `repos/` directory is gitignored — each public repo is cloned there independently
- Each repo handles its own build independently (no workspace-level npm workspaces)
- Update `tech-pack install` to support `--repo <url>` for git clone into `sdd/.techpacks/`
- Update `tech-pack install` (no args) to reinstall all techpacks from `sdd-settings.yaml`
- `sdd-core` gets `plugin.json` + `marketplace.json` manifests at version 0.1.0
- Path adjustments: current `plugin/core/*` flattens to `plugin/*` in sdd-core

### Out of scope

- Removing or deprecating `LiorCohen/sdd` — stays as-is
- CI/CD pipelines for the new repos (future task)
- Tests in the new repos (future task)
- Updating `LiorCohen/sdd` to reference the new repos
- Creating additional techpacks for other stacks

## Constraints

- `sdd-core` is a Claude Code plugin with `.claude-plugin/marketplace.json` and `plugin/.claude-plugin/plugin.json`
- `sdd-fullstack-typescript-techpack` is NOT a plugin — no `plugin.json`, no `marketplace.json`. It has `techpack/techpack.yaml` as its manifest.
- `sdd-vscode-extension` is a standalone VS Code extension — published independently to the VS Code marketplace
- `docs` is a standalone documentation repo — no plugin manifests, no code
- `workspace` is private — contains dev skills and task management, not shipped to users
- `workspace/repos/` is gitignored — each repo inside is an independent git clone
- Techpacks are installed into `sdd/.techpacks/<namespace>/` which is gitignored in user projects
- `sdd-settings.yaml` records registered techpacks (like `package.json` records deps) — this file IS committed
- `tech-pack install` (no args) reads `sdd-settings.yaml` and clones all registered techpacks — like `npm install` with no args
- All repos start at version 0.1.0
- The `min_sdd_version` field in `techpack.yaml` should reference the new core version scheme
- Each repo's README and CLAUDE.md must be written fresh and accurate for that repo's contents — not copied verbatim from `LiorCohen/sdd`
- Each repo handles its own build — no cross-repo npm workspaces

## Changes

| File/Area | Change |
|-----------|--------|
| **sdd-engine/sdd-core** | New public repo: `plugin/core/` flattened to `plugin/`, plus `plugin.json`, `marketplace.json`, README.md, CLAUDE.md, LICENSE, CHANGELOG.md, `package.json` for system workspace |
| **sdd-engine/sdd-fullstack-typescript-techpack** | New public repo: `plugin/fullstack-typescript/` under `techpack/`, plus README.md, CLAUDE.md, LICENSE, CHANGELOG.md, `package.json` for system workspace |
| **sdd-engine/sdd-vscode-extension** | New public repo: `vscode-extension/` contents, plus README.md, CLAUDE.md, LICENSE, CHANGELOG.md |
| **sdd-engine/docs** | New public repo: `docs/` contents, plus README.md, CLAUDE.md, LICENSE |
| **sdd-engine/workspace** | New private repo: `.claude/` skills, `.tasks/`, CLAUDE.md, multi-repo management skill, `repos/` gitignored |
| `tech-pack/install.ts` (in sdd-core) | Add `--repo` flag for git clone to `sdd/.techpacks/<namespace>/`; add no-args mode to reinstall all from settings |
| `techpacks/SKILL.md` (in sdd-core) | Update techpacks gateway to document external techpack discovery in `sdd/.techpacks/` |
| `plugin.json` (in sdd-core) | Version 0.1.0, commands/skills paths adjusted (no `core/` prefix) |
| `marketplace.json` (in sdd-core) | Version 0.1.0, source `./plugin`, description updated for core-only |
| `techpack.yaml` (in techpack repo) | Update `min_sdd_version` to reference 0.1.0 core version scheme |

## Acceptance Criteria

- [ ] `sdd-engine/sdd-core` repo exists and is public — **verify:** `gh repo view sdd-engine/sdd-core --json visibility --jq '.visibility'` returns `PUBLIC`
- [ ] `sdd-engine/sdd-fullstack-typescript-techpack` repo exists and is public — **verify:** `gh repo view sdd-engine/sdd-fullstack-typescript-techpack --json visibility --jq '.visibility'` returns `PUBLIC`
- [ ] `sdd-engine/sdd-vscode-extension` repo exists and is public — **verify:** `gh repo view sdd-engine/sdd-vscode-extension --json visibility --jq '.visibility'` returns `PUBLIC`
- [ ] `sdd-engine/docs` repo exists and is public — **verify:** `gh repo view sdd-engine/docs --json visibility --jq '.visibility'` returns `PUBLIC`
- [ ] `sdd-engine/workspace` repo exists and is private — **verify:** `gh repo view sdd-engine/workspace --json visibility --jq '.visibility'` returns `PRIVATE`
- [ ] Every public repo has README.md and CLAUDE.md — **verify:** `for repo in sdd-core sdd-fullstack-typescript-techpack sdd-vscode-extension docs; do gh api repos/sdd-engine/$repo/contents/README.md --jq '.name' && gh api repos/sdd-engine/$repo/contents/CLAUDE.md --jq '.name'; done`
- [ ] sdd-core has valid plugin manifest — **verify:** `gh api repos/sdd-engine/sdd-core/contents/plugin/.claude-plugin/plugin.json` returns JSON with `version: "0.1.0"`
- [ ] sdd-core has marketplace manifest — **verify:** `gh api repos/sdd-engine/sdd-core/contents/.claude-plugin/marketplace.json` returns JSON with `version: "0.1.0"`
- [ ] techpack repo has techpack.yaml under `techpack/` — **verify:** `gh api repos/sdd-engine/sdd-fullstack-typescript-techpack/contents/techpack/techpack.yaml` returns 200
- [ ] techpack repo has NO plugin.json — **verify:** `gh api repos/sdd-engine/sdd-fullstack-typescript-techpack/contents/plugin 2>&1` returns 404
- [ ] vscode extension repo has extension source — **verify:** `gh api repos/sdd-engine/sdd-vscode-extension/contents/package.json` returns 200
- [ ] workspace has `.claude/` skills and `.tasks/` — **verify:** `gh api repos/sdd-engine/workspace/contents/.claude --jq '.[].name'` lists skill directories
- [ ] workspace has multi-repo management skill — **verify:** `gh api repos/sdd-engine/workspace/contents/.claude/skills --jq '.[].name'` includes a repo management skill
- [ ] `tech-pack install --repo` clones into `sdd/.techpacks/` — **verify:** run install against the techpack repo URL in a test project, confirm `sdd/.techpacks/fullstack-typescript/techpack/techpack.yaml` exists
- [ ] `tech-pack install` (no args) reinstalls from settings — **verify:** delete `sdd/.techpacks/`, run `tech-pack install`, confirm techpacks restored
- [ ] All public repos have 0.1.0 changelog with historical lineage — **verify:** each repo's CHANGELOG.md contains "0.1.0" and historical version references
- [ ] `LiorCohen/sdd` is unchanged — **verify:** `git -C /Users/lior/Work/Dev/sdd log -1 --format=%H` matches the commit hash before this task started
