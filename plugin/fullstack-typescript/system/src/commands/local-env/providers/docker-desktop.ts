/**
 * Docker Desktop Kubernetes provider implementation.
 *
 * Docker Desktop includes a built-in Kubernetes cluster that can be enabled
 * in the Docker Desktop settings.
 */

import { execSync } from 'node:child_process';
import type { ClusterProviderOps } from '../types';

export const dockerDesktopProvider: ClusterProviderOps = {
  name: 'docker-desktop',

  create: async (_clusterName: string): Promise<string> => {
    // Docker Desktop k8s is pre-existing, just verify it's enabled
    try {
      execSync('kubectl config use-context docker-desktop', { stdio: 'inherit' });
    } catch {
      throw new Error(
        'Docker Desktop Kubernetes is not enabled. ' +
          'Enable it in Docker Desktop Settings > Kubernetes > Enable Kubernetes'
      );
    }
    return 'Docker Desktop Kubernetes context activated';
  },

  destroy: async (_clusterName: string): Promise<string> => {
    throw new Error(
      'Cannot destroy Docker Desktop Kubernetes cluster. ' +
        'Disable it in Docker Desktop Settings if needed.'
    );
  },

  start: async (_clusterName: string): Promise<string> => {
    // Docker Desktop k8s starts with Docker Desktop
    console.log('Docker Desktop Kubernetes starts automatically with Docker Desktop.');
    console.log('Ensure Docker Desktop is running.');
    return 'Docker Desktop Kubernetes starts automatically with Docker Desktop';
  },

  stop: async (_clusterName: string): Promise<string> => {
    throw new Error(
      'Cannot stop Docker Desktop Kubernetes independently. ' +
        'Stop Docker Desktop if you need to stop the cluster.'
    );
  },

  exists: async (_clusterName: string): Promise<boolean> => {
    try {
      const contexts = execSync('kubectl config get-contexts -o name', { encoding: 'utf-8' });
      return contexts.split('\n').includes('docker-desktop');
    } catch {
      return false;
    }
  },

  isRunning: async (_clusterName: string): Promise<boolean> => {
    try {
      execSync('kubectl --context=docker-desktop get nodes', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },
};
