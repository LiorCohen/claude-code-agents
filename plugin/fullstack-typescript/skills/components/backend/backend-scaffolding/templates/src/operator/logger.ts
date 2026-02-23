// Telemetry: Structured logging with OpenTelemetry context
// Logger receives config from Config layer - NEVER access process.env directly
import pino from 'pino';
import { context, trace } from '@opentelemetry/api';
import type { Config } from '../config';

// Create base logger with config from Config layer
export const createBaseLogger = (config: Config): pino.Logger => {
  return pino({
    level: config.logLevel,
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
};

// Create child logger for specific component
export const createLogger = (baseLogger: pino.Logger, component: string): pino.Logger => {
  return baseLogger.child({ component });
};

// Add OpenTelemetry trace context to log objects
export const withTraceContext = <T extends Record<string, unknown>>(
  obj: T
): T & { traceId?: string; spanId?: string } => {
  const span = trace.getSpan(context.active());
  if (span) {
    const spanContext = span.spanContext();
    return {
      ...obj,
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
    };
  }
  return obj;
};
