/**
 * Spec namespace command handler.
 *
 * Commands:
 *   validate   Validate spec frontmatter/structure
 *   index      Generate changes/INDEX.md
 *   snapshot   Create project snapshot
 */

import type { CommandResult, GlobalOptions } from '@/lib/args';
import { validateArgs, formatValidationErrors } from '@/lib/schema-validator';
import { schema, type SpecArgs } from './schema';

export const handleSpec = async (
  action: string,
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const validation = validateArgs<SpecArgs>({ action }, schema);

  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid arguments:\n${formatValidationErrors(validation.errors)}`,
    };
  }

  const validatedArgs = validation.data;

  switch (validatedArgs.action) {
    case 'validate':
      const { validateSpec } = await import('./validate');
      return validateSpec(args);

    case 'index':
      const { generateIndex } = await import('./generate-index');
      return generateIndex(args);

    case 'snapshot':
      const { generateSnapshot } = await import('./generate-snapshot');
      return generateSnapshot(args);

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
