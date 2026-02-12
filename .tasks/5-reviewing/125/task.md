---
id: 125
title: Fix skills standards violations from audit report
priority: high
status: reviewing
created: 2026-02-12 12:00 UTC
depends_on: []
blocks: []
---

# Task 125: Fix skills standards violations from audit report

## Description

Fix all violations identified in the skills standards audits. Re-audit on 2026-02-12_18-30 confirmed all violations from the original audit remain unfixed.

Audit reports:
- [skills-audit-2026-02-12_18-30.md](skills-audit-2026-02-12_18-30.md) (latest — re-audit)
- [skills-audit-2026-02-12_12-00.md](skills-audit-2026-02-12_12-00.md) (original)

### Key Findings

- **14 vague "refer to project-settings"** cross-references across 12 skills (backend-scaffolding ×2) plus 1 vague project-settings ref in component-discovery — need proper delegation contracts
- **4 other vague cross-references** in spec-solicitation (×2), spec-decomposition (×1), component-discovery (×1)
- **10 skills** exceeding 500-line size limit (typescript-standards at 2.1× is most severe)
- **1 circular dependency** between workflow-state and spec-solicitation
- **1 code block** missing language specifier in typescript-standards:404
- **8 skills** scored High drift risk (6+), **13 Moderate** (3–5)

## Acceptance Criteria

- [ ] All 14 vague "refer to project-settings" instances replaced with proper delegation contracts (12 skills: backend-scaffolding ×2, helm-scaffolding, config-scaffolding, contract-scaffolding, database-scaffolding, helm-standards, commit-standards, planning, local-env, change-creation, integration-testing, e2e-testing; plus component-discovery:206)
- [ ] 4 other vague cross-references fixed (spec-solicitation:500, spec-solicitation:501, spec-decomposition:472, component-discovery:349)
- [ ] typescript-standards split or reduced to ≤500 lines (currently 1,055)
- [ ] workflow-state split or reduced to ≤500 lines (currently 764)
- [ ] Remaining 8 oversized skills reduced to ≤500 lines each (spec-decomposition 639, e2e-testing 619, spec-writing 595, external-spec-integration 559, postgresql 555, frontend-standards 553, integration-testing 553, spec-solicitation 515)
- [ ] Circular dependency between workflow-state and spec-solicitation resolved
- [ ] Code block at typescript-standards:404 given `text` language specifier
- [ ] Re-audit passes with 0 failing categories
