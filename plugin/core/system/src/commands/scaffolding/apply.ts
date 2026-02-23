/**
 * Scaffolding apply command handler.
 *
 * Reads a scaffold spec JSON file and executes it via the engine.
 *
 * Usage:
 *   sdd-system scaffolding apply --spec spec.json [--dry-run]
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CommandResult } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { compileSchema, type SchemaValidateFunction, type JsonSchema } from '@/lib/json-schema';
import { exists, readText, isDirectory } from '@/lib/fs';
import { executeSpec } from './engine';
import type { ScaffoldSpec } from './engine';

/** Compiled JSON Schema validator (eager — module loads only when scaffolding apply runs). */
const schemaValidator: SchemaValidateFunction = (() => {
  const schemaPath = join(dirname(fileURLToPath(import.meta.url)), 'scaffold-spec.schema.json');
  const schema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as JsonSchema;
  return compileSchema(schema);
})();

/**
 * Validate a parsed spec: first manual checks for clean error messages,
 * then JSON Schema validation for structural completeness.
 */
const validateSpec = (
  raw: Record<string, unknown>
): { readonly valid: true; readonly spec: ScaffoldSpec } | { readonly valid: false; readonly error: string } => {
  // Manual checks -- give clean error messages for common issues
  const required = ['target_dir', 'base_dir', 'variables', 'operations'] as const;
  const missing = required.filter((f) => !(f in raw));
  if (missing.length > 0) {
    return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
  }

  if (typeof raw['target_dir'] !== 'string') {
    return { valid: false, error: 'target_dir must be a string' };
  }
  if (typeof raw['base_dir'] !== 'string') {
    return { valid: false, error: 'base_dir must be a string' };
  }
  if (typeof raw['variables'] !== 'object' || raw['variables'] === null || Array.isArray(raw['variables'])) {
    return { valid: false, error: 'variables must be an object' };
  }
  if (!Array.isArray(raw['operations'])) {
    return { valid: false, error: 'operations must be an array' };
  }

  // Validate each operation has a valid type
  const validTypes = ['template_dir', 'template_file', 'mkdir', 'write_file', 'package_json_scripts'];
  const operations = raw['operations'] as readonly Record<string, unknown>[];
  const operationError = operations.reduce<string | undefined>((err, op, i) => {
    if (err) return err;
    if (!op || typeof op !== 'object') {
      return `operations[${i}]: must be an object`;
    }
    if (!validTypes.includes(op['type'] as string)) {
      return `operations[${i}]: unknown type "${op['type'] as string}"`;
    }
    return undefined;
  }, undefined);

  if (operationError) {
    return { valid: false, error: operationError };
  }

  // JSON Schema validation for structural completeness (per-operation fields, when conditions)
  const validate = schemaValidator;
  if (!validate(raw)) {
    const errors = (validate.errors ?? [])
      .map((e) => `${e.instancePath || '/'}: ${e.message}`)
      .join('; ');
    return { valid: false, error: `Schema validation failed: ${errors}` };
  }

  return { valid: true, spec: raw as unknown as ScaffoldSpec };
};

export const applyScaffoldSpec = async (args: readonly string[]): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);
  const specPath = named['spec'];
  const dryRun = named['dry-run'] === 'true';

  if (!specPath) {
    return {
      success: false,
      error: 'Missing --spec argument. Usage: sdd-system scaffolding apply --spec spec.json [--dry-run]',
    };
  }

  if (!(await exists(specPath))) {
    return {
      success: false,
      error: `Spec file not found: ${specPath}`,
    };
  }

  // Parse JSON
  const specContent = await readText(specPath);
  const parseResult = (() => {
    try {
      return { parsed: true as const, raw: JSON.parse(specContent) as Record<string, unknown> };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { parsed: false as const, error: message };
    }
  })();

  if (!parseResult.parsed) {
    return {
      success: false,
      error: `Failed to parse spec JSON: ${parseResult.error}`,
    };
  }

  const raw = parseResult.raw;

  // Validate spec structure
  const validation = validateSpec(raw);
  if (!validation.valid) {
    return { success: false, error: `Invalid spec: ${validation.error}` };
  }

  const spec = validation.spec;

  // Validate directories exist
  if (!(await isDirectory(spec.base_dir))) {
    return { success: false, error: `base_dir not found: ${spec.base_dir}` };
  }
  if (!(await isDirectory(spec.target_dir))) {
    return { success: false, error: `target_dir not found: ${spec.target_dir}` };
  }

  // Execute
  const result = await executeSpec(spec, dryRun);

  return {
    success: result.success,
    message: dryRun ? `[dry-run] ${result.summary}` : result.summary,
    data: result,
  };
};
