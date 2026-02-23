---
name: typescript-standards
description: Shared TypeScript coding standards for strict, immutable, type-safe code.
---


# TypeScript Standards Skill

Shared standards for all TypeScript code in this methodology (backend and frontend).

---

## Strict TypeScript Configuration

All projects must use these TypeScript compiler options:

```json
// tsconfig.json requirements
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "strictPropertyInitialization": true,
  "noImplicitThis": true,
  "alwaysStrict": true
}
```

**Rules:**
- All types explicitly declared
- No `any` unless absolutely unavoidable (must be justified)
- Prefer `unknown` over `any`

---

## Immutability (Non-Negotiable)

Use `readonly` on all properties, `ReadonlyArray<T>` for arrays, `Readonly<T>` / `ReadonlyMap` / `ReadonlySet` for generic types. Use `const` exclusively (never `let` or `var`). Use spread operators for updates — never mutate.

See [immutability.md](resources/immutability.md) for full examples and functional alternatives to `let`.

---

## Banned Mutable Operations

**CRITICAL:** `.push()`, `.pop()`, `.shift()`, `.unshift()`, `.splice()`, `.sort()`, `.reverse()`, `.fill()` on arrays; `obj.prop = x`, `delete obj.prop`, `Object.assign(target, ...)` on objects; `.set()`, `.delete()`, `.add()`, `.clear()` on Maps/Sets — all strictly forbidden. Use spread operators and immutable patterns instead.

See [banned-operations.md](resources/banned-operations.md) for the complete reference tables with alternatives.

---

## Arrow Functions Only

```typescript
// GOOD: Arrow functions
const createUser = async (deps: Dependencies, args: CreateUserArgs): Promise<CreateUserResult> => {
  // ...
};

const handleClick = () => {
  // ...
};

// BAD: function keyword
async function createUser(deps: Dependencies, args: CreateUserArgs): Promise<CreateUserResult> {
  // ...
}

function handleClick() {
  // ...
}
```

**Rule:** Use arrow functions exclusively. Never use the `function` keyword.

---

## No Classes or Inheritance

**CRITICAL:** Never use classes or inheritance unless creating a subclass of Error.

```typescript
// GOOD: Types and functions
type User = {
  readonly id: string;
  readonly email: string;
  readonly createdAt: Date;
};

const createUser = (args: CreateUserArgs): User => ({
  id: generateId(),
  email: args.email,
  createdAt: new Date(),
});

// GOOD: Error subclass (only valid use of class)
class ValidationError extends Error {
  constructor(
    message: string,
    readonly field: string,
    readonly code: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

// BAD: Classes for domain objects
class User {
  constructor(
    public id: string,
    public email: string
  ) {}

  updateEmail(email: string) {
    this.email = email;  // Mutation!
  }
}

// BAD: Inheritance hierarchies
class Animal { /* ... */ }
class Dog extends Animal { /* ... */ }

// BAD: Service classes
class UserService {
  constructor(private db: Database) {}

  async createUser(args: CreateUserArgs) { /* ... */ }
}
```

**Why:**
- Classes encourage mutation (methods that modify `this`)
- Inheritance creates tight coupling and fragile hierarchies
- Functions with explicit dependencies are easier to test and reason about
- Error subclasses are the exception because they integrate with JavaScript's error handling (`instanceof`, stack traces)

---

## Native JavaScript Only

```typescript
// GOOD: Native methods
const filtered = users.filter(u => u.active);
const updated = { ...user, email: newEmail };
const mapped = Object.fromEntries(
  Object.entries(obj).map(([k, v]) => [k, v * 2])
);

// BAD: External utility libraries
import { map } from 'lodash';      // Never
import { produce } from 'immer';   // Never
import * as R from 'ramda';        // Never
```

**Rule:** Use only native JavaScript/TypeScript features. No utility libraries like lodash, ramda, or immer.

**Why:** Reduces bundle size, eliminates dependencies, forces understanding of native methods, ensures code remains maintainable without external library knowledge.

---

## Module System Rules

Named exports only (never default exports). ES modules only (never CommonJS). `index.ts` files contain only imports/exports (no logic). Always import through `index.ts` (never bypass to implementation files). Inside a module, never import from its own `index.ts` — use relative paths to siblings. No file extensions in imports. Use `@/` path alias for deep imports (2+ directory levels). Use `import type` for type-only imports.

See [module-system.md](resources/module-system.md) for full rules with examples.

---

## Interface vs Type

**Rule:** `interface` for function-only contracts (callbacks, loggers, handlers). `type` for everything else. Data types should not contain functions.

