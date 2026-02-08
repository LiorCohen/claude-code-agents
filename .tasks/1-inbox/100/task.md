---
id: 100
title: Ensure all sdd-change outputs use markdown with clickable links
status: open
created: 2026-02-08
depends_on: []
blocks: []
---

# Task 100: Ensure all sdd-change outputs use markdown with clickable links

## Description

All outputs from the `sdd-change` command should use properly formatted markdown, including clickable links (e.g., `[filename.ts](path/to/filename.ts)`) instead of plain text file references. This ensures users can navigate directly to referenced files from the command output.

## Acceptance Criteria

- [ ] All file references in sdd-change output use markdown link syntax
- [ ] All task/issue references use clickable markdown links
- [ ] No plain-text file paths remain in user-facing output
- [ ] Output renders correctly in VS Code terminal / Claude Code interface
