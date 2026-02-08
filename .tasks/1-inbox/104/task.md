---
id: 104
title: sdd-run without arguments should show usage text
status: open
created: 2026-02-08
depends_on: []
blocks: []
---

# Task 104: sdd-run without arguments should show usage text

## Description

Running `sdd-run` without any arguments produces unexpected/broken behavior instead of displaying a helpful usage message. The command should gracefully handle missing arguments by showing usage instructions and available options.

## Acceptance Criteria

- [ ] `sdd-run` with no arguments displays a usage/help message
- [ ] Usage text lists available subcommands or expected arguments
- [ ] No unintended side effects when invoked without arguments
