/**
 * Type definitions for the env command namespace.
 */

export const DEFAULT_CLUSTER_NAME = 'sdd-local';

export type ClusterProvider = 'kind' | 'minikube' | 'docker-desktop';

export type EnvironmentConfig = {
  readonly clusterName: string;
  readonly provider: ClusterProvider;
  readonly namespace: string;
}

export type InfrastructureConfig = {
  readonly metricsEnabled: boolean;
  readonly logsEnabled: boolean;
  readonly metricsRetention: string;
  readonly logsRetention: string;
}

export const DEFAULT_INFRA_CONFIG: InfrastructureConfig = {
  metricsEnabled: true,
  logsEnabled: true,
  metricsRetention: '7d',
  logsRetention: '7d',
};

/**
 * Provider interface for cluster lifecycle operations.
 */
export interface ClusterProviderOps {
  readonly name: ClusterProvider;
  readonly create: (clusterName: string) => Promise<void>;
  readonly destroy: (clusterName: string) => Promise<void>;
  readonly start: (clusterName: string) => Promise<void>;
  readonly stop: (clusterName: string) => Promise<void>;
  readonly exists: (clusterName: string) => Promise<boolean>;
  readonly isRunning: (clusterName: string) => Promise<boolean>;
}
