---
id: 21
title: Project sanity verification command
priority: inbox
status: open
created: 2026-01-25
---

# Task 21: Project sanity verification command

## Description

Need a strict, skeptical, and thorough verification command that validates project health. Should:
- Run after `sdd-init` (required) and optionally after `new-change`
- Take a skeptical approach - assume things are broken until proven otherwise
- Verify specs are complete and self-sufficient
- Check that plans are coherent and dependencies are clear
- Validate component structure and readiness
- Ensure no orphaned or inconsistent artifacts
- Report issues with actionable guidance
- Needs a proper plan before implementation
