/**
 * Log namespace command handler.
 *
 * Commands:
 *   write   Write a structured log entry to sdd/system-logs/
 */

import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { validateArgs, formatValidationErrors } from '@/lib/schema-validator';
import { schema, type LogArgs } from './schema';

export const handleLog = async (
  action: string,
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);
  const level = named['level'];
  const source = named['source'];
  const message = named['message'];
  const data = named['data'];

  const validation = validateArgs<LogArgs>({ action, level, source, message, data }, schema);

  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid arguments:\n${formatValidationErrors(validation.errors)}`,
    };
  }

  const validatedArgs = validation.data;

  switch (validatedArgs.action) {
    case 'write': {
      const { writeLog } = await import('./write');
      return writeLog(
        validatedArgs.level,
        validatedArgs.source,
        validatedArgs.message,
        validatedArgs.data
      );
    }

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
