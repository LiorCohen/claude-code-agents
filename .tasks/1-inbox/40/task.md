---
id: 40
title: Fix sdd-new-change test - spec format mismatch
priority: inbox
status: open
created: 2026-01-25
---

# Task 40: Fix sdd-new-change test - spec format mismatch

## Description

The `tests/src/tests/workflows/sdd-new-change.test.ts` test is failing because the generated SPEC.md format doesn't match what the test expects:
- Test expects YAML frontmatter with `sdd_version:` field
- Actual output uses markdown metadata format (`## Metadata` section)
- Need to either update the test expectations or fix the spec generation to use frontmatter
- Related to spec format consistency across the plugin
