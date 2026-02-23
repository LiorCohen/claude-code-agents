/**
 * Settings module - manages core settings in sdd/sdd-settings.yaml.
 *
 * This module provides:
 * - Type definitions for the settings file structure
 * - Default system settings
 * - JSON Schema for validation
 * - Validation functions for base schema
 * - Diff and sync utilities
 * - Reconciliation for settings migration
 */

// Re-export types
export type {
  LogLevel,
  LoggingSettings,
  SystemSettings,
  TechPackEntry,
  ComponentManifest,
  SddMetadata,
  ProjectMetadata,
  SettingsFile,
} from '@/types';

// Re-export defaults
export { DEFAULT_SYSTEM_SETTINGS } from './defaults';

// Re-export schema
export { settingsFileSchema, schemas } from './schema';

// Re-export validation
export type {
  SettingsValidationError,
  SettingsValidationResult,
} from './validate';
export { validateSettings, formatValidationResult } from './validate';

// Re-export sync utilities
export type { SettingsDiff } from './sync';
export {
  diffSettings,
  formatSyncPreview,
} from './sync';

// Re-export reconciliation
export type {
  ReconciliationChange,
  ReconciliationWarning,
  ReconciliationResult,
  DefaultTechPack,
} from './reconcile';
export { reconcileSettings } from './reconcile';
