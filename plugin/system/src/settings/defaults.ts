/**
 * Default settings for each component type.
 *
 * These defaults are applied when creating new components if specific
 * settings are not provided.
 */

import type {
  ServerSettings,
  WebappSettings,
  HelmServerSettings,
  HelmWebappSettings,
  DatabaseSettings,
  ContractSettings,
  ConfigSettings,
} from '@/types';

// =============================================================================
// Server Defaults
// =============================================================================

/** Default settings for an API server */
export const DEFAULT_API_SERVER_SETTINGS: ServerSettings = {
  server_type: 'api',
};

/** Default settings for a worker server */
export const DEFAULT_WORKER_SERVER_SETTINGS: ServerSettings = {
  server_type: 'worker',
};

/** Default settings for a cron server */
export const DEFAULT_CRON_SERVER_SETTINGS: ServerSettings = {
  server_type: 'cron',
};

/** Default settings for a hybrid server (api + worker) */
export const DEFAULT_HYBRID_SERVER_SETTINGS: ServerSettings = {
  server_type: 'hybrid',
  modes: ['api', 'worker'],
};

/** Get default server settings based on server type */
export const getDefaultServerSettings = (
  serverType: ServerSettings['server_type']
): ServerSettings => {
  switch (serverType) {
    case 'api':
      return DEFAULT_API_SERVER_SETTINGS;
    case 'worker':
      return DEFAULT_WORKER_SERVER_SETTINGS;
    case 'cron':
      return DEFAULT_CRON_SERVER_SETTINGS;
    case 'hybrid':
      return DEFAULT_HYBRID_SERVER_SETTINGS;
  }
};

// =============================================================================
// Webapp Defaults
// =============================================================================

/** Default settings for a webapp */
export const DEFAULT_WEBAPP_SETTINGS: WebappSettings = {};

// =============================================================================
// Helm Chart Defaults
// =============================================================================

/**
 * Default settings for a server helm chart.
 * Note: 'deploys' is always required and must be provided at creation time.
 */
export const DEFAULT_HELM_SERVER_SETTINGS: Omit<HelmServerSettings, 'deploys'> =
  {
    deploy_type: 'server',
    ingress: true,
  };

/**
 * Default settings for a webapp helm chart.
 * Note: 'deploys' is always required and must be provided at creation time.
 */
export const DEFAULT_HELM_WEBAPP_SETTINGS: Omit<HelmWebappSettings, 'deploys'> =
  {
    deploy_type: 'webapp',
    ingress: true,
    assets: 'bundled',
  };

// =============================================================================
// Database Defaults
// =============================================================================

/** Default settings for a database component */
export const DEFAULT_DATABASE_SETTINGS: DatabaseSettings = {
  provider: 'postgresql',
  dedicated: false,
};

// =============================================================================
// Contract Defaults
// =============================================================================

/** Default settings for a contract component */
export const DEFAULT_CONTRACT_SETTINGS: ContractSettings = {
  visibility: 'internal',
};

// =============================================================================
// Config Defaults
// =============================================================================

/** Default settings for config component (empty - it's a singleton) */
export const DEFAULT_CONFIG_SETTINGS: ConfigSettings = {};
