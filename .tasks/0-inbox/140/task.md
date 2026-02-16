---
id: 140
title: Template-to-code drift detection for scaffolded components
priority: high
status: inbox
created: 2026-02-14 17:30 UTC
depends_on: []
blocks: []
---

# Task 140: Template-to-code drift detection for scaffolded components

## Description

When scaffolding templates evolve between plugin versions, existing components scaffolded under older versions have no way to know they're missing newer files or structure. There is currently no mechanism to detect when a project's scaffolded components are out of date relative to the current plugin's templates.

This is distinct from #35 (spec-to-code drift) — #35 is about whether code matches its spec. This task is about whether a scaffolded component matches the current template that would be used to scaffold it today.

### Example

Plugin v6.1 scaffolds a backend component with `src/`, `tests/`, and `tsconfig.json`. Plugin v6.2 adds a `src/middleware/` directory and an `eslint.config.js` to the backend template. A project scaffolded under v6.1 has no way to know these files are missing.

### Why this matters

- Without detection, projects silently accumulate structural debt as the plugin evolves
- Users don't know their components are missing files until something breaks
- There's no migration system for scaffolding templates — detection is the first step toward one

## Acceptance Criteria

- [ ] Mechanism to compare a project's scaffolded components against current plugin templates
- [ ] Report showing which components are out of date and what's missing
- [ ] Does not overwrite or modify existing files — detection only
- [ ] Integrates with `sdd-run` or a dedicated command (e.g., `sdd-check-drift`)
- [ ] Works independently of spec-to-code drift (#35)
