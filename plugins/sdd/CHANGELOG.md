# Changelog

## [4.2.0] - 2026-01-24

### Changed

- **sdd-verify-spec command**: Renamed to `/sdd-verify-change`
  - Better naming consistency with the change-centric workflow
  - Updated all references in documentation (README, CLAUDE.md)
  - Updated project scaffolding templates

## [4.1.2] - 2026-01-24

### Changed

- **Directory location**: Moved from `full-stack-spec-driven-dev/` to `plugins/sdd/`
  - Cleaner marketplace structure for multi-plugin support
  - No changes to plugin functionality

## [4.1.1] - 2026-01-24

### Removed

- **QUICKSTART.md**: Merged into README.md to consolidate documentation
  - Added agent invocation syntax table
  - Added workflow diagram
  - Added multiple components example
  - Added plugin structure section
  - Removed redundant content

## [4.1.0] - 2026-01-24

### Changed

- **sdd-implement-plan command**: Renamed to `/sdd-implement-change`
  - Better naming consistency with the change-centric workflow
  - Updated all references in documentation (README, QUICKSTART, CLAUDE.md)
  - Updated project scaffolding templates
  - Updated sdd-init command output messages

## [4.0.0] - 2026-01-24

### Changed

- **sdd-init command**: Complete redesign of initialization workflow
  - **Phase 1**: New Product Discovery phase with adaptive questioning
    - Opens with broad question about what user is building
    - Adaptively asks follow-ups only for missing information
    - Extracts users, workflows, entities, scope, and integrations
    - Never asks more than 4-5 questions total
    - Respects users who want to skip discovery
  - **Phase 2**: Recommendation-based component selection
    - Recommends components based on discovered product needs
    - Justifies each component with specific product context
    - Replaces preset options (A/B/C/D/E) with intelligent recommendations
  - **Phase 3**: Enhanced configuration summary
    - Shows product context alongside technical configuration
    - Displays what will be pre-populated (glossary, personas, use-cases)
  - **Phase 5**: New domain knowledge population step
    - Pre-populates glossary with discovered entities
    - Creates entity definition stubs in `specs/domain/definitions/`
    - Creates use-case stubs in `specs/domain/use-cases/`
    - Updates SNAPSHOT.md with product overview

### Rationale

The previous workflow jumped from "name + one-liner + domain word" to component selection without understanding what the user was building. The new discovery-first approach:
- Understands the product before making technical recommendations
- Pre-populates specs with discovered domain knowledge
- Creates more relevant, context-aware project scaffolds
- Reduces manual work filling in boilerplate domain documentation

## [3.10.0] - 2026-01-24

### Changed

- **Scripts**: Migrated all Python scripts to TypeScript
  - `validate-spec.ts`, `generate-index.ts`, `generate-snapshot.ts`
  - Consolidated duplicated `parse_frontmatter()` into `scripts/lib/frontmatter.ts`
  - Added `scripts/lib/spec-utils.ts` for shared utilities
  - Scripts run via `npx ts-node --esm` (no build step required)

- **Scaffolding skill**: Migrated `scaffolding.py` to `scaffolding.ts`
  - Same functionality, TypeScript implementation
  - Updated SKILL.md with TypeScript invocation examples

### Added

- **TypeScript configuration**: Plugin-level TypeScript support
  - `package.json` with npm scripts for all utilities
  - `tsconfig.json` with strict settings, ESM modules

### Removed

- **Python scripts**: Deleted all Python files from plugin
  - `validate-spec.py`, `generate-index.py`, `generate-snapshot.py`
  - `scaffolding.py`

### Rationale

Reduces environment dependencies - developers already have Node.js and TypeScript installed. No Python required to use the plugin.

## [3.9.0] - 2026-01-24

### Added

- **database-scaffolding skill**: New component type for PostgreSQL database scaffolding
  - Creates `components/database/` with migrations, seeds, and scripts directories
  - Includes `package.json` with npm scripts for migrate, seed, and reset
  - `migrations/001_initial_schema.sql` template with transaction support
  - `seeds/001_seed_data.sql` template demonstrating idempotent patterns
  - Shell scripts: `migrate.sh`, `seed.sh`, `reset.sh` with safety checks
  - `README.md` with usage documentation

- **sdd-init command**: Added "Backend with Database" project type (Option C)
  - Scaffolds contract, server, database, config, testing, and cicd components
  - Database component listed in component dependencies table

- **database component tests**: 30 unit tests covering database scaffolding
  - Skill structure validation
  - Template content verification
  - Scaffolding script integration tests
  - Documentation consistency checks

### Changed

- **scaffolding skill**: Updated to support database component
  - Added database-scaffolding to architecture table
  - Added to available components and presets
  - Updated scaffolding order documentation

- **project-settings skill**: Added database to settings schema
  - Single-instance boolean component (like config, helm)
  - Added to component format documentation

- **planner agent**: Added Database to standard components table
- **backend-dev agent**: Added database component awareness and workflow guidance
- **devops agent**: Added database deployment patterns for Kubernetes

## [3.8.0] - 2026-01-23

### Added

- **postgresql skill**: New SQL-native PostgreSQL database skill
  - SKILL.md with quick reference for common operations
  - 8 reference files covering all major PostgreSQL topics:
    - `deployment.md`: Docker, Docker Compose, Kubernetes deployment
    - `schema-management.md`: Tables, indexes, migrations, partitioning
    - `seed-data.md`: INSERT, COPY, generate_series, test data
    - `permissions-setup.md`: Roles, grants, row-level security
    - `system-views.md`: pg_stat_* monitoring views
    - `introspection-queries.md`: Schema exploration queries
    - `performance-tuning.md`: EXPLAIN, index strategy, configuration
    - `common-errors.md`: Error messages and solutions
  - Version compatibility notes (PostgreSQL 12+)
  - Safety guidelines for production use

- **postgresql tests**: Real usage scenario tests with Docker
  - Deploy PostgreSQL via Docker Compose
  - Create and execute schema migrations
  - Set up roles and permissions
  - Seed data generation
  - Query performance analysis with EXPLAIN
  - Schema introspection
  - Backup script generation

## [3.7.1] - 2026-01-23

### Fixed

- **change-creation skill**: Corrected invalid agent names in plan templates
  - `domain-expert` → `spec-writer`
  - `contract-author` → `api-designer`
  - `backend-developer` → `backend-dev`
  - `frontend-developer` → `frontend-dev`
  - `test-engineer` → `tester`

## [3.7.0] - 2026-01-23

### Added

- **epic-planning skill**: New skill for managing large changes
  - EPIC.md template for epic-level planning
  - Phase-based directory structure (phases/01-contract/, etc.)
  - PR size guidelines (target <400, max 800 lines per PR)
  - Escalation criteria from planning skill

- **backend-scaffolding skill**: New skill with colocated server templates
  - CMDO architecture scaffolding
  - Multi-instance support (server:api, server:worker)
  - Templates moved from templates/components/server/

- **frontend-scaffolding skill**: New skill with colocated webapp templates
  - MVVM architecture scaffolding
  - Multi-instance support (webapp:admin, webapp:public)
  - Templates moved from templates/components/webapp/

- **contract-scaffolding skill**: New skill with colocated contract templates
  - OpenAPI scaffolding and type generation setup
  - Templates moved from templates/components/contract/

- **project-scaffolding skill**: New skill with colocated project templates
  - Root files (README.md, CLAUDE.md, package.json)
  - Specs directory structure
  - Config component templates
  - Templates moved from templates/project/, templates/specs/, templates/components/config/

### Changed

- **scaffolding skill**: Now orchestrates component-specific scaffolding skills
  - Uses `skills_dir` config instead of `template_dir`
  - Legacy support for backward compatibility

- **scaffolding.py**: Updated to use skill-specific template directories
  - ParsedComponent type for multi-instance parsing
  - Component naming: `type:name` format (e.g., server:api → server-api/)

- **project-settings skill**: Added multi-instance component support
  - `server` and `webapp` can be boolean OR list of names
  - Added `get_component_dirs` operation

- **planner agent**: Added epic-planning skill reference and multi-component awareness

- **planning skill**: Added PR size guidelines and escalation to epic-planning

- **spec-decomposition skill**: Added EPIC complexity level and `requires_epic` field

- **sdd-init command**: Updated for multi-component initialization

- **backend-dev, frontend-dev agents**: Added multi-instance working directory notes

