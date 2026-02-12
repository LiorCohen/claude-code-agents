---
id: 67
title: Store user instructions in plans, specs, and .sdd/
priority: high
status: planning
created: 2026-02-01 13:40 UTC
depends_on: []
blocks: []
---

# Task 67: Store user instructions in plans, specs, and .sdd/

## Description

Always store user instructions and feedback in persistent locations so they can be preserved and referenced across sessions. This includes:

1. **Plans** - Store user feedback and instructions within the relevant plan files
2. **Specs** - Include user requirements and constraints in component specs
3. **Globally in .sdd/** - Store project-wide user instructions in the .sdd/ directory for cross-cutting concerns

This creates a feedback loop where user guidance is captured, preserved, and automatically referenced in future work.

## Rationale

- User feedback is valuable and should not be lost between sessions
- Persistent instructions ensure consistency across different implementations
- The .sdd/ directory serves as the central configuration hub for project-wide settings
- Plans and specs are the natural homes for context-specific instructions

## Acceptance Criteria

- [ ] Define where in .sdd/ global user instructions should be stored (e.g., .sdd/instructions.md or similar)
- [ ] Update planning workflow to capture user feedback in plan files
- [ ] Update spec generation to include user requirements and constraints
- [ ] Skills should read and respect stored instructions
- [ ] Document the instruction storage conventions
