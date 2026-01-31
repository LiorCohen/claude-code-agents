---
id: 66
title: Single context-aware SDD command
status: open
created: 2026-01-31
depends_on: []
blocks: []
---

# Task 66: Single context-aware SDD command

## Description

Move to a single SDD command that understands from context what is to be done. This unified command will replace all existing SDD commands by intelligently inferring the user's intent based on:

- Current working directory and file context
- Project state (initialized, specs present, components defined, etc.)
- Recent changes and git status
- User's natural language input

Instead of requiring users to remember specific commands like `/sdd-init`, `/sdd-new-change`, `/sdd-implement`, etc., a single `/sdd` command would analyze context and determine the appropriate action.

## Design Notes

### Command Structure

- **Default (no args)**: Infers action from current project state and session context
- **Namespaced commands**: Explicit "hard" commands available when needed (e.g., `/sdd init`, `/sdd change`, `/sdd implement`)
- Namespaces provide escape hatch for explicit control while default mode handles common workflows

### State Management

- **State file**: `.sdd/state.yaml` (or similar) serves as the command's memory
- Tracks: current workflow phase, pending changes, last action, session context
- Enables continuity across sessions and smarter context inference
- State file may be committed (shared team context) or git-ignored (local) depending on use case

## Acceptance Criteria

- [ ] Single `/sdd` command entry point that handles all SDD workflows
- [ ] Namespaced subcommands for explicit control (`/sdd init`, `/sdd change`, etc.)
- [ ] Default mode (no args) infers action from project state and session context
- [ ] State file in `.sdd/` directory for workflow memory and session continuity
- [ ] Context detection for project state (new project, existing project, mid-implementation)
- [ ] Intent inference from natural language descriptions
- [ ] Graceful fallback to asking clarifying questions when intent is ambiguous
- [ ] Maintains all functionality of existing commands
- [ ] Clear feedback to user about what action is being taken
- [ ] Documentation for the unified command
