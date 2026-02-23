# Recovery and Checkpoints

## Checkpoint Triggers

Checkpoints are created automatically on workflow state changes:

| Event | Commit Message | Files Committed |
|-------|----------------|-----------------|
| Workflow created | `checkpoint: workflow <id> (<name>) created` | `workflow.yaml` |
| Spec solicitation progress | `checkpoint: <change-id> solicitation progress` | `solicitation-workflow.yaml` |
| SPEC.md created | `checkpoint: <change-id> spec created` | `SPEC.md`, `workflow.yaml` |
| SPEC.md approved | `checkpoint: <change-id> spec approved` | `workflow.yaml` |
| All specs approved | `checkpoint: all specs approved, ready for planning` | `workflow.yaml` |
| PLAN.md created | `checkpoint: <change-id> plan created` | `PLAN.md`, `workflow.yaml` |
| PLAN.md approved | `checkpoint: <change-id> plan approved` | `workflow.yaml` |
| All plans approved | `checkpoint: all plans approved, ready for implementation` | `workflow.yaml` |
| Item moved to changes/ | `checkpoint: <change-id> ready for review` | All files, `workflow.yaml` |
| Implementation progress | `checkpoint: <change-id> implementation progress` | Changed files |
| Implementation complete | `checkpoint: <change-id> implementation complete` | Changed files, `workflow.yaml` |
| Review approved | `checkpoint: <change-id> review approved` | `workflow.yaml` |
| Item complete | `checkpoint: <change-id> complete` | `workflow.yaml` |
| Regression | `checkpoint: <change-id> regressed to <phase>` | `workflow.yaml`, archived files |
| Decomposition revised | `checkpoint: decomposition revised (<type>)` | `workflow.yaml`, archived files |

## Regression Transitions

| From | To | Trigger | Effect |
|------|-----|---------|--------|
| plan | spec | `/sdd I want to go back to the spec phase` | Plan invalidated, spec needs revision |
| impl | plan | `/sdd I want to go back to the plan phase` | Impl discarded, plan invalidated |
| impl | spec | `/sdd I want to go back to the spec phase` | Impl discarded, plan invalidated, spec needs revision |
| review | impl | `/sdd I want to request changes` | Implementation needs changes |
| review | spec | `/sdd I want to go back to the spec phase` | Major revision needed |

Regression archives discarded work to `sdd/archive/workflow-regressions/`.

## Regression Archive Structure

When work is archived during regression:

```yaml
# sdd/archive/workflow-regressions/20260205-1430-user-auth-1-impl/metadata.yaml
change_id: user-auth-1
from_phase: implement
to_phase: spec
reason: "Need to add additional auth method"
timestamp: 2026-02-05T14:30:00Z
git_branch: feature/task-85-external-spec
git_commit: abc123def  # Last commit before regression
files_archived:
  - src/auth/login.ts
  - src/auth/session.ts
  - tests/auth/login.test.ts
```

## Recovery Scenarios

| Scenario | Recovery |
|----------|----------|
| Session interrupted mid-solicitation | Resume from `solicitation-workflow.yaml`, last checkpoint has partial progress |
| Context compacted during implementation | Resume from `workflow.yaml`, implementation files in last checkpoint |
| Crash during spec creation | `SPEC.md` or `solicitation-workflow.yaml` in last checkpoint |
| Power loss | Git reflog + checkpoints ensure < 1 question of lost work |
