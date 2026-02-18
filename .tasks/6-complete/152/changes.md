---
generated: 2026-02-18 17:35 UTC
branch: feature/task-152-workflow-names
commits: 1
---

# Task #152 — Changes

**Files changed:** 33 (+248 / -171 lines)

| File | Added | Removed |
|------|------:|--------:|
| [`plugin/system/src/types/workflow.ts`](plugin/system/src/types/workflow.ts) | +1 | -0 |
| [`plugin/skills/workflow-state/SKILL.md`](plugin/skills/workflow-state/SKILL.md) | +10 | -10 |
| [`plugin/skills/workflow-state/resources/internal-api.md`](plugin/skills/workflow-state/resources/internal-api.md) | +90 | -55 |
| [`plugin/skills/workflow-state/resources/workflow-yaml-schema.md`](plugin/skills/workflow-state/resources/workflow-yaml-schema.md) | +6 | -5 |
| [`plugin/skills/workflow-state/resources/recovery.md`](plugin/skills/workflow-state/resources/recovery.md) | +3 | -3 |
| [`plugin/skills/workflow-state/schemas/input.schema.json`](plugin/skills/workflow-state/schemas/input.schema.json) | +6 | -1 |
| [`plugin/skills/workflow-state/schemas/output.schema.json`](plugin/skills/workflow-state/schemas/output.schema.json) | +4 | -0 |
| [`plugin/skills/change-creation/SKILL.md`](plugin/skills/change-creation/SKILL.md) | +2 | -2 |
| [`plugin/skills/change-creation/schemas/input.schema.json`](plugin/skills/change-creation/schemas/input.schema.json) | +2 | -2 |
| [`plugin/skills/planning/SKILL.md`](plugin/skills/planning/SKILL.md) | +1 | -1 |
| [`plugin/skills/planning/schemas/input.schema.json`](plugin/skills/planning/schemas/input.schema.json) | +2 | -2 |
| [`plugin/skills/spec-solicitation/SKILL.md`](plugin/skills/spec-solicitation/SKILL.md) | +4 | -4 |
| [`plugin/skills/spec-solicitation/schemas/input.schema.json`](plugin/skills/spec-solicitation/schemas/input.schema.json) | +2 | -2 |
| [`plugin/skills/external-spec-integration/SKILL.md`](plugin/skills/external-spec-integration/SKILL.md) | +1 | -1 |
| [`plugin/skills/external-spec-integration/resources/workflow-steps.md`](plugin/skills/external-spec-integration/resources/workflow-steps.md) | +1 | -1 |
| [`plugin/skills/external-spec-integration/schemas/input.schema.json`](plugin/skills/external-spec-integration/schemas/input.schema.json) | +1 | -1 |
| [`plugin/skills/external-spec-integration/schemas/output.schema.json`](plugin/skills/external-spec-integration/schemas/output.schema.json) | +2 | -2 |
| [`plugin/skills/spec-writing/resources/frontmatter-validation.md`](plugin/skills/spec-writing/resources/frontmatter-validation.md) | +1 | -1 |
| [`plugin/skills/orchestrators/change-orchestration/SKILL.md`](plugin/skills/orchestrators/change-orchestration/SKILL.md) | +1 | -1 |
| [`plugin/skills/orchestrators/change-orchestration/creation.md`](plugin/skills/orchestrators/change-orchestration/creation.md) | +28 | -19 |
| [`plugin/skills/orchestrators/change-orchestration/management.md`](plugin/skills/orchestrators/change-orchestration/management.md) | +24 | -24 |
| [`plugin/skills/orchestrators/change-orchestration/spec-review.md`](plugin/skills/orchestrators/change-orchestration/spec-review.md) | +3 | -3 |
| [`plugin/skills/orchestrators/change-orchestration/planning.md`](plugin/skills/orchestrators/change-orchestration/planning.md) | +6 | -6 |
| [`plugin/skills/orchestrators/change-orchestration/implementation.md`](plugin/skills/orchestrators/change-orchestration/implementation.md) | +3 | -3 |
| [`plugin/skills/orchestrators/change-orchestration/verification.md`](plugin/skills/orchestrators/change-orchestration/verification.md) | +9 | -8 |
| [`plugin/skills/orchestrators/init-orchestration/SKILL.md`](plugin/skills/orchestrators/init-orchestration/SKILL.md) | +3 | -2 |
| [`plugin/commands/sdd.md`](plugin/commands/sdd.md) | +7 | -6 |
| [`plugin/commands/sdd-run.md`](plugin/commands/sdd-run.md) | +1 | -1 |
| [`plugin/commands/sdd-help.md`](plugin/commands/sdd-help.md) | +1 | -1 |
| [`plugin/system/src/commands/workflow/check-gate.ts`](plugin/system/src/commands/workflow/check-gate.ts) | +2 | -2 |
| [`plugin/.claude-plugin/plugin.json`](plugin/.claude-plugin/plugin.json) | +1 | -1 |
| [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) | +1 | -1 |
| [`changelog/v7.md`](changelog/v7.md) | +19 | -0 |