```typescript
// GOOD: interface for function-only contracts
interface Logger {
  readonly info: (message: string, data?: unknown) => void;
  readonly warn: (message: string, data?: unknown) => void;
  readonly error: (message: string, data?: unknown) => void;
}

// GOOD: type for data shapes
type User = {
  readonly id: string;
  readonly email: string;
  readonly createdAt: Date;
};

type ServerMode = 'api' | 'worker' | 'cron';

type HelmSettings = HelmServerSettings | HelmWebappSettings;

// BAD: interface for data
interface User {
  readonly id: string;
  readonly email: string;
}

// BAD: type for function contracts
type Logger = {
  readonly info: (message: string) => void;
};

// BAD: functions inside data types
type User = {
  readonly id: string;
  readonly getDisplayName: () => string;  // Data types should not have methods
};
```

---

## Semantic Type Aliases

Use type aliases to give meaning to primitives. A function accepting `Milliseconds` is self-documenting; a function accepting `number` is not.

```typescript
// GOOD: Semantic aliases
type Milliseconds = number;
type Pixels = number;
type DatabaseProvider = 'postgresql';
type ServerMode = 'api' | 'worker' | 'cron';
type SpecStatus = 'pending' | 'in_progress' | 'ready_for_review' | 'approved';

type AnimationConfig = {
  readonly duration: Milliseconds;
  readonly delay: Milliseconds;
  readonly width: Pixels;
};

// BAD: Raw primitives with no meaning
type AnimationConfig = {
  readonly duration: number;  // Seconds? Milliseconds? Frames?
  readonly delay: number;
  readonly width: number;     // Pixels? Rem? Percent?
};
```

---

## Advanced Types

Type guards for discriminated union narrowing. `as const` for literal arrays with `typeof X[number]` to derive union types. Generics for type-safe operations. `keyof` and indexed access types for type-safe property access. `Object.entries` / `Object.fromEntries` for immutable object transformations.

See [advanced-types.md](resources/advanced-types.md) for full examples.

---

## All Functions Must Return Values

Every function should return a meaningful value. Void functions are extremely rare and should be avoided — they hide information from callers and make code harder to compose.

```typescript
// GOOD: Return a result that callers can use
const saveSettings = async (path: string, settings: SddConfig): Promise<CommandResult> => {
  try {
    await writeJson(path, settings);
    return { success: true, output: `Settings saved to ${path}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to save settings: ${message}` };
  }
};

// GOOD: Even simple operations can return useful info
const addToCache = (cache: ReadonlyMap<string, string>, key: string, value: string): ReadonlyMap<string, string> =>
  new Map([...cache, [key, value]]);

// BAD: Void function hides outcome from caller
const saveSettings = async (path: string, settings: SddConfig): Promise<void> => {
  await writeJson(path, settings);  // Caller can't tell if it worked
};

// BAD: Side-effect-only function
const logMetrics = (data: Metrics): void => {
  console.log(JSON.stringify(data));
};
```

**Rule**: All functions should return values. If a function has nothing meaningful to return, that's a signal the design should be reconsidered.

**Exception**: Callback signatures in interface contracts (like `Logger`) may use `void` return types, since the caller doesn't consume the return value. This is the only acceptable use of `void`.

---

## Error Handling

Result unions over null — discriminated union return types for failable operations (never return `null` or throw for expected failures). Error catch blocks narrow with `instanceof Error`. External data validated at system boundaries.

See [error-handling.md](resources/error-handling.md) for full patterns with examples.

---

## Async/Promise Patterns

```typescript
// GOOD: Explicit Promise<T> return type
const loadSettings = async (path: string): Promise<CommandResult> => {
  // ...
};

// GOOD: Promise.all for concurrent independent operations
const validationResults = await Promise.all(
  specs.map((spec) => validateSpecFile(spec.path))
);

// GOOD: Promise.all with typed results
const results = await Promise.all(
  entries.map(async (entry): Promise<ReadonlyArray<string>> => {
    if (entry.isDirectory()) {
      return walkDir(fullPath, filter);
    }
    return [];
  })
);

// BAD: Sequential when parallel is possible
const result1 = await validateSpec(spec1);
const result2 = await validateSpec(spec2);  // Waits unnecessarily

// BAD: Missing return type annotation
const loadSettings = async (path: string) => {  // Return type unclear
  // ...
};
```

---

## Null vs Undefined

For function return types, prefer result unions (see Error Handling). This section covers the distinction between null and undefined in type fields and when interacting with external APIs.

```typescript
// GOOD: undefined via optional fields ("not provided")
type HelmServerSettings = {
  readonly deploy_modes?: ReadonlyArray<ServerMode>;  // Optional = may be undefined
};

// GOOD: Handling undefined from native APIs
const first = items.find(i => i.active);  // Returns T | undefined natively
if (first === undefined) {
  return { success: false, error: 'No active items found' };
}

// GOOD: Handling null from external/DOM APIs
const element = document.getElementById('root');  // Returns HTMLElement | null
if (element === null) {
  return { success: false, error: 'Root element not found' };
}

// BAD: Mixing null and undefined in your own types
type Config = {
  readonly host: string | null;     // Sometimes null
  readonly port: string | undefined; // Sometimes undefined
  // Inconsistent — use optional fields (undefined) for "not provided"
};

// BAD: Returning null from your own functions
const findComponent = (name: string): Component | null => {
  return components.find(c => c.name === name) ?? null;
  // Use a result union instead (see Error Handling)
};
```

