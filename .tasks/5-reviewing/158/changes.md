---
generated: 2026-02-23 15:47 UTC
branch: feature/task-158-split-plugin-core-techpack
commits: 21
---

# Task #158 — Changes

**Files changed:** 435 (+7164 / -6583 lines)

| File | Added | Removed |
|------|------:|--------:|
| `package-lock.json` | +42 | -4 |
| `package.json` | +4 | -4 |
| `plugin/.claude-plugin/plugin.json` | +6 | -11 |
| `plugin/commands/sdd-run.md` | +0 | -396 |
| `plugin/{ => core}/commands/sdd-help.md` | +13 | -17 |
| `plugin/core/commands/sdd-run.md` | +239 | -0 |
| `plugin/{ => core}/commands/sdd.md` | +16 | -10 |
| `plugin/{hooks => core/permissions}/recommended-permissions.json` | +3 | -5 |
| `plugin/{ => core}/skills/change-creation/SKILL.md` | +13 | -32 |
| `plugin/{ => core}/skills/change-creation/templates/spec-feature.md` | +6 | -6 |
| `plugin/{ => core}/skills/commit-standards/SKILL.md` | +5 | -5 |
| `plugin/{ => core}/skills/domain-population/SKILL.md` | +2 | -2 |
| `plugin/{ => core}/skills/external-spec-integration/SKILL.md` | +9 | -9 |
| `plugin/{ => core}/skills/external-spec-integration/resources/transformation.md` | +2 | -2 |
| `plugin/{ => core}/skills/external-spec-integration/resources/workflow-steps.md` | +12 | -15 |
| `plugin/{ => core}/skills/orchestrators/change-orchestration/SKILL.md` | +1 | -1 |
| `plugin/{ => core}/skills/orchestrators/change-orchestration/creation.md` | +1 | -1 |
| `plugin/{ => core}/skills/orchestrators/change-orchestration/implementation.md` | +8 | -5 |
| `plugin/{ => core}/skills/orchestrators/change-orchestration/management.md` | +11 | -11 |
| `plugin/{ => core}/skills/orchestrators/change-orchestration/verification.md` | +10 | -24 |
| `plugin/{ => core}/skills/orchestrators/init-orchestration/SKILL.md` | +77 | -65 |
| `plugin/{ => core}/skills/orchestrators/version-orchestration/SKILL.md` | +1 | -1 |
| `plugin/{ => core}/skills/planning/SKILL.md` | +43 | -81 |
| `plugin/{ => core}/skills/project-scaffolding/SKILL.md` | +11 | -31 |
| `plugin/core/skills/project-settings/SKILL.md` | +219 | -0 |
| `plugin/core/skills/project-settings/schemas/sdd-settings.schema.json` | +114 | -0 |
| `plugin/{ => core}/skills/spec-decomposition/resources/data-structures.md` | +22 | -22 |
| `plugin/{ => core}/skills/spec-decomposition/resources/decomposition-algorithm.md` | +8 | -8 |
| `plugin/{ => core}/skills/spec-decomposition/resources/outline-modes.md` | +8 | -8 |
| `plugin/{ => core}/skills/spec-solicitation/SKILL.md` | +8 | -8 |
| `plugin/{ => core}/skills/spec-solicitation/resources/solicitation-steps.md` | +15 | -34 |
| `plugin/{ => core}/skills/spec-solicitation/resources/workflow-yaml.md` | +4 | -14 |
| `plugin/{ => core}/skills/spec-writing/resources/feature-spec-template.md` | +1 | -1 |
| `plugin/{ => core}/skills/spec-writing/resources/other-templates.md` | +2 | -2 |
| `plugin/core/skills/tech-discovery/SKILL.md` | +174 | -0 |
| `plugin/{skills/component-discovery => core/skills/tech-discovery}/schemas/output.schema.json` | +1 | -9 |
| `plugin/core/skills/techpacks/SKILL.md` | +83 | -0 |
| `plugin/core/skills/techpacks/resources/operations.md` | +139 | -0 |
| `plugin/core/skills/techpacks/schemas/command-router-context.schema.json` | +24 | -0 |
| `plugin/core/skills/techpacks/schemas/declared-actions-response.schema.json` | +50 | -0 |
| `plugin/core/skills/techpacks/schemas/sdd-settings.schema.json` | +61 | -0 |
| `plugin/core/skills/techpacks/schemas/skills-router-context.schema.json` | +27 | -0 |
| `plugin/core/skills/techpacks/schemas/techpack-settings.schema.json` | +41 | -0 |
| `plugin/core/skills/techpacks/schemas/techpack.schema.json` | +126 | -0 |
| `plugin/{ => core}/skills/workflow-state/SKILL.md` | +7 | -7 |
| `plugin/{ => core}/skills/workflow-state/resources/internal-api.md` | +16 | -16 |
| `plugin/{ => core}/skills/workflow-state/resources/recovery.md` | +3 | -3 |
| `plugin/{ => core}/skills/workflow-state/resources/workflow-yaml-schema.md` | +6 | -6 |
| `plugin/core/system/README.md` | +126 | -0 |
| `plugin/{ => core}/system/package.json` | +1 | -1 |
| `plugin/{ => core}/system/src/cli.ts` | +42 | -62 |
| `plugin/core/system/src/commands/agent/frontmatter.ts` | +50 | -0 |
| `plugin/{system/src/commands/hook => core/system/src/commands/agent}/handler.ts` | +14 | -14 |
| `plugin/core/system/src/commands/agent/index.ts` | +2 | -0 |
| `plugin/{system/src/commands/hook => core/system/src/commands/agent}/schema.ts` | +11 | -5 |
| `plugin/{ => core}/system/src/commands/archive/handler.ts` | +1 | -1 |
| `plugin/{ => core}/system/src/commands/archive/store.ts` | +7 | -3 |
| `plugin/core/system/src/commands/log/handler.ts` | +49 | -0 |
| `plugin/core/system/src/commands/log/index.ts` | +2 | -0 |
| `plugin/core/system/src/commands/log/schema.ts` | +46 | -0 |
| `plugin/core/system/src/commands/log/write.ts` | +67 | -0 |
| `plugin/{ => core}/system/src/commands/permissions/configure.ts` | +1 | -1 |
| `plugin/{ => core}/system/src/commands/scaffolding/engine.ts` | +7 | -3 |
| `plugin/core/system/src/commands/scaffolding/project.ts` | +253 | -0 |
| `plugin/{ => core}/system/src/commands/settings/handler.ts` | +7 | -1 |
| `plugin/core/system/src/commands/settings/process-actions.ts` | +281 | -0 |
| `plugin/{ => core}/system/src/commands/settings/reconcile.ts` | +37 | -11 |
| `plugin/{ => core}/system/src/commands/settings/schema.ts` | +1 | -1 |
| `plugin/core/system/src/commands/tech-pack/handler.ts` | +78 | -0 |
| `plugin/core/system/src/commands/tech-pack/index.ts` | +2 | -0 |
| `plugin/core/system/src/commands/tech-pack/info.ts` | +98 | -0 |
| `plugin/core/system/src/commands/tech-pack/install.ts` | +88 | -0 |
| `plugin/core/system/src/commands/tech-pack/list.ts` | +64 | -0 |
| `plugin/core/system/src/commands/tech-pack/remove.ts` | +77 | -0 |
| `plugin/core/system/src/commands/tech-pack/schema.ts` | +33 | -0 |
| `plugin/core/system/src/commands/tech-pack/validate.ts` | +243 | -0 |
| `plugin/{ => core}/system/src/commands/workflow/check-gate.ts` | +2 | -2 |
| `plugin/{ => core}/system/src/lib/config.ts` | +18 | -8 |
| `plugin/{ => core}/system/src/lib/logger.ts` | +6 | -3 |
| `plugin/core/system/src/settings/defaults.ts` | +16 | -0 |
| `plugin/core/system/src/settings/index.ts` | +52 | -0 |
| `plugin/{ => core}/system/src/settings/reconcile.ts` | +76 | -127 |
| `plugin/core/system/src/settings/schema.ts` | +155 | -0 |
| `plugin/core/system/src/settings/sync.ts` | +121 | -0 |
| `plugin/core/system/src/settings/validate.ts` | +212 | -0 |
| `plugin/core/system/src/types/config.ts` | +9 | -0 |
| `plugin/core/system/src/types/index.ts` | +16 | -0 |
| `plugin/core/system/src/types/settings.ts` | +81 | -0 |
| `plugin/core/system/system-run.sh` | +4 | -0 |
| `plugin/fullstack-typescript/README.md` | +80 | -0 |
| `plugin/{ => fullstack-typescript}/agents/api-designer.md` | +4 | -4 |
| `plugin/{ => fullstack-typescript}/agents/backend-dev.md` | +4 | -4 |
| `plugin/{ => fullstack-typescript}/agents/devops.md` | +17 | -17 |
| `plugin/{ => fullstack-typescript}/agents/frontend-dev.md` | +3 | -3 |
| `plugin/{ => fullstack-typescript}/agents/tester.md` | +8 | -10 |
| `plugin/fullstack-typescript/skills/capabilities/SKILL.md` | +31 | -0 |
| `plugin/fullstack-typescript/skills/command-router/SKILL.md` | +181 | -0 |
| `plugin/fullstack-typescript/skills/component-discovery/SKILL.md` | +281 | -0 |
| `plugin/{ => fullstack-typescript}/skills/components/backend/backend-scaffolding/SKILL.md` | +4 | -4 |
| `plugin/fullstack-typescript/skills/components/cicd/cicd-scaffolding/SKILL.md` | +50 | -0 |
| `plugin/{ => fullstack-typescript}/skills/components/cicd/cicd-standards/SKILL.md` | +2 | -2 |
| `plugin/{ => fullstack-typescript}/skills/components/config/config-scaffolding/SKILL.md` | +3 | -3 |
| `plugin/{ => fullstack-typescript}/skills/components/contract/contract-scaffolding/SKILL.md` | +5 | -5 |
| `plugin/{ => fullstack-typescript}/skills/components/contract/contract-standards/SKILL.md` | +4 | -4 |
| `plugin/{ => fullstack-typescript}/skills/components/database/database-scaffolding/SKILL.md` | +10 | -10 |
| `plugin/{ => fullstack-typescript}/skills/components/database/database-standards/SKILL.md` | +9 | -9 |
| `plugin/fullstack-typescript/skills/components/e2e-testing/e2e-testing-scaffolding/SKILL.md` | +56 | -0 |
| `plugin/{skills/components/e2e-testing/e2e-testing => fullstack-typescript/skills/components/e2e-testing/e2e-testing-standards}/SKILL.md` | +2 | -2 |
| `plugin/{ => fullstack-typescript}/skills/components/frontend/frontend-scaffolding/SKILL.md` | +1 | -1 |
| `plugin/{ => fullstack-typescript}/skills/components/helm/helm-scaffolding/SKILL.md` | +5 | -5 |
| `plugin/{ => fullstack-typescript}/skills/components/helm/helm-standards/SKILL.md` | +4 | -4 |
| `plugin/fullstack-typescript/skills/components/integration-testing/integration-testing-scaffolding/SKILL.md` | +53 | -0 |
| `plugin/{skills/components/integration-testing/integration-testing => fullstack-typescript/skills/components/integration-testing/integration-testing-standards}/SKILL.md` | +2 | -2 |
| `plugin/fullstack-typescript/skills/help-content/SKILL.md` | +67 | -0 |
| `plugin/{ => fullstack-typescript}/skills/orchestrators/config-orchestration/SKILL.md` | +4 | -4 |
| `plugin/{ => fullstack-typescript}/skills/orchestrators/local-env-orchestration/SKILL.md` | +10 | -10 |
| `plugin/fullstack-typescript/skills/planning-standards/SKILL.md` | +113 | -0 |
| `plugin/fullstack-typescript/skills/scaffolding/SKILL.md` | +109 | -0 |
| `plugin/fullstack-typescript/skills/skills-router/SKILL.md` | +139 | -0 |
| `plugin/fullstack-typescript/skills/techpack-settings/SKILL.md` | +124 | -0 |
| `plugin/fullstack-typescript/system/.gitignore` | +5 | -0 |
| `plugin/fullstack-typescript/system/package.json` | +24 | -0 |
| `plugin/fullstack-typescript/system/src/cli.ts` | +158 | -0 |
| `plugin/{system/src/commands/env => fullstack-typescript/system/src/commands/local-env}/config.ts` | +6 | -2 |
| `plugin/{system/src/commands/env => fullstack-typescript/system/src/commands/local-env}/deploy.ts` | +6 | -2 |
| `plugin/{system/src/commands/env => fullstack-typescript/system/src/commands/local-env}/forward.ts` | +6 | -2 |
| `plugin/{system/src/commands/env => fullstack-typescript/system/src/commands/local-env}/undeploy.ts` | +6 | -2 |
| `plugin/fullstack-typescript/system/src/lib/args.ts` | +147 | -0 |
| `plugin/fullstack-typescript/system/src/lib/config.ts` | +117 | -0 |
| `plugin/fullstack-typescript/system/src/lib/fs.ts` | +151 | -0 |
| `plugin/fullstack-typescript/system/src/lib/index.ts` | +16 | -0 |
| `plugin/fullstack-typescript/system/src/lib/json-schema.ts` | +74 | -0 |
| `plugin/fullstack-typescript/system/src/lib/logger.ts` | +163 | -0 |
| `plugin/fullstack-typescript/system/src/lib/schema-validator.ts` | +287 | -0 |
| `plugin/fullstack-typescript/system/src/types/settings.ts` | +2 | -0 |
| `plugin/fullstack-typescript/system/system-run.sh` | +4 | -0 |
| `plugin/fullstack-typescript/system/tsconfig.json` | +30 | -0 |
| `plugin/fullstack-typescript/techpack.yaml` | +351 | -0 |
| `plugin/{skills/change-creation/templates => fullstack-typescript/templates/plans}/plan-feature.md` | +1 | -1 |
| `plugin/{skills/project-scaffolding/templates/project/CLAUDE.md => fullstack-typescript/templates/project/CLAUDE.md.tmpl}` | +4 | -4 |
| `plugin/{skills/project-scaffolding/templates/project/README.md => fullstack-typescript/templates/project/README.md.tmpl}` | +1 | -1 |
| `plugin/hooks/PERMISSIONS.md` | +0 | -195 |
| `plugin/hooks/hook-runner.sh` | +0 | -6 |
| `plugin/hooks/hooks.json` | +0 | -26 |
| `plugin/skills/component-discovery/SKILL.md` | +0 | -353 |
| `plugin/skills/project-settings/SKILL.md` | +0 | -320 |
| `plugin/skills/project-settings/schemas/sdd-settings.schema.json` | +0 | -321 |
| `plugin/skills/scaffolding/SKILL.md` | +0 | -218 |
| `plugin/skills/scaffolding/schemas/input.schema.json` | +0 | -50 |
| `plugin/skills/scaffolding/schemas/output.schema.json` | +0 | -30 |
| `plugin/skills/testing-standards/SKILL.md` | +0 | -409 |
| `plugin/system/README.md` | +0 | -96 |
| `plugin/system/src/commands/hook/index.ts` | +0 | -2 |
| `plugin/system/src/commands/hook/prompt-commit.ts` | +0 | -107 |
| `plugin/system/src/commands/hook/validate-write.ts` | +0 | -166 |
| `plugin/system/src/commands/scaffolding/project.ts` | +0 | -497 |
| `plugin/system/src/settings/defaults.ts` | +0 | -115 |
| `plugin/system/src/settings/index.ts` | +0 | -116 |
| `plugin/system/src/settings/schema.ts` | +0 | -438 |
| `plugin/system/src/settings/sync-helm.ts` | +0 | -312 |
| `plugin/system/src/settings/sync.ts` | +0 | -458 |
| `plugin/system/src/settings/validate.ts` | +0 | -422 |
| `plugin/system/src/types/config.ts` | +0 | -36 |
| `plugin/system/src/types/index.ts` | +0 | -18 |
| `plugin/system/src/types/settings.ts` | +0 | -330 |
| `plugin/system/system-run.sh` | +0 | -6 |
| `tests/src/lib/index.ts` | +3 | -1 |
| `tests/src/lib/paths.ts` | +3 | -1 |
| `tests/src/lib/process.ts` | +1 | -1 |
| `tests/src/tests/integration/database-component/scaffolding-integration.test.ts` | +28 | -25 |
| `tests/src/tests/integration/scaffolding/engine-integration.test.ts` | +23 | -21 |
| `tests/src/tests/unit/commands/archive/store.test.ts` | +1 | -1 |
| `tests/src/tests/unit/commands/config/diff.test.ts` | +1 | -1 |
| `tests/src/tests/unit/commands/config/generate.test.ts` | +1 | -1 |
| `tests/src/tests/unit/commands/config/validate.test.ts` | +1 | -1 |
| `tests/src/tests/unit/commands/permissions/configure.test.ts` | +1 | -1 |
| `tests/src/tests/unit/hooks/prompt-commit-after-write.test.ts` | +0 | -239 |
| `tests/src/tests/unit/lib/json-schema.test.ts` | +1 | -1 |
| `tests/src/tests/workflows/init.test.ts` | +6 | -6 |
