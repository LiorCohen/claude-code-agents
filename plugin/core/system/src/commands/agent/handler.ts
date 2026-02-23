/**
 * Agent namespace command handler.
 *
 * Commands:
 *   frontmatter   Extract structured metadata from agent .md files
 */

import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { validateArgs, formatValidationErrors } from '@/lib/schema-validator';
import { schema, type AgentArgs } from './schema';

export const handleAgent = async (
  action: string,
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);
  const agentPath = named['path'];

  const validation = validateArgs<AgentArgs>({ action, path: agentPath }, schema);

  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid arguments:\n${formatValidationErrors(validation.errors)}`,
    };
  }

  const validatedArgs = validation.data;

  switch (validatedArgs.action) {
    case 'frontmatter': {
      const { agentFrontmatter } = await import('./frontmatter');
      return agentFrontmatter(validatedArgs.path);
    }

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
