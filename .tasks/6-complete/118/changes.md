# Task #118 — Change Report

**Branch:** `feature/task-118-json-schema-2020-12`
**Commits:** 2 (implementation + tests)
**Files changed:** 15 (+427 / -79 lines)

---

## 1. [`plugin/system/src/lib/json-schema.ts`](plugin/system/src/lib/json-schema.ts)

New centralized AJV 2020-12 wrapper — the ONLY place in the system CLI that imports AJV directly. Exports `JsonSchema` type, `compileSchema()`, and `validateAgainstSchema()`.

```typescript
/**
 * Centralized JSON Schema validation using AJV 2020-12.
 *
 * This is the ONLY place in the system CLI that imports AJV directly.
 * All other modules should use the functions exported here.
 */

import Ajv2020 from 'ajv/dist/2020.js';
import type { ErrorObject, ValidateFunction } from 'ajv/dist/2020.js';

/**
 * JSON Schema type covering the subset used by the codebase.
 * Replaces @types/json-schema's JSONSchema7 with 2020-12 semantics.
 */
export type JsonSchema = {
  readonly $schema?: string;
  readonly $defs?: Readonly<Record<string, JsonSchema>>;
  readonly $ref?: string;
  readonly title?: string;
  readonly description?: string;
  readonly type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null' | 'integer';
  readonly properties?: Readonly<Record<string, JsonSchema>>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean | JsonSchema;
  readonly items?: JsonSchema;
  readonly minItems?: number;
  readonly enum?: readonly unknown[];
  readonly const?: unknown;
  readonly pattern?: string;
  readonly default?: unknown;
  readonly if?: JsonSchema;
  readonly then?: JsonSchema;
  readonly oneOf?: readonly JsonSchema[];
};

/** Re-export of AJV's ErrorObject for consumers that inspect errors. */
export type SchemaValidationError = ErrorObject;

/** Type for compiled validator functions. */
export type SchemaValidateFunction = ValidateFunction;

/**
 * Compile a JSON Schema into a reusable validator function.
 *
 * Uses Ajv2020 internally — callers pass the full schema object
 * including $schema (no stripping needed).
 */
export const compileSchema = (
  schema: JsonSchema,
  options?: { readonly allErrors?: boolean; readonly strict?: boolean }
): ValidateFunction => {
  const ajv = new Ajv2020({
    allErrors: options?.allErrors ?? true,
    strict: options?.strict ?? false,
  });
  return ajv.compile(schema);
};

/**
 * Validate data against a JSON Schema in one call.
 *
 * Returns a discriminated union: check `result.valid` to narrow the type.
 */
export const validateAgainstSchema = (
  data: unknown,
  schema: JsonSchema,
  options?: { readonly allErrors?: boolean; readonly strict?: boolean }
): { readonly valid: true } | { readonly valid: false; readonly errors: readonly SchemaValidationError[] } => {
  const validate = compileSchema(schema, options);
  if (validate(data)) {
    return { valid: true };
  }
  return { valid: false, errors: validate.errors ?? [] };
};
```

---

## 2. [`plugin/system/src/settings/schema.ts`](plugin/system/src/settings/schema.ts)

Replaced `JSONSchema7` type (from `@types/json-schema`) with `JsonSchema` from the new lib. Updated `$schema` URI from draft-07 to 2020-12. 28 type annotations changed.

```diff
-import type { JSONSchema7 } from 'json-schema';
+import type { JsonSchema } from '@/lib/json-schema';

 /** JSON Schema for server modes */
-const serverModeSchema: JSONSchema7 = {
+const serverModeSchema: JsonSchema = {
   type: 'string',
   enum: ['api', 'worker', 'cron'],
 };

 ...

 /** Complete JSON Schema for settings file */
-export const settingsFileSchema: JSONSchema7 = {
-  $schema: 'http://json-schema.org/draft-07/schema#',
+export const settingsFileSchema: JsonSchema = {
+  $schema: 'https://json-schema.org/draft/2020-12/schema',
```

---

## 3. [`plugin/system/src/commands/config/validate.ts`](plugin/system/src/commands/config/validate.ts)

Replaced direct AJV import with centralized lib. Removed `$schema` stripping workaround.

