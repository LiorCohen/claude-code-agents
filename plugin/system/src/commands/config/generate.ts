/**
 * Config generate command.
 *
 * Generate merged config file for a target environment.
 *
 * Usage:
 *   sdd-system config generate --env <env> [--component <name>] [--output <path>]
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { parse, stringify } from 'yaml';
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { compileSchema, type SchemaValidationError, type JsonSchema } from '@/lib/json-schema';

type ConfigObject = Readonly<Record<string, unknown>>;

/**
 * Deep merge two objects.
 * - Objects: recursively merged
 * - Arrays: replaced entirely
 * - Primitives: replaced
 * - Null: removes the key
 */
const deepMerge = (base: ConfigObject, override: ConfigObject): ConfigObject => {
  return Object.entries(override).reduce<ConfigObject>(
    (acc, [key, value]) => {
      if (value === null) {
        // Null removes the key
        const { [key]: _, ...rest } = acc;
        return rest;
      } else if (
        typeof value === 'object' &&
        !Array.isArray(value) &&
        typeof acc[key] === 'object' &&
        !Array.isArray(acc[key]) &&
        acc[key] !== null
      ) {
        // Recursively merge objects
        return {
          ...acc,
          [key]: deepMerge(
            acc[key] as ConfigObject,
            value as ConfigObject
          ),
        };
      } else {
        // Replace arrays and primitives
        return { ...acc, [key]: value };
      }
    },
    { ...base }
  );
};

export const generate = async (
  args: readonly string[],
  options: GlobalOptions
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);

  const env = named['env'];
  const component = named['component'];
  const outputPath = named['output'];
  const configDir = named['config-dir'] ?? process.cwd();

  if (!env) {
    return {
      success: false,
      error: 'Missing required argument: --env <environment>',
    };
  }

  const envsDir = join(configDir, 'components', 'config', 'envs');
  const schemasDir = join(configDir, 'components', 'config', 'schemas');

  const defaultConfigPath = join(envsDir, 'default', 'config.yaml');
  const envConfigPath = join(envsDir, env, 'config.yaml');
  const schemaPath = join(schemasDir, 'config.schema.json');

  // Check default config exists
  if (!existsSync(defaultConfigPath)) {
    return {
      success: false,
      error: `Default config not found: ${defaultConfigPath}`,
    };
  }

  // Check environment config exists
  if (!existsSync(envConfigPath)) {
    return {
      success: false,
      error: `Environment config not found: ${envConfigPath}. Use 'sdd-system config add-env ${env}' to create it.`,
    };
  }

  try {
    // Load and merge configs
    const defaultConfig = parse(readFileSync(defaultConfigPath, 'utf-8')) ?? {};
    const envConfig = parse(readFileSync(envConfigPath, 'utf-8')) ?? {};
    const mergedConfig = (() => {
      const base = deepMerge(defaultConfig, envConfig);

      // Validate against schema if it exists
      if (existsSync(schemaPath)) {
        const schema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as JsonSchema;
        const validate = compileSchema(schema);

        if (!validate(base)) {
          const errors = validate.errors
            ?.map((e: SchemaValidationError) => `  - ${e.instancePath || '/'}: ${e.message}`)
            .join('\n');
          return { valid: false as const, error: `Config validation failed:\n${errors}` };
        }
      }

      // Extract component section if specified
      if (component) {
        if (!(component in base)) {
          return {
            valid: false as const,
            error: `Component '${component}' not found in config. Available: ${Object.keys(base).join(', ')}`,
          };
        }
        return { valid: true as const, config: base[component] as ConfigObject };
      }

      return { valid: true as const, config: base };
    })();

    if (!mergedConfig.valid) {
      return { success: false, error: mergedConfig.error };
    }

    const finalConfig = mergedConfig.config;

    // Output result
    const yamlOutput = stringify(finalConfig);

    if (outputPath) {
      writeFileSync(outputPath, yamlOutput, 'utf-8');

      // Copy schema alongside output for runtime validation
      if (existsSync(schemaPath)) {
        const outputDir = dirname(outputPath);
        const schemaOutputPath = join(outputDir, basename(outputPath, '.yaml') + '.schema.json');
        copyFileSync(schemaPath, schemaOutputPath);
      }

      if (options.json) {
        return {
          success: true,
          data: { outputPath, config: finalConfig },
        };
      }

      console.log(`Config written to: ${outputPath}`);
      return { success: true, message: `Config written to: ${outputPath}` };
    }

    if (options.json) {
      return {
        success: true,
        data: { config: finalConfig },
      };
    }

    console.log(yamlOutput);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Failed to generate config: ${errorMessage}`,
    };
  }
};