- **api-designer agent**: Updated type generation paths for multi-instance

- **devops agent**: Added multi-component support section

- **Documentation**: Updated CLAUDE.md, README.md, QUICKSTART.md
  - Standardized on "CMDO architecture" terminology (was "5-layer")
  - Updated skills listing
  - Added multi-component examples

### Removed

- **templates/ directory**: Moved to skill-specific locations
  - Templates now colocated with their scaffolding skills
  - Better organization and maintainability

### Rationale

This release restructures scaffolding to improve maintainability by colocating templates with their skills, adds support for multiple server/webapp instances in a single project, and introduces epic-level planning for managing large changes that span multiple PRs.

## [3.6.1] - 2026-01-23

### Changed

- **tester agent**: Enhanced with content from removed testing skill
  - Added directory structure, Testkube commands, spec/issue reference pattern
  - References integration-testing and e2e-testing skills only
  - Clarified focus on integration and E2E tests (unit tests by implementors)

### Removed

- **testing skill**: Removed redundant overview skill
  - Content merged into tester agent and specialized skills
  - Three specialized skills (unit-testing, integration-testing, e2e-testing) now cover all patterns

## [3.6.0] - 2026-01-23

### Added

- **unit-testing skill**: New specialized skill for unit testing patterns
  - Mocking strategies (dependency injection, vi.fn, vi.mock)
  - Fixtures and factory functions
  - Test isolation and state management
  - Async testing patterns
  - Discriminated union testing
  - Coverage guidelines and targets

- **integration-testing skill**: New specialized skill for integration testing
  - Database setup and teardown strategies
  - Cleanup patterns (transaction rollback, truncate, surgical delete)
  - API client setup and authentication helpers
  - Seed data management
  - Contract testing
  - Testkube configuration

- **e2e-testing skill**: New specialized skill for end-to-end testing
  - Playwright configuration
  - Page Object Model patterns
  - Test data management via API
  - Visual regression testing
  - Async operation handling
  - Test attributes (`data-testid`)

### Changed

- **backend-dev agent**: Added `unit-testing` skill reference
  - Clarified that backend-dev writes unit tests (not tester agent)

- **frontend-dev agent**: Added full TDD workflow
  - Added TDD Red-Green-Refactor section with frontend-specific examples
  - Added TDD by Layer table (Model, ViewModel, Components)
  - Added `unit-testing` skill reference
  - Updated build order to be TDD-driven
  - Clarified that frontend-dev writes unit tests (not tester agent)

## [3.5.3] - 2026-01-23

### Added

- **frontend-standards skill**: Extracted MVVM architecture from frontend-dev agent into reusable skill
  - Contains full MVVM layer documentation (Model, ViewModel, View)
  - Includes TanStack ecosystem standards (Router, Query, Table, Form)
  - Provides TailwindCSS styling guidelines
  - Documents state management patterns (Query, Zustand, useState, Router)
  - Includes file naming conventions and summary checklist

### Changed

- **frontend-dev agent**: Simplified to reference skills instead of duplicating content
  - Now references `typescript-standards` and `frontend-standards` skills
  - Retains implementation approach and condensed rules
  - Reduced from ~507 lines to ~56 lines

## [3.5.2] - 2026-01-23

### Added

- **Unix signal handling**: Operator now handles signals for graceful shutdown
  - `SIGTERM` - Kubernetes pod termination (preStop hook, scaling down)
  - `SIGINT` - Ctrl+C from terminal (local development)
  - `SIGHUP` - Terminal hangup
  - Signals trigger graceful shutdown with proper connection draining
  - Logs signal received and shutdown completion

### Changed

- **backend-standards skill**: Added signal handling documentation
  - Signal table with sources and actions
  - Updated summary checklist

## [3.5.1] - 2026-01-23

### Added

- **backend-standards skill**: Extracted CMDO architecture from backend-dev agent into reusable skill
  - Contains full CMDO layer documentation (Operator, Config, Controller, Model, DAL)
  - Includes telemetry standards (logging, metrics, spans)
  - Provides infrastructure vs domain separation guidelines

### Changed

- **backend-dev agent**: Simplified to reference skills instead of duplicating content
  - Now references `typescript-standards` and `backend-standards` skills
  - Retains TDD workflow and build order documentation
  - Reduced from ~400 lines to ~115 lines

## [3.5.0] - 2026-01-23

### Changed

- **Architecture**: Renamed from "5-layer" to CMDO ("Commando" - Controller Model DAL Operator)
  - Renamed `src/app/` directory to `src/operator/`
  - Renamed `create_app.ts` to `create_operator.ts`
  - Renamed types: `App` → `Operator`, `AppState` → `OperatorState`, `AppDependencies` → `OperatorDependencies`
  - Updated `src/index.ts` to use `createOperator` instead of `createApp`
  - Logger component name changed from "app" to "operator"

- **Documentation**: Updated all docs to reflect CMDO architecture
  - `backend-dev.md`: Complete rewrite with CMDO architecture, infrastructure vs domain distinction
  - `README.md`: Updated architecture diagrams and layer descriptions
  - `CLAUDE.md`: Updated backend architecture section
  - `QUICKSTART.md`: Updated core principles

### Rationale

The CMDO naming provides clearer semantics:
- **Operator** = provides raw I/O capabilities (DB, HTTP clients, cache) - NO domain knowledge
- **Config** = provides URLs and settings
- **Controller** = combines I/O + config for domain-specific operations
- **Model** = pure business logic with injected Dependencies

This separation clarifies that Operator handles infrastructure while Controller handles domain concerns.

## [3.4.2] - 2026-01-23

### Changed

- **Telemetry**: Moved into App module
  - Removed `src/telemetry/` directory
  - Added `src/app/logger.ts` and `src/app/metrics.ts`
  - Logger is now created inside `createApp()` as the first operation
  - Simplified `src/index.ts` entry point (only passes config to createApp)
  - App module now owns all telemetry initialization

## [3.4.1] - 2026-01-23

### Fixed

- **Documentation**: Updated architecture diagrams and descriptions
  - Changed "Server layer" to "App layer" in all documentation (CLAUDE.md, README.md, QUICKSTART.md)
  - Added lifecycle probes documentation (port 9090 for Kubernetes health checks)
  - Fixed "5-layer backend" description to show correct flow: App → Controller → Model → Dependencies → DAL

## [3.4.0] - 2026-01-23

### Added

- **Lifecycle probes**: Separate HTTP server for Kubernetes health checks
  - New `lifecycle_probes.ts` module with `/health` and `/readiness` endpoints
  - Runs on dedicated port (default 9090, env var `PROBES_PORT`)
  - `/health` - Always returns 200 when process is alive (for startupProbe/livenessProbe)
  - `/readiness` - Returns 200 only when app state is `RUNNING` (for readinessProbe)
  - Probes server starts first (before database) and stops last (after database)

### Changed

- **State machine**: Added `STARTING:PROBES` and `STOPPING:PROBES` states
  - New startup order: PROBES → DATABASE → HTTP_SERVER
  - New shutdown order: HTTP_SERVER → DATABASE → PROBES
  - Probes available before app is fully ready (for Kubernetes startup checks)

- **HTTP server**: Removed health endpoints from main API server
  - Health checks now handled by dedicated lifecycle probes server
  - Main server focuses solely on API routes

- **Config**: Added `probesPort` configuration
  - Default: 9090
  - Environment variable: `PROBES_PORT`

## [3.3.0] - 2026-01-23

### Changed

- **Test suite**: Rewritten from bash to Python
  - Added `conftest.py` with test framework (ClaudeResult, TestProject classes)
  - Converted all test files to pytest format
  - Added `pytest.ini` and `requirements.txt`
  - Updated `run-all-tests.sh` to use pytest

- **App module refactor**: Consolidated app lifecycle management
  - Moved `create_database.ts` into `app/` module (database is internal to app)
  - Renamed `http_server.ts` to `create_http_server.ts` for consistency
  - Added `state_machine.ts` for generic async state machine implementation

- **State machine with substates**: Improved app lifecycle states
  - States use colon convention for substates: `STARTING:DATABASE`, `STARTING:HTTP_SERVER`, etc.
  - Async transitions with `Promise<void>` return type
  - Auto-transition to first substate when transitioning to parent state
  - Exhaustive switch handling in `onTransition` callback

