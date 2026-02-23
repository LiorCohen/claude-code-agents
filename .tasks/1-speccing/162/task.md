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

Create four repositories under the `sdd-engine` GitHub organization, splitting the current monolithic `LiorCohen/sdd` repo into independently distributable packages:

**Public repos:**
- **`sdd-engine/sdd-core`** — the core SDD plugin (commands, skills, system CLI, permissions, documentation). Installable as a Claude Code plugin via marketplace.
- **`sdd-engine/sdd-fullstack-typescript-techpack`** — the fullstack TypeScript tech pack (agents, skills, templates, system CLI, techpack.yaml). NOT a plugin — installed by core's `tech-pack install` command.
- **`sdd-engine/sdd-vscode-extension`** — the VS Code extension for SDD project status and workflow visibility.

**Private repo:**
- **`sdd-engine/workspace`** — development workspace. Contains all dev-time skills (`.claude/`), task management (`.tasks/` with full history from `LiorCohen/sdd`), critic feedback (`.critic/`), and a `repos/` directory (gitignored) where the three public repos are cloned for local development.

The existing `LiorCohen/sdd` repository remains as-is for users already on the current monolithic structure.

Additionally, update the core's `tech-pack install` command to support git-based installation: cloning techpack repos into `sdd/.techpacks/<name>/` (gitignored, like `node_modules`), and supporting a no-args mode that reinstalls all registered techpacks from `sdd-settings.yaml`.

## Motivation

The monolithic plugin bundles core methodology with a specific tech stack (fullstack TypeScript), a VS Code extension, and documentation. This couples things that should be independent:

- Users who want SDD with a different stack (Python, Go, etc.) must take the TypeScript tech pack too
- Techpack authors can't iterate independently of core
- The VS Code extension has its own release cadence (marketplace publishing) unrelated to plugin versions
- The plugin can't grow its ecosystem — every new stack requires changes to the core repo

Splitting into separate repos enables:
- Independent versioning and release cadence for each component
- Third-party techpack creation without touching core
- Cleaner installation: install core plugin, then install the techpack(s) you need
- `sdd/.techpacks/` as a gitignored dependency directory (like `node_modules`) with `sdd-settings.yaml` as the manifest
- VS Code extension published independently to the marketplace
- Private workspace keeps dev tooling (skills, tasks, critic) out of public repos

## Scope

### In scope

- Create 3 public repos + 1 private workspace repo under `sdd-engine`
- Each public repo gets its own README.md, CLAUDE.md, CONTRIBUTING.md, and `docs/` directory (fresh, repo-specific, up-to-date)
- Each repo maintains its own version and CHANGELOG.md independently
- All repos start at version 0.1.0 with a changelog that includes historical lineage from `LiorCohen/sdd`
- Workspace repo inherits:
  - `.claude/` skills (commit, tasks, critic, standards, etc.)
  - `.tasks/` with full task history
  - `.critic/` learned feedback
  - `changelog/` detailed history (v1.md–v7.md) from `LiorCohen/sdd`
  - `tests/` from current repo
  - Multi-repo management skill for commits, changelogs, and worktrees across repos
- Workspace `repos/` directory is gitignored — each public repo is cloned there independently
- Each repo handles its own build independently (no workspace-level npm workspaces)
- Update `tech-pack install` to support `--repo <url>` for git clone into `sdd/.techpacks/`
- Update `tech-pack install` (no args) to reinstall all techpacks from `sdd-settings.yaml`
- `sdd-core` gets `plugin.json` + `marketplace.json` manifests at version 0.1.0
- Path adjustments: current `plugin/core/*` flattens to `plugin/*` in sdd-core
- `.claude/` dev skills live ONLY in workspace, not in any public repo
- Each repo gets its own `.gitignore` tailored to its contents
- Each repo gets its own `.github/` with GitHub Actions CI/CD

### Out of scope

- Removing or deprecating `LiorCohen/sdd` — stays as-is
- Updating `LiorCohen/sdd` to reference the new repos
- Creating additional techpacks for other stacks

## Constraints

- All repos are MIT licensed
- `sdd-core` is a Claude Code plugin with `.claude-plugin/marketplace.json` and `plugin/.claude-plugin/plugin.json`
- `sdd-fullstack-typescript-techpack` is NOT a plugin — no `plugin.json`, no `marketplace.json`. It has `techpack/techpack.yaml` as its manifest.
- `sdd-vscode-extension` is a standalone VS Code extension — published independently to the VS Code marketplace
- `workspace` is private — contains dev skills, task management, and critic feedback, not shipped to users
- `workspace/repos/` is gitignored — each repo inside is an independent git clone
- Techpacks are installed into `sdd/.techpacks/<namespace>/` which is gitignored in user projects
- `sdd-settings.yaml` records registered techpacks (like `package.json` records deps) — this file IS committed
- `tech-pack install` (no args) reads `sdd-settings.yaml` and clones all registered techpacks — like `npm install` with no args
- All repos start at version 0.1.0
- The `min_sdd_version` field in `techpack.yaml` should reference the new core version scheme
- Each repo's README, CLAUDE.md, and CONTRIBUTING.md must be written fresh and accurate for that repo — not copied verbatim from `LiorCohen/sdd`
- Each repo handles its own build — no cross-repo npm workspaces
- Each repo maintains its own version and changelog independently
- `.tasks/`, `.critic/`, `.temp/`, and `.claude/` exist ONLY in workspace — public repos do not have these directories
- Public repos have `CLAUDE.md` and `CONTRIBUTING.md` at root for contributor guidance, but no dev skill suite

## Changes

