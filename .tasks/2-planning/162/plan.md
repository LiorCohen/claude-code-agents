---
title: Split SDD into sdd-engine org repos
created: 2026-02-23 23:00 UTC
---

# Plan: Split SDD into sdd-engine org repos

## Strategy

**Two-phase approach:** Make all plugin code changes on a **feature branch** in the existing `LiorCohen/sdd` codebase (Phase A), where we can build, typecheck, and test. Merge to main with a proper version bump and changelog — this is the **final version** of the monolithic plugin. **Never push to remote** — `LiorCohen/sdd` remote stays at its current state. Then create the new repos and distribute the code from main into them (Phase B).

## Execution Order

### Step 1: Rename `tech_packs` → `techpacks` in types + settings index (foundation)

- Files: `plugin/core/system/src/types/settings.ts`, `plugin/core/system/src/settings/index.ts`
- Why first: Every other settings file imports from here. Changing the type shape first means TypeScript will flag every downstream file that needs updating.
- Implementation:
  - Rename `SettingsFile.tech_packs` → `SettingsFile.techpacks`
  - Add `mode: 'git'` to `TechPackEntry.mode` union: `'internal' | 'external' | 'git'`
  - Add optional fields: `repo?: string`, `ref?: string`, `install_path?: string`
  - Remove `components` from `TechPackEntry`
  - Rename `ComponentManifest` → `ComponentEntry` with new shape: `{ type: string; techpack: string; directory: string }` (name becomes the map key, `techpack` replaces implicit nesting). Update all downstream imports (`reconcile.ts`, `validate.ts`, `sync.ts`, `process-actions.ts`).
  - Add `SettingsFile.components?: Readonly<Record<string, ComponentEntry>>`
  - Update `settings/index.ts` re-exports: export renamed `ComponentEntry` type

### Step 2: Update settings schema

- Files: `plugin/core/system/src/settings/schema.ts`
- Depends on: Step 1
- Implementation:
  - Rename `tech_packs` property → `techpacks` in `settingsFileSchema`
  - Add `repo`, `ref`, `install_path` optional properties to `techPackEntrySchema`
  - Add `'git'` to `mode` enum
  - Remove `components` from `techPackEntrySchema`
  - Add top-level `components` property to `settingsFileSchema` with `componentEntrySchema` (type, techpack, directory)

### Step 3: Update settings validator

- Files: `plugin/core/system/src/settings/validate.ts`
- Depends on: Step 1
- Implementation:
  - Rename all `settings.tech_packs` → `settings.techpacks`
  - Rename error path prefixes from `tech_packs.${key}` → `techpacks.${key}`
  - Remove component validation from inside tech pack entries
  - Add top-level component validation: uniqueness by name, `techpack` field references valid namespace in `techpacks`

### Step 4: Update settings reconciler

- Files: `plugin/core/system/src/settings/reconcile.ts`
- Depends on: Steps 1, 3
- Implementation:
  - Add migration: if `rawObj.tech_packs` exists, rename key to `techpacks` and record change
  - Add migration: if any `techpacks.*.components` exists (nested format), extract to top-level `components` with `techpack` back-reference and record change
  - Update `migrateComponents()` to output top-level `components` map (not nested)
  - Update final `SettingsFile` construction to use `techpacks` and top-level `components`

### Step 5: Update settings sync

- Files: `plugin/core/system/src/settings/sync.ts`
- Depends on: Step 1
- Implementation:
  - Rename all `settings.tech_packs` → `settings.techpacks` (3 occurrences)

### Step 6: Update tech-pack commands + handler + schema

