# Changelog

## [1.4.0] - 2026-01-11

### Changed

- **Directory structure**: Features now use date-based organization
  - Feature specs: `specs/features/YYYY/MM/DD/<feature-name>/SPEC.md` (was: `specs/features/<feature-name>/SPEC.md`)
  - Implementation plans: `specs/features/YYYY/MM/DD/<feature-name>/PLAN.md` (was: `specs/plans/YYYY/MM/DD/<feature-name>/PLAN.md`)
  - Plans now live alongside their specs in the same directory
  - Removed separate `specs/plans/` directory

### Updated Files

- **spec-writer agent**: Updated location rules with date-based feature paths
- **planner agent**: Plans now stored alongside specs (not in separate plans/ directory)
- **planning skill**: Updated plan location and template
- **spec-writing skill**: Updated spec locations table with date-based organization
- **new-feature command**: Creates dated feature directories and sets creation date
- **init-project command**: Removed `specs/plans/` from directory structure
- **CLAUDE.md**: Updated examples and Important Files table

### Impact

This change provides better organization and traceability:
- Chronological organization of features by creation date
- Specs and plans kept together in one location
- Easier to find features by when they were created
- Cleaner directory structure (no separate plans directory)
- Relative paths in plans (./SPEC.md) instead of absolute paths

### Migration Guide

For existing projects using the old structure:
- Move `specs/features/<feature-name>/SPEC.md` to `specs/features/YYYY/MM/DD/<feature-name>/SPEC.md`
- Move `specs/plans/YYYY/MM/DD/<feature-name>/PLAN.md` to `specs/features/YYYY/MM/DD/<feature-name>/PLAN.md`
- Use the `created` date from the spec frontmatter for the YYYY/MM/DD directory
- Delete empty `specs/plans/` directory

## [1.3.0] - 2026-01-11

### Enhanced

- **/project:init-project command**: Completely redesigned with approval-based workflow
  - **Phase 1: Gather Information** - Prompts for project details before any file creation
    - Project name and description
    - Primary business domain
    - Tech stack confirmation
    - Component selection (Server, Webapp, Helm, Testing, CI/CD)
  - **Phase 2: Show Configuration Summary** - Displays complete plan with directory structure
  - **Phase 3: User Approval** - Explicitly asks for confirmation before creating any files
  - **Phase 4: Project Creation** - Only executes after user approval
  - Customizable component selection (choose which parts to include)
  - Template variable substitution for project name, description, and domain
  - Conditional directory/file creation based on selected components
  - More predictable and transparent initialization process

### Impact

This update transforms /project:init-project from an automatic file generator into an interactive, approval-based tool:
- No files created until user explicitly approves
- Users can customize which components to include
- Clear visibility into what will be created before it happens
- Follows same approval pattern as spec-writer and planner agents
- Better user experience with informed decision-making

## [1.2.0] - 2026-01-11

### Added

- **typescript-standards skill**: New shared skill for TypeScript coding standards
  - Consolidates strict TypeScript configuration requirements
  - Immutability rules (readonly, ReadonlyArray, spread operators)
  - Arrow functions only rule
  - Native JavaScript only rule (no lodash, ramda, immer)
  - index.ts file rules (only imports/exports)
  - Eliminates ~100 lines of duplication between backend-dev and frontend-dev agents

### Enhanced

- **backend-dev agent**: Now references `typescript-standards` skill instead of duplicating standards
  - Reduced file size by consolidating TypeScript/immutability rules
  - Added Skills section pointing to typescript-standards
- **frontend-dev agent**: Now references `typescript-standards` skill instead of duplicating standards
  - Added Skills section pointing to typescript-standards
- **tester agent**: Simplified by referencing `testing` skill for patterns
  - Removed duplicated spec/issue reference example (kept in testing skill)
  - Removed duplicated Testkube setup information (consolidated in testing skill)
  - Cleaner, more maintainable agent definition
- **testing skill**: Enhanced with comprehensive Testkube information
  - Added detailed Testkube installation instructions
  - Added directory structure documentation
  - Added test definition examples
  - Consolidated running tests commands
  - Now serves as single source of truth for all testing patterns

### Impact

This release significantly reduces code duplication and improves maintainability:
- Created 1 new shared skill (typescript-standards)
- Eliminated ~150 lines of duplicated content across agent files
- Centralized TypeScript standards in one location
- Centralized Testkube documentation in testing skill
- Improved consistency between backend and frontend development

## [1.1.2] - 2026-01-11

### Enhanced

- **CLAUDE.md**: Added strict version management workflow
  - Enforces required sequence: code changes → version bump → CHANGELOG update → commit
  - Prevents version bumps without corresponding CHANGELOG entries
  - Includes example workflow for clarity
  - Makes version management process explicit and mandatory

This ensures all version changes are properly documented before being committed.

## [1.1.1] - 2026-01-11

### Enhanced

- **/project:implement-spec command**: Added comprehensive verification requirements
  - Mandatory full spec and plan review before starting implementation
  - Explicit requirement to read ENTIRE spec and plan documents
  - Create complete mental model before proceeding to implementation
  - Enhanced testing phase with mandatory test execution and pass requirements
  - 6-step final verification process (spec review, testing, functionality, code review, documentation, final report)
  - Clear directive to NOT declare implementation complete until all tests pass and all verification steps are finished
  - Prevents incomplete implementations and ensures thorough validation

### Added

- `.gitignore` file to exclude macOS `.DS_Store` files

This ensures the implement-spec command follows a rigorous, complete workflow that validates all requirements before declaring success.

## [1.1.0] - 2026-01-11

### Added

- **Version management system**: Automatic version bumping across plugin files
  - Updates both `plugin/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`
  - Added to CLAUDE.md instructions for consistency

