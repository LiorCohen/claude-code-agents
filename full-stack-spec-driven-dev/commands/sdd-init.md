---
name: sdd-init
description: Initialize a new project from the spec-driven template, optionally from an external spec.
---

# /sdd-init

Initialize a new spec-driven project, optionally from an existing external specification.

## Usage

```
/sdd-init --name <project-name> [--spec <path-to-external-spec>]
```

**Arguments:**
- `--name <project-name>` (required): Name of the project directory to create
- `--spec <path>` (optional): Path to an external specification file to use as the initial spec

**Examples:**
```bash
# Standard initialization
/sdd-init --name my-app

# Initialize from existing spec
/sdd-init --name my-app --spec /path/to/existing-spec.md
```

## Workflow

**CRITICAL**: This command follows an approval-based workflow. Do NOT create any files or directories until the user has approved the project configuration.

### Phase 0: Parse Arguments

1. **If no arguments provided**, display usage and exit:
   ```
   Usage: /sdd-init --name <project-name> [--spec <path>]

   Arguments:
     --name <project-name>  Name of the project directory to create (required)
     --spec <path>          Path to external specification file (optional)

   Examples:
     /sdd-init --name my-app
     /sdd-init --name my-app --spec /path/to/spec.md
   ```
   **Do not proceed to Phase 1 without at least `--name`.**

2. **Parse command arguments:**
   - Check if `--spec <path>` argument is provided
   - Extract project name (required)
   - Extract spec path (if provided)

2. **If external spec is provided:**
   - Read the external spec file from the provided path
   - Parse the spec to extract:
     - **Project Name**: Look for title/project name in spec
     - **Description**: Look for description or summary
     - **Domain**: Identify primary business domain from content
     - **Key Definitions**: Extract main definitions/concepts mentioned
     - **Requirements**: Parse functional and non-functional requirements
   - Store this information for use in later phases
   - Display: "✓ Loaded external spec from: <path>"

3. **Validation:**
   - If spec file doesn't exist, show error and exit
   - If spec file is not readable, show error and exit
   - If spec is empty or invalid, show warning and ask if user wants to continue with standard initialization

### Phase 1: Product Discovery

**PURPOSE:** Understand what the user is building before determining technical components. This phase uses adaptive questioning - ask follow-ups only when needed based on what the user has already shared.

#### Step 1.1: Directory Check

First, validate the project location (using `--name` from arguments):
- Validate project name is a valid directory name (lowercase, hyphens allowed)

**Check for existing directory match:**
- Get the current working directory basename (e.g., if pwd is `/path/to/my-app`, basename is `my-app`)
- If the current directory basename matches the project name:
  - Check if the directory is empty (no files except hidden files like .git, .DS_Store)
  - If empty: Ask user "You're already in an empty directory named '<project-name>'. Initialize here? (yes/no)"
  - If yes: Set target directory to current directory (`.`)
  - If no: Ask for a different project name
  - If directory is not empty: Show warning "Current directory is not empty. Will create subdirectory '<project-name>/' instead."
- If basename doesn't match: Will create new subdirectory `<project-name>/`

#### Step 1.2: Opening Discovery Question (Always Ask)

Ask the user:
> "Before I set up the project, tell me about what you're building. What problem does it solve and who is it for?"

**If external spec was provided:** Preface with what was extracted from the spec and ask for confirmation/additions instead of starting from scratch.

#### Step 1.3: Analyze Response & Adaptive Follow-up

Parse the user's response to extract:
- **Problem/Purpose:** What the product solves
- **Users/Personas:** Who will use it (types, roles)
- **Workflows:** What users will do (features, actions)
- **Entities:** Domain objects/concepts mentioned
- **Scope:** MVP vs full product indicators
- **Integrations:** Third-party systems mentioned
- **Constraints:** Compliance, scale, or other requirements

**Adaptive Follow-up Rules:**

| If missing... | Ask... | Skip if user mentioned... |
|---------------|--------|---------------------------|
| Users | "Who are the different types of users?" | User types, roles, personas, "for X teams" |
| Workflows | "What are the main things users will do?" | Features, actions, "users can X" |
| Entities | "What are the key objects/concepts in your domain?" | Domain nouns, data types, "manages X" |
| Scope | "Is this an MVP or a more complete product?" | "MVP", "phase 1", "initial", "full" |
| Integrations | "Does this need to connect to other systems?" | APIs, services, "integrates with" |

