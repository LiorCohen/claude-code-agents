/**
 * JSON Schema for settings validation.
 *
 * This schema validates the component settings in sdd-settings.yaml.
 */

import type { JSONSchema7 } from 'json-schema';

/** JSON Schema for server modes */
const serverModeSchema: JSONSchema7 = {
  type: 'string',
  enum: ['api', 'worker', 'cron'],
};

/** JSON Schema for server type */
const serverTypeSchema: JSONSchema7 = {
  type: 'string',
  enum: ['api', 'worker', 'cron', 'hybrid'],
};

/** JSON Schema for server settings */
const serverSettingsSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    server_type: serverTypeSchema,
    modes: {
      type: 'array',
      items: serverModeSchema,
      minItems: 2,
      description: 'Required when server_type is hybrid (2+ modes)',
    },
    databases: {
      type: 'array',
      items: { type: 'string' },
      default: [],
      description: 'Database components this server uses',
    },
    provides_contracts: {
      type: 'array',
      items: { type: 'string' },
      default: [],
      description: 'Contracts this server implements',
    },
    consumes_contracts: {
      type: 'array',
      items: { type: 'string' },
      default: [],
      description: 'Contracts this server calls',
    },
    helm: {
      type: 'boolean',
      default: false,
      description: 'Whether this server needs a helm chart',
    },
  },
  required: ['server_type'],
  if: {
    properties: { server_type: { const: 'hybrid' } },
  },
  then: {
    required: ['server_type', 'modes'],
  },
  additionalProperties: false,
};

/** JSON Schema for webapp settings */
const webappSettingsSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    contracts: {
      type: 'array',
      items: { type: 'string' },
      default: [],
      description: 'Contract components this webapp uses',
    },
    helm: {
      type: 'boolean',
      default: false,
      description: 'Whether this webapp needs a helm chart',
    },
  },
  required: [],
  additionalProperties: false,
};

/** JSON Schema for helm server settings */
const helmServerSettingsSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    deploys: {
      type: 'string',
      description: 'Server component name to deploy',
    },
    deploy_type: {
      type: 'string',
      const: 'server',
    },
    deploy_modes: {
      type: 'array',
      items: serverModeSchema,
      description: 'Which modes to deploy (subset of server modes)',
    },
    ingress: {
      type: 'boolean',
      default: true,
      description: 'Whether to add ingress for external HTTP exposure',
    },
  },
  required: ['deploys', 'deploy_type', 'ingress'],
  additionalProperties: false,
};

/** JSON Schema for helm webapp settings */
const helmWebappSettingsSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    deploys: {
      type: 'string',
      description: 'Webapp component name to deploy',
    },
    deploy_type: {
      type: 'string',
      const: 'webapp',
    },
    ingress: {
      type: 'boolean',
      default: true,
      description: 'Whether to add ingress for external HTTP exposure',
    },
    assets: {
      type: 'string',
      enum: ['bundled', 'entrypoint'],
      default: 'bundled',
      description: 'Asset strategy: bundled = full app, entrypoint = index.html only',
    },
  },
  required: ['deploys', 'deploy_type', 'ingress', 'assets'],
  additionalProperties: false,
};

/** JSON Schema for helm settings (union) */
const helmSettingsSchema: JSONSchema7 = {
  oneOf: [helmServerSettingsSchema, helmWebappSettingsSchema],
};

/** JSON Schema for database settings */
const databaseSettingsSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    provider: {
      type: 'string',
      enum: ['postgresql'],
      default: 'postgresql',
      description: 'Database provider',
    },
    dedicated: {
      type: 'boolean',
      default: false,
      description: 'Whether this database needs its own server',
    },
  },
  required: ['provider', 'dedicated'],
  additionalProperties: false,
};

/** JSON Schema for contract settings */
const contractSettingsSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    visibility: {
      type: 'string',
      enum: ['public', 'internal'],
      default: 'internal',
      description: 'public = external consumers, internal = project-only',
    },
  },
  required: ['visibility'],
  additionalProperties: false,
};

/** JSON Schema for config settings (empty object) */
const configSettingsSchema: JSONSchema7 = {
  type: 'object',
  additionalProperties: false,
};

/** JSON Schema for testing settings (empty object) */
const testingSettingsSchema: JSONSchema7 = {
  type: 'object',
  additionalProperties: false,
};

/** JSON Schema for cicd settings (empty object) */
const cicdSettingsSchema: JSONSchema7 = {
  type: 'object',
  additionalProperties: false,
};

/** JSON Schema for server component */
const serverComponentSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    name: { type: 'string', pattern: '^[a-z][a-z0-9-]*[a-z0-9]$' },
    type: { type: 'string', const: 'server' },
    path: { type: 'string', description: 'Relative path from project root' },
    settings: serverSettingsSchema,
  },
  required: ['name', 'type', 'path', 'settings'],
  additionalProperties: false,
};

