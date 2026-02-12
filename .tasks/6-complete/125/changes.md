---
generated: 2026-02-12 21:45 UTC
branch: feature/task-125-fix-skills-standards-violations
commits: 2
---

# Task #125 — Changes

**Files changed:** 56 (+4,818 / -4,744 lines)

| File | Added | Removed |
|------|------:|--------:|
| [`plugin/skills/change-creation/SKILL.md`](plugin/skills/change-creation/SKILL.md) | +1 | -1 |
| [`plugin/skills/commit-standards/SKILL.md`](plugin/skills/commit-standards/SKILL.md) | +1 | -1 |
| [`plugin/skills/component-discovery/SKILL.md`](plugin/skills/component-discovery/SKILL.md) | +2 | -2 |
| [`plugin/skills/local-env/SKILL.md`](plugin/skills/local-env/SKILL.md) | +1 | -1 |
| [`plugin/skills/planning/SKILL.md`](plugin/skills/planning/SKILL.md) | +1 | -1 |
| [`plugin/skills/components/backend/backend-scaffolding/SKILL.md`](plugin/skills/components/backend/backend-scaffolding/SKILL.md) | +2 | -2 |
| [`plugin/skills/components/config/config-scaffolding/SKILL.md`](plugin/skills/components/config/config-scaffolding/SKILL.md) | +1 | -1 |
| [`plugin/skills/components/contract/contract-scaffolding/SKILL.md`](plugin/skills/components/contract/contract-scaffolding/SKILL.md) | +1 | -1 |
| [`plugin/skills/components/database/database-scaffolding/SKILL.md`](plugin/skills/components/database/database-scaffolding/SKILL.md) | +1 | -1 |
| [`plugin/skills/components/helm/helm-scaffolding/SKILL.md`](plugin/skills/components/helm/helm-scaffolding/SKILL.md) | +1 | -1 |
| [`plugin/skills/components/helm/helm-standards/SKILL.md`](plugin/skills/components/helm/helm-standards/SKILL.md) | +1 | -1 |
| [`plugin/skills/typescript-standards/SKILL.md`](plugin/skills/typescript-standards/SKILL.md) | +57 | -646 |
| [`plugin/skills/typescript-standards/resources/module-system.md`](plugin/skills/typescript-standards/resources/module-system.md) | +183 | -0 |
| [`plugin/skills/typescript-standards/resources/immutability.md`](plugin/skills/typescript-standards/resources/immutability.md) | +91 | -0 |
| [`plugin/skills/typescript-standards/resources/banned-operations.md`](plugin/skills/typescript-standards/resources/banned-operations.md) | +76 | -0 |
| [`plugin/skills/typescript-standards/resources/error-handling.md`](plugin/skills/typescript-standards/resources/error-handling.md) | +128 | -0 |
| [`plugin/skills/typescript-standards/resources/advanced-types.md`](plugin/skills/typescript-standards/resources/advanced-types.md) | +137 | -0 |
| [`plugin/skills/workflow-state/SKILL.md`](plugin/skills/workflow-state/SKILL.md) | +5 | -604 |
| [`plugin/skills/workflow-state/resources/internal-api.md`](plugin/skills/workflow-state/resources/internal-api.md) | +425 | -0 |
| [`plugin/skills/workflow-state/resources/workflow-yaml-schema.md`](plugin/skills/workflow-state/resources/workflow-yaml-schema.md) | +117 | -0 |
| [`plugin/skills/workflow-state/resources/recovery.md`](plugin/skills/workflow-state/resources/recovery.md) | +63 | -0 |
| [`plugin/skills/spec-decomposition/SKILL.md`](plugin/skills/spec-decomposition/SKILL.md) | +10 | -609 |
| [`plugin/skills/spec-decomposition/resources/outline-modes.md`](plugin/skills/spec-decomposition/resources/outline-modes.md) | +191 | -0 |
| [`plugin/skills/spec-decomposition/resources/decomposition-algorithm.md`](plugin/skills/spec-decomposition/resources/decomposition-algorithm.md) | +119 | -0 |
| [`plugin/skills/spec-decomposition/resources/data-structures.md`](plugin/skills/spec-decomposition/resources/data-structures.md) | +301 | -0 |
| [`plugin/skills/components/e2e-testing/e2e-testing/SKILL.md`](plugin/skills/components/e2e-testing/e2e-testing/SKILL.md) | +7 | -457 |
| [`plugin/skills/components/e2e-testing/e2e-testing/resources/page-objects.md`](plugin/skills/components/e2e-testing/e2e-testing/resources/page-objects.md) | +88 | -0 |
| [`plugin/skills/components/e2e-testing/e2e-testing/resources/test-patterns.md`](plugin/skills/components/e2e-testing/e2e-testing/resources/test-patterns.md) | +208 | -0 |
| [`plugin/skills/components/e2e-testing/e2e-testing/resources/fixtures-helpers.md`](plugin/skills/components/e2e-testing/e2e-testing/resources/fixtures-helpers.md) | +98 | -0 |
| [`plugin/skills/components/e2e-testing/e2e-testing/resources/testkube.md`](plugin/skills/components/e2e-testing/e2e-testing/resources/testkube.md) | +50 | -0 |
| [`plugin/skills/spec-writing/SKILL.md`](plugin/skills/spec-writing/SKILL.md) | +6 | -526 |
| [`plugin/skills/spec-writing/resources/feature-spec-template.md`](plugin/skills/spec-writing/resources/feature-spec-template.md) | +214 | -0 |
| [`plugin/skills/spec-writing/resources/epic-spec-template.md`](plugin/skills/spec-writing/resources/epic-spec-template.md) | +81 | -0 |
| [`plugin/skills/spec-writing/resources/other-templates.md`](plugin/skills/spec-writing/resources/other-templates.md) | +102 | -0 |
| [`plugin/skills/spec-writing/resources/frontmatter-validation.md`](plugin/skills/spec-writing/resources/frontmatter-validation.md) | +119 | -0 |
| [`plugin/skills/external-spec-integration/SKILL.md`](plugin/skills/external-spec-integration/SKILL.md) | +18 | -453 |
| [`plugin/skills/external-spec-integration/resources/workflow-steps.md`](plugin/skills/external-spec-integration/resources/workflow-steps.md) | +329 | -0 |
| [`plugin/skills/external-spec-integration/resources/transformation.md`](plugin/skills/external-spec-integration/resources/transformation.md) | +129 | -0 |
| [`plugin/skills/components/database/postgresql/SKILL.md`](plugin/skills/components/database/postgresql/SKILL.md) | +6 | -379 |
| [`plugin/skills/components/database/postgresql/resources/administration.md`](plugin/skills/components/database/postgresql/resources/administration.md) | +109 | -0 |
| [`plugin/skills/components/database/postgresql/resources/deployment.md`](plugin/skills/components/database/postgresql/resources/deployment.md) | +54 | -0 |
| [`plugin/skills/components/database/postgresql/resources/monitoring.md`](plugin/skills/components/database/postgresql/resources/monitoring.md) | +102 | -0 |
| [`plugin/skills/components/database/postgresql/resources/schema-management.md`](plugin/skills/components/database/postgresql/resources/schema-management.md) | +97 | -0 |
| [`plugin/skills/components/frontend/frontend-standards/SKILL.md`](plugin/skills/components/frontend/frontend-standards/SKILL.md) | +5 | -304 |
| [`plugin/skills/components/frontend/frontend-standards/resources/mvvm-patterns.md`](plugin/skills/components/frontend/frontend-standards/resources/mvvm-patterns.md) | +136 | -0 |
| [`plugin/skills/components/frontend/frontend-standards/resources/tailwind.md`](plugin/skills/components/frontend/frontend-standards/resources/tailwind.md) | +68 | -0 |
| [`plugin/skills/components/frontend/frontend-standards/resources/tanstack.md`](plugin/skills/components/frontend/frontend-standards/resources/tanstack.md) | +99 | -0 |
| [`plugin/skills/components/integration-testing/integration-testing/SKILL.md`](plugin/skills/components/integration-testing/integration-testing/SKILL.md) | +7 | -432 |
| [`plugin/skills/components/integration-testing/integration-testing/resources/api-testing.md`](plugin/skills/components/integration-testing/integration-testing/resources/api-testing.md) | +156 | -0 |
| [`plugin/skills/components/integration-testing/integration-testing/resources/authentication.md`](plugin/skills/components/integration-testing/integration-testing/resources/authentication.md) | +80 | -0 |
| [`plugin/skills/components/integration-testing/integration-testing/resources/database-strategies.md`](plugin/skills/components/integration-testing/integration-testing/resources/database-strategies.md) | +135 | -0 |
| [`plugin/skills/components/integration-testing/integration-testing/resources/testkube.md`](plugin/skills/components/integration-testing/integration-testing/resources/testkube.md) | +72 | -0 |
| [`plugin/skills/spec-solicitation/SKILL.md`](plugin/skills/spec-solicitation/SKILL.md) | +7 | -321 |
| [`plugin/skills/spec-solicitation/resources/solicitation-steps.md`](plugin/skills/spec-solicitation/resources/solicitation-steps.md) | +138 | -0 |
| [`plugin/skills/spec-solicitation/resources/spec-sections.md`](plugin/skills/spec-solicitation/resources/spec-sections.md) | +65 | -0 |
| [`plugin/skills/spec-solicitation/resources/workflow-yaml.md`](plugin/skills/spec-solicitation/resources/workflow-yaml.md) | +117 | -0 |

