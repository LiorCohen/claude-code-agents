import type { CommandSchema } from '@/lib/schema-validator';

export const ACTIONS = [
  'create',
  'destroy',
  'start',
  'stop',
  'restart',
  'status',
  'deploy',
  'undeploy',
  'forward',
  'config',
  'infra',
  'check-tools',
] as const;

export type EnvironmentAction = (typeof ACTIONS)[number];

export type EnvironmentArgs = {
  readonly action: EnvironmentAction;
}

export const schema: CommandSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: [...ACTIONS],
      description: 'Environment action to perform',
    },
  },
  required: ['action'],
} as const;
