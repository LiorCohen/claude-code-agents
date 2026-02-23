#!/usr/bin/env node
/**
 * SDD Core System CLI - Command-line tool for core SDD operations.
 *
 * Usage: sdd-system <namespace> <action> [args] [options]
 *
 * Namespaces:
 *   scaffolding   Project and domain scaffolding
 *   spec          Spec validation, indexing, snapshots
 *   settings      Settings reconciliation
 *   archive       Archive file management
 *   permissions   Permission management
 *   workflow      Workflow phase gate management
 *   tech-pack     Tech pack management
 *   agent         Agent metadata extraction
 *   log           Structured logging
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { parseArgs, type CommandResult, type GlobalOptions, outputResult } from '@/lib/args';
import { createLogger, createFileLogger } from '@/lib/logger';
import type { FileLoggerResult } from '@/lib/logger';
import { findProjectRoot } from '@/lib/config';
import type { ProjectRootResult } from '@/lib/config';
import type { LogLevel } from '@/types/settings';

// Command imports
import { handleSpec } from '@/commands/spec';
import { handleScaffolding } from '@/commands/scaffolding';
import { handlePermissions } from '@/commands/permissions';
import { handleWorkflow } from '@/commands/workflow';
import { handleSettings } from '@/commands/settings';
import { handleArchive } from '@/commands/archive';
import { handleTechPack } from '@/commands/tech-pack';
import { handleAgent } from '@/commands/agent';
import { handleLog } from '@/commands/log';

const NAMESPACES = ['scaffolding', 'spec', 'permissions', 'workflow', 'settings', 'archive', 'tech-pack', 'agent', 'log'] as const;
type Namespace = (typeof NAMESPACES)[number];

const HELP_TEXT = `
SDD Core System CLI - Command-line tool for core SDD operations

Usage: sdd-system <namespace> <action> [args] [options]

Namespaces:
  scaffolding   Project and domain scaffolding
    project     Create new SDD project structure
    domain      Populate domain specs from config

  spec          Spec validation, indexing, snapshots
    validate    Validate spec frontmatter/structure
    index       Generate changes/INDEX.md
    snapshot    Create project snapshot

  permissions   Permission management
    configure   Merge SDD recommended permissions into project settings

  workflow      Workflow phase gate management
    check-gate  Check if prerequisites are met to advance to target phase

  settings      Settings management
    reconcile       Reconcile settings to latest plugin schema
    process-actions Process declared actions from tech system

  archive       Archive file management
    store       Archive a file or directory to sdd/archive/<type>/

  tech-pack     Tech pack management
    validate    Validate a tech pack manifest
    list        List installed tech packs
    info        Show tech pack details
    install     Register a tech pack
    remove      Unregister a tech pack

  agent         Agent metadata extraction
    frontmatter Extract structured metadata from agent .md file

  log           Structured logging
    write       Write a structured log entry to sdd/system-logs/

Global Options:
  --json        JSON output mode
  --verbose     Verbose logging
  --help        Show help

Examples:
  sdd-system spec validate changes/2026/01/01/feature/SPEC.md
  sdd-system spec validate --all --changes-dir changes/
  sdd-system scaffolding project --config config.json
`.trim();

type CommandHandler = (
  action: string,
  args: readonly string[],
  options: GlobalOptions
) => Promise<CommandResult>;

const COMMAND_HANDLERS: Readonly<Record<Namespace, CommandHandler>> = {
  scaffolding: handleScaffolding,
  spec: handleSpec,
  permissions: handlePermissions,
  workflow: handleWorkflow,
  settings: handleSettings,
  archive: handleArchive,
  'tech-pack': handleTechPack,
  agent: handleAgent,
  log: handleLog,
};

const showHelp = (options: GlobalOptions): CommandResult => {
  if (options.json) {
    return {
      success: true,
      data: {
        namespaces: NAMESPACES,
        usage: 'sdd-system <namespace> <action> [args] [options]',
      },
    };
  }
  console.log(HELP_TEXT);
  return { success: true };
};

/** Logging config extracted from raw settings YAML (safe for pre-reconciled files) */
type RawLoggingConfig = {
  readonly enabled: boolean;
  readonly level: LogLevel;
};

type LoadLoggingConfigResult =
  | { readonly loaded: true; readonly config: RawLoggingConfig }
  | { readonly loaded: false };

