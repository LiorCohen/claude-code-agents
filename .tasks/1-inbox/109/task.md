---
id: 109
title: Ban Claude's built-in memory - causes non-deterministic behavior
priority: high
status: open
created: 2026-02-08
depends_on: []
blocks: []
---

# Task 109: Ban Claude's built-in memory - causes non-deterministic behavior

## Description

Claude's built-in memory feature should never be used to store project information, configuration, or any state. This creates serious problems:

**Out-of-band state issues:**
- Hard to debug (invisible to normal inspection)
- Non-deterministic behavior (works for some users but not others)
- Not version controlled (can't track changes or revert)
- Not visible to collaborators (breaks team workflows)
- Creates implicit dependencies that aren't documented

**The problem:** When Claude uses its built-in memory to "remember" things about the project, it creates scenarios where:
- A feature works for User A (who has the memory) but fails for User B (who doesn't)
- Debugging becomes impossible because the state isn't visible in the codebase
- Collaboration breaks because team members have different implicit contexts

## Acceptance Criteria

- [ ] Add explicit rule to relevant standards skills (commands, skills, agents) banning use of Claude's built-in memory
- [ ] All project knowledge must be stored in explicit, version-controlled locations:
  - CLAUDE.md for project-level instructions
  - Skills, agents, and commands for reusable workflows
  - .sdd/ directory for project-specific state
  - sdd-settings.yaml for configuration
  - Plans and specs for implementation context
- [ ] Update documentation to explain why built-in memory is forbidden
- [ ] Audit existing skills/agents/commands to ensure they don't rely on or encourage memory usage