- Files: `plugin/core/system/src/commands/tech-pack/install.ts`, `info.ts`, `list.ts`, `remove.ts`, `validate.ts`, `handler.ts`, `schema.ts`
- Depends on: Step 1
- Implementation:
  - **install.ts**: Rename `manifest['tech_pack']` → `manifest['techpack']`, `settings['tech_packs']` → `settings['techpacks']`. Add `--repo` and `--ref` flags. Add git clone flow: clone to `.tmp/`, checkout ref, read manifest, validate, move to namespace dir, register with `mode: 'git'` and `install_path`. Add no-args mode: read settings, iterate `mode: git` entries, clone missing ones.
  - **info.ts**: Rename `settings['tech_packs']` → `settings['techpacks']`, `manifest['tech_pack']` → `manifest['techpack']`. Add `mode: 'git'` branch to `resolveTechPackDir()` — resolve `install_path` relative to project root.
  - **list.ts**: Rename `settings['tech_packs']` → `settings['techpacks']`, `data: { tech_packs: ... }` → `data: { techpacks: ... }`
  - **remove.ts**: Rename `settings['tech_packs']` → `settings['techpacks']`
  - **validate.ts**: Rename `manifest['tech_pack']` → `manifest['techpack']` (reads manifest key for name/namespace/system_path validation)
  - **handler.ts**: Add routing for new install modes — `--repo` triggers git clone flow, no args triggers reinstall-all flow. Currently rejects install without `--path`; must add `--repo` as alternate entry point and no-args as third entry point.
  - **schema.ts**: Add `repo` (string, optional) and `ref` (string, optional) to the install command's argument schema. These are mutually exclusive with `--path` (git mode vs local mode).

### Step 7: Update process-actions

- Files: `plugin/core/system/src/commands/settings/process-actions.ts`
- Depends on: Step 1
- Implementation:
  - Rename `settings.tech_packs` → `settings.techpacks` (all occurrences)
  - Update component registration to write to top-level `components` map with `techpack` back-reference instead of nested `tech_packs[namespace].components`
  - Update component unregistration to remove from top-level `components`

### Step 8: Update scaffolding project

- Files: `plugin/core/system/src/commands/scaffolding/project.ts`
- Depends on: None (independent)
- Implementation:
  - Add `sdd/.techpacks/` to the `.gitignore` entries generated by the scaffolding command

### Step 9: Build and typecheck

- Depends on: Steps 1–8
- Run `npm run typecheck:plugin` — must pass with zero errors
- Run `npm run build:plugin` — must compile successfully
- Fix any type errors discovered

### Step 10: Update JSON schemas

- Files: `plugin/core/skills/techpacks/schemas/sdd-settings.schema.json`, `plugin/core/skills/techpacks/schemas/techpack.schema.json`
- Depends on: None (independent of TS, but logically follows Steps 1–9)
- Implementation:
  - **sdd-settings.schema.json**: Rename `tech_packs` property → `techpacks`, rename `tech_pack_entry` def → `techpack_entry`, add `repo`/`ref`/`install_path` optional fields, add `git` to mode enum, remove nested `components` from entry, add top-level `components` property
  - **techpack.schema.json**: Rename `tech_pack` → `techpack` in required array and properties

### Step 11: Update techpack.yaml manifest

- Files: `plugin/fullstack-typescript/techpack.yaml`
- Depends on: Step 10
- Implementation:
  - Rename top-level `tech_pack:` key → `techpack:`
  - Update `min_sdd_version` from `"8.0.0"` to `"0.1.0"`

### Step 12: Update skill markdown files

- Files: `plugin/core/skills/techpacks/SKILL.md`, `plugin/core/skills/techpacks/resources/operations.md`, `plugin/core/skills/project-settings/SKILL.md`, `plugin/core/skills/orchestrators/init-orchestration/SKILL.md`
- Depends on: None (independent markdown files)
- Implementation:
  - Rename all `tech_packs` → `techpacks` and `tech_pack` → `techpack` in YAML examples, prose, and references
  - In `operations.md`: add `mode: git` branch to `resolvePath` operation description — resolve `install_path` relative to project root
  - In `SKILL.md`: update the settings YAML example to show `techpacks:` key and `mode: git` example

### Step 13: Run tests

