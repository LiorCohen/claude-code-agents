---
name: sdd-init
description: Initialize a new project from the spec-driven template, optionally from an external spec.
---

# /sdd-init

Initialize a new spec-driven project, optionally from an existing external specification.

## Usage

```
/sdd-init [project-name] [--spec <path-to-external-spec>]
```

**Arguments:**
- `project-name` (optional): Name of the project directory to create
- `--spec <path>` (optional): Path to an external specification file to use as the initial spec

**Examples:**
```bash
# Standard initialization with prompts
/sdd-init my-app

# Initialize from existing spec
/sdd-init my-app --spec /path/to/existing-spec.md

# Initialize from external spec (will prompt for project name)
/sdd-init --spec /path/to/product-requirements.md
```

## Workflow

**CRITICAL**: This command follows an approval-based workflow. Do NOT create any files or directories until the user has approved the project configuration.

### Phase 0: Parse Arguments and Load External Spec (if provided)

1. **Parse command arguments:**
   - Check if `--spec <path>` argument is provided
   - Extract project name (if provided)
   - Extract spec path (if provided)

2. **If external spec is provided:**
   - Read the external spec file from the provided path
   - Parse the spec to extract:
     - **Project Name**: Look for title/project name in spec
     - **Description**: Look for description or summary
     - **Domain**: Identify primary business domain from content
     - **Key Entities**: Extract main entities/concepts mentioned
     - **Requirements**: Parse functional and non-functional requirements
   - Store this information for use in later phases
   - Display: "✓ Loaded external spec from: <path>"

3. **Validation:**
   - If spec file doesn't exist, show error and exit
   - If spec file is not readable, show error and exit
   - If spec is empty or invalid, show warning and ask if user wants to continue with standard initialization

### Phase 1: Gather Information

When invoked, prompt the user for the following information (use extracted values from external spec as defaults if available):

1. **Project Name and Directory Check** (if not provided as argument)
   - If external spec provided: Use extracted project name as default
   - Must be valid directory name (lowercase, hyphens allowed)
   - Prompt: "Project name [<default-if-any>]: "
   - Example: "my-saas-app"

   **CRITICAL: Check for existing directory match:**
   - Get the current working directory basename (e.g., if pwd is `/path/to/my-app`, basename is `my-app`)
   - If the current directory basename matches the project name:
     - Check if the directory is empty (no files except hidden files like .git, .DS_Store)
     - If empty: Ask user "You're already in an empty directory named '<project-name>'. Initialize here? (yes/no)"
     - If yes: Set target directory to current directory (`.`)
     - If no: Ask for a different project name
     - If directory is not empty: Show warning "Current directory is not empty. Will create subdirectory '<project-name>/' instead."
   - If basename doesn't match: Will create new subdirectory `<project-name>/`

2. **Project Description**
   - If external spec provided: Use extracted description as default
   - Brief one-line description of what this application does
   - Will be used in README.md and package.json
   - Prompt: "Project description [<default-if-any>]: "
   - Example: "A task management SaaS application"

3. **Primary Domain**
   - If external spec provided: Use extracted domain as default
   - What is the main business domain?
   - Will be added to initial glossary
   - Prompt: "Primary domain [<default-if-any>]: "
   - Example: "Task Management" or "E-commerce" or "Healthcare"

4. **Tech Stack Confirmation**
   - Frontend: React 18 + TypeScript 5 + Vite
   - Backend: Node.js 20 + TypeScript 5 + Express
   - Database: PostgreSQL 15
   - Deployment: Kubernetes + Helm
   - Testing: Vitest + Testkube + Playwright
   - Ask: "Does this tech stack work for your project? (yes/no)"
   - If no, inform user they'll need to customize after initialization

5. **Initial Components**
   - Ask which components to include:
     - [ ] Contract (OpenAPI spec) - Always included
     - [ ] Server (Node.js backend) - Recommended
     - [ ] Webapp (React frontend) - Recommended
     - [ ] Helm (Kubernetes deployment) - Optional
     - [ ] Testing (Testkube setup) - Recommended
     - [ ] CI/CD (GitHub Actions) - Optional