**Depth Guidelines:**
1. If user's initial answer is comprehensive (covers problem + users + features), skip directly to confirmation
2. If user's answer is brief, ask 2-3 targeted follow-ups from the table above
3. If user says "just set it up" or shows impatience, proceed with minimal discovery
4. **Never ask more than 4-5 questions total** (including the opening question)

#### Step 1.4: Discovery Confirmation (Always Do)

Summarize what was understood:

```
Here's what I understood:

**Product:** <name> [<scope if mentioned>]
**Problem:** <1-2 sentence description of what it solves>
**Users:**
  - <User type 1> (<what they do>)
  - <User type 2> (<what they do>)
**Core Capabilities:**
  - <Capability 1>
  - <Capability 2>
  - <Capability 3>
**Key Entities:** <Entity1>, <Entity2>, <Entity3>
[**Integrations:** <if mentioned>]
[**Constraints:** <if mentioned>]

Did I understand correctly, or would you like to clarify anything?
```

If user provides corrections, update the understanding and re-confirm.

#### Step 1.5: Store Discovery Results

Store the following for use in later phases:
- `product_description`: 1-2 sentence problem statement
- `primary_domain`: Inferred from the main business area
- `user_personas`: List of user types with their primary actions
- `core_workflows`: List of main user capabilities
- `domain_entities`: List of key objects/concepts (for glossary)
- `integrations`: List of third-party systems (if any)
- `constraints`: Compliance, scale, or other requirements (if any)
- `scope`: "mvp" or "full" (if mentioned)

### Phase 2: Technical Recommendation

Based on the discovery results, **recommend** components rather than asking which to choose:

#### Step 2.1: Analyze Requirements

Map discovered information to technical needs:
- **Multiple user types with different capabilities** → Consider separate frontend apps (e.g., admin vs public)
- **Data persistence mentioned** → Database component needed
- **Third-party integrations** → May need specific configuration
- **API/backend workflows** → Server component needed
- **User-facing interface** → Webapp component needed

#### Step 2.2: Present Recommendation

```
Based on what you've described, I recommend:

**Components:**
- **Backend API** - to handle <specific workflows from discovery>
- **Web Frontend** - for <specific user types from discovery>
- **Database** - to persist <specific entities from discovery>
- **Config** - for <integrations or environment settings>
[Additional components with justification based on discovery]

Does this match what you had in mind, or would you like to adjust?
```

#### Step 2.3: Handle Adjustments

If user wants changes:
- Allow adding/removing components
- Validate dependencies (see Component Dependencies below)
- Re-present adjusted recommendation

**Component Dependencies:**
| Component | Requires | Notes |
|-----------|----------|-------|
| Contract | Server | OpenAPI spec needs a backend to implement it |
| Server | Contract | Backend requires API contract |
| Webapp | - | Can work standalone with external API |
| Database | Server | PostgreSQL database for backend data persistence |
| Config | - | Always required for all project types |
| Helm | Server | Kubernetes deployment is for backend services |
| Testing | Server or Webapp | Tests need something to test |
| CI/CD | Server or Webapp | Workflows need something to build/test |

**Validation Rules:**
- Config is always auto-included (required for all project types)
- If Server is selected, Contract is auto-included
- If Helm is selected, Server must be included (Helm is for backend deployment)
- If Contract is selected without Server, warn and ask for confirmation

#### Step 2.4: Multiple Component Instances (If Needed)

If discovery revealed multiple user types that need separate interfaces, or multiple backend services:

**For Webapp components (if multiple user types need different UIs):**
- Ask: "I noticed you have <user-type-1> and <user-type-2>. Should these be separate web apps, or one app with different views?"
- If separate: "What should I call them? (e.g., 'admin', 'public')"
- Creates: `components/webapp-admin/`, `components/webapp-public/`, etc.

**For Server components (if architecture suggests microservices):**
- Ask: "Should the backend be a single service or multiple? (e.g., api + worker)"
- If multiple, for each: "Name for server component N:"
- Creates: `components/server-api/`, `components/server-worker/`, etc.

**Naming Rules:**
- Names must be lowercase
- Use hyphens, not underscores
- No spaces allowed
- Examples: `api`, `worker`, `admin`, `public`, `background-jobs`

**Component Format in Config:**
- Single instance: `"server"` → `components/server/`
- Named instance: `"server:api"` → `components/server-api/`

### Phase 3: Show Configuration Summary

Display a summary that includes **both product context and technical configuration**:

