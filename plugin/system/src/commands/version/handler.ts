/**
 * Version namespace command handler.
 *
 * Commands:
 *   bump   Bump version (major|minor|patch)
 */

import type { CommandResult, GlobalOptions } from '@/lib/args';
import { validateArgs, formatValidationErrors } from '@/lib/schema-validator';
import { schema, type VersionArgs } from './schema';

export const handleVersion = async (
  action: string,
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const validation = validateArgs<VersionArgs>({ action }, schema);

  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid arguments:\n${formatValidationErrors(validation.errors)}`,
    };
  }

  const validatedArgs = validation.data;

  switch (validatedArgs.action) {
    case 'bump':
      const { bumpVersion } = await import('./bump');
      return bumpVersion(args);

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
