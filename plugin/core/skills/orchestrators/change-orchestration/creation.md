# Change Creation

Handles the `create` action for the change orchestration skill.

## Usage

```
/sdd-run change create --type <feature|bugfix|refactor|epic> --name <change-name>
/sdd-run change create --spec <path-to-external-spec>
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `--type` | Yes (without `--spec`) | Type of change: `feature`, `bugfix`, `refactor`, or `epic` |
| `--name` | Yes (without `--spec`) | Name for the change (lowercase, hyphens allowed) |
| `--spec` | Alternative mode | Path to an external specification file to import |

## Flow: Interactive Mode (`--type` + `--name`)

### Step 1: Validate Arguments

1. Validate `--type` is one of: `feature`, `bugfix`, `refactor`, `epic`
2. Validate `--name` is valid directory name (lowercase, hyphens, no spaces)
3. If no arguments, display usage and exit

### Step 2: Check Git Branch

1. Run `git branch --show-current`
2. If on `main`/`master`:
   - Suggest creating branch: `<type>/<change-name>`
   - Wait for user confirmation
   - Create branch if approved
3. Otherwise proceed on current branch

### Step 3: Choose Workflow Name

Prompt the user for a workflow name:
- Suggest a name derived from `--name` (the change name), e.g., if `--name api-contracts`, suggest `api-contracts`
- User confirms or provides their own name
- Workflow name and change name are distinct — a workflow named `user-auth` might contain a change named `api-contracts`

### Step 4: Create Workflow

```yaml
INVOKE workflow-state.create_workflow with:
  source: interactive
  name: <workflow name from step 3>
```

Returns `workflow_id` and `workflow_name` for tracking.

### Step 5: Component Discovery

```yaml
INVOKE component-discovery skill with:
  change_name: <from arguments>
  change_type: <from arguments>
  existing_components: <from sdd-settings.yaml>
```

### Step 6: Create Workflow Item

```yaml
INVOKE workflow-state.create_item with:
  workflow_id: <from step 4>
  id: <change-name>
  title: <formatted title>
  type: <change-type>
  depends_on: []
```

### Step 7: Spec Solicitation

```yaml
INVOKE spec-solicitation skill with:
  change_id: <from step 6>
  workflow_id: <from step 4>
```

The skill guides user through requirements gathering and creates SPEC.md.

### Step 8: Move to Review

When spec is complete:
```yaml
INVOKE workflow-state.ready_for_review with:
  change_id: <change_id>
```

This moves the item from drafts to changes/ and sets status to `spec_review`.

### Step 9: Display Next Steps

```
===============================================================
 SPEC READY FOR REVIEW
===============================================================

Change: user-auth-1 (User Authentication)
Spec: [SPEC.md](changes/2026/02/05/a1b2c3-user-auth/01-user-auth/SPEC.md)

Please review the specification.

NEXT STEPS:
  1. Review the SPEC.md file
  2. When satisfied: /sdd I want to approve the spec
  3. If changes needed, edit SPEC.md and then: /sdd I want to continue
```

## Flow: External Spec Mode (`--spec`)

### Step 1: Validate Spec Path

1. Check path exists
2. If file: use directly
3. If directory: find entry point (README.md, SPEC.md, index.md)

### Step 2: Extract Outline

```yaml
INVOKE spec-decomposition skill with:
  mode: "outline"
  spec_content: <file content>
```

### Step 3: Check Git Branch

Same as interactive flow - suggest branch if on main/master.

### Step 4: Archive External Spec

Use the system CLI to archive:

```bash
<plugin-root>/system/system-run.sh archive store --source <spec-path> --type external-spec --json
```

```
Archived external spec to: [sdd/archive/external-specs/20260205-1430-feature-spec.md](sdd/archive/external-specs/20260205-1430-feature-spec.md)
(This is read-only - for audit trail only)
```

### Step 5: Transformation

Transform the product spec to tech spec context BEFORE decomposition:

```yaml
INVOKE external-spec-integration skill with:
  spec_path: <absolute path>
  spec_outline: <from step 2>
  mode: "transform"
```

The transformation performs:
1. **Classification** - Parse and classify information (domain, constraints, requirements, design)
2. **Gap Analysis** - Identify missing requirements, edge cases, NFRs
3. **Clarification Questions** - Ask non-blocking conversational questions about gaps
4. Record all Q&A for SPEC.md Requirements Discovery section

Output: classified_transformation

### Step 6: Component Discovery

Identify required components through targeted questions:

```yaml
INVOKE component-discovery skill with:
  classified_requirements: <from transformation>
  mode: "external-spec"
```

This runs ONCE for the entire external spec (not per-item).
Output is documented in SPEC.md, NOT applied to sdd-settings.yaml yet.

### Step 7: Create Workflow

```yaml
INVOKE workflow-state.create_workflow with:
  source: external
  name: <suggest from spec title, user confirms or provides own>
```

### Step 8: Decomposition (with Thinking Step)

```yaml
INVOKE spec-decomposition skill with:
  mode: "hierarchical"
  spec_outline: <from step 2>
  spec_content: <full content>
  classified_transformation: <from step 5>
  discovered_components: <from step 6>
```

The skill performs:
1. Domain Analysis (entities, relationships, glossary, bounded contexts)
2. Specs Directory Impact (before/after, new vs modified)
3. **Dependency Graph** - stored in workflow.yaml for phase gating
4. Gap Analysis (from transformation)
5. Component Mapping (from discovery)
6. API-First Ordering

### Step 9: Present Decomposition

Display the hierarchical structure with epics and features:

```
I found the following structure in this spec:

EPICS (from H1 sections):
  01 User Management (lines 10-150)
     ├── 01 Registration (user-auth-1)
     ├── 02 Authentication (user-auth-2)
     └── 03 Password Reset (user-auth-3)

  02 Dashboard (lines 151-300) [depends on: User Management]
     ├── 01 Analytics (user-auth-4)
     └── 02 Settings (user-auth-5)

Total: 2 epics, 5 features
Implementation order: 01 → 02 (API-first within each epic)

Domain Model extracted:
  - Entities: User, Session, Token, Dashboard
  - Relationships: User has-many Sessions
  - Bounded contexts: Identity, Analytics

Options:
  [A] Accept this breakdown
  [S] Single change (don't split)
  [C] Cancel
```

### Step 10: Create Workflow Items

For each accepted item:
```yaml
INVOKE workflow-state.create_item with:
  workflow_id: <workflow_id>
  id: <item-id>
  title: <item-title>
  type: <feature|epic>
  context_sections: <extracted sections>
  depends_on: <dependencies>
```

### Step 11: Begin Solicitation for First Item

```yaml
INVOKE spec-solicitation skill with:
  change_id: <first item's change_id>
  workflow_id: <workflow_id>
  context_path: <path to context.md>
```

**IMPORTANT**: Unlike the old flow, we do NOT create all SPEC.md files at once. Each spec is created interactively as the user works through items one at a time.

### Step 12: Display Next Steps

```
===============================================================
 EXTERNAL SPEC IMPORTED
===============================================================

Created workflow: a1b2c3 (user-auth)
Items: 5 features across 2 epics

Current: [user-auth-1](changes/2026/02/05/a1b2c3-user-auth/01-registration/) (Registration)
Status: Spec solicitation in progress

IMPORTANT: Specs are created interactively, one at a time.
           Please answer the questions to complete each spec.

Use /sdd to see current status and next steps.
```