- **Dependency injection improvements**:
  - App receives `logger: pino.Logger` instead of using console
  - Modules create their own child loggers internally
  - DAL functions use `.bind(null, deps)` for cleaner partial application
  - ID generation moved internal to DAL (not a dependency)

- **Module encapsulation**: Only `createApp` exported from app module

## [3.2.1] - 2026-01-22

### Changed

- **Database module**: Extracted database connection to separate `db/` module
  - `create_database.ts` - Factory function with in-memory implementation
  - App layer now receives database via dependency injection
  - Clear TODO showing how to replace with real database (pg, mysql2, etc.)
  - Proper wiring: index.ts → createDatabase → createApp → DAL functions

## [3.2.0] - 2026-01-22

### Changed

- **Templates simplified**: Replace complex User CRUD with simple Greeting API
  - Contract: `POST /greetings` and `GET /greetings/{id}` endpoints
  - Server: Clean 5-layer architecture (App → Controller → Model → Dependencies → DAL)

- **Webapp MVVM structure**: Proper Model-View-ViewModel architecture
  - Model: `api/greetings.ts` - API client matching OpenAPI contract
  - ViewModel: `hooks/use-greetings.ts` - TanStack Query hooks for state management
  - View: `pages/` and `components/` directories with sidebar navigation
  - Interactive greeter page demonstrating full-stack flow

### Fixed

- **TypeScript module resolution**: Changed from NodeNext to ESNext/Bundler
  - Imports no longer require `.js` extensions
  - Added `tsconfig.node.json` for webapp Vite config
- **Server template type errors**: Fixed null checks in DAL functions
- **Integration test**: Fixed MARKETPLACE_DIR path for plugin discovery

## [3.1.0] - 2026-01-21

### Added

- **project-settings skill**: New skill to manage `sdd-settings.yaml` for persisting project configuration
  - Operations: `create`, `read`, `update`
  - Stores plugin version, project metadata, and component selections
  - Git-tracked file in project root

### Changed

- **sdd-init command**: Now uses `project-settings` skill to persist configuration
  - Creates `sdd-settings.yaml` before scaffolding (Step 4.1)
  - Settings available for use by other commands and workflows

## [3.0.1] - 2026-01-21

### Changed

- **Skill directory renames for consistency**
  - `skills/scaffold/` → `skills/scaffolding/`
  - `skills/spec-decomposer/` → `skills/spec-decomposition/`
  - `scaffold.py` → `scaffolding.py`
  - `scaffold.md` → `SKILL.md` (consistent with other skills)

- **Updated all references** in sdd-init.md, QUICKSTART.md, and skill files

## [3.0.0] - 2026-01-21

### Breaking Changes

- **"Change" abstraction replaces "feature"**: All spec-driven workflows now use the "Change" concept
  - Changes can be typed: `feature`, `bugfix`, or `refactor`
  - Directory structure: `specs/features/` → `specs/changes/`
  - Command renamed: `/sdd-new-feature` → `/sdd-new-change --type <type> --name <name>`
  - INDEX.md format: Single list with type indicator instead of separate sections

- **Skill renamed**: `feature-creation` → `change-creation`
  - New required `type` parameter: `feature`, `bugfix`, or `refactor`
  - Type-specific SPEC.md templates with appropriate sections
  - Type-specific PLAN.md templates with streamlined phases for bugfix/refactor

### Added

- **Type-specific SPEC.md templates**
  - `feature`: User stories, acceptance criteria, API contract, domain concepts
  - `bugfix`: Bug description, symptoms, steps to reproduce, root cause, affected areas
  - `refactor`: Refactoring goals, current state, proposed changes, risks

- **Type-specific PLAN.md templates**
  - `feature`: Full 6-phase structure (Domain → Contract → Backend → Frontend → Testing → Review)
  - `bugfix`: Streamlined 4-phase (Investigation → Implementation → Testing → Review)
  - `refactor`: Streamlined 4-phase (Preparation → Implementation → Testing → Review)

- **Change type adjustment in sdd-init decomposition**
  - New option `[T] Change type` to modify decomposed change types

### Changed

- **sdd-new-change command** (formerly sdd-new-feature)
  - Requires `--type` and `--name` arguments
  - Type-specific information prompts (e.g., symptoms for bugfix, goals for refactor)
  - Branch suggestions use type prefix (e.g., `feature/name`, `bugfix/name`, `refactor/name`)

- **sdd-init command**
  - External spec decomposition now outputs "changes" instead of "features"
  - Creates `specs/changes/` directory structure
  - INDEX.md template updated with type column

- **spec-decomposer skill**
  - Output structure: `features` → `changes` in DecompositionResult
  - DecomposedChange includes `type` field (defaults to `feature`)
  - Change IDs: `f1, f2, ...` → `c1, c2, ...`

- **planner agent**
  - Plan location: `specs/changes/YYYY/MM/DD/<change-name>/PLAN.md`
  - Added Change Types table documenting type-specific phase structures

- **planning skill**
  - Added templates for bugfix and refactor plan types
  - Updated plan location to `specs/changes/`

- **scaffold templates**
  - `specs/features/` → `specs/changes/` in directory creation
  - INDEX.md template includes Type column

### Migration Guide

For existing projects using the 2.x structure:
1. Rename `specs/features/` directory to `specs/changes/`
2. Update INDEX.md to include Type column
3. Add `type: feature` to existing SPEC.md and PLAN.md frontmatter
4. Update any scripts or documentation referencing `/sdd-new-feature`

## [2.3.0] - 2026-01-21

### Added

- **Multi-feature decomposition for external specs**
  - `skills/spec-decomposer/SKILL.md`: Pure analysis skill that takes spec content and returns structured decomposition result
  - Identifies features based on: section headers, API namespaces, user story clusters, domain entities
  - Detects dependencies between features and suggests implementation order
  - Returns `DecompositionResult` with features, shared concepts, warnings, and suggested order
  - Supports merge/split/rename operations on the result
  - When `sdd-init --spec` is used:
    - Calls spec-decomposer skill to analyze the spec
    - Presents results to user for approval (merge, split, rename, accept, or keep as single)
    - Creates feature directories using feature-creation skill
  - Each feature gets its own `specs/features/YYYY/MM/DD/<feature-name>/` directory with SPEC.md and PLAN.md
  - INDEX.md tracks all features with External Specifications table

- **Feature creation skill for reusable feature scaffolding**
  - `skills/feature-creation/SKILL.md`: Centralized logic for creating feature specs and plans
  - Creates feature directory, SPEC.md, PLAN.md, and updates INDEX.md
  - Supports optional parameters: external_source, decomposition_id, prerequisites
  - Used by both `/sdd-init --spec` and `/sdd-new-feature`

### Changed

- **sdd-init Step 5 restructured**: Now has substeps 5.1-5.6 for decomposition workflow
- **sdd-new-feature simplified**: Steps 4-6 now reference the `feature-creation` skill

## [2.2.2] - 2026-01-21

### Changed

- **sdd-init requires --name argument**: Shows usage when invoked without arguments instead of starting interactive prompts. `--name` is now required.

## [2.2.1] - 2026-01-21

### Changed

- **sdd-init deduplication**: Removed redundant scaffold instructions, now references scaffold skill for details. Fixed step numbering.

## [2.2.0] - 2026-01-21

### Added

- **Scaffold skill for fast project creation**
  - `skills/scaffold/scaffold.py`: Python script that creates project structure in seconds
  - `skills/scaffold/scaffold.md`: Skill documentation
  - Reduces /sdd-init scaffolding time from ~5 minutes to ~5 seconds
  - Creates 30 directories and 54 files with variable substitution

### Changed

- **sdd-init now uses scaffold skill**: Phase 4 calls Python script instead of file-by-file creation

## [2.1.0] - 2026-01-21

### Added

- **Plugin test framework**
  - `tests/test-helpers.sh`: Core utilities for running Claude and asserting results
  - `tests/run-all-tests.sh`: Test runner with fast/integration/all modes
  - `tests/fast/test-sdd-init.sh`: Verifies /sdd-init creates expected project structure
  - `tests/fast/test-sdd-new-feature.sh`: Verifies correct agents are invoked
  - `tests/integration/test-full-stack-init.sh`: Full workflow test (init → build → run)
  - `tests/prompts/`: Test input prompts for automated testing
  - Based on approach from obra/superpowers repository using `claude -p` with stream-json output

## [2.0.6] - 2026-01-21

### Added