---

## Detailed Changes

### Phase 1: Vague Cross-Reference Fixes (11 files, 1-2 lines each)

Each file below had a vague "refer to the `project-settings` skill for..." replaced with a proper delegation contract specifying what goes in and what comes out.

#### [`plugin/skills/change-creation/SKILL.md`](plugin/skills/change-creation/SKILL.md)

Replaced vague "refer to the `project-settings` skill for schema" with delegation contract.

```diff
-1. Project components from `.sdd/sdd-settings.yaml` (refer to the `project-settings` skill for schema)
+1. Project components from `.sdd/sdd-settings.yaml` (delegate to the `project-settings` skill for the settings schema — it returns the component list with `name`, `type`, and type-specific settings)
```

#### [`plugin/skills/commit-standards/SKILL.md`](plugin/skills/commit-standards/SKILL.md)

Replaced vague schema reference with specific version field delegation.

```diff
-The project version is stored in `.sdd/sdd-settings.yaml`. Refer to the `project-settings` skill for the complete settings schema.
+The project version is stored in `.sdd/sdd-settings.yaml`. Delegate to the `project-settings` skill for the version location and format — it returns the `version` field from the project settings root, following semver (`MAJOR.MINOR.PATCH`).
```

#### [`plugin/skills/component-discovery/SKILL.md`](plugin/skills/component-discovery/SKILL.md)

