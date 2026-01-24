# Quick Start Guide

## Installation

### Step 1: Add the Marketplace

First, add the marketplace that contains this plugin:

```
/plugin marketplace add LiorCohen/claude-code-plugins
```

### Step 2: Install the SDD Plugin

Once the marketplace is added, install the SDD plugin:

```
/plugin install sdd@lior-cohen-cc-plugins
```

The plugin will be automatically loaded and all commands will be available.

## Plugin Overview

This plugin implements a complete spec-driven development methodology for full-stack teams.

## Directory Structure

```
sdd/
├── plugin.json                 # Plugin configuration
├── README.md                   # Plugin documentation
├── QUICKSTART.md              # This file
├── agents/                     # 10 specialized agents
│   ├── spec-writer.md
│   ├── planner.md
│   ├── api-designer.md
│   ├── frontend-dev.md
│   ├── backend-dev.md
│   ├── db-advisor.md
│   ├── devops.md
│   ├── ci-dev.md
│   ├── tester.md
│   └── reviewer.md
├── skills/                     # Reusable skills
│   ├── api-design/
│   ├── backend-scaffolding/    # Server templates (colocated)
│   ├── backend-standards/
│   ├── change-creation/
│   ├── contract-scaffolding/   # Contract templates (colocated)
│   ├── epic-planning/
│   ├── frontend-scaffolding/   # Webapp templates (colocated)
│   ├── frontend-standards/
│   ├── planning/
│   ├── project-scaffolding/    # Root/specs templates (colocated)
│   ├── project-settings/
│   ├── scaffolding/            # Orchestrates scaffolding skills
│   ├── spec-decomposition/
│   ├── spec-index/
│   ├── spec-writing/
│   ├── unit-testing/
│   ├── integration-testing/
│   └── e2e-testing/
├── commands/                   # 5 slash commands
│   ├── sdd-init.md
│   ├── sdd-new-change.md
│   ├── sdd-implement-change.md
│   ├── sdd-verify-spec.md
│   └── sdd-generate-snapshot.md
└── scripts/                    # Utility scripts
    ├── validate-spec.py
    ├── generate-index.py
    └── generate-snapshot.py
```

## Getting Started

### 1. Using the Plugin

This plugin is designed to work with Claude Code. Once loaded, you'll have access to:

**Agents:**
- `/agent spec-writer` - Create/update specifications
- `/agent planner` - Create implementation plans
- `/agent api-designer` - Design OpenAPI contracts
- `/agent frontend-dev` - Build React components
- `/agent backend-dev` - Build Node.js backend
- `/agent db-advisor` - Review database design
- `/agent devops` - Configure Kubernetes/Helm
- `/agent ci-dev` - Create CI/CD pipelines
- `/agent tester` - Write tests
- `/agent reviewer` - Code review

**Commands:**
- `/sdd-init --name [name]` - Initialize new project
- `/sdd-new-change --type [type] --name [name]` - Start new change (feature, bugfix, refactor)
- `/sdd-implement-change [path]` - Implement a plan
- `/sdd-verify-spec [path]` - Verify implementation
- `/sdd-generate-snapshot` - Regenerate product snapshot

### 2. Initialize a New Project

```bash
# In Claude Code
/sdd-init --name my-awesome-app
```

This creates:
```
my-awesome-app/
├── specs/                  # Specifications
├── components/
│   ├── config/            # Environment configuration
│   ├── contract/          # OpenAPI API contract
│   ├── server/            # Node.js backend (CMDO architecture)
│   ├── webapp/            # React frontend (MVVM architecture)
│   ├── helm/              # Kubernetes deployment
│   └── testing/           # Testkube tests
└── .github/workflows/     # CI/CD
```

You can also create multiple backend or frontend instances:
```bash
/sdd-init --name my-app --components "server:api,server:worker,webapp:admin,webapp:public"
```

This creates `server-api/`, `server-worker/`, `webapp-admin/`, and `webapp-public/` directories.

### 3. Create Your First Change

**For a new feature:**
```bash
# In Claude Code
/sdd-new-change --type feature --name user-authentication
```

**For a bugfix:**
```bash
/sdd-new-change --type bugfix --name fix-session-timeout
```

**For a refactor:**
```bash
/sdd-new-change --type refactor --name extract-validation-layer
```

This will:
1. Create a spec in `specs/changes/YYYY/MM/DD/<change-name>/SPEC.md`
2. Create a plan in `specs/changes/YYYY/MM/DD/<change-name>/PLAN.md`
3. Update `specs/INDEX.md`

### 4. Implement the Change

```bash
# In Claude Code
/sdd-implement-change specs/changes/YYYY/MM/DD/user-authentication/PLAN.md
```

This orchestrates all agents to:
1. Design API contract (api-designer)
2. Build backend (backend-dev)
3. Build frontend (frontend-dev)
4. Create tests (tester)
5. Review code (reviewer, db-advisor)

### 5. Verify Implementation

```bash
# In Claude Code
/sdd-verify-spec specs/changes/YYYY/MM/DD/user-authentication/SPEC.md
```

## Change Types

The plugin supports three types of changes:

| Type | Purpose | Plan Phases |
|------|---------|-------------|
| `feature` | New functionality | Domain → Contract → Backend → Frontend → Testing → Review |
| `bugfix` | Fix existing behavior | Investigation → Implementation → Testing → Review |
| `refactor` | Code restructuring | Preparation → Implementation → Testing → Review |

## Core Principles

1. **Specs are truth** - Every change has a SPEC.md before code
2. **Issue required** - Every spec references a tracking issue (JIRA, GitHub, etc.)
3. **Git = state machine** - PR = draft, merged to main = active
4. **Contract-first** - OpenAPI spec generates types for both frontend and backend
5. **CMDO backend** - "Commando" architecture: Operator → Controller → Model → DAL
6. **Immutable** - `readonly` everywhere, no mutations
7. **Test in Kubernetes** - Testkube for integration and E2E tests

## Workflow Example

```
┌─────────────────┐
│ 1. Write Spec   │ (spec-writer)
└────────┬────────┘
         ↓
┌─────────────────┐
│ 2. Create Plan  │ (planner)
└────────┬────────┘
         ↓
┌─────────────────┐
│ 3. Design API   │ (api-designer)
└────────┬────────┘
         ↓
┌─────────────────┐
│ 4. Implement    │ (backend-dev, frontend-dev)
└────────┬────────┘
         ↓
┌─────────────────┐
│ 5. Test         │ (tester)
└────────┬────────┘
         ↓
┌─────────────────┐
│ 6. Review       │ (reviewer, db-advisor)
└─────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `specs/INDEX.md` | Registry of all specs with type indicators |
| `specs/SNAPSHOT.md` | Current product state |
| `specs/domain/glossary.md` | Domain terminology |
| `specs/domain/use-cases/` | Business use case definitions |
| `components/contract/openapi.yaml` | API contract |

## Validation

```bash
# Validate single spec
python scripts/validate-spec.py specs/changes/YYYY/MM/DD/my-change/SPEC.md

# Validate all specs
python scripts/validate-spec.py --all --specs-dir specs/

# Generate index
python scripts/generate-index.py --specs-dir specs/

# Generate snapshot
python scripts/generate-snapshot.py --specs-dir specs/
```

## Next Steps

1. Read the full methodology in the original spec document
2. Explore agent definitions in `agents/`
3. Review skill documentation in `skills/`
4. Initialize your first project with `/sdd-init`

## Support

For issues or questions, refer to:
- Plugin README.md
- Agent documentation in `agents/`
- Skill documentation in `skills/`
