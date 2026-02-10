---
id: 123
title: Update TypeScript standards with missing patterns and corrections
status: complete
created: 2026-02-10
completed: 2026-02-10
depends_on: []
blocks: []
---

# Task 123: Update TypeScript standards with missing patterns and corrections

## Description

The TypeScript standards skill is missing several patterns that are used throughout the codebase and important for writing idiomatic TypeScript. Additionally, the current standards incorrectly allow `let` — it should be banned entirely in favor of `const` with functional patterns.

## Changes

### High Priority (foundational patterns)

1. **Type guards and discriminated unions** — Core pattern for type-safe branching without classes
2. **`as const` and literal type derivation** — `typeof ARRAY[number]` pattern for deriving union types
3. **All functions must return values** — Void functions are extremely rare and should be avoided
4. **Result unions over null** — Return discriminated union results instead of `T | null`; null is vague and hides failure reasons
5. **Error narrowing in catch blocks** — Always narrow `unknown` errors with `instanceof Error`
6. **`interface` vs `type` rule** — `interface` for function-only contracts, `type` for everything else
7. **Async/Promise patterns** — Explicit `Promise<T>` return types, `Promise.all`, try/catch in async arrows
8. **External data validation** — Never trust data from external sources (env vars, CLI args, config files, API responses). Always validate shape and fail explicitly on mismatch.

### Medium Priority (widely used patterns)

9. **Semantic type aliases** — Use `type Milliseconds = number` to give meaning to primitives rather than raw `number`/`string`
10. **Generic constraints** — When and how to use `<T extends ...>` bounds
11. **Null vs undefined semantics** — Convention for when to use each
12. **`Record<string, never>` for empty objects** — Placeholder/empty type pattern
13. **Nullish coalescing (`??`) vs logical OR (`||`)** — When each is appropriate
14. **`import type` for type-only imports** — Separate type imports from value imports

### Lower Priority (nice to have)

15. **`keyof` and indexed access types** — For type-safe property access
16. **`Object.entries`/`Object.fromEntries`** — Immutable object transformation pattern

### Correction

17. **Ban `let` entirely** — Remove "let if absolutely necessary" language. Use `const` with `.map`/`.reduce`/recursion instead.

## Acceptance Criteria

- [ ] Each new section includes concrete code examples (good and bad)
- [ ] `let` is listed as banned with functional alternatives shown
- [ ] `interface` vs `type` rule is clearly stated with examples
- [ ] Type guards section shows both custom predicates and discriminated unions
- [ ] `as const` section shows deriving union types from arrays
- [ ] All functions must return values — no void functions
- [ ] Result unions section shows discriminated union return types over null
- [ ] Error narrowing section covers instanceof checks in catch blocks
- [ ] Semantic type aliases section shows primitives with domain meaning
- [ ] External data validation section shows boundary validation with explicit failure
- [ ] All examples use patterns from the actual codebase where possible
- [ ] Summary checklist at the bottom is updated to reflect new rules
