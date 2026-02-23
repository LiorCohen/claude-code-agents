# Error Handling

## Result Unions Over Null

Prefer discriminated union return types over `T | null`. Null is vague — it hides *why* something failed. A union makes every outcome explicit and forces callers to handle each case.

```typescript
// GOOD: Discriminated union result — caller knows exactly what happened
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

// GOOD: Typed validation result
type ValidationResult<T> =
  | { readonly valid: true; readonly data: T }
  | { readonly valid: false; readonly errors: ReadonlyArray<string> };

// BAD: Null hides the reason for failure
const loadConfig = async (path: string): Promise<SddConfig | null> => {
  try {
    return await readJson<SddConfig>(path);
  } catch {
    return null;  // File missing? Parse error? Permission denied? Caller can't tell
  }
};

// BAD: Throwing for expected failures
const loadConfig = async (path: string): Promise<SddConfig> => {
  const content = await readText(path);  // Throws on missing file
  return JSON.parse(content);            // Throws on bad JSON
  // Caller needs try/catch and has no typed error information
};
```

**Rule**: Return discriminated union results instead of null or throwing. Reserve `throw` for true programmer errors and invariant violations only.

## Error Narrowing in Catch Blocks

When catch blocks are needed (e.g., wrapping third-party calls), always narrow the unknown error type.

```typescript
// GOOD: Narrow unknown errors with instanceof
try {
  await thirdPartyApi.call(params);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  return { success: false, error: `API call failed: ${message}` };
}

// GOOD: Wrap and re-throw with context (rare — only for unrecoverable errors)
try {
  await criticalInit();
} catch (err) {
  throw new Error(
    `System initialization failed: ${err instanceof Error ? err.message : String(err)}`
  );
}

// BAD: Accessing properties on unknown
try {
  await loadConfig(path);
} catch (err) {
  console.log(err.message);  // err is unknown — type error
}

// BAD: Swallowing errors silently
try {
  await loadConfig(path);
} catch {
  // Silent failure — caller has no idea something went wrong
}
```

## External Data Validation

Never assume the shape of data from external sources. Always validate and fail explicitly.

```typescript
// GOOD: Validate external data shape before use
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

// GOOD: Validate CLI args against a schema
const result = validateArgs<SpecArgs>(args, specCommandSchema);
if (!result.valid) {
  return { success: false, error: result.errors.join(', ') };
}
// result.data is now typed as SpecArgs

// GOOD: Validate env vars exist before use
const pgHost = named['host'] ?? process.env['PGHOST'] ?? 'localhost';
const pgPort = named['port'] ?? process.env['PGPORT'] ?? '5432';

// BAD: Trusting external data without validation
const config = YAML.parse(rawYaml) as SddConfig;  // Could be anything
config.sdd.version;  // Runtime crash if sdd is undefined

// BAD: Assuming env var exists
const apiKey = process.env.API_KEY;  // Could be undefined
fetch(url, { headers: { Authorization: apiKey } });  // Sends "undefined"
```

**Rule**: Trust internal types (function-to-function within the codebase). Validate at system boundaries (CLI args, env vars, config files, API responses, YAML/JSON parsing).
