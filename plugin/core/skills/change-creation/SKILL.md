---
name: change-creation
description: Create change specification and implementation plan with dynamic phase generation. Supports feature, bugfix, refactor, and epic types.
user-invocable: false
---

# Change Creation Skill

## Purpose

Create a complete change specification package consisting of:
- Change directory: `changes/YYYY/MM/DD/<change-name>/`
- Specification: `SPEC.md` with proper frontmatter, type-specific sections, and domain updates
- Implementation plan: `PLAN.md` with dynamically generated phases
- INDEX.md update with new change entry

## Key Principles

### Skills vs Agents Separation

| Context | Responsibility |
|---------|----------------|
| **Skills** (main context) | All planning, spec creation, domain docs - interactive, needs user input |
| **Agents** (subagent) | Execution only - non-interactive, implements approved plans |

This skill handles all spec and plan creation. Implementation agents only execute the approved plan.

### Domain Documentation During Planning

Domain documentation is specified **in SPEC.md during planning**, not discovered during implementation:
- Glossary terms are explicitly listed
- Definition specs are identified upfront
- Architecture changes are noted

Implementation simply executes these specifications.

### Dynamic Phase Generation

Plans are generated dynamically based on:
1. Project components from `sdd/sdd-settings.yaml` (delegate to the `project-settings` skill for the settings schema — it returns the component list with `name`, `type`, and type-specific settings)
2. Which components are affected by the change
3. Dependency order between components
4. Contextual agent assignment

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts change metadata (name, type, title, domain), optional workflow context, and content from spec solicitation or external integration.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns paths to created SPEC.md and PLAN.md files, and whether the index was updated.

## Workflow

### Step 1: Validate Inputs

1. Validate `name` is a valid directory name:
   - Lowercase letters, numbers, hyphens only
   - No spaces or special characters
   - Not empty

2. Validate `type` is one of: `feature`, `bugfix`, `refactor`, `epic`

3. Ensure required parameters are provided:
   - `name`, `type`, `title`, `description`, `domain`

### Step 2: Generate Date Path

1. Get current date
2. Format as `YYYY/MM/DD`
3. Full path: `changes/YYYY/MM/DD/<name>/`

### Step 3: Read Plugin Version and Settings

1. Read SDD plugin version from `.claude-plugin/plugin.json`
2. Read project components from `sdd/sdd-settings.yaml`
3. Identify affected components (from input or infer from description)

### Step 4: Create Change Directory

```bash
mkdir -p changes/YYYY/MM/DD/<name>/
```

### Step 5: Create SPEC.md

Create `changes/YYYY/MM/DD/<name>/SPEC.md` using type-specific template.

#### Common Frontmatter (all types)

```yaml
---
title: <title>
type: <type>
status: active
domain: <domain>
issue: <issue or "TBD">
created: YYYY-MM-DD
updated: YYYY-MM-DD
sdd_version: <plugin_version>
affected_components:
  - <component-1>
  - <component-2>
decomposition_id: <uuid>  # Only if provided
---
```

#### Type-Specific Content

Use the template for the change type. Each template is a complete markdown document to use as the SPEC.md body (after the frontmatter above).

| Type | Template | Notes |
|------|----------|-------|
| `feature` | [`templates/spec-feature.md`](./templates/spec-feature.md) | Thorough, self-sufficient technical spec |
| `bugfix` | [`templates/spec-bugfix.md`](./templates/spec-bugfix.md) | Focused on symptoms, root cause, and fix |
| `refactor` | [`templates/spec-refactor.md`](./templates/spec-refactor.md) | Current state, proposed design, behavior preservation |
| `epic` | [`templates/spec-epic.md`](./templates/spec-epic.md) | Parent spec with child change breakdown |

**Epic Directory Structure:**

After creating the epic's own SPEC.md and PLAN.md, create child change directories:

```text
changes/YYYY/MM/DD/<epic-name>/
├── SPEC.md
├── PLAN.md
└── changes/
    ├── <child-change-1>/
    │   ├── SPEC.md
    │   └── PLAN.md
    └── <child-change-2>/
        ├── SPEC.md
        └── PLAN.md
```

Each child change uses the standard feature spec template with `parent_epic: ../SPEC.md` in frontmatter.

### Step 6: Create PLAN.md with Dynamic Phases

Create `changes/YYYY/MM/DD/<name>/PLAN.md` using dynamic phase generation.

#### Phase Generation Algorithm

1. **Read project components** from `sdd/sdd-settings.yaml`
2. **Filter to affected components** (from SPEC.md `affected_components`)
3. **Order by dependency graph:** Invoke `techpacks.dependencyOrder` for the active tech pack to get the topological order of component types. Filter to only affected components while preserving dependency order.
4. **Assign agents:** Invoke `techpacks.readManifest` and read `components.<type>.agent` for each affected component type. For standards, invoke `techpacks.routeSkills(phase: plan-generation, component_type: <type>)`.
5. **Add final phases:** Read `lifecycle.testing.agent` and `lifecycle.verification.agent` from the manifest.

#### Plan Frontmatter

