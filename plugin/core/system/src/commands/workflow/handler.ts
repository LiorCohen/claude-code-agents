/**
 * Workflow namespace command handler.
 *
 * Commands:
 *   check-gate   Check if prerequisites are met to advance to target phase
 */

import type { CommandResult, GlobalOptions } from '@/lib/args';
import { validateArgs, formatValidationErrors } from '@/lib/schema-validator';
import { schema, type WorkflowArgs } from './schema';

export const handleWorkflow = async (
  action: string,
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const validation = validateArgs<WorkflowArgs>({ action }, schema);

  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid arguments:\n${formatValidationErrors(validation.errors)}`,
    };
  }

  const validatedArgs = validation.data;

  switch (validatedArgs.action) {
    case 'check-gate':
      const { checkGate } = await import('./check-gate');
      return checkGate(args);

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
