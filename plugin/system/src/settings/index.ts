/**
 * Settings module - manages component settings in sdd-settings.yaml.
 *
 * This module provides:
 * - Type definitions for component settings
 * - Default settings for each component type
 * - JSON Schema for validation
 * - Validation functions with cross-reference checking
 */

// Re-export types
export type {
  ServerMode,
  ServerType,
  ServerSettings,
  WebappSettings,
  HelmAssets,
  HelmServerSettings,
  HelmWebappSettings,
  HelmSettings,
  DatabaseProvider,
  DatabaseSettings,
  ContractVisibility,
  ContractSettings,
  ConfigSettings,
  ComponentType,
  ComponentSettingsMap,
  ComponentSettings,
  ComponentBase,
  ServerComponent,
  WebappComponent,
  HelmComponent,
  DatabaseComponent,
  ContractComponent,
  ConfigComponent,
  TestingComponent,
  CicdComponent,
  Component,
  TestingSettings,
  CicdSettings,
  LogLevel,
  LoggingSettings,
  SystemSettings,
  SddMetadata,
  ProjectMetadata,
  SettingsFile,
} from '@/types';

// Re-export type guards
export {
  isServerComponent,
  isWebappComponent,
  isHelmComponent,
  isDatabaseComponent,
  isContractComponent,
  isConfigComponent,
  isHelmServerSettings,
  isHelmWebappSettings,
} from '@/types';

// Re-export defaults
export {
  DEFAULT_API_SERVER_SETTINGS,
  DEFAULT_WORKER_SERVER_SETTINGS,
  DEFAULT_CRON_SERVER_SETTINGS,
  DEFAULT_HYBRID_SERVER_SETTINGS,
  getDefaultServerSettings,
  DEFAULT_WEBAPP_SETTINGS,
  DEFAULT_HELM_SERVER_SETTINGS,
  DEFAULT_HELM_WEBAPP_SETTINGS,
  DEFAULT_DATABASE_SETTINGS,
  DEFAULT_CONTRACT_SETTINGS,
  DEFAULT_CONFIG_SETTINGS,
} from './defaults';

// Re-export schema
export { settingsFileSchema, schemas } from './schema';

// Re-export validation
export type {
  SettingsValidationError,
  SettingsValidationResult,
} from './validate';
export { validateSettings, formatValidationResult } from './validate';

// Re-export sync utilities
export type { SyncResult, SettingsDiff } from './sync';
export {
  diffSettings,
  generateComponentPath,
  getComponentDir,
  previewSync,
  generateServerConfigSection,
  generateWebappConfigSection,
  formatSyncPreview,
} from './sync';

// Re-export reconciliation
export type {
  ReconciliationChange,
  ReconciliationWarning,
  ReconciliationResult,
} from './reconcile';
export { reconcileSettings } from './reconcile';

// Re-export helm sync utilities
export type { HelmTemplateSet } from './sync-helm';
export {
  getServerHelmTemplates,
  getWebappHelmTemplates,
  getHelmTemplates,
  generateServerHelmValues,
  generateWebappHelmValues,
  shouldHaveUmbrellaChart,
  generateUmbrellaChartDependencies,
} from './sync-helm';
