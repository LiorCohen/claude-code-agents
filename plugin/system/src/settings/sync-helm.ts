/**
 * Helm chart sync functions.
 *
 * Internal functions for synchronizing helm charts when settings change.
 */

import type {
  Component,
  HelmComponent,
  HelmSettings,
  HelmServerSettings,
  ServerSettings,
} from '../types/settings';
import { isServerComponent, isHelmComponent, isHelmServerSettings } from '../types/settings';

/** Templates that should be included based on settings */
export type HelmTemplateSet = {
  /** Base templates (always included) */
  readonly base: readonly string[];
  /** Conditional templates based on settings */
  readonly conditional: readonly string[];
};

/**
 * Determine which templates should be included in a server helm chart.
 */
export const getServerHelmTemplates = (
  helmSettings: HelmServerSettings,
  serverSettings: ServerSettings
): HelmTemplateSet => {
  const base = ['_helpers.tpl', 'configmap.yaml', 'servicemonitor.yaml'];

  // Determine deployment templates based on modes
  const availableModes =
    serverSettings.server_type === 'hybrid'
      ? serverSettings.modes ?? []
      : [serverSettings.server_type];

  const deployModes = helmSettings.deploy_modes ?? availableModes;

  const deployTemplates: readonly string[] =
    deployModes.length > 1
      ? [
          ...(deployModes.includes('api') ? ['deployment-api.yaml'] : []),
          ...(deployModes.includes('worker') ? ['deployment-worker.yaml'] : []),
          ...(deployModes.includes('cron') ? ['cronjob.yaml'] : []),
        ]
      : deployModes.length === 1
        ? deployModes[0] === 'cron'
          ? ['cronjob.yaml']
          : ['deployment.yaml']
        : [];

  // Service only if deploying api mode and server provides contracts
  const serviceTemplates: readonly string[] =
    deployModes.includes('api') &&
    (serverSettings.provides_contracts ?? []).length > 0
      ? ['service.yaml']
      : [];

  // Ingress from helm settings
  const ingressTemplates: readonly string[] = helmSettings.ingress
    ? ['ingress.yaml']
    : [];

  const conditional = [...deployTemplates, ...serviceTemplates, ...ingressTemplates];

  return { base, conditional };
};

/**
 * Determine which templates should be included in a webapp helm chart.
 */
export const getWebappHelmTemplates = (
  helmSettings: HelmSettings & { deploy_type: 'webapp' }
): HelmTemplateSet => {
  const base = ['_helpers.tpl', 'deployment.yaml', 'service.yaml', 'configmap.yaml'];

  const conditional: readonly string[] = helmSettings.ingress
    ? ['ingress.yaml']
    : [];

  return { base, conditional };
};

/**
 * Get the template set for a helm component.
 */
export const getHelmTemplates = (
  helmComponent: HelmComponent,
  allComponents: readonly Component[]
): HelmTemplateSet | { error: string } => {
  const settings = helmComponent.settings;

  if (isHelmServerSettings(settings)) {
    // Find the server component
    const server = allComponents.find(
      (c) => isServerComponent(c) && c.name === settings.deploys
    );

    if (!server || !isServerComponent(server)) {
      return {
        error: `Server component "${settings.deploys}" not found`,
      };
    }

    return getServerHelmTemplates(settings, server.settings);
  } else {
    return getWebappHelmTemplates(settings);
  }
};

/**
 * Generate values.yaml content for a server helm chart.
 */
