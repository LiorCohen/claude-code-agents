/**
 * Restart a local Kubernetes environment.
 *
 * Stops and then starts the cluster.
 *
 * Usage:
 *   sdd-system env restart [--name=cluster-name] [--provider=...]
 */

import type { CommandResult, GlobalOptions } from '@/lib/args';
import { stop } from './stop';
import { start } from './start';

export const restart = async (
  args: readonly string[],
  options: GlobalOptions
): Promise<CommandResult> => {
  // Stop the cluster
  const stopResult = await stop(args, options);
  if (!stopResult.success) {
    // If stop failed because cluster wasn't running, that's OK
    if (!stopResult.error?.includes('not found')) {
      return stopResult;
    }
  }

  // Start the cluster
  return start(args, options);
};
