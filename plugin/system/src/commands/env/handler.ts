/**
 * Environment namespace command handler.
 *
 * Commands:
 *   create     Create local k8s cluster and install infrastructure
 *   destroy    Delete cluster entirely
 *   start      Resume a stopped cluster
 *   stop       Pause cluster (preserves state)
 *   restart    Restart cluster (stop + start)
 *   status     Show cluster and deployment status
 *   deploy     Deploy application Helm charts
 *   undeploy   Remove application deployments (keep infra)
 *   forward    Port-forward services for local access
 *   config     Generate local environment config file
 *   infra      Install/reinstall observability infrastructure
 *   check-tools  Check required development tools
 */

import type { CommandResult, GlobalOptions } from '@/lib/args';
import { validateArgs, formatValidationErrors } from '@/lib/schema-validator';
import { schema, type EnvironmentArgs } from './schema';

export const handleEnvironment = async (
  action: string,
  args: readonly string[],
  options: GlobalOptions
): Promise<CommandResult> => {
  const validation = validateArgs<EnvironmentArgs>({ action }, schema);
  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid arguments:\n${formatValidationErrors(validation.errors)}`,
    };
  }

  const validatedArgs = validation.data;

  switch (validatedArgs.action) {
    case 'create': {
      const { create } = await import('./create');
      return create(args, options);
    }
    case 'destroy': {
      const { destroy } = await import('./destroy');
      return destroy(args, options);
    }
    case 'start': {
      const { start } = await import('./start');
      return start(args, options);
    }
    case 'stop': {
      const { stop } = await import('./stop');
      return stop(args, options);
    }
    case 'restart': {
      const { restart } = await import('./restart');
      return restart(args, options);
    }
    case 'status': {
      const { status } = await import('./status');
      return status(args, options);
    }
    case 'deploy': {
      const { deploy } = await import('./deploy');
      return deploy(args, options);
    }
    case 'undeploy': {
      const { undeploy } = await import('./undeploy');
      return undeploy(args, options);
    }
    case 'forward': {
      const { forward } = await import('./forward');
      return forward(args, options);
    }
    case 'config': {
      const { config } = await import('./config');
      return config(args, options);
    }
    case 'infra': {
      const { infra } = await import('./infra');
      return infra(args, options);
    }
    case 'check-tools': {
      const { checkTools } = await import('./check-tools');
      return checkTools(args, options);
    }
    default:
      return { success: false, error: `Unknown action: ${action}` };
  }
};
