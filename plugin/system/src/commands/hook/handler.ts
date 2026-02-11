/**
 * Hook namespace command handler.
 *
 * Commands:
 *   validate-write   PreToolUse hook: auto-approve/block writes
 *   prompt-commit    PostToolUse hook: commit prompts
 */

import type { CommandResult, GlobalOptions } from '@/lib/args';
import { validateArgs, formatValidationErrors } from '@/lib/schema-validator';
import { schema, type HookArgs } from './schema';

export const handleHook = async (
  action: string,
  _args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const validation = validateArgs<HookArgs>({ action }, schema);

  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid arguments:\n${formatValidationErrors(validation.errors)}`,
    };
  }

  const validatedArgs = validation.data;

  switch (validatedArgs.action) {
    case 'validate-write':
      const { validateWrite } = await import('./validate-write');
      return validateWrite();

    case 'prompt-commit':
      const { promptCommit } = await import('./prompt-commit');
      return promptCommit();

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
