---
name: scaffolding
description: Orchestrates component scaffolding by delegating to component-specific scaffolding skills.
user-invocable: false
---

# Scaffolding Skill

Orchestrates component scaffolding for the fullstack-typescript tech pack. When a plan phase requires scaffolding new components, this skill determines the correct scaffolding order and delegates to the appropriate component-specific scaffolding skill.

---

## Purpose

During plan execution, the scaffolding phase creates new component directories and boilerplate. This skill ensures components are scaffolded in dependency order -- a server cannot be scaffolded before its contract exists, and Helm charts cannot be created before the services they deploy.

---

## Orchestration Order

Components must be scaffolded in this order. Skip any component type that is not being scaffolded in the current change.

| Order | Component Type | Rationale |
|-------|---------------|-----------|
| 1 | `config` | Singleton, always first. All other components read from config. |
| 2 | `contract` | API-first -- contracts define interfaces before implementations. |
| 3 | `database` | Data layer before services that read/write data. |
| 4 | `server` | Backend services depend on contracts and databases. |
| 5 | `webapp` | Frontend applications consume contracts for type-safe API calls. |
| 6 | `helm` | Deployment charts -- created after deployable components exist. |
| 7 | `integration-testing` | Requires server and database to be scaffolded. |
| 8 | `e2e-testing` | Requires server and webapp to be scaffolded. |
| 9 | `cicd` | CI/CD pipeline -- last, after all components it builds/deploys exist. |

---

## Delegation Table

Each component type delegates to its specific scaffolding skill. Paths are relative to the tech pack's `skills/` directory.

| Component Type | Scaffolding Skill Path |
|---------------|----------------------|
| `config` | `components/config/config-scaffolding` |
| `contract` | `components/contract/contract-scaffolding` |
| `database` | `components/database/database-scaffolding` |
| `server` | `components/backend/backend-scaffolding` |
| `webapp` | `components/frontend/frontend-scaffolding` |
| `helm` | `components/helm/helm-scaffolding` |
| `integration-testing` | `components/integration-testing/integration-testing-scaffolding` |
| `e2e-testing` | `components/e2e-testing/e2e-testing-scaffolding` |
| `cicd` | `components/cicd/cicd-scaffolding` |

Each delegated skill handles its own template rendering, directory creation, and file generation. See the individual SKILL.md files for component-specific details.

---

## Directory Naming Patterns

Component directories follow the patterns defined in `techpack.yaml` under `components.<type>.directory_pattern`. These patterns are the authoritative source for where scaffolded components are placed.

| Component Type | Directory Pattern |
|---------------|------------------|
| `config` | `components/config/` |
| `contract` | `components/contracts/{name}/` |
| `database` | `components/databases/{name}/` |
| `server` | `components/servers/{name}/` |
| `webapp` | `components/webapps/{name}/` |
| `helm` | `components/helm_charts/{name}/` |
| `integration-testing` | `components/testing/integration/{name}/` |
| `e2e-testing` | `components/testing/e2e/{name}/` |
| `cicd` | `components/cicds/{name}/` |

The `{name}` placeholder is replaced with the component's name from `sdd-settings.yaml`. Delegate to the `techpack-settings` skill for the authoritative directory patterns and naming conventions.

---

## Settings Update

After scaffolding a component, the project's `sdd-settings.yaml` must be updated with the new component entry. This is handled via a **declared actions response** returned to the orchestrating skill.

The scaffolding skill returns a declared actions response that includes:

1. **Component entry** -- the new component's `name`, `type`, and type-specific `settings` to add to `sdd-settings.yaml`.
2. **Dependencies** -- any `depends_on` relationships the new component declares.

The calling orchestrator (typically the `change-orchestration` skill) is responsible for applying the settings update by delegating to the `project-settings` skill.

---

## Orchestration Flow

```text
1. Read SPEC.md Components section for new components
2. Read sdd-settings.yaml for existing components
3. Identify components that need scaffolding (new - existing)
4. Sort by orchestration order (above)
5. For each component to scaffold:
   a. Resolve scaffolding skill from delegation table
   b. Invoke component scaffolding skill with component settings
   c. Collect declared actions response (settings update)
   d. Apply settings update to sdd-settings.yaml
6. Return aggregated results
```

---

## Input / Output

This skill defines no input parameters or structured output. It is consumed as orchestration guidance by the planning and change-orchestration skills.