```markdown
## Project Configuration Summary

### Product Understanding

**Name:** <project-name>
**Problem:** <1-2 sentence description from discovery>
**Domain:** <primary_domain>

**Users:**
- <User type 1>: <what they do>
- <User type 2>: <what they do>

**Core Capabilities:**
- <Capability 1>
- <Capability 2>
- <Capability 3>

**Key Domain Entities:** <Entity1>, <Entity2>, <Entity3>
[**Integrations:** <list if any>]
[**Constraints:** <list if any>]

### Technical Configuration

**Location:** <current-directory> OR <current-directory>/<project-name>/

**Components to create:**
- ✓ Contract (OpenAPI spec) - for <entities/workflows it will define>
- ✓ Server (Node.js backend) - to handle <specific workflows>
- ✓ Webapp (React frontend) - for <user types>
- ✓ Database (PostgreSQL) - to persist <entities>
- ✓ Config (YAML configuration)
- ✓ Testing setup
- ✓ CI/CD workflows

### What Will Be Pre-populated

Based on your product description, I'll set up:
- **Glossary:** Pre-populated with <Entity1>, <Entity2>, <Entity3>
- **User Personas:** <User type 1>, <User type 2> documented in specs
- **Initial Use Cases:** Stubs for <Capability 1>, <Capability 2>

### Directory Structure

./
├── README.md
├── CLAUDE.md
├── specs/
│   ├── INDEX.md
│   ├── SNAPSHOT.md
│   ├── external/           # Original external specs (if imported)
│   ├── domain/
│   │   ├── glossary.md (pre-populated with discovered entities)
│   │   ├── definitions/
│   │   │   └── <entity>.md (stub for each discovered entity)
│   │   └── use-cases/
│   │       └── <capability>.md (stub for each capability)
│   ├── architecture/
│   └── changes/
│       └── YYYY/MM/DD/<change-name>/
│           ├── SPEC.md
│           └── PLAN.md
├── components/
│   ├── contract/          # OpenAPI specs (if selected)
│   ├── server/            # Node.js backend (if selected)
│   ├── webapp/            # React frontend (if selected)
│   ├── database/          # PostgreSQL migrations/seeds (if selected)
│   ├── config/            # YAML configuration (if selected)
│   ├── helm/              # Kubernetes deployment (if selected)
│   └── testing/           # Testkube tests (if selected)
└── .github/               # CI/CD workflows (if selected)

**Files to create:** ~XX files
```

### Phase 4: User Approval

**CRITICAL:** Ask the user explicitly:
```
Do you want to proceed with creating this project structure? (yes/no)
```

**DO NOT create any files until the user confirms with "yes" or equivalent.**

If the user says no, ask what they'd like to change and return to Phase 1 (Discovery) or Phase 2 (Technical Recommendation).

### Phase 5: Project Creation (Only After Approval)

#### Step 5.1: Create Project Settings

First, use the `project-settings` skill to create `sdd-settings.yaml` with the project configuration.

**Use the `project-settings` skill with operation `create`:**

```
Input:
  plugin_version: <read from plugin's .claude-plugin/plugin.json>
  project_name: <from Phase 1>
  project_description: <product_description from discovery>
  project_domain: <primary_domain from discovery>
  project_type: <"fullstack" | "backend" | "frontend" | "custom" based on Phase 2 recommendation>
  components:
    contract: <true if selected>
    server: <true if selected>
    webapp: <true if selected>
    database: <true if selected>
    config: <true if selected>
    helm: <true if selected>
    testing: <true if selected>
    cicd: <true if selected>
```

This creates `sdd-settings.yaml` in the project root, which persists the project configuration for use by other commands and workflows.

#### Step 5.2: Scaffold Project Structure

Use the `scaffolding` skill to create the project structure.

**See the `scaffolding` skill for detailed instructions.** Pass the following:
- `project_name`: From Phase 1
- `project_description`: From discovery (product_description)
- `primary_domain`: From discovery (primary_domain)
- `target_dir`: Current directory or subdirectory based on Phase 1 directory check
- `components`: Based on Phase 2 technical recommendation

#### Step 5.3: Populate Domain Knowledge from Discovery

After scaffolding, populate the specs with discovered information:

**1. Update `specs/domain/glossary.md`:**

Add each discovered entity to the glossary:

```markdown
## Entities

| Term | Definition | Related Terms |
|------|------------|---------------|
| <Entity1> | <Brief definition based on discovery context> | <related entities> |
| <Entity2> | <Brief definition based on discovery context> | <related entities> |
...
```

**2. Create entity definition stubs in `specs/domain/definitions/`:**

