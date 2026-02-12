---
id: 70
title: Git checkpoint workflow for AI-assisted development
priority: medium
status: inbox
created: 2026-02-01
depends_on: []
blocks: []
---

# Task 70: Git checkpoint workflow for AI-assisted development

## Problem

When working with AI assistants, uncommitted changes from earlier prompts can be destroyed by subsequent prompts. There's no safety net for recovering work when a prompt causes destructive changes.

**Scenario:**
1. Prompt 1 produces good changes (uncommitted)
2. Prompt 2 accidentally overwrites/destroys those changes
3. No way to recover

## Proposed Solution

Introduce a checkpoint workflow that creates lightweight "save points" during AI-assisted development sessions. These checkpoints:

- Are quick WIP commits (safety nets, not history)
- Can be squashed/discarded before the final "proper" commit
- Protect against destructive prompts
- Don't pollute the changelog

## Implementation Ideas

### Option A: `/checkpoint` skill
- Quick `git add -A && git commit -m "wip"` (or auto-incrementing message)
- User manually runs when they want to save progress

### Option B: Auto-checkpoint hook
- Automatically checkpoint before each prompt
- More protection, but noisier git history

### Option C: Integrate with `/commit`
- `/commit` detects previous WIP commits and offers to squash them
- Clean workflow: checkpoint → checkpoint → checkpoint → proper commit

## Acceptance Criteria

- [ ] Checkpoint mechanism creates quick commits without changelog overhead
- [ ] Easy way to squash/discard checkpoints before final commit
- [ ] Works within existing `/commit` skill workflow
- [ ] Clear naming convention for WIP commits (easily identifiable)
- [ ] Documentation on when/how to use checkpoints