- **Runnable hello world templates**
  - Server: Working Express server with `/health` endpoint
  - Server: Added `dotenv` dependency
  - Webapp: Added `index.html` entry point
  - Webapp: Added `vite.config.ts` with React plugin and API proxy
  - Webapp: Added `tailwind.config.js` and `postcss.config.js`
  - Webapp: Added Tailwind CSS dependencies (`tailwindcss`, `postcss`, `autoprefixer`)
  - Updated `sdd-init.md` to copy new template files

## [2.0.5] - 2026-01-19

### Changed

- **Config component is now always required**
  - Config is auto-included for all project types (Full-Stack, Backend API, Frontend Only, Custom)
  - Added Config to "Frontend Only" project type
  - Changed Config dependency from "Server" to "-" (no dependencies)
  - Updated validation rules: Config is always auto-included
  - Config directory and files are now created in "Always create" section

## [2.0.4] - 2026-01-19

### Fixed

- **Helm and Config component dependencies**: Corrected to require Server only
  - Helm requires Server (Kubernetes deployment is for backend services)
  - Config requires Server (frontend config is handled differently)
  - Removed "or Webapp" from Helm and Config dependencies

## [2.0.3] - 2026-01-19

### Changed

- **sdd-init component selection with dependencies**
  - Replaced flat component list with project type options:
    - **Full-Stack Application**: Contract, Server, Webapp, Config, Testing, CI/CD
    - **Backend API Only**: Contract, Server, Config, Testing, CI/CD
    - **Frontend Only**: Webapp, Testing, CI/CD
    - **Custom**: Manual selection with dependency validation
  - Added component dependency table (e.g., Contract requires Server, Helm requires Server)
  - Added validation rules to prevent invalid combinations
  - Contract is no longer "always included" - only with Server
  - Integrated Config component into sdd-init workflow

## [2.0.2] - 2026-01-19

### Added

- **`sdd_version` field required in all specs and plans**
  - Added to frontmatter requirements in `spec-writing` skill
  - Added to plan template in `planning` skill
  - Updated `spec-writer` agent to include version requirement
  - Updated `planner` agent to include version in generated plans
  - Updated `sdd-new-feature` command to read and inject plugin version
  - Updated `sdd-init` command to include version in imported specs

### Rationale

Tracking the SDD plugin version in specs and plans enables:
- **Compatibility tracking**: Know which plugin version generated a spec
- **Migration support**: Identify specs that may need updating after plugin changes
- **Debugging**: Trace issues to specific plugin versions

## [2.0.1] - 2026-01-19

### Added

- **Config component template** (`templates/components/config/`)
  - JSON Schema for configuration validation (`schemas/schema.json`)
  - Separate schemas for ops config (`ops-schema.json`) and app config (`app-schema.json`)
  - Environment-specific YAML configs: `config.yaml` (base), `config-local.yaml`, `config-testing.yaml`, `config-production.yaml`
  - Ops config covers: server, database, logging, telemetry
  - App config is extensible per project (no predefined semantics)

**Note:** This component is not yet active. Missing:
- Agent for config management
- Skill for config validation
- Integration with sdd-init command

## [2.0.0] - 2026-01-19

### Breaking Changes

- **Renamed Server layer to App layer** in backend 5-layer architecture
  - `src/server/` directory → `src/app/`
  - `createServer` function → `createApp`
  - `Server` type → `App` type
  - Updated all references in backend-dev agent
  - Updated sdd-init command directory creation and file copy paths
  - Updated template files with new naming

### Migration Guide

For existing projects using the 1.x structure:
1. Rename `src/server/` directory to `src/app/`
2. Rename `create_server.ts` to `create_app.ts`
3. Update function name `createServer` → `createApp`
4. Update type names `Server` → `App`, `ServerDependencies` → `AppDependencies`
5. Update imports in `src/index.ts`: `import { createApp } from './app'`

### Rationale

The "Server" layer name was confusing because it conflicted with the "server" component name (`components/server`). Renaming to "App" provides:
- **Clarity**: Clear distinction between the component (`components/server`) and the layer (`src/app/`)
- **Consistency**: App layer creates and manages the application lifecycle
- **Semantic accuracy**: The layer handles more than just HTTP server concerns (middleware, routes, graceful shutdown, database connections)

## [1.10.29] - 2026-01-18

### Added

- **TDD Red-Green-Refactor methodology** to backend-dev agent
  - The Cycle: RED (failing test) → GREEN (minimal code) → REFACTOR
  - TDD by Layer table: test locations for Model, DAL, Controller, Server
  - TDD Rules: file naming, fake dependencies, behavior-focused tests
  - Updated Build Order to integrate RED/GREEN steps

## [1.10.28] - 2026-01-18

### Fixed

- **QUICKSTART.md installation commands**: Use correct Claude Code plugin syntax
  - Step 1: `/plugin marketplace add LiorCohen/claude-code-plugins`
  - Step 2: `/plugin install sdd@lior-cohen-cc-plugins`

## [1.10.27] - 2026-01-18

### Changed

- **QUICKSTART.md installation steps**: Split into two clear steps
  - Step 1: Install the marketplace (`claude mcp add-json`)
  - Step 2: Install the SDD plugin from marketplace (`claude plugin install sdd --marketplace`)

## [1.10.26] - 2026-01-18

### Changed

- **Server layer owns DB connections**: Clarified database connection handling
  - Server layer creates connection pool on startup using Config values
  - Passes database client to Controller (which passes to DAL via Dependencies)
  - Closes connections on graceful shutdown

## [1.10.25] - 2026-01-18

### Added

- **Controller http_handlers structure**: Clarified controller layer organization
  - Added `http_handlers/` directory with one file per API namespace
  - Each handler file exports a router (e.g., `usersRouter`)
  - `create_controller.ts` assembles routers and creates Dependencies for Model
  - Added template files: `http_handlers/users.ts`, `http_handlers/index.ts`
  - Updated `create_controller.ts` to use the new structure

## [1.10.24] - 2026-01-18

### Changed

- **Refined backend-dev.md**: Keep explanations, remove inline code examples (305 lines)
  - Preserved all verbal explanations, rules, and guidelines
  - Removed inline code examples (now in template files)
  - Each layer section points to its template for code patterns
  - Kept directory structure diagrams (not code)
  - Kept all tables (log levels, metrics, span attributes, etc.)

## [1.10.23] - 2026-01-18

### Changed

- **Restored backend-dev.md explanatory content**: Reverted over-consolidation that removed essential guidance
  - Restored detailed layer explanations with code examples
  - Restored Definitions Rules (TypeScript types only, no Zod)
  - Restored Use Case Pattern and DAL Function Pattern examples
  - Restored complete Telemetry section (logging, metrics, spans)
  - Added template references to each layer section while preserving explanations
  - File now 680 lines with full guidance + template references

## [1.10.22] - 2026-01-18

### Changed

- **Consolidated backend-dev.md**: Reduced from 663 to 142 lines by removing redundancies
  - Merged Templates table and Layer Overview into single Architecture table
  - Replaced inline code examples with template file references
  - Removed redundant TypeScript Standards section (now references `typescript-standards` skill)
  - Consolidated duplicate environment variable rules
  - Simplified Telemetry section with table format

## [1.10.21] - 2026-01-18

### Added

- **Server templates**: Added comprehensive template files for all 5 backend layers
  - `model/` - definitions, dependencies, use-cases with example user CRUD
  - `dal/` - data access functions (find_user_by_id, find_user_by_email, insert_user)
  - `controller/` - request/response handling with health check endpoints
  - `telemetry/` - OpenTelemetry logging and metrics setup
  - Updated `index.ts` to import telemetry first

## [1.10.20] - 2026-01-18

### Removed

- **Debug banners**: Removed banner printing instructions from all agents and skills
  - Removed from 10 agents: api-designer, backend-dev, ci-dev, db-advisor, devops, frontend-dev, planner, reviewer, spec-writer, tester
  - Removed from 5 SDD skills: planning, spec-index, spec-writing, testing, typescript-standards
  - Removed from marketplace commit skill

## [1.10.19] - 2026-01-17

### Changed

- **Refactored MVVM architecture**: Moved models from root-level directory to page-specific files
  - Removed `src/models/` directory from frontend structure
  - Each page now contains its own model file (e.g., `user_profile_model.ts`)
  - Models contain page-specific business logic (data transformation, validation, domain rules)
  - Services (`src/services/`) remain shared for API communication
  - Updated Page Structure example to show model file usage with ViewModel integration