### Phase 2: Show Configuration Summary

Display a summary of what will be created:

```markdown
## Project Configuration Summary

**Name:** <project-name>
**Location:** <current-directory> OR <current-directory>/<project-name>/
**Description:** <description>
**Primary Domain:** <domain>

**Components to create:**
- ✓ Contract (OpenAPI spec)
- ✓ Server (Node.js backend)
- ✓ Webapp (React frontend)
- ✓ Helm charts
- ✓ Testing setup
- ✓ CI/CD workflows

**Directory Structure:**
./
├── README.md
├── CLAUDE.md
├── specs/
│   ├── INDEX.md
│   ├── SNAPSHOT.md
│   ├── external/           # Original external specs (if imported)
│   ├── domain/
│   │   ├── glossary.md (with <domain> as primary domain)
│   │   └── entities/
│   ├── architecture/
│   └── features/
│       └── YYYY/MM/DD/<feature-name>/
│           ├── SPEC.md
│           └── PLAN.md
├── components/
│   ├── contract/          # OpenAPI specs
│   ├── server/            # Node.js backend (if selected)
│   ├── webapp/            # React frontend (if selected)
│   ├── helm/              # Kubernetes deployment (if selected)
│   └── testing/           # Testkube tests (if selected)
└── .github/               # CI/CD workflows (if selected)

**Files to create:** ~XX files
```

### Phase 3: User Approval

**CRITICAL:** Ask the user explicitly:
```
Do you want to proceed with creating this project structure? (yes/no)
```

**DO NOT create any files until the user confirms with "yes" or equivalent.**

If the user says no, ask what they'd like to change and return to Phase 1.

### Phase 4: Project Creation (Only After Approval)

Once approved, execute ALL steps below. Do not stop until every single step is finished.

### Step 1: Determine target directory

Based on the directory check in Phase 1:
- If initializing in current directory: `TARGET_DIR="."`
- If creating subdirectory: `TARGET_DIR="<project-name>"`

If `TARGET_DIR` is not current directory (`.`):
```bash
mkdir <project-name>
```

### Step 2: Create root .gitignore first

Create `${TARGET_DIR}/.gitignore`:
```
node_modules/
.env
.DS_Store
dist/
*.log
```

### Step 3: Create the complete directory structure

Create directories based on selected components:

**Always create:**
```bash
mkdir -p ${TARGET_DIR}/specs/{domain/entities,architecture,features,external}
mkdir -p ${TARGET_DIR}/components/contract
```

**If Server selected:**
```bash
mkdir -p ${TARGET_DIR}/components/server/src/{server,config,controller,model/{definitions,use-cases},dal,telemetry}
```

**If Webapp selected:**
```bash
mkdir -p ${TARGET_DIR}/components/webapp/src
```

**If Helm selected:**
```bash
mkdir -p ${TARGET_DIR}/components/helm
```

**If Testing selected:**
```bash
mkdir -p ${TARGET_DIR}/components/testing/{tests/{integration,component,e2e},testsuites}
```

**If CI/CD workflows selected:**
```bash
mkdir -p ${TARGET_DIR}/.github/workflows
```

### Step 4: Copy template files with customization

Copy template files with variable substitution using gathered information.

**Variables to replace:**
- `{{PROJECT_NAME}}` → User-provided project name
- `{{PROJECT_DESCRIPTION}}` → User-provided description
- `{{PRIMARY_DOMAIN}}` → User-provided primary domain

**Root files (always create):**
- Copy `templates/project/README.md` → `${TARGET_DIR}/README.md`
  - Replace `{{PROJECT_NAME}}` and `{{PROJECT_DESCRIPTION}}`
- Copy `templates/project/CLAUDE.md` → `${TARGET_DIR}/CLAUDE.md`
  - Replace `{{PROJECT_NAME}}`
- Copy `templates/project/package.json` → `${TARGET_DIR}/package.json`
  - Replace `{{PROJECT_NAME}}` and `{{PROJECT_DESCRIPTION}}`

