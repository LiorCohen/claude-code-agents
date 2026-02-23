/**
 * Settings namespace command handler.
 *
 * Commands:
 *   reconcile        Reconcile settings to latest plugin schema
 *   process-actions  Process declared actions from tech system
 */

import type { CommandResult, GlobalOptions } from '@/lib/args';
import { validateArgs, formatValidationErrors } from '@/lib/schema-validator';
import { schema, type SettingsArgs } from './schema';

export const handleSettings = async (
  action: string,
  args: readonly string[],
  options: GlobalOptions
): Promise<CommandResult> => {
  const validation = validateArgs<SettingsArgs>({ action }, schema);

  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid arguments:\n${formatValidationErrors(validation.errors)}`,
    };
  }

  const validatedArgs = validation.data;

  switch (validatedArgs.action) {
    case 'reconcile': {
      const { reconcile } = await import('./reconcile');
      return reconcile(args, options);
    }

    case 'process-actions': {
      const { processActions } = await import('./process-actions');
      return processActions(args, options);
    }

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
