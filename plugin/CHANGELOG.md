# Changelog

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
   - Extracts project name, description, domain, entities, requirements
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
    - `src/models/` - Business logic and domain models
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
