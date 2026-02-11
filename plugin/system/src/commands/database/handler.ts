/**
 * Database namespace command handler.
 *
 * Commands:
 *   setup         Deploy PostgreSQL to k8s
 *   teardown      Remove PostgreSQL from k8s
 *   migrate       Run migrations
 *   seed          Seed database
 *   reset         Reset (teardown + setup + migrate + seed)
 *   port-forward  Port forward to local
 *   psql          Open psql shell
 */

import type { CommandResult, GlobalOptions } from '@/lib/args';
import { validateArgs, formatValidationErrors } from '@/lib/schema-validator';
import { schema, type DatabaseArgs } from './schema';

export const handleDatabase = async (
  action: string,
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const componentName = args[0];

  const validation = validateArgs<DatabaseArgs>(
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
    case 'setup':
      const { setup } = await import('./setup');
      return setup(validatedArgs.name, args.slice(1));

    case 'teardown':
      const { teardown } = await import('./teardown');
      return teardown(validatedArgs.name, args.slice(1));

    case 'migrate':
      const { migrate } = await import('./migrate');
      return migrate(validatedArgs.name, args.slice(1));

    case 'seed':
      const { seed } = await import('./seed');
      return seed(validatedArgs.name, args.slice(1));

    case 'reset':
      const { reset } = await import('./reset');
      return reset(validatedArgs.name, args.slice(1));

    case 'port-forward':
      const { portForward } = await import('./port-forward');
      return portForward(validatedArgs.name, args.slice(1));

    case 'psql':
      const { psql } = await import('./psql');
      return psql(validatedArgs.name, args.slice(1));

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