```diff
-import Ajv, { type ErrorObject } from 'ajv';
+import { compileSchema, type SchemaValidationError, type JsonSchema } from '@/lib/json-schema';

-  // Load schema
-  const schema = (() => {
+  // Load and compile schema
+  const schemaResult = (() => {
     try {
-      const rawSchema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as Readonly<Record<string, unknown>>;
-      // Remove $schema property as ajv doesn't need it for validation
-      // and default ajv doesn't support 2020-12 draft
-      const { ['$schema']: _, ...rest } = rawSchema;
-      return { success: true as const, value: rest };
+      const schema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as JsonSchema;
+      return { success: true as const, validateFn: compileSchema(schema) };
     } catch (err) {

-  const ajv = new Ajv({ allErrors: true, strict: false });
-  const validateFn = ajv.compile(schema.value);
+  const validateFn = schemaResult.validateFn;
```

---

## 4. [`plugin/system/src/commands/config/generate.ts`](plugin/system/src/commands/config/generate.ts)

Same pattern as validate.ts — replaced direct AJV import and `$schema` stripping with lib.

```diff
-import Ajv, { type ErrorObject } from 'ajv';
+import { compileSchema, type SchemaValidationError, type JsonSchema } from '@/lib/json-schema';

-        const rawSchema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as Readonly<Record<string, unknown>>;
-        // Remove $schema property as ajv doesn't need it for validation
-        // and default ajv doesn't support 2020-12 draft
-        const { ['$schema']: _, ...schema } = rawSchema;
-        const ajv = new Ajv({ allErrors: true, strict: false });
-        const validate = ajv.compile(schema);
+        const schema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as JsonSchema;
+        const validate = compileSchema(schema);
```

---

## 5. [`plugin/system/src/commands/scaffolding/apply.ts`](plugin/system/src/commands/scaffolding/apply.ts)

Replaced direct AJV import with centralized lib. Updated `getSchemaValidator` cache types.

```diff
-import Ajv from 'ajv';
+import { compileSchema, type SchemaValidateFunction, type JsonSchema } from '@/lib/json-schema';

 const getSchemaValidator = (() => {
-  const cache = new Map<string, ReturnType<Ajv['compile']>>();
-  return (): ReturnType<Ajv['compile']> => {
+  const cache = new Map<string, SchemaValidateFunction>();
+  return (): SchemaValidateFunction => {
     const existing = cache.get('validator');
     if (existing) return existing;
     const schemaPath = join(dirname(fileURLToPath(import.meta.url)), 'scaffold-spec.schema.json');
-    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as Readonly<Record<string, unknown>>;
-    const ajv = new Ajv({ allErrors: true });
-    const validate = ajv.compile(schema);
+    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as JsonSchema;
+    const validate = compileSchema(schema);
```

---

## 6. [`plugin/system/src/commands/scaffolding/scaffold-spec.schema.json`](plugin/system/src/commands/scaffolding/scaffold-spec.schema.json)

Added `$schema` declaration. Renamed `definitions` to `$defs`. Updated all `$ref` paths.

```diff
 {
+  "$schema": "https://json-schema.org/draft/2020-12/schema",
   "title": "Scaffold Spec",

-              "when": { "$ref": "#/definitions/when" }
+              "when": { "$ref": "#/$defs/when" }

-  "definitions": {
+  "$defs": {

-        { "$ref": "#/definitions/single_condition" },
+        { "$ref": "#/$defs/single_condition" },
```

---

## 7. [`plugin/skills/components/backend/backend-scaffolding/templates/src/config/load_config.ts`](plugin/skills/components/backend/backend-scaffolding/templates/src/config/load_config.ts)

Backend template switched to `Ajv2020` (template cannot use internal `@/lib`).

```diff
-import Ajv from 'ajv';
+import Ajv2020 from 'ajv/dist/2020.js';

-    const ajv = new Ajv();
+    const ajv = new Ajv2020();
```

---

## 8. [`plugin/skills/components/integration-testing/integration-testing/SKILL.md`](plugin/skills/components/integration-testing/integration-testing/SKILL.md)

Updated contract testing example code to use `Ajv2020`.

```diff
-import Ajv from 'ajv';
+import Ajv2020 from 'ajv/dist/2020.js';

-const ajv = new Ajv({ allErrors: true });
+const ajv = new Ajv2020({ allErrors: true });
```

---

## 9. [`plugin/system/package.json`](plugin/system/package.json)

Removed `@types/json-schema` dev dependency (replaced by custom `JsonSchema` type).

