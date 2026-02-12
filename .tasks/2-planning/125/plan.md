---
title: Fix skills standards violations from audit report
created: 2026-02-12 19:00 UTC
---

# Plan: Fix skills standards violations from audit report

## Problem Summary

Re-audit on 2026-02-12 confirmed 30+ violations across 34 plugin skills: 18 vague cross-references (13 "refer to project-settings" across 12 skills + 5 other vague refs), 10 oversized skills (6,608 total lines, limit is 500 each), 1 circular dependency (apparent, not actual), and 1 code block missing a language specifier. All violations are in `plugin/skills/` markdown files — no TypeScript or runtime changes.

## Files to Modify

| File | Changes |
|------|---------|
| 12 skills with vague project-settings refs | Replace "refer to project-settings" with proper delegation contracts |
| `plugin/skills/component-discovery/SKILL.md` | Fix 2 vague refs (lines 206, 349) |
| `plugin/skills/spec-solicitation/SKILL.md` | Fix 2 vague refs (lines 500-501), extract to resources/ |
| `plugin/skills/spec-decomposition/SKILL.md` | Fix 1 vague ref (line 472), extract to resources/ |
| `plugin/skills/typescript-standards/SKILL.md` | Extract to resources/, fix code block at line 404 |
| `plugin/skills/workflow-state/SKILL.md` | Extract to resources/ |
| 6 other oversized skills | Extract to resources/ |
| 10 new `resources/` directories | Created under each oversized skill |
| ~42 new resource files | Extracted content from oversized skills |

## Changes

### Phase 1: Quick Fixes (P1 — low effort)

#### 1.1 Fix code block at typescript-standards:404

Add `text` language specifier to bare ` ``` ` block (directory tree).

#### 1.2 Fix 13 vague "refer to project-settings" refs

Replace each vague reference with a proper delegation contract describing what data flows in, what comes out, and where responsibility lies. Three delegation contract templates based on what each skill actually needs:

**Template A — Schema/settings references** (backend-scaffolding ×2, helm-scaffolding, config-scaffolding, helm-standards, commit-standards, planning, local-env, change-creation):

> Delegate to the `project-settings` skill for the authoritative component settings schema, defaults, and validation rules. It accepts a component type and returns the typed settings object (e.g., `server_type`, `databases`, `provides_contracts` for servers; `deploy_modes`, `ingress`, `assets` for helm charts).

Adapted per-skill to mention only the settings relevant to that skill.

**Template B — Directory mapping references** (contract-scaffolding, database-scaffolding, integration-testing, e2e-testing):

> Delegate to the `project-settings` skill for directory path resolution. It maps component type + name to a filesystem path (e.g., `type=database, name=app-db` → `components/databases/app-db/`).

**Template C — Validation reference** (component-discovery:206):

> Before returning, validate discovered configuration against the `project-settings` skill's cross-reference rules: databases referenced by servers must exist as database components, contracts must exist as contract components, helm `deploy_modes` must be valid for the server's `server_type`, and `deploys` must reference an existing server or webapp.

#### 1.3 Fix 5 other vague cross-references

| Skill:Line | Current | Replacement |
|------------|---------|-------------|
| spec-solicitation:500 | "`workflow-state` skill - for state management" | "Delegates to `workflow-state` for persistent state: reads item context via `get_context(change_id)`, saves generated SPEC.md via `save_spec(change_id, content)`, updates item status via `update_status(change_id, status)`." |
| spec-solicitation:501 | "`spec-writing` skill - for spec template and formatting" | Remove — spec-solicitation generates SPEC.md independently. Add note: "Validates output against SPEC.md section requirements documented in the `spec-writing` skill (not a runtime dependency)." |
| spec-decomposition:472 | "see `change-creation` skill with `type: epic`" | "The `requires_epic: true` flag signals that during implementation, the `change-creation` skill creates an epic structure: a parent `type: epic` change containing child `type: feature` changes in a `changes/` subdirectory." |
| component-discovery:206 | "validate the discovered configuration against the rules defined in the `project-settings` skill" | Use Template C from section 1.2 above (specific validation contract) |
| component-discovery:349 | "The output is used by `spec-writing` skill to populate Components section" | "Component list is stored in context.md. During spec solicitation, the `spec-solicitation` skill populates the Components section of SPEC.md using discovered components and solicited technical details." |

#### 1.4 Resolve circular dependency (workflow-state ↔ spec-solicitation)

Research confirms **no actual circular dependency** — the relationship is unidirectional (workflow-state is a state store, spec-solicitation is a consumer). The apparent circularity comes from vague documentation in both skills. Fixing the vague refs in 1.3 above resolves this — no structural changes needed.

Specifically:
- workflow-state:753 already has a clear delegation contract ("spec-solicitation skill — reads context, saves specs") — no change needed
- spec-solicitation:500-501 fixed in 1.3 above clarifies the unidirectional dependency

### Phase 2: Size Reductions (P2/P3 — medium effort)

Extract content from 10 oversized skills into `resources/` subdirectories. Each skill keeps a `## Resource Files` section with links per the skills-standards pattern.

#### 2.1 typescript-standards (1,055 → ~350 lines)

Extract 5 resource files:
- `resources/module-system.md` — Named exports, ES modules, index.ts, path aliases (~196 lines)
- `resources/immutability.md` — Readonly types, spread operators, functional alternatives (~145 lines)
- `resources/banned-operations.md` — Complete mutable method reference tables (~77 lines)
- `resources/error-handling.md` — Result unions, error narrowing, external data validation (~96 lines)
- `resources/advanced-types.md` — Generics, discriminated unions, type guards, indexed access (~100 lines)

