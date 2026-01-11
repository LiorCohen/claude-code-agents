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

```typescript
// ✅ GOOD: Readonly everything
readonly interface User {
  readonly id: string;
  readonly email: string;
  readonly createdAt: Date;
}

// ✅ GOOD: ReadonlyArray
const users: ReadonlyArray<User> = [];

// ✅ GOOD: Readonly generic types
type Config = Readonly<{
  port: number;
  host: string;
}>;

const settings: ReadonlyMap<string, string> = new Map();
const tags: ReadonlySet<string> = new Set();

// ✅ GOOD: Spread for updates
const updated = { ...user, email: newEmail };

// ❌ BAD: Mutation
user.email = newEmail;
users.push(newUser);
```

**Immutability checklist:**
- Use `readonly` on all interface/type properties
- Use `ReadonlyArray<T>` for arrays
- Use `Readonly<T>`, `ReadonlyMap<K,V>`, `ReadonlySet<T>` for generic types
- Prefer `const` over `let`; never use `var`
- Use spread operators for updates (never mutate)

---

## Arrow Functions Only

```typescript
// ✅ GOOD: Arrow functions
const createUser = async (deps: Dependencies, args: CreateUserArgs): Promise<CreateUserResult> => {
  // ...
};

const handleClick = () => {
  // ...
};

// ❌ BAD: function keyword
async function createUser(deps: Dependencies, args: CreateUserArgs): Promise<CreateUserResult> {
  // ...
}

function handleClick() {
  // ...
}
```

**Rule:** Use arrow functions exclusively. Never use the `function` keyword.

---

## Native JavaScript Only

```typescript
// ✅ GOOD: Native methods
const filtered = users.filter(u => u.active);
const updated = { ...user, email: newEmail };
const mapped = Object.fromEntries(
  Object.entries(obj).map(([k, v]) => [k, v * 2])
);

// ❌ BAD: External utility libraries
import { map } from 'lodash';      // Never
import { produce } from 'immer';   // Never
import * as R from 'ramda';        // Never
```

**Rule:** Use only native JavaScript/TypeScript features. No utility libraries like lodash, ramda, or immer.

**Why:** Reduces bundle size, eliminates dependencies, forces understanding of native methods, ensures code remains maintainable without external library knowledge.

---

## index.ts File Rules

**CRITICAL:** All `index.ts` files must contain ONLY imports and exports. Never put actual code or logic in index files.

```typescript
// ✅ GOOD: index.ts with only exports
export { createUser } from './createUser.js';
export { updateUser } from './updateUser.js';
export { deleteUser } from './deleteUser.js';

export type { CreateUserArgs, CreateUserResult } from './createUser.js';
export type { UpdateUserArgs, UpdateUserResult } from './updateUser.js';

// ❌ BAD: Logic in index.ts
export const createUser = async (deps, args) => {
  // Implementation here - WRONG!
};

const helper = () => { /* ... */ }; // WRONG!
```

**Why:** Index files should be pure re-export modules for clean public APIs. Logic belongs in dedicated files.

---

## Prefer Readonly Types

When defining function parameters, return types, and variables, default to readonly:

```typescript
// ✅ GOOD: Readonly parameters
const processUsers = (users: ReadonlyArray<User>): ReadonlyArray<User> => {
  return users.filter(u => u.active);
};

// ✅ GOOD: Readonly in interfaces
interface UserCardProps {
  readonly user: User;
  readonly onEdit: (id: string) => void;
}

// ✅ GOOD: Const with readonly types
const config: Readonly<Config> = loadConfig();
```

---

## Summary Checklist

Before committing TypeScript code, verify:

- [ ] `tsconfig.json` has all strict mode options enabled
- [ ] All interface/type properties use `readonly`
- [ ] All arrays use `ReadonlyArray<T>`
- [ ] All objects/maps/sets use `Readonly<T>`, `ReadonlyMap`, `ReadonlySet`
- [ ] All functions use arrow syntax (no `function` keyword)
- [ ] No mutations anywhere (use spread operators for updates)
- [ ] No utility libraries (lodash, ramda, immer)
- [ ] All `index.ts` files contain only imports/exports
- [ ] No `any` types without justification
- [ ] All `const` declarations (no `let` unless absolutely necessary, never `var`)
