---
title: "Three-command structure: /sdd + /sdd-run + /sdd-help"
created: 2026-02-16 16:30 UTC
---

# Plan: Three-command structure: /sdd + /sdd-run + /sdd-help

## Problem Summary

Replace 6 user-facing commands (`sdd-change`, `sdd-config`, `sdd-init`, `sdd-run`, `sdd-settings`, `sdd-version`) with 3 commands (`/sdd`, `/sdd-run`, `/sdd-help`) mapping to a learn-guided-direct curve. Extract command logic into orchestrator skills. Update all references across the codebase.

## Files to Modify

### New Files

| File | Description |
|------|-------------|
| `plugin/commands/sdd.md` | Jarvis — context-aware workflow assistant hub |
| `plugin/commands/sdd-help.md` | Tutor — teaches SDD, progressive discovery |
| `plugin/skills/orchestrators/change-orchestration/SKILL.md` | Dispatcher: routes action to sub-file |
| `plugin/skills/orchestrators/change-orchestration/creation.md` | `create` action (from sdd-change.md lines 129-395) |
| `plugin/skills/orchestrators/change-orchestration/spec-review.md` | `approve spec`, `answer`, `assume` (from sdd-change.md lines 526-565 + 931-1007) |
| `plugin/skills/orchestrators/change-orchestration/planning.md` | `plan`, `approve plan` (from sdd-change.md lines 569-600 + 845-891) |
| `plugin/skills/orchestrators/change-orchestration/implementation.md` | `implement` (from sdd-change.md lines 604-690) |
| `plugin/skills/orchestrators/change-orchestration/verification.md` | `verify`, `review` (from sdd-change.md lines 694-927) |
| `plugin/skills/orchestrators/change-orchestration/management.md` | `status`, `list`, `continue`, `regress`, `request-changes` (from sdd-change.md lines 399-523 + 1011-1102) |
| `plugin/skills/orchestrators/init-orchestration/SKILL.md` | 6-phase init workflow (from sdd-init.md, 306 lines) |
| `plugin/skills/orchestrators/config-orchestration/SKILL.md` | Config operations: generate, validate, diff, add-env (from sdd-config.md, 269 lines) |
| `plugin/skills/orchestrators/version-orchestration/SKILL.md` | Version display and semver comparison (from sdd-version.md, 86 lines) |
| `plugin/skills/orchestrators/local-env-orchestration/SKILL.md` | Local k8s env management (moved from plugin/skills/local-env/SKILL.md, 170 lines) |
| `changelog/v7.md` | New major version changelog |

### Deleted Files

| File | Reason |
|------|--------|
| `plugin/commands/sdd-change.md` | Logic moved to change-orchestration skills |
| `plugin/commands/sdd-config.md` | Logic moved to config-orchestration skill |
| `plugin/commands/sdd-init.md` | Logic moved to init-orchestration skill |
| `plugin/commands/sdd-settings.md` | Never user-facing; managed internally by project-settings skill |
| `plugin/commands/sdd-version.md` | Logic moved to version-orchestration skill |
| `plugin/skills/local-env/SKILL.md` | Moved to orchestrators/local-env-orchestration/ |

### Rewritten Files

| File | Description |
|------|-------------|
| `plugin/commands/sdd-run.md` | Thin dispatcher with all namespaces, help output, namespace docs |

### Updated Files — Plugin Skills (18 files)

| File | Change |
|------|--------|
| `plugin/skills/spec-solicitation/SKILL.md` | Replace 4 `/sdd-change` refs with `/sdd` prompts |
| `plugin/skills/component-discovery/SKILL.md` | Replace 1 `/sdd-change` ref |
| `plugin/skills/domain-population/SKILL.md` | Replace 1 `/sdd-change` ref |
| `plugin/skills/planning/SKILL.md` | Replace 8 `/sdd-change` refs |
| `plugin/skills/commit-standards/SKILL.md` | Replace 4 `/sdd-change` refs |
| `plugin/skills/project-scaffolding/SKILL.md` | Replace 1 `/sdd-init` + 1 `/sdd-change` ref |
| `plugin/skills/project-scaffolding/templates/project/CLAUDE.md` | Replace 9 `/sdd-change` + 1 `/sdd-init` refs with `/sdd` prompts |
| `plugin/skills/project-scaffolding/templates/project/README.md` | Replace 1 `/sdd-change` + 3 `/sdd-run` refs with `/sdd` prompts |
| `plugin/skills/change-creation/templates/spec-feature.md` | Replace 1 `/sdd-change` ref |
| `plugin/skills/external-spec-integration/SKILL.md` | Replace 2 `/sdd-change` refs |
| `plugin/skills/workflow-state/resources/recovery.md` | Replace 5 `/sdd-change` refs |
| `plugin/skills/spec-writing/resources/frontmatter-validation.md` | Replace 2 `/sdd-change` refs |
| `plugin/skills/scaffolding/SKILL.md` | Replace 1 `/sdd-init` ref |
| `plugin/skills/components/helm/helm-standards/SKILL.md` | Replace 1 `/sdd-config` ref |
| `plugin/skills/components/config/config-scaffolding/SKILL.md` | Replace 1 `/sdd-config` + 1 `/sdd-settings` ref |
| `plugin/skills/components/config/config-standards/SKILL.md` | Replace 2 `/sdd-config` + 2 `/sdd-run` refs |
| `plugin/skills/components/database/database-scaffolding/templates/README.md` | Replace 10 `/sdd-run database` refs with `/sdd` prompts, consider `--env` addition |
| `plugin/skills/project-settings/SKILL.md` | Replace 1 `/sdd-settings` command ref (line 263, 292) |

