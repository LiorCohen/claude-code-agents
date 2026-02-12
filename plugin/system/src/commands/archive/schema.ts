import type { CommandSchema } from '@/lib/schema-validator';

export const ACTIONS = ['store'] as const;
type Action = (typeof ACTIONS)[number];

const ARCHIVE_TYPES = ['external-spec', 'revised-spec', 'workflow-regression'] as const;
export type ArchiveType = (typeof ARCHIVE_TYPES)[number];

export const ARCHIVE_TYPE_DIRS: Readonly<Record<ArchiveType, string>> = {
  'external-spec': 'external-specs',
  'revised-spec': 'revised-specs',
  'workflow-regression': 'workflow-regressions',
};

export const schema: CommandSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ACTIONS,
      description: 'Archive action to perform',
    },
    source: {
      type: 'string',
      description: 'Path to the file or directory to archive',
      minLength: 1,
    },
    type: {
      type: 'string',
      enum: ARCHIVE_TYPES,
      description: 'Archive type (determines target subdirectory)',
    },
    root: {
      type: 'string',
      description: 'Override project root directory (defaults to auto-detection)',
      minLength: 1,
    },
  },
  required: ['action', 'source', 'type'],
} as const;

export type ArchiveArgs = {
  readonly action: Action;
  readonly source: string;
  readonly type: ArchiveType;
  readonly root?: string;
};
