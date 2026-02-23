/**
 * Config namespace command handler.
 *
 * Commands:
 *   generate   Generate merged config for target environment
 *   validate   Validate config against schemas
 *   diff       Show differences between environments
 *   add-env    Add a new environment directory
 */

import type { CommandResult, GlobalOptions } from '@/lib/args';
import { validateArgs, formatValidationErrors } from '@/lib/schema-validator';
import { schema, type ConfigArgs } from './schema';

export const handleConfig = async (
  action: string,
  args: readonly string[],
  options: GlobalOptions
): Promise<CommandResult> => {
  const validation = validateArgs<ConfigArgs>({ action }, schema);

  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid arguments:\n${formatValidationErrors(validation.errors)}`,
    };
  }

  const validatedArgs = validation.data;

  switch (validatedArgs.action) {
    case 'generate':
      const { generate } = await import('./generate');
      return generate(args, options);

    case 'validate':
      const { validate } = await import('./validate');
      return validate(args, options);

    case 'diff':
      const { diff } = await import('./diff');
      return diff(args, options);

    case 'add-env':
      const { addEnv } = await import('./add-env');
      return addEnv(args, options);

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
