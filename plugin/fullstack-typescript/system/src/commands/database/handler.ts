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
import { parseNamedArgs } from '@/lib/args';
import { validateArgs, formatValidationErrors } from '@/lib/schema-validator';
import { schema, type DatabaseArgs } from './schema';

export const handleDatabase = async (
  action: string,
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const componentName = args[0];
  const { named } = parseNamedArgs(args.slice(1));
  const env = named['env'] ?? 'local';

  const validation = validateArgs<DatabaseArgs>(
    { action, name: componentName, env },
    schema
  );

  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid arguments:\n${formatValidationErrors(validation.errors)}`,
    };
  }

  const validatedArgs = validation.data;
  const remainingArgs = args.slice(1);

  switch (validatedArgs.action) {
    case 'setup':
      const { setup } = await import('./setup');
      return setup(validatedArgs.name, remainingArgs, env);

    case 'teardown':
      const { teardown } = await import('./teardown');
      return teardown(validatedArgs.name, remainingArgs, env);

    case 'migrate':
      const { migrate } = await import('./migrate');
      return migrate(validatedArgs.name, remainingArgs, env);

    case 'seed':
      const { seed } = await import('./seed');
      return seed(validatedArgs.name, remainingArgs, env);

    case 'reset':
      const { reset } = await import('./reset');
      return reset(validatedArgs.name, remainingArgs, env);

    case 'port-forward':
      const { portForward } = await import('./port-forward');
      return portForward(validatedArgs.name, remainingArgs, env);

    case 'psql':
      const { psql } = await import('./psql');
      return psql(validatedArgs.name, remainingArgs, env);

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
