---
id: 141
title: Remove 'implement' from critic auto-triggers
priority: null
status: inbox
created: 2026-02-14 18:00 UTC
depends_on: []
blocks: []
---

# Task 141: Remove 'implement' from critic auto-triggers

## Description

The critic skill auto-fires during `/tasks implement` via keyword and pattern triggers in `skill-rules.yaml`, but at that point no implementation work exists to review. The critic's Phase 5 (Starting Implementation) checks pass trivially because the branch was just created and no code has changed.

The critic should only auto-trigger on phases where work has been done: `plan`, `plan-review`, `review`, and `complete`. For implementation, the user or workflow can manually invoke `/critic` at a meaningful checkpoint.

## Changes Required

1. Remove `implement` from the critic's `triggers.keywords` in `skill-rules.yaml`
2. Remove the `/tasks implement` match from the critic's `triggers.patterns` regex
3. Remove the "Critic check" instruction from the `/tasks implement` section in the tasks skill SKILL.md

## Acceptance Criteria

- [ ] `/tasks implement` no longer auto-triggers the critic skill
- [ ] Critic still auto-triggers on `plan`, `plan-review`, `review`, and `complete`
- [ ] Tasks skill SKILL.md no longer instructs critic invocation after branch creation
