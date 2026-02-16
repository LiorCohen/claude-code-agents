---
generated: 2026-02-16 20:56 UTC
branch: feature/task-144-three-command-structure
commits: 12
---

# Changes — Task #144: Three-command structure

81 files changed, +2943, -2468

## Summary

| File | Added | Removed |
|------|-------|---------|
| **New commands** | | |
| [`plugin/commands/sdd.md`](plugin/commands/sdd.md) | +190 | -0 |
| [`plugin/commands/sdd-help.md`](plugin/commands/sdd-help.md) | +227 | -0 |
| [`plugin/commands/sdd-run.md`](plugin/commands/sdd-run.md) | +279 | -127 |
| **Deleted commands** | | |
| [`plugin/commands/sdd-change.md`](plugin/commands/sdd-change.md) | +0 | -1143 |
| [`plugin/commands/sdd-config.md`](plugin/commands/sdd-config.md) | +0 | -269 |
| [`plugin/commands/sdd-settings.md`](plugin/commands/sdd-settings.md) | +0 | -151 |
| **Orchestrator skills (new)** | | |
| [`plugin/skills/orchestrators/change-orchestration/SKILL.md`](plugin/skills/orchestrators/change-orchestration/SKILL.md) | +128 | -0 |
| [`plugin/skills/orchestrators/change-orchestration/creation.md`](plugin/skills/orchestrators/change-orchestration/creation.md) | +267 | -0 |
| [`plugin/skills/orchestrators/change-orchestration/spec-review.md`](plugin/skills/orchestrators/change-orchestration/spec-review.md) | +128 | -0 |
| [`plugin/skills/orchestrators/change-orchestration/planning.md`](plugin/skills/orchestrators/change-orchestration/planning.md) | +88 | -0 |
| [`plugin/skills/orchestrators/change-orchestration/implementation.md`](plugin/skills/orchestrators/change-orchestration/implementation.md) | +87 | -0 |
| [`plugin/skills/orchestrators/change-orchestration/verification.md`](plugin/skills/orchestrators/change-orchestration/verification.md) | +190 | -0 |
| [`plugin/skills/orchestrators/change-orchestration/management.md`](plugin/skills/orchestrators/change-orchestration/management.md) | +230 | -0 |
| [`plugin/skills/orchestrators/config-orchestration/SKILL.md`](plugin/skills/orchestrators/config-orchestration/SKILL.md) | +164 | -0 |
| [`plugin/skills/orchestrators/init-orchestration/SKILL.md`](plugin/skills/orchestrators/init-orchestration/SKILL.md) | +43 | -17 |
| [`plugin/skills/orchestrators/local-env-orchestration/SKILL.md`](plugin/skills/orchestrators/local-env-orchestration/SKILL.md) | +293 | -0 |
| [`plugin/skills/orchestrators/version-orchestration/SKILL.md`](plugin/skills/orchestrators/version-orchestration/SKILL.md) | +13 | -12 |
| **Deleted skill (moved)** | | |
| [`plugin/skills/local-env/SKILL.md`](plugin/skills/local-env/SKILL.md) | +0 | -170 |
| **System CLI (database --env)** | | |
| [`plugin/system/src/commands/database/schema.ts`](plugin/system/src/commands/database/schema.ts) | +6 | -0 |
| [`plugin/system/src/commands/database/handler.ts`](plugin/system/src/commands/database/handler.ts) | +12 | -8 |
| [`plugin/system/src/commands/database/setup.ts`](plugin/system/src/commands/database/setup.ts) | +3 | -2 |
| [`plugin/system/src/commands/database/teardown.ts`](plugin/system/src/commands/database/teardown.ts) | +3 | -2 |
| [`plugin/system/src/commands/database/migrate.ts`](plugin/system/src/commands/database/migrate.ts) | +2 | -1 |
| [`plugin/system/src/commands/database/seed.ts`](plugin/system/src/commands/database/seed.ts) | +2 | -1 |
| [`plugin/system/src/commands/database/reset.ts`](plugin/system/src/commands/database/reset.ts) | +7 | -6 |
| [`plugin/system/src/commands/database/port-forward.ts`](plugin/system/src/commands/database/port-forward.ts) | +3 | -2 |
| [`plugin/system/src/commands/database/psql.ts`](plugin/system/src/commands/database/psql.ts) | +2 | -1 |
| **Settings reconciliation fix** | | |
| [`plugin/system/src/settings/reconcile.ts`](plugin/system/src/settings/reconcile.ts) | +1 | -1 |
| [`plugin/system/src/settings/sync.ts`](plugin/system/src/settings/sync.ts) | +1 | -1 |
| **Plugin skills (reference updates)** | | |
| [`plugin/skills/spec-solicitation/SKILL.md`](plugin/skills/spec-solicitation/SKILL.md) | +4 | -4 |
| [`plugin/skills/component-discovery/SKILL.md`](plugin/skills/component-discovery/SKILL.md) | +1 | -1 |
| [`plugin/skills/domain-population/SKILL.md`](plugin/skills/domain-population/SKILL.md) | +1 | -1 |
| [`plugin/skills/planning/SKILL.md`](plugin/skills/planning/SKILL.md) | +5 | -5 |
| [`plugin/skills/commit-standards/SKILL.md`](plugin/skills/commit-standards/SKILL.md) | +5 | -5 |
| [`plugin/skills/project-scaffolding/SKILL.md`](plugin/skills/project-scaffolding/SKILL.md) | +3 | -3 |
| [`plugin/skills/project-scaffolding/templates/project/CLAUDE.md`](plugin/skills/project-scaffolding/templates/project/CLAUDE.md) | +9 | -9 |
| [`plugin/skills/project-scaffolding/templates/project/README.md`](plugin/skills/project-scaffolding/templates/project/README.md) | +1 | -1 |
| [`plugin/skills/change-creation/templates/spec-feature.md`](plugin/skills/change-creation/templates/spec-feature.md) | +1 | -1 |
| [`plugin/skills/external-spec-integration/SKILL.md`](plugin/skills/external-spec-integration/SKILL.md) | +3 | -3 |
| [`plugin/skills/workflow-state/SKILL.md`](plugin/skills/workflow-state/SKILL.md) | +1 | -1 |
| [`plugin/skills/workflow-state/resources/recovery.md`](plugin/skills/workflow-state/resources/recovery.md) | +5 | -5 |
| [`plugin/skills/spec-writing/resources/frontmatter-validation.md`](plugin/skills/spec-writing/resources/frontmatter-validation.md) | +2 | -2 |
| [`plugin/skills/scaffolding/SKILL.md`](plugin/skills/scaffolding/SKILL.md) | +2 | -2 |
| [`plugin/skills/components/helm/helm-standards/SKILL.md`](plugin/skills/components/helm/helm-standards/SKILL.md) | +1 | -1 |
| [`plugin/skills/components/config/config-scaffolding/SKILL.md`](plugin/skills/components/config/config-scaffolding/SKILL.md) | +2 | -2 |
| [`plugin/skills/components/config/config-standards/SKILL.md`](plugin/skills/components/config/config-standards/SKILL.md) | +2 | -2 |
| [`plugin/skills/project-settings/SKILL.md`](plugin/skills/project-settings/SKILL.md) | +2 | -2 |
| **Agent (reference updates)** | | |
| [`plugin/agents/devops.md`](plugin/agents/devops.md) | +11 | -11 |
| **Docs (reference updates)** | | |
| [`docs/commands.md`](docs/commands.md) | +146 | -189 |
| [`docs/tutorial.md`](docs/tutorial.md) | +28 | -32 |
| [`docs/workflows.md`](docs/workflows.md) | +23 | -29 |
| [`docs/external-specs.md`](docs/external-specs.md) | +15 | -22 |
| [`docs/config-guide.md`](docs/config-guide.md) | +16 | -22 |
| [`docs/workflow-progress.md`](docs/workflow-progress.md) | +10 | -12 |
| [`docs/getting-started.md`](docs/getting-started.md) | +7 | -7 |
| [`docs/agents.md`](docs/agents.md) | +2 | -2 |
| [`docs/components.md`](docs/components.md) | +1 | -1 |
| **README and root** | | |
| [`README.md`](README.md) | +17 | -18 |
| **Manifests and changelog** | | |
| [`plugin/.claude-plugin/plugin.json`](plugin/.claude-plugin/plugin.json) | +2 | -1 |
| [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) | +1 | -1 |
| [`changelog/v7.md`](changelog/v7.md) | +48 | -0 |
| [`changelog/README.md`](changelog/README.md) | +16 | -2 |
| **Marketplace skills (reference updates)** | | |
| [`.claude/skills/commands-standards/SKILL.md`](.claude/skills/commands-standards/SKILL.md) | +15 | -15 |
| [`.claude/skills/docs-standards/SKILL.md`](.claude/skills/docs-standards/SKILL.md) | +1 | -1 |
| [`.claude/skills/plugin-testing-standards/SKILL.md`](.claude/skills/plugin-testing-standards/SKILL.md) | +3 | -3 |
| **Tests (renamed + updated)** | | |
| [`tests/src/tests/workflows/change-create.test.ts`](tests/src/tests/workflows/change-create.test.ts) | +10 | -10 |
| [`tests/src/tests/workflows/change-create-external.test.ts`](tests/src/tests/workflows/change-create-external.test.ts) | +10 | -10 |
| [`tests/src/tests/workflows/init.test.ts`](tests/src/tests/workflows/init.test.ts) | +15 | -15 |
| [`tests/src/tests/unit/commands/config.test.ts`](tests/src/tests/unit/commands/config.test.ts) | +51 | -48 |
| [`tests/src/tests/unit/docs/config-docs.test.ts`](tests/src/tests/unit/docs/config-docs.test.ts) | +5 | -5 |
| [`tests/src/tests/unit/settings/settings-reconcile.test.ts`](tests/src/tests/unit/settings/settings-reconcile.test.ts) | +1 | -1 |
| [`tests/src/tests/unit/skills/config-skills.test.ts`](tests/src/tests/unit/skills/config-skills.test.ts) | +1 | -1 |
| [`tests/src/tests/unit/commands/config/diff.test.ts`](tests/src/tests/unit/commands/config/diff.test.ts) | +1 | -1 |
| [`tests/src/tests/unit/commands/config/validate.test.ts`](tests/src/tests/unit/commands/config/validate.test.ts) | +1 | -1 |
| [`tests/src/tests/unit/commands/env/check-tools.test.ts`](tests/src/tests/unit/commands/env/check-tools.test.ts) | +1 | -1 |
| [`tests/src/tests/unit/commands/permissions/configure.test.ts`](tests/src/tests/unit/commands/permissions/configure.test.ts) | +1 | -1 |
| [`tests/src/tests/integration/database-component/scaffolding-integration.test.ts`](tests/src/tests/integration/database-component/scaffolding-integration.test.ts) | +4 | -4 |
