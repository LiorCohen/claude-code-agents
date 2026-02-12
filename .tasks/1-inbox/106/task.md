---
id: 106
title: Add dependency approval rule to standards - never introduce new libs/tech without explicit user approval
status: inbox
created: 2026-02-08
depends_on: []
blocks: []
---

# Task 106: Add dependency approval rule to standards - never introduce new libs/tech without explicit user approval

## Description

Add a mandatory rule to the appropriate standards skill(s) that prohibits introducing new libraries or technologies (frontend or backend) without explicit user approval. This prevents situations like the Knex introduction where dependencies were added without user consent.

The rule should be clear, enforceable, and positioned prominently in the relevant standards.

## Acceptance Criteria

- [ ] Rule added to appropriate standards skill (likely typescript-standards or plugin-product-standards)
- [ ] Rule clearly states: no new libraries or technologies without explicit user approval
- [ ] Rule includes examples of what requires approval (e.g., Knex, new npm packages, new build tools)
- [ ] Rule positioned prominently so it's not overlooked
- [ ] Commit follows repository standards
