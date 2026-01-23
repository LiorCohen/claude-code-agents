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
// GOOD: Readonly everything
interface User {
  readonly id: string;
  readonly email: string;
  readonly createdAt: Date;
}

// GOOD: ReadonlyArray
const users: ReadonlyArray<User> = [];

// GOOD: Readonly generic types
type Config = Readonly<{
  port: number;
  host: string;
}>;

const settings: ReadonlyMap<string, string> = new Map();
const tags: ReadonlySet<string> = new Set();

// GOOD: Spread for updates
const updated = { ...user, email: newEmail };

// BAD: Mutation
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

### Named Exports Only

**CRITICAL:** Never use default exports. Always use named exports.

```typescript
// GOOD: Named exports
export const createUser = async (deps: Dependencies, args: CreateUserArgs): Promise<User> => {
  // ...
};

export interface User {
  readonly id: string;
  readonly email: string;
}

export type UserRole = 'admin' | 'user' | 'guest';

// BAD: Default exports
export default createUser;           // NEVER
export default function createUser() { /* ... */ }  // NEVER
export default class User { /* ... */ }             // NEVER
```

**Why:** Named exports provide:
- Better IDE autocomplete and refactoring
- Explicit imports that show exactly what's being used
- Easier to find all usages across the codebase
- No ambiguity about what's being imported

### ES Modules Only

**CRITICAL:** Never use CommonJS modules. Always use ES module syntax.

```typescript
// GOOD: ES modules
import { createUser } from './user.js';
import type { User } from './types.js';
export { updateUser } from './user.js';

// BAD: CommonJS
const { createUser } = require('./user');           // NEVER
module.exports = createUser;                         // NEVER
exports.createUser = createUser;                     // NEVER
module.exports.createUser = createUser;              // NEVER
```

**Why:** ES modules are:
- The standard JavaScript module system
- Statically analyzable (enables tree-shaking)
- Async by nature (better for lazy loading)
- Required for modern TypeScript and tooling

### index.ts File Rules

**CRITICAL:** All `index.ts` files must contain ONLY imports and exports. Never put actual code or logic in index files.

```typescript
// GOOD: index.ts with only exports
export { createUser } from './createUser.js';
export { updateUser } from './updateUser.js';
export { deleteUser } from './deleteUser.js';

export type { CreateUserArgs, CreateUserResult } from './createUser.js';
export type { UpdateUserArgs, UpdateUserResult } from './updateUser.js';

// BAD: Logic in index.ts
export const createUser = async (deps, args) => {
  // Implementation here - WRONG!
};

const helper = () => { /* ... */ }; // WRONG!
```

**Why:** Index files should be pure re-export modules for clean public APIs. Logic belongs in dedicated files.

### Import Through index.ts Only

**CRITICAL:** Never bypass a module's `index.ts` file. Always import from the module's public API.

```typescript
// GOOD: Import from module's public API
import { createUser, updateUser } from '../user';
import type { User, UserRole } from '../user';

// BAD: Bypassing index.ts
import { createUser } from '../user/createUser.js';      // NEVER
import { User } from '../user/types.js';                 // NEVER
import { helper } from '../user/internal/helper.js';     // NEVER
```

**Why:** This enforces:
- Module encapsulation (only exported items are accessible)
- Clean public APIs (implementation details stay private)
- Easier refactoring (internal files can be reorganized without breaking imports)
- Clear module boundaries (what's in `index.ts` is the public contract)

**Example module structure:**
```
user/
├── index.ts           # Public API - import from here
├── createUser.ts      # Implementation - don't import directly
├── updateUser.ts      # Implementation - don't import directly
├── types.ts           # Types - don't import directly
└── internal/          # Internal helpers - definitely don't import directly
    └── validator.ts
```

---

## Prefer Readonly Types

When defining function parameters, return types, and variables, default to readonly:

```typescript
// GOOD: Readonly parameters
const processUsers = (users: ReadonlyArray<User>): ReadonlyArray<User> => {
  return users.filter(u => u.active);
};

// GOOD: Readonly in interfaces
interface UserCardProps {
  readonly user: User;
  readonly onEdit: (id: string) => void;
}

// GOOD: Const with readonly types
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
- [ ] **No classes or inheritance** (except Error subclasses)
- [ ] No mutations anywhere (use spread operators for updates)
- [ ] No utility libraries (lodash, ramda, immer)
- [ ] **No default exports** - only named exports (`export const`, `export interface`, etc.)
- [ ] **No CommonJS** - only ES modules (`import`/`export`, never `require`/`module.exports`)
- [ ] All `index.ts` files contain only imports/exports (no logic)
- [ ] **All imports go through `index.ts`** - never import implementation files directly
- [ ] No `any` types without justification
- [ ] All `const` declarations (no `let` unless absolutely necessary, never `var`)
