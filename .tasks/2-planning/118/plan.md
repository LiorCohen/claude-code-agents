---
title: Upgrade all JSON schemas to latest stable version (2020-12)
created: 2026-02-12
---

# Plan: Upgrade all JSON schemas to latest stable version (2020-12)

## Problem Summary

The codebase has a single remaining draft-07 schema reference in `settings/schema.ts` and uses the default AJV import which doesn't support 2020-12. The `scaffold-spec.schema.json` file uses the draft-07 `definitions` keyword instead of the 2020-12 `$defs` keyword and lacks a `$schema` declaration. All other schema files (55+) already use `https://json-schema.org/draft/2020-12/schema`.

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
| `@types/json-schema` dep | 1 | draft-07 types only | Non-compliant |

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/system/src/settings/schema.ts` | Replace `JSONSchema7` type with local `JsonSchema` type; update `$schema` URI to 2020-12 |
| `plugin/system/src/commands/config/validate.ts` | Switch to `Ajv2020` import; remove `$schema` stripping workaround |
| `plugin/system/src/commands/config/generate.ts` | Switch to `Ajv2020` import; remove `$schema` stripping workaround |
| `plugin/system/src/commands/scaffolding/apply.ts` | Switch to `Ajv2020` import |
| `plugin/system/src/commands/scaffolding/scaffold-spec.schema.json` | Add `$schema` declaration; rename `definitions` to `$defs`; update `$ref` paths |
| `plugin/skills/components/backend/backend-scaffolding/templates/src/config/load_config.ts` | Switch to `Ajv2020` import |
| `plugin/skills/components/backend/backend-scaffolding/templates/package.json` | Note: AJV ^8.12.0 already includes `ajv/dist/2020` — no version change needed |
| `plugin/system/package.json` | Remove `@types/json-schema` dev dependency |

## Changes

### 1. Replace `JSONSchema7` with local `JsonSchema` type

The `@types/json-schema` package only provides draft-07 types. Since `settings/schema.ts` uses a limited subset of JSON Schema features, define a recursive `JsonSchema` type locally in that file. This eliminates the draft-07 type dependency while maintaining type safety.

The type covers exactly what the codebase uses: `type`, `properties`, `required`, `additionalProperties`, `enum`, `const`, `pattern`, `items`, `minItems`, `default`, `description`, `title`, `if/then`, `oneOf`, `$schema`.

### 2. Update `$schema` URI in settings schema

Change `settingsFileSchema.$schema` from `http://json-schema.org/draft-07/schema#` to `https://json-schema.org/draft/2020-12/schema`.

### 3. Switch AJV to 2020-12 import

In all 3 system CLI files using AJV, change:
- `import Ajv from 'ajv'` → `import Ajv2020 from 'ajv/dist/2020'`
- `new Ajv(...)` → `new Ajv2020(...)`

This enables native 2020-12 support including `$schema` recognition.

### 4. Remove `$schema` stripping workaround

In `validate.ts` and `generate.ts`, remove the destructuring that strips `$schema` before passing to AJV. With `Ajv2020`, the `$schema` property is understood natively.

### 5. Update scaffold-spec.schema.json to 2020-12

- Add `"$schema": "https://json-schema.org/draft/2020-12/schema"`
- Rename `"definitions"` to `"$defs"` (2020-12 standard)
- Update all `"$ref": "#/definitions/..."` to `"$ref": "#/$defs/..."`

### 6. Update backend template

In `load_config.ts` (scaffolding template), switch to `Ajv2020` import so that projects scaffolded by SDD also use 2020-12 validation.

### 7. Remove `@types/json-schema` dependency

Remove from `plugin/system/package.json` devDependencies since `JSONSchema7` is no longer imported.

## Dependencies

1. Changes 1 and 7 go together (type replacement + dependency removal)
2. Changes 3 and 4 go together (AJV upgrade enables removing the workaround)
3. Change 5 must be tested with the updated AJV import in `apply.ts`
4. All changes are independent of each other at the file level

## Tests

### Unit Tests
- [ ] `test_settings_schema_has_2020_12_schema_uri` — `settingsFileSchema.$schema` equals `https://json-schema.org/draft/2020-12/schema`
- [ ] `test_no_draft_07_references_in_codebase` — grep for `draft-07` and `json-schema.org/draft-07` returns zero matches
- [ ] `test_no_json_schema_7_type_import` — grep for `JSONSchema7` returns zero matches
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
- [ ] All AJV imports use `ajv/dist/2020`
- [ ] `scaffold-spec.schema.json` uses `$defs` (not `definitions`)
- [ ] `@types/json-schema` is not in any `package.json`
- [ ] Build and all tests pass
