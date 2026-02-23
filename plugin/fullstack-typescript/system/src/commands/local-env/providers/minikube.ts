/**
 * Minikube cluster provider implementation.
 *
 * Minikube is a tool that runs a single-node Kubernetes cluster locally.
 */

import { execSync } from 'node:child_process';
import type { ClusterProviderOps } from '../types';

export const minikubeProvider: ClusterProviderOps = {
  name: 'minikube',

  create: async (clusterName: string): Promise<string> => {
    execSync(`minikube start --profile=${clusterName}`, { stdio: 'inherit' });
    return `Minikube cluster '${clusterName}' created`;
  },

  destroy: async (clusterName: string): Promise<string> => {
    execSync(`minikube delete --profile=${clusterName}`, { stdio: 'inherit' });
    return `Minikube cluster '${clusterName}' destroyed`;
  },

  start: async (clusterName: string): Promise<string> => {
    execSync(`minikube start --profile=${clusterName}`, { stdio: 'inherit' });
    return `Minikube cluster '${clusterName}' started`;
  },

  stop: async (clusterName: string): Promise<string> => {
    execSync(`minikube stop --profile=${clusterName}`, { stdio: 'inherit' });
    return `Minikube cluster '${clusterName}' stopped`;
  },

  exists: async (clusterName: string): Promise<boolean> => {
    try {
      const profiles = execSync('minikube profile list -o json', { encoding: 'utf-8' });
      const data = JSON.parse(profiles) as { valid?: ReadonlyArray<{ Name: string }> };
      return data.valid?.some((p) => p.Name === clusterName) ?? false;
    } catch {
      return false;
    }
  },

  isRunning: async (clusterName: string): Promise<boolean> => {
    try {
      const status = execSync(`minikube status --profile=${clusterName} -o json`, {
        encoding: 'utf-8',
      });
      const data = JSON.parse(status) as { Host?: string };
      return data.Host === 'Running';
    } catch {
      return false;
    }
  },
};