### Enhanced

- **spec-writer agent**: Added explicit user approval requirements
  - Must get user approval before creating/modifying specifications
  - Prevents unwanted spec changes
- **planner agent**: Added explicit user approval requirements
  - Must get user approval before creating/modifying implementation plans
  - Ensures alignment before planning work

## [1.0.2] - 2026-01-07

### Enhanced

- **backend-dev agent**: Added comprehensive OpenTelemetry guidelines
  - Structured logging with Pino and trace context injection
  - Required log fields and security rules
  - Standard metrics (HTTP, database, business operations)
  - OpenTelemetry semantic conventions for metric naming
  - Custom spans for business operations
  - Span attributes following OTel standards
  - Layer-specific telemetry responsibilities

This ensures all backend implementations follow OpenTelemetry best practices with consistent, observable code.

## [1.0.1] - 2026-01-07

### Enhanced

- **api-designer agent**: Added explicit requirement for `operationId` in camelCase for all endpoints
- **backend-dev agent**: Clarified that controller handler names must match OpenAPI `operationId` with `handle` prefix
- **Template OpenAPI spec**: Added comment showing operationId usage example

This ensures seamless coordination between API design and backend implementation, with clear naming conventions from contract to controller.

## [1.0.0] - 2026-01-07

### Initial Release

Complete spec-driven development plugin for Claude Code.

#### Plugin Structure

**Configuration:**
- `plugin.json` - Main plugin manifest

**Documentation:**
- `README.md` - Plugin overview and features
- `QUICKSTART.md` - Getting started guide
- `CHANGELOG.md` - This file

#### Agents (10 total)

All agents follow the methodology where specs are the source of truth:

1. **spec-writer** (opus) - Creates and maintains markdown specifications
2. **planner** (opus) - Breaks specs into phased implementation plans
3. **api-designer** (sonnet) - Designs OpenAPI contracts in `components/contract/`
4. **frontend-dev** (sonnet) - Implements React components consuming contract types
5. **backend-dev** (sonnet) - Implements Node.js backend with 5-layer architecture
6. **db-advisor** (opus) - Reviews database performance (advisory only)
7. **devops** (sonnet) - Manages Kubernetes, Helm, and Testkube
8. **ci-dev** (sonnet) - Creates CI/CD pipelines
9. **tester** (sonnet) - Writes tests that run via Testkube
10. **reviewer** (opus) - Reviews code for spec compliance and quality

#### Skills (4 total)

Reusable knowledge modules:

1. **spec-writing** - Templates and validation for specifications
2. **planning** - Templates for implementation plans
3. **testing** - Test patterns and Testkube execution
4. **spec-index** - Spec registry and snapshot generation

#### Commands (5 total)

Project lifecycle automation:

1. **/project:init** - Initialize new project from templates
2. **/project:new-feature** - Start new feature with spec and plan
3. **/project:implement-spec** - Orchestrate implementation across agents
4. **/project:verify-spec** - Verify implementation against spec
5. **/project:generate-snapshot** - Regenerate INDEX.md and SNAPSHOT.md

#### Templates

Project scaffolding files:

**Project Root:**
- `README.md` - Project documentation template
- `CLAUDE.md` - Claude Code context template
- `package.json` - Workspace configuration

**Specs:**
- `INDEX.md` - Spec registry template
- `SNAPSHOT.md` - Product snapshot template
- `glossary.md` - Domain terminology template

**Components:**
- `contract/openapi.yaml` - Base OpenAPI specification
- `contract/package.json` - Type generation scripts
- `server/package.json` - Backend dependencies
- `server/tsconfig.json` - Strict TypeScript config
- `webapp/package.json` - Frontend dependencies
- `webapp/tsconfig.json` - React TypeScript config

#### Scripts (3 total)

Python utilities for spec management:

1. **validate-spec.py** - Validates spec frontmatter and format
2. **generate-index.py** - Generates `specs/INDEX.md` from all specs
3. **generate-snapshot.py** - Generates `specs/SNAPSHOT.md` from active specs

All scripts are executable (`chmod +x`).

#### Key Features

- **Contract-First Development**: OpenAPI drives type generation for both frontend and backend
- **5-Layer Backend Architecture**: Server → Config → Controller → Model → DAL
- **Strict TypeScript**: All `readonly`, no mutations, no `any`
- **Kubernetes-Native**: Helm charts and Testkube for environment parity
- **OpenTelemetry**: Built-in observability with logs, metrics, and traces
- **Git as State Machine**: PR = draft, merged to main = active
- **Issue Tracking**: Every spec must reference a tracking issue

#### Tech Stack

- **Backend**: Node.js 20, TypeScript 5, Express
- **Frontend**: React 18, TypeScript 5, Vite
- **Testing**: Vitest (unit), Testkube (integration/E2E)
- **Deployment**: Kubernetes, Helm
- **Observability**: OpenTelemetry, Pino

#### Design Decisions

- 10 specialized agents (not more, not less)
- 5 components: contract, server, webapp, helm, testing
- Required `issue` field in all specs
- Arrow functions only in backend
- Native JavaScript only (no lodash, immer, ramda)
- No implicit global code in frontend
- Testkube for all non-unit tests

#### File Count

- 36 total files created
- 10 agent definitions
- 4 skill definitions
- 5 command definitions
- 14 template files
- 3 utility scripts

### Future Enhancements (Not in v1.0)

The following were explicitly scoped out for future versions:

- MCP (Model Context Protocol) integration
- Custom hooks
- AsyncAPI for event-driven architectures
- Contract testing with Pact
- Additional CI/CD platforms (GitLab, CircleCI)
- Additional deployment targets (AWS ECS, Cloud Run)