export const generateServerHelmValues = (
  chartName: string,
  helmSettings: HelmServerSettings,
  serverSettings: ServerSettings
): Readonly<Record<string, unknown>> => {
  const baseValues: Readonly<Record<string, unknown>> = {
    nodeEnv: 'development',
    image: {
      repository: chartName,
      tag: 'latest',
      pullPolicy: 'IfNotPresent',
    },
    observability: {
      metrics: {
        enabled: true,
        port: 9090,
        serviceMonitor: {
          enabled: false,
          interval: '30s',
        },
      },
    },
    livenessProbe: {
      httpGet: {
        path: '/health/live',
        port: 9090,
      },
      initialDelaySeconds: 5,
      periodSeconds: 10,
    },
    readinessProbe: {
      httpGet: {
        path: '/health/ready',
        port: 9090,
      },
      initialDelaySeconds: 5,
      periodSeconds: 10,
    },
    config: {},
  };

  // Determine deployment modes
  const availableModes =
    serverSettings.server_type === 'hybrid'
      ? serverSettings.modes ?? []
      : [serverSettings.server_type];

  const deployModes = helmSettings.deploy_modes ?? availableModes;

  const modeValues: Readonly<Record<string, unknown>> =
    deployModes.length > 1
      ? // Hybrid mode - separate config per mode
        deployModes.reduce<Readonly<Record<string, unknown>>>(
          (acc, mode) => ({
            ...acc,
            [mode]: {
              enabled: true,
              replicaCount: 1,
              resources: {
                limits: { cpu: '500m', memory: '512Mi' },
                requests: { cpu: '100m', memory: '128Mi' },
              },
            },
          }),
          {}
        )
      : // Single mode
        {
          replicaCount: 1,
          resources: {
            limits: { cpu: '500m', memory: '512Mi' },
            requests: { cpu: '100m', memory: '128Mi' },
          },
        };

  // Service config if provides contracts
  const serviceValues: Readonly<Record<string, unknown>> =
    deployModes.includes('api') &&
    (serverSettings.provides_contracts ?? []).length > 0
      ? {
          service: {
            type: 'ClusterIP',
            port: 3000,
          },
        }
      : {};

  // Ingress config
  const ingressValues: Readonly<Record<string, unknown>> = helmSettings.ingress
    ? {
        ingress: {
          enabled: true,
          className: 'nginx',
          hosts: [
            {
              host: `${chartName}.example.com`,
              paths: [{ path: '/', pathType: 'Prefix' }],
            },
          ],
          tls: [],
        },
      }
    : {};

  return { ...baseValues, ...modeValues, ...serviceValues, ...ingressValues };
};

/**
 * Generate values.yaml content for a webapp helm chart.
 */
export const generateWebappHelmValues = (
  chartName: string,
  helmSettings: HelmSettings & { deploy_type: 'webapp' }
): Readonly<Record<string, unknown>> => {
  const baseValues: Readonly<Record<string, unknown>> = {
    nodeEnv: 'development',
    replicaCount: 1,
    image: {
      repository: 'nginx',
      tag: 'alpine',
      pullPolicy: 'IfNotPresent',
    },
    assets: {
      type: helmSettings.assets ?? 'bundled',
      path: '/usr/share/nginx/html',
    },
    service: {
      type: 'ClusterIP',
      port: 80,
    },
    resources: {
      limits: { cpu: '200m', memory: '128Mi' },
      requests: { cpu: '50m', memory: '64Mi' },
    },
    livenessProbe: {
      httpGet: {
        path: '/',
        port: 'http',
      },
      initialDelaySeconds: 5,
      periodSeconds: 10,
    },
    readinessProbe: {
      httpGet: {
        path: '/',
        port: 'http',
      },
      initialDelaySeconds: 5,
      periodSeconds: 10,
    },
    config: {},
  };

  // Ingress config
  const ingressValues: Readonly<Record<string, unknown>> = helmSettings.ingress
    ? {
        ingress: {
          enabled: true,
          className: 'nginx',
          hosts: [
            {
              host: `${chartName}.example.com`,
              paths: [{ path: '/', pathType: 'Prefix' }],
            },
          ],
          tls: [],
        },
      }
    : {};

  return { ...baseValues, ...ingressValues };
};

/**
 * Check if umbrella chart should be created/updated.
 */
export const shouldHaveUmbrellaChart = (
  components: readonly Component[]
): boolean => {
  const helmComponents = components.filter(isHelmComponent);
  return helmComponents.length >= 2;
};

/**
 * Generate umbrella chart dependencies.
 */
export const generateUmbrellaChartDependencies = (
  components: readonly Component[]
): readonly { name: string; version: string; repository: string }[] => {
  const helmComponents = components.filter(isHelmComponent);

  return helmComponents.map((c) => ({
    name: c.name,
    version: '0.1.0',
    repository: `file://../${c.name}`,
  }));
};
