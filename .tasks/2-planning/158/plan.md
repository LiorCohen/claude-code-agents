---
title: Split plugin into core/ and fullstack-typescript/ subdirectories
created: 2026-02-22 20:39 UTC
---

# Plan: Split plugin into core/ and fullstack-typescript/ subdirectories

## Problem Summary

The plugin is a monolith where SDD methodology (commands, orchestration, specs) and fullstack-typescript implementation (agents, standards, scaffolding, system commands) are interleaved. This prevents reuse of the methodology with other stacks, creates tight coupling, and makes the codebase harder to reason about.

The solution: split into `plugin/core/` (methodology) and `plugin/fullstack-typescript/` (tech pack), connected by a manifest contract (`techpack.yaml`) and a single gateway skill (`techpacks`).

## Open Question Resolutions

### OQ-1: CLI Build Architecture → (b) Duplicate shared subset

Each system CLI is fully self-contained with its own `package.json`, `tsconfig.json`, and build step. The tech system copies the ~500-line subset of shared utilities it needs (`lib/args.ts`, `lib/fs.ts`, `lib/logger.ts`, `lib/config.ts`). Core-only utilities (`lib/spec-utils.ts`, `lib/frontmatter.ts`, `lib/schema-validator.ts`) stay only in core.

Rationale: The spec requires "Tech system NEVER calls core system — it is fully self-contained." Duplication is simpler than an npm workspace with a shared package, avoids cross-system build dependencies, and the shared surface is small. Can be extracted to a shared package later if duplication becomes a maintenance burden.

### OQ-2: Template Path Resolution → (a) Relative to tech pack root

Tech pack skills know their own template paths. When creating scaffold specs, they use paths relative to the tech pack root. Core's `techpacks.resolvePath(namespace, relativePath)` resolves these to absolute paths. The scaffolding engine executes whatever absolute paths the spec gives it.

### OQ-3: Settings Reconciliation → (c) Core validates base only

Core validates the base `sdd-settings.yaml` schema (project metadata, tech_packs namespace, component manifest: name/type/directory). Tech packs validate their own `<namespace>-settings.yaml` at usage time — each tech system validates component-specific `settings` fields against its own schema.

### OQ-4: sdd-init Integration → (a) Auto-register internal tech packs

During `sdd-run init`, core auto-discovers and registers all internal tech packs (those living inside `plugin/`). It validates each `techpack.yaml`, builds the tech system CLI if needed, and adds the entry to `sdd-settings.yaml` under `tech_packs`. External tech packs use `sdd-run tech-pack install` separately.

### OQ-5: Migration → (a) sdd-init auto-detects and migrates

When `sdd-run init` detects an existing `.sdd/` directory (old format), it auto-migrates: renames `.sdd/` → `sdd/`, restructures `sdd-settings.yaml` to add the `tech_packs` namespace, strips removed fields, and creates `sdd/fs-ts-settings.yaml` with the full component details. The `settings reconcile` system command handles the schema migration.

## Files to Modify

This task touches ~340 source files (verified: `find plugin/ -not -path "*/dist/*" -not -path "*/node_modules/*" \( -name "*.md" -o -name "*.ts" -o -name "*.json" -o -name "*.sh" -o -name "*.yaml" \) | wc -l` = 342). Nearly every file in the plugin moves, and ~50 files require content changes. Files are organized by change type.

### A. Files that move (unchanged content, new location)

