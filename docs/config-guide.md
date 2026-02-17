# Configuration Guide

This guide explains the SDD configuration system and how to use it effectively.

## Overview

SDD uses a centralized configuration system where all config lives in a single component (`components/config/`). This provides:

- **Single source of truth** - All configuration in one place
- **Environment layering** - Base config merged with environment-specific overrides
- **Type safety** - TypeScript types imported by consuming components
- **Schema validation** - JSON Schema validation at generate and runtime

## Quick Start

### 1. Add a Config Property

Add to `components/config/envs/default/config.yaml`:

```yaml
server-task-service:
  port: 3000
  logLevel: info
```

### 2. Add Local Override (if needed)

Add to `components/config/envs/local/config.yaml`:

```yaml
server-task-service:
  logLevel: debug  # More verbose for development
```

### 3. Update TypeScript Types

Add to `components/config/types/server.ts`:

```typescript
export type ServerConfig = Readonly<{
  port?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}>;
```

### 4. Generate Merged Config

```
/sdd I want to generate config for local
```

### 5. Start Server

```bash
SDD_CONFIG_PATH=./local-config.yaml npm start
```

## Directory Structure

```
components/config/
├── package.json                # Workspace package for type imports
├── tsconfig.json               # TypeScript config
├── envs/
│   ├── default/
│   │   └── config.yaml         # Base configuration (always merged first)
│   ├── local/
│   │   └── config.yaml         # Local development overrides
│   └── {env}/
│       └── config.yaml         # Other environments (add as needed)
├── schemas/
│   └── config.schema.json      # JSON Schema for validation
└── types/
    ├── index.ts                # Re-exports all config types
    └── {component}.ts          # Per-component type definitions
```

## Environment Layering

Configs are merged in this order:

1. `envs/default/config.yaml` - Base configuration
2. `envs/{env}/config.yaml` - Environment-specific overrides

### Merge Rules

- **Objects**: Recursively merged (both levels' keys preserved)
- **Arrays**: Replaced entirely (env array replaces default)
- **Primitives**: Env value replaces default value
- **Null values**: Setting `null` removes the key

### Example

```yaml
# envs/default/config.yaml
server-task-service:
  port: 3000
  database:
    host: db.internal
    pool: 10

# envs/local/config.yaml
server-task-service:
  database:
    host: localhost

# Result (merged):
server-task-service:
  port: 3000          # Preserved from default
  database:
    host: localhost   # Overridden by local
    pool: 10          # Preserved from default
```

## Adding Environments

To add a new environment (e.g., staging):

```
/sdd I want to add a staging environment
```

This creates `envs/staging/config.yaml` which inherits from `envs/default/`.

## Type Safety

Components import types from the config package:

```typescript
// In your server component
import type { ServerConfig } from '@my-project/config/types';

const config = loadConfig() as ServerConfig;
console.log(config.port);  // TypeScript knows this is number | undefined
```

## Schema Validation

Update `schemas/config.schema.json` as your config evolves:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "server-task-service": {
      "type": "object",
      "properties": {
        "port": { "type": "number", "minimum": 1, "maximum": 65535 },
        "logLevel": { "enum": ["debug", "info", "warn", "error"] }
      },
      "required": ["port"]
    }
  }
}
```

Validation runs:
- When you generate config
- At server startup (if schema file exists alongside config)

## Secrets

Config contains secret **references**, not values:

```yaml
server-task-service:
  database:
    host: db.production.internal
    passwordSecret: "task-service-db-credentials"  # K8s Secret name
```

At deploy time, Helm maps references to actual secrets:

```yaml
# In helm-task-service/templates/deployment.yaml
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: {{ .Values.config.database.passwordSecret }}
        key: password
```

## Local Development Workflow

1. **Edit config** in `envs/default/` or `envs/local/`
2. **Generate merged config**:
   ```
   /sdd I want to generate config for local
   ```
3. **Start server**:
   ```bash
   SDD_CONFIG_PATH=./local-config.yaml npm run dev
   ```

The generated `local-config.yaml` is gitignored.

## Production Deployment

1. **Generate config for production**:
   ```
   /sdd I want to generate config for production
   ```

2. **Deploy with Helm**:
   ```bash
   helm install my-release ./components/helm-task-service \
     -f values-production.yaml \
     --set-file config=production-config.yaml
   ```

## Comparing Environments

To see differences between environments:

```
/sdd I want to compare local and production config
```

## Validating Config

To validate all environments:

```
/sdd I want to validate my config
```

## Environment Agnosticism

Components should **never** know which environment they're running in. They receive config values and use them:

```typescript
// Good - environment agnostic
const config = loadConfig();
if (config.features?.darkMode) {
  enableDarkMode();
}

// Bad - checking environment
if (process.env.NODE_ENV === 'production') {
  enableDarkMode();
}
```

Only two places know about environments:
1. `components/config/envs/` - environment-specific configs
2. `components/helm-*/values-*.yaml` - environment-specific Helm values

## Troubleshooting

### "SDD_CONFIG_PATH environment variable is required"

You need to set the path to your config file:

```bash
SDD_CONFIG_PATH=./local-config.yaml npm start
```

### "Config file not found"

Generate the config file first:

```
/sdd I want to generate config for local
```

### "Config validation failed"

Check your config against the schema:

```
/sdd I want to validate my config
```

The error message will include which fields are invalid.

### Type import not working

Ensure the config package is in your dependencies:

```json
{
  "dependencies": {
    "@my-project/config": "workspace:*"
  }
}
```

Run `npm install` to link the workspace package.
