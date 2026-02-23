// HTTP Server: Express application setup and lifecycle
// Isolates all HTTP/Express concerns from app orchestration
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import type { Server } from 'node:http';
import type { Controller } from '../controller';

export type HttpServerDependencies = Readonly<{
  readonly controller: Controller;
}>;

export type HttpServer = Readonly<{
  readonly start: (port: number) => Promise<void>;
  readonly stop: () => Promise<void>;
}>;

export const createHttpServer = (deps: HttpServerDependencies): HttpServer => {
  const { controller } = deps;

  let server: Server | null = null;
  const app: Express = express();

  // Middleware
  app.use(express.json());

  // Mount API routes
  app.use('/api/v1', controller.router);

  // Error handling middleware
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  });

  const start = async (port: number): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      server = app.listen(port, () => {
        resolve();
      });
      server.on('error', reject);
    });
  };

  const stop = async (): Promise<void> => {
    if (!server) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      server!.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
    server = null;
  };

  return { start, stop };
};