Two fixes: (1) vague validation reference → explicit cross-reference rules, (2) misattributed spec-writing reference → correct spec-solicitation attribution.

```diff
-Before returning, validate the discovered configuration against the rules defined in the `project-settings` skill (cross-reference validation for databases, contracts, helm, hybrid modes, and deploy modes).
+Before returning, validate discovered configuration against the `project-settings` skill's cross-reference rules: databases referenced by servers must exist as database components, contracts must exist as contract components, helm `deploy_modes` must be valid for the server's `server_type`, and `deploys` must reference an existing server or webapp.
```

```diff
-- The output is used by `spec-writing` skill to populate Components section
+- Component list is stored in context.md. During spec solicitation, the `spec-solicitation` skill populates the Components section of SPEC.md using discovered components and solicited technical details
```

#### [`plugin/skills/components/backend/backend-scaffolding/SKILL.md`](plugin/skills/components/backend/backend-scaffolding/SKILL.md)

Two vague refs replaced with specific server settings delegation contracts.

```diff
-... (refer to the `project-settings` skill for the authoritative schema).
+... Delegate to the `project-settings` skill for the authoritative server settings schema — it accepts a component type (`server`) and returns the typed settings object including `server_type`, `databases`, `provides_contracts`, and framework defaults.
```

```diff
-... Refer to the `project-settings` skill for the complete server settings schema and defaults.
+... Delegate to the `project-settings` skill for the complete server settings schema and defaults — it returns `server_type` (express/fastify/nestjs), `databases` (array of referenced database component names), `provides_contracts` (array of contract component names), and framework-specific configuration.
```

#### [`plugin/skills/components/config/config-scaffolding/SKILL.md`](plugin/skills/components/config/config-scaffolding/SKILL.md)

Replaced vague schema ref with config-specific delegation contract.

```diff
-... (refer to the `project-settings` skill for the authoritative schema).
+... Delegate to the `project-settings` skill for the authoritative config schema — it accepts a component type (`config`) and returns the settings object including referenced components and environment variable mappings.
```

#### [`plugin/skills/components/contract/contract-scaffolding/SKILL.md`](plugin/skills/components/contract/contract-scaffolding/SKILL.md)

Replaced vague directory mapping ref with explicit path resolution contract.

```diff
-... (refer to the `project-settings` skill for directory mappings).
+... Delegate to the `project-settings` skill for directory path resolution — it maps component type (`contract`) + name to a filesystem path (e.g., `type=contract, name=customer-api` → `components/contracts/customer-api/`).
```

