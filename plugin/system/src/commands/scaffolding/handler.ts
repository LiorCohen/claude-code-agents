/**
 * Scaffolding namespace command handler.
 *
 * Commands:
 *   project   Create new SDD project structure
 *   domain    Populate domain specs from config
 *   apply     Apply a declarative scaffold spec
 */

import type { CommandResult, GlobalOptions } from '@/lib/args';
import { validateArgs, formatValidationErrors } from '@/lib/schema-validator';
import { schema, type ScaffoldingArgs } from './schema';

export const handleScaffolding = async (
  action: string,
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const validation = validateArgs<ScaffoldingArgs>({ action }, schema);

  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid arguments:\n${formatValidationErrors(validation.errors)}`,
    };
  }

  const validatedArgs = validation.data;

  switch (validatedArgs.action) {
    case 'project':
      const { scaffoldProject } = await import('./project');
      return scaffoldProject(args);

    case 'domain':
      const { populateDomain } = await import('./domain');
      return populateDomain(args);

    case 'apply':
      const { applyScaffoldSpec } = await import('./apply');
      return applyScaffoldSpec(args);

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
