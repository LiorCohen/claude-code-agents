---
generated: 2026-02-14 19:44 UTC
branch: feature/task-138-separate-discovery-from-scaffolding
commits: 1
---

# Task #138 — Changes

**Files changed:** 28 (+795 / -801 lines)

| File | Added | Removed |
|------|------:|--------:|
| [`plugin/commands/sdd-change.md`](plugin/commands/sdd-change.md) | +5 | -13 |
| [`plugin/commands/sdd-init.md`](plugin/commands/sdd-init.md) | +2 | -2 |
| [`plugin/agents/devops.md`](plugin/agents/devops.md) | +2 | -0 |
| [`plugin/skills/planning/SKILL.md`](plugin/skills/planning/SKILL.md) | +20 | -8 |
| [`plugin/skills/scaffolding/SKILL.md`](plugin/skills/scaffolding/SKILL.md) | +5 | -74 |
| [`plugin/skills/component-discovery/SKILL.md`](plugin/skills/component-discovery/SKILL.md) | +3 | -3 |
| [`plugin/skills/component-discovery/schemas/output.schema.json`](plugin/skills/component-discovery/schemas/output.schema.json) | +1 | -12 |
| [`plugin/skills/change-creation/templates/spec-feature.md`](plugin/skills/change-creation/templates/spec-feature.md) | +5 | -5 |
| [`plugin/skills/change-creation/templates/spec-refactor.md`](plugin/skills/change-creation/templates/spec-refactor.md) | +14 | -0 |
| [`plugin/skills/spec-solicitation/resources/solicitation-steps.md`](plugin/skills/spec-solicitation/resources/solicitation-steps.md) | +2 | -0 |
| [`plugin/skills/spec-solicitation/resources/spec-sections.md`](plugin/skills/spec-solicitation/resources/spec-sections.md) | +2 | -1 |
| [`plugin/skills/project-scaffolding/SKILL.md`](plugin/skills/project-scaffolding/SKILL.md) | +1 | -1 |
| [`plugin/skills/project-settings/SKILL.md`](plugin/skills/project-settings/SKILL.md) | +2 | -2 |
| [`plugin/system/src/settings/reconcile.ts`](plugin/system/src/settings/reconcile.ts) | +0 | -9 |
| [`tests/src/tests/unit/settings/settings-reconcile.test.ts`](tests/src/tests/unit/settings/settings-reconcile.test.ts) | +0 | -5 |
| [`tests/src/tests/unit/skills/scaffolding-config.test.ts`](tests/src/tests/unit/skills/scaffolding-config.test.ts) | +1 | -12 |
| [`tests/src/tests/integration/database-component/scaffolding-integration.test.ts`](tests/src/tests/integration/database-component/scaffolding-integration.test.ts) | +0 | -2 |
| [`tests/src/tests/workflows/sdd-change-new.test.ts`](tests/src/tests/workflows/sdd-change-new.test.ts) | +2 | -2 |
| [`tests/src/tests/workflows/sdd-init.test.ts`](tests/src/tests/workflows/sdd-init.test.ts) | +2 | -2 |
| [`.claude/skills/typescript-standards/SKILL.md`](.claude/skills/typescript-standards/SKILL.md) | +57 | -646 |
| [`.claude/skills/typescript-standards/resources/advanced-types.md`](.claude/skills/typescript-standards/resources/advanced-types.md) | +137 | -0 |
| [`.claude/skills/typescript-standards/resources/banned-operations.md`](.claude/skills/typescript-standards/resources/banned-operations.md) | +76 | -0 |
| [`.claude/skills/typescript-standards/resources/error-handling.md`](.claude/skills/typescript-standards/resources/error-handling.md) | +128 | -0 |
| [`.claude/skills/typescript-standards/resources/immutability.md`](.claude/skills/typescript-standards/resources/immutability.md) | +91 | -0 |
| [`.claude/skills/typescript-standards/resources/module-system.md`](.claude/skills/typescript-standards/resources/module-system.md) | +213 | -0 |
| [`plugin/.claude-plugin/plugin.json`](plugin/.claude-plugin/plugin.json) | +1 | -1 |
| [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) | +1 | -1 |
| [`changelog/v6.md`](changelog/v6.md) | +22 | -0 |
