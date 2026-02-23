/**
 * JSON Schema for core settings validation.
 *
 * Core validates the base settings structure only: SDD metadata, project metadata,
 * techpacks namespace, and component manifest (type, techpack, directory).
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

/** JSON Schema for a component manifest entry (top-level: type, techpack, directory) */
const componentManifestSchema: JsonSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      description: 'Component type (defined by tech pack)',
    },
    techpack: {
      type: 'string',
      description: 'Namespace of the tech pack this component belongs to',
    },
    directory: {
      type: 'string',
      description: 'Relative path from project root',
    },
  },
  required: ['type', 'techpack', 'directory'],
  additionalProperties: false,
};

/** JSON Schema for a tech pack entry */
const techPackEntrySchema: JsonSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    namespace: { type: 'string' },
    version: { type: 'string' },
    mode: { type: 'string', enum: ['internal', 'external', 'git'] },
    path: { type: 'string' },
    repo: { type: 'string', description: 'Git clone URL (mode: git only)' },
    ref: { type: 'string', description: 'Git ref to checkout (mode: git only)' },
    install_path: { type: 'string', description: 'Path relative to project root (mode: git only)' },
  },
  required: ['name', 'namespace', 'version', 'mode'],
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
    techpacks: {
      type: 'object',
      additionalProperties: techPackEntrySchema,
      description: 'Installed tech packs keyed by namespace',
    },
    components: {
      type: 'object',
      additionalProperties: componentManifestSchema,
      description: 'Registered components keyed by name',
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
