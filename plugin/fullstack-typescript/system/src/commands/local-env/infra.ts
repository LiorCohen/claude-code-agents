/**
 * Install or reinstall observability infrastructure.
 *
 * Installs Victoria Metrics and Victoria Logs stack into the cluster.
 *
 * Usage:
 *   sdd-system env infra [--reinstall]
 */

import { execSync } from 'node:child_process';
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';

export const infra = async (
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);
  const reinstall = named['reinstall'] === 'true';

  try {
    // Check cluster is running
    try {
      execSync('kubectl get nodes', { stdio: 'pipe' });
    } catch {
      return {
        success: false,
        error: 'No cluster available. Create one with "env create" first.',
      };
    }

    if (reinstall) {
      console.log('Removing existing infrastructure...');
      try {
        execSync('helm uninstall vmstack -n telemetry', { stdio: 'pipe' });
      } catch {
        // Release may not exist
      }
      try {
        execSync('helm uninstall vls -n telemetry', { stdio: 'pipe' });
      } catch {
        // Release may not exist
      }
      try {
        execSync('helm uninstall vlcollector -n telemetry', { stdio: 'pipe' });
      } catch {
        // Release may not exist
      }
    }

    // Add helm repos
    execSync('helm repo add vm https://victoriametrics.github.io/helm-charts/', {
      stdio: 'inherit',
    });
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

    return {
      success: true,
      message: 'Infrastructure installed successfully',
      data: {
        metricsUrl: 'http://vmstack-victoria-metrics-k8s-stack:9090',
        logsUrl: 'http://vls-victoria-logs-single-server:9428',
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to install infrastructure: ${message}` };
  }
};
