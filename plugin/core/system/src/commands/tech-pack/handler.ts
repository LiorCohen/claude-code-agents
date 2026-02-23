/**
 * Tech pack namespace command handler.
 *
 * Commands:
 *   validate  Validate a tech pack manifest
 *   list      List installed tech packs
 *   info      Show tech pack details
 *   install   Register a tech pack
 *   remove    Unregister a tech pack
 */

import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { validateArgs, formatValidationErrors } from '@/lib/schema-validator';
import { schema, type TechPackArgs } from './schema';

export const handleTechPack = async (
  action: string,
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);
  const techPackPath = named['path'];
  const namespace = named['namespace'];

  const validation = validateArgs<TechPackArgs>({ action, path: techPackPath, namespace }, schema);

  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid arguments:\n${formatValidationErrors(validation.errors)}`,
    };
  }

  const validatedArgs = validation.data;

  switch (validatedArgs.action) {
    case 'validate': {
      if (!validatedArgs.path) {
        return { success: false, error: 'Missing --path argument for validate' };
      }
      const { validateTechPack } = await import('./validate');
      return validateTechPack(validatedArgs.path);
    }

    case 'list': {
      const { listTechPacks } = await import('./list');
      return listTechPacks();
    }

    case 'info': {
      if (!validatedArgs.namespace) {
        return { success: false, error: 'Missing --namespace argument for info' };
      }
      const { techPackInfo } = await import('./info');
      return techPackInfo(validatedArgs.namespace);
    }

    case 'install': {
      if (!validatedArgs.path) {
        return { success: false, error: 'Missing --path argument for install' };
      }
      const { installTechPack } = await import('./install');
      return installTechPack(validatedArgs.path);
    }

    case 'remove': {
      if (!validatedArgs.namespace) {
        return { success: false, error: 'Missing --namespace argument for remove' };
      }
      const { removeTechPack } = await import('./remove');
      return removeTechPack(validatedArgs.namespace);
    }

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