```yaml
---
title: <title> - Implementation Plan
change: <name>
type: <type>
spec: ./SPEC.md
status: draft
created: YYYY-MM-DD
sdd_version: <plugin_version>
---
```

#### Plan Content

Use the template for the change type. Each template is a complete markdown document to use as the PLAN.md body (after the frontmatter above).

| Type | Template | Notes |
|------|----------|-------|
| `feature` | [`templates/plan-feature.md`](./templates/plan-feature.md) | Dynamic phases based on affected components |
| `bugfix` | [`templates/plan-bugfix.md`](./templates/plan-bugfix.md) | 4 phases: investigation, fix, test, review |
| `refactor` | [`templates/plan-refactor.md`](./templates/plan-refactor.md) | 4 phases: preparation, refactor, test, review |
| `epic` | [`templates/plan-epic.md`](./templates/plan-epic.md) | Change order and dependency graph |

### Step 7: Update INDEX.md

Add entry to `changes/INDEX.md`:

1. Find the `## Active Changes` section (create if missing)
2. Add entry with type indicator:
   ```markdown
   - [<title>](YYYY/MM/DD/<name>/SPEC.md) - <type> - <description>
   ```
   Note: Links are relative within the `changes/` directory.

### Step 8: Return Result

Return:
```yaml
spec_path: changes/YYYY/MM/DD/<name>/SPEC.md
plan_path: changes/YYYY/MM/DD/<name>/PLAN.md
index_updated: true
```

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

## Epic Lifecycle

Epics group multiple feature-type changes under a single goal. The creation workflow (Steps 1-8 above) handles epic SPEC.md and PLAN.md generation using the `epic` type templates. This section covers epic-specific tracking, implementation, and failure handling.

### Workflow Tracking

Epics are tracked in `sdd/workflows/<id>-<name>/workflow.yaml`:

```yaml
items:
  - id: 01-user-management
    title: User Management
    type: epic
    status: pending
    children:
      - id: 01-registration
        change_id: user-auth-1
        title: Registration
        type: feature
        status: pending
```

- Epic items have `type: epic` and a `children` array
- Only leaf features get change_ids (epics don't)
- Epic status is derived from child statuses

### Implementing an Epic

For each child change, in dependency order:

1. **Branch**: `git checkout -b epic/<epic-name>/<change-name>`
2. **Implement**: Follow the child change's PLAN.md (standard feature implementation)
3. **Test**: Ensure all tests pass
4. **PR**: Create PR with change scope (one PR per child change)
5. **Review**: Get approval
6. **Merge**: Merge to main
7. **Update**: Mark change complete in epic PLAN.md

### Handling Failures

If a child change fails review:
1. Address feedback on the change branch
2. Do NOT modify other change branches
3. Re-submit for review

If requirements change mid-epic:
1. Update parent SPEC.md
2. Update affected child SPECs
3. Re-plan affected changes
4. Document changes in epic PLAN.md

## Spec Validation Rules

### Required Frontmatter Fields

- `title` - Change name
- `type` - feature, bugfix, refactor, or epic
- `status` - active (after merge)
- `domain` - Primary domain
- `issue` - Tracking issue reference (required)
- `created` - Creation date
- `updated` - Last update date
- `sdd_version` - SDD plugin version (required)

### Git Lifecycle

- **In PR** = draft (implicit, no status field)
- **Merged to main** = active
- Only explicit statuses: `active`, `deprecated`, `superseded`, `archived`

### Acceptance Criteria Format

Always use Given/When/Then:
- [ ] **AC1:** Given [precondition], when [action], then [result]

Each criterion must be independently testable.

## Examples

### Feature Example

```yaml
Input:
  name: user-authentication
  type: feature
  title: User Authentication
  description: Allow users to sign up, sign in, and manage sessions
  domain: Identity
  issue: PROJ-123
  affected_components: [component-a, component-b, component-c]
  glossary_terms:
    - term: Session Token
      definition: Credential representing an authenticated user session
      action: add
  domain_definitions:
    - file: session.md
      description: Session management and token lifecycle
      action: create

Output:
  spec_path: changes/2026/01/21/user-authentication/SPEC.md
  plan_path: changes/2026/01/21/user-authentication/PLAN.md
  index_updated: true
```

### Bugfix Example

```yaml
Input:
  name: fix-session-timeout
  type: bugfix
  title: Fix Session Timeout
  description: Sessions expire prematurely after 5 minutes instead of 30
  domain: Identity
  issue: BUG-456
  root_cause: Token expiry calculation uses seconds instead of minutes
  affected_files:
    - path/to/affected-file
    - path/to/other-file
  affected_components: [<component-type>]

Output:
  spec_path: changes/2026/01/21/fix-session-timeout/SPEC.md
  plan_path: changes/2026/01/21/fix-session-timeout/PLAN.md
  index_updated: true
```

## Error Handling

- If change directory already exists: Warn and ask for confirmation to overwrite
- If INDEX.md doesn't exist: Create it with basic structure
- If plugin.json can't be read: Use "unknown" for sdd_version and warn
- If sdd/sdd-settings.yaml can't be read: Use default component assumptions and warn
- If invalid type provided: Return error with valid options
