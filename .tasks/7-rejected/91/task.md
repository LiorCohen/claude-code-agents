---
id: 91
title: Fix agents standards violations from audit report
priority: high
status: rejected
created: 2026-02-07
rejected_reason: Obsolete
---

# Task 91: Fix agents standards violations from audit report

## Description

Fix all violations found in the agents standards audit (see `report.md` in this task folder). Key findings:

- `backend-dev` and `devops` reference `postgresql` inline but not in their `## Skills` section — formalize references
- `devops` missing `## Skills` and `## Working Directory` sections
- Consumer reference desync in `skills-standards` for `backend-dev` and `devops`
- Self-containment violations: `api-designer` (cross-agent knowledge), `db-advisor` (lists callers), `frontend-dev` (vague delegation)
- `reviewer` uses non-standard `## Sub-Reviews` section name

## Acceptance Criteria

- [ ] `backend-dev` lists `postgresql` in `## Skills` section
- [ ] `devops` has `## Skills` (with `postgresql`) and `## Working Directory` sections
- [ ] `skills-standards` Skill Consumers Reference matches actual agent-to-skill references
- [ ] `db-advisor` no longer lists its callers in `## Role`
- [ ] `api-designer` rephrases cross-agent reference to be self-contained
- [ ] `frontend-dev` vague delegation fixed
- [ ] `reviewer` agent delegation uses consistent pattern
- [ ] All agents pass the agents-standards checklist
