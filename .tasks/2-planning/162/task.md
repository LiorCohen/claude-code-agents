---
id: 162
title: Split SDD into sdd-engine org repos
priority: high
status: planning
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
- Each public repo maintains its own version and CHANGELOG.md independently
- All public repos start at version 0.1.0 with a changelog that includes historical lineage from `LiorCohen/sdd`
- Workspace has no version — it maintains an infrastructure changelog for its own changes
- Workspace repo inherits:
  - `.claude/` skills (commit, tasks, critic, standards, etc.)
  - `.tasks/` with full task history
  - `.critic/` learned feedback
  - `changelog/` detailed history (v1.md–v7.md) from `LiorCohen/sdd`
  - `tests/` from current repo (public repos do NOT have tests — all tests live in workspace only)
  - Existing `tasks` and `commit` skills adapted for multi-repo structure (code lives in `repos/<name>/`, skills must handle repo selection and cross-repo operations)
- Workspace `repos/` directory is gitignored — each public repo is cloned there independently
- Each repo handles its own build independently (no workspace-level npm workspaces)
- Update `tech-pack install` to support `--repo <url> [--ref <ref>]` for git clone into `sdd/.techpacks/`
- Update `tech-pack install` (no args) to reinstall all techpacks from `sdd-settings.yaml`
- `sdd-core` gets `plugin.json` + `marketplace.json` manifests at version 0.1.0
- Path adjustments: current `plugin/core/*` flattens to `plugin/*` in sdd-core
- `.claude/` dev skills live ONLY in workspace, not in any public repo
- Each repo gets its own `.gitignore` and `.claudeignore` tailored to its contents
- Each public repo gets its own `.github/` with GitHub Actions CI/CD:
  - **sdd-core**: `release.yml` — version-triggered GitHub release with plugin archive (adapted from current `LiorCohen/sdd` release workflow)
  - **sdd-fullstack-typescript-techpack**: `release.yml` — version-triggered GitHub release with techpack archive
  - **sdd-vscode-extension**: `release.yml` — version-triggered GitHub release

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
- Techpacks are installed into `sdd/.techpacks/<namespace>/` which is gitignored in user projects — the `scaffolding project` command must add `sdd/.techpacks/` to the project's `.gitignore`
- `sdd-settings.yaml` records registered techpacks under `techpacks:` and project components under `components:` — this file IS committed
- `tech-pack install` (no args) reads `sdd-settings.yaml` and clones all registered techpacks — like `npm install` with no args
- All public repos start at version 0.1.0; workspace is unversioned
- The `min_sdd_version` field in `techpack.yaml` should reference the new core version scheme
- Each repo's README, CLAUDE.md, and CONTRIBUTING.md must be written fresh and accurate for that repo — not copied verbatim from `LiorCohen/sdd`
- Each repo handles its own build — no cross-repo npm workspaces
- Each public repo maintains its own version and changelog independently; workspace maintains an infrastructure changelog only
- `.tasks/`, `.critic/`, `.temp/`, and `.claude/` exist ONLY in workspace — public repos do not have these directories
- Public repos have `CLAUDE.md` and `CONTRIBUTING.md` at root for contributor guidance, but no dev skill suite
- Workspace `.claude/` skills must be adapted for multi-repo structure (code lives in `repos/<name>/`, not at workspace root)

## Tech-Pack Install Behavior

### `tech-pack install --repo <url> [--ref <ref>]`

1. Clone `<url>` into a temporary directory under `sdd/.techpacks/.tmp/`
2. If `--ref` provided, checkout that ref (`git checkout <ref>`)
3. Read `techpack/techpack.yaml` from the clone to get name, namespace, version
4. Validate the manifest via `validateTechPack()`
5. Move the clone from `.tmp/` to `sdd/.techpacks/<namespace>/`
6. Register in `sdd-settings.yaml` with a new `mode: git` schema:

```yaml
techpacks:
  <namespace>:
    name: <name>
    namespace: <namespace>
    version: "1.0.0"
    mode: git
    repo: <git-url>
    ref: v1.0.0
    install_path: sdd/.techpacks/<namespace>/techpack
```

- `install_path` points to the `techpack/` subdirectory inside the cloned repo (where `techpack.yaml` lives), not the clone root. This keeps the path contract identical to `mode: external` — the gateway always reads `techpack.yaml` from the `install_path` directory.
- `ref` is any valid git ref — tag, branch, or commit SHA. After cloning, the install command checks out this ref. If omitted, the repo's default branch is used.

### `tech-pack install` (no args)

1. Read `sdd-settings.yaml`
2. For each entry with `mode: git`:
   - If `sdd/.techpacks/<namespace>/` does not exist → `git clone <repo>` into it, then `git checkout <ref>` if `ref` is set
   - If it already exists → skip (no automatic pull — explicit `tech-pack update` is a future concern)
