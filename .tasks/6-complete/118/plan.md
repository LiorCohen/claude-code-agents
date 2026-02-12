---
title: Upgrade all JSON schemas to latest stable version (2020-12)
created: 2026-02-12 09:15 UTC
updated: 2026-02-12 09:39 UTC
---

# Plan: Upgrade all JSON schemas to latest stable version (2020-12)

## Problem Summary

The codebase has a single remaining draft-07 schema reference in `settings/schema.ts` and uses the default AJV import which doesn't support 2020-12. The `scaffold-spec.schema.json` file uses the draft-07 `definitions` keyword instead of the 2020-12 `$defs` keyword and lacks a `$schema` declaration. All other schema files (55+) already use `https://json-schema.org/draft/2020-12/schema`. AJV is imported directly in 3 separate files with inconsistent configuration — this should be centralized into a lib module.

## Audit Findings

| Category | Count | Current Version | Status |
|----------|-------|-----------------|--------|
| Command schemas (`commands/*/schema.ts`) | 11 | 2020-12 | Compliant |
| Skill input/output schemas (`.schema.json`) | 39 | 2020-12 | Compliant |
| Project settings schemas | 3 | 2020-12 | Compliant |
| `settings/schema.ts` | 1 | **draft-07** | Non-compliant |
| `scaffold-spec.schema.json` | 1 | **none / draft-07 keywords** | Non-compliant |
| AJV usage (3 files) | 3 | Default import (draft-07 only) | Non-compliant |
| Backend template (`load_config.ts`) | 1 | Default import (draft-07 only) | Non-compliant |
| Integration-testing skill example | 1 | `import Ajv from 'ajv'` | Non-compliant |
| Backend config integration test | 1 | Asserts `from 'ajv'` | Non-compliant |
| `@types/json-schema` dep | 1 | draft-07 types only | Non-compliant |

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/system/src/lib/json-schema.ts` | **New file** — centralized AJV wrapper and `JsonSchema` type |
| `plugin/system/src/settings/schema.ts` | Replace `JSONSchema7` import with `JsonSchema` from lib; update `$schema` URI to 2020-12 |
| `plugin/system/src/commands/config/validate.ts` | Replace direct AJV import with lib; remove `$schema` stripping workaround |
| `plugin/system/src/commands/config/generate.ts` | Replace direct AJV import with lib; remove `$schema` stripping workaround |
| `plugin/system/src/commands/scaffolding/apply.ts` | Replace direct AJV import with lib |
| `plugin/system/src/commands/scaffolding/scaffold-spec.schema.json` | Add `$schema` declaration; rename `definitions` to `$defs`; update `$ref` paths |
| `plugin/skills/components/backend/backend-scaffolding/templates/src/config/load_config.ts` | Switch to `Ajv2020` import (template — cannot use lib) |
| `plugin/skills/components/integration-testing/integration-testing/SKILL.md` | Update AJV example code from `import Ajv from 'ajv'` to `Ajv2020` |
| `tests/src/tests/integration/backend-component/config-integration.test.ts` | Update test assertion from `from 'ajv'` to `from 'ajv/dist/2020'` |
| `plugin/system/package.json` | Remove `@types/json-schema` dev dependency |

## Changes

### 1. Create centralized JSON Schema lib (`plugin/system/src/lib/json-schema.ts`)

New module that wraps AJV and exports everything schema-related:

**Type exports:**
- `JsonSchema` — recursive type covering the JSON Schema subset used by the codebase: `type`, `properties`, `required`, `additionalProperties`, `enum`, `const`, `pattern`, `items`, `minItems`, `default`, `description`, `title`, `if/then`, `oneOf`, `$schema`, `$defs`, `$ref`
- `SchemaValidationError` — re-export of AJV's `ErrorObject` type
- `SchemaValidateFunction` — type for compiled validator functions

**Function exports:**
- `compileSchema(schema: JsonSchema, options?: { allErrors?: boolean; strict?: boolean }): ValidateFunction` — compiles a JSON Schema into a validator using `Ajv2020`. Internally creates the `Ajv2020` instance with sensible defaults (`allErrors: true`). Callers pass the full schema object (no `$schema` stripping needed).
- `validateAgainstSchema(data: unknown, schema: JsonSchema, options?: { allErrors?: boolean; strict?: boolean }): { readonly valid: true } | { readonly valid: false; readonly errors: readonly SchemaValidationError[] }` — convenience function that compiles + validates in one call, returning a discriminated union.

**Internal details:**
- Imports `Ajv2020 from 'ajv/dist/2020'` (the only place in the codebase that imports AJV directly)
- No AJV import appears outside this file in the system CLI

### 2. Replace `JSONSchema7` with `JsonSchema` from lib

The `@types/json-schema` package only provides draft-07 types. The `JsonSchema` type from the new lib replaces it. All type annotations in `settings/schema.ts` change from `JSONSchema7` to `JsonSchema`.

### 3. Update `$schema` URI in settings schema

Change `settingsFileSchema.$schema` from `http://json-schema.org/draft-07/schema#` to `https://json-schema.org/draft/2020-12/schema`.