| Source | Destination |
|--------|-------------|
| `plugin/agents/*.md` (7 files) | `plugin/fullstack-typescript/agents/` |
| `plugin/skills/components/backend/*` | `plugin/fullstack-typescript/skills/components/backend/` |
| `plugin/skills/components/frontend/*` | `plugin/fullstack-typescript/skills/components/frontend/` |
| `plugin/skills/components/database/*` | `plugin/fullstack-typescript/skills/components/database/` |
| `plugin/skills/components/contract/*` | `plugin/fullstack-typescript/skills/components/contract/` |
| `plugin/skills/components/config/*` | `plugin/fullstack-typescript/skills/components/config/` |
| `plugin/skills/components/cicd/*` | `plugin/fullstack-typescript/skills/components/cicd/` |
| `plugin/skills/components/helm/*` | `plugin/fullstack-typescript/skills/components/helm/` |
| `plugin/skills/components/e2e-testing/*` | `plugin/fullstack-typescript/skills/components/e2e-testing/` |
| `plugin/skills/components/integration-testing/*` | `plugin/fullstack-typescript/skills/components/integration-testing/` |
| `plugin/skills/typescript-standards/` | `plugin/fullstack-typescript/skills/typescript-standards/` |
| `plugin/skills/unit-testing/` | `plugin/fullstack-typescript/skills/unit-testing/` |
| `plugin/skills/orchestrators/config-orchestration/` | `plugin/fullstack-typescript/skills/orchestrators/config-orchestration/` |
| `plugin/skills/orchestrators/local-env-orchestration/` | `plugin/fullstack-typescript/skills/orchestrators/local-env-orchestration/` |
| `plugin/system/src/commands/config/` (7 files) | `plugin/fullstack-typescript/system/src/commands/config/` |
| `plugin/system/src/commands/contract/` (5 files) | `plugin/fullstack-typescript/system/src/commands/contract/` |
| `plugin/system/src/commands/database/` (10 files) | `plugin/fullstack-typescript/system/src/commands/database/` |
| `plugin/system/src/commands/env/` (21 files) → renamed | `plugin/fullstack-typescript/system/src/commands/local-env/` |

### B. Files that move to core (unchanged content, new location)

| Source | Destination |
|--------|-------------|
| `plugin/commands/sdd.md` | `plugin/core/commands/sdd.md` |
| `plugin/commands/sdd-run.md` | `plugin/core/commands/sdd-run.md` |
| `plugin/commands/sdd-help.md` | `plugin/core/commands/sdd-help.md` |
| `plugin/skills/change-creation/` | `plugin/core/skills/change-creation/` |
| `plugin/skills/commit-standards/` | `plugin/core/skills/commit-standards/` |
| `plugin/skills/component-discovery/` → renamed | `plugin/core/skills/tech-discovery/` |
| `plugin/skills/domain-population/` | `plugin/core/skills/domain-population/` |
| `plugin/skills/external-spec-integration/` | `plugin/core/skills/external-spec-integration/` |
| `plugin/skills/planning/` | `plugin/core/skills/planning/` |
| `plugin/skills/project-scaffolding/` | `plugin/core/skills/project-scaffolding/` |
| `plugin/skills/project-settings/` | `plugin/core/skills/project-settings/` |
| `plugin/skills/scaffolding/` → eliminated (split) | See Phase 3 |
| `plugin/skills/spec-decomposition/` | `plugin/core/skills/spec-decomposition/` |
| `plugin/skills/spec-index/` | `plugin/core/skills/spec-index/` |
| `plugin/skills/spec-solicitation/` | `plugin/core/skills/spec-solicitation/` |
| `plugin/skills/spec-writing/` | `plugin/core/skills/spec-writing/` |
| `plugin/skills/workflow-state/` | `plugin/core/skills/workflow-state/` |
| `plugin/skills/orchestrators/change-orchestration/` | `plugin/core/skills/orchestrators/change-orchestration/` |
| `plugin/skills/orchestrators/init-orchestration/` | `plugin/core/skills/orchestrators/init-orchestration/` |
| `plugin/skills/orchestrators/version-orchestration/` | `plugin/core/skills/orchestrators/version-orchestration/` |
| `plugin/system/src/commands/archive/` (4 files) | `plugin/core/system/src/commands/archive/` |
| `plugin/system/src/commands/permissions/` (4 files) | `plugin/core/system/src/commands/permissions/` |
| `plugin/system/src/commands/scaffolding/` (7 files) | `plugin/core/system/src/commands/scaffolding/` |
| `plugin/system/src/commands/settings/` (4 files) | `plugin/core/system/src/commands/settings/` |
| `plugin/system/src/commands/spec/` (6 files) | `plugin/core/system/src/commands/spec/` |
| `plugin/system/src/commands/workflow/` (4 files) | `plugin/core/system/src/commands/workflow/` |
| `plugin/system/src/lib/` (9 files) | `plugin/core/system/src/lib/` |
| `plugin/system/src/types/` (6 files) | `plugin/core/system/src/types/` (with modifications) |
| `plugin/system/src/settings/` (7 files) | `plugin/core/system/src/settings/` (with modifications) |
| `plugin/system/system-run.sh` | `plugin/core/system/system-run.sh` |