For each discovered entity, create `specs/domain/definitions/<entity>.md`:

```markdown
---
name: <Entity>
domain: <primary_domain>
status: draft
---

# <Entity>

## Description

<Placeholder based on discovery context - what role this entity plays>

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| (to be defined) | | |

## Relationships

- (to be defined based on discovery)

## States (if applicable)

(to be defined)
```

**3. Create use-case stubs in `specs/domain/use-cases/`:**

For each discovered capability/workflow, create `specs/domain/use-cases/<capability>.md`:

```markdown
---
name: <Capability>
domain: <primary_domain>
actors: <relevant user personas>
status: draft
---

# <Capability>

## Summary

<Placeholder based on discovery - what this capability allows users to do>

## Actors

- <User type from discovery>

## Preconditions

(to be defined)

## Main Flow

1. (to be defined)

## Postconditions

(to be defined)
```

**4. Update `specs/SNAPSHOT.md`:**

Add a product overview section:

```markdown
## Product Overview

**Problem:** <product_description from discovery>

**Target Users:**
- <User type 1>: <what they do>
- <User type 2>: <what they do>

**Core Capabilities:**
- <Capability 1>
- <Capability 2>

**Key Entities:** <Entity1>, <Entity2>, <Entity3>
```

### Step 6: External spec integration (if provided)

If an external spec was provided via `--spec` argument:

#### Step 6.1: Copy external spec to archive

1. Determine the original filename from the external spec path
2. Copy external spec to: `specs/external/<original-filename>`
3. This preserves the original external spec in the repository for reference
4. Display: "✓ Copied external spec to: specs/external/<original-filename>"

#### Step 6.2: Analyze spec for change decomposition

Use the `spec-decomposition` skill to analyze the external spec:

```
Input:
  spec_content: <content of the external spec>
  spec_path: <original path to external spec>
  default_domain: {{PRIMARY_DOMAIN}}
```

The skill returns a `DecompositionResult` with:
- `is_decomposable`: whether the spec can be split into multiple changes
- `changes`: list of identified changes with their metadata
- `shared_concepts`: domain concepts used across changes
- `suggested_order`: recommended implementation sequence
- `warnings`: any issues detected (circular deps, large changes, etc.)

See `skills/spec-decomposition/SKILL.md` for the full algorithm and data structures.

**If `is_decomposable` is false:**
- Display any warnings from the result
- Display: "This spec will be implemented as a single change."
- Skip to Step 6.4 with single change from the result

#### Step 6.3: Present decomposition and get user approval

**If `is_decomposable` is true**, present the decomposition result to the user:

1. **Display any warnings** from the result (circular dependencies, large changes, etc.)

2. **Display the proposed change breakdown** using data from the result:

```
I've identified N changes in this specification:

[c1] change-name (Domain) - feature - COMPLEXITY
     Brief description (1 line)
     Sections: "Section A", "Section B"
     Endpoints: METHOD /path, METHOD /path
     Dependencies: none

[c2] another-change (Domain) - feature - COMPLEXITY
     Brief description
     Sections: "Section C"
     Endpoints: METHOD /path
     Dependencies: c1

...

Shared concepts (will be added to domain glossary):
  - Concept1, Concept2, Concept3

Suggested implementation order: c1 → c2 → c3 → ...

Options:
  [A] Accept this breakdown
  [M] Merge changes (e.g., "merge c2 c3")
  [S] Split a change (e.g., "split c4")
  [R] Rename a change (e.g., "rename c1 new-name")
  [T] Change type (e.g., "type c2 bugfix")
  [K] Keep as single spec (skip decomposition)
  [C] Cancel
```

3. **Handle user adjustments in a loop:**

- **[A] Accept**: Proceed to Step 6.4 with the accepted changes
- **[M] Merge**: Use the merge operation from spec-decomposition skill, re-display result
- **[S] Split**: Ask for split criteria, use split operation from skill, re-display result
- **[R] Rename**: Use rename operation from skill, re-display result
- **[T] Change type**: Update the change type (feature/bugfix/refactor), re-display result
- **[K] Keep as single**: Proceed to Step 6.4 with single change containing all content
- **[C] Cancel**: Display "Initialization cancelled." and exit

Continue the adjustment loop until user accepts or cancels.

#### Step 6.4: Create change specifications

Use the `change-creation` skill to create each change. For each accepted change (or single change if [K] was chosen), invoke the skill with:

