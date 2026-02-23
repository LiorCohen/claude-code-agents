/**
 * Config add-env command.
 *
 * Add a new environment directory.
 *
 * Usage:
 *   sdd-system config add-env <env-name>
 */

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';

export const addEnv = async (
  args: readonly string[],
  options: GlobalOptions
): Promise<CommandResult> => {
  const { positional, named } = parseNamedArgs(args);

  if (positional.length < 1) {
    return {
      success: false,
      error: 'Usage: sdd-system config add-env <env-name>',
    };
  }

  const envName = positional[0]!;
  const configDir = named['config-dir'] ?? process.cwd();

  // Validate environment name
  if (!/^[a-z][a-z0-9-]*$/.test(envName)) {
    return {
      success: false,
      error: `Invalid environment name: '${envName}'. Must be lowercase, start with a letter, and contain only letters, numbers, and hyphens.`,
    };
  }

  const envsDir = join(configDir, 'components', 'config', 'envs');
  const envDir = join(envsDir, envName);
  const configPath = join(envDir, 'config.yaml');

  // Check if environment already exists
  if (existsSync(envDir)) {
    return {
      success: false,
      error: `Environment '${envName}' already exists at: ${envDir}`,
    };
  }

  // Check if envs directory exists
  if (!existsSync(envsDir)) {
    return {
      success: false,
      error: `Config envs directory not found: ${envsDir}. Initialize config component first.`,
    };
  }

  try {
    // Create environment directory
    mkdirSync(envDir, { recursive: true });

    // Create config.yaml with schema reference and placeholder
    const configContent = `# yaml-language-server: $schema=../../schemas/config.schema.json
# ${envName} environment configuration
# Inherits from envs/default/config.yaml
# Only specify values that differ from default

# Example overrides:
# server-task-service:
#   port: 8080
#   database:
#     host: ${envName}-db.example.com
`;

    writeFileSync(configPath, configContent, 'utf-8');

    if (options.json) {
      return {
        success: true,
        data: {
          envName,
          envDir,
          configPath,
        },
      };
    }

    console.log(`Created environment: ${envName}`);
    console.log(`  Directory: ${envDir}`);
    console.log(`  Config: ${configPath}`);
    console.log('');
    console.log('Edit config.yaml to add environment-specific overrides.');
    console.log('Values inherit from envs/default/config.yaml.');

    return {
      success: true,
      message: `Created environment: ${envName}`,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Failed to create environment: ${errorMessage}`,
    };
  }
};
