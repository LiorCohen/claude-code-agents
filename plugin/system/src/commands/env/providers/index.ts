/**
 * Provider registry and cluster state management.
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { ClusterProvider, ClusterProviderOps } from '../types';
import { kindProvider } from './kind';
import { minikubeProvider } from './minikube';
import { dockerDesktopProvider } from './docker-desktop';

const providers: Readonly<Record<ClusterProvider, ClusterProviderOps>> = {
  kind: kindProvider,
  minikube: minikubeProvider,
  'docker-desktop': dockerDesktopProvider,
};

// Cluster state file location
const STATE_DIR = path.join(os.homedir(), '.sdd');
const STATE_FILE = path.join(STATE_DIR, 'clusters.json');

type ClusterState = {
  readonly clusters: Readonly<Record<string, ClusterProvider>>;
}

const readState = (): ClusterState => {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) as ClusterState;
    }
  } catch {
    // Ignore parse errors
  }
  return { clusters: {} };
};

/**
 * Write cluster state to disk.
 * Returns the path where state was written.
 */
const writeState = (state: ClusterState): string => {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  return STATE_FILE;
};

/**
 * Get provider instance by name.
 */
export const getProvider = (name: ClusterProvider): ClusterProviderOps => {
  return providers[name];
};

/**
 * Get the provider used to create a cluster (from persisted state).
 * Returns a result union indicating whether the cluster is tracked.
 */
type ClusterProviderResult =
  | { readonly found: true; readonly provider: ClusterProvider }
  | { readonly found: false };

export const getClusterProvider = (clusterName: string): ClusterProviderResult => {
  const state = readState();
  const provider = state.clusters[clusterName];
  return provider !== undefined
    ? { found: true, provider }
    : { found: false };
};

/**
 * Persist the provider used for a cluster (called after create).
 * Returns the updated cluster state.
 */
export const persistClusterProvider = (clusterName: string, provider: ClusterProvider): ClusterState => {
  const state = readState();
  const newState: ClusterState = { clusters: { ...state.clusters, [clusterName]: provider } };
  writeState(newState);
  return newState;
};

/**
 * Remove cluster from persisted state (called after destroy).
 * Returns the updated cluster state.
 */
export const removeClusterProvider = (clusterName: string): ClusterState => {
  const state = readState();
  const { [clusterName]: _, ...rest } = state.clusters;
  const newState: ClusterState = { clusters: rest };
  writeState(newState);
  return newState;
};

/**
 * Auto-detect the best available provider for creating a new cluster.
 * Order: docker-desktop (if running) -> minikube (if installed) -> kind (default)
 */
export const detectProvider = async (): Promise<ClusterProvider> => {
  // 1. Check if Docker Desktop k8s is available and running
  try {
    execSync('kubectl --context=docker-desktop get nodes', { stdio: 'pipe' });
    return 'docker-desktop';
  } catch {
    // Not available or not running
  }

  // 2. Check if minikube is installed
  try {
    execSync('which minikube', { stdio: 'pipe' });
    return 'minikube';
  } catch {
    // Not installed
  }

  // 3. Default to kind
  return 'kind';
};

/**
 * Check prerequisites for running env commands.
 */
export const checkPrerequisites = (): { ok: boolean; missing: ReadonlyArray<string> } => {
  const tools: ReadonlyArray<{ readonly name: string; readonly command: string }> = [
    { name: 'docker', command: 'docker version' },
    { name: 'kubectl', command: 'kubectl version --client' },
    { name: 'helm', command: 'helm version' },
  ];

  const missing: ReadonlyArray<string> = tools.reduce<ReadonlyArray<string>>(
    (acc, tool) => {
      try {
        execSync(tool.command, { stdio: 'pipe' });
        return acc;
      } catch {
        return [...acc, tool.name];
      }
    },
    []
  );

  return { ok: missing.length === 0, missing };
};