### Rationale

Page-specific models provide:
- **Colocation**: Business logic lives alongside its View and ViewModel
- **Clarity**: Each page's model contains only relevant logic
- **Simplicity**: No need for a shared models directory with unclear ownership
- **Consistency**: Follows the same pattern as page-specific ViewModels

## [1.10.18] - 2026-01-17

### Changed

- **Simplified plugin.json**: Removed explicit commands, agents, and skills arrays - Claude Code auto-discovers these from directory structure

## [1.10.17] - 2026-01-17

### Added

- **Explicit agents and skills paths in plugin.json**: Added `agents` and `skills` directory references to plugin manifest for better plugin discovery

## [1.10.16] - 2026-01-17

### Changed

- **Reorganized skills into dedicated folders**: Each skill now has its own directory
  - `skills/<skill-name>.md` → `skills/<skill-name>/SKILL.md`
  - Prepares for skills to have additional resources (templates, examples)

## [1.10.15] - 2026-01-17

### Added

- **Debug banners for agents and skills**: All agents and skills now print a colorful banner when invoked
  - Agents display: `🤖 AGENT: <name>` with description
  - Skills display: `🔧 SKILL: <name>` with description
  - Helps identify which agents/skills are active during command execution

## [1.10.14] - 2026-01-17

### Changed

- **Renamed commands from `/project:<command>` to `/sdd-<command>`**: Updated all command references
  - `/project:init` → `/sdd-init`
  - `/project:new-feature` → `/sdd-new-feature`
  - `/project:implement-plan` → `/sdd-implement-plan`
  - `/project:verify-spec` → `/sdd-verify-spec`
  - `/project:generate-snapshot` → `/sdd-generate-snapshot`
  - Updated command files and project templates

## [1.10.13] - 2026-01-17

### Changed

- **Extracted inline templates to templates/ directory**: Code templates now live in separate files
  - Server templates: `src/index.ts`, `src/config/load_config.ts`, `src/config/index.ts`, `src/server/create_server.ts`, `src/server/index.ts`, `.gitignore`
  - Webapp templates: `src/main.tsx`, `src/app.tsx`, `src/index.css`, `.gitignore`
  - sdd-init.md now references template files instead of inline code blocks
  - Renamed `App.tsx` to `app.tsx` to follow lowercase naming convention

### Rationale

Extracting templates to separate files provides:
- **Maintainability**: Templates can be edited as real TypeScript files with IDE support
- **Testability**: Template files can be validated independently
- **Clarity**: sdd-init.md is more concise and easier to read

## [1.10.12] - 2026-01-17

### Fixed

- **Moved `dotenv.config()` inside `loadConfig()` function**: Fixed side effect on import
  - `dotenv.config()` is now called inside `loadConfig()`, not at module level
  - Config module has no side effects when imported
  - Only `src/index.ts` has side effects (application entry point)
  - Updated both `backend-dev` agent and `sdd-init` command

- **Changed `interface` to `type` in code templates**: Consistency with typescript-standards
  - Config and Server types now use `type` with `Readonly<>` wrapper
  - Follows the pattern shown in typescript-standards examples

- **Clarified entry point exception**: `src/index.ts` is allowed to have side effects as application entry point
  - This is an explicit exception to the "index.ts exports only" rule
  - Application entry points need to run code on import

- **Moved logic out of module index.ts files**: All index.ts files now contain only exports
  - `src/config/load_config.ts` contains the `loadConfig` function and `Config` type
  - `src/config/index.ts` re-exports from `load_config.ts`
  - `src/server/create_server.ts` contains the `createServer` function
  - `src/server/index.ts` re-exports from `create_server.ts`
  - Updated both `backend-dev` agent and `sdd-init` command

### Rationale

These fixes ensure all code templates follow the established standards:
- **Testability**: Modules can be imported in tests without triggering side effects (except entry point)
- **Standards compliance**: All `index.ts` files contain only exports (except application entry point)

## [1.10.11] - 2026-01-17

### Removed

- **sdd-init command**: Removed tech stack confirmation prompt
  - The tech stack is fixed (React, Node.js, TypeScript, PostgreSQL, Kubernetes)
  - No need to ask for confirmation since it cannot be changed during init
  - Streamlines the initialization flow

## [1.10.10] - 2026-01-17

### Changed

- **sdd-init command**: Changed argument syntax from positional to named
  - Project name now uses `--name <project-name>` instead of positional argument
  - Examples updated: `/sdd-init --name my-app` instead of `/sdd-init my-app`
  - Consistent with `--spec` argument style

### Rationale

Named arguments provide:
- **Clarity**: Explicit intent when specifying project name
- **Consistency**: Both arguments now use `--` prefix style
- **Flexibility**: Arguments can be provided in any order

## [1.10.9] - 2026-01-16

### Enhanced

- **sdd-init command**: Now follows `backend-dev` agent and `typescript-standards` skill when generating code
  - Added CRITICAL note requiring all generated code to follow agent/skill standards
  - Server component: Generates proper 5-layer architecture scaffolding
    - Minimal `src/index.ts` entry point (only file with side effects)
    - `src/config/index.ts` with dotenv and type-safe config
    - `src/server/index.ts` with server factory pattern
  - Webapp component: Generates MVVM architecture scaffolding
    - Creates full MVVM directory structure (`pages/`, `components/`, `viewmodels/`, `models/`, `services/`, `stores/`, `types/`, `utils/`)
    - `src/main.tsx` entry point
    - `src/App.tsx` with TailwindCSS
    - `src/index.css` with Tailwind directives
    - Tailwind config file
  - All generated TypeScript follows `typescript-standards` (readonly, arrow functions, named exports)

### Rationale

Ensuring sdd-init follows the same standards as implementation:
- **Consistency**: Initial scaffolding matches what implementation phases produce
- **No refactoring needed**: Developers don't need to restructure after init
- **Learning**: New developers see correct patterns from the start
- **Standards enforcement**: Agent/skill rules apply from day one

## [1.10.8] - 2026-01-16

### Added

- **planning skill**: Added Phase 0 (Domain Documentation) as mandatory prerequisite
  - Phase 0 MUST be completed before any code implementation begins
  - Tasks: Update glossary, create/update definition specs, document use cases, update architecture docs
  - Includes verification checklist to ensure all domain concepts are documented
  - Phases renumbered: Domain Documentation (0) → API Contract (1) → Backend (2) → Frontend (3) → Testing (4) → Review (5)

- **sdd-implement-plan command**: Updated to explicitly reference Phase 0
  - Step 2 now titled "Execute Phase 0: Domain Documentation"
  - Clear blocking requirement: Cannot proceed to Phase 1 until Phase 0 is complete
  - Updated example to show Phase 0 execution flow

### Rationale

Domain documentation as a prerequisite ensures:
- **Shared understanding**: All domain concepts documented before implementation
- **No drift**: Code implementation follows documented domain model
- **Traceability**: Clear path from spec → domain docs → implementation
- **Quality**: Forces thinking through domain model before writing code

## [1.10.7] - 2026-01-16

### Added

- **backend-dev agent**: Entry point rules for `src/index.ts`
  - `src/index.ts` is the ONLY file with side effects when imported
  - All other files must be pure exports with no side effects on import
  - `src/index.ts` must be minimal: import server, start server, nothing else
  - NO logic, configuration loading, or setup in the root index file
  - Added code example showing the correct minimal entry point pattern
  - Added corresponding rule to Rules section

### Rationale

Isolating side effects to `src/index.ts` provides:
- **Testability**: All modules can be imported in tests without triggering side effects
- **Clarity**: Easy to understand what runs at startup vs what's pure code
- **Modularity**: Each module is self-contained and doesn't depend on import order
- **Debugging**: Side effects are predictable and traceable to one location

## [1.10.6] - 2026-01-16

### Changed

- **Terminology clarification**: "Model" always refers to Domain Model layer, never database models
  - Updated `frontend-dev` agent: `src/models/` description changed from "Business logic and data models" to "Domain logic (the 'M' in MVVM)"
  - Updated `README.md`: Same clarification for frontend directory structure
  - Updated `planning.md` skill: Backend tasks now specify "Add domain definitions to `model/definitions/`" instead of ambiguous "Add model definitions"
  - Updated historical CHANGELOG entry for v1.7.0 to use consistent terminology

### Rationale