3. Entries with `mode: internal` or `mode: external` → skip (already resolved)
4. Validate all git-mode techpacks after clone

### Techpacks gateway update

The gateway currently supports two modes:
- `mode: internal` — path resolved relative to plugin root directory
- `mode: external` — path is absolute

Add support for:
- `mode: git` — `install_path` resolved relative to project root (e.g., `sdd/.techpacks/<namespace>/techpack`)

The `resolvePath()` operation must branch on mode to resolve correctly.

### `sdd-settings.yaml` schema changes

**Rename `tech_packs` → `techpacks`** throughout the schema and codebase. The underscore form is removed.

The `techpacks` entry gains three optional fields for git mode:
- `repo` (string) — git clone URL, present only when `mode: git`
- `ref` (string) — git ref to checkout (tag, branch, or commit SHA), present only when `mode: git`. Optional — omit to use the repo's default branch.
- `mode` gains a third valid value: `git` (in addition to `internal` and `external`)

The `path` field is renamed to `install_path` for `mode: git` entries. It is relative to project root (not absolute, not relative to plugin root). Existing `mode: internal` and `mode: external` entries continue to use `path` with their current semantics.

**Move `components` out of techpack entries into a top-level `components` object.** Each component is keyed by its name (globally unique, enforced by the validator) and carries a `techpack` field pointing back to the namespace.

Before (nested):
```yaml
techpacks:
  fs-ts:
    components:
      - name: my-api
        type: server
        directory: components/server/my-api
```

After (top-level):
```yaml
techpacks:
  fs-ts:
    name: fullstack-typescript
    namespace: fs-ts
    version: "1.0.0"
    mode: internal
    path: fullstack-typescript

components:
  my-api:
    type: server
    techpack: fs-ts
    directory: components/server/my-api
```

This enables direct component lookup by name without iterating techpacks, and makes cross-techpack dependencies natural. The reconciler must migrate the old nested format to the new top-level format.

## Documentation Split

Every existing `docs/` file has an explicit destination:

| File | Destination | Reason |
|------|-------------|--------|
| `docs/getting-started.md` | sdd-core | Core methodology tutorial |
| `docs/commands.md` | sdd-core | Core command reference |
| `docs/workflows.md` | sdd-core | Core workflow reference |
| `docs/tutorial.md` | sdd-core | Core methodology walkthrough |
| `docs/external-specs.md` | sdd-core | Core feature (external spec integration) |
| `docs/workflow-progress.md` | sdd-core | Core workflow state tracking |
| `docs/logo.svg` | sdd-core | Branding asset |
| `docs/agents.md` | sdd-fullstack-typescript-techpack | Tech-stack-specific agents |
| `docs/components.md` | sdd-fullstack-typescript-techpack | Tech-stack-specific component types |
| `docs/config-guide.md` | sdd-fullstack-typescript-techpack | TypeScript config patterns |

- **sdd-vscode-extension `docs/`**: written fresh — extension features, configuration, usage (no existing docs to move)

## Changes