**Spec files (always create):**
- Copy `templates/specs/INDEX.md` → `${TARGET_DIR}/specs/INDEX.md`
- Copy `templates/specs/SNAPSHOT.md` → `${TARGET_DIR}/specs/SNAPSHOT.md`
- Copy `templates/specs/glossary.md` → `${TARGET_DIR}/specs/domain/glossary.md`
  - Add `{{PRIMARY_DOMAIN}}` as the first domain entry
- Create `${TARGET_DIR}/specs/architecture/overview.md` with:
  ```markdown
  # Architecture Overview

  This document describes the architecture of {{PROJECT_NAME}}.

  ## Components

  [List selected components and their purposes]
  ```

**Contract component (always create):**
- Copy `templates/components/contract/package.json` → `${TARGET_DIR}/components/contract/package.json`
  - Replace `{{PROJECT_NAME}}`
- Copy `templates/components/contract/openapi.yaml` → `${TARGET_DIR}/components/contract/openapi.yaml`
  - Replace `{{PROJECT_NAME}}` and `{{PROJECT_DESCRIPTION}}`
- Create `${TARGET_DIR}/components/contract/.gitignore`:
  ```
  node_modules/
  generated/
  ```

**Server component (if selected):**
- Copy `templates/components/server/package.json` → `${TARGET_DIR}/components/server/package.json`
  - Replace `{{PROJECT_NAME}}`
- Copy `templates/components/server/tsconfig.json` → `${TARGET_DIR}/components/server/tsconfig.json`
- Create `${TARGET_DIR}/components/server/.gitignore`:
  ```
  node_modules/
  dist/
  .env
  ```
- Create `${TARGET_DIR}/components/server/src/index.ts` with minimal entry point

**Webapp component (if selected):**
- Copy `templates/components/webapp/package.json` → `${TARGET_DIR}/components/webapp/package.json`
  - Replace `{{PROJECT_NAME}}`
- Copy `templates/components/webapp/tsconfig.json` → `${TARGET_DIR}/components/webapp/tsconfig.json`
- Create `${TARGET_DIR}/components/webapp/.gitignore`:
  ```
  node_modules/
  dist/
  .env
  ```
- Create `${TARGET_DIR}/components/webapp/src/App.tsx` with minimal React app
- Create `${TARGET_DIR}/components/webapp/index.html` with basic HTML template
- Create `${TARGET_DIR}/components/webapp/vite.config.ts` with basic Vite config

**Helm charts (if selected):**
- Create basic Helm chart structure in `${TARGET_DIR}/components/helm/`

**Testing setup (if selected):**
- Create example Testkube test definitions in `${TARGET_DIR}/components/testing/`

**CI/CD workflows (if selected):**
- Create basic GitHub Actions workflow in `${TARGET_DIR}/.github/workflows/ci.yaml`

**External spec integration (if provided):**

If an external spec was provided via `--spec` argument:

1. **Copy external spec to specs/external/:**
   - Determine the original filename from the external spec path
   - Copy external spec to: `specs/external/<original-filename>`
   - This preserves the original external spec in the repository for reference
   - Display: "✓ Copied external spec to: specs/external/<original-filename>"

2. **Create initial feature spec from external spec:**
   - Generate today's date path: `YYYY/MM/DD`
   - Create feature directory: `specs/features/YYYY/MM/DD/initial-spec/`
   - Copy external spec to: `specs/features/YYYY/MM/DD/initial-spec/SPEC.md`
   - Add frontmatter to the spec if not present:
     ```yaml
     ---
     title: Initial Specification (from external source)
     status: active
     domain: {{PRIMARY_DOMAIN}}
     issue: TBD
     created: YYYY-MM-DD
     updated: YYYY-MM-DD
     external_source: ../../external/<original-filename>
     ---
     ```
   - Add a reference section at the top of the spec content:
     ```markdown
     ## External Source

     This specification was imported from an external document: `../../external/<original-filename>`

     Original path: `{{EXTERNAL_SPEC_PATH}}`
     Imported on: YYYY-MM-DD
     ```
   - Preserve all original content from external spec below the reference section

