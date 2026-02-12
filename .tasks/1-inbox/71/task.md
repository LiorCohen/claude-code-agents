---
id: 71
title: Anti-stop hook to prevent accidental session termination
priority: medium
status: inbox
created: 2026-02-01 21:14 UTC
depends_on: []
blocks: []
---

# Task 71: Anti-stop hook to prevent accidental session termination

## Problem

Users can accidentally terminate a Claude Code session (Ctrl+C, closing terminal, etc.) while work is in progress. This can result in:

- Lost uncommitted changes
- Incomplete operations left in broken state
- No warning that work will be lost

## Proposed Solution

Create a hook that detects when the session is about to be terminated and either:
- Warns the user if there are uncommitted changes
- Blocks termination until confirmation
- Auto-checkpoints before allowing termination (ties into #70)

## Implementation Ideas

### Option A: Pre-stop warning hook
- Detect termination signal (SIGINT, SIGTERM)
- Check for uncommitted changes via `git status`
- Prompt user to confirm or checkpoint first

### Option B: Integrate with checkpoint workflow
- If #70 is implemented, auto-checkpoint on termination attempt
- User can always recover from last checkpoint

### Option C: Session state tracking
- Track whether Claude is mid-operation
- Only warn/block if actively working on something

## Acceptance Criteria

- [ ] Hook triggers on session termination attempt
- [ ] Warns user if uncommitted changes exist
- [ ] Provides option to checkpoint before terminating
- [ ] Can be bypassed with force-quit if needed
- [ ] Doesn't interfere with normal workflow when no changes present
