/**
 * Logging utilities for the CLI.
 */

import { mkdirSync } from 'fs';
import { join } from 'path';
import pino from 'pino';
import type { GlobalOptions } from './args';
import type { LogLevel } from '@/types/settings';

// ANSI color codes
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
} as const;

export interface Logger {
  readonly info: (message: string, data?: unknown) => void;
  readonly success: (message: string, data?: unknown) => void;
  readonly warn: (message: string, data?: unknown) => void;
  readonly error: (message: string, data?: unknown) => void;
  readonly debug: (message: string, data?: unknown) => void;
}

/**
 * Create a logger instance with the given options.
 */
export const createLogger = (options: GlobalOptions): Logger => {
  const { json, verbose } = options;

  const formatMessage = (
    level: string,
    color: string,
    message: string,
    data?: unknown
  ): string => {
    if (json) {
      return JSON.stringify({ level, message, ...(data ? { data } : {}) });
    }
    const prefix = `${color}[${level}]${COLORS.reset}`;
    const dataStr = data ? ` ${COLORS.gray}${JSON.stringify(data)}${COLORS.reset}` : '';
    return `${prefix} ${message}${dataStr}`;
  };

  return {
    info: (message: string, data?: unknown) => {
      console.log(formatMessage('INFO', COLORS.blue, message, data));
    },
    success: (message: string, data?: unknown) => {
      console.log(formatMessage('OK', COLORS.green, message, data));
    },
    warn: (message: string, data?: unknown) => {
      console.warn(formatMessage('WARN', COLORS.yellow, message, data));
    },
    error: (message: string, data?: unknown) => {
      console.error(formatMessage('ERROR', COLORS.red, message, data));
    },
    debug: (message: string, data?: unknown) => {
      if (verbose) {
        console.log(formatMessage('DEBUG', COLORS.gray, message, data));
      }
    },
  };
};

/**
 * Simple success/error output for CLI results (non-JSON mode).
 */
export const success = (message: string): void => {
  console.log(`${COLORS.green}✓${COLORS.reset} ${message}`);
};

export const error = (message: string): void => {
  console.error(`${COLORS.red}✗${COLORS.reset} ${message}`);
};

/**
 * File logger configuration options.
 */
export interface FileLoggerOptions {
  /** Enable/disable file logging */
  readonly enabled: boolean;
  /** Log level */
  readonly level: LogLevel;
  /** Command name (namespace + action) */
  readonly command?: string;
  /** Command arguments */
  readonly args?: readonly string[];
  /** Project root directory (defaults to process.cwd()) */
  readonly projectRoot?: string;
}

/**
 * Create a pino file logger instance that writes to .sdd/system-logs/.
 *
 * This logger is INDEPENDENT of console output. Console output is user-facing
 * and remains completely unchanged. File logging is for system audit/debug.
 *
 * @param options - File logger configuration
 * @returns Pino logger instance, or null if logging is disabled
 */
export const createFileLogger = (
  options: FileLoggerOptions
): pino.Logger | null => {
  if (!options.enabled) {
    return null;
  }

  try {
    // Get current date for log file naming
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Use provided projectRoot or fallback to process.cwd()
    const projectRoot = options.projectRoot ?? process.cwd();
    const logDir = join(projectRoot, '.sdd', 'system-logs');
    mkdirSync(logDir, { recursive: true });

    // Create log file path
    const logFile = join(logDir, `system-${date}.log`);

    // Create pino logger with file transport
    const logger = pino(
      {
        level: options.level,
        // Base context included in every log entry
        base: {
          pid: process.pid,
          sessionId: process.env.CLAUDE_SESSION_ID || undefined,
          command: options.command,
          args: options.args,
        },
      },
      pino.destination({
        dest: logFile,
        sync: true, // Sync mode for short-lived CLI processes
      })
    );

    return logger;
  } catch (err) {
    // Fail silently - don't interrupt command execution
    console.warn(
      `${COLORS.yellow}Warning:${COLORS.reset} Failed to initialize file logger:`,
      err instanceof Error ? err.message : String(err)
    );
    return null;
  }
};
