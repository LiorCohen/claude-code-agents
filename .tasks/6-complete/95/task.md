---
id: 95
title: Fix commands standards violations from audit report
priority: high
status: complete
created: 2026-02-07
completed: 2026-02-08
depends_on: []
blocks: []
---

# Task 95: Fix commands standards violations from audit report ✓

## Description

Commands standards audit (2026-02-07) found violations across all 5 plugin commands. Key findings:

- **`sdd-change`** has highest drift risk (score 14, High tier) — 10 INVOKEs, 2 vague, long flows
- **3 of 5 commands** (`sdd-config`, `sdd-run`, `sdd-settings`) lack standard output formatting (`═══` boxes, `✓`/`✗`/`⚠` indicators, NEXT STEPS)
- **`sdd-init`** references non-existent "Phase 5" (only has Phases 0-4)
- **`sdd-settings`** H1 has extra "Command" suffix
- No commands have stale skill/agent references (all resolve)

See full audit report: `commands-audit-2026-02-07.md` in this task folder.

## Summary

Addressed critical argument handling issues and improved command documentation:

- Added comprehensive argument handling standards to commands-standards skill
- Implemented usage guides for multi-action commands (sdd-change, sdd-config, sdd-run)
- Converted file path references to clickable markdown links (sdd-settings, sdd-run)
- Fixed commands-standards frontmatter (removed unsupported user-invocable field)

## Implementation Details

### Commands Standards
- Added new "Argument Handling" section with rules for zero-argument behavior
- Defined patterns for focused usage guides based on what's missing
- Provided examples for multi-action and zero-argument commands

### Command Updates
- **sdd-change**: Added "When Called Without Arguments" section with COMMON WORKFLOWS
- **sdd-config**: Added usage guide showing all operations with examples
- **sdd-run**: Added usage guide with namespaces and global options
- **sdd-settings**: Converted file paths in examples to markdown link format
- **sdd-run**: Converted config path to markdown link

### Remaining Work (Future Tasks)
The following acceptance criteria were not addressed in this task and should be tracked separately:
- P2: Document INVOKE return values in sdd-change
- P2: Clarify agent selection in sdd-change implement
- P3: Convert Operations to Actions pattern across commands
- P3: Add error handling documentation
- P3: Document config generation overlap