#### [`plugin/skills/components/database/database-scaffolding/SKILL.md`](plugin/skills/components/database/database-scaffolding/SKILL.md)

Same pattern — vague directory mapping → explicit path resolution with example.

```diff
-... (refer to the `project-settings` skill for directory mappings).
+... Delegate to the `project-settings` skill for directory path resolution — it maps component type (`database`) + name to a filesystem path (e.g., `type=database, name=app-db` → `components/databases/app-db/`).
```

#### [`plugin/skills/components/helm/helm-scaffolding/SKILL.md`](plugin/skills/components/helm/helm-scaffolding/SKILL.md)

Replaced vague schema ref with helm-specific settings contract.

```diff
-... Refer to the `project-settings` skill for the complete helm settings schema and defaults.
+... Delegate to the `project-settings` skill for the complete helm settings schema and defaults — it returns `deploys` (server reference), `deploy_type`, `deploy_modes` (array of mode strings), `ingress` (boolean), and `assets` (static file configuration).
```

#### [`plugin/skills/components/helm/helm-standards/SKILL.md`](plugin/skills/components/helm/helm-standards/SKILL.md)

Replaced vague schema ref with detailed helm settings contract including field descriptions.

```diff
-... Refer to the `project-settings` skill for the complete helm settings schema and how `deploy_modes`, `ingress`, and `assets` affect chart structure.
+... Delegate to the `project-settings` skill for the complete helm settings schema — it returns `deploys` (server reference), `deploy_type` (server/webapp), `deploy_modes` (array of mode strings like `[api, worker]`), `ingress` (boolean), and `assets` (static file configuration). These settings determine which templates are included in each chart.
```

#### [`plugin/skills/local-env/SKILL.md`](plugin/skills/local-env/SKILL.md)

Replaced vague schema ref with specific fields the deploy command uses.

```diff
-The deploy command reads `.sdd/sdd-settings.yaml` (refer to the `project-settings` skill for schema) to:
+The deploy command reads `.sdd/sdd-settings.yaml` (delegate to the `project-settings` skill for the settings schema — it returns the project `name`, component list with types, and per-component settings) to:
```

#### [`plugin/skills/planning/SKILL.md`](plugin/skills/planning/SKILL.md)

Replaced vague schema ref with typed component object description.

```diff
-2. May read `.sdd/sdd-settings.yaml` for existing component details (refer to the `project-settings` skill for schema)
+2. May read `.sdd/sdd-settings.yaml` for existing component details (delegate to the `project-settings` skill for the settings schema — it returns typed component objects with `name`, `type`, and type-specific `settings` like `server_type`, `databases`, `provides_contracts`)
```

---

### Phase 1: Other Vague Cross-Reference Fixes (2 files)

#### [`plugin/skills/spec-solicitation/SKILL.md`](plugin/skills/spec-solicitation/SKILL.md)

Two vague dependency refs replaced with proper delegation contracts (also fixes the circular dependency with workflow-state).

#### [`plugin/skills/spec-decomposition/SKILL.md`](plugin/skills/spec-decomposition/SKILL.md)

Vague "see change-creation skill with type: epic" replaced with explicit epic structure description.

---

### Phase 2: Resource Extractions (10 skills)

Content was moved from oversized SKILL.md files into `resources/` subdirectories. No content was added or removed — only restructured. Each SKILL.md gained a `## Resource Files` section with links.

| Skill | Before | After | Resources Created |
|-------|--------|-------|-------------------|
| typescript-standards | 1,055 | 466 | module-system.md, immutability.md, banned-operations.md, error-handling.md, advanced-types.md |
| workflow-state | 764 | 165 | internal-api.md, workflow-yaml-schema.md, recovery.md |
| spec-decomposition | 639 | 40 | outline-modes.md, decomposition-algorithm.md, data-structures.md |
| e2e-testing | 619 | 169 | page-objects.md, test-patterns.md, fixtures-helpers.md, testkube.md |
| spec-writing | 595 | 75 | feature-spec-template.md, epic-spec-template.md, other-templates.md, frontmatter-validation.md |
| external-spec-integration | 559 | 124 | workflow-steps.md, transformation.md |
| postgresql | 555 | 182 | administration.md, deployment.md, monitoring.md, schema-management.md |
| frontend-standards | 553 | 254 | mvvm-patterns.md, tailwind.md, tanstack.md |
| integration-testing | 553 | 128 | api-testing.md, authentication.md, database-strategies.md, testkube.md |
| spec-solicitation | 515 | 201 | solicitation-steps.md, spec-sections.md, workflow-yaml.md |

