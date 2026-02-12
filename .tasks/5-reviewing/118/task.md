---
id: 118
title: Upgrade all JSON schemas to latest stable version (2020-12)
status: reviewing
priority: high
created: 2026-02-10 11:47 UTC
tags: [technical-debt, schema, standards]
---

# Task 118: Upgrade all JSON schemas to latest stable version (2020-12)

## Problem

The codebase currently uses draft-7 JSON schemas in various places. We need to ensure consistency and use the latest stable JSON Schema specification across the entire codebase.

## Scope

1. Audit all JSON schema files and references
2. Identify current schema versions in use (likely draft-7)
3. Update to latest stable version (2020-12 or later)
4. Test schema validation still works correctly
5. Update any tooling/dependencies that validate schemas

## Areas to Check

- Skills frontmatter schemas
- Agents frontmatter schemas
- Commands frontmatter schemas
- Plugin manifest schemas
- Marketplace manifest schemas
- sdd-settings schemas
- Component settings schemas
- Any other validation or configuration schemas

## Success Criteria

- All JSON schemas use the latest stable `$schema` version
- No references to draft-7 remain
- All validation tests pass
- Documentation updated if schema changes affect user-facing behavior
