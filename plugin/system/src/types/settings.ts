/**
 * Type definitions for component settings.
 *
 * Settings are structural decisions about a component that affect scaffolding,
 * config, and deployment. Unlike config values (which are per-environment),
 * settings are defined at component creation time and stored in sdd-settings.yaml.
 */

// =============================================================================
// Server Settings
// =============================================================================

/** Communication pattern modes for servers */
export type ServerMode = 'api' | 'worker' | 'cron';

/** Server type - single mode or hybrid (multiple modes) */
export type ServerType = ServerMode | 'hybrid';

/** Settings for server components */
export interface ServerSettings {
  /** Communication pattern(s) - determines Operator lifecycle(s) */
  readonly server_type: ServerType;
  /** Required when server_type is 'hybrid' (2+ modes) */
  readonly modes?: readonly ServerMode[];
  /** Database components this server uses (adds DAL layer, DB config) */
  readonly databases: readonly string[];
  /** Contracts this server implements (adds Service, routes) */
  readonly provides_contracts: readonly string[];
  /** Contracts this server calls (generates API clients) */
  readonly consumes_contracts: readonly string[];
  /** Whether this server needs a helm chart for deployment */
  readonly helm: boolean;
}

// =============================================================================
// Webapp Settings
// =============================================================================

/** Settings for webapp components */
export interface WebappSettings {
  /** Contract components this webapp uses (generates API clients) */
  readonly contracts: readonly string[];
  /** Whether this webapp needs a helm chart for deployment */
  readonly helm: boolean;
}

// =============================================================================
// Helm Chart Settings
// =============================================================================

/** Asset bundling strategy for webapp helm charts */
export type HelmAssets = 'bundled' | 'entrypoint';

/** Helm chart settings for deploying a server */
export interface HelmServerSettings {
  /** Server component name to deploy */
  readonly deploys: string;
  /** Type of component being deployed */
  readonly deploy_type: 'server';
  /** Which modes to deploy (subset of server's modes, for hybrid servers) */
  readonly deploy_modes?: readonly ServerMode[];
  /** Whether to add ingress.yaml for external HTTP exposure */
  readonly ingress: boolean;
}

/** Helm chart settings for deploying a webapp */
export interface HelmWebappSettings {
  /** Webapp component name to deploy */
  readonly deploys: string;
  /** Type of component being deployed */
  readonly deploy_type: 'webapp';
  /** Whether to add ingress.yaml for external HTTP exposure */
  readonly ingress: boolean;
  /** Asset strategy: bundled = full app in container, entrypoint = index.html only */
  readonly assets: HelmAssets;
}

/** Union of all helm chart settings */
export type HelmSettings = HelmServerSettings | HelmWebappSettings;

// =============================================================================
// Database Settings
// =============================================================================

/** Supported database providers */
export type DatabaseProvider = 'postgresql';

/** Settings for database components */
export interface DatabaseSettings {
  /** Database provider (currently only postgresql) */
  readonly provider: DatabaseProvider;
  /** Whether this database needs its own server (false = can colocate in local dev) */
  readonly dedicated: boolean;
}

// =============================================================================
// Contract Settings
// =============================================================================

/** Visibility level for contracts */
export type ContractVisibility = 'public' | 'internal';

/** Settings for contract components */
export interface ContractSettings {
  /** public = external consumers, internal = project-only */
  readonly visibility: ContractVisibility;
}

// =============================================================================
// Config Settings
// =============================================================================

/** Settings for config component (singleton, no settings) */
export type ConfigSettings = Record<string, never>;

// =============================================================================
// System Settings
// =============================================================================

/** Log levels supported by pino */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/** Logging settings */
export interface LoggingSettings {
  /** Enable/disable file logging */
  readonly enabled: boolean;
  /** Log level */
  readonly level: LogLevel;
}

/** System-wide settings */
export interface SystemSettings {
  /** Logging configuration */
  readonly logging: LoggingSettings;
}

// =============================================================================
// Component Type Unions
// =============================================================================

