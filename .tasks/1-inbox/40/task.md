---
id: 40
title: Fix sdd-change-new test - spec format mismatch
status: inbox
created: 2026-01-25 12:00 UTC
---

# Task 40: Fix sdd-change-new test - spec format mismatch

## Description

The `tests/src/tests/workflows/sdd-change-new.test.ts` test is failing because the generated SPEC.md format doesn't match what the test expects:
- Test expects YAML frontmatter with `sdd_version:` field
- Actual output uses markdown metadata format (`## Metadata` section)
- Need to either update the test expectations or fix the spec generation to use frontmatter
- Related to spec format consistency across the plugin
