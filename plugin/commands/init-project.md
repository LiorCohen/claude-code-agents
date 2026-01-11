---
name: init-project
description: Initialize a new project from the spec-driven template.
---

# /project:init-project

Initialize a new spec-driven project.

## Usage

```
/project:init-project [project-name]
```

## Workflow

**CRITICAL**: This command follows an approval-based workflow. Do NOT create any files or directories until the user has approved the project configuration.

### Phase 1: Gather Information

When invoked, prompt the user for the following information:

1. **Project Name** (if not provided as argument)
   - Must be valid directory name (lowercase, hyphens allowed)
   - Example: "my-saas-app"

2. **Project Description**
   - Brief one-line description of what this application does
   - Will be used in README.md and package.json
   - Example: "A task management SaaS application"

3. **Primary Domain**
   - What is the main business domain?
   - Will be added to initial glossary
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
<project-name>/
├── README.md
├── CLAUDE.md
├── specs/
│   ├── INDEX.md
│   ├── SNAPSHOT.md
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

### Step 1: Create root .gitignore first

Create `<project-name>/.gitignore`:
```
node_modules/
.env
.DS_Store
dist/
*.log
```

### Step 2: Create the complete directory structure

Create directories based on selected components:

**Always create:**
```bash
mkdir -p <project-name>/specs/{domain/entities,architecture,features}
mkdir -p <project-name>/components/contract
```

**If Server selected:**
```bash
mkdir -p <project-name>/components/server/src/{server,config,controller,model/{definitions,use-cases},dal,telemetry}
```

**If Webapp selected:**
```bash
mkdir -p <project-name>/components/webapp/src
```

**If Helm selected:**
```bash
mkdir -p <project-name>/components/helm
```

**If Testing selected:**
```bash
mkdir -p <project-name>/components/testing/{tests/{integration,component,e2e},testsuites}
```

**If CI/CD selected:**
```bash
mkdir -p <project-name>/.github/workflows
```

### Step 3: Copy template files with customization

Copy template files with variable substitution using gathered information.

**Variables to replace:**
- `{{PROJECT_NAME}}` → User-provided project name
- `{{PROJECT_DESCRIPTION}}` → User-provided description
- `{{PRIMARY_DOMAIN}}` → User-provided primary domain

**Root files (always create):**
- Copy `templates/project/README.md` → `<project-name>/README.md`
  - Replace `{{PROJECT_NAME}}` and `{{PROJECT_DESCRIPTION}}`
- Copy `templates/project/CLAUDE.md` → `<project-name>/CLAUDE.md`
  - Replace `{{PROJECT_NAME}}`
- Copy `templates/project/package.json` → `<project-name>/package.json`
  - Replace `{{PROJECT_NAME}}` and `{{PROJECT_DESCRIPTION}}`

**Spec files (always create):**
- Copy `templates/specs/INDEX.md` → `<project-name>/specs/INDEX.md`
- Copy `templates/specs/SNAPSHOT.md` → `<project-name>/specs/SNAPSHOT.md`
- Copy `templates/specs/glossary.md` → `<project-name>/specs/domain/glossary.md`
  - Add `{{PRIMARY_DOMAIN}}` as the first domain entry
- Create `<project-name>/specs/architecture/overview.md` with:
  ```markdown
  # Architecture Overview

  This document describes the architecture of {{PROJECT_NAME}}.

  ## Components

  [List selected components and their purposes]
  ```

**Contract component (always create):**
- Copy `templates/components/contract/package.json` → `<project-name>/components/contract/package.json`
  - Replace `{{PROJECT_NAME}}`
- Copy `templates/components/contract/openapi.yaml` → `<project-name>/components/contract/openapi.yaml`
  - Replace `{{PROJECT_NAME}}` and `{{PROJECT_DESCRIPTION}}`
- Create `<project-name>/components/contract/.gitignore`:
  ```
  node_modules/
  generated/
  ```

**Server component (if selected):**
- Copy `templates/components/server/package.json` → `<project-name>/components/server/package.json`
  - Replace `{{PROJECT_NAME}}`
- Copy `templates/components/server/tsconfig.json` → `<project-name>/components/server/tsconfig.json`
- Create `<project-name>/components/server/.gitignore`:
  ```
  node_modules/
  dist/
  .env
  ```
- Create `<project-name>/components/server/src/index.ts` with minimal entry point

**Webapp component (if selected):**
- Copy `templates/components/webapp/package.json` → `<project-name>/components/webapp/package.json`
  - Replace `{{PROJECT_NAME}}`
- Copy `templates/components/webapp/tsconfig.json` → `<project-name>/components/webapp/tsconfig.json`
- Create `<project-name>/components/webapp/.gitignore`:
  ```
  node_modules/
  dist/
  .env
  ```
- Create `<project-name>/components/webapp/src/App.tsx` with minimal React app
- Create `<project-name>/components/webapp/index.html` with basic HTML template
- Create `<project-name>/components/webapp/vite.config.ts` with basic Vite config

**Helm charts (if selected):**
- Create basic Helm chart structure in `<project-name>/components/helm/`

**Testing setup (if selected):**
- Create example Testkube test definitions in `<project-name>/components/testing/`

**CI/CD workflows (if selected):**
- Create basic GitHub Actions workflow in `<project-name>/.github/workflows/ci.yaml`

### Step 4: Initialize git repository

```bash
cd <project-name> && git init && git add . && git commit -m "Initial project setup from spec-driven template"
```

### Step 5: Verify completion and report

After ALL steps are done:

1. List the created structure:
   ```bash
   tree <project-name> -L 3 -I node_modules
   ```

2. Display completion message with customized next steps:
   ```
   ✓ Project initialized: <project-name>
   ✓ Description: <project-description>
   ✓ Primary Domain: <primary-domain>
   ✓ Components created: <list of selected components>

   Next steps:
   1. cd <project-name>
   2. npm install --workspaces
   3. cd components/contract && npm run generate:types
   4. Review and customize:
      - specs/domain/glossary.md (add your domain terms)
      - components/contract/openapi.yaml (define your first API)
   5. Create your first feature: /project:new-feature <feature-name>
   ```

**DO NOT STOP until you have completed every single step above and verified the structure.**

## Important Notes

- This command will ALWAYS ask for user approval before creating files
- Users can customize which components to include
- All template variables are populated from user-provided information
- Project structure is created atomically (all or nothing)

## Template Sources

All template files are in the `templates/` directory of this plugin:
- `templates/project/` - Root project files
- `templates/components/` - Component scaffolding
- `templates/specs/` - Initial spec structure
- `templates/workflows/` - GitHub Actions workflows