### Updated Files — Plugin Agents (1 file)

| File | Change |
|------|--------|
| `plugin/agents/devops.md` | Replace 11 `/sdd-run env` refs with `system-run.sh env` calls (agents are non-interactive, use internal invocations) |

### Updated Files — System CLI (9 files)

| File | Change |
|------|--------|
| `plugin/system/src/commands/database/schema.ts` | Add `env` property to schema |
| `plugin/system/src/commands/database/handler.ts` | Thread `--env` arg through to action imports |
| `plugin/system/src/commands/database/setup.ts` | Accept and use env parameter |
| `plugin/system/src/commands/database/teardown.ts` | Accept and use env parameter |
| `plugin/system/src/commands/database/migrate.ts` | Accept and use env parameter |
| `plugin/system/src/commands/database/seed.ts` | Accept and use env parameter |
| `plugin/system/src/commands/database/reset.ts` | Accept and use env parameter |
| `plugin/system/src/commands/database/port-forward.ts` | Accept and use env parameter |
| `plugin/system/src/commands/database/psql.ts` | Accept and use env parameter |

### Updated Files — Tests (14 files, 4 renamed)

| File | Change |
|------|--------|
| `tests/src/tests/workflows/sdd-change-new.test.ts` | Rename to `change-create.test.ts`, update refs |
| `tests/src/tests/workflows/sdd-change-new-external.test.ts` | Rename to `change-create-external.test.ts`, update refs |
| `tests/src/tests/workflows/sdd-init.test.ts` | Rename to `init.test.ts`, update refs |
| `tests/src/tests/unit/commands/sdd-config.test.ts` | Rename to `config.test.ts`, update refs |
| `tests/src/tests/unit/skills/scaffolding-config.test.ts` | Update command refs in comments |
| `tests/src/tests/unit/docs/config-docs.test.ts` | Update assertions: `/sdd-config` → `/sdd-run config` |
| `tests/src/tests/integration/database-component/templates.test.ts` | Update 3 `/sdd-run database` refs |
| `tests/src/tests/integration/database-component/scaffolding-integration.test.ts` | Line 183 reads `sdd-init.md` by path — update to reference `sdd-run.md` or init-orchestration skill |
| `tests/src/tests/unit/settings/settings-reconcile.test.ts` | Update assertion strings containing `sdd-change` and `sdd-settings` (lines 113, 189) — these test reconciliation module output, so the module itself may also need updating |
| `tests/src/tests/unit/skills/config-skills.test.ts` | Update `sdd-init` comment ref |
| `tests/src/tests/unit/commands/env/check-tools.test.ts` | Update `sdd-init` comment ref |
| `tests/src/tests/unit/commands/permissions/configure.test.ts` | Update `sdd-init` comment ref |
| `tests/src/tests/unit/commands/config/validate.test.ts` | Update `sdd-config` in temp dir prefix |
| `tests/src/tests/unit/commands/config/diff.test.ts` | Update `sdd-config` in temp dir prefix (if present) |

### Updated Files — Docs (9 files)

| File | Change |
|------|--------|
| `docs/commands.md` | Rewrite around 3 new commands (52 refs) |
| `docs/tutorial.md` | Replace 42 old command refs with `/sdd` prompts |
| `docs/workflows.md` | Replace 31 old command refs with `/sdd` prompts |
| `docs/external-specs.md` | Replace 18 old command refs with `/sdd` prompts |
| `docs/config-guide.md` | Replace 9 old command refs with `/sdd` prompts |
| `docs/getting-started.md` | Replace 5 old command refs with `/sdd` prompts |
| `docs/workflow-progress.md` | Replace 9 old command refs with `/sdd` prompts |
| `docs/components.md` | Replace 4 old command refs with `/sdd` prompts |
| `docs/agents.md` | Replace 2 old command refs with `/sdd` prompts |

