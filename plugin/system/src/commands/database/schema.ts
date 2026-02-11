import type { CommandSchema } from '@/lib/schema-validator';

export const ACTIONS = ['setup', 'teardown', 'migrate', 'seed', 'reset', 'port-forward', 'psql'] as const;
type Action = (typeof ACTIONS)[number];

export const schema: CommandSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ACTIONS,
      description: 'Database action to perform',
    },
    name: {
      type: 'string',
      description: 'Component name (e.g., "my-db")',
      pattern: '^[a-z][a-z0-9-]*$',
    },
  },
  required: ['action', 'name'],
} as const;

export type DatabaseArgs = {
  readonly action: Action;
  readonly name: string;
}