**Rule**: Use `undefined` (via `?:`) for optional type fields. Handle `null`/`undefined` from external APIs by converting to result unions. Never return `null` from your own functions — use result unions instead.

---

## `Record<string, never>` for Empty Types

```typescript
// GOOD: Record<string, never> for placeholder types
type ConfigSettings = Record<string, never>;
type TestingSettings = Record<string, never>;
type CicdSettings = Record<string, never>;

// These can be used in unions without accepting arbitrary data:
type ComponentSettings = ServerSettings | DatabaseSettings | ConfigSettings;

// BAD: Using {} or object for empty types
type ConfigSettings = {};        // Accepts any non-nullish value
type ConfigSettings = object;    // Too broad
```

---

## Nullish Coalescing (`??`) vs Logical OR (`||`)

```typescript
// GOOD: ?? for defaults (preserves 0, '', false)
const port = config.port ?? 3000;      // Only falls through on null/undefined
const name = config.name ?? 'default'; // '' is a valid name, kept as-is
const verbose = config.verbose ?? false;

// GOOD: || only when 0/''/false should also trigger the default
const displayName = user.nickname || user.email;  // Empty string -> use email

// BAD: || when 0 or '' are valid values
const port = config.port || 3000;  // port=0 becomes 3000 — wrong!
const count = config.count || 10;  // count=0 becomes 10 — wrong!
```

**Rule**: Default to `??`. Only use `||` when you intentionally want to fall through on all falsy values.

---

## Resource Files

For detailed guidance, read these on-demand:
- [module-system.md](resources/module-system.md) — Named exports, ES modules, index.ts, path aliases
- [immutability.md](resources/immutability.md) — Readonly types, spread operators, functional alternatives
- [banned-operations.md](resources/banned-operations.md) — Complete mutable method reference tables
- [error-handling.md](resources/error-handling.md) — Result unions, error narrowing, external data validation
- [advanced-types.md](resources/advanced-types.md) — Generics, discriminated unions, type guards, indexed access

---

## Summary Checklist

Before committing TypeScript code, verify:

- [ ] `tsconfig.json` has all strict mode options enabled
- [ ] All interface/type properties use `readonly`
- [ ] All arrays use `ReadonlyArray<T>`
- [ ] All objects/maps/sets use `Readonly<T>`, `ReadonlyMap`, `ReadonlySet`
- [ ] All functions use arrow syntax (no `function` keyword)
- [ ] **No classes or inheritance** (except Error subclasses)
- [ ] **No mutable array methods** (`.push()`, `.pop()`, `.shift()`, `.unshift()`, `.splice()`, `.sort()`, `.reverse()`)
- [ ] **No mutable object operations** (`obj.prop = x`, `obj['key'] = x`, `delete obj.prop`)
- [ ] **No mutable Map/Set operations** (`.set()`, `.delete()`, `.add()`, `.clear()`)
- [ ] Use spread operators and immutable patterns for all updates
- [ ] No utility libraries (lodash, ramda, immer)
- [ ] **No default exports** - only named exports (`export const`, `export interface`, etc.)
- [ ] **No CommonJS** - only ES modules (`import`/`export`, never `require`/`module.exports`)
- [ ] All `index.ts` files contain only imports/exports (no logic)
- [ ] **All imports go through `index.ts`** - never import implementation files directly
- [ ] **No file extensions in imports** - never `.js`, `.ts`, `.tsx`
- [ ] **Path aliases for deep imports** - use `@/` instead of `../../../`
- [ ] No `any` types without justification
- [ ] All `const` declarations (never `let`, never `var`)
- [ ] `interface` for function contracts only, `type` for everything else
- [ ] Semantic type aliases for meaningful primitives
- [ ] Type guards for discriminated union narrowing
- [ ] `as const` for literal arrays; derive union types with `typeof X[number]`
- [ ] All functions return values (no void)
- [ ] Result unions over null — discriminated union return types for failable operations
- [ ] Error catch blocks narrow with `instanceof Error`
- [ ] External data validated at system boundaries
- [ ] Async functions have explicit `Promise<T>` return types
- [ ] `import type` for type-only imports
- [ ] `??` for defaults (not `||`)
- [ ] No `let` — use `const` with `.map`/`.reduce`/ternaries

---

## Input / Output

This skill defines no input parameters or structured output.
