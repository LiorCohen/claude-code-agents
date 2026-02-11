/**
 * Contract namespace command handler.
 *
 * Commands:
 *   generate-types   Generate TypeScript types from OpenAPI spec
 *   validate         Validate OpenAPI spec with Spectral
 */

import type { CommandResult, GlobalOptions } from '@/lib/args';
import { validateArgs, formatValidationErrors } from '@/lib/schema-validator';
import { schema, type ContractArgs } from './schema';

export const handleContract = async (
  action: string,
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const componentName = args[0];

  const validation = validateArgs<ContractArgs>(
    { action, name: componentName },
    schema
  );

  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid arguments:\n${formatValidationErrors(validation.errors)}`,
    };
  }

  const validatedArgs = validation.data;

  switch (validatedArgs.action) {
    case 'generate-types':
      const { generateTypes } = await import('./generate-types');
      return generateTypes(validatedArgs.name, args.slice(1));

    case 'validate':
      const { validate } = await import('./validate');
      return validate(validatedArgs.name, args.slice(1));

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