| File/Area | Change |
|-----------|--------|
| **sdd-engine/sdd-core** | New public repo: `plugin/core/` flattened to `plugin/`, `docs/` for user-facing documentation, plus `plugin.json`, `marketplace.json`, README.md, CLAUDE.md, CONTRIBUTING.md, LICENSE, CHANGELOG.md, `package.json` for system workspace |
| **sdd-engine/sdd-fullstack-typescript-techpack** | New public repo: `plugin/fullstack-typescript/` under `techpack/`, `docs/` for techpack-specific documentation, plus README.md, CLAUDE.md, CONTRIBUTING.md, LICENSE, CHANGELOG.md, `package.json` for system workspace |
| **sdd-engine/sdd-vscode-extension** | New public repo: `vscode-extension/` contents, `docs/` for extension documentation, plus README.md, CLAUDE.md, CONTRIBUTING.md, LICENSE, CHANGELOG.md |
| **sdd-engine/workspace** | New private repo: `.claude/` skills (tasks + commit adapted for multi-repo), `.tasks/` (full history), `.critic/`, `changelog/` (v1–v7 detailed history), `tests/`, README.md, CLAUDE.md, CHANGELOG.md (infra-only), `repos/` gitignored |
| `tech-pack/install.ts` (in sdd-core) | Add `--repo` and `--ref` flags for git clone to `sdd/.techpacks/<namespace>/`; add no-args mode to reinstall all from settings |
| `techpacks/SKILL.md` (in sdd-core) | Update techpacks gateway to document external techpack discovery in `sdd/.techpacks/` |
| `plugin.json` (in sdd-core) | Version 0.1.0, commands/skills paths adjusted (no `core/` prefix) |
| `marketplace.json` (in sdd-core) | Version 0.1.0, source `./plugin`, description updated for core-only |
| `techpack.yaml` (in techpack repo) | Rename `tech_pack:` key → `techpack:`; update `min_sdd_version` to reference 0.1.0 core version scheme |
| `techpack.schema.json` (in sdd-core) | Rename `tech_pack` → `techpack` in schema definition |
| `types/settings.ts` (in sdd-core) | Rename `tech_packs` → `techpacks`; remove `components` from `TechPackEntry`; add top-level `components` map to `SettingsFile` with `techpack` back-reference |
| `settings/schema.ts` (in sdd-core) | Update JSON schema to match new `techpacks` key, top-level `components`, and git-mode fields (`repo`, `ref`, `install_path`) |
| `settings/reconcile.ts` (in sdd-core) | Add migration: nested `tech_packs.*.components` → top-level `components` with `techpack` field; rename `tech_packs` → `techpacks` |
| `settings/validate.ts` (in sdd-core) | Update validation for new schema shape — top-level `components` uniqueness, `techpack` field references valid namespace |
| `settings/sync.ts` (in sdd-core) | Rename all `tech_packs` references → `techpacks` |
| `tech-pack/list.ts`, `tech-pack/info.ts`, `tech-pack/remove.ts` (in sdd-core) | Rename all `tech_packs` references → `techpacks` |
| `settings/process-actions.ts` (in sdd-core) | Rename all `tech_packs` references → `techpacks` |
| `techpacks/resources/operations.md` (in sdd-core) | Add `mode: git` branch to `resolvePath` — resolve `install_path` relative to project root |
| Skill markdown files referencing `tech_pack`/`tech_packs` (in sdd-core) | Rename across: `techpacks/SKILL.md`, `sdd-settings.schema.json`, `project-settings/SKILL.md`, `init-orchestration/SKILL.md` |
| `.github/workflows/release.yml` (in each public repo) | Version-triggered GitHub release workflows adapted from current `LiorCohen/sdd` release workflow |
| `scaffolding/project.ts` (in sdd-core) | Add `sdd/.techpacks/` to generated `.gitignore` |

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
- [ ] workspace `tasks` and `commit` skills are adapted for multi-repo — **verify:** `gh api repos/sdd-engine/workspace/contents/.claude/skills --jq '.[].name'` includes `tasks` and `commit` directories
- [ ] `tech-pack install --repo` clones into `sdd/.techpacks/` — **verify:** run install against the techpack repo URL in a test project, confirm `sdd/.techpacks/fullstack-typescript/techpack/techpack.yaml` exists
- [ ] `tech-pack install` (no args) reinstalls from settings — **verify:** delete `sdd/.techpacks/`, run `tech-pack install`, confirm techpacks restored
- [ ] Every public repo has LICENSE — **verify:** `for repo in sdd-core sdd-fullstack-typescript-techpack sdd-vscode-extension; do gh api repos/sdd-engine/$repo/contents/LICENSE --jq '.name'; done`
- [ ] Every public repo has `.github/` CI/CD — **verify:** `for repo in sdd-core sdd-fullstack-typescript-techpack sdd-vscode-extension; do gh api repos/sdd-engine/$repo/contents/.github --jq '.[0].name'; done`
- [ ] All public repos have 0.1.0 changelog with historical lineage — **verify:** each public repo's CHANGELOG.md contains "0.1.0" and references to `LiorCohen/sdd` lineage
- [ ] Workspace has infrastructure changelog — **verify:** `gh api repos/sdd-engine/workspace/contents/CHANGELOG.md` returns 200
- [ ] `tech-pack install --repo --ref` checks out the specified ref — **verify:** install with `--ref v0.1.0`, run `git -C sdd/.techpacks/<namespace> log -1 --format=%D` and confirm it includes the tag
- [ ] Gateway resolves skills/agents from a git-mode techpack — **verify:** after `tech-pack install --repo`, run `tech-pack info <namespace>` and confirm it lists components, agents, and skills from the installed techpack
- [ ] `techpack.yaml` uses `techpack:` key (not `tech_pack:`) — **verify:** `grep '^techpack:' <techpack-repo>/techpack/techpack.yaml` matches
- [ ] Settings file uses `techpacks` key (not `tech_packs`) — **verify:** `sdd-settings.yaml` after init contains `techpacks:` at top level
- [ ] Components are top-level in settings — **verify:** `sdd-settings.yaml` after adding a component contains `components:` at top level with `techpack` back-reference
- [ ] Settings reconciler migrates old format — **verify:** feed a settings file with `tech_packs` and nested `components` through reconcile, confirm output has `techpacks` and top-level `components`
- [ ] `scaffolding project` adds `sdd/.techpacks/` to `.gitignore` — **verify:** scaffold a new project, confirm `.gitignore` contains `sdd/.techpacks/`
- [ ] `LiorCohen/sdd` remote is unchanged — **verify:** `git -C /Users/lior/Work/Dev/sdd log origin/main..HEAD --oneline` shows the final version bump and repo-split commits (local only, never pushed)
