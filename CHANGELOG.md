# Marketplace Changelog

Changes to the marketplace infrastructure (not plugin-specific changes).

## 2026-01-23

### Added

- **Ignore files**: Added `test-apps/` to `.gitignore` and `.claudeignore`
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

- **CONTRIBUTING.md**: Updated to reflect dual changelog structure
  - Added marketplace CHANGELOG to repository structure
  - Documented changelog management guidelines

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
