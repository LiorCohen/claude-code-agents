# Advanced Types

## Type Guards and Discriminated Unions

Type guards are the functional replacement for `instanceof` checks on classes. Discriminated unions use a shared field to distinguish between variants.

```typescript
// GOOD: Discriminated union with shared discriminator field
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

// GOOD: Type guard using the discriminator
const isHelmServerSettings = (s: HelmSettings): s is HelmServerSettings =>
  s.deploy_type === 'server';

// GOOD: Type guard for broader unions
const isServerComponent = (c: Component): c is ServerComponent =>
  c.type === 'server';

// GOOD: Using type guards for safe narrowing
const configureHelm = (settings: HelmSettings): HelmConfig => {
  if (isHelmServerSettings(settings)) {
    // TypeScript knows settings is HelmServerSettings here
    return { modes: settings.deploy_modes ?? ['api'] };
  }
  // TypeScript knows settings is HelmWebappSettings here
  return { assets: settings.assets };
};
```

## `as const` and Literal Type Derivation

Use `as const` to create readonly literal tuples. Derive union types from arrays using `typeof ARRAY[number]`.

```typescript
// GOOD: as const for literal arrays
const VALID_SPEC_TYPES = ['product', 'tech'] as const;
const VALID_STATUSES = ['active', 'deprecated', 'superseded', 'archived', 'draft'] as const;

// GOOD: Derive union type from const array
type SpecType = (typeof VALID_SPEC_TYPES)[number];  // 'product' | 'tech'
type Status = (typeof VALID_STATUSES)[number];       // 'active' | 'deprecated' | ...

// GOOD: Use derived type in validation
const isValidSpecType = (value: string): value is SpecType =>
  (VALID_SPEC_TYPES as ReadonlyArray<string>).includes(value);

// BAD: Duplicating the values as a separate type
const VALID_SPEC_TYPES = ['product', 'tech'];
type SpecType = 'product' | 'tech';  // Easy to get out of sync
```

## Generic Constraints

```typescript
// GOOD: Generic for type-safe JSON parsing
const readJson = async <T>(filePath: string): Promise<T> => {
  const content = await readText(filePath);
  return JSON.parse(content) as T;
};

// Usage: caller specifies the expected type
const pkg = await readJson<{ readonly name?: string }>(packageJsonPath);

// GOOD: Generic with constraint for validation
const validateArgs = <T>(
  args: Readonly<Record<string, unknown>>,
  schema: CommandSchema,
): ValidationResult<T> => {
  // ...
};

// BAD: Using `any` instead of generics
const readJson = async (filePath: string): Promise<any> => {
  // Loses all type information
};
```

## `keyof` and Indexed Access Types

```typescript
// GOOD: keyof for type-safe property access
type Component = {
  readonly name: string;
  readonly type: string;
  readonly settings: ComponentSettings;
};

type ComponentKey = keyof Component;  // 'name' | 'type' | 'settings'

const getField = (component: Component, field: ComponentKey): unknown =>
  component[field];

// GOOD: Indexed access for extracting nested types
type ComponentType = Component['type'];       // string
type Settings = Component['settings'];        // ComponentSettings

// GOOD: Combine with typeof for constants
const DEFAULTS = { host: 'localhost', port: 3000 } as const;
type DefaultKey = keyof typeof DEFAULTS;  // 'host' | 'port'
```

## `Object.entries` / `Object.fromEntries`

```typescript
// GOOD: Object.entries for iterating key-value pairs
const envVars = Object.entries(urls.databases).map(
  ([name, config]) => `${name.toUpperCase()}_URL=${config.url}`
);

// GOOD: Object.fromEntries for building objects from entries
const uppercased = Object.fromEntries(
  Object.entries(config).map(([k, v]) => [k.toUpperCase(), v])
);

// GOOD: Filtering object properties immutably
const withoutSecrets = Object.fromEntries(
  Object.entries(config).filter(([key]) => !key.startsWith('secret_'))
);

// BAD: Manual object mutation
const uppercased: Record<string, string> = {};
for (const key of Object.keys(config)) {
  uppercased[key.toUpperCase()] = config[key];  // Mutation!
}
```
