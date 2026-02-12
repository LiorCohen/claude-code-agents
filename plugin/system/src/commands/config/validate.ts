/**
 * Config validate command.
 *
 * Validate config files against JSON Schema.
 *
 * Usage:
 *   sdd-system config validate [--env <env>]
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { compileSchema, type SchemaValidationError, type JsonSchema } from '@/lib/json-schema';

type ValidationResult = {
  readonly env: string;
  readonly valid: boolean;
  readonly errors?: ReadonlyArray<string>;
};

export const validate = async (
  args: readonly string[],
  options: GlobalOptions
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);

  const targetEnv = named['env'];
  const configDir = named['config-dir'] ?? process.cwd();

  const envsDir = join(configDir, 'components', 'config', 'envs');
  const schemasDir = join(configDir, 'components', 'config', 'schemas');
  const schemaPath = join(schemasDir, 'config.schema.json');

  // Check envs directory exists
  if (!existsSync(envsDir)) {
    return {
      success: false,
      error: `Config envs directory not found: ${envsDir}`,
    };
  }

  // Check schema exists
  if (!existsSync(schemaPath)) {
    return {
      success: false,
      error: `Config schema not found: ${schemaPath}`,
    };
  }

  // Load and compile schema
  const schemaResult = (() => {
    try {
      const schema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as JsonSchema;
      return { success: true as const, validateFn: compileSchema(schema) };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { success: false as const, error: errorMessage };
    }
  })();

  if (!schemaResult.success) {
    return {
      success: false,
      error: `Failed to parse schema: ${schemaResult.error}`,
    };
  }

  const validateFn = schemaResult.validateFn;

  // Get environments to validate
  const envDirs = targetEnv
    ? [targetEnv]
    : readdirSync(envsDir).filter((name) => {
        const envPath = join(envsDir, name);
        return statSync(envPath).isDirectory();
      });

  const results: ReadonlyArray<ValidationResult> = envDirs.map((env) => {
    const configPath = join(envsDir, env, 'config.yaml');

    if (!existsSync(configPath)) {
      return {
        env,
        valid: false,
        errors: [`Config file not found: ${configPath}`],
      };
    }

    try {
      const config = parse(readFileSync(configPath, 'utf-8')) ?? {};

      if (!validateFn(config)) {
        const errors =
          validateFn.errors?.map((e: SchemaValidationError) => `${e.instancePath || '/'}: ${e.message}`) ?? [];
        return { env, valid: false, errors };
      } else {
        return { env, valid: true };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        env,
        valid: false,
        errors: [`Failed to parse YAML: ${errorMessage}`],
      };
    }
  });

  const hasErrors = results.some((r) => !r.valid);

  if (options.json) {
    return {
      success: !hasErrors,
      data: { results },
      error: hasErrors ? 'Validation failed for one or more environments' : undefined,
    };
  }

  // Text output
  console.log('Config Validation Results');
  console.log('='.repeat(40));

  for (const result of results) {
    if (result.valid) {
      console.log(`\n✓ ${result.env}: Valid`);
    } else {
      console.log(`\n✗ ${result.env}: Invalid`);
      for (const error of result.errors ?? []) {
        console.log(`    - ${error}`);
      }
    }
  }

  console.log('');

  if (hasErrors) {
    return {
      success: false,
      error: 'Validation failed for one or more environments',
    };
  }

  return {
    success: true,
    message: `All ${results.length} environment(s) valid`,
  };
};
