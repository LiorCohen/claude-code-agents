---
name: planning
description: Templates and guidance for implementation plans with dynamic phase generation.
user-invocable: false
---

# Planning Skill

## Plan Location

Plans are stored alongside their specs:

`changes/YYYY/MM/DD/<id>-<name>/<NN-change-name>/PLAN.md`

This keeps all change documentation (spec + plan) together in one location.

## Workflow Integration

Plans are created as part of the `/sdd` workflow:

1. User creates or imports a change via `/sdd I want to create a new feature`
2. Spec solicitation creates SPEC.md
3. User reviews and approves spec via `/sdd I want to approve the spec`
4. **This skill creates PLAN.md** immediately after spec approval
5. User reviews and approves plan via `/sdd I want to approve the plan`
6. Implementation can begin via `/sdd I want to start implementing`

**Plan creation requires an approved SPEC.md** as input — it does not run independently.

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts change ID, path to approved SPEC.md, and workflow ID.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns path to created PLAN.md and review status.

## SPEC.md vs PLAN.md Separation

| File | Purpose | Contains | Does NOT Contain |
|------|---------|----------|------------------|
| **SPEC.md** | What to build and how | Requirements, design, API contracts, implementation details, test cases | Execution order, agent assignments |
| **PLAN.md** | Execution coordination | Phases, agent assignments, dependencies, expected files, progress tracking | Implementation details, code patterns, specific coding tasks |

> **Key principle:** Because plans focus on execution coordination (not implementation details), the SPEC.md must be comprehensive enough that an implementer can complete each phase by reading only the spec. Plans reference specs; they don't duplicate them.

### Plan Content Guidelines

