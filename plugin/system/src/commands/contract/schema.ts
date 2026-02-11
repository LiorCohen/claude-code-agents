import type { CommandSchema } from '@/lib/schema-validator';

export const ACTIONS = ['generate-types', 'validate'] as const;
type Action = (typeof ACTIONS)[number];

export const schema: CommandSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ACTIONS,
      description: 'Contract action to perform',
    },
    name: {
      type: 'string',
      description: 'Component name (e.g., "my-api")',
      pattern: '^[a-z][a-z0-9-]*$',
    },
  },
  required: ['action', 'name'],
} as const;

export type ContractArgs = {
  readonly action: Action;
  readonly name: string;
}