### Updated Files — Root & Marketplace (3 files)

| File | Change |
|------|--------|
| `README.md` | Replace 21 old command refs with `/sdd` prompts |
| `plugin/.claude-plugin/plugin.json` | Version bump to 7.0.0, add orchestrator skill paths |
| `.claude-plugin/marketplace.json` | Version bump to 7.0.0 |
| `changelog/README.md` | Add v7 summary paragraph + version table row |

### Updated Files — Marketplace Skills (4 files)

| File | Change |
|------|--------|
| `.claude/skills/commands-standards/SKILL.md` | Replace 4 old command refs (these use `/sdd-run` since they describe command authoring) |
| `.claude/skills/docs-standards/SKILL.md` | Replace 1 `/sdd-init` ref |
| `.claude/skills/system-cli-standards/skill.md` | Replace 1 `/sdd-run` ref |
| `.claude/skills/plugin-testing-standards/SKILL.md` | Replace 3 `sdd-init` refs (JSON example, WHY comment, describe block) |

## Changes

This is structured as 8 implementation phases, ordered by dependency. Each phase is independently committable.

### Phase 1: Create orchestrator skills (extract from existing commands)

The largest phase — extract logic from 5 command files into orchestrator skill files. This is a reorganization, not a rewrite: the content moves with minimal modification (frontmatter changes, cross-reference updates within the extracted content).

**change-orchestration** — Split sdd-change.md (1143 lines) into a dispatcher + 6 sub-files:
- `SKILL.md` — Frontmatter, action routing table, shared validation (arg parsing, change-id lookup, status checks), common output patterns. ~100 lines.
- `creation.md` — Interactive + external spec flows (sdd-change.md lines 129-395). Retains all INVOKE patterns (workflow-state, component-discovery, spec-solicitation, spec-decomposition, external-spec-integration). ~270 lines.
- `spec-review.md` — `approve spec` (lines 526-565) + `answer`, `assume` (lines 931-1007). ~120 lines.
- `planning.md` — `approve plan` (lines 569-600) + `plan` (lines 845-891). ~80 lines.
- `implementation.md` — `implement` action (lines 604-690). ~90 lines.
- `verification.md` — `verify`, `review` actions (lines 694-927). ~240 lines.
- `management.md` — `status`, `list`, `continue`, `regress`, `request-changes` (lines 399-523, 1011-1102). ~250 lines.

**init-orchestration** — Move sdd-init.md content (306 lines) into `SKILL.md`. Update internal command refs in Phase 6 output messages. Retain all INVOKE patterns (project-scaffolding, system-run.sh calls).

**config-orchestration** — Move sdd-config.md content (269 lines) into `SKILL.md`. Each operation is a `system-run.sh config <op>` call with arg validation and output formatting.

**version-orchestration** — Move sdd-version.md content (86 lines) into `SKILL.md`. Read-only skill (plugin.json + sdd-settings.yaml, semver compare, 4 output scenarios). Update Phase 6 output ref from `/sdd-init` to `/sdd` prompt.

**local-env-orchestration** — Move plugin/skills/local-env/SKILL.md (170 lines) to orchestrators. Update `env` namespace refs to `local-env` in user-facing text. Internal `system-run.sh env` calls remain unchanged (system CLI keeps `env` namespace).

All orchestrator skills use `user-invocable: false` — they're invoked by sdd-run.md, not directly by users.

### Phase 2: Create /sdd-run command (thin dispatcher)

Rewrite `plugin/commands/sdd-run.md` (currently 244 lines) as the unified explicit command.

Structure:
1. Frontmatter (name, description)
2. Usage syntax and global options (--json, --verbose, --help)
3. No-argument help output (lists all namespaces with descriptions)
4. Namespace routing: for each of 8 user-facing namespaces, INVOKE the corresponding orchestrator skill or pass through to system-run.sh
5. Namespace documentation (description, when to use, scenario) for all 8 namespaces