| File/Area | Change |
|-----------|--------|
| **sdd-engine/sdd-core** | New public repo: `plugin/core/` flattened to `plugin/`, `docs/` for user-facing documentation, plus `plugin.json`, `marketplace.json`, README.md, CLAUDE.md, CONTRIBUTING.md, LICENSE, CHANGELOG.md, `package.json` for system workspace |
| **sdd-engine/sdd-fullstack-typescript-techpack** | New public repo: `plugin/fullstack-typescript/` under `techpack/`, `docs/` for techpack-specific documentation, plus README.md, CLAUDE.md, CONTRIBUTING.md, LICENSE, CHANGELOG.md, `package.json` for system workspace |
| **sdd-engine/sdd-vscode-extension** | New public repo: `vscode-extension/` contents, `docs/` for extension documentation, plus README.md, CLAUDE.md, CONTRIBUTING.md, LICENSE, CHANGELOG.md |
| **sdd-engine/workspace** | New private repo: `.claude/` skills, `.tasks/` (full history), `.critic/`, `changelog/` (v1–v7 detailed history), `tests/`, CLAUDE.md, multi-repo management skill, `repos/` gitignored |
| `tech-pack/install.ts` (in sdd-core) | Add `--repo` flag for git clone to `sdd/.techpacks/<namespace>/`; add no-args mode to reinstall all from settings |
| `techpacks/SKILL.md` (in sdd-core) | Update techpacks gateway to document external techpack discovery in `sdd/.techpacks/` |
| `plugin.json` (in sdd-core) | Version 0.1.0, commands/skills paths adjusted (no `core/` prefix) |
| `marketplace.json` (in sdd-core) | Version 0.1.0, source `./plugin`, description updated for core-only |
| `techpack.yaml` (in techpack repo) | Update `min_sdd_version` to reference 0.1.0 core version scheme |

## Acceptance Criteria

- [ ] `sdd-engine/sdd-core` repo exists and is public — **verify:** `gh repo view sdd-engine/sdd-core --json visibility --jq '.visibility'` returns `PUBLIC`
- [ ] `sdd-engine/sdd-fullstack-typescript-techpack` repo exists and is public — **verify:** `gh repo view sdd-engine/sdd-fullstack-typescript-techpack --json visibility --jq '.visibility'` returns `PUBLIC`
- [ ] `sdd-engine/sdd-vscode-extension` repo exists and is public — **verify:** `gh repo view sdd-engine/sdd-vscode-extension --json visibility --jq '.visibility'` returns `PUBLIC`
- [ ] `sdd-engine/workspace` repo exists and is private — **verify:** `gh repo view sdd-engine/workspace --json visibility --jq '.visibility'` returns `PRIVATE`
- [ ] Every public repo has README.md, CLAUDE.md, and CONTRIBUTING.md — **verify:** `for repo in sdd-core sdd-fullstack-typescript-techpack sdd-vscode-extension; do for f in README.md CLAUDE.md CONTRIBUTING.md; do gh api repos/sdd-engine/$repo/contents/$f --jq '.name'; done; done`
- [ ] Each public repo has its own `docs/` directory — **verify:** `for repo in sdd-core sdd-fullstack-typescript-techpack sdd-vscode-extension; do gh api repos/sdd-engine/$repo/contents/docs --jq '.[0].name'; done`
- [ ] sdd-core has valid plugin manifest — **verify:** `gh api repos/sdd-engine/sdd-core/contents/plugin/.claude-plugin/plugin.json` returns JSON with `version: "0.1.0"`
- [ ] sdd-core has marketplace manifest — **verify:** `gh api repos/sdd-engine/sdd-core/contents/.claude-plugin/marketplace.json` returns JSON with `version: "0.1.0"`
- [ ] techpack repo has techpack.yaml under `techpack/` — **verify:** `gh api repos/sdd-engine/sdd-fullstack-typescript-techpack/contents/techpack/techpack.yaml` returns 200
- [ ] techpack repo has NO plugin.json — **verify:** `gh api repos/sdd-engine/sdd-fullstack-typescript-techpack/contents/plugin 2>&1` returns 404
- [ ] vscode extension repo has extension source — **verify:** `gh api repos/sdd-engine/sdd-vscode-extension/contents/package.json` returns 200
- [ ] workspace has `.claude/` skills and `.tasks/` — **verify:** `gh api repos/sdd-engine/workspace/contents/.claude --jq '.[].name'` lists skill directories
- [ ] workspace has `.tasks/` with full history — **verify:** `gh api repos/sdd-engine/workspace/contents/.tasks --jq '.[].name'` includes INDEX.md and status directories
- [ ] workspace has `.critic/` — **verify:** `gh api repos/sdd-engine/workspace/contents/.critic --jq '.[].name'` returns entries
- [ ] workspace has multi-repo management skill — **verify:** `gh api repos/sdd-engine/workspace/contents/.claude/skills --jq '.[].name'` includes a repo management skill
- [ ] `tech-pack install --repo` clones into `sdd/.techpacks/` — **verify:** run install against the techpack repo URL in a test project, confirm `sdd/.techpacks/fullstack-typescript/techpack/techpack.yaml` exists
- [ ] `tech-pack install` (no args) reinstalls from settings — **verify:** delete `sdd/.techpacks/`, run `tech-pack install`, confirm techpacks restored
- [ ] All repos have 0.1.0 changelog with historical lineage — **verify:** each repo's CHANGELOG.md contains "0.1.0" and references to `LiorCohen/sdd` lineage
- [ ] `LiorCohen/sdd` is unchanged — **verify:** `git -C /Users/lior/Work/Dev/sdd log -1 --format=%H` matches the commit hash before this task started
