---
id: 125
title: Fix skills standards violations from audit report
priority: high
status: inbox
created: 2026-02-12 12:00 UTC
depends_on: []
blocks: []
---

# Task 125: Fix skills standards violations from audit report

## Description

Fix all violations identified in the 2026-02-12 skills standards audit. Full audit report: [skills-audit-2026-02-12_12-00.md](skills-audit-2026-02-12_12-00.md).

### Key Findings

- **14 skills** with vague "refer to the `project-settings` skill" cross-references (16 instances) — need proper delegation contracts
- **10 skills** exceeding 500-line size limit (typescript-standards at 2.1x is most severe)
- **1 circular dependency** between workflow-state and spec-solicitation
- **1 code block** missing language specifier in typescript-standards
- **7 skills** scored High drift risk (6+)

## Acceptance Criteria

- [ ] All 16 vague "refer to project-settings" instances replaced with proper delegation contracts
- [ ] 3 other vague cross-references fixed (spec-solicitation, spec-decomposition, component-discovery)
- [ ] typescript-standards split or reduced to ≤500 lines
- [ ] workflow-state split or reduced to ≤500 lines
- [ ] Remaining 8 oversized skills reduced to ≤500 lines each
- [ ] Circular dependency between workflow-state and spec-solicitation resolved
- [ ] Code block at typescript-standards:404 given `text` language specifier
- [ ] Re-audit passes with 0 failing categories