/** All supported component types */
export type ComponentType =
  | 'server'
  | 'webapp'
  | 'helm'
  | 'database'
  | 'contract'
  | 'config';

/** Mapping of component types to their settings */
export interface ComponentSettingsMap {
  readonly server: ServerSettings;
  readonly webapp: WebappSettings;
  readonly helm: HelmSettings;
  readonly database: DatabaseSettings;
  readonly contract: ContractSettings;
  readonly config: ConfigSettings;
}

/** Settings for any component type */
export type ComponentSettings = ComponentSettingsMap[ComponentType];

// =============================================================================
// Component Definition
// =============================================================================

/** Base component interface */
export interface ComponentBase {
  /** Unique component name (lowercase, hyphenated) */
  readonly name: string;
  /** Component type */
  readonly type: ComponentType;
}

/** Server component */
export interface ServerComponent extends ComponentBase {
  readonly type: 'server';
  readonly settings: ServerSettings;
}

/** Webapp component */
export interface WebappComponent extends ComponentBase {
  readonly type: 'webapp';
  readonly settings: WebappSettings;
}

/** Helm chart component */
export interface HelmComponent extends ComponentBase {
  readonly type: 'helm';
  readonly settings: HelmSettings;
}

/** Database component */
export interface DatabaseComponent extends ComponentBase {
  readonly type: 'database';
  readonly settings: DatabaseSettings;
}

/** Contract component */
export interface ContractComponent extends ComponentBase {
  readonly type: 'contract';
  readonly settings: ContractSettings;
}

/** Config component */
export interface ConfigComponent extends ComponentBase {
  readonly type: 'config';
  readonly settings: ConfigSettings;
}

/** Union of all component types with their settings */
export type Component =
  | ServerComponent
  | WebappComponent
  | HelmComponent
  | DatabaseComponent
  | ContractComponent
  | ConfigComponent;

// =============================================================================
// Type Guards
// =============================================================================

/** Check if component is a server */
export const isServerComponent = (c: Component): c is ServerComponent =>
  c.type === 'server';

/** Check if component is a webapp */
export const isWebappComponent = (c: Component): c is WebappComponent =>
  c.type === 'webapp';

/** Check if component is a helm chart */
export const isHelmComponent = (c: Component): c is HelmComponent =>
  c.type === 'helm';

/** Check if component is a database */
export const isDatabaseComponent = (c: Component): c is DatabaseComponent =>
  c.type === 'database';

/** Check if component is a contract */
export const isContractComponent = (c: Component): c is ContractComponent =>
  c.type === 'contract';

/** Check if component is config */
export const isConfigComponent = (c: Component): c is ConfigComponent =>
  c.type === 'config';

/** Check if helm settings are for a server */
export const isHelmServerSettings = (
  s: HelmSettings
): s is HelmServerSettings => s.deploy_type === 'server';

/** Check if helm settings are for a webapp */
export const isHelmWebappSettings = (
  s: HelmSettings
): s is HelmWebappSettings => s.deploy_type === 'webapp';

// =============================================================================
// Settings File Schema
// =============================================================================

/** SDD metadata in settings file */
export interface SddMetadata {
  /** SDD plugin version that created this project */
  readonly plugin_version: string;
  /** Date project was initialized (YYYY-MM-DD) */
  readonly initialized_at: string;
  /** Date settings were last modified (YYYY-MM-DD) */
  readonly last_updated: string;
}

/** Project metadata in settings file */
export interface ProjectMetadata {
  /** Project name (lowercase, hyphens) */
  readonly name: string;
  /** Project description */
  readonly description: string;
  /** Primary business domain */
  readonly domain: string;
  /** Project type */
  readonly type: 'fullstack' | 'backend' | 'frontend' | 'custom';
}

/** Complete settings file schema */
export interface SettingsFile {
  readonly sdd: SddMetadata;
  readonly project: ProjectMetadata;
  readonly components: readonly Component[];
  readonly system?: SystemSettings;
}
