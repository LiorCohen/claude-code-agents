/**
 * Start a stopped local Kubernetes environment.
 *
 * Resumes a previously stopped cluster.
 *
 * Usage:
 *   sdd-system env start [--name=cluster-name] [--provider=...]
 */

import { execSync } from 'node:child_process';
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { DEFAULT_CLUSTER_NAME, type ClusterProvider } from './types';
import { getProvider, getClusterProvider } from './providers';

export const start = async (
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
      error: `Cluster '${clusterName}' not found. Use 'env create' first.`,
    };
  }

  const provider = getProvider(providerName);

  try {
    if (!(await provider.exists(clusterName))) {
      return {
        success: false,
        error: `Cluster '${clusterName}' does not exist. Use 'env create' first.`,
      };
    }

    if (await provider.isRunning(clusterName)) {
      return {
        success: true,
        message: `Cluster '${clusterName}' is already running`,
      };
    }

    console.log(`Starting cluster '${clusterName}' (provider: ${providerName})...`);
    await provider.start(clusterName);

    // Switch kubectl context for kind clusters
    if (providerName === 'kind') {
      execSync(`kubectl config use-context kind-${clusterName}`, { stdio: 'inherit' });
    }

    // Wait for API server to be ready
    console.log('Waiting for cluster API...');
    execSync('kubectl wait --for=condition=Ready nodes --all --timeout=120s', {
      stdio: 'inherit',
    });

    return {
      success: true,
      message: `Cluster '${clusterName}' started`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to start env: ${message}` };
  }
};
