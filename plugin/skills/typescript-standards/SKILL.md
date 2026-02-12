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
interface User {
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
- Use `const` exclusively; never use `let` or `var`
- Use spread operators for updates (never mutate)

### Functional Alternatives to `let`

```typescript
// ❌ BAD: let for accumulation
let total = 0;
for (let i = 0; i < items.length; i++) {
  total += items[i].price;
}

// ✅ GOOD: reduce
const total = items.reduce((sum, item) => sum + item.price, 0);

// ❌ BAD: let for conditional assignment
let label;
if (status === 'active') {
  label = 'Running';
} else {
  label = 'Stopped';
}

// ✅ GOOD: ternary or immediately-invoked expression
const label = status === 'active' ? 'Running' : 'Stopped';

// ❌ BAD: let for loop building an array
let results = [];
for (let i = 0; i < items.length; i++) {
  results.push(transform(items[i]));
}

// ✅ GOOD: map
const results = items.map(transform);
```

---

## Banned Mutable Operations

**CRITICAL:** These operations mutate data in place and are strictly forbidden.

### Banned Array Methods

| Method | Why Banned | Use Instead |
|--------|------------|-------------|
| `.push()` | Mutates array | `[...arr, item]` or `.concat([item])` |
| `.pop()` | Mutates array | `arr.slice(0, -1)` for new array |
| `.shift()` | Mutates array | `arr.slice(1)` for new array |
| `.unshift()` | Mutates array | `[item, ...arr]` |
| `.splice()` | Mutates array | `.slice()` + spread to reconstruct |
| `.sort()` | Mutates array | `[...arr].sort()` or `.toSorted()` |
| `.reverse()` | Mutates array | `[...arr].reverse()` or `.toReversed()` |
| `.fill()` | Mutates array | `Array.from()` with mapping |

```typescript
// ❌ BAD: Mutable operations
const items: string[] = [];
items.push('new');           // Mutates!
items.splice(1, 1);          // Mutates!
items.sort();                // Mutates!

// ✅ GOOD: Immutable alternatives
const items: ReadonlyArray<string> = [];
const withNew = [...items, 'new'];
const withoutSecond = [...items.slice(0, 1), ...items.slice(2)];
const sorted = [...items].sort();  // Or items.toSorted() in ES2023+
```

### Banned Object Operations

| Operation | Why Banned | Use Instead |
|-----------|------------|-------------|
| `obj.prop = value` | Mutates object | `{ ...obj, prop: value }` |
| `obj['key'] = value` | Mutates object | `{ ...obj, [key]: value }` |
| `delete obj.prop` | Mutates object | Destructure + rest: `const { prop, ...rest } = obj` |
| `Object.assign(target, ...)` | Mutates target | `{ ...target, ...source }` |

```typescript
// ❌ BAD: Mutable operations
const user = { name: 'Alice', age: 30 };
user.age = 31;               // Mutates!
user['role'] = 'admin';      // Mutates!
delete user.age;             // Mutates!

// ✅ GOOD: Immutable alternatives
const user: Readonly<User> = { name: 'Alice', age: 30 };
const older = { ...user, age: 31 };
const withRole = { ...user, role: 'admin' };
const { age, ...withoutAge } = user;
```

### Banned Map/Set Operations

| Operation | Why Banned | Use Instead |
|-----------|------------|-------------|
| `map.set()` | Mutates map | `new Map([...map, [key, value]])` |
| `map.delete()` | Mutates map | Filter and reconstruct |
| `set.add()` | Mutates set | `new Set([...set, item])` |
| `set.delete()` | Mutates set | Filter and reconstruct |
| `map.clear()` | Mutates map | `new Map()` |
| `set.clear()` | Mutates set | `new Set()` |

```typescript
// ❌ BAD: Mutable operations
const cache = new Map<string, number>();
cache.set('key', 42);        // Mutates!
cache.delete('key');         // Mutates!

// ✅ GOOD: Immutable alternatives
const cache: ReadonlyMap<string, number> = new Map();
const withEntry = new Map([...cache, ['key', 42]]);
const withoutKey = new Map([...cache].filter(([k]) => k !== 'key'));
```

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

## No Classes or Inheritance

**CRITICAL:** Never use classes or inheritance unless creating a subclass of Error.

```typescript
// ✅ GOOD: Types and functions
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

// ✅ GOOD: Error subclass (only valid use of class)
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

// ❌ BAD: Classes for domain objects
class User {
  constructor(
    public id: string,
    public email: string
  ) {}

  updateEmail(email: string) {
    this.email = email;  // Mutation!
  }
}

// ❌ BAD: Inheritance hierarchies
class Animal { /* ... */ }
class Dog extends Animal { /* ... */ }

// ❌ BAD: Service classes
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

## Module System Rules

### Named Exports Only

**CRITICAL:** Never use default exports. Always use named exports.

```typescript
// ✅ GOOD: Named exports
export const createUser = async (deps: Dependencies, args: CreateUserArgs): Promise<User> => {
  // ...
};

export interface User {
  readonly id: string;
  readonly email: string;
}

export type UserRole = 'admin' | 'user' | 'guest';

// ❌ BAD: Default exports
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
// ✅ GOOD: ES modules
import { createUser } from './user';
import type { User } from './types';
export { updateUser } from './user';

// ❌ BAD: CommonJS
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
// ✅ GOOD: index.ts with only exports
export { createUser } from './createUser';
export { updateUser } from './updateUser';
export { deleteUser } from './deleteUser';

export type { CreateUserArgs, CreateUserResult } from './createUser';
export type { UpdateUserArgs, UpdateUserResult } from './updateUser';

// ❌ BAD: Logic in index.ts
export const createUser = async (deps, args) => {
  // Implementation here - WRONG!
};

const helper = () => { /* ... */ }; // WRONG!
```

**Why:** Index files should be pure re-export modules for clean public APIs. Logic belongs in dedicated files.

### Import Through index.ts Only

**CRITICAL:** Never bypass a module's `index.ts` file. Always import from the module's public API.

```typescript
// ✅ GOOD: Import from module's public API
import { createUser, updateUser } from '../user';
import type { User, UserRole } from '../user';

// ❌ BAD: Bypassing index.ts
import { createUser } from '../user/createUser';      // NEVER
import { User } from '../user/types';                 // NEVER
import { helper } from '../user/internal/helper';     // NEVER
```

**Why:** This enforces:
- Module encapsulation (only exported items are accessible)
- Clean public APIs (implementation details stay private)
- Easier refactoring (internal files can be reorganized without breaking imports)
- Clear module boundaries (what's in `index.ts` is the public contract)

**Example module structure:**
```text
user/
├── index.ts           # Public API - import from here
├── createUser.ts      # Implementation - don't import directly
├── updateUser.ts      # Implementation - don't import directly
├── types.ts           # Types - don't import directly
└── internal/          # Internal helpers - definitely don't import directly
    └── validator.ts
```

### No File Extensions in Imports

**CRITICAL:** Never include file extensions in import statements.

```typescript
// GOOD: No extensions
import { createUser } from './user';
import { config } from '@/lib/config';

// BAD: Extensions in imports
import { createUser } from './user.js';    // NEVER
import { Component } from './Component.tsx'; // NEVER
```

### Path Aliases for Deep Imports

**CRITICAL:** Use `@/` path alias instead of long relative paths.

```typescript
// GOOD: Path alias for deep imports
import { createLogger } from '@/lib/logger';
import { parseArgs } from '@/lib/args';
import { handleSpec } from '@/commands/spec';

// BAD: Deep relative imports
import { createLogger } from '../../../lib/logger';  // NEVER
import { parseArgs } from '../../lib/args';          // NEVER
```

**When to use path aliases:**
- Crossing 2+ directory levels: use `@/`
- Same directory or parent: relative is fine

```typescript
// GOOD: Relative for nearby files
import { validate } from './validate';
import { types } from '../types';

// GOOD: Alias for distant files
import { logger } from '@/lib/logger';
```

**tsconfig.json setup:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

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

## Interface vs Type

**Rule:** `interface` for function-only contracts (callbacks, loggers, handlers). `type` for everything else. Data types should not contain functions.

```typescript
// ✅ GOOD: interface for function-only contracts
interface Logger {
  readonly info: (message: string, data?: unknown) => void;
  readonly warn: (message: string, data?: unknown) => void;
  readonly error: (message: string, data?: unknown) => void;
}

// ✅ GOOD: type for data shapes
type User = {
  readonly id: string;
  readonly email: string;
  readonly createdAt: Date;
};

type ServerMode = 'api' | 'worker' | 'cron';

type HelmSettings = HelmServerSettings | HelmWebappSettings;

// ❌ BAD: interface for data
interface User {
  readonly id: string;
  readonly email: string;
}

// ❌ BAD: type for function contracts
type Logger = {
  readonly info: (message: string) => void;
};

// ❌ BAD: functions inside data types
type User = {
  readonly id: string;
  readonly getDisplayName: () => string;  // Data types should not have methods
};
```

---

## Semantic Type Aliases

Use type aliases to give meaning to primitives. A function accepting `Milliseconds` is self-documenting; a function accepting `number` is not.

```typescript
// ✅ GOOD: Semantic aliases
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

// ❌ BAD: Raw primitives with no meaning
type AnimationConfig = {
  readonly duration: number;  // Seconds? Milliseconds? Frames?
  readonly delay: number;
  readonly width: number;     // Pixels? Rem? Percent?
};
```

---

## Type Guards and Discriminated Unions

Type guards are the functional replacement for `instanceof` checks on classes. Discriminated unions use a shared field to distinguish between variants.

```typescript
// ✅ GOOD: Discriminated union with shared discriminator field
type HelmServerSettings = {
  readonly deploy_type: 'server';
  readonly deploy_modes?: ReadonlyArray<ServerMode>;
  readonly ingress: boolean;
};

type HelmWebappSettings = {
  readonly deploy_type: 'webapp';
  readonly ingress: boolean;
  readonly assets: HelmAssets;
};

type HelmSettings = HelmServerSettings | HelmWebappSettings;

// ✅ GOOD: Type guard using the discriminator
const isHelmServerSettings = (s: HelmSettings): s is HelmServerSettings =>
  s.deploy_type === 'server';

// ✅ GOOD: Type guard for broader unions
const isServerComponent = (c: Component): c is ServerComponent =>
  c.type === 'server';

// ✅ GOOD: Using type guards for safe narrowing
const configureHelm = (settings: HelmSettings): HelmConfig => {
  if (isHelmServerSettings(settings)) {
    // TypeScript knows settings is HelmServerSettings here
    return { modes: settings.deploy_modes ?? ['api'] };
  }
  // TypeScript knows settings is HelmWebappSettings here
  return { assets: settings.assets };
};
```

---

## `as const` and Literal Type Derivation

Use `as const` to create readonly literal tuples. Derive union types from arrays using `typeof ARRAY[number]`.

```typescript
// ✅ GOOD: as const for literal arrays
const VALID_SPEC_TYPES = ['product', 'tech'] as const;
const VALID_STATUSES = ['active', 'deprecated', 'superseded', 'archived', 'draft'] as const;

// ✅ GOOD: Derive union type from const array
type SpecType = (typeof VALID_SPEC_TYPES)[number];  // 'product' | 'tech'
type Status = (typeof VALID_STATUSES)[number];       // 'active' | 'deprecated' | ...

// ✅ GOOD: Use derived type in validation
const isValidSpecType = (value: string): value is SpecType =>
  (VALID_SPEC_TYPES as ReadonlyArray<string>).includes(value);

// ❌ BAD: Duplicating the values as a separate type
const VALID_SPEC_TYPES = ['product', 'tech'];
type SpecType = 'product' | 'tech';  // Easy to get out of sync
```

---

## All Functions Must Return Values

Every function should return a meaningful value. Void functions are extremely rare and should be avoided — they hide information from callers and make code harder to compose.

```typescript
// ✅ GOOD: Return a result that callers can use
const saveSettings = async (path: string, settings: SddConfig): Promise<CommandResult> => {
  try {
    await writeJson(path, settings);
    return { success: true, output: `Settings saved to ${path}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to save settings: ${message}` };
  }
};

// ✅ GOOD: Even simple operations can return useful info
const addToCache = (cache: ReadonlyMap<string, string>, key: string, value: string): ReadonlyMap<string, string> =>
  new Map([...cache, [key, value]]);

// ❌ BAD: Void function hides outcome from caller
const saveSettings = async (path: string, settings: SddConfig): Promise<void> => {
  await writeJson(path, settings);  // Caller can't tell if it worked
};

// ❌ BAD: Side-effect-only function
const logMetrics = (data: Metrics): void => {
  console.log(JSON.stringify(data));
};
```

**Rule**: All functions should return values. If a function has nothing meaningful to return, that's a signal the design should be reconsidered.

**Exception**: Callback signatures in interface contracts (like `Logger`) may use `void` return types, since the caller doesn't consume the return value. This is the only acceptable use of `void`.

---

## Result Unions Over Null

Prefer discriminated union return types over `T | null`. Null is vague — it hides *why* something failed. A union makes every outcome explicit and forces callers to handle each case.

```typescript
// ✅ GOOD: Discriminated union result — caller knows exactly what happened
type CommandResult =
  | { readonly success: true; readonly output: string }
  | { readonly success: false; readonly error: string };

const loadConfig = async (path: string): Promise<CommandResult> => {
  try {
    const config = await readJson<SddConfig>(path);
    return { success: true, output: JSON.stringify(config) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Config not found at ${path}: ${message}` };
  }
};

// Caller is forced to handle both cases:
const result = await loadConfig(path);
if (!result.success) {
  return { success: false, error: result.error };  // Propagate with context
}
// result.output is available here

// ✅ GOOD: Typed validation result
type ValidationResult<T> =
  | { readonly valid: true; readonly data: T }
  | { readonly valid: false; readonly errors: ReadonlyArray<string> };

// ❌ BAD: Null hides the reason for failure
const loadConfig = async (path: string): Promise<SddConfig | null> => {
  try {
    return await readJson<SddConfig>(path);
  } catch {
    return null;  // File missing? Parse error? Permission denied? Caller can't tell
  }
};

// ❌ BAD: Throwing for expected failures
const loadConfig = async (path: string): Promise<SddConfig> => {
  const content = await readText(path);  // Throws on missing file
  return JSON.parse(content);            // Throws on bad JSON
  // Caller needs try/catch and has no typed error information
};
```

**Rule**: Return discriminated union results instead of null or throwing. Reserve `throw` for true programmer errors and invariant violations only.

---

## Error Narrowing in Catch Blocks

When catch blocks are needed (e.g., wrapping third-party calls), always narrow the unknown error type.

```typescript
// ✅ GOOD: Narrow unknown errors with instanceof
try {
  await thirdPartyApi.call(params);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  return { success: false, error: `API call failed: ${message}` };
}

// ✅ GOOD: Wrap and re-throw with context (rare — only for unrecoverable errors)
try {
  await criticalInit();
} catch (err) {
  throw new Error(
    `System initialization failed: ${err instanceof Error ? err.message : String(err)}`
  );
}

// ❌ BAD: Accessing properties on unknown
try {
  await loadConfig(path);
} catch (err) {
  console.log(err.message);  // err is unknown — type error
}

// ❌ BAD: Swallowing errors silently
try {
  await loadConfig(path);
} catch {
  // Silent failure — caller has no idea something went wrong
}
```

---

## External Data Validation

Never assume the shape of data from external sources. Always validate and fail explicitly.

```typescript
// ✅ GOOD: Validate external data shape before use
const reconcileSettings = (raw: unknown): SddConfig => {
  const rawObj = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const rawSdd = (typeof rawObj.sdd === 'object' && rawObj.sdd !== null
    ? rawObj.sdd
    : {}) as Record<string, unknown>;
  const rawComponents = Array.isArray(rawObj.components)
    ? (rawObj.components as ReadonlyArray<Record<string, unknown>>)
    : [];
  // ... build typed result from validated fields
};

// ✅ GOOD: Validate CLI args against a schema
const result = validateArgs<SpecArgs>(args, specCommandSchema);
if (!result.valid) {
  return { success: false, error: result.errors.join(', ') };
}
// result.data is now typed as SpecArgs

// ✅ GOOD: Validate env vars exist before use
const pgHost = named['host'] ?? process.env['PGHOST'] ?? 'localhost';
const pgPort = named['port'] ?? process.env['PGPORT'] ?? '5432';

// ❌ BAD: Trusting external data without validation
const config = YAML.parse(rawYaml) as SddConfig;  // Could be anything
config.sdd.version;  // Runtime crash if sdd is undefined

// ❌ BAD: Assuming env var exists
const apiKey = process.env.API_KEY;  // Could be undefined
fetch(url, { headers: { Authorization: apiKey } });  // Sends "undefined"
```

**Rule**: Trust internal types (function-to-function within the codebase). Validate at system boundaries (CLI args, env vars, config files, API responses, YAML/JSON parsing).

---

## Async/Promise Patterns

```typescript
// ✅ GOOD: Explicit Promise<T> return type
const loadSettings = async (path: string): Promise<CommandResult> => {
  // ...
};

// ✅ GOOD: Promise.all for concurrent independent operations
const validationResults = await Promise.all(
  specs.map((spec) => validateSpecFile(spec.path))
);

// ✅ GOOD: Promise.all with typed results
const results = await Promise.all(
  entries.map(async (entry): Promise<ReadonlyArray<string>> => {
    if (entry.isDirectory()) {
      return walkDir(fullPath, filter);
    }
    return [];
  })
);

// ❌ BAD: Sequential when parallel is possible
const result1 = await validateSpec(spec1);
const result2 = await validateSpec(spec2);  // Waits unnecessarily

// ❌ BAD: Missing return type annotation
const loadSettings = async (path: string) => {  // Return type unclear
  // ...
};
```

---

## Generic Constraints

```typescript
// ✅ GOOD: Generic for type-safe JSON parsing
const readJson = async <T>(filePath: string): Promise<T> => {
  const content = await readText(filePath);
  return JSON.parse(content) as T;
};

// Usage: caller specifies the expected type
const pkg = await readJson<{ readonly name?: string }>(packageJsonPath);

// ✅ GOOD: Generic with constraint for validation
const validateArgs = <T>(
  args: Readonly<Record<string, unknown>>,
  schema: CommandSchema,
): ValidationResult<T> => {
  // ...
};

// ❌ BAD: Using `any` instead of generics
const readJson = async (filePath: string): Promise<any> => {
  // Loses all type information
};
```

---

## Null vs Undefined

For function return types, prefer result unions (see Result Unions Over Null). This section covers the distinction between null and undefined in type fields and when interacting with external APIs.

```typescript
// ✅ GOOD: undefined via optional fields ("not provided")
type HelmServerSettings = {
  readonly deploy_modes?: ReadonlyArray<ServerMode>;  // Optional = may be undefined
};

// ✅ GOOD: Handling undefined from native APIs
const first = items.find(i => i.active);  // Returns T | undefined natively
if (first === undefined) {
  return { success: false, error: 'No active items found' };
}

// ✅ GOOD: Handling null from external/DOM APIs
const element = document.getElementById('root');  // Returns HTMLElement | null
if (element === null) {
  return { success: false, error: 'Root element not found' };
}

// ❌ BAD: Mixing null and undefined in your own types
type Config = {
  readonly host: string | null;     // Sometimes null
  readonly port: string | undefined; // Sometimes undefined
  // Inconsistent — use optional fields (undefined) for "not provided"
};

// ❌ BAD: Returning null from your own functions
const findComponent = (name: string): Component | null => {
  return components.find(c => c.name === name) ?? null;
  // Use a result union instead (see Result Unions Over Null)
};
```

**Rule**: Use `undefined` (via `?:`) for optional type fields. Handle `null`/`undefined` from external APIs by converting to result unions. Never return `null` from your own functions — use result unions instead.

---

## `Record<string, never>` for Empty Types

```typescript
// ✅ GOOD: Record<string, never> for placeholder types
type ConfigSettings = Record<string, never>;
type TestingSettings = Record<string, never>;
type CicdSettings = Record<string, never>;

// These can be used in unions without accepting arbitrary data:
type ComponentSettings = ServerSettings | DatabaseSettings | ConfigSettings;

// ❌ BAD: Using {} or object for empty types
type ConfigSettings = {};        // Accepts any non-nullish value
type ConfigSettings = object;    // Too broad
```

---

## Nullish Coalescing (`??`) vs Logical OR (`||`)

```typescript
// ✅ GOOD: ?? for defaults (preserves 0, '', false)
const port = config.port ?? 3000;      // Only falls through on null/undefined
const name = config.name ?? 'default'; // '' is a valid name, kept as-is
const verbose = config.verbose ?? false;

// ✅ GOOD: || only when 0/''/false should also trigger the default
const displayName = user.nickname || user.email;  // Empty string → use email

// ❌ BAD: || when 0 or '' are valid values
const port = config.port || 3000;  // port=0 becomes 3000 — wrong!
const count = config.count || 10;  // count=0 becomes 10 — wrong!
```

**Rule**: Default to `??`. Only use `||` when you intentionally want to fall through on all falsy values.

---

## `import type` for Type-Only Imports

```typescript
// ✅ GOOD: Separate type imports from value imports
import { createLogger } from '@/lib/logger';
import type { Logger } from '@/lib/logger';

import { validateArgs } from '@/lib/schema-validator';
import type { CommandResult, GlobalOptions } from '@/lib/args';

// ✅ GOOD: Pure type imports when no values are needed
import type { HookInput, PostToolUseHookOutput } from '@/types/config';
import type { SddConfig, Component } from '@/types/settings';

// ❌ BAD: Importing types without the type keyword
import { Logger } from '@/lib/logger';         // Looks like a value import
import { SddConfig } from '@/types/settings';  // Bundler can't tree-shake
```

**Why**: `import type` is erased at compile time, ensuring types never appear in output bundles. It also makes the intent explicit — readers know immediately this import is for types only.

---

## `keyof` and Indexed Access Types

```typescript
// ✅ GOOD: keyof for type-safe property access
type Component = {
  readonly name: string;
  readonly type: string;
  readonly settings: ComponentSettings;
};

type ComponentKey = keyof Component;  // 'name' | 'type' | 'settings'

const getField = (component: Component, field: ComponentKey): unknown =>
  component[field];

// ✅ GOOD: Indexed access for extracting nested types
type ComponentType = Component['type'];       // string
type Settings = Component['settings'];        // ComponentSettings

// ✅ GOOD: Combine with typeof for constants
const DEFAULTS = { host: 'localhost', port: 3000 } as const;
type DefaultKey = keyof typeof DEFAULTS;  // 'host' | 'port'
```

---

## `Object.entries` / `Object.fromEntries`

```typescript
// ✅ GOOD: Object.entries for iterating key-value pairs
const envVars = Object.entries(urls.databases).map(
  ([name, config]) => `${name.toUpperCase()}_URL=${config.url}`
);

// ✅ GOOD: Object.fromEntries for building objects from entries
const uppercased = Object.fromEntries(
  Object.entries(config).map(([k, v]) => [k.toUpperCase(), v])
);

// ✅ GOOD: Filtering object properties immutably
const withoutSecrets = Object.fromEntries(
  Object.entries(config).filter(([key]) => !key.startsWith('secret_'))
);

// ❌ BAD: Manual object mutation
const uppercased: Record<string, string> = {};
for (const key of Object.keys(config)) {
  uppercased[key.toUpperCase()] = config[key];  // Mutation!
}
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
