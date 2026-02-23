// Database: Connection factory using PostgreSQL
import { Pool, type PoolConfig } from 'pg';
import type pino from 'pino';

import type { Config } from '../config';

export type Database = {
  readonly connect: () => Promise<void>;
  readonly query: <T>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }>;
  readonly close: () => Promise<void>;
};

type DatabaseDependencies = Readonly<{
  readonly config: Config;
  readonly logger: pino.Logger;
}>;

export const createDatabase = (deps: DatabaseDependencies): Database => {
  const logger = deps.logger.child({ component: 'database' });

  // PostgreSQL connection pool
  // Configure via DATABASE_URL environment variable
  const poolConfig: PoolConfig = {
    connectionString: deps.config.databaseUrl,
  };

  const pool = new Pool(poolConfig);

  return {
    connect: async () => {
      // Test connection
      const client = await pool.connect();
      client.release();
      logger.info('Database connected');
    },
    query: async <T>(sql: string, params?: unknown[]): Promise<{ rows: T[] }> => {
      const result = await pool.query(sql, params);
      return { rows: result.rows as T[] };
    },
    close: async () => {
      await pool.end();
      logger.info('Database connection closed');
    },
  };
};