The term "Model" in this plugin exclusively refers to:
- **Backend**: The Model layer containing domain definitions and use-cases (`src/model/`)
- **Frontend**: The Model layer in MVVM containing domain/business logic (`src/models/`)

The term "data model" was removed as it could be confused with database models. This plugin does not use "Model" to refer to database-related concepts.

## [1.10.5] - 2026-01-15

### Added

- **typescript-standards skill**: Added "No Classes or Inheritance" rule
  - CRITICAL: Never use classes or inheritance unless creating a subclass of Error
  - Classes encourage mutation and tight coupling
  - Inheritance creates fragile hierarchies
  - Functions with explicit dependencies are easier to test and reason about
  - Error subclasses are the only exception (for `instanceof` checks and stack traces)
  - Added code examples showing correct patterns (types + functions) vs incorrect (classes, inheritance, service classes)
  - Updated Summary Checklist with new rule

### Rationale

Avoiding classes and inheritance provides:
- **Immutability**: Functions don't have `this` to mutate
- **Simplicity**: No inheritance hierarchies to navigate
- **Testability**: Pure functions with explicit dependencies are trivial to test
- **Clarity**: Data flows through function parameters, not hidden state

## [1.10.4] - 2026-01-15

### Changed

- **backend-dev agent**: Model definitions must use TypeScript types only
  - NO Zod, Yup, io-ts, or similar validation libraries in `model/definitions/`
  - Definitions are compile-time type constructs, not runtime validators
  - Validation belongs in Controller layer (input) or Server layer (middleware)
  - Added code examples showing correct TypeScript types vs incorrect Zod usage

### Rationale

Keeping model definitions as pure TypeScript types:
- **Separation of concerns**: Validation is an infrastructure concern, not domain logic
- **Simplicity**: Types are sufficient for domain modeling
- **No runtime overhead**: Compile-time checks only
- **Cleaner imports**: Model layer stays dependency-free

## [1.10.3] - 2026-01-15

### Enhanced

- **backend-dev agent**: Added explicit info logging guidelines for telemetry
  - Log **before** starting a domain action (`info`)
  - Log **after** success (`info`) or failure (`error`)
  - Applies to: database writes, user actions, outgoing calls, state transitions, business events
  - Added code examples showing proper before/after logging pattern

### Rationale

Consistent info logging enables:
- **Observability**: Track all significant operations in production
- **Debugging**: Trace the path of requests through the system
- **Auditing**: Record business-relevant events for compliance
- **Monitoring**: Alert on missing expected logs

## [1.10.2] - 2026-01-15

### Changed

- **Terminology update**: Renamed `entities` to `definitions` throughout the plugin
  - `specs/domain/entities/` → `specs/domain/definitions/`
  - Updated all agents, skills, commands, and templates
  - Updated README.md, CHANGELOG.md, and documentation
  - Affects: spec-writer agent, spec-writing skill, planning skill, sdd-init command, sdd-implement-plan command, sdd-verify-spec command, glossary template

### Rationale

The term "definitions" is more generic and inclusive:
- **Broader scope**: Covers entities, value objects, aggregates, and other domain concepts
- **Less prescriptive**: Doesn't impose DDD terminology on projects
- **Clearer intent**: "Definitions" better describes the purpose of documenting domain concepts

## [1.10.1] - 2026-01-15

### Changed

- **backend-dev agent**: Replaced repository pattern with data access functions in DAL layer
  - One function per file, named after the function (e.g., `find_user_by_id.ts`)
  - Each function receives its dependencies as the first argument
  - No classes, repository interfaces, or abstraction layers
  - Direct database queries with proper parameterization
  - `index.ts` re-exports all functions
  - No assumed grouping - subdirectories only if explicitly instructed

### Rationale

Data access functions provide:
- **Simplicity**: Direct, focused functions without abstraction overhead
- **Flexibility**: Functions can query across multiple tables without definition-based constraints
- **Clarity**: Each file does one thing, named after what it does
- **No assumptions**: Developer controls structure, no forced definition grouping

## [1.10.0] - 2026-01-14

### Added

- **specs/domain/use-cases/ directory**: New directory for business use case definitions
  - Added to sdd-init command directory creation
  - Documented in README "Key Files in specs/" table
  - Documented in QUICKSTART "Key Files" table
  - Added to spec-writer agent Location Rules table
  - Use cases provide a structured location for documenting key business workflows and scenarios

### Rationale

The use-cases directory provides:
- **Structured Documentation**: Dedicated location for business workflows and scenarios
- **Domain Clarity**: Separates use cases from definitions and glossary for better organization
- **Spec Coverage**: Ensures business logic and user journeys are explicitly documented
- **Consistency**: Follows the same domain-driven structure as definitions and glossary

**Version Note**: This is a minor version bump (1.9.x → 1.10.0) because it adds a new feature (directory structure) that extends functionality without breaking existing behavior.

## [1.9.3] - 2026-01-13

### Fixed

- **sdd-init command smart directory handling**: Prevent redundant nested directories
  - Checks if current directory basename matches the project name
  - If in an empty directory with matching name, asks to initialize in place
  - Avoids creating `test-app/test-app/*` when already in `test-app/`
  - Uses `TARGET_DIR` variable throughout to handle both cases (current dir or subdirectory)
  - Updates completion messages to show actual location
  - Adjusts `cd` instructions based on whether a subdirectory was created
  - Git initialization checks if already in a repository

### Rationale

Smart directory detection provides:
- **Better UX**: No redundant nested directories when already in the right place
- **Flexibility**: Supports both "create subdirectory" and "initialize here" workflows
- **Safety**: Checks if directory is empty before initializing in place
- **Clarity**: Always shows absolute path in completion message

## [1.9.2] - 2026-01-13

### Enhanced

- **External spec handling in sdd-init command**: Improved external spec integration
  - External specs are now copied to `specs/external/<original-filename>` for permanent reference
  - Feature specs reference the external source via `external_source` frontmatter field
  - Added "External Source" section to feature specs with reference to original file
  - INDEX.md now includes an "External Specifications" section listing all imported specs
  - Directory structure includes `specs/external/` for preserving original source documents
  - Completion messages show the location of both the original and integrated specs
  - This provides better traceability between the original requirements and the SDD feature specs

### Rationale

Copying external specs to `specs/external/` and referencing them provides:
- **Traceability**: Clear link between original requirements and feature specs
- **Version control**: Original specs are preserved in git alongside the project
- **Auditability**: Easy to compare original requirements with implementation
- **Documentation**: Keeps all relevant documentation in one repository

## [1.9.1] - 2026-01-13

### Enhanced

- **File naming conventions enforced**: All agents now enforce `lowercase_with_underscores` for filenames
  - `frontend-dev` agent: Updated all examples and added explicit file naming rules
    - Directory names: `home_page/`, `user_profile/`, `button/` (not `HomePage/`, `UserProfile/`, `Button/`)
    - Component files: `user_profile.tsx`, `button.tsx` (not `UserProfile.tsx`, `Button.tsx`)
    - ViewModel hooks: `use_user_profile_view_model.ts` (not `useUserProfileViewModel.ts`)
    - Store files: `auth_store.ts` (not `authStore.ts`)
  - `backend-dev` agent: Updated use-case examples and added explicit file naming rules
    - Use-case files: `create_user.ts`, `update_user.ts` (not `createUser.ts`, `updateUser.ts`)
  - `api-designer` agent: Added file naming rule for schema files (already using correct convention)
  - Added clear examples with ✅ correct and ❌ incorrect patterns
  - Component names in code remain PascalCase (e.g., `export const UserProfile = ...`)

### Rationale

Lowercase_with_underscores provides:
- **Consistency**: Same convention across frontend, backend, and infrastructure files
- **Portability**: No case-sensitivity issues across operating systems
- **Readability**: Clear word separation without relying on case
- **Best practice**: Common convention in Python, SQL, and many infrastructure tools

## [1.9.0] - 2026-01-13

### Changed

- **All commands renamed**: Removed `project:` namespace, added `sdd-` prefix to all command names
  - `/project:init` → `/sdd-init`
  - `/project:new-feature` → `/sdd-new-feature`
  - `/project:implement-plan` → `/sdd-implement-plan`
  - `/project:verify-spec` → `/sdd-verify-spec`
  - `/project:generate-snapshot` → `/sdd-generate-snapshot`
  - Command files renamed with `sdd-` prefix (e.g., `init.md` → `sdd-init.md`)
  - Frontmatter `name` field updated in all command files
  - Heading updated in all command files (e.g., `# /project:init` → `# /sdd-init`)