/**
 * Load logging config from sdd/sdd-settings.yaml if it exists.
 * Safely extracts system.logging without assuming the full SettingsFile shape,
 * since the file may not yet be reconciled to the latest schema.
 */
const loadLoggingConfig = (): LoadLoggingConfigResult => {
  try {
    // Try sdd/ first, fall back to .sdd/ for legacy projects
    const cwd = process.cwd();
    let settingsPath = join(cwd, 'sdd', 'sdd-settings.yaml');
    let content: string;
    try {
      content = readFileSync(settingsPath, 'utf-8');
    } catch {
      settingsPath = join(cwd, '.sdd', 'sdd-settings.yaml');
      content = readFileSync(settingsPath, 'utf-8');
    }
    const raw: unknown = YAML.parse(content);
    if (typeof raw !== 'object' || raw === null) return { loaded: false };
    const rawObj = raw as Readonly<Record<string, unknown>>;
    const system = rawObj.system;
    if (typeof system !== 'object' || system === null) return { loaded: false };
    const systemObj = system as Readonly<Record<string, unknown>>;
    const logging = systemObj.logging;
    if (typeof logging !== 'object' || logging === null) return { loaded: false };
    const loggingObj = logging as Readonly<Record<string, unknown>>;
    if (typeof loggingObj.enabled === 'boolean' && typeof loggingObj.level === 'string') {
      return { loaded: true, config: { enabled: loggingObj.enabled, level: loggingObj.level as LogLevel } };
    }
    return { loaded: false };
  } catch {
    // Settings file doesn't exist or can't be read - use defaults
    return { loaded: false };
  }
};

const main = async (): Promise<number> => {
  const { namespace, action, args, options } = parseArgs(process.argv.slice(2));
  const logger = createLogger(options);

  // Find project root (directory containing package.json or sdd/)
  // If no project found, disable file logging to avoid polluting non-project directories
  const projectRootResult: ProjectRootResult = await findProjectRoot();
  const projectRoot = projectRootResult.found ? projectRootResult.path : undefined;

  // Load logging config from settings (safe for pre-reconciled files)
  const loggingConfigResult = loadLoggingConfig();
  const loggingConfig: RawLoggingConfig = loggingConfigResult.loaded
    ? loggingConfigResult.config
    : { enabled: true, level: 'info' as LogLevel };

  const command = namespace && action ? `${namespace} ${action}` : undefined;
  const logResult: FileLoggerResult = createFileLogger({
    enabled: loggingConfig.enabled && projectRoot !== undefined,
    level: loggingConfig.level,
    command,
    args,
    projectRoot,
  });
  const fileLogger = logResult.created ? logResult.logger : undefined;

  // Log CLI invocation
  if (fileLogger && command) {
    fileLogger.info({
      namespace,
      action,
      arguments: args,
    }, 'CLI invocation');
  }

  // Handle help flag
  if (options.help || !namespace) {
    const result = showHelp(options);
    outputResult(result, options);

    // Log result
    if (fileLogger) {
      fileLogger.info({ result }, 'Command completed');
    }

    return result.success ? 0 : 1;
  }

  // Validate namespace
  if (!NAMESPACES.includes(namespace as Namespace)) {
    const result: CommandResult = {
      success: false,
      error: `Unknown namespace: ${namespace}. Available: ${NAMESPACES.join(', ')}`,
    };
    outputResult(result, options);

    // Log error result
    if (fileLogger) {
      fileLogger.error({ result }, 'Invalid namespace');
    }

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

    // Log error result
    if (fileLogger) {
      fileLogger.error({ result }, 'Missing action');
    }

    return 1;
  }

  try {
    logger.debug(`Executing: ${namespace} ${action}`, { args, options });
    const result = await handler(action, args, options);
    outputResult(result, options);

    // Log result
    if (fileLogger) {
      if (result.success) {
        fileLogger.info({ result }, 'Command completed');
      } else {
        fileLogger.error({ result }, 'Command failed');
      }
    }

    return result.success ? 0 : 1;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(`Command failed: ${errorMessage}`);
    const result: CommandResult = {
      success: false,
      error: errorMessage,
    };
    outputResult(result, options);

    // Log exception
    if (fileLogger) {
      fileLogger.error({
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
        result,
      }, 'Command exception');
    }

    return 1;
  }
};

main()
  .then(process.exit)
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
