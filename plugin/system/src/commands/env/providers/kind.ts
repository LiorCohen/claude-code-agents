/**
 * Kind cluster provider implementation.
 *
 * Kind (Kubernetes IN Docker) is a tool for running local Kubernetes clusters
 * using Docker container "nodes".
 */

import { execSync } from 'node:child_process';
import type { ClusterProviderOps } from '../types';

export const kindProvider: ClusterProviderOps = {
  name: 'kind',

  create: async (clusterName: string): Promise<string> => {
    const kindConfig = `
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 80
        hostPort: 80
        protocol: TCP
      - containerPort: 443
        hostPort: 443
        protocol: TCP
`;
    execSync(`echo '${kindConfig}' | kind create cluster --name ${clusterName} --config=-`, {
      stdio: 'inherit',
    });
    return `Kind cluster '${clusterName}' created`;
  },

  destroy: async (clusterName: string): Promise<string> => {
    execSync(`kind delete cluster --name ${clusterName}`, { stdio: 'inherit' });
    return `Kind cluster '${clusterName}' destroyed`;
  },

  start: async (clusterName: string): Promise<string> => {
    const containerName = `${clusterName}-control-plane`;
    execSync(`docker start ${containerName}`, { stdio: 'inherit' });
    return `Kind cluster '${clusterName}' started`;
  },

  stop: async (clusterName: string): Promise<string> => {
    const containerName = `${clusterName}-control-plane`;
    execSync(`docker stop ${containerName}`, { stdio: 'inherit' });
    return `Kind cluster '${clusterName}' stopped`;
  },

  exists: async (clusterName: string): Promise<boolean> => {
    try {
      const clusters = execSync('kind get clusters', { encoding: 'utf-8' });
      return clusters.split('\n').includes(clusterName);
    } catch {
      return false;
    }
  },

  isRunning: async (clusterName: string): Promise<boolean> => {
    const containerName = `${clusterName}-control-plane`;
    try {
      const status = execSync(`docker inspect -f '{{.State.Status}}' ${containerName}`, {
        encoding: 'utf-8',
      }).trim();
      return status === 'running';
    } catch {
      return false;
    }
  },
};
