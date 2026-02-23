import type { CommandSchema } from '@/lib/schema-validator';

export const ACTIONS = ['write'] as const;
type Action = (typeof ACTIONS)[number];

const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;

export const schema: CommandSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ACTIONS,
      description: 'Log action to perform',
    },
    level: {
      type: 'string',
      enum: LOG_LEVELS,
      description: 'Log level',
    },
    source: {
      type: 'string',
      description: 'Source identifier (e.g., techpacks.loadAgent)',
      minLength: 1,
    },
    message: {
      type: 'string',
      description: 'Log message text',
      minLength: 1,
    },
    data: {
      type: 'string',
      description: 'Optional JSON data to include in the log entry',
    },
  },
  required: ['action', 'level', 'source', 'message'],
} as const;

export type LogArgs = {
  readonly action: Action;
  readonly level: string;
  readonly source: string;
  readonly message: string;
  readonly data?: string;
};