### Updated Files

- `commands/sdd-init.md`: Renamed from `init.md`, updated name and heading
- `commands/sdd-new-feature.md`: Renamed from `new-feature.md`, updated name and heading
- `commands/sdd-implement-plan.md`: Renamed from `implement-plan.md`, updated name and heading
- `commands/sdd-verify-spec.md`: Renamed from `verify-spec.md`, updated name and heading
- `commands/sdd-generate-snapshot.md`: Renamed from `generate-snapshot.md`, updated name and heading
- `plugin/.claude-plugin/plugin.json`: Updated commands array, bumped to 1.9.0
- `.claude-plugin/marketplace.json`: Bumped to 1.9.0

### Impact

This change simplifies command naming and removes the redundant namespace:
- **Shorter commands**: Removed `project:` namespace (was redundant with plugin name)
- **Clearer naming**: `sdd-` prefix clearly identifies commands as part of SDD plugin
- **Consistency**: Command file names now match command names exactly
- **Better discoverability**: Commands are more intuitive with plugin-specific prefix

**Migration**: Users should update any scripts or documentation that reference the old command names:
- Old: `/project:init`, `/project:new-feature`, etc.
- New: `/sdd-init`, `/sdd-new-feature`, etc.

**Rationale**: The `project:` namespace was redundant since the plugin is already namespaced as "sdd". Using `sdd-` prefix follows common CLI tool patterns (like `git-`, `npm-`) and makes commands more concise.

## [1.8.3] - 2026-01-13

### Added

- **plugin manifest**: Added commands array to plugin.json for command discovery
  - References all 5 command files with relative paths:
    - `./commands/init.md`
    - `./commands/new-feature.md`
    - `./commands/implement-plan.md`
    - `./commands/verify-spec.md`
    - `./commands/generate-snapshot.md`
  - Enables Claude Code to automatically discover and register plugin commands
  - Uses relative paths with `./` prefix for portability

### Updated Files

- `plugin/.claude-plugin/plugin.json`: Added commands array, bumped to 1.8.3
- `.claude-plugin/marketplace.json`: Bumped to 1.8.3

### Impact

This enhancement improves plugin command registration:
- **Automatic discovery**: Claude Code can now discover commands from manifest
- **Better UX**: Commands appear in autocomplete and help documentation
- **Standards compliance**: Follows Claude Code plugin manifest specification
- **Maintainability**: Single source of truth for command references

**Technical Note**: The commands array contains file path references (strings) rather than command metadata objects. Each path points to a command markdown file with frontmatter containing the command's name and description.

## [1.8.2] - 2026-01-12

### Fixed

- **new-feature command**: Fixed workflow order to collect feature name before branch check
  - **Issue**: Command suggested `feature/<feature-name>` branch before collecting the feature name
  - **Fix**: Reordered flow to collect feature name first (Step 1), then check branch (Step 2)
  - **New flow**:
    1. Collect feature name (from argument or prompt)
    2. Check git branch and suggest `feature/<actual-feature-name>`
    3. Collect remaining information (issue, domain, description)
    4-6. Create spec, plan, and review

### Updated Files

- `commands/new-feature.md`: Reordered steps, updated examples, clarified important notes
- `plugin/.claude-plugin/plugin.json`: Bumped to 1.8.2
- `.claude-plugin/marketplace.json`: Bumped to 1.8.2

### Impact

This fix ensures a logical workflow:
- **Feature name available**: Branch suggestion now uses the actual feature name
- **Better UX**: Users see the correct branch suggestion immediately
- **Logical flow**: Name → Branch → Details makes more sense
- **Examples updated**: All three examples now show correct order

**Before (incorrect):**
```
Step 0: Check branch (suggests feature/<feature-name> without knowing name)
Step 1: Collect feature name
```

**After (correct):**
```
Step 1: Collect feature name
Step 2: Check branch (suggests feature/<actual-feature-name>)
Step 3: Collect remaining information
```

## [1.8.1] - 2026-01-12

### Enhanced

- **typescript-standards skill**: Added three critical module system rules
  - **Named exports only**: Prohibit default exports, enforce named exports for better IDE support and refactoring
  - **ES modules only**: Prohibit CommonJS (`require`/`module.exports`), enforce ES module syntax (`import`/`export`)
  - **Import through index.ts only**: Prohibit bypassing module public APIs, enforce importing only from `index.ts` files

### New Rules

1. **Named Exports Only:**
   - ✅ `export const createUser = ...`
   - ✅ `export interface User { ... }`
   - ❌ `export default createUser` (NEVER)
   - **Why**: Better IDE autocomplete, explicit imports, easier to find usages, no ambiguity

2. **ES Modules Only:**
   - ✅ `import { createUser } from './user.js'`
   - ✅ `export { updateUser } from './user.js'`
   - ❌ `const { createUser } = require('./user')` (NEVER)
   - ❌ `module.exports = createUser` (NEVER)
   - **Why**: Standard JavaScript, statically analyzable (tree-shaking), async by nature, modern tooling requirement