```
name: <change-name>
type: <feature|bugfix|refactor>  # Default: feature for decomposed specs
title: <Change Title>
description: <extracted description>
domain: {{PRIMARY_DOMAIN}} or detected domain
issue: TBD
user_stories: <extracted user stories for this change>
acceptance_criteria: <extracted ACs for this change>
api_endpoints: <extracted endpoints for this change>
external_source: ../../external/<original-filename>
decomposition_id: <uuid> (only if multi-change decomposition)
prerequisites: <list of prerequisite change names> (if change has dependencies)
```

The `change-creation` skill will:
1. Create change directory: `specs/changes/YYYY/MM/DD/<change-name>/`
2. Create SPEC.md with proper frontmatter and extracted content
3. Create PLAN.md with type-appropriate phases and prerequisites section
4. Update INDEX.md with the new change entry (includes type indicator)

See `skills/change-creation/SKILL.md` for detailed specification.

#### Step 6.5: Update shared files

Note: INDEX.md is updated by the `change-creation` skill for each change. This step handles additional updates.

1. **Add External Specifications table to INDEX.md:**
   ```markdown
   ## External Specifications

   | Source | Imported | Changes |
   |--------|----------|---------|
   | [<filename>](external/<filename>) | YYYY-MM-DD | change-1, change-2, ... |
   ```

2. **Update SNAPSHOT.md:**
   - Add summary for each change
   - Extract key capabilities from each

3. **Update domain glossary:**
   - Add shared concepts extracted during decomposition
   - Add change-specific terms with definitions

#### Step 6.6: Display completion summary

```
✓ External spec copied to: specs/external/<original-filename>
✓ Created N change specifications:
  - specs/changes/YYYY/MM/DD/change-1/SPEC.md
  - specs/changes/YYYY/MM/DD/change-1/PLAN.md
  - specs/changes/YYYY/MM/DD/change-2/SPEC.md
  - specs/changes/YYYY/MM/DD/change-2/PLAN.md
  ...
✓ Updated INDEX.md, SNAPSHOT.md, and domain glossary

Suggested implementation order: change-1 → change-2 → ...

Next step: Start with the first change:
  /sdd-implement-change specs/changes/YYYY/MM/DD/change-1/PLAN.md
```

### Step 7: Initialize git repository

If not already in a git repository:
```bash
cd ${TARGET_DIR} && git init && git add . && git commit -m "Initial project setup from spec-driven template"
```

If already in a git repository (current directory case):
```bash
git add . && git commit -m "Initial project setup from spec-driven template"
```

### Step 8: Verify completion and report

After ALL steps are done:

1. List the created structure:
   ```bash
   tree ${TARGET_DIR} -L 3 -I node_modules
   ```

2. Display completion message with customized next steps:

   **If external spec was provided (multi-change decomposition):**
   ```
   ✓ Project initialized: <project-name>
   ✓ Location: <absolute-path-to-target-dir>
   ✓ Description: <project-description>
   ✓ Primary Domain: <primary-domain>
   ✓ Components created: <list of selected components>
   ✓ External spec copied to: specs/external/<original-filename>
   ✓ Created N change specifications from external spec

   Changes created (in suggested implementation order):
     1. change-1 (feature): Brief description
     2. change-2 (feature): Brief description
     ...

   Next steps:
   [If TARGET_DIR is not current directory]
   1. cd <project-name>
   2. npm install --workspaces
   [If TARGET_DIR is current directory]
   1. npm install --workspaces
   3. Review the decomposed changes:
      - specs/external/<original-filename> (original external spec)
      - specs/INDEX.md (lists all changes with links)
      - specs/domain/glossary.md (extracted domain terms)
   4. Start implementing the first change:
      /sdd-implement-change specs/changes/YYYY/MM/DD/<first-change>/PLAN.md
   5. After completing each change, proceed to the next in order.
   ```

   **If standard initialization (no external spec):**
   ```
   ✓ Project initialized: <project-name>
   ✓ Location: <absolute-path-to-target-dir>
   ✓ Description: <project-description>
   ✓ Primary Domain: <primary-domain>
   ✓ Components created: <list of selected components>

   Next steps:
   [If TARGET_DIR is not current directory]
   1. cd <project-name>
   2. npm install --workspaces
   [If TARGET_DIR is current directory]
   1. npm install --workspaces
   3. cd components/contract && npm run generate:types
   4. Review and customize:
      - specs/domain/glossary.md (add your domain terms)
      - components/contract/openapi.yaml (define your first API)
   5. Create your first change: /sdd-new-change --type feature --name <change-name>
   ```

