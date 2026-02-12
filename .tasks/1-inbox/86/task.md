---
id: 86
title: Consider component-catalog skill for component type definitions
priority: medium
status: inbox
created: 2026-02-05
depends_on: [85]
blocks: []
---

# Task 86: Consider component-catalog skill for component type definitions

## Description

After implementing Task #85's component-discovery skill, evaluate whether a separate `component-catalog` skill would add value for managing component type definitions.

### Potential Benefits

A `component-catalog` skill could:
- Provide a single source of truth for component type definitions
- Define discovery questions per component type (currently embedded in component-discovery)
- Maintain component templates and standards
- Enable extensibility - add new component types without modifying discovery logic
- Track what components exist in a project

### Current Approach (from #85)

- Component types are implicitly defined (server, webapp, database, contract, helm)
- Discovery questions are embedded in `component-discovery` skill
- Component metadata is scattered across skills

### When This Would Be Valuable

- If we frequently add/modify component types
- If discovery questions become too large to maintain inline
- If multiple skills need component type metadata

### When This Would Be Excessive

- If component types rarely change
- If discovery questions are tightly coupled to discovery logic anyway
- If it adds indirection without clear benefit

## Acceptance Criteria

- [ ] Evaluate component-discovery implementation from #85
- [ ] Assess frequency of component type changes
- [ ] Determine if separation of concerns justifies new skill
- [ ] If yes: design component-catalog skill interface
- [ ] If no: document decision and close task