- Depends on: Steps 1–12
- Run `npm test` — fix any failures from the rename and schema changes
- This validates the reconciler migration path and the settings validation logic

### Step 14: Commit, version bump, and merge to main

- Depends on: Step 13
- This is the **final version** of the monolithic plugin. Proper versioning and changelog required.
- Version bump (discuss type with user — MAJOR is likely since the settings schema is a breaking change: `tech_packs` → `techpacks`, nested components → top-level)
- Changelog entry covering: settings rename, `mode: git` support, top-level components, scaffolding `.techpacks/` gitignore
- All TypeScript changes, schema changes, skill changes, and techpack.yaml committed
- Merge feature branch to main
- **Never push to remote** — `LiorCohen/sdd` remote stays untouched
- Phase B sources code from the merged main branch (local only)

---

### Step 15: Create GitHub org and repos

- Depends on: Step 14
- Implementation:
  - Verify `sdd-engine` org exists (or create it)
  - `gh repo create sdd-engine/sdd-core --public --license MIT`
  - `gh repo create sdd-engine/sdd-fullstack-typescript-techpack --public --license MIT`
  - `gh repo create sdd-engine/sdd-vscode-extension --public --license MIT`
  - `gh repo create sdd-engine/workspace --private`

### Step 16: Populate sdd-core

- Depends on: Steps 14, 15
- **Source:** All copies below are from the **merged main branch** (which has all Phase A changes applied).
- Implementation:
  - Clone `sdd-engine/sdd-core` into a temp working directory
  - Copy `plugin/core/` contents flattened into `plugin/` (i.e., `plugin/core/commands/` → `plugin/commands/`, `plugin/core/skills/` → `plugin/skills/`, `plugin/core/system/` → `plugin/system/`, `plugin/core/permissions/` → `plugin/permissions/`)
  - Create `plugin/.claude-plugin/plugin.json` — version 0.1.0, paths adjusted (no `core/` prefix): `"./commands/sdd.md"`, `"./skills/"`
  - Create `.claude-plugin/marketplace.json` — version 0.1.0, source `./plugin`, description for core-only, owner `sdd-engine`
  - Create `package.json` for the system workspace (single workspace: `plugin/system`). Build script: `tsc -p plugin/system/tsconfig.json && tsc-alias -p plugin/system/tsconfig.json`
  - Copy docs: `getting-started.md`, `commands.md`, `workflows.md`, `tutorial.md`, `external-specs.md`, `workflow-progress.md`, `logo.svg` into `docs/`
  - Create `.github/workflows/release.yml` — adapted from current `LiorCohen/sdd` workflow
  - Write fresh `README.md`, `CLAUDE.md`, `CONTRIBUTING.md`
  - Write `CHANGELOG.md` — version 0.1.0 entry with lineage reference to `LiorCohen/sdd`
  - Create `.gitignore` and `.claudeignore` tailored for core
  - Copy `LICENSE` (MIT)
  - **Build verification:** Run `npm install && npm run build` to confirm standalone build works. Fix any path issues before pushing.
  - Commit and push

### Step 17: Populate sdd-fullstack-typescript-techpack

- Depends on: Steps 14, 15
- **Source:** All copies below are from the **merged main branch**.
- Implementation:
  - Clone `sdd-engine/sdd-fullstack-typescript-techpack` into a temp working directory
  - Copy `plugin/fullstack-typescript/` contents into `techpack/` (i.e., `plugin/fullstack-typescript/agents/` → `techpack/agents/`, etc.)
  - The `techpack.yaml` (already renamed to `techpack:` key in Step 11) goes to `techpack/techpack.yaml`
  - Create `package.json` for the system workspace (single workspace: `techpack/system`). Build script: `tsc -p techpack/system/tsconfig.json && tsc-alias -p techpack/system/tsconfig.json`
  - Copy docs: `agents.md`, `components.md`, `config-guide.md` into `docs/`
  - Create `.github/workflows/release.yml` — version-triggered release with techpack archive
  - Write fresh `README.md`, `CLAUDE.md`, `CONTRIBUTING.md`
  - Write `CHANGELOG.md` — version 0.1.0 entry with lineage reference
  - Create `.gitignore` and `.claudeignore`
  - Copy `LICENSE` (MIT)
  - **Build verification:** Run `npm install && npm run build` to confirm standalone build works. Fix any path issues before pushing.
  - Commit and push

