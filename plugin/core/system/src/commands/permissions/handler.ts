/**
 * Permissions namespace command handler.
 *
 * Commands:
 *   configure   Merge SDD recommended permissions into project settings
 */

import type { CommandResult, GlobalOptions } from '@/lib/args';
import { validateArgs, formatValidationErrors } from '@/lib/schema-validator';
import { schema, type PermissionsArgs } from './schema';

export const handlePermissions = async (
  action: string,
  _args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const validation = validateArgs<PermissionsArgs>({ action }, schema);

  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid arguments:\n${formatValidationErrors(validation.errors)}`,
    };
  }

  const validatedArgs = validation.data;

  switch (validatedArgs.action) {
    case 'configure':
      const { configurePermissions } = await import('./configure');
      return configurePermissions();

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
