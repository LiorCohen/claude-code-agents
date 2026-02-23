/**
 * Destroy local Kubernetes environment.
 *
 * Completely removes the local k8s cluster.
 *
 * Usage:
 *   sdd-system env destroy [--name=cluster-name] [--provider=...]
 */

import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { DEFAULT_CLUSTER_NAME, type ClusterProvider } from './types';
import { getProvider, getClusterProvider, removeClusterProvider } from './providers';

export const destroy = async (
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
      error: `Cluster '${clusterName}' not found. Either it doesn't exist or was not created via 'env create'.`,
    };
  }

  const provider = getProvider(providerName);

  try {
    if (!(await provider.exists(clusterName))) {
      // Clean up stale state
      removeClusterProvider(clusterName);
      return {
        success: false,
        error: `Cluster '${clusterName}' does not exist.`,
      };
    }

    console.log(`Destroying cluster '${clusterName}' (provider: ${providerName})...`);
    await provider.destroy(clusterName);

    // Remove from persisted state
    removeClusterProvider(clusterName);

    return {
      success: true,
      message: `Local env '${clusterName}' destroyed`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to destroy env: ${message}` };
  }
};
