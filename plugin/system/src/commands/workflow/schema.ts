import type { CommandSchema } from '@/lib/schema-validator';

export const ACTIONS = ['check-gate'] as const;
type Action = (typeof ACTIONS)[number];

export const schema: CommandSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ACTIONS,
      description: 'Workflow action to perform',
    },
  },
  required: ['action'],
} as const;

export type WorkflowArgs = {
  readonly action: Action;
}