### 4. Replace direct AJV usage in config/validate.ts

- Remove `import Ajv from 'ajv'` and `import type { ErrorObject } from 'ajv'`
- Import `compileSchema` (or `validateAgainstSchema`) and `SchemaValidationError` from `@/lib/json-schema`
- Remove the `$schema` stripping workaround (the `{ ['$schema']: _, ...rest }` destructuring)
- Pass the full schema object to the lib function

### 5. Replace direct AJV usage in config/generate.ts

Same pattern as validate.ts — replace direct AJV import and `$schema` stripping with lib import.

### 6. Replace direct AJV usage in scaffolding/apply.ts

- Remove `import Ajv from 'ajv'`
- Import `compileSchema` from `@/lib/json-schema`
- Update `getSchemaValidator` to use `compileSchema` instead of `new Ajv({ allErrors: true })`

### 7. Update scaffold-spec.schema.json to 2020-12

- Add `"$schema": "https://json-schema.org/draft/2020-12/schema"`
- Rename `"definitions"` to `"$defs"` (2020-12 standard)
- Update all `"$ref": "#/definitions/..."` to `"$ref": "#/$defs/..."`

### 8. Update backend template

In `load_config.ts` (scaffolding template), switch to `Ajv2020` import. This file is a **template** that gets scaffolded into user projects — it cannot use the internal `@/lib/json-schema` module, so it imports `Ajv2020` directly from `ajv/dist/2020`.

### 9. Update integration-testing skill example code

In `SKILL.md` line ~495, the contract testing example uses `import Ajv from 'ajv'` and `new Ajv({ allErrors: true })`. Update to use `Ajv2020` import from `ajv/dist/2020` so agents following this skill produce code with correct 2020-12 support.

### 10. Update backend config integration test

In `config-integration.test.ts` line 60, the test asserts `expect(content).toContain("from 'ajv'")`. After the backend template changes to `Ajv2020`, this assertion must change to `from 'ajv/dist/2020'`.

### 11. Remove `@types/json-schema` dependency

Remove from `plugin/system/package.json` devDependencies since `JSONSchema7` is no longer imported.

## Dependencies

1. Change 1 (create lib) must happen first — all other changes depend on it
2. Changes 2 + 9 go together (type replacement + dependency removal)
3. Changes 4 + 5 + 6 depend on change 1 (lib must exist before consumers migrate)
4. Change 7 must be tested with the updated lib usage in `apply.ts`
5. Change 8 is independent (template uses direct import, not lib)
6. Change 9 is independent (documentation update)
7. Change 10 depends on change 8 (test must match template)

## Tests

### Unit Tests
- [ ] `test_compile_schema_returns_validate_function` — `compileSchema` returns a callable validator
- [ ] `test_validate_against_schema_valid_data` — `validateAgainstSchema` returns `{ valid: true }` for conforming data
- [ ] `test_validate_against_schema_invalid_data` — returns `{ valid: false, errors }` for non-conforming data
- [ ] `test_compile_schema_accepts_2020_12_schema` — schemas with `$schema: 2020-12` compile without error
- [ ] `test_settings_schema_has_2020_12_schema_uri` — `settingsFileSchema.$schema` equals `https://json-schema.org/draft/2020-12/schema`
- [ ] `test_no_draft_07_references_in_codebase` — grep for `draft-07` and `json-schema.org/draft-07` returns zero matches
- [ ] `test_no_json_schema_7_type_import` — grep for `JSONSchema7` returns zero matches
- [ ] `test_no_direct_ajv_imports_outside_lib` — grep for `from 'ajv'` or `from "ajv"` returns zero matches outside `lib/json-schema.ts` and the backend template
- [ ] `test_scaffold_spec_schema_uses_defs` — `scaffold-spec.schema.json` uses `$defs` not `definitions`
- [ ] `test_scaffold_spec_schema_has_schema_uri` — `scaffold-spec.schema.json` has `$schema` field

### Integration Tests
- [ ] `test_config_validate_works_with_2020_12_schemas` — config validate command accepts schemas with `$schema: 2020-12`
- [ ] `test_config_generate_validates_with_2020_12` — config generate validates merged config correctly
- [ ] `test_scaffolding_apply_validates_spec` — scaffolding apply validates spec against updated schema

### Build Verification
- [ ] `test_typecheck_passes` — `npm run typecheck:plugin` passes with the new `JsonSchema` type
- [ ] `test_build_succeeds` — `npm run build:plugin` succeeds
- [ ] `test_all_existing_tests_pass` — `npm test` passes

## Verification

- [ ] No references to `draft-07`, `draft-04`, or `JSONSchema7` remain in the codebase
- [ ] All `$schema` URIs are `https://json-schema.org/draft/2020-12/schema`
- [ ] No direct `import ... from 'ajv'` outside `lib/json-schema.ts` and the backend template
- [ ] `scaffold-spec.schema.json` uses `$defs` (not `definitions`)
- [ ] `@types/json-schema` is not in any `package.json`
- [ ] Build and all tests pass