### Step 18: Populate sdd-vscode-extension

- Depends on: Step 15
- Implementation:
  - Clone `sdd-engine/sdd-vscode-extension` into a temp working directory
  - Copy `vscode-extension/` contents into repo root
  - Create `docs/` with extension documentation (written fresh)
  - Create `.github/workflows/release.yml` — version-triggered release
  - Write fresh `README.md`, `CLAUDE.md`, `CONTRIBUTING.md`
  - Write `CHANGELOG.md` — version 0.1.0 entry with lineage reference
  - Create `.gitignore`
  - Copy `LICENSE` (MIT)
  - Commit and push

### Step 19: Populate workspace (with adapted skills)

- Depends on: Step 15
- Implementation:
  - Clone `sdd-engine/workspace` into a temp working directory
  - Copy `.claude/skills/` (all skill directories)
  - **Adapt skills before committing** (do not push un-adapted skills):
    - **commit skill**: Update to handle repo selection — detect which `repos/<name>/` directory changes are in, run version bump and changelog per-repo
    - **tasks skill**: Update paths to work from workspace root, handle task files alongside `repos/` directory
  - Copy `.tasks/` with full task history (all status directories, INDEX.md)
  - Copy `.critic/` (all learned feedback)
  - Copy `changelog/` (v1.md–v7.md, README.md — full detailed history)
  - Copy `tests/` (all test files, vitest config, package.json)
  - Create `repos/` directory (gitignored)
  - Write `README.md`, `CLAUDE.md`, `CHANGELOG.md` (infrastructure-only)
  - Create `.gitignore` (ignore `repos/`, `node_modules/`, `.temp/`, etc.)
  - NO `plugin.json`, NO `marketplace.json`, NO version
  - Commit and push (single commit with fully adapted skills)

## Tests

### Unit Tests