Routing rules:
- `change <action> [args]` → INVOKE change-orchestration
- `init` → INVOKE init-orchestration
- `config <op> [args]` → INVOKE config-orchestration
- `version` → INVOKE version-orchestration
- `local-env <action> [args]` → INVOKE local-env-orchestration
- `database <action> <name> [--env <env>] [args]` → pass-through: `system-run.sh database <action> <name> [args]`
- `contract validate <component>` → pass-through: `system-run.sh contract validate <component>`
- `permissions configure` → pass-through: `system-run.sh permissions configure`
- `help` → same as no-argument output

### Phase 3: Create /sdd command (Jarvis)

Create `plugin/commands/sdd.md` — the context-aware workflow assistant.

Content:
1. Frontmatter (name, description)
2. Strict approval protocol (understand → explain → ask → execute)
3. No-argument flow: read git branch, workflow state, project init state, sdd-settings → suggest next action
4. With-arguments flow: interpret natural language → explain intent → wait for approval → INVOKE sdd-run via Skill tool
5. Multi-workflow handling (feature branch focus, main branch list, no workflows guidance)
6. Cross-referencing rules: when to point to `/sdd-help` (novice concepts) and `/sdd-run` (direct commands)
7. Settings management: when users describe settings changes, delegate to project-settings skill internally

### Phase 4: Create /sdd-help command (Tutor)

Create `plugin/commands/sdd-help.md` — the teaching command.

Content:
1. Frontmatter (name, description)
2. No tools available (read-only, no Bash/Write/Edit/Skill)
3. Capability discovery: surfaces full range of SDD functionality
4. SDD methodology explainer: specs before code, change lifecycle
5. Concept explainer: specs, plans, workflows, component settings
6. Prompt examples: shows exact `/sdd` prompts to type
7. Guided walkthrough: narrates workflow steps with `/sdd` prompts
8. Progressive disclosure: simple → complex

References only `/sdd` (never `/sdd-run`). Does not invoke system CLI.

### Phase 5: Delete old commands + local-env skill

Delete 5 command files and the old local-env skill location:
- `plugin/commands/sdd-change.md`
- `plugin/commands/sdd-config.md`
- `plugin/commands/sdd-init.md`
- `plugin/commands/sdd-settings.md`
- `plugin/commands/sdd-version.md`
- `plugin/skills/local-env/SKILL.md` (and directory)

### Phase 6: Update database CLI for --env support

Add `env` property to database schema and thread through all handlers.

**schema.ts**: Add `env` property (string, optional, default `"local"`).

**handler.ts**: Extract env from validated args, pass to each action function.

**7 action files** (setup, teardown, migrate, seed, reset, port-forward, psql): Add `env` parameter to function signatures. Use env to determine connection settings (namespace, port-forward target, etc.).

### Phase 7: Update all references

The bulk-update phase. Process every file that references old command names.

**Reference replacement rules by context:**

1. **User-facing** (skills, docs, README, scaffolding templates, orchestrator output messages): old command → `/sdd` + natural language prompt
2. **Agents**: `/sdd-run env` → `system-run.sh env` calls (agents are non-interactive, use internal invocations)
3. **Marketplace skills** (.claude/skills/): old commands → `/sdd-run` equivalents (these describe command authoring)
4. **Tests**: old command names → new equivalents in describe blocks, prompts, and assertions

**Concrete replacement mapping:** Apply the mapping table from task.md Constraints section ("Concrete replacement mapping" table). Each old command reference becomes a `/sdd` natural language prompt.

**Test file renames:**
- `sdd-change-new.test.ts` → `change-create.test.ts`
- `sdd-change-new-external.test.ts` → `change-create-external.test.ts`
- `sdd-init.test.ts` → `init.test.ts`
- `sdd-config.test.ts` → `config.test.ts`

**docs/commands.md**: Full rewrite structured around 3 new commands (currently 52 refs).

### Phase 8: Version bump, manifest, changelog

1. Update `plugin/.claude-plugin/plugin.json`:
   - Version to `7.0.0`
   - Add orchestrator skill paths to `skills` array:
     - `./skills/orchestrators/change-orchestration/`
     - `./skills/orchestrators/init-orchestration/`
     - `./skills/orchestrators/config-orchestration/`
     - `./skills/orchestrators/version-orchestration/`
     - `./skills/orchestrators/local-env-orchestration/`

2. Update `.claude-plugin/marketplace.json`: version to `7.0.0`

3. Create `changelog/v7.md` with the breaking changes entry

4. Update `changelog/README.md`:
   - Add v7 summary paragraph at the top (after the intro, before v6) — witty, in the established voice
   - Update the version table: change v6's range to `6.0.0 – 6.x.x` (final 6.x version) and add v7 row
   - Update v6's date range to end date

## Dependencies