```diff
   "devDependencies": {
-    "@types/json-schema": "^7.0.15",
     "@types/node": "^22.0.0",
```

---

## 10. [`tests/src/tests/unit/lib/json-schema.test.ts`](tests/src/tests/unit/lib/json-schema.test.ts)

New test file — 10 tests for the centralized JSON Schema lib (6 source structure + 4 runtime behavior).

```typescript
describe('JSON Schema Lib', () => {
  describe('source file structure', () => {
    // 6 tests: verifies exports (compileSchema, validateAgainstSchema,
    // JsonSchema, SchemaValidationError, SchemaValidateFunction) and Ajv2020 import
  });

  describe('runtime behavior', () => {
    // 4 tests: compileSchema returns function, validateAgainstSchema valid/invalid,
    // compileSchema accepts 2020-12 $schema
  });
});
```

---

## 11. [`tests/src/tests/unit/standards/json-schema-2020-12.test.ts`](tests/src/tests/unit/standards/json-schema-2020-12.test.ts)

New test file — 7 codebase conformance tests preventing regression to draft-07.

```typescript
describe('JSON Schema 2020-12 Conformance', () => {
  // settings schema has 2020-12 URI
  // scaffold-spec.schema.json has $schema and uses $defs
  // no draft-07 references in TypeScript source
  // no JSONSchema7 type imports
  // no direct AJV imports outside lib
  // no @types/json-schema dependency
});
```

---

## 12. [`tests/src/tests/unit/standards/typescript-standards.test.ts`](tests/src/tests/unit/standards/typescript-standards.test.ts)

Added specific file exclusion for `json-schema.ts` in the `.js` import check (required for `ajv/dist/2020.js` ESM subpath resolution).

```diff
+// AJV wrapper requires .js extension for Node.js ESM subpath resolution (ajv/dist/2020.js)
+const JS_EXTENSION_ALLOWED = new Set(['json-schema.ts']);

       for (const file of allTsFiles) {
+        if (JS_EXTENSION_ALLOWED.has(file.split('/').pop()!)) continue;
```

---

## 13. [`tests/src/tests/integration/backend-component/config-integration.test.ts`](tests/src/tests/integration/backend-component/config-integration.test.ts)

Updated test assertions to match the new `Ajv2020` import in the backend template.

```diff
-  it('imports ajv for schema validation', () => {
+  it('imports ajv 2020-12 for schema validation', () => {
     const content = readFile(LOAD_CONFIG_PATH);
-    expect(content).toContain("from 'ajv'");
-    expect(content).toContain('Ajv');
+    expect(content).toContain("from 'ajv/dist/2020.js'");
+    expect(content).toContain('Ajv2020');
```

---

## 14. [`plugin/.claude-plugin/plugin.json`](plugin/.claude-plugin/plugin.json) + [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json)

Version bump 6.7.3 → 6.7.4.

```diff
-  "version": "6.7.3"
+  "version": "6.7.4"
```

---

## 15. [`changelog/v6.md`](changelog/v6.md)

Added changelog entry for 6.7.4.

```diff
+## [6.7.4] - 2026-02-12
+
+### Changed
+
+- **system CLI**: Upgrade all JSON Schema usage to 2020-12 with centralized AJV wrapper
+  - Created `lib/json-schema.ts` — single AJV entry point with `compileSchema` and `validateAgainstSchema`
+  - Replaced `JSONSchema7` type with custom `JsonSchema` type (removed `@types/json-schema` dependency)
+  - Updated `settings/schema.ts` `$schema` URI from draft-07 to 2020-12
+  - Replaced direct AJV imports in `config/validate.ts`, `config/generate.ts`, `scaffolding/apply.ts`
+  - Removed `$schema` stripping workarounds (Ajv2020 handles 2020-12 natively)
+  - Updated `scaffold-spec.schema.json`: added `$schema`, renamed `definitions` to `$defs`
+- **backend-scaffolding**: Updated `load_config.ts` template to use `Ajv2020` import
+- **integration-testing**: Updated contract testing example to use `Ajv2020` import
+
+### Rationale
+
+The codebase had inconsistent JSON Schema versions — 55+ files used 2020-12 but AJV was imported
+as draft-07 default in 3 files, and `settings/schema.ts` still referenced draft-07. Centralizing
+AJV into a lib wrapper eliminates the `$schema` stripping workaround and ensures all future schema
+usage is 2020-12 compliant.
```
