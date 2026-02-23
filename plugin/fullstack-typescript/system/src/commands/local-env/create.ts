/**
 * Create local Kubernetes environment.
 *
 * Creates a local k8s cluster using the specified provider (kind, minikube,
 * or docker-desktop) and installs the observability infrastructure stack.
 *
 * Usage:
 *   sdd-system env create [--name=cluster-name] [--provider=kind|minikube|docker-desktop] [--skip-infra]
 */

import { execSync } from 'node:child_process';
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { DEFAULT_CLUSTER_NAME, type ClusterProvider } from './types';
import {
  getProvider,
  detectProvider,
  persistClusterProvider,
  checkPrerequisites,
} from './providers';

export const create = async (
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);
  const clusterName = named['name'] ?? DEFAULT_CLUSTER_NAME;
  const skipInfra = named['skip-infra'] === 'true';
  const explicitProvider = named['provider'] as ClusterProvider | undefined;

  // Check prerequisites
  const prereqs = checkPrerequisites();
  if (!prereqs.ok) {
    return {
      success: false,
      error: `Missing prerequisites: ${prereqs.missing.join(', ')}. Please install them first.`,
    };
  }

  // Detect or use explicit provider
  const providerName = explicitProvider ?? (await detectProvider());
  const provider = getProvider(providerName);

  try {
    // Check if cluster already exists
    if (await provider.exists(clusterName)) {
      if (await provider.isRunning(clusterName)) {
        return {
          success: false,
          error: `Cluster '${clusterName}' already exists and is running.`,
        };
      }
      return {
        success: false,
        error: `Cluster '${clusterName}' already exists. Use 'env start' to resume or 'env destroy' first.`,
      };
    }

    // Create cluster
    console.log(`Creating cluster '${clusterName}' using ${providerName}...`);
    await provider.create(clusterName);

    // Persist provider choice for later operations
    persistClusterProvider(clusterName, providerName);

    // Switch kubectl context for kind clusters
    if (providerName === 'kind') {
      execSync(`kubectl config use-context kind-${clusterName}`, { stdio: 'inherit' });
    }

    // Wait for cluster to be ready
    console.log('Waiting for cluster to be ready...');
    execSync('kubectl wait --for=condition=Ready nodes --all --timeout=120s', {
      stdio: 'inherit',
    });

    if (!skipInfra) {
      // Install infrastructure stack
      console.log('Installing observability infrastructure...');
      const infraResult = await installInfrastructure();
      console.log(infraResult);
    }

    return {
      success: true,
      message: `Local env '${clusterName}' created successfully (provider: ${providerName})`,
      data: { clusterName, provider: providerName, infrastructure: !skipInfra },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to create env: ${message}` };
  }
};

/**
 * Install observability infrastructure.
 * Returns a summary of installed components.
 */
const installInfrastructure = async (): Promise<string> => {
  // Add helm repos
  execSync('helm repo add vm https://victoriametrics.github.io/helm-charts/', { stdio: 'inherit' });
  execSync('helm repo update', { stdio: 'inherit' });

  // Create telemetry namespace
  execSync('kubectl create namespace telemetry --dry-run=client -o yaml | kubectl apply -f -', {
    stdio: 'inherit',
  });

  // Install Victoria Metrics stack
  console.log('Installing Victoria Metrics...');
  execSync(
    `helm upgrade --install vmstack vm/victoria-metrics-k8s-stack \
      -n telemetry \
      --set vmsingle.enabled=true \
      --set vmagent.enabled=true \
      --wait --timeout 5m`,
    { stdio: 'inherit' }
  );

  // Install Victoria Logs
  console.log('Installing Victoria Logs...');
  execSync(
    `helm upgrade --install vls vm/victoria-logs-single \
      -n telemetry \
      --set server.retentionPeriod=7d \
      --set server.persistentVolume.size=5Gi \
      --wait --timeout 3m`,
    { stdio: 'inherit' }
  );

  // Install log collector
  console.log('Installing log collector...');
  execSync(
    `helm upgrade --install vlcollector vm/victoria-logs-collector \
      -n telemetry \
      --set "remoteWrite[0].url=http://vls-victoria-logs-single-server:9428" \
      --wait --timeout 2m`,
    { stdio: 'inherit' }
  );

  return 'Infrastructure installed: victoria-metrics, victoria-logs, log-collector';
};
