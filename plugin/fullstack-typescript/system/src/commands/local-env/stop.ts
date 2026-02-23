/**
 * Stop a running local Kubernetes environment.
 *
 * Pauses the cluster while preserving state.
 *
 * Usage:
 *   sdd-system env stop [--name=cluster-name] [--provider=...]
 */

import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { DEFAULT_CLUSTER_NAME, type ClusterProvider } from './types';
import { getProvider, getClusterProvider } from './providers';

export const stop = async (
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);
  const clusterName = named['name'] ?? DEFAULT_CLUSTER_NAME;

  // Get provider from persisted state (or explicit override)
  const explicitProvider = named['provider'] as ClusterProvider | undefined;
  const providerResult = getClusterProvider(clusterName);
  const providerName = explicitProvider ?? (providerResult.found ? providerResult.provider : undefined);

  if (!providerName) {
    return {
      success: false,
      error: `Cluster '${clusterName}' not found.`,
    };
  }

  const provider = getProvider(providerName);

  try {
    if (!(await provider.exists(clusterName))) {
      return {
        success: false,
        error: `Cluster '${clusterName}' does not exist.`,
      };
    }

    console.log(`Stopping cluster '${clusterName}' (provider: ${providerName})...`);
    await provider.stop(clusterName);

    return {
      success: true,
      message: `Cluster '${clusterName}' stopped (state preserved)`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to stop env: ${message}` };
  }
};
