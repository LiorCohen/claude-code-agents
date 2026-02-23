// Re-export all config types for easy importing
// Add exports as you create component-specific types

// Base config type - all components can use this
export type BaseConfig = Readonly<Record<string, unknown>>;

// Component-specific types (uncomment/add as needed)
// export type { ServerConfig } from './server.js';
// export type { FrontendConfig } from './frontend.js';
