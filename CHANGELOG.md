# Marketplace Changelog

Changes to the marketplace infrastructure (not plugin-specific changes).

## 2026-01-24

### Changed

- **Documentation**: Simplified for single-plugin repository
  - Removed multi-plugin documentation from CONTRIBUTING.md and CLAUDE.md
  - This marketplace contains only the SDD plugin

- **Root README**: Simplified to remove redundancy with plugin README
  - Removed duplicate features, commands, and structure sections
  - Now links to plugin README for full documentation

- **Directory structure**: Moved plugin from `full-stack-spec-driven-dev/` to `plugins/sdd/`
  - Updated all path references in marketplace files, commit skill, and test infrastructure

- **Commit skill**: Moved `scripts/bump-version.sh` to `.claude/skills/commit/`
  - Consolidates version management tooling with commit workflow
  - Updated script paths to use `plugins/sdd/` structure

---

## 2026-01-24 (earlier)

### Added

- **Plugin testing standards skill**: New marketplace skill at `.claude/skills/plugin-testing-standards/`
  - Documents testing methodology for Claude Code plugins
  - Defines test tiers: unit, workflow, integration
  - Establishes deterministic LLM testing patterns
  - Includes WHY comment requirements and file size guidelines

- **Benchmark module**: New `benchmark.ts` for tracking token usage during tests
  - Per-model usage tracking (Sonnet, Opus, Haiku)
  - JSON report generation in test output directory

### Changed

- **Test organization**: Moved `database-component` tests from `unit/` to `integration/`
  - Better reflects their nature (scaffolding involves file system operations)

- **Claude runner**: Changed `verbose` default to `false` in `runClaude()`
  - Suppresses "Tool..." output during normal test runs
  - Pass `verbose=true` when debugging specific tests

### Fixed

- **sdd-new-change workflow test**: Removed incorrect agent detection assertions
  - Command uses `change-creation` skill, not Task tool agents
  - Test now verifies SPEC.md and PLAN.md file creation

- **sdd-init workflow test**: Increased timeout and simplified prompt
  - Timeout increased from 300s to 420s (complex scaffolding operation)
  - Simplified prompt to reduce ambiguity

### Removed

- **Linting-style tests**: Deleted tests that validated format rather than behavior
  - `skill-structure.test.ts` - was just checking file format

### Refactored

- **Test infrastructure**: Reorganized `tests/sdd/src/` with lib/tests separation
  - `src/lib/` - All helper modules (paths, fs, process, project, claude, http)
  - `src/tests/unit/` - Unit tests (no LLM required)
  - `src/tests/workflows/` - Workflow tests (LLM with deterministic verification)
  - `src/tests/integration/` - Integration tests (functional verification)
  - Tests no longer import `node:*` directly, use lib helpers instead
  - Split large test files into directories (database-component, postgresql)
  - Added WHY comments to all test blocks
  - Updated tsconfig to use Bundler module resolution (no file extensions needed)

### Changed

- **Test prompts**: Embedded prompts as constants in test files
  - Removed separate `prompts/` directory with `.txt` files
  - Each test file now contains its prompts as multiline string constants
  - Removed `PROMPTS_DIR` export from `test-helpers.ts`
  - Improves test readability and maintainability

### Fixed

- **Test isolation**: Added explicit working directory instructions to test prompts
  - Prevents test artifacts from leaking into repository root
  - All prompts now instruct Claude to use current working directory only

### Changed

- **Test infrastructure**: Migrated from Python/pytest to TypeScript/Vitest
  - `test-helpers.ts` replaces `test_helpers.py`
  - All test files migrated to TypeScript (`.test.ts`)
  - Tests now in `tests/sdd/src/` directory structure
  - Using Vitest for test framework (ESM-first, native TypeScript)

- **Dependencies**: Added ts-node to root package.json
  - `ts-node`, `@types/node` for TypeScript execution
  - Test directory has own `package.json` with Vitest

- **Git ignore**: Added `**/node_modules/` pattern for all directories

### Removed

- **Python test infrastructure**: Deleted all Python test files
  - `conftest.py`, `test_helpers.py`, `pyproject.toml`, `uv.lock`
  - `run-all-tests.sh` (was pytest-based)
  - All `__pycache__/` and `.pytest_cache/` directories