3. **Update INDEX.md:**
   - Add entry for the initial spec:
     ```markdown
     ## Active Specifications

     - [Initial Specification](features/YYYY/MM/DD/initial-spec/SPEC.md) - Imported from external source
     ```
   - Add entry for the external spec:
     ```markdown
     ## External Specifications

     - [<original-filename>](external/<original-filename>) - Original external specification imported on YYYY-MM-DD
     ```

4. **Update SNAPSHOT.md:**
   - Add initial feature summary based on external spec content
   - Extract key capabilities and list them

5. **Update domain glossary:**
   - Extract key terms from external spec
   - Add them to `specs/domain/glossary.md` with definitions

6. **Create initial plan:**
   - Generate `specs/features/YYYY/MM/DD/initial-spec/PLAN.md`
   - Break down external spec requirements into implementation phases
   - Use the `planner` agent pattern for structure

7. **Display confirmation:**
   ```
   ✓ External spec copied to: specs/external/<original-filename>
   ✓ External spec integrated as initial feature specification
   ✓ Location: specs/features/YYYY/MM/DD/initial-spec/SPEC.md
   ✓ Generated initial plan: specs/features/YYYY/MM/DD/initial-spec/PLAN.md
   ✓ Updated INDEX.md and SNAPSHOT.md
   ✓ Extracted domain terms to glossary

   Next step: Review the generated plan and run /sdd-implement-plan specs/features/YYYY/MM/DD/initial-spec/PLAN.md
   ```

### Step 5: Initialize git repository

If not already in a git repository:
```bash
cd ${TARGET_DIR} && git init && git add . && git commit -m "Initial project setup from spec-driven template"
```

If already in a git repository (current directory case):
```bash
git add . && git commit -m "Initial project setup from spec-driven template"
```

### Step 6: Verify completion and report

After ALL steps are done:

1. List the created structure:
   ```bash
   tree ${TARGET_DIR} -L 3 -I node_modules
   ```

2. Display completion message with customized next steps:

   **If external spec was provided:**
   ```
   ✓ Project initialized: <project-name>
   ✓ Location: <absolute-path-to-target-dir>
   ✓ Description: <project-description>
   ✓ Primary Domain: <primary-domain>
   ✓ Components created: <list of selected components>
   ✓ External spec copied to: specs/external/<original-filename>
   ✓ External spec integrated: specs/features/YYYY/MM/DD/initial-spec/SPEC.md

   Next steps:
   [If TARGET_DIR is not current directory]
   1. cd <project-name>
   2. npm install --workspaces
   [If TARGET_DIR is current directory]
   1. npm install --workspaces
   3. Review the imported spec and generated plan:
      - specs/external/<original-filename> (original external spec, preserved for reference)
      - specs/features/YYYY/MM/DD/initial-spec/SPEC.md (imported with SDD frontmatter)
      - specs/features/YYYY/MM/DD/initial-spec/PLAN.md (generated implementation plan)
      - specs/domain/glossary.md (extracted domain terms)
   4. When ready to implement:
      /sdd-implement-plan specs/features/YYYY/MM/DD/initial-spec/PLAN.md
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
   5. Create your first feature: /sdd-new-feature <feature-name>
   ```

**DO NOT STOP until you have completed every single step above and verified the structure.**

## Important Notes

- This command will ALWAYS ask for user approval before creating files
- Users can customize which components to include
- All template variables are populated from user-provided information
- Project structure is created atomically (all or nothing)
- **External spec support**: When `--spec` is provided, the external spec is:
  - Copied to `specs/external/<original-filename>` for permanent reference
  - Parsed to extract defaults for project setup
  - Integrated as the initial feature specification in `specs/features/YYYY/MM/DD/initial-spec/SPEC.md`
  - Referenced in the feature spec via `external_source` frontmatter field
  - Used to generate an implementation plan
  - Processed to extract domain terms for the glossary
  - This allows seamless initialization from existing product requirements, design documents, or specifications while preserving the original source

## Template Sources

All template files are in the `templates/` directory of this plugin:
- `templates/project/` - Root project files
- `templates/components/` - Component scaffolding
- `templates/specs/` - Initial spec structure
- `templates/workflows/` - GitHub Actions workflows
