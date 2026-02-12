---
id: 120
title: Replace Date with DateTime across codebase
status: inbox
created: 2026-02-10
---

# Task 120: Replace Date with DateTime across codebase

## Problem

Many places across the codebase use `Date` where they should use `DateTime`. Only one place (spec-writing skill) correctly uses `DateTime`. This inconsistency spans skills, runtime code, tests, tasks, and standards.

## Full Scan Results

### Skills (`.claude/skills/`)

- **typescript-standards/SKILL.md**
  - L44: `readonly createdAt: Date;`
  - L190: `readonly createdAt: Date;`
  - L196: `createdAt: new Date(),`

### Plugin Skills (`plugin/skills/`)

- **typescript-standards/SKILL.md** (duplicate of above in plugin)
  - L44, L190: `readonly createdAt: Date;`
  - L196: `createdAt: new Date(),`
- **testing-standards/SKILL.md**
  - L328: `createdAt: new Date().toISOString(),`
- **unit-testing/SKILL.md**
  - L85: `createdAt: new Date()`
  - L86: `updatedAt: new Date()`
  - L162-163: `createdAt: new Date('2026-01-01')`, `updatedAt: new Date('2026-01-01')`
  - L245: `vi.setSystemTime(new Date('2026-01-15T10:00:00Z'));`
  - L254: `expect(token.expiresAt).toEqual(new Date('2026-01-15T11:00:00Z'));`
- **spec-writing/SKILL.md** — Already correct (`DateTime`)

### Plugin Runtime (`plugin/system/src/`)

- **lib/logger.ts**
  - L115: `const date = new Date().toISOString().split('T')[0];`
- **settings/reconcile.ts**
  - L37: `/** Format a Date as "YYYY-MM-DD HH:MM:SSZ" UTC string */`
  - L38: `const formatUtcDatetime = (date: Date): string => {`
  - L56: `* @param now - Optional Date for testing`
  - L62: `now: Date = new Date(),`
- **commands/spec/generate-snapshot.ts**
  - L45: `const today = new Date().toISOString().split('T')[0];`
- **commands/spec/generate-index.ts**
  - L62: `const today = new Date().toISOString().split('T')[0];`

### Tests (`tests/`)

- **src/lib/claude.ts** — L55, L75, L95, L111, L136: `Date.now()` usage
- **src/lib/http.ts** — L19-20: `Date.now()` usage
- **src/lib/project.ts** — L28: `Date.now()` usage
- **src/tests/unit/scripts/generate-index.test.ts** — L72: `new Date()`
- **src/tests/unit/scripts/generate-snapshot.test.ts** — L72: `new Date()`

### Tasks (`.tasks/`)

- **2-planning/103/plan.md** — L168: `const now = new Date();`