**Acceptable in plans:**
- Standards references per phase (which standards skills apply to each agent's work)
- Methodology-level task descriptions (e.g., "Implement Model layer" not "Implement domain logic")
- Brief code snippets as constraints or guidelines (e.g., "interface must include X field")
- High-level examples showing intent
- File paths and component names
- Phase sequencing and dependencies
- Extensive test lists (tests define WHAT, not HOW)

**Not appropriate in plans:**
- Full implementations or complete code blocks
- Step-by-step coding instructions
- Line-by-line change lists
- Algorithm implementations (belong in spec)

### SPEC.md: Thorough Technical Specification

SPEC.md is a **complete technical specification**. It must be:

- **Self-sufficient**: Anyone reading the spec understands the change fully without other docs
- **Thorough**: Covers all aspects (functional, non-functional, security, errors, observability)
- **Technical**: Includes schemas, algorithms, data models, API contracts
- **Testable**: Every requirement has clear acceptance criteria

Key sections:
- Background and current state (context)
- Functional and non-functional requirements
- Technical design (architecture, data model, algorithms)
- API contracts with request/response schemas
- Security considerations
- Error handling strategy
- Observability (logging, metrics, traces)
- Testing strategy with specific test cases
- Domain updates (glossary, definitions)
- Dependencies and migration plan

### Domain Documentation in Specs

Domain documentation is specified **in SPEC.md during planning**, not discovered during implementation.

The SPEC.md file includes a `## Domain Updates` section that explicitly lists:
- **Glossary Terms** - exact terms to add/modify in `specs/domain/glossary.md`
- **Definition Specs** - domain definition files to create/update in `specs/domain/definitions/`
- **Architecture Docs** - updates needed in `specs/architecture/`

### Testing Strategy in Specs

The SPEC.md file includes a `## Testing Strategy` section that defines:
- **Unit Tests** - what behaviors need unit tests (implemented via TDD during execution)
- **Integration Tests** - what integrations need testing
- **E2E Tests** - what user flows need end-to-end tests

This approach ensures:
1. All requirements (domain, tests, verification) are fully understood before implementation
2. Implementation simply executes the specified updates (no discovery)
3. Clear traceability from spec to implementation

## Dynamic Phase Generation

Plans are generated dynamically based on the SPEC.md's Components section.

### Component Source of Truth

**SPEC.md is the source of truth for required components.**

The planning skill:
1. Reads the `## Components` section from SPEC.md
2. May read `sdd/sdd-settings.yaml` for existing component details (delegate to the `project-settings` skill for the settings schema — it returns typed component objects with `name`, `type`, and type-specific `settings` like `server_type`, `databases`, `provides_contracts`)
3. Does NOT ask about tech stack or which components to use

If SPEC.md says a component is needed but it's not in `sdd-settings.yaml` yet, that's expected - the component will be created during implementation.

**DO NOT ask tech stack questions during planning.** Component discovery already determined what's needed.

### Generation Algorithm

1. **Read required components** from SPEC.md `## Components` section
2. **Reference existing components** from `sdd/sdd-settings.yaml` for details
3. **Check for new components:** If SPEC.md `## Components` lists new components not yet in `sdd-settings.yaml`, prepend a "Phase 1: Component Scaffolding" phase and shift subsequent phase numbers. If all components already exist, omit the scaffolding phase. This applies to all change types (feature, refactor).
4. **Order by dependency graph:** Invoke `techpacks.dependencyOrder` for the active tech pack namespace to get the topological order of component types. Use this order for phase sequencing.
5. **Assign agents and standards:** Invoke `techpacks.readManifest` and read `components.<type>.agent` for each affected component type. For standards, invoke `techpacks.routeSkills(phase: plan-generation, component_type: <type>)` — the skills router returns the relevant standards for each component.
6. **Add final phases:** Read `lifecycle.testing.agent` and `lifecycle.verification.agent` from the manifest for the testing and review phases.

### Testing Strategy

| Test Type | When | Agent |
|-----------|------|-------|
| Unit tests | During implementation (TDD) | Component's assigned agent (from manifest) |
| Integration tests | After all implementation phases | `lifecycle.testing.agent` from manifest |
| E2E tests | After all implementation phases | `lifecycle.testing.agent` from manifest |

## Phase Structure

- Each phase is independently reviewable
- Domain updates execute first (from SPEC.md)
- Component phases follow dependency order
- Phases build on each other sequentially

## Implementation State Tracking

Plans include sections for tracking implementation progress:

### Expected Files
- **Files to Create** - new files this change will add
- **Files to Modify** - existing files this change will update

### Implementation State
- **Current Phase** - which phase is in progress
- **Status** - pending, in_progress, blocked, complete
- **Completed Phases** - checklist of completed phases
- **Actual Files Changed** - updated during implementation with real files
- **Blockers** - any issues blocking progress
- **Resource Usage** - tokens (input/output), turns, and duration per phase

This enables:
1. Session resumption from any point
2. Audit trail of what actually changed
3. Progress visibility for stakeholders
4. Resource usage analysis (cost and time estimation for similar changes)

## PR Size Guidelines

Each phase should result in a reviewable PR:

| Metric | Target | Maximum |
|--------|--------|---------|
| Lines changed | < 400 | 800 |
| Files changed | < 15 | 30 |
| Acceptance criteria | < 5 | 8 |

**If a phase exceeds limits:**
1. Split into sub-phases (e.g., Phase 2a, Phase 2b)
2. Each sub-phase gets its own PR
3. Document splits in plan

## Epic Plans

For `type: epic` changes, delegate to the `change-creation` skill with `type: epic`. It handles the full epic lifecycle: directory structure, parent and child SPEC.md/PLAN.md creation, workflow tracking, and implementation sequencing.

---

## Template: Implementation Plan (Feature)

```markdown
---
title: Implementation Plan: [Change Name]
change: [change-name]
type: feature
spec: ./SPEC.md
issue: [PROJ-XXX]
created: YYYY-MM-DD
sdd_version: [X.Y.Z]
---

# Implementation Plan: [Change Name]

## Overview

**Spec:** [link to spec]
**Issue:** [link to issue]

## Affected Components

<!-- Read from SPEC.md ## Components section (source of truth) -->
<!-- May reference sdd-settings.yaml for existing component details -->
- <component-type-a>
- <component-type-b>
- <component-type-c>

## Phases

<!-- Phases are generated dynamically based on affected components -->
<!-- Domain updates are executed from SPEC.md before code phases -->

<!-- INCLUDE Phase 1 ONLY if SPEC.md lists new components not in sdd-settings.yaml. OMIT entirely if all components already exist. -->
### Phase 1: Component Scaffolding (if new components)
**Agent:** Read the agent assigned to the scaffolding-related component type from the manifest via `techpacks.readManifest`. Use the `components.<type>.agent` field.
**Standards:** Invoke `techpacks.routeSkills(phase: project-scaffolding)` to load scaffolding standards.

**Outcome:** New component directories and boilerplate created, `sdd-settings.yaml` updated

**Deliverables:**
- Component directories scaffolded per SPEC.md Components section
- sdd-settings.yaml updated with new component entries

### Phase N: [Component Implementation]

<!-- Repeat for each affected component in dependency order. Read agent and standards from manifest. -->

**Agent:** Read `components.<type>.agent` from the tech pack manifest via `techpacks.readManifest`.
**Component:** `<component-type>`
**Standards:** Invoke `techpacks.routeSkills(phase: implementation, component_type: <type>)` to load relevant standards.

**Outcome:** Component functionality complete per SPEC.md

**Deliverables:**
- Implementation matching spec requirements
- Unit tests passing (if applicable)

### Phase N+1: Integration & E2E Testing
**Agent:** Read `lifecycle.testing.agent` from the manifest.
**Standards:** Invoke `techpacks.routeSkills(phase: testing)`.

**Outcome:** All integration and E2E tests passing

**Deliverables:**
- Test suites passing

### Phase N+2: Review
**Agent:** Read `lifecycle.verification.agent` from the manifest.
**Standards:** Invoke `techpacks.routeSkills(phase: verification)`.

**Outcome:** Implementation verified against SPEC.md and standards

## Dependencies

- [External dependencies or blockers]

## Tests

<!-- Extensive test list - tests define WHAT, not HOW -->

### Unit Tests
- [ ] `test_[behavior_description]`

### Integration Tests
- [ ] `test_[integration_description]`

### E2E Tests
- [ ] `test_[user_flow_description]`

## Risks

| Risk | Mitigation |
|------|------------|
| [Risk] | [How to mitigate] |
```

---

## Template: Implementation Plan (Bugfix)

```markdown
---
title: Implementation Plan: [Change Name]
change: [change-name]
type: bugfix
spec: ./SPEC.md
issue: [BUG-XXX]
created: YYYY-MM-DD
sdd_version: [X.Y.Z]
---

# Implementation Plan: [Change Name]

## Overview

**Spec:** [link to spec]
**Issue:** [link to issue]

## Affected Components

<!-- List components where the bug manifests -->
- [component]

## Phases

### Phase 1: Investigation
**Agent:** Read `components.<type>.agent` from the tech pack manifest via `techpacks.readManifest` (based on affected component type).
**Standards:** Invoke `techpacks.routeSkills(phase: implementation, component_type: <type>)`.

**Outcome:** Root cause identified and documented in SPEC.md

**Deliverables:**
- Documented root cause
- Clear reproduction steps

### Phase 2: Implementation
**Agent:** Read `components.<type>.agent` from the tech pack manifest via `techpacks.readManifest`.
**Standards:** Invoke `techpacks.routeSkills(phase: implementation, component_type: <type>)`.

**Outcome:** Bug fixed with regression test per SPEC.md

**Deliverables:**
- Working fix
- Regression test passing

### Phase 3: Integration Testing
**Agent:** Read `lifecycle.testing.agent` from the manifest.
**Standards:** Invoke `techpacks.routeSkills(phase: testing)`.

**Outcome:** All tests passing, no regressions

**Deliverables:**
- All tests passing

### Phase 4: Review
**Agent:** Read `lifecycle.verification.agent` from the manifest.
**Standards:** Invoke `techpacks.routeSkills(phase: verification)`.

**Outcome:** Fix verified against SPEC.md acceptance criteria and standards

## Tests

<!-- Extensive test list - tests define WHAT, not HOW -->

### Regression Tests
- [ ] `test_[bug_does_not_recur]`

### Unit Tests
- [ ] `test_[fixed_behavior]`

## Notes

- Prioritize minimal, focused changes
- Update this plan as investigation reveals more details
```

---

## Template: Implementation Plan (Refactor)

```markdown
---
title: Implementation Plan: [Change Name]
change: [change-name]
type: refactor
spec: ./SPEC.md
issue: [TECH-XXX]
created: YYYY-MM-DD
sdd_version: [X.Y.Z]
---

# Implementation Plan: [Change Name]

## Overview

**Spec:** [link to spec]
**Issue:** [link to issue]

## Affected Components

<!-- List components being refactored -->
- [component]

## Phases

### Phase 1: Preparation
**Agent:** Read `components.<type>.agent` from the tech pack manifest via `techpacks.readManifest` (based on affected component type).
**Standards:** Invoke `techpacks.routeSkills(phase: implementation, component_type: <type>)`.

**Outcome:** Test coverage verified, affected areas documented per SPEC.md

**Deliverables:**
- Test coverage report
- Affected area documentation

### Phase 2: Implementation
**Agent:** Read `components.<type>.agent` from the tech pack manifest via `techpacks.readManifest`.
**Standards:** Invoke `techpacks.routeSkills(phase: implementation, component_type: <type>)`.

**Outcome:** Refactoring complete per SPEC.md following component standards, all tests passing

**Deliverables:**
- Refactored code following component standards
- All existing tests passing

### Phase 3: Integration Testing
**Agent:** Read `lifecycle.testing.agent` from the manifest.
**Standards:** Invoke `techpacks.routeSkills(phase: testing)`.

**Outcome:** No behavior changes, all tests passing

**Deliverables:**
- All tests passing
- No behavior changes verified

### Phase 4: Review
**Agent:** Read `lifecycle.verification.agent` from the manifest.
**Standards:** Invoke `techpacks.routeSkills(phase: verification)`.

**Outcome:** Refactoring goals verified, no regressions, standards compliance confirmed

## Tests

<!-- Extensive test list - tests define WHAT, not HOW -->
<!-- For refactors, existing tests should already cover behavior -->

### Existing Tests (must pass)
- [ ] All unit tests pass before refactor
- [ ] All unit tests pass after refactor

### Performance Tests (if applicable)
- [ ] `test_[performance_not_degraded]`

## Notes

- All tests must pass before and after refactoring
- No functional changes should be introduced
- Update this plan as implementation progresses
```