3. **Import Through index.ts Only:**
   - ✅ `import { createUser } from '../user'` (from module's public API)
   - ❌ `import { createUser } from '../user/createUser.js'` (NEVER bypass index.ts)
   - ❌ `import { helper } from '../user/internal/helper.js'` (NEVER access internals)
   - **Why**: Module encapsulation, clean public APIs, easier refactoring, clear module boundaries

### Updated Files

- `skills/typescript-standards.md`: Added "Module System Rules" section with 3 subsections
- Updated summary checklist with 3 new items
- `plugin/.claude-plugin/plugin.json`: Bumped to 1.8.1
- `.claude-plugin/marketplace.json`: Bumped to 1.8.1

### Impact

These rules strengthen code quality and maintainability:

**Named Exports Benefits**:
- IDE can autocomplete exact names
- Refactoring tools work correctly
- Easy to find all usages with search
- Import statements are explicit and clear

**ES Modules Benefits**:
- Standard JavaScript module system
- Tree-shaking works (reduces bundle size)
- Static analysis possible (better tooling)
- Async loading supported natively
- TypeScript tooling expects ES modules

**Index.ts Import Benefits**:
- Modules control what's public vs private
- Internal files can be refactored without breaking imports
- Clear separation of public API from implementation
- Better encapsulation (information hiding)
- Easier to understand module boundaries

**Example:**
```typescript
// Module structure
user/
├── index.ts           # Public API: export { createUser, User }
├── createUser.ts      # Implementation (private)
└── internal/          # Internal helpers (private)
    └── validator.ts

// Correct usage (imports from public API)
import { createUser } from '../user';

// Wrong usage (bypasses public API)
import { createUser } from '../user/createUser.js';  // ❌ NEVER
```

## [1.8.0] - 2026-01-12

### Enhanced

- **init command**: Added support for external specification files
  - **New argument**: `--spec <path>` to initialize project from existing spec
  - **Phase 0**: Parse and load external spec, extract project metadata
  - **Smart defaults**: Use extracted values (name, description, domain) as defaults in prompts
  - **Automatic integration**: External spec becomes initial feature specification
  - **Plan generation**: Automatically creates implementation plan from external spec
  - **Domain extraction**: Extracts key terms and adds to glossary
  - **INDEX/SNAPSHOT updates**: Automatically registers imported spec

### New Usage

```bash
# Initialize from external spec
/project:init my-app --spec /path/to/requirements.md

# Initialize from spec, will prompt for project name
/project:init --spec /path/to/product-spec.md
```

### Workflow Changes

1. **Phase 0 (New)**: Parse arguments and load external spec if provided
   - Reads external spec file
   - Extracts project name, description, domain, definitions, requirements
   - Validates spec file existence and readability

2. **Phase 1 (Enhanced)**: Uses extracted values as defaults in prompts
   - Prompts show: "Project name [<extracted-default>]: "
   - Users can accept defaults or override

3. **Step 3 (Enhanced)**: External spec integration after template copy
   - Creates `specs/features/YYYY/MM/DD/initial-spec/SPEC.md` from external spec
   - Adds proper frontmatter with source tracking
   - Generates `PLAN.md` with implementation phases
   - Updates INDEX.md and SNAPSHOT.md
   - Extracts domain terms to glossary

4. **Step 5 (Enhanced)**: Different completion messages
   - External spec path: Shows plan review and implementation next steps
   - Standard path: Shows feature creation next steps

### Updated Files

- `commands/init.md`: Added --spec argument, Phase 0, external spec integration workflow
- `plugin/.claude-plugin/plugin.json`: Bumped to 1.8.0
- `.claude-plugin/marketplace.json`: Bumped to 1.8.0

### Impact

This enhancement enables seamless project initialization from existing specifications:

**Use Cases**:
- **Product requirements**: Import PRD documents as initial specs
- **Design documents**: Start implementation from design specs
- **Migration projects**: Import legacy system specs
- **Customer requirements**: Use client-provided specs directly
- **RFP responses**: Initialize from RFP documents

**Benefits**:
- **Time savings**: No manual spec creation or copying
- **Consistency**: Automatic formatting and structure
- **Traceability**: Source tracking in frontmatter
- **Immediate planning**: Auto-generated implementation plan
- **Domain capture**: Automatic glossary population

**Example workflow**:
1. Receive product-requirements.md from product team
2. Run: `/project:init my-product --spec product-requirements.md`
3. Review generated plan: `specs/features/YYYY/MM/DD/initial-spec/PLAN.md`
4. Start implementation: `/project:implement-plan specs/features/YYYY/MM/DD/initial-spec/PLAN.md`

## [1.7.1] - 2026-01-12

### Changed

- **init command**: Renamed from `init-project` to `init` for brevity
  - Command file: `commands/init-project.md` → `commands/init.md`
  - Command name: `/project:init-project` → `/project:init`
  - Updated all documentation references (README.md, QUICKSTART.md, CLAUDE.md)
  - Added `namespace: "sdd"` to plugin manifest

### Updated Files

- `commands/init.md`: Updated command name and frontmatter
- `plugin/.claude-plugin/plugin.json`: Added namespace, bumped to 1.7.1
- `.claude-plugin/marketplace.json`: Bumped to 1.7.1
- `README.md`: Updated command references
- `QUICKSTART.md`: Updated command references and file tree
- `CLAUDE.md`: Updated command references

### Impact

This change simplifies the command interface:
- **Shorter command**: `/project:init` vs `/project:init-project`
- **More intuitive**: Common convention (like `git init`, `npm init`)
- **Consistent naming**: Aligns with industry standards
- **Namespace added**: Ensures plugin uniqueness in marketplace

**Migration**: Users should update any scripts or documentation that reference `/project:init-project` to use `/project:init` instead.

## [1.7.0] - 2026-01-11

### Enhanced

- **frontend-dev agent**: Major architectural overhaul with MVVM, page-based organization, TanStack ecosystem, and TailwindCSS
  - **MVVM Architecture (Mandatory)**:
    - Strict separation: Model (business logic) → ViewModel (hooks) → View (React components)
    - Page-based organization: `src/pages/<PageName>/` with index.ts, Page.tsx, usePageViewModel.ts
    - ViewModels as hooks: One `useXViewModel.ts` per page that connects Model to View
    - Model layer separation: Business logic in `src/models/`, API calls in `src/services/`
  - **Directory Structure**:
    - `src/pages/` - Page components with dedicated subdirectories
    - `src/components/` - Shared presentational components
    - `src/viewmodels/` - Shared ViewModel hooks
    - `src/models/` - Domain logic (the "M" in MVVM)
    - `src/services/` - API clients and external services
    - `src/stores/` - Global state (Zustand)
    - `src/types/` - Generated types from OpenAPI contract
  - **TanStack Ecosystem (Mandatory)**:
    - **TanStack Router**: All routing and navigation (replaces React Router)
    - **TanStack Query**: All server state management (mandatory for API calls)
    - **TanStack Table**: All tabular data display
    - **TanStack Form**: Complex forms with validation
  - **TailwindCSS (Mandatory)**:
    - All styling MUST use Tailwind utility classes
    - NO inline styles, NO CSS files (except Tailwind setup), NO CSS-in-JS libraries
    - Responsive design with mobile-first approach
    - Dark mode support with `dark:` variants
    - Use `clsx` for conditional classes
  - **State Management**:
    - Server state: TanStack Query (all API data)
    - Global client state: Zustand (auth, theme, preferences)
    - Local client state: useState (forms, UI toggles)
    - URL state: TanStack Router (pagination, filters)
  - **Updated Rules**:
    - Strict MVVM - Views never contain business logic
    - Page-based organization - Every page in dedicated subdirectory
    - ViewModels as hooks - One per page, handles all business logic
    - TailwindCSS only - Utility-first styling approach
    - TanStack ecosystem - All routing, state, tables, and forms

### Updated Files

- **frontend-dev agent**:
  - Added comprehensive MVVM architecture section with layer responsibilities
  - Added detailed directory structure with 9 subdirectories
  - Added mandatory page structure with complete code examples
  - Added TanStack ecosystem section (Router, Query, Table, Form)
  - Added TailwindCSS section with styling rules and examples
  - Updated component standards for presentational components
  - Updated state management table with 4 state types and tools
  - Added Zustand store example
  - Reorganized and expanded Rules section into 4 categories
  - Version bumped to 1.7.0 in plugin.json and marketplace.json

### Impact

This enhancement transforms frontend development with opinionated, modern architecture:

**MVVM Benefits**:
- **Clear separation of concerns**: Business logic isolated from UI
- **Testability**: ViewModels and Models can be unit tested without UI
- **Reusability**: Shared ViewModels and Models across pages
- **Maintainability**: Easy to locate and modify logic by layer

**Page-Based Organization**:
- **Scalability**: Each page is self-contained with its ViewModel
- **Discoverability**: Clear file structure, easy to find components
- **Code colocation**: Related files grouped together
- **Consistency**: Every page follows the same pattern

**TanStack Ecosystem**:
- **Modern routing**: Type-safe routes with TanStack Router
- **Powerful state**: Server state management with caching, refetching
- **Advanced tables**: Sorting, filtering, pagination out of the box
- **Form validation**: Built-in validation with TanStack Form

**TailwindCSS Benefits**:
- **Rapid development**: No context switching between files
- **Consistency**: Design system through configuration
- **Performance**: Optimized with PurgeCSS in production
- **Responsive**: Mobile-first utilities
- **Dark mode**: Built-in support

**Migration from 1.6.x**: Existing projects will need to:
1. Restructure to MVVM with `src/pages/` and ViewModels
2. Install TanStack packages (Router, Query, Table, Form)
3. Install and configure TailwindCSS
4. Migrate React Router to TanStack Router
5. Convert inline styles and CSS files to Tailwind utilities
6. Extract business logic from components to ViewModels

## [1.6.2] - 2026-01-11

### Fixed

- **TypeScript standards compliance**: Corrected invalid `readonly interface` syntax across all plugin files
  - **typescript-standards skill**: Removed `readonly` keyword from interface declaration (line 40)
    - Changed from `readonly interface User {` (invalid TypeScript)
    - Changed to `interface User {` (correct - readonly applies to properties, not interface)
  - **backend-dev agent**: Fixed all 4 instances of `readonly interface`:
    - Line 54: `ServerDependencies` interface
    - Line 80: `Config` interface (in main Config layer example)
    - Line 213: `DAL` interface
    - Line 295: `Config` interface (in logging example)
  - **Validation**: Confirmed no other TypeScript standards violations (arrow functions, immutability, native JS)

### Updated Files

- `skills/typescript-standards.md`: Fixed interface syntax in immutability example
- `agents/backend-dev.md`: Fixed 4 instances of incorrect interface syntax
- Version bumped to 1.6.2 in plugin.json and marketplace.json

### Impact

This fix ensures all code examples in the plugin demonstrate correct TypeScript syntax:
- **Standards compliance**: All examples now follow valid TypeScript syntax
- **Educational accuracy**: Developers using the plugin will learn correct patterns
- **Code generation**: Agents will generate syntactically correct TypeScript code
- **Type checking**: Examples will pass TypeScript compiler validation

**Technical note**: TypeScript does not support `readonly` as a modifier for interface declarations. The `readonly` keyword only applies to interface properties, type properties, and array/object types (e.g., `ReadonlyArray<T>`, `Readonly<T>`).

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
    2. **Definition documentation** (`specs/domain/definitions/`): Create/update definition spec files
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
- **Centralized knowledge**: Glossary, definitions, and architecture serve as single source of truth
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
