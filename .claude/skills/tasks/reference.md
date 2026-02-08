# Task Management Reference

Best practices, conventions, and lifecycle documentation.

---

## Task Numbering

- Task numbers are permanent identifiers (never reused)
- Find highest number across ALL subdirs, increment by 1
- Numbers may have gaps (merges, deletions)
- Reference as `#N` or `task N`

---

## Best Practices

1. **Commit every transition** - Every state change (add, plan, ready, implement, review, complete, reject, consolidate, prioritize) must be committed immediately. Never leave task changes uncommitted. Use the commit skill with `-m` flag and the `Tasks:` prefix (e.g., `Skill(commit, args: '-m "Tasks: Move #19 to planning"')`). The commit skill ensures proper Co-Authored-By attribution
2. **Verify clean state after every command** - After every `/tasks` command completes, run `git status` to confirm no uncommitted changes remain in `.tasks/`. If any exist, stage and commit them before returning to the user
3. **Inbox first** - New tasks go to inbox, prioritize later
4. **Keep atomic** - One clear outcome per task
5. **Worktree per task** - `/tasks implement` creates a worktree at `.worktrees/task-<id>/`, keeping main clean
6. **Never lose work** - Before removing a worktree, always verify all commits are merged and no uncommitted changes exist
7. **Only `/tasks complete` cleans up** - Never merge the feature branch or delete the worktree during implementation or reviewing phases. Only `/tasks complete` may merge, remove the worktree, and delete the branch
8. **Consolidate related** - Don't duplicate effort
9. **Preserve on consolidate** - Never lose original task content when consolidating
10. **Update both** - Task folder AND INDEX.md must stay in sync
11. **Add context** - When completing, summarize what was done
12. **Date everything** - Completion dates help track velocity

---

## Lifecycles

### Task Lifecycle

```
                  1-inbox/ (open tasks)
                           ↓
                     [/tasks plan]
                           ↓
                     2-planning/
                           ↓
                    [/tasks ready]
                           ↓
                      3-ready/
                           ↓
                  [/tasks implement]
                           ↓
                   4-implementing/
                           ↓
                   [/tasks review]
                           ↓
                    5-reviewing/
                           ↓
                   [/tasks complete]
                           ↓
                     6-complete/

Any status → 8-consolidated/ (if combined with another)
Any status → 7-rejected/ (if irrelevant or out of scope)
```

**Priority** (high/medium/low) can be set at any point and only affects INDEX.md grouping.

Plans are created during the planning phase and move with their task folder through the lifecycle.