- [ ] `test_settings_reconciler_migrates_tech_packs_to_techpacks` — feed old-format settings with `tech_packs` key, verify output has `techpacks`
- [ ] `test_settings_reconciler_migrates_nested_components_to_top_level` — feed settings with `tech_packs.fs-ts.components: [...]`, verify output has top-level `components` map with `techpack` back-reference
- [ ] `test_settings_reconciler_handles_already_migrated_format` — feed settings with `techpacks` (new key), verify no changes
- [ ] `test_settings_validator_rejects_component_with_invalid_techpack_ref` — component references nonexistent namespace
- [ ] `test_settings_validator_enforces_unique_component_names` — two components with same name
- [ ] `test_settings_validator_accepts_git_mode_entry` — `mode: git` with `repo`, `ref`, `install_path`
- [ ] `test_settings_schema_validates_git_mode_fields` — JSON schema accepts `mode: git` with required fields
- [ ] `test_tech_pack_install_reads_techpack_key` — install reads `techpack:` (not `tech_pack:`) from manifest
- [ ] `test_tech_pack_info_resolves_git_mode_path` — `resolveTechPackDir` with `mode: 'git'` resolves `install_path` relative to project root
- [ ] `test_tech_pack_list_uses_techpacks_key` — list reads from `techpacks` key in settings
- [ ] `test_scaffolding_project_includes_techpacks_gitignore` — scaffolded `.gitignore` contains `sdd/.techpacks/`
- [ ] `test_tech_pack_validate_reads_techpack_key` — validate reads `techpack:` (not `tech_pack:`) from manifest for name/namespace extraction
- [ ] `test_process_actions_registers_component_top_level` — component registration writes to top-level `components` map with `techpack` back-reference
- [ ] `test_process_actions_unregisters_component_top_level` — component unregistration removes from top-level `components` map
- [ ] `test_tech_pack_remove_with_git_mode` — removing a `mode: git` entry from settings (does NOT delete the cloned directory — that's a separate `tech-pack update` concern)

### Integration Tests

- [ ] `test_tech_pack_install_repo_clones_and_registers` — mock git clone, verify clones to `.tmp/`, reads manifest, moves to namespace dir, registers in settings with `mode: git`
- [ ] `test_tech_pack_install_repo_with_ref` — verify git checkout runs with specified ref
- [ ] `test_tech_pack_install_no_args_clones_missing` — settings has `mode: git` entry, `.techpacks/` dir missing, verify clone happens
- [ ] `test_tech_pack_install_no_args_skips_existing` — settings has `mode: git` entry, `.techpacks/` dir exists, verify no clone
- [ ] `test_full_settings_roundtrip` — write settings with `techpacks` + top-level `components`, read back, validate, verify structure preserved

### Repo Structure Tests (post-creation verification)

- [ ] Verify sdd-core repo structure matches expected layout
- [ ] Verify techpack repo has `techpack/techpack.yaml` and NO `plugin.json`
- [ ] Verify vscode-extension repo has `package.json` with extension metadata
- [ ] Verify workspace repo has `.claude/`, `.tasks/`, `.critic/`
- [ ] Verify all public repos have LICENSE, README.md, CLAUDE.md, CONTRIBUTING.md, CHANGELOG.md, `.github/workflows/`

## Verification

All acceptance criteria from the spec, executed in order:

- [ ] `gh repo view sdd-engine/sdd-core --json visibility --jq '.visibility'` returns `PUBLIC`
- [ ] `gh repo view sdd-engine/sdd-fullstack-typescript-techpack --json visibility --jq '.visibility'` returns `PUBLIC`
- [ ] `gh repo view sdd-engine/sdd-vscode-extension --json visibility --jq '.visibility'` returns `PUBLIC`
- [ ] `gh repo view sdd-engine/workspace --json visibility --jq '.visibility'` returns `PRIVATE`
- [ ] All public repos have README.md, CLAUDE.md, CONTRIBUTING.md
- [ ] All public repos have `docs/` directory
- [ ] sdd-core `plugin/.claude-plugin/plugin.json` has `version: "0.1.0"`
- [ ] sdd-core `.claude-plugin/marketplace.json` has `version: "0.1.0"`
- [ ] techpack repo has `techpack/techpack.yaml`
- [ ] techpack repo returns 404 for `plugin/` path
- [ ] vscode-extension has `package.json`
- [ ] workspace has `.claude/`, `.tasks/`, `.critic/`
- [ ] workspace `.tasks/` includes INDEX.md and status directories
- [ ] `tech-pack install --repo` clones and registers
- [ ] `tech-pack install` (no args) restores missing techpacks
- [ ] `tech-pack install --repo --ref` checks out specified ref
- [ ] `tech-pack info` resolves git-mode techpack paths
- [ ] All public repos have LICENSE and `.github/` CI/CD
- [ ] All public repos have 0.1.0 changelog with historical lineage reference to `LiorCohen/sdd`
- [ ] Workspace has infrastructure changelog (CHANGELOG.md exists)
- [ ] Workspace `tasks` and `commit` skills are adapted for multi-repo (`repos/<name>/` awareness)
- [ ] Settings uses `techpacks` key
- [ ] Components are top-level in settings with `techpack` back-reference
- [ ] Reconciler migrates old format successfully
- [ ] `scaffolding project` generates `.gitignore` with `sdd/.techpacks/`
- [ ] `techpack.yaml` uses `techpack:` key (not `tech_pack:`)
- [ ] `LiorCohen/sdd` main has final version bump and changelog (local only — remote unchanged)
