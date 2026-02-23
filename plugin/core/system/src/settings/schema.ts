/**
 * JSON Schema for core settings validation.
 *
 * Core validates the base settings structure only: SDD metadata, project metadata,
 * tech_packs namespace, and minimal component manifest (name, type, directory).
 * Tech-specific component settings are validated by each tech pack.
 */

import type { JsonSchema } from '@/lib/json-schema';

/** JSON Schema for SDD metadata */
const sddMetadataSchema: JsonSchema = {
  type: 'object',
  properties: {
    initialized_by_plugin_version: {
      type: 'string',
      description: 'Plugin version that first created this project',
    },
    updated_by_plugin_version: {
      type: 'string',
      description: 'Plugin version that last reconciled settings',
    },
    initialized_at: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}Z$',
      description: 'UTC datetime project was initialized (YYYY-MM-DD HH:MM:SSZ)',
    },
    updated_at: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}Z$',
      description: 'UTC datetime settings were last updated (YYYY-MM-DD HH:MM:SSZ)',
    },
  },
  required: ['initialized_by_plugin_version', 'updated_by_plugin_version', 'initialized_at', 'updated_at'],
  additionalProperties: false,
};

/** JSON Schema for project metadata */
const projectMetadataSchema: JsonSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      pattern: '^[a-z][a-z0-9-]*[a-z0-9]$',
      description: 'Project name (lowercase, hyphens)',
    },
    description: {
      type: 'string',
      description: 'Project description',
    },
  },
  required: ['name'],
  additionalProperties: false,
};

/** JSON Schema for a component manifest entry (core-level: name, type, directory only) */
const componentManifestSchema: JsonSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      pattern: '^[a-z][a-z0-9-]*[a-z0-9]$',
      description: 'Component name (lowercase, hyphens)',
    },
    type: {
      type: 'string',
      description: 'Component type (defined by tech pack)',
    },
    directory: {
      type: 'string',
      description: 'Relative path from project root',
    },
  },
  required: ['name', 'type', 'directory'],
  additionalProperties: false,
};

/** JSON Schema for a tech pack entry */
const techPackEntrySchema: JsonSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    namespace: { type: 'string' },
    version: { type: 'string' },
    mode: { type: 'string', enum: ['internal', 'external'] },
    path: { type: 'string' },
    components: {
      type: 'array',
      items: componentManifestSchema,
    },
  },
  required: ['name', 'namespace', 'version', 'mode', 'path', 'components'],
  additionalProperties: false,
};

/** JSON Schema for logging settings */
const loggingSettingsSchema: JsonSchema = {
  type: 'object',
  properties: {
    enabled: {
      type: 'boolean',
      default: true,
      description: 'Enable/disable file logging',
    },
    level: {
      type: 'string',
      enum: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'],
      default: 'info',
      description: 'Log level',
    },
  },
  required: ['enabled', 'level'],
  additionalProperties: false,
};

/** JSON Schema for SDD CLI system settings */
const systemSettingsSchema: JsonSchema = {
  type: 'object',
  properties: {
    logging: loggingSettingsSchema,
  },
  required: ['logging'],
  additionalProperties: false,
};

/** Complete JSON Schema for settings file */
export const settingsFileSchema: JsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'SDD Settings File',
  description: 'Schema for sdd/sdd-settings.yaml',
  type: 'object',
  properties: {
    sdd: sddMetadataSchema,
    project: projectMetadataSchema,
    tech_packs: {
      type: 'object',
      additionalProperties: techPackEntrySchema,
      description: 'Installed tech packs keyed by namespace',
    },
    system: systemSettingsSchema,
  },
  required: ['sdd', 'project'],
  additionalProperties: false,
};

/** Export individual schemas for partial validation */
export const schemas = {
  loggingSettings: loggingSettingsSchema,
  systemSettings: systemSettingsSchema,
  sddMetadata: sddMetadataSchema,
  projectMetadata: projectMetadataSchema,
  techPackEntry: techPackEntrySchema,
  componentManifest: componentManifestSchema,
  settingsFile: settingsFileSchema,
} as const;
