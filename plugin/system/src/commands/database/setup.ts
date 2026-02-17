/**
 * Database setup command.
 *
 * Deploy PostgreSQL database to local Kubernetes cluster.
 *
 * Usage:
 *   sdd-system database setup <component-name>
 */

import { execSync } from 'node:child_process';
import type { CommandResult } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';

export const setup = async (
  componentName: string,
  args: readonly string[],
  env: string = 'local'
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);

  const namespace = named['namespace'] ?? process.env['DB_NAMESPACE'] ?? env;
  const releaseName = named['release-name'] ?? process.env['DB_RELEASE_NAME'] ?? `${componentName}-db`;

  console.log(`Deploying PostgreSQL to namespace: ${namespace}`);

  try {
    // Create namespace if it doesn't exist
    execSync(`kubectl create namespace "${namespace}" --dry-run=client -o yaml | kubectl apply -f -`, {
      stdio: 'inherit',
    });

    // Add Bitnami repo if not present
    try {
      execSync('helm repo add bitnami https://charts.bitnami.com/bitnami 2>/dev/null', {
        stdio: 'inherit',
      });
    } catch {
      // Repo may already exist, ignore error
    }
    execSync('helm repo update', { stdio: 'inherit' });

    // Install PostgreSQL
    const helmArgs = [
      'helm upgrade --install',
      `"${releaseName}"`,
      'bitnami/postgresql',
      `--namespace "${namespace}"`,
      `--set auth.database=${componentName}`,
      `--set auth.username=${componentName}`,
      `--set auth.password=${componentName}-local`,
      '--set primary.persistence.size=1Gi',
      '--wait',
    ].join(' ');

    execSync(helmArgs, { stdio: 'inherit' });

    console.log('');
    console.log('PostgreSQL deployed successfully!');
    console.log('');
    console.log('Connection details:');
    console.log(`  Host: ${releaseName}-postgresql.${namespace}.svc.cluster.local`);
    console.log('  Port: 5432');
    console.log(`  Database: ${componentName}`);
    console.log(`  Username: ${componentName}`);
    console.log(`  Password: ${componentName}-local`);
    console.log('');
    console.log('To connect locally, run: sdd-system database port-forward ' + componentName);

    return {
      success: true,
      message: 'PostgreSQL deployed successfully',
      data: {
        namespace,
        releaseName,
        host: `${releaseName}-postgresql.${namespace}.svc.cluster.local`,
        port: 5432,
        database: componentName,
        username: componentName,
      },
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Failed to deploy PostgreSQL: ${errorMessage}`,
    };
  }
};
