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
