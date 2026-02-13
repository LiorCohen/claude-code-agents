# Module System Rules

## Named Exports Only

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

## ES Modules Only

**CRITICAL:** Never use CommonJS modules. Always use ES module syntax.

```typescript
// GOOD: ES modules
import { createUser } from './user';
import type { User } from './types';
export { updateUser } from './user';

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

## index.ts File Rules

**CRITICAL:** All `index.ts` files must contain ONLY imports and exports. Never put actual code or logic in index files.

```typescript
// GOOD: index.ts with only exports
export { createUser } from './createUser';
export { updateUser } from './updateUser';
export { deleteUser } from './deleteUser';

export type { CreateUserArgs, CreateUserResult } from './createUser';
export type { UpdateUserArgs, UpdateUserResult } from './updateUser';

// BAD: Logic in index.ts
export const createUser = async (deps, args) => {
  // Implementation here - WRONG!
};

const helper = () => { /* ... */ }; // WRONG!
```

**Why:** Index files should be pure re-export modules for clean public APIs. Logic belongs in dedicated files.

## Import Through index.ts Only

**CRITICAL:** Never bypass a module's `index.ts` file. Always import from the module's public API.

```typescript
// GOOD: Import from module's public API
import { createUser, updateUser } from '../user';
import type { User, UserRole } from '../user';

// BAD: Bypassing index.ts
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

## Intra-Module Imports

**CRITICAL:** Inside a module, nothing should ever import from its own `index.ts`. All imports within a module must use relative paths. The barrel is the module's public API for *external* consumers only. For nested modules, the same barrel rules apply.

```typescript
// Given this structure:
// user/
// ├── index.ts          ← barrel for external consumers
// ├── create_user.ts
// ├── update_user.ts
// ├── types.ts
// └── validation/
//     ├── index.ts
//     └── validate_email.ts

// In user/create_user.ts:

// GOOD: relative path to sibling file
import type { User } from './types';

// GOOD: relative path to nested sub-module barrel
import { validateEmail } from './validation';

// BAD: importing from own module's barrel
import type { User } from '.';              // circular
import { validateEmail } from './index';    // circular
```

**Why:** Importing from the module's own `index.ts` creates circular dependencies and defeats the purpose of the barrel (which is the module's public contract for external consumers, not internal wiring).

## No File Extensions in Imports

**CRITICAL:** Never include file extensions in import statements.

```typescript
// GOOD: No extensions
import { createUser } from './user';
import { config } from '@/lib/config';

// BAD: Extensions in imports
import { createUser } from './user.js';    // NEVER
import { Component } from './Component.tsx'; // NEVER
```

## Path Aliases for Deep Imports

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

## `import type` for Type-Only Imports

```typescript
// GOOD: Separate type imports from value imports
import { createLogger } from '@/lib/logger';
import type { Logger } from '@/lib/logger';

import { validateArgs } from '@/lib/schema-validator';
import type { CommandResult, GlobalOptions } from '@/lib/args';

// GOOD: Pure type imports when no values are needed
import type { HookInput, PostToolUseHookOutput } from '@/types/config';
import type { SddConfig, Component } from '@/types/settings';

// BAD: Importing types without the type keyword
import { Logger } from '@/lib/logger';         // Looks like a value import
import { SddConfig } from '@/types/settings';  // Bundler can't tree-shake
```

**Why**: `import type` is erased at compile time, ensuring types never appear in output bundles. It also makes the intent explicit — readers know immediately this import is for types only.
