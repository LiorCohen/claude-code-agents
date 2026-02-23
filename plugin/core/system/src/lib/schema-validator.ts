/**
 * JSON Schema validation utility for CLI command arguments.
 *
 * Provides runtime validation of command arguments against JSON Schema definitions.
 * Schemas are embedded as consts in command files for type safety and co-location.
 */

/**
 * JSON Schema property definition.
 */
export type SchemaProperty = {
  readonly type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  readonly description?: string;
  readonly enum?: readonly string[];
  readonly pattern?: string;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly items?: SchemaProperty;
  readonly default?: unknown;
}

/**
 * JSON Schema definition for command arguments.
 */
export type CommandSchema = {
  readonly $schema?: string;
  readonly type: 'object';
  readonly properties: Readonly<Record<string, SchemaProperty>>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean;
}

/**
 * Validation error details.
 */
export type ValidationError = {
  readonly field: string;
  readonly message: string;
  readonly expected?: string;
  readonly received?: string;
};

export type PropertyValidationResult =
  | { readonly valid: true }
  | { readonly valid: false; readonly error: ValidationError };

/**
 * Validation result.
 */
export type ValidationResult<T> =
  | { readonly valid: true; readonly data: T }
  | { readonly valid: false; readonly errors: readonly ValidationError[] };

const VALID: PropertyValidationResult = { valid: true } as const;

const invalid = (error: ValidationError): PropertyValidationResult => ({
  valid: false,
  error,
});

/**
 * Validate a value against a schema property.
 */
const validateProperty = (
  value: unknown,
  property: SchemaProperty,
  fieldName: string
): PropertyValidationResult => {
  // Type check
  if (property.type === 'string') {
    if (typeof value !== 'string') {
      return invalid({
        field: fieldName,
        message: `Expected string, got ${typeof value}`,
        expected: 'string',
        received: typeof value,
      });
    }

    // Enum check
    if (property.enum && !property.enum.includes(value)) {
      return invalid({
        field: fieldName,
        message: `Invalid value. Must be one of: ${property.enum.join(', ')}`,
        expected: property.enum.join(' | '),
        received: value,
      });
    }

    // Pattern check
    if (property.pattern && !new RegExp(property.pattern).test(value)) {
      return invalid({
        field: fieldName,
        message: `Value does not match pattern: ${property.pattern}`,
        expected: property.pattern,
        received: value,
      });
    }

    // Length checks
    if (property.minLength !== undefined && value.length < property.minLength) {
      return invalid({
        field: fieldName,
        message: `Value too short. Minimum length: ${property.minLength}`,
        expected: `>= ${property.minLength} characters`,
        received: `${value.length} characters`,
      });
    }

    if (property.maxLength !== undefined && value.length > property.maxLength) {
      return invalid({
        field: fieldName,
        message: `Value too long. Maximum length: ${property.maxLength}`,
        expected: `<= ${property.maxLength} characters`,
        received: `${value.length} characters`,
      });
    }
  }

  if (property.type === 'number') {
    if (typeof value !== 'number' || isNaN(value)) {
      return invalid({
        field: fieldName,
        message: `Expected number, got ${typeof value}`,
        expected: 'number',
        received: typeof value,
      });
    }

    if (property.minimum !== undefined && value < property.minimum) {
      return invalid({
        field: fieldName,
        message: `Value too small. Minimum: ${property.minimum}`,
        expected: `>= ${property.minimum}`,
        received: String(value),
      });
    }

    if (property.maximum !== undefined && value > property.maximum) {
      return invalid({
        field: fieldName,
        message: `Value too large. Maximum: ${property.maximum}`,
        expected: `<= ${property.maximum}`,
        received: String(value),
      });
    }
  }

  if (property.type === 'boolean') {
    if (typeof value !== 'boolean') {
      return invalid({
        field: fieldName,
        message: `Expected boolean, got ${typeof value}`,
        expected: 'boolean',
        received: typeof value,
      });
    }
  }

  if (property.type === 'array') {
    if (!Array.isArray(value)) {
      return invalid({
        field: fieldName,
        message: `Expected array, got ${typeof value}`,
        expected: 'array',
        received: typeof value,
      });
    }

    // Validate array items if schema provided
    if (property.items) {
      const itemError = (value as readonly unknown[])
        .map((item, i) => validateProperty(item, property.items!, `${fieldName}[${i}]`))
        .find((r) => !r.valid);
      if (itemError) return itemError;
    }
  }

  return VALID;
};

/**
 * Validate command arguments against a schema.
 *
 * @param args - The arguments object to validate
 * @param schema - The JSON Schema to validate against
 * @returns ValidationResult with valid flag, data if valid, or errors if invalid
 */
export const validateArgs = <T>(
  args: Readonly<Record<string, unknown>>,
  schema: CommandSchema
): ValidationResult<T> => {
  // Check required fields
  const requiredErrors: readonly ValidationError[] = (schema.required ?? [])
    .filter((field) => args[field] === undefined || args[field] === null || args[field] === '')
    .map((field) => {
      const property = schema.properties[field];
      const description = property?.description ? ` (${property.description})` : '';
      return {
        field,
        message: `Required field missing${description}`,
        expected: property?.type ?? 'value',
      };
    });

  // Validate each provided field
  const fieldErrors: readonly ValidationError[] = Object.entries(args).flatMap(([field, value]) => {
    const property = schema.properties[field];

    // Unknown fields
    if (!property) {
      return schema.additionalProperties === false
        ? [{ field, message: `Unknown field`, received: field }]
        : [];
    }

    // Skip undefined/null values (handled by required check)
    if (value === undefined || value === null) return [];

    const result = validateProperty(value, property, field);
    return result.valid ? [] : [result.error];
  });

  const errors = [...requiredErrors, ...fieldErrors];

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: args as T };
};

/**
 * Format validation errors as a human-readable string.
 */
export const formatValidationErrors = (errors: readonly ValidationError[]): string => {
  return errors
    .map((e) => {
      const parts: readonly string[] = [
        `  ${e.field}: ${e.message}`,
        ...(e.expected ? [`    Expected: ${e.expected}`] : []),
        ...(e.received ? [`    Received: ${e.received}`] : []),
      ];
      return parts.join('\n');
    })
    .join('\n');
};

/**
 * Generate help text from a schema definition.
 */
export const generateSchemaHelp = (schema: CommandSchema, commandName: string): string => {
  const requiredSet: ReadonlySet<string> = new Set(schema.required ?? []);

  // Arguments section
  const argEntries = Object.entries(schema.properties).filter(([key]) => requiredSet.has(key));
  const argsSection: readonly string[] = argEntries.length > 0
    ? [
        'Arguments:',
        ...argEntries.map(([key, prop]) => {
          const enumStr = prop.enum ? ` (${prop.enum.join('|')})` : '';
          const desc = prop.description ?? '';
          return `  <${key}>${enumStr}  ${desc}`;
        }),
        '',
      ]
    : [];

  // Options section
  const optEntries = Object.entries(schema.properties).filter(([key]) => !requiredSet.has(key));
  const optsSection: readonly string[] = optEntries.length > 0
    ? [
        'Options:',
        ...optEntries.map(([key, prop]) => {
          const enumStr = prop.enum ? ` (${prop.enum.join('|')})` : '';
          const defaultStr = prop.default !== undefined ? ` [default: ${prop.default}]` : '';
          const desc = prop.description ?? '';
          return `  --${key}${enumStr}  ${desc}${defaultStr}`;
        }),
        '',
      ]
    : [];

  return [`Usage: ${commandName} [options]`, '', ...argsSection, ...optsSection].join('\n');
};