**DO NOT STOP until you have completed every single step above and verified the structure.**

## Example Conversations

### Example 1: Comprehensive initial answer (minimal follow-up needed)

```
/sdd-init --name task-tracker

Before I set up the project, tell me about what you're building.
What problem does it solve and who is it for?

> I'm building a task tracker for small engineering teams. Project managers
> create projects and assign tasks, team members update their progress.
> It's an MVP - just core task management with Slack notifications for now.
> Main entities are Teams, Projects, Tasks, and Users.

I extracted a lot from that. Let me confirm I understood:

**Product:** Task Tracker (MVP)
**Problem:** Task management for engineering teams
**Users:**
  - Project managers (create projects, assign tasks)
  - Team members (update progress)
**Core Entities:** Teams, Projects, Tasks, Users
**Integrations:** Slack notifications
**Scope:** MVP - core task management only

Did I understand correctly? [yes/clarify]

> Yes, that's right

Based on this, I recommend:
- **Backend API** - to handle projects, tasks, assignments, notifications
- **Web Frontend** - for managers and team members
- **Database** - to persist teams, projects, tasks, users
- **Config** - for Slack integration settings

Does this match what you had in mind? [yes/adjust]
```

### Example 2: Brief initial answer (follow-ups needed)

```
/sdd-init --name my-app

Before I set up the project, tell me about what you're building.
What problem does it solve and who is it for?

> It's an e-commerce platform

Got it, an e-commerce platform. A few quick questions:

**Who are the users?** (e.g., shoppers, merchants, admins)
> Shoppers buy things, merchants list products, we have internal admins

**What are the main things users will do?**
> Browse products, add to cart, checkout. Merchants manage inventory.

**What are the key entities in your domain?**
> Products, Orders, Users, Inventory, Payments

Here's what I understood:

**Product:** E-commerce Platform
**Users:**
  - Shoppers (browse, purchase)
  - Merchants (list products, manage inventory)
  - Admins (internal operations)
**Core Entities:** Products, Orders, Users, Inventory, Payments
**Core Workflows:** Product browsing, cart, checkout, inventory management

Did I understand correctly? [yes/clarify]
```

### Example 3: User wants to skip discovery

```
/sdd-init --name quick-api

Before I set up the project, tell me about what you're building.
What problem does it solve and who is it for?

> Just set it up, it's a simple REST API

Understood - I'll set up a basic backend API project. You can fill in
the domain details later in the specs.

**Project:** quick-api
**Type:** Backend API
**Domain:** (to be defined)

Proceed with setup? [yes/adjust]
```

## Important Notes

- This command will ALWAYS ask for user approval before creating files
- Users can customize which components to include
- All template variables are populated from user-provided information
- Project structure is created atomically (all or nothing)
- **Product Discovery:** The command now starts with understanding what you're building before asking about technical components. This enables:
  - Pre-populated glossary with discovered domain entities
  - Use-case stubs based on discovered workflows
  - Component recommendations based on actual product needs (not generic presets)
  - Better README and documentation reflecting the actual product
- **External spec support**: When `--spec` is provided, the external spec is:
  - Copied to `specs/external/<original-filename>` for permanent reference
  - Parsed to extract defaults for project setup
  - **Analyzed for multi-change decomposition** using the `spec-decomposition` skill
  - Decomposed into multiple independent changes (user confirms breakdown)
  - Each change gets its own `specs/changes/YYYY/MM/DD/<change-name>/` directory
  - Changes include SPEC.md and PLAN.md with proper frontmatter
  - Dependencies between changes are tracked and suggested implementation order provided
  - User can merge, split, rename, or change type before creation
  - User can choose [K] to keep as single spec (legacy behavior)
  - Shared domain concepts extracted to glossary
  - This allows incremental implementation of large product requirements

## Template Sources

Templates are colocated with their scaffolding skills:

| Skill | Templates | Content |
|-------|-----------|---------|
| `project-scaffolding` | `skills/project-scaffolding/templates/` | Root files, specs, config |
| `backend-scaffolding` | `skills/backend-scaffolding/templates/` | Server component (CMDO) |
| `frontend-scaffolding` | `skills/frontend-scaffolding/templates/` | Webapp component (MVVM) |
| `contract-scaffolding` | `skills/contract-scaffolding/templates/` | OpenAPI contract |
| `database-scaffolding` | `skills/database-scaffolding/templates/` | PostgreSQL database |

The main `scaffolding` skill orchestrates these component skills.
