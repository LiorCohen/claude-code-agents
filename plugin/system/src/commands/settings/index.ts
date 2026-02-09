/**
 * Settings namespace command handler.
 *
 * Commands:
 *   reconcile   Reconcile settings to latest plugin schema
 */

import type { CommandResult, GlobalOptions } from '@/lib/args';
import type { CommandSchema } from '@/lib/schema-validator';
import { validateArgs, formatValidationErrors } from '@/lib/schema-validator';

const ACTIONS = ['reconcile'] as const;
type Action = (typeof ACTIONS)[number];

/**
 * JSON Schema for settings command arguments.
 */
export const schema: CommandSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ACTIONS,
      description: 'Settings action to perform',
    },
  },
  required: ['action'],
} as const;

/**
 * Typed arguments for settings commands.
 */
export interface SettingsArgs {
  readonly action: Action;
}

export const handleSettings = async (
  action: string,
  args: readonly string[],
  options: GlobalOptions
): Promise<CommandResult> => {
  const validation = validateArgs<SettingsArgs>({ action }, schema);

  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid arguments:\n${formatValidationErrors(validation.errors!)}`,
    };
  }

  const validatedArgs = validation.data!;

  switch (validatedArgs.action) {
    case 'reconcile': {
      const { reconcile } = await import('./reconcile');
      return reconcile(args, options);
    }

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