SKILL.md retains: frontmatter, purpose, quick reference checklist, core rules (one-liners), and Resource Files links.

#### 2.2 workflow-state (764 → ~250 lines)

Extract 3 resource files:
- `resources/internal-api.md` — All 15 operations with input/output schemas (~340 lines)
- `resources/workflow-yaml-schema.md` — Full schema documentation with all fields (~110 lines)
- `resources/recovery.md` — Checkpoint triggers, recovery scenarios, regression handling (~60 lines)

SKILL.md retains: purpose, directory structure, phase gating rules, status progression, consumers, Resource Files links.

#### 2.3 spec-decomposition (639 → ~200 lines)

Extract 3 resource files:
- `resources/outline-modes.md` — Outline, section, hierarchical mode documentation with examples (~120 lines)
- `resources/decomposition-algorithm.md` — 5-phase algorithm, formulas, heuristics (~200 lines)
- `resources/data-structures.md` — DecomposedChange, DecompositionResult schemas, special cases (~100 lines)

#### 2.4 e2e-testing (619 → ~150 lines)

Extract 4 resource files:
- `resources/page-objects.md` — Page Object Model examples (~127 lines)
- `resources/test-patterns.md` — Basic tests, API setup, async operations (~125 lines)
- `resources/fixtures-helpers.md` — Test data fixtures, API helpers, auth helpers (~77 lines)
- `resources/testkube.md` — Testkube YAML configuration (~65 lines)

#### 2.5 spec-writing (595 → ~150 lines)

Extract 4 resource files:
- `resources/feature-spec-template.md` — Complete feature spec template (~212 lines)
- `resources/epic-spec-template.md` — Epic structure with child changes (~119 lines)
- `resources/other-templates.md` — Domain definition + product spec templates (~92 lines)
- `resources/frontmatter-validation.md` — Frontmatter fields + validation rules (~128 lines)

#### 2.6 external-spec-integration (559 → ~180 lines)

Extract 2 resource files:
- `resources/workflow-steps.md` — Detailed steps 1-10 with YAML examples (~350 lines)
- `resources/transformation.md` — Classification, gap analysis, clarification process (~80 lines)

#### 2.7 postgresql (555 → ~200 lines)

Extract 4 resource files:
- `resources/deployment.md` — Docker, Docker Compose, Kubernetes setups (~70 lines)
- `resources/schema-management.md` — Tables, indexes, migrations (~90 lines)
- `resources/monitoring.md` — System views, performance analysis (~95 lines)
- `resources/administration.md` — Permissions, backup, import/export (~80 lines)

#### 2.8 frontend-standards (553 → ~180 lines)

Extract 3 resource files:
- `resources/tanstack.md` — Router, Query, Table, Form patterns (~100 lines)
- `resources/mvvm-patterns.md` — Model, ViewModel, View with Zustand examples (~120 lines)
- `resources/tailwind.md` — Utility classes, responsive, dark mode, clsx (~68 lines)

#### 2.9 integration-testing (553 → ~150 lines)

Extract 4 resource files:
- `resources/database-strategies.md` — Transaction rollback, truncate, cleanup (~88 lines)
- `resources/api-testing.md` — HTTP client, test patterns, examples (~110 lines)
- `resources/authentication.md` — Login helpers, protected endpoint tests (~75 lines)
- `resources/testkube.md` — Test definition YAML, suites, running tests (~77 lines)

#### 2.10 spec-solicitation (515 → ~120 lines)

Extract 3 resource files:
- `resources/workflow-yaml.md` — solicitation-workflow.yaml schema (~115 lines)
- `resources/solicitation-steps.md` — All 9 steps with question guidance (~185 lines)
- `resources/spec-sections.md` — Required sections, structure, examples (~80 lines)

## Dependencies

Phase 1 has no dependencies — all quick text fixes.

Phase 2 items are independent of each other (each skill is modified in isolation). Can be done in any order, but prioritized by severity:
1. typescript-standards (2.1× over limit — most severe)
2. workflow-state (1.5× over)
3. spec-decomposition, e2e-testing, spec-writing (1.2-1.3× over)
4. Remaining 5 skills (1.1× over)

## Tests

### Verification Script

- [ ] `wc -l plugin/skills/*/SKILL.md plugin/skills/components/*/*/SKILL.md plugin/skills/components/*/*/*/SKILL.md` — all ≤500 lines
- [ ] `grep -rn "refer to.*project-settings" plugin/skills/` — 0 matches for vague pattern
- [ ] `grep -rn "for state management\|for spec template" plugin/skills/spec-solicitation/` — 0 matches
- [ ] All resource files exist and are ≤500 lines each
- [ ] No bare ` ``` ` blocks without language specifier in typescript-standards

### Re-Audit

- [ ] Run full skills-standards audit — all 7 categories must pass (0 failing)

## Verification

- [ ] All 13 vague "refer to project-settings" instances replaced with proper delegation contracts
- [ ] 5 other vague cross-references fixed with clear delegation contracts
- [ ] Circular dependency resolved (documentation clarified — no structural change needed)
- [ ] Code block at typescript-standards:404 has `text` language specifier
- [ ] All 10 previously oversized skills reduced to ≤500 lines
- [ ] All resource files under 500 lines each
- [ ] Re-audit passes with 0 failing categories
