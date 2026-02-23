---
name: skills-router
description: Routes core skill requests to fullstack-typescript component standards and lifecycle skills.
user-invocable: false
---

# Skills Router

Routes `techpacks.routeSkills(phase, component_type)` requests to the appropriate fullstack-typescript skills. Core never loads tech pack skills directly — it invokes this router, which returns the skill paths to load.

## Input

Invoked by the techpacks gateway with a structured context block:

```yaml
phase: <phase>
component_type: <optional>
component_name: <optional>
agent: <optional>
```

Validated against `skills-router-context.schema.json`.

---

## Component Standards Table

Maps `component_type` to the standards skills that apply during `implementation` and `verification` phases.

| component_type | Standards Skills |
|----------------|-----------------|
| `server` | `backend-standards`, `typescript-standards` |
| `webapp` | `frontend-standards`, `typescript-standards` |
| `database` | `database-standards` |
| `contract` | `contract-standards`, `typescript-standards` |
| `helm` | `helm-standards` |
| `config` | `config-standards` |
| `cicd` | `cicd-standards` |
| `integration-testing` | `integration-testing-standards` |
| `e2e-testing` | `e2e-testing-standards` |

### Skill Paths

| Skill Name | Path (relative to tech pack root) |
|------------|-----------------------------------|
| `backend-standards` | `skills/components/backend/backend-standards/SKILL.md` |
| `frontend-standards` | `skills/components/frontend/frontend-standards/SKILL.md` |
| `database-standards` | `skills/components/database/database-standards/SKILL.md` |
| `contract-standards` | `skills/components/contract/contract-standards/SKILL.md` |
| `helm-standards` | `skills/components/helm/helm-standards/SKILL.md` |
| `config-standards` | `skills/components/config/config-standards/SKILL.md` |
| `cicd-standards` | `skills/components/cicd/cicd-standards/SKILL.md` |
| `integration-testing-standards` | `skills/components/integration-testing/integration-testing/SKILL.md` |
| `e2e-testing-standards` | `skills/components/e2e-testing/e2e-testing/SKILL.md` |
| `typescript-standards` | `skills/typescript-standards/SKILL.md` |
| `unit-testing` | `skills/unit-testing/SKILL.md` |
| `component-discovery` | `skills/component-discovery/SKILL.md` |
| `scaffolding` | `skills/project-scaffolding/SKILL.md` |
| `planning-standards` | `skills/planning-standards/SKILL.md` |

---

## Phase Skills Table

Maps the lifecycle `phase` to the skill(s) to load.

| Phase | Skills | Notes |
|-------|--------|-------|
| `component-discovery` | `component-discovery` | Discovers component types and instances in the project |
| `project-scaffolding` | `scaffolding` | Scaffolding conventions for this tech pack |
| `plan-generation` | `planning-standards` | Planning conventions and output format |
| `implementation` | _(from Component Standards Table)_ | Requires `component_type` in context |
| `testing` | `integration-testing-standards`, `e2e-testing-standards` | Both loaded regardless of component type |
| `verification` | _(from Component Standards Table)_ | All standards for each component type involved |

### Phase Resolution Rules

1. **`component-discovery`** — Always loads the `component-discovery` skill. No `component_type` required.

2. **`project-scaffolding`** — Always loads the `scaffolding` skill. No `component_type` required.

3. **`plan-generation`** — Always loads the `planning-standards` skill. No `component_type` required.

4. **`implementation`** — Requires `component_type`. Look up the Component Standards Table and return the listed skills. If `component_type` is missing, return an error.

5. **`testing`** — Always loads `integration-testing-standards` and `e2e-testing-standards`. If a specific `component_type` is provided and it is `integration-testing` or `e2e-testing`, load only that one.

6. **`verification`** — Requires `component_type`. Look up the Component Standards Table and return all listed skills. The verifier uses these to check the implementation against standards.

---

## Agent Context Table

Maps `component_type` to the agent declared in `techpack.yaml` that should be loaded via `techpacks.loadAgent`.

| component_type | Agent Name | Agent Path |
|----------------|-----------|------------|
| `server` | `backend-dev` | `agents/backend-dev.md` |
| `webapp` | `frontend-dev` | `agents/frontend-dev.md` |
| `database` | `backend-dev` | `agents/backend-dev.md` |
| `contract` | `api-designer` | `agents/api-designer.md` |
| `helm` | `devops` | `agents/devops.md` |
| `config` | `backend-dev` | `agents/backend-dev.md` |
| `cicd` | `devops` | `agents/devops.md` |
| `integration-testing` | `tester` | `agents/tester.md` |
| `e2e-testing` | `tester` | `agents/tester.md` |

---

## Loading Instructions

When the techpacks gateway invokes this router:

1. **Read the context block** — extract `phase`, `component_type`, `component_name`, and `agent`.

2. **Resolve skill list** — use the Phase Skills Table to determine which skills to load. For phases that reference the Component Standards Table (`implementation`, `verification`), look up the `component_type` entry.

3. **Return skill paths** — for each resolved skill name, map it to the relative path from the Skill Paths table above. The techpacks gateway will call `techpacks.resolvePath` to turn these into absolute paths and then `techpacks.loadSkill` to load each one.

4. **Agent resolution** — if the context includes a `component_type` and the phase is `implementation` or `verification`, also return the agent reference from the Agent Context Table. The techpacks gateway loads the agent via `techpacks.loadAgent`, which spawns a Task subagent with the resolved skills composed into its prompt.

### Example

Request:
```yaml
phase: implementation
component_type: server
component_name: main-server
```

Response:
```yaml
skills:
  - skills/components/backend/backend-standards/SKILL.md
  - skills/typescript-standards/SKILL.md
agent:
  name: backend-dev
  path: agents/backend-dev.md
```