## 2026-01-23

### Changed

- **Test structure**: Moved plugin tests from `full-stack-spec-driven-dev/tests/` to `tests/sdd/`
  - Tests are now at marketplace level, organized by plugin name
  - Updated `conftest.py` paths to reflect new structure
  - Plugin directory no longer contains tests
  - Future plugins will have tests at `tests/<plugin-name>/`
  - Replaced `requirements.txt` and `pytest.ini` with `pyproject.toml` (UV)
  - Updated `run-all-tests.sh` to use `uv run pytest`
  - Renamed `conftest.py` to `test_helpers.py` (clearer name)
  - Added minimal `conftest.py` for pytest fixture discovery

### Added

- **TypeScript LSP**: Added project-bundled TypeScript language server
  - Installed `typescript` and `typescript-language-server` as dev dependencies
  - Created `.claude/cclsp.json` for Claude Code LSP configuration
  - Uses local `node_modules` via `npx` (no global installation required)

- **Ignore files**: Added `node_modules/` and `test-apps/` to `.gitignore` and `.claudeignore`
  - Prevents test output directories from being tracked or indexed

- **Marketplace CHANGELOG**: Created this file to track infrastructure changes separately from plugin changes

- **TypeScript standards skill**: Copied to marketplace level (`.claude/skills/typescript-standards/`)
  - Used when writing TypeScript templates
  - Ensures strict, immutable, type-safe code

### Changed

- **Test suite**: Rewritten from bash to Python
  - Added `conftest.py` with test framework (ClaudeResult, TestProject classes)
  - Converted all test files to pytest format
  - Added `pytest.ini` and `requirements.txt`

- **Commit skill**: Updated to document separate marketplace and plugin changelogs
  - Plugin changes update plugin CHANGELOG with version numbers
  - Marketplace changes update root CHANGELOG with date-based entries
  - Added tests directory to files that don't require version bump
  - Added plugin documentation files (README, QUICKSTART, CLAUDE.md) to list requiring version bump

- **CONTRIBUTING.md**: Updated to reflect dual changelog structure
  - Added marketplace CHANGELOG to repository structure
  - Documented changelog management guidelines

- **Marketplace documentation**: Fixed inconsistencies in root README and CLAUDE files
  - Root CLAUDE.md: Fixed skill paths, added missing files to structure diagram
  - Root README.md: Added `.claude/skills/`, `CHANGELOG.md`, `tests/` to structure

## 2026-01-21

### Added

- **Test framework**: Added plugin test framework for automated testing
  - `tests/test-helpers.sh` with assertion functions
  - `tests/fast/` for quick validation tests
  - `tests/integration/` for full build tests
  - `tests/prompts/` for test input files

### Changed

- **Commit skill**: Refactored from single file to directory structure
  - Moved to `.claude/skills/commit/SKILL.md`

- **Integration test**: Fixed pipefail and subdirectory detection

## 2026-01-17

### Added

- **Commit skill**: Added `/commit` skill for marketplace development
  - Version bump workflow
  - CHANGELOG entry generation
  - Commit message formatting

### Changed

- **Commit skill**: Merged separate commit skills into single `commit.md`
- **Root CLAUDE.md**: Fixed path references to commit-standards skill

## 2026-01-15

### Changed

- **Root CLAUDE.md**: Added Skills section referencing commit-standards

## 2026-01-14

### Changed

- **Root CLAUDE.md**: Removed hardcoded version numbers

## 2026-01-13

### Added

- **Marketplace structure**: Initial marketplace organization
  - Created root `README.md` explaining plugin marketplace
  - Created `marketplace.json` manifest
  - Renamed plugin directory to `full-stack-spec-driven-dev`

### Changed

- **CONTRIBUTING.md**: Updated for marketplace structure
- **CLAUDE.md**: Separated marketplace vs plugin guidance
- **README.md**: Reorganized structure for marketplace vs plugin
- **marketplace.json**: Updated manifest name and owner

## 2026-01-11

### Added

- **Marketplace**: Initial creation
  - Created `marketplace.json`
  - Created `CONTRIBUTING.md`