1. **Phase 1** (orchestrators) has no dependencies — can start immediately
2. **Phase 2** (sdd-run) depends on Phase 1 — needs orchestrator skills to INVOKE
3. **Phase 3** (sdd) depends on Phase 2 — delegates to sdd-run via Skill tool
4. **Phase 4** (sdd-help) has no dependency on Phases 2-3 (only references `/sdd`, doesn't INVOKE anything)
5. **Phase 5** (delete old) depends on Phases 1-4 — all new commands must exist before deleting old
6. **Phase 6** (database --env) is independent — can run any time
7. **Phase 7** (update refs) depends on Phases 1-5 — needs new command names to exist, old ones deleted
8. **Phase 8** (version/changelog) runs last — captures all changes

Critical path: Phase 1 → Phase 2 → Phase 3 → Phase 5 → Phase 7 → Phase 8

## Tests

### Workflow Tests (renamed)

- [ ] `change-create.test.ts` — Tests change creation flow via `/sdd-run change create`
- [ ] `change-create-external.test.ts` — Tests external spec import via `/sdd-run change create --spec`
- [ ] `init.test.ts` — Tests init workflow via `/sdd-run init`

### Unit Tests (renamed + updated)

- [ ] `config.test.ts` — Tests config operations via `/sdd-run config`
- [ ] `scaffolding-config.test.ts` — Updated command refs
- [ ] `config-docs.test.ts` — Updated command refs

### Integration Tests (updated)

- [ ] `database-component/templates.test.ts` — Updated `/sdd-run database` refs, `--env` support
- [ ] `database-component/scaffolding-integration.test.ts` — Updated `sdd-init.md` file path reference

### Standards Audit (Phase 8)

- [ ] `commands-standards` audit on sdd.md, sdd-run.md, sdd-help.md
- [ ] `skills-standards` audit on all orchestrator skills
- [ ] `agents-standards` audit on devops.md updates
- [ ] `system-cli-standards` audit on database --env changes
- [ ] `docs-standards` audit on all docs/ changes
- [ ] `plugin-product-standards` audit on overall coherence
- [ ] `/critic` final review

## Verification

All acceptance criteria from task.md, verified externally:

- [ ] `ls plugin/commands/ | sort` outputs exactly `sdd-help.md`, `sdd-run.md`, `sdd.md`
- [ ] `grep -c "sdd-run.*\(change\|init\|local-env\|database\|contract\|config\|permissions\|version\)" plugin/commands/sdd-run.md` ≥ 8
- [ ] `grep -E "INVOKE.*orchestration" plugin/commands/sdd-run.md` returns ≥ 5 matches
- [ ] `grep -E "git branch|workflows/|sdd-settings" plugin/commands/sdd.md` returns matches
- [ ] `grep -c "sdd-help\|sdd-run" plugin/commands/sdd.md` ≥ 2
- [ ] `grep -E "approval|NEVER execute|confirm|approve" plugin/commands/sdd.md` returns matches
- [ ] `grep -E "methodology|capability|walkthrough|progressive" plugin/commands/sdd-help.md` returns matches
- [ ] `grep -E "system-run|Bash|Write|Edit|sdd-run" plugin/commands/sdd-help.md` returns zero matches
- [ ] `grep -r "\/sdd-change\|\/sdd-config\|\/sdd-init\|\/sdd-settings\|\/sdd-version" plugin/ --include="*.md" | grep -v "sdd-settings\."` returns zero
- [ ] `grep -r "sdd-change\|sdd-config\|sdd-init\|sdd-settings\|sdd-version" tests/ --include="*.ts" | grep -v "sdd-settings\."` returns zero
- [ ] `grep -r "\/sdd-change\|\/sdd-config\|\/sdd-init\|\/sdd-settings\|\/sdd-version" docs/ README.md | grep -v "sdd-settings\."` returns zero
- [ ] `grep -r "sdd-run env" plugin/ docs/ tests/ README.md --include="*.md" --include="*.ts"` returns zero
- [ ] `ls plugin/skills/orchestrators/` shows all 5 orchestrator directories
- [ ] `ls plugin/skills/orchestrators/change-orchestration/` shows SKILL.md + 6 sub-files
- [ ] `test ! -d plugin/skills/local-env/ && echo "removed"` outputs "removed"
- [ ] `grep "env" plugin/system/src/commands/database/schema.ts` returns match
- [ ] `grep "orchestrators" plugin/.claude-plugin/plugin.json` returns ≥ 5 matches
- [ ] `npm run typecheck:plugin` passes
- [ ] `npm test` passes
