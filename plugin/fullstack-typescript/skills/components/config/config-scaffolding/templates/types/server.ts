// Server config type - extend as needed
// Import this type in your server component for type-safe config access

export type ServerConfig = Readonly<{
  port?: number;
  probesPort?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  database?: Readonly<{
    host?: string;
    port?: number;
    name?: string;
    user?: string;
    passwordSecret?: string;
    pool?: number;
  }>;
}>;
