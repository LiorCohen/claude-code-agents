---
id: 120
title: Replace Date with DateTime across codebase
status: inbox
priority: null
created: 2026-02-10
---

# Replace Date with DateTime across codebase

## Problem

Many places in the codebase use `Date` where they should use `DateTime`. The spec-writing skill correctly uses `DateTime` for timestamp fields, but other skills and runtime code are inconsistent:

- **typescript-standards**: Examples use `createdAt: Date` type and `new Date()` construction
- **unit-testing**: Examples use `new Date()` throughout mock data and assertions
- **testing-standards**: Examples use `new Date().toISOString()`
- **Runtime code** (`plugin/system/src/`): Uses `new Date()` in logger, spec commands, and settings reconciliation

## Scope

- Skills: typescript-standards, unit-testing, testing-standards
- Runtime: logger.ts, generate-snapshot.ts, generate-index.ts, reconcile.ts
