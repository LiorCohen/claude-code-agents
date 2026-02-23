/**
 * Type definitions for the core settings system.
 *
 * Core manages the base settings structure: project metadata, SDD metadata,
 * installed tech packs, and a minimal component manifest (name, type, directory).
 * Tech-specific component settings live in separate tech pack settings files.
 */

// =============================================================================
// System Settings
// =============================================================================

/** Log levels supported by pino */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/** Logging settings */
export type LoggingSettings = {
  /** Enable/disable file logging */
  readonly enabled: boolean;
  /** Log level */
  readonly level: LogLevel;
}

/** SDD CLI system settings */
export type SystemSettings = {
  /** Logging configuration */
  readonly logging: LoggingSettings;
}

// =============================================================================
// Tech Pack Entry
// =============================================================================

/** A registered tech pack in sdd-settings.yaml */
export type TechPackEntry = {
  readonly name: string;
  readonly namespace: string;
  readonly version: string;
  readonly mode: 'internal' | 'external' | 'git';
  readonly path: string;
  /** Git clone URL (mode: git only) */
  readonly repo?: string;
  /** Git ref to checkout — tag, branch, or commit SHA (mode: git only) */
  readonly ref?: string;
  /** Path relative to project root (mode: git only) */
  readonly install_path?: string;
}

/** A component registered in the top-level components map of sdd-settings.yaml */
export type ComponentManifest = {
  readonly type: string;
  /** Namespace of the tech pack this component belongs to */
  readonly techpack: string;
  readonly directory: string;
}

// =============================================================================
// Settings File Schema
// =============================================================================

/** SDD metadata in settings file */
export type SddMetadata = {
  /** Plugin version that first created this project (immutable after init) */
  readonly initialized_by_plugin_version: string;
  /** Plugin version that last reconciled settings */
  readonly updated_by_plugin_version: string;
  /** UTC datetime project was initialized (YYYY-MM-DD HH:MM:SSZ) */
  readonly initialized_at: string;
  /** UTC datetime settings were last updated (YYYY-MM-DD HH:MM:SSZ) */
  readonly updated_at: string;
}

/** Project metadata in settings file */
export type ProjectMetadata = {
  /** Project name (lowercase, hyphens) */
  readonly name: string;
  /** Project description */
  readonly description?: string;
}

/** Complete settings file schema */
export type SettingsFile = {
  readonly sdd: SddMetadata;
  readonly project: ProjectMetadata;
  readonly techpacks?: Readonly<Record<string, TechPackEntry>>;
  readonly components?: Readonly<Record<string, ComponentManifest>>;
  readonly system?: SystemSettings;
}
