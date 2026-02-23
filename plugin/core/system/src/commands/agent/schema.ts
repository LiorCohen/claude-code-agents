import type { CommandSchema } from '@/lib/schema-validator';

export const ACTIONS = ['frontmatter'] as const;
type Action = (typeof ACTIONS)[number];

export const schema: CommandSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ACTIONS,
      description: 'Agent action to perform',
    },
    path: {
      type: 'string',
      description: 'Path to agent .md file',
      minLength: 1,
    },
  },
  required: ['action', 'path'],
} as const;

export type AgentArgs = {
  readonly action: Action;
  readonly path: string;
};
