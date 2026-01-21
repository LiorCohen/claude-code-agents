import express, { type Express, type Request, type Response } from 'express';
import type { Server } from 'node:http';
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

  let server: Server | null = null;
  const app: Express = express();

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  const start = async (): Promise<void> => {
    return new Promise((resolve) => {
      server = app.listen(config.port, () => {
        console.log(`App listening on port ${config.port}`);
        resolve();
      });
    });
  };

  const stop = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!server) {
        resolve();
        return;
      }
      server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log('App stopped');
        resolve();
      });
    });
  };

  return { start, stop };
};
