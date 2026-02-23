// Telemetry: OpenTelemetry metrics
// Follow OpenTelemetry semantic conventions for naming
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('server');

// HTTP metrics (Server layer)
export const httpRequestDuration = meter.createHistogram('http.server.request.duration', {
  description: 'HTTP request duration',
  unit: 'ms',
});

export const httpRequestTotal = meter.createCounter('http.server.request.count', {
  description: 'Total HTTP requests',
});

// Database metrics (DAL layer)
export const dbQueryDuration = meter.createHistogram('db.client.operation.duration', {
  description: 'Database query duration',
  unit: 'ms',
});

export const dbConnectionPoolSize = meter.createUpDownCounter('db.client.connection.pool.usage', {
  description: 'Database connection pool usage',
});

// Business metrics (Model layer)
export const businessOperationTotal = meter.createCounter('business.operation.count', {
  description: 'Business operation executions',
});