/** JSON Schema for webapp component */
const webappComponentSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    name: { type: 'string', pattern: '^[a-z][a-z0-9-]*[a-z0-9]$' },
    type: { type: 'string', const: 'webapp' },
    path: { type: 'string', description: 'Relative path from project root' },
    settings: webappSettingsSchema,
  },
  required: ['name', 'type', 'path', 'settings'],
  additionalProperties: false,
};

/** JSON Schema for helm component */
const helmComponentSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    name: { type: 'string', pattern: '^[a-z][a-z0-9-]*[a-z0-9]$' },
    type: { type: 'string', const: 'helm' },
    path: { type: 'string', description: 'Relative path from project root' },
    settings: helmSettingsSchema,
  },
  required: ['name', 'type', 'path', 'settings'],
  additionalProperties: false,
};

/** JSON Schema for database component */
const databaseComponentSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    name: { type: 'string', pattern: '^[a-z][a-z0-9-]*[a-z0-9]$' },
    type: { type: 'string', const: 'database' },
    path: { type: 'string', description: 'Relative path from project root' },
    settings: databaseSettingsSchema,
  },
  required: ['name', 'type', 'path', 'settings'],
  additionalProperties: false,
};

/** JSON Schema for contract component */
const contractComponentSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    name: { type: 'string', pattern: '^[a-z][a-z0-9-]*[a-z0-9]$' },
    type: { type: 'string', const: 'contract' },
    path: { type: 'string', description: 'Relative path from project root' },
    settings: contractSettingsSchema,
  },
  required: ['name', 'type', 'path', 'settings'],
  additionalProperties: false,
};

/** JSON Schema for config component */
const configComponentSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    name: { type: 'string', const: 'config' },
    type: { type: 'string', const: 'config' },
    path: { type: 'string', description: 'Relative path from project root' },
    settings: configSettingsSchema,
  },
  required: ['name', 'type', 'path', 'settings'],
  additionalProperties: false,
};

/** JSON Schema for testing component */
const testingComponentSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    name: { type: 'string', pattern: '^[a-z][a-z0-9-]*[a-z0-9]$' },
    type: { type: 'string', const: 'testing' },
    path: { type: 'string', description: 'Relative path from project root' },
    settings: testingSettingsSchema,
  },
  required: ['name', 'type', 'path', 'settings'],
  additionalProperties: false,
};

/** JSON Schema for cicd component */
const cicdComponentSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    name: { type: 'string', pattern: '^[a-z][a-z0-9-]*[a-z0-9]$' },
    type: { type: 'string', const: 'cicd' },
    path: { type: 'string', description: 'Relative path from project root' },
    settings: cicdSettingsSchema,
  },
  required: ['name', 'type', 'path', 'settings'],
  additionalProperties: false,
};

/** JSON Schema for any component */
const componentSchema: JSONSchema7 = {
  oneOf: [
    serverComponentSchema,
    webappComponentSchema,
    helmComponentSchema,
    databaseComponentSchema,
    contractComponentSchema,
    configComponentSchema,
    testingComponentSchema,
    cicdComponentSchema,
  ],
};

/** JSON Schema for SDD metadata */
const sddMetadataSchema: JSONSchema7 = {
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
const projectMetadataSchema: JSONSchema7 = {
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

/** JSON Schema for logging settings */
const loggingSettingsSchema: JSONSchema7 = {
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
const systemSettingsSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    logging: loggingSettingsSchema,
  },
  required: ['logging'],
  additionalProperties: false,
};

/** Complete JSON Schema for settings file */
export const settingsFileSchema: JSONSchema7 = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'SDD Settings File',
  description: 'Schema for .sdd/sdd-settings.yaml',
  type: 'object',
  properties: {
    sdd: sddMetadataSchema,
    project: projectMetadataSchema,
    components: {
      type: 'array',
      items: componentSchema,
      description: 'List of project components with their settings',
    },
    system: systemSettingsSchema,
  },
  required: ['sdd', 'project', 'components'],
  additionalProperties: false,
};

/** Export individual schemas for partial validation */
export const schemas = {
  serverSettings: serverSettingsSchema,
  webappSettings: webappSettingsSchema,
  helmSettings: helmSettingsSchema,
  helmServerSettings: helmServerSettingsSchema,
  helmWebappSettings: helmWebappSettingsSchema,
  databaseSettings: databaseSettingsSchema,
  contractSettings: contractSettingsSchema,
  configSettings: configSettingsSchema,
  testingSettings: testingSettingsSchema,
  cicdSettings: cicdSettingsSchema,
  loggingSettings: loggingSettingsSchema,
  systemSettings: systemSettingsSchema,
  component: componentSchema,
  serverComponent: serverComponentSchema,
  webappComponent: webappComponentSchema,
  helmComponent: helmComponentSchema,
  databaseComponent: databaseComponentSchema,
  contractComponent: contractComponentSchema,
  configComponent: configComponentSchema,
  testingComponent: testingComponentSchema,
  cicdComponent: cicdComponentSchema,
  sddMetadata: sddMetadataSchema,
  projectMetadata: projectMetadataSchema,
  settingsFile: settingsFileSchema,
} as const;
