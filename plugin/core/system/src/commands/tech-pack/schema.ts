import type { CommandSchema } from '@/lib/schema-validator';

export const ACTIONS = ['validate', 'list', 'info', 'install', 'remove'] as const;
type Action = (typeof ACTIONS)[number];

export const schema: CommandSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ACTIONS,
      description: 'Tech pack action to perform',
    },
    path: {
      type: 'string',
      description: 'Path to tech pack directory (for validate/install)',
      minLength: 1,
    },
    namespace: {
      type: 'string',
      description: 'Tech pack namespace (for info/remove)',
      minLength: 1,
    },
    repo: {
      type: 'string',
      description: 'Git repository URL (for install)',
      minLength: 1,
    },
    ref: {
      type: 'string',
      description: 'Git ref to checkout — tag, branch, or commit SHA (for install)',
      minLength: 1,
    },
  },
  required: ['action'],
} as const;

export type TechPackArgs = {
  readonly action: Action;
  readonly path?: string;
  readonly namespace?: string;
  readonly repo?: string;
  readonly ref?: string;
};