### C. Files deleted

| File | Reason |
|------|--------|
| `plugin/hooks/` (4 files) | Hook system removed — superseded by Claude Code's native permissions |
| `plugin/system/src/commands/hook/` (5 files) | Hook system command removed |
| `plugin/skills/scaffolding/` | Split: generic engine stays in core system CLI, tech-specific orchestration moves to tech pack `scaffolding` skill |

### D. Files created (new)

| File | Purpose |
|------|---------|
| `plugin/core/` directory structure | Core methodology home |
| `plugin/fullstack-typescript/` directory structure | Tech pack home |
| `plugin/fullstack-typescript/techpack.yaml` | Tech pack manifest |
| `plugin/fullstack-typescript/README.md` | Tech pack documentation |
| `plugin/core/skills/techpacks/SKILL.md` | Single gateway for all tech pack interactions |
| `plugin/core/skills/techpacks/resources/operations.md` | Detailed operation implementations (split from SKILL.md to stay under 500-line limit) |
| `plugin/core/skills/techpacks/schemas/` | Manifest schema, context schemas |
| `plugin/fullstack-typescript/skills/skills-router/SKILL.md` | Maps contexts to skills |
| `plugin/fullstack-typescript/skills/command-router/SKILL.md` | Maps commands to targets |
| `plugin/fullstack-typescript/skills/techpack-settings/SKILL.md` | Replaces project-settings in agent frontmatter |
| `plugin/fullstack-typescript/skills/capabilities/SKILL.md` | /sdd intent mappings |
| `plugin/fullstack-typescript/skills/help-content/SKILL.md` | /sdd-help tech section |
| `plugin/fullstack-typescript/skills/component-discovery/SKILL.md` | Tech-specific component types and discovery questions |
| `plugin/fullstack-typescript/skills/planning-standards/SKILL.md` | Tech-specific plan content (agent assignments, architecture) |
| `plugin/fullstack-typescript/skills/scaffolding/SKILL.md` | Scaffolding entry point — ordering, delegation, directory patterns |
| `plugin/fullstack-typescript/templates/project/` | Tech-specific project templates (CLAUDE.md.tmpl, README.md.tmpl, package.json.tmpl) |
| `plugin/fullstack-typescript/templates/plans/` | Tech-specific plan templates (plan-feature.md, plan-bugfix.md, plan-refactor.md, plan-epic.md) |
| `plugin/fullstack-typescript/skills/components/integration-testing/integration-testing-standards/SKILL.md` | Split from pre-split `testing-standards` — integration testing subset |
| `plugin/fullstack-typescript/skills/components/e2e-testing/e2e-testing-standards/SKILL.md` | Split from pre-split `testing-standards` — e2e testing subset |
| `plugin/fullstack-typescript/skills/components/cicd/cicd-scaffolding/SKILL.md` | NEW — formalizes inline CI/CD scaffolding from pre-split `scaffolding` router |
| `plugin/fullstack-typescript/skills/components/integration-testing/integration-testing-scaffolding/SKILL.md` | NEW — formalizes inline integration testing scaffolding |
| `plugin/fullstack-typescript/skills/components/e2e-testing/e2e-testing-scaffolding/SKILL.md` | NEW — formalizes inline e2e testing scaffolding |
| `plugin/core/system/src/commands/agent/` | Agent frontmatter extraction |
| `plugin/core/system/src/commands/log/` | Structured logging for prompt-layer operations |
| `plugin/core/system/src/commands/tech-pack/` | validate, list, info, install, remove |
| `plugin/fullstack-typescript/system/` | Complete tech system CLI (cli.ts, package.json, tsconfig.json, system-run.sh) |
| `plugin/fullstack-typescript/system/src/lib/` | Copied shared utilities (args.ts, fs.ts, logger.ts, config.ts) |

