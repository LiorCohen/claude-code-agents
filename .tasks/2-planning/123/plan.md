---
title: Update TypeScript standards with missing patterns and corrections
created: 2026-02-10
---

# Plan: Update TypeScript Standards

## Problem Summary

The TypeScript standards skill (`SKILL.md`) is missing several foundational patterns used throughout the codebase. It also incorrectly allows `let`. This plan adds 14 new sections with concrete examples and corrects the `let` policy.

## Files to Modify

| File | Changes |
|------|---------|
| `.claude/skills/typescript-standards/SKILL.md` | Add 14 new sections, correct `let` ban, update summary checklist |

## Changes

All changes target a single file: `.claude/skills/typescript-standards/SKILL.md`.

New sections are inserted **after** "Prefer Readonly Types" and **before** "Summary Checklist". The existing sections remain unchanged except for the `let` correction in "Immutability" and the updated checklist.

### 1. Correction: Ban `let` Entirely

In the "Immutability" section, change:

> Prefer `const` over `let`; never use `var`

To:

> Use `const` exclusively; never use `let` or `var`

Add examples showing functional alternatives to common `let` patterns:

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

### 2. New Section: Interface vs Type

Rule: `interface` for function-only contracts (callbacks, loggers, handlers). `type` for everything else. Data types should not contain functions.

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

### 3. New Section: Semantic Type Aliases

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

### 4. New Section: Type Guards and Discriminated Unions

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

### 5. New Section: `as const` and Literal Type Derivation

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

### 6. New Section: Error Handling Patterns

Beyond defining Error subclasses — how to catch, narrow, and propagate errors.

```typescript
// ✅ GOOD: Narrow unknown errors in catch blocks
try {
  await loadConfig(path);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  return { success: false, error: `Failed to load config: ${message}` };
}

// ✅ GOOD: Wrap errors with context
try {
  await writeSettings(filePath, settings);
} catch (err) {
  throw new Error(
    `Failed to write settings to ${filePath}: ${err instanceof Error ? err.message : String(err)}`
  );
}

// ✅ GOOD: Return null for expected failures (file not found, parse failure)
const readConfig = async (path: string): Promise<Config | null> => {
  try {
    return await readJson<Config>(path);
  } catch {
    return null;
  }
};

// ❌ BAD: Untyped catch without narrowing
try {
  await loadConfig(path);
} catch (err) {
  console.log(err.message);  // err is unknown, this fails
}

// ❌ BAD: Swallowing errors silently
try {
  await loadConfig(path);
} catch {
  // Silent failure — caller has no idea something went wrong
}
```

**When to throw vs return null:**
- **Throw**: Programmer errors, invariant violations, unrecoverable states
- **Return null**: Expected failures like missing files, parse failures, optional lookups

### 7. New Section: External Data Validation

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

### 8. New Section: Async/Promise Patterns

```typescript
// ✅ GOOD: Explicit Promise<T> return type
const loadSettings = async (path: string): Promise<SddConfig | null> => {
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

### 9. New Section: Generic Constraints

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

### 10. New Section: Null vs Undefined

```typescript
// ✅ GOOD: null for intentional absence ("we looked, it's not there")
const findComponent = (name: string): Component | null => {
  const match = components.find(c => c.name === name);
  return match ?? null;
};

// ✅ GOOD: undefined for optional/unset ("not provided")
type HelmServerSettings = {
  readonly deploy_modes?: ReadonlyArray<ServerMode>;  // Optional = may be undefined
};

// ❌ BAD: Mixing null and undefined for the same concept
type Config = {
  readonly host: string | null;     // Sometimes null
  readonly port: string | undefined; // Sometimes undefined
  // Confusing — pick one convention
};
```

**Rule**: Use `null` for "looked up and absent." Use `undefined` (via `?:`) for "not provided / optional."

### 11. New Section: `Record<string, never>` for Empty Types

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

### 12. New Section: Nullish Coalescing (`??`) vs Logical OR (`||`)

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

### 13. New Section: `import type` for Type-Only Imports

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

### 14. New Section: `keyof` and Indexed Access Types

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

### 15. New Section: `Object.entries` / `Object.fromEntries`

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

### 16. Update Summary Checklist

Add new items to the checklist:

- `interface` for function contracts only, `type` for everything else
- Semantic type aliases for meaningful primitives
- Type guards for discriminated union narrowing
- `as const` for literal arrays; derive union types with `typeof X[number]`
- Error catch blocks narrow with `instanceof Error`
- External data validated at system boundaries
- Async functions have explicit `Promise<T>` return types
- `import type` for type-only imports
- `??` for defaults (not `||`)
- No `let` — use `const` with `.map`/`.reduce`/ternaries

Remove the old `let` language:
> ~~All `const` declarations (no `let` unless absolutely necessary, never `var`)~~

Replace with:
> All `const` declarations (never `let`, never `var`)

## Dependencies

None. Single-file change with no code dependencies.

## Tests

No tests — this is a documentation-only change to a skill file.

## Verification

- [ ] All 14 new sections have concrete code examples with ✅/❌ patterns
- [ ] `let` is banned in both the Immutability section and Summary Checklist
- [ ] `interface` vs `type` rule is clear: interface for function contracts, type for everything else
- [ ] Examples use real patterns from the codebase (settings types, Logger, spec types, etc.)
- [ ] Summary checklist reflects all new rules
- [ ] No existing sections are broken or removed
- [ ] Document reads coherently top-to-bottom
