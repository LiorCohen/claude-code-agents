# Changelog

## [1.6.1] - 2026-01-11

### Enhanced

- **backend-dev agent**: Enforced dotenv usage and prohibited direct environment variable access
  - **Mandatory dotenv**: Config layer must use `dotenv.config()` at the top of src/config/index.ts
  - **Config layer ONLY**: `process.env` access is FORBIDDEN outside src/config/
  - **Type-safe configuration**: All layers receive typed Config object, never raw environment variables
  - **Updated Layer 2 (Config)**: Added comprehensive dotenv example with validation and error handling
  - **Updated telemetry/logging**: Logger must receive log level from Config, not process.env
  - **Dependency injection**: BaseLogger created from Config, passed down to all layers
  - Added 6 explicit environment variable rules
  - Added 3 new rules to Rules section

### Updated Files

- **backend-dev agent**:
  - Layer 2 (Config): Added dotenv.config() requirement and comprehensive example
  - Added "Environment Variable Rules" section with 6 rules
  - Updated "Structured Logging" section to use Config instead of process.env
  - Updated "Logging by Layer" section to show baseLogger dependency injection
  - Updated "Build Order" step 2 to emphasize dotenv usage
  - Updated "Rules" section with 3 new rules:
    - dotenv is mandatory
    - NO direct process.env access
    - Type-safe configuration only

### Impact

This enhancement improves configuration management and type safety:
- **Prevents scattered env access**: All environment variables centralized in Config layer
- **Type safety**: Config interface provides compile-time guarantees
- **Validation**: Required env vars validated at startup with clear error messages
- **Testability**: Config can be mocked/injected for testing
- **Security**: Clearer control over environment variable access
- **Best practices**: Follows 12-factor app configuration principles

## [1.6.0] - 2026-01-11

### Enhanced

- **/project:implement-plan command**: Added mandatory domain documentation update phase
  - **New Step 2: Update Domain Documentation** - Required before any code implementation
  - Must update domain docs based on feature spec before writing code:
    1. **Glossary updates** (`specs/domain/glossary.md`): Add/update domain terms and concepts
    2. **Entity documentation** (`specs/domain/entities/`): Create/update entity spec files
    3. **Architecture documentation** (`specs/architecture/`): Update architectural patterns and integration points
  - Includes verification checklist to confirm all documentation areas are addressed
  - Explicitly requires noting when no updates are needed (prevents skipping)
  - Renumbered subsequent steps (Execute Phases → 3, Track Progress → 4, Final Verification → 5)

### Updated Files

- **implement-plan command**:
  - Added comprehensive "Step 2: Update Domain Documentation" with three sub-sections
  - Each sub-section includes specific tasks and verification requirements
  - Added verification checklist with 5 checkboxes
  - Added "Important Notes" section explaining why domain docs must come first
  - Updated example to show domain documentation update workflow
  - Renumbered existing steps (2 → 3, 3 → 4, 4 → 5)

### Impact

This enhancement ensures domain knowledge is properly documented:
- **Prevents implementation drift**: Code cannot be written until domain is documented
- **Centralized knowledge**: Glossary, entities, and architecture serve as single source of truth
- **Improved traceability**: Clear path from spec → domain docs → implementation
- **Better onboarding**: New team members can understand domain through centralized docs
- **Enforces best practices**: Domain-driven design principles built into workflow
- **No shortcuts**: Explicit verification prevents skipping documentation step

## [1.5.1] - 2026-01-11

### Enhanced

- **/project:new-feature command**: Added git branch check and feature branch suggestion
  - **Step 0: Check Git Branch** - New mandatory first step before collecting any information
  - Automatically detects if user is on `main` or `master` branch
  - Suggests creating a feature branch with naming pattern `feature/<feature-name>`
  - Allows user to:
    - Accept suggested branch name (creates branch automatically)
    - Provide custom branch name
    - Decline and proceed on main/master (with warning and confirmation)
  - If already on a feature branch, proceeds without interruption
  - Follows git workflow best practices while maintaining user control

### Updated Files

- **new-feature command**:
  - Added Step 0: Check Git Branch (runs before collecting feature information)
  - Renumbered existing steps (Collect Info → 1, Create Spec → 2, Create Plan → 3, Review → 4)
  - Added "Important Notes" section explaining branch check behavior
  - Added three example interactions showing different scenarios:
    - Example 1: On main branch (creates feature branch)
    - Example 2: Already on feature branch (proceeds normally)
    - Example 3: On main branch (user declines, sees warning)

### Impact

This enhancement encourages proper git workflow:
- Prevents accidental feature creation directly on main/master
- Suggests consistent branch naming convention (`feature/<name>`)
- Educates users about best practices
- Maintains flexibility for users who need to work on main/master
- Reduces risk of merge conflicts and improves code review process

## [1.5.0] - 2026-01-11

### Changed

- **Command renamed**: `/project:implement-spec` → `/project:implement-plan`
  - Better reflects that the command implements from a plan (which references a spec)
  - Command now takes path to PLAN.md instead of SPEC.md
  - Example: `/project:implement-plan specs/features/2026/01/11/user-auth/PLAN.md`

### Updated Files

- **implement-plan command** (renamed from implement-spec.md):
  - Updated command name, description, and usage examples
  - Changed to read PLAN.md first, then SPEC.md from same directory
  - Updated flow documentation to reflect plan-centric approach
- **Documentation files**: Updated all references to use new command name
  - CLAUDE.md
  - plugin/README.md
  - plugin/QUICKSTART.md
  - plugin/templates/project/README.md
  - plugin/templates/project/CLAUDE.md

### Impact

This change clarifies the implementation workflow:
- Plans are the execution documents, specs are the requirements
- Command name now matches what it operates on (plan, not spec)
- Consistent with the pattern where plan references spec via `./SPEC.md`
- More intuitive for users: "implement the plan" vs "implement the spec"

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
