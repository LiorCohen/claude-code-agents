# Marketplace Changelog

Changes to the marketplace infrastructure (not plugin-specific changes).

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
