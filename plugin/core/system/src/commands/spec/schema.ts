import type { CommandSchema } from '@/lib/schema-validator';

export const ACTIONS = ['validate', 'index', 'snapshot'] as const;
type Action = (typeof ACTIONS)[number];

export const schema: CommandSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ACTIONS,
      description: 'Spec action to perform',
    },
  },
  required: ['action'],
} as const;

export type SpecArgs = {
  readonly action: Action;
}
