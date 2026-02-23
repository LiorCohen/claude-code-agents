#!/usr/bin/env node
/**
 * Fullstack TypeScript Tech Pack System CLI.
 *
 * Usage: fs-ts-system <namespace> <action> [args] [options]
 *
 * Namespaces:
 *   config        Config component operations
 *   contract      Contract component operations
 *   database      Database component operations
 *   local-env     Local environment management
 */

import { parseArgs, type CommandResult, type GlobalOptions, outputResult } from '@/lib/args';
import { createLogger } from '@/lib/logger';

// Command imports
import { handleConfig } from '@/commands/config';
import { handleContract } from '@/commands/contract';
import { handleDatabase } from '@/commands/database';
import { handleEnvironment } from '@/commands/local-env';

const NAMESPACES = ['config', 'contract', 'database', 'local-env'] as const;
type Namespace = (typeof NAMESPACES)[number];

const HELP_TEXT = `
Fullstack TypeScript Tech Pack System CLI

Usage: fs-ts-system <namespace> <action> [args] [options]

Namespaces:
  config        Config component operations
    generate    Generate merged config for target environment
    validate    Validate config against schemas
    diff        Show differences between environments
    add-env     Add a new environment directory

  contract      Contract component operations
    generate-types  Generate TypeScript types from OpenAPI spec
    validate        Validate OpenAPI spec

  database      Database component operations
    setup       Deploy PostgreSQL to k8s
    teardown    Remove PostgreSQL from k8s
    migrate     Run migrations
    seed        Seed database
    reset       Reset (teardown + setup + migrate + seed)
    port-forward  Port forward to local
    psql        Open psql shell

  local-env     Local environment management
    create      Create local k8s cluster + install infra
    destroy     Delete cluster entirely
    start       Resume stopped cluster
    stop        Pause cluster (preserves state)
    restart     Restart cluster (stop + start)
    status      Show cluster and deployment status
    deploy      Deploy application Helm charts
    undeploy    Remove application deployments
    forward     Port-forward services for local access
    config      Generate local environment config
    infra       Install/reinstall observability stack
    check-tools Check required development tools

Global Options:
  --json        JSON output mode
  --verbose     Verbose logging
  --help        Show help

Examples:
  fs-ts-system database setup my-db
  fs-ts-system config generate --env production
  fs-ts-system local-env create --provider kind
`.trim();

type CommandHandler = (
  action: string,
  args: readonly string[],
  options: GlobalOptions
) => Promise<CommandResult>;

const COMMAND_HANDLERS: Readonly<Record<Namespace, CommandHandler>> = {
  config: handleConfig,
  contract: handleContract,
  database: handleDatabase,
  'local-env': handleEnvironment,
};

const showHelp = (options: GlobalOptions): CommandResult => {
  if (options.json) {
    return {
      success: true,
      data: {
        namespaces: NAMESPACES,
        usage: 'fs-ts-system <namespace> <action> [args] [options]',
      },
    };
  }
  console.log(HELP_TEXT);
  return { success: true };
};

const main = async (): Promise<number> => {
  const { namespace, action, args, options } = parseArgs(process.argv.slice(2));
  const logger = createLogger(options);

  // Handle help flag
  if (options.help || !namespace) {
    const result = showHelp(options);
    outputResult(result, options);
    return result.success ? 0 : 1;
  }

  // Validate namespace
  if (!NAMESPACES.includes(namespace as Namespace)) {
    const result: CommandResult = {
      success: false,
      error: `Unknown namespace: ${namespace}. Available: ${NAMESPACES.join(', ')}`,
    };
    outputResult(result, options);
    return 1;
  }

  // Get handler
  const handler = COMMAND_HANDLERS[namespace as Namespace];

  if (!action) {
    const result: CommandResult = {
      success: false,
      error: `Missing action for namespace '${namespace}'. Use --help for available actions.`,
    };
    outputResult(result, options);
    return 1;
  }

  try {
    logger.debug(`Executing: ${namespace} ${action}`, { args, options });
    const result = await handler(action, args, options);
    outputResult(result, options);
    return result.success ? 0 : 1;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(`Command failed: ${errorMessage}`);
    const result: CommandResult = {
      success: false,
      error: errorMessage,
    };
    outputResult(result, options);
    return 1;
  }
};

main()
  .then(process.exit)
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
