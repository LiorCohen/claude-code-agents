/**
 * Archive namespace command handler.
 *
 * Commands:
 *   store   Archive a file or directory to sdd/archive/<type>/
 */

import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { validateArgs, formatValidationErrors } from '@/lib/schema-validator';
import { schema, type ArchiveArgs } from './schema';

export const handleArchive = async (
  action: string,
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);
  const source = named['source'];
  const type = named['type'];
  const root = named['root'];

  const validation = validateArgs<ArchiveArgs>({ action, source, type, root }, schema);

  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid arguments:\n${formatValidationErrors(validation.errors)}`,
    };
  }

  const validatedArgs = validation.data;

  switch (validatedArgs.action) {
    case 'store': {
      const { storeArchive } = await import('./store');
      return storeArchive(validatedArgs.source, validatedArgs.type, validatedArgs.root);
    }

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
