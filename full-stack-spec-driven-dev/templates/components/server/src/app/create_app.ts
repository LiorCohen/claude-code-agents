import type { Config } from '../config';

type AppDependencies = Readonly<{
  readonly config: Config;
}>;

type App = Readonly<{
  readonly start: () => Promise<void>;
  readonly stop: () => Promise<void>;
}>;

export const createApp = (deps: AppDependencies): App => {
  const { config } = deps;

  const start = async (): Promise<void> => {
    console.log(`App starting on port ${config.port}...`);
    // TODO: Initialize Express app, middleware, routes
  };

  const stop = async (): Promise<void> => {
    console.log('App stopping...');
    // TODO: Graceful shutdown
  };

  return { start, stop };
};