### E. Files modified in place

| File | Changes |
|------|---------|
| `plugin/.claude-plugin/plugin.json` | Add explicit `"commands"` key for `core/commands/` (default auto-discovery won't find them after move). Update `"skills"` to `core/skills/` only. No `"agents"` key — agents loaded via techpacks gateway |
| `plugin/core/commands/sdd.md` | Remove tech-specific command mappings. Reference `techpacks` for `documentation.capabilities` |
| `plugin/core/commands/sdd-run.md` | Add tier-3 `<namespace> *` routing. Remove tech-specific namespace docs. Reference `techpacks` for command validation and routing |
| `plugin/core/commands/sdd-help.md` | Replace tech-specific description with generic text. Reference `techpacks` for `documentation.help` |
| `plugin/core/skills/planning/SKILL.md` | Remove 21 hardcoded agent/standards references. Read `components.*.agent` from manifest via `techpacks.readManifest`. Standards loaded via `techpacks.routeSkills(phase: plan-generation)` |
| `plugin/core/skills/change-creation/SKILL.md` | Remove 18 hardcoded agent/standards references. Read manifest for dependency graph, agent assignments. Move plan templates to tech pack |
| `plugin/core/skills/change-creation/templates/` | Move `plan-feature.md`, `plan-bugfix.md`, `plan-refactor.md`, `plan-epic.md` to `fullstack-typescript/templates/plans/`. Keep generic plan skeleton in core |
| `plugin/core/skills/tech-discovery/SKILL.md` | Renamed from component-discovery. Strip 24 tech-specific references. Core keeps discovery framework; tech content loaded via `techpacks.routeSkills(phase: component-discovery)` |
| `plugin/core/skills/project-scaffolding/SKILL.md` | Remove 8 tech-specific skill references. Delegates to tech pack for component scaffolding and templates via `techpacks.routeSkills(phase: project-scaffolding)`. Core keeps `templates/specs/` (SNAPSHOT.md, glossary.md), `templates/changes/` (INDEX.md), and `schemas/` — these are methodology artifacts, not tech-specific |
| `plugin/core/skills/project-settings/SKILL.md` | Remove 22 tech-specific references. Remove type→directory mapping. Core owns settings mechanism (read/write), types come from manifest |
| `plugin/core/skills/orchestrators/init-orchestration/SKILL.md` | Remove 6 tech refs (Node.js tool checks). Delegate prerequisite verification to tech pack via `techpacks.routeCommand` |
| `plugin/core/skills/orchestrators/change-orchestration/verification.md` | Replace hardcoded standards references (backend-standards, frontend-standards, typescript-standards, CMDO, MVVM, TanStack patterns) with `techpacks.routeSkills(phase: verification)` lookups. 11 tech refs on lines 70-74, 109 |
| `plugin/core/skills/orchestrators/change-orchestration/implementation.md` | Replace hardcoded `api-designer` agent reference (line 79) with `techpacks.readManifest` lookup |
| `plugin/core/skills/external-spec-integration/resources/workflow-steps.md` | Replace "Infrastructure / DevOps" (line 228) with "Infrastructure" |
| `plugin/core/skills/spec-decomposition/resources/outline-modes.md` | Replace "Infrastructure / DevOps last" (line 173) with "Infrastructure last" |
| `plugin/core/system/src/cli.ts` | Remove tech command imports (database, contract, config, env, hook). Add tech-pack namespace routing via manifest. Add agent, log, tech-pack command handlers |
| `plugin/core/system/src/types/settings.ts` | Remove tech-specific types (ServerSettings, WebappSettings, HelmSettings, DatabaseSettings, ContractSettings). Keep generic Component, SettingsFile with `tech_packs` namespace |
| `plugin/core/system/src/settings/` | Remove tech-specific schema definitions, sync-helm.ts. Keep reconciliation mechanism with `tech_packs` support |
| `plugin/fullstack-typescript/agents/*.md` (7 files) | Update frontmatter: `project-settings` → `techpack-settings`, `scaffolding` → tech pack `scaffolding`. Remove `testing-standards` from tester, replace with `integration-testing-standards` + `e2e-testing-standards` |
| `plugin/fullstack-typescript/skills/components/cicd/cicd-standards/SKILL.md` | Remove `commit-standards` cross-references |
| `tests/src/lib/process.ts` | Update `PLUGIN_DIR/system/dist/cli.js` to support both core and tech system CLI paths |
| `tests/src/tests/unit/lib/json-schema.test.ts` | Update `PLUGIN_SYSTEM_DIR` → `plugin/core/system` |
| `tests/src/tests/unit/commands/archive/store.test.ts` | Update system dir → `plugin/core/system` |
| `tests/src/tests/unit/commands/config/*.test.ts` (3 files) | Update system dir → `plugin/fullstack-typescript/system` |
| `tests/src/tests/unit/commands/permissions/configure.test.ts` | Update CLI path → `plugin/core/system/dist/cli.js` |
| `tests/src/tests/integration/scaffolding/engine-integration.test.ts` | Update CLI path → `plugin/core/system/dist/cli.js` |
| Root `package.json` | Update workspaces: `["plugin/core/system", "plugin/fullstack-typescript/system", "tests"]`. Update `logs` script: `.sdd/system-logs` → `sdd/system-logs` |

## Changes

### Phase 1: Directory Structure + File Moves

Create the two-directory structure and move all files to their correct locations. No content changes yet — purely file reorganization.

1. Create `plugin/core/` with subdirectories: `commands/`, `skills/`, `skills/orchestrators/`, `system/`
2. Create `plugin/fullstack-typescript/` with subdirectories: `agents/`, `skills/`, `skills/orchestrators/`, `skills/components/`, `templates/`, `system/`
3. Move all files per tables A and B above
4. Rename `component-discovery/` → `tech-discovery/`
5. Rename `env/` → `local-env/` in tech pack system
6. Delete `plugin/hooks/` and `plugin/system/src/commands/hook/`
7. Delete `plugin/skills/scaffolding/` (will be recreated as two separate artifacts)
8. Verify no files are orphaned: `find plugin/ -name "*.md" -o -name "*.ts" | sort` should match pre-split count minus hooks/hook commands

### Phase 2: Build System

Set up both system CLIs to compile independently.

1. Create `plugin/core/system/package.json` — based on current `plugin/system/package.json`, remove tech-specific deps if any, update name to `@sdd/core-system`
2. Create `plugin/core/system/tsconfig.json` — same as current
3. Create `plugin/core/system/system-run.sh` — same entrypoint pattern
4. Create `plugin/fullstack-typescript/system/package.json` — name `@sdd/fs-ts-system`, same dependencies
5. Create `plugin/fullstack-typescript/system/tsconfig.json` — same config
6. Create `plugin/fullstack-typescript/system/system-run.sh` — own entrypoint
7. Copy shared lib files to tech system: `args.ts`, `fs.ts`, `logger.ts`, `config.ts` (and their imports)
8. Update root `package.json` workspaces to `["plugin/core/system", "plugin/fullstack-typescript/system", "tests"]`
9. Update root `package.json` scripts: `build:plugin` builds both systems, `typecheck:plugin` checks both, `logs` script updates `.sdd/system-logs` → `sdd/system-logs`
10. Update test infrastructure — 8 test files/utilities reference `plugin/system/` paths that will break:
    - `tests/src/lib/process.ts` (line 89): update `PLUGIN_DIR/system/dist/cli.js` — split into core and tech system CLI paths based on command namespace
    - `tests/src/tests/unit/lib/json-schema.test.ts`: update `PLUGIN_SYSTEM_DIR` to `plugin/core/system`
    - `tests/src/tests/unit/commands/archive/store.test.ts`: update to `plugin/core/system` (archive is a core command)
    - `tests/src/tests/unit/commands/config/diff.test.ts`: update to `plugin/fullstack-typescript/system` (config is a tech command)
    - `tests/src/tests/unit/commands/config/generate.test.ts`: update to `plugin/fullstack-typescript/system`
    - `tests/src/tests/unit/commands/config/validate.test.ts`: update to `plugin/fullstack-typescript/system`
    - `tests/src/tests/unit/commands/permissions/configure.test.ts`: update to `plugin/core/system` (permissions is a core command)
    - `tests/src/tests/integration/scaffolding/engine-integration.test.ts`: update to `plugin/core/system` (scaffolding engine is core)
    - `tests/src/tests/integration/database-component/scaffolding-integration.test.ts`: uses `runScaffolding()` from process.ts — will work after process.ts fix
11. Verify `npm run build:plugin` succeeds for both systems
12. Verify `npm run typecheck:plugin` passes for both systems
13. Verify `npm test` passes

### Phase 3: Tech Pack Manifest + Schemas

Create the manifest contract and validation.

1. Create `plugin/fullstack-typescript/techpack.yaml` — the full manifest per spec (components, commands, skills router, lifecycle, documentation)
2. Create JSON Schema files in `plugin/core/skills/techpacks/schemas/`: `techpack.schema.json`, `sdd-settings.schema.json`, `techpack-settings.schema.json`, `declared-actions-response.schema.json`, `skills-router-context.schema.json`, `command-router-context.schema.json`
3. Implement `tech-pack validate` system command — parses techpack.yaml, validates against schema, checks referenced paths exist, validates DAG
4. Implement `tech-pack list` — reads `sdd-settings.yaml` tech_packs section
5. Implement `tech-pack info <namespace>` — reads manifest, returns structured data
6. Implement `tech-pack install <path>` — validates manifest, builds system CLI, adds to settings
7. Implement `tech-pack remove <namespace>` — removes from settings, warns about configured components
8. Run `tech-pack validate plugin/fullstack-typescript` — must pass

### Phase 4: New Core System Commands

Add agent frontmatter extraction, structured logging, and tech-pack routing to core CLI.

1. Implement `agent frontmatter <agent-path>` — reads agent .md, parses YAML frontmatter, returns JSON (name, model, tools, skills). Never returns markdown body.
2. Implement `log --level <level> --source <source> --message <text> [--data <json>]` — writes structured log entry to `sdd/system-logs/`
3. Add tech-pack namespace routing to core `cli.ts` — when namespace matches a tech pack, read manifest's `system_path`, delegate to tech system binary with remaining args
4. Update core `cli.ts` COMMAND_HANDLERS to remove tech commands, add new commands
5. Create tech pack `cli.ts` — registers config, contract, database, local-env command handlers

### Phase 5: Core Skill Modifications

Rewrite core skills to read from manifest instead of hardcoding tech-specific names.

1. Create `techpacks` skill (`plugin/core/skills/techpacks/SKILL.md`) — the single gateway with all 8 typed operations, enforcement rules, attribution and logging instructions. Split into SKILL.md (gateway contract, operation signatures, enforcement rules) + `resources/operations.md` (detailed operation implementations) to stay under 500-line skill file limit
2. Modify `planning/SKILL.md` — replace hardcoded agent assignment tables with `techpacks.readManifest` lookups. Replace inline standards with `techpacks.routeSkills(phase: plan-generation)`
3. Modify `change-creation/SKILL.md` — replace hardcoded dependency graph with `techpacks.dependencyOrder`. Replace agent names with manifest lookups. Split plan templates: generic skeleton stays in core, tech-specific templates (CMDO/MVVM/TailwindCSS references) move to tech pack `templates/plans/`
4. Rewrite `tech-discovery/SKILL.md` — core keeps the discovery framework (process, questioning approach). All component types, descriptions, and discovery question sets loaded via `techpacks.routeSkills(phase: component-discovery)`
5. Modify `project-scaffolding/SKILL.md` — delegates to tech pack for component scaffolding and project template stack-specific sections via `techpacks.routeSkills(phase: project-scaffolding)`. Core keeps its `templates/specs/` (SNAPSHOT.md, glossary.md), `templates/changes/` (INDEX.md), and `schemas/` — these are methodology artifacts. Tech pack contributes `templates/project/` (CLAUDE.md.tmpl, README.md.tmpl, package.json.tmpl)
6. Modify `project-settings/SKILL.md` — remove type→directory mapping and component type definitions. Core owns the settings mechanism only; types come from `techpacks.readManifest`
7. Modify `init-orchestration/SKILL.md` — remove Node.js tool checks. Delegate prerequisite verification via `techpacks.routeCommand`. Auto-register internal tech packs
8. Modify change-orchestration sub-files:
   - `verification.md` — replace hardcoded standards references (backend-standards, frontend-standards, typescript-standards, CMDO, MVVM, TanStack on lines 70-74, 109) with `techpacks.routeSkills(phase: verification)` lookups
   - `implementation.md` — replace hardcoded `api-designer` agent reference (line 79) with `techpacks.readManifest` lookup for `components.contract.agent`
   - `creation.md`, `management.md`, `planning.md`, `spec-review.md` — no tech refs, no changes needed
9. Strip minor tech refs from `external-spec-integration/resources/workflow-steps.md` and `spec-decomposition/resources/outline-modes.md`

### Phase 6: Core Command Modifications

Update the three user-facing commands to be tech-agnostic.

1. Modify `sdd.md` — remove the Common Mappings table (tech-specific commands). Add instruction to load `documentation.capabilities` from active tech packs via `techpacks.loadSkill`
2. Modify `sdd-help.md` — replace "SDD currently scaffolds Node.js/TypeScript backends..." with generic description. Add instruction to load `documentation.help` via `techpacks.loadSkill`
3. Modify `sdd-run.md` — add tier-3 routing (`<namespace> *` → tech pack command router). Remove tech-specific namespace documentation. Core reads `commands.available` from manifest for help/validation, then delegates to `techpacks.routeCommand`

### Phase 7: Tech Pack New Skills

Create the skills that the tech pack needs to fulfill the manifest contract.

1. Create `skills-router/SKILL.md` — component standards table, phase skills table, agent context table, loading instructions per spec contract
2. Create `command-router/SKILL.md` — dispatch table mapping commands to skills or system actions, dispatch instructions
3. Create `techpack-settings/SKILL.md` — component type definitions, settings schema per type, directory patterns, validation rules (absorbs tech-specific content from pre-split `project-settings`)
4. Create `capabilities/SKILL.md` — /sdd intent mappings (absorbs tech-specific command examples from pre-split `sdd.md`)
5. Create `help-content/SKILL.md` — tech pack description, available commands, getting started (absorbs tech-specific content from pre-split `sdd-help.md`)
6. Create `component-discovery/SKILL.md` — component types, descriptions, discovery question sets (absorbs 24 tech-specific references from pre-split `component-discovery`)
7. Create `planning-standards/SKILL.md` — agent assignment guidance, architecture patterns (CMDO/MVVM), dependency ordering (absorbs tech-specific content from pre-split `planning`)
8. Create `scaffolding/SKILL.md` — orchestration order, delegation table (component type → scaffolding skill), directory naming patterns (absorbs tech-specific content from pre-split `scaffolding`)
9. Move `testing-standards` → split into `integration-testing-standards/SKILL.md` and `e2e-testing-standards/SKILL.md` under respective component directories
10. Move project templates to `templates/project/` (CLAUDE.md.tmpl, README.md.tmpl, package.json.tmpl)
11. Move plan templates to `templates/plans/` (plan-feature.md, plan-bugfix.md, plan-refactor.md, plan-epic.md)

### Phase 8: Agent + Tech Skill Updates

Update agent frontmatter and cross-references in tech pack skills.

1. Update all 7 agent `.md` files: replace `project-settings` → `techpack-settings` in frontmatter skills list (5 agents: api-designer, backend-dev, frontend-dev, devops, tester)
2. Update devops agent: replace `scaffolding` → tech pack `scaffolding` in frontmatter
3. Update tester agent: replace `testing-standards` → `integration-testing-standards`, `e2e-testing-standards`; replace `integration-testing` → `integration-testing-standards`; replace `e2e-testing` → `e2e-testing-standards`
4. Remove `commit-standards` references from `cicd-standards/SKILL.md`
5. Update all tech pack skill `system-run.sh` references to point to the tech pack's own system binary

### Phase 9: Settings + Migration

Restructure the settings system for the tech pack split.

1. Restructure `sdd-settings.yaml` schema — add `tech_packs` namespace, remove direct `components` array at root. Core settings: `sdd.version`, `project.name`, `tech_packs.<namespace>` entries
2. Create `fs-ts-settings.yaml` schema — tech-pack-owned component details (depends_on, capabilities, settings)
3. Update core `types/settings.ts` — remove ServerSettings, WebappSettings, HelmSettings, DatabaseSettings, ContractSettings. Add TechPackEntry and ComponentManifest types
4. Update core `settings/` — remove `sync-helm.ts`, remove tech-specific schema definitions, update reconciliation to handle `tech_packs` namespace
5. Implement `.sdd/` → `sdd/` migration in settings reconcile command — detect old directory, rename, restructure settings, create tech pack settings file
6. Create declared actions processing in core — when tech system returns `{ result, actions }`, core processes `register_component` and `unregister_component` actions against `sdd-settings.yaml`

### Phase 10: plugin.json + Verification

Update the plugin manifest and run all acceptance criteria.

1. Update `plugin/.claude-plugin/plugin.json`:
   - Add explicit `"commands"` key: `["./core/commands/sdd.md", "./core/commands/sdd-run.md", "./core/commands/sdd-help.md"]` (required — Claude Code auto-discovers `commands/` at plugin root, but after move to `core/commands/` the default path no longer works)
   - Update `"skills"` to list only `./core/skills/` directories (tech pack skills loaded dynamically, not registered in plugin.json)
   - No `"agents"` key needed — agents are loaded via `techpacks` gateway + Task subagents, not through plugin.json discovery
2. Run every acceptance criterion from the spec:
   - `grep -ri "backend-dev\|frontend-dev\|..." plugin/core/` returns 0 matches
   - `ls plugin/fullstack-typescript/agents/ plugin/fullstack-typescript/skills/components/` shows all artifacts
   - `tech-pack validate plugin/fullstack-typescript` passes
   - `grep -c "backend-dev\|frontend-dev\|api-designer" plugin/core/skills/planning/SKILL.md` returns 0
   - `npm run build:plugin` succeeds
   - `npm run typecheck:plugin` passes
   - `npm test` passes
3. Create `plugin/fullstack-typescript/README.md` documenting the tech pack

## Dependencies

Implementation phases must be executed in order — each builds on the previous:

```
Phase 1 (directory structure)
  → Phase 2 (build system) — both systems must compile
    → Phase 3 (manifest + schemas) — manifest needed for skill modifications
      → Phase 4 (core system commands) — agent/log/tech-pack commands needed by skills
        → Phase 5 (core skill mods) + Phase 6 (command mods) — can run in parallel
          → Phase 7 (tech pack new skills) + Phase 8 (agent updates) — can run in parallel
            → Phase 9 (settings + migration) — depends on all core/tech changes
              → Phase 10 (plugin.json + verification) — final
```

Phases 5+6 can be done in parallel. Phases 7+8 can be done in parallel. All other phases are sequential.

## Tests

### Unit Tests

- [ ] `tech-pack validate` correctly validates a valid techpack.yaml
- [ ] `tech-pack validate` rejects missing required fields
- [ ] `tech-pack validate` rejects cyclic dependency graphs
- [ ] `tech-pack validate` rejects missing referenced paths
- [ ] `agent frontmatter` extracts frontmatter as JSON, never returns body
- [ ] `log` command writes structured entries to `sdd/system-logs/`
- [ ] `tech-pack list` returns installed tech packs from settings
- [ ] `tech-pack info` returns manifest data for a namespace
- [ ] Settings reconciliation handles `tech_packs` namespace migration
- [ ] Declared actions processing: `register_component` adds to settings
- [ ] Declared actions processing: `unregister_component` removes from settings
- [ ] Core CLI routes `fs-ts database setup` to tech system binary
- [ ] Tech system handles `database setup` natively

### Integration Tests

- [ ] `npm run build:plugin` builds both core and tech system CLIs
- [ ] `npm run typecheck:plugin` passes for both systems
- [ ] Core system delegates tech-namespaced commands to tech system
- [ ] Full scaffolding flow works through techpacks gateway
- [ ] Settings migration from `.sdd/` → `sdd/` produces valid output
