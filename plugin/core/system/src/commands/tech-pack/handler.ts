/**
 * Tech pack namespace command handler.
 *
 * Commands:
 *   validate  Validate a tech pack manifest
 *   list      List installed tech packs
 *   info      Show tech pack details
 *   install   Register a tech pack (--path, --repo, or no args)
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
  const repo = named['repo'];
  const ref = named['ref'];

  const validation = validateArgs<TechPackArgs>({ action, path: techPackPath, namespace, repo, ref }, schema);

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
      // Three install modes:
      // 1. --repo: git clone install
      // 2. --path: local directory install
      // 3. No args: reinstall all from settings
      if (validatedArgs.repo) {
        const { installTechPackFromRepo } = await import('./install');
        return installTechPackFromRepo(validatedArgs.repo, validatedArgs.ref);
      }
      if (validatedArgs.path) {
        const { installTechPack } = await import('./install');
        return installTechPack(validatedArgs.path);
      }
      // No args mode — reinstall all from settings
      const { installAllFromSettings } = await import('./install');
      return installAllFromSettings();
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
