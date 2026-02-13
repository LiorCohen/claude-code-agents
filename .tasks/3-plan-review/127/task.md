---
id: 127
title: Fix system CLI TypeScript standards violations from audit
status: plan-review
created: 2026-02-12 18:00 UTC
depends_on: []
blocks: []
---

# Task 127: Fix system CLI TypeScript standards violations from audit

## Description

The system CLI audit on 2026-02-12 found 40 TypeScript standards violations across `plugin/system/src/`. The prompt file audit passed cleanly — all violations are in the TypeScript source. Follows up on #122 (completed 2026-02-11) with findings from a fresh audit.

Full audit report: [audit-2026-02-12.md](audit-2026-02-12.md)

**Excluded:** AJV file extension import (`ajv/dist/2020.js`) — required by AJV's ESM export map. Not a violation.

## Violation Categories

| Category | Count | Severity |
|----------|-------|----------|
| Missing barrel files (`index.ts`) for `lib/` and `types/` | 2 | Medium |
| Direct implementation file imports (bypassing `index.ts`) | 15 | Low |
| Path alias violations (`../` instead of `@/`) | 6 | Low |
| Mutable `.sort()` → `toSorted()` | 7 | Medium |
| `index.ts` contains logic (`providers/index.ts`) | 1 | Medium |
| Mutable `.push()` for stdin accumulation | 2 | Low |
| Mutable Map `.set()` operation | 1 | Low |
| Missing `readonly` on type property | 1 | Low |
| Mutable array type (`string[]`) | 2 | Low |
| Inconsistent `node:` prefix on Node.js imports | 4 | Low |
| ~~File extension in import (AJV)~~ | ~~1~~ | ~~Excluded~~ |

## Acceptance Criteria

- [ ] Barrel files (`index.ts`) created for `lib/` and `types/`
- [ ] Settings imports use `@/types` barrel (no relative `../types/settings` paths)
- [ ] All `.sort()` replaced with `toSorted()`
- [ ] Logic extracted from `commands/env/providers/index.ts` into dedicated module
- [ ] Stdin `.push()` replaced with immutable pattern
- [ ] `cache.set()` in `scaffolding/apply.ts` replaced with immutable pattern
- [ ] Missing `readonly` added to `LocalConfigUrls.databases` inner object
- [ ] `string[]` types changed to `ReadonlyArray<string>` for stdin chunks
- [ ] Node.js imports use `node:` prefix (`cli.ts`, `lib/logger.ts`)
- [ ] Build passes (`npm run build:plugin`)
- [ ] Tests pass (`npm test`)
