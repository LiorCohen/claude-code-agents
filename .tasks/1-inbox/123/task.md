---
id: 123
title: Update TypeScript standards with missing patterns and corrections
status: open
created: 2026-02-10
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
3. **Error handling patterns** — Beyond defining Error subclasses: catch blocks, throw vs return null, error wrapping
4. **`interface` vs `type` rule** — `interface` for function-only contracts, `type` for everything else
5. **Async/Promise patterns** — Explicit `Promise<T>` return types, `Promise.all`, try/catch in async arrows

### Medium Priority (widely used patterns)

6. **Generic constraints** — When and how to use `<T extends ...>` bounds
7. **Null vs undefined semantics** — Convention for when to use each
8. **`Record<string, never>` for empty objects** — Placeholder/empty type pattern
9. **Nullish coalescing (`??`) vs logical OR (`||`)** — When each is appropriate
10. **`import type` for type-only imports** — Separate type imports from value imports

### Lower Priority (nice to have)

11. **`keyof` and indexed access types** — For type-safe property access
12. **`Object.entries`/`Object.fromEntries`** — Immutable object transformation pattern

### Correction

13. **Ban `let` entirely** — Remove "let if absolutely necessary" language. Use `const` with `.map`/`.reduce`/recursion instead.

## Acceptance Criteria

- [ ] Each new section includes concrete code examples (good and bad)
- [ ] `let` is listed as banned with functional alternatives shown
- [ ] `interface` vs `type` rule is clearly stated with examples
- [ ] Type guards section shows both custom predicates and discriminated unions
- [ ] `as const` section shows deriving union types from arrays
- [ ] Error handling section covers catch blocks, throw vs null, and wrapping
- [ ] All examples use patterns from the actual codebase where possible
- [ ] Summary checklist at the bottom is updated to reflect new rules
