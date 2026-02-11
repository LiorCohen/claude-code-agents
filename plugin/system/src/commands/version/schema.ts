import type { CommandSchema } from '@/lib/schema-validator';

export const ACTIONS = ['bump'] as const;
type Action = (typeof ACTIONS)[number];

const BUMP_TYPES = ['major', 'minor', 'patch'] as const;

export const schema: CommandSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ACTIONS,
      description: 'Version action to perform',
    },
    type: {
      type: 'string',
      enum: BUMP_TYPES,
      description: 'Version bump type (major|minor|patch)',
    },
  },
  required: ['action'],
} as const;

export type VersionArgs = {
  readonly action: Action;
  readonly type?: (typeof BUMP_TYPES)[number];
}
