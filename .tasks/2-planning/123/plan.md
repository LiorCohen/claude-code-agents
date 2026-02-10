---
title: Update TypeScript standards with missing patterns and corrections
created: 2026-02-10
---

# Plan: Update TypeScript Standards

## Problem Summary

The TypeScript standards skill (`SKILL.md`) is missing several foundational patterns used throughout the codebase. It also incorrectly allows `let`. This plan adds 16 new sections with concrete examples and corrects the `let` policy.

## Files to Modify

| File | Changes |
|------|---------|
| `.claude/skills/typescript-standards/SKILL.md` | Add 16 new sections, correct `let` ban, update summary checklist |
| `plugin/skills/typescript-standards/SKILL.md` | Mirror all changes from the marketplace copy (keep plugin-specific Input/Output footer) |

## Changes

Changes are made to `.claude/skills/typescript-standards/SKILL.md` (marketplace copy), then mirrored to `plugin/skills/typescript-standards/SKILL.md` (plugin copy). The plugin copy preserves its Input/Output footer.

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

### 6. New Section: All Functions Must Return Values

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

### 7. New Section: Result Unions Over Null

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

### 8. New Section: Error Narrowing in Catch Blocks

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

### 9. New Section: External Data Validation

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

### 10. New Section: Async/Promise Patterns

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

### 11. New Section: Generic Constraints

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

### 12. New Section: Null vs Undefined

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

### 13. New Section: `Record<string, never>` for Empty Types

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

### 14. New Section: Nullish Coalescing (`??`) vs Logical OR (`||`)

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

### 15. New Section: `import type` for Type-Only Imports

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

### 16. New Section: `keyof` and Indexed Access Types

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

### 17. New Section: `Object.entries` / `Object.fromEntries`

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

### 18. Update Summary Checklist

Add new items to the checklist:

- `interface` for function contracts only, `type` for everything else
- Semantic type aliases for meaningful primitives
- Type guards for discriminated union narrowing
- `as const` for literal arrays; derive union types with `typeof X[number]`
- All functions return values (no void)
- Result unions over null — discriminated union return types for failable operations
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

### 19. Sync Plugin Copy

After all changes to `.claude/skills/typescript-standards/SKILL.md`, copy the content to `plugin/skills/typescript-standards/SKILL.md`, preserving the plugin-specific Input/Output footer section at the end.

## Dependencies

None. No code dependencies.

## Tests

No tests — this is a documentation-only change to a skill file.

## Verification

- [ ] All 16 new sections have concrete code examples with ✅/❌ patterns
- [ ] "All functions must return values" section shows void alternatives
- [ ] "Result unions over null" section shows discriminated union return types
- [ ] `let` is banned in both the Immutability section and Summary Checklist
- [ ] `interface` vs `type` rule is clear: interface for function contracts, type for everything else
- [ ] Examples use real patterns from the codebase (settings types, Logger, spec types, etc.)
- [ ] Summary checklist reflects all new rules
- [ ] No existing sections are broken or removed
- [ ] Plugin copy mirrors marketplace copy (with Input/Output footer preserved)
- [ ] Document reads coherently top-to-bottom
