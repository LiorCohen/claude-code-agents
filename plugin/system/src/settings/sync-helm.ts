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
export interface HelmTemplateSet {
  /** Base templates (always included) */
  readonly base: readonly string[];
  /** Conditional templates based on settings */
  readonly conditional: readonly string[];
}

/**
 * Determine which templates should be included in a server helm chart.
 */
export const getServerHelmTemplates = (
  helmSettings: HelmServerSettings,
  serverSettings: ServerSettings
): HelmTemplateSet => {
  const base = ['_helpers.tpl', 'configmap.yaml', 'servicemonitor.yaml'];
  const conditional: string[] = [];

  // Determine deployment templates based on modes
  const availableModes =
    serverSettings.server_type === 'hybrid'
      ? serverSettings.modes ?? []
      : [serverSettings.server_type];

  const deployModes = helmSettings.deploy_modes ?? availableModes;

  if (deployModes.length > 1) {
    // Multiple modes = separate deployments per mode
    if (deployModes.includes('api')) {
      conditional.push('deployment-api.yaml');
    }
    if (deployModes.includes('worker')) {
      conditional.push('deployment-worker.yaml');
    }
    if (deployModes.includes('cron')) {
      conditional.push('cronjob.yaml');
    }
  } else if (deployModes.length === 1) {
    if (deployModes[0] === 'cron') {
      conditional.push('cronjob.yaml');
    } else {
      conditional.push('deployment.yaml');
    }
  }

  // Service only if deploying api mode and server provides contracts
  if (
    deployModes.includes('api') &&
    (serverSettings.provides_contracts ?? []).length > 0
  ) {
    conditional.push('service.yaml');
  }

  // Ingress from helm settings
  if (helmSettings.ingress) {
    conditional.push('ingress.yaml');
  }

  return { base, conditional };
};

/**
 * Determine which templates should be included in a webapp helm chart.
 */
export const getWebappHelmTemplates = (
  helmSettings: HelmSettings & { deploy_type: 'webapp' }
): HelmTemplateSet => {
  const base = ['_helpers.tpl', 'deployment.yaml', 'service.yaml', 'configmap.yaml'];
  const conditional: string[] = [];

  if (helmSettings.ingress) {
    conditional.push('ingress.yaml');
  }

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
): Record<string, unknown> => {
  const values: Record<string, unknown> = {
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

  if (deployModes.length > 1) {
    // Hybrid mode - separate config per mode
    for (const mode of deployModes) {
      values[mode] = {
        enabled: true,
        replicaCount: 1,
        resources: {
          limits: { cpu: '500m', memory: '512Mi' },
          requests: { cpu: '100m', memory: '128Mi' },
        },
      };
    }
  } else {
    // Single mode
    values['replicaCount'] = 1;
    values['resources'] = {
      limits: { cpu: '500m', memory: '512Mi' },
      requests: { cpu: '100m', memory: '128Mi' },
    };
  }

  // Service config if provides contracts
  if (
    deployModes.includes('api') &&
    (serverSettings.provides_contracts ?? []).length > 0
  ) {
    values['service'] = {
      type: 'ClusterIP',
      port: 3000,
    };
  }

  // Ingress config
  if (helmSettings.ingress) {
    values['ingress'] = {
      enabled: true,
      className: 'nginx',
      hosts: [
        {
          host: `${chartName}.example.com`,
          paths: [{ path: '/', pathType: 'Prefix' }],
        },
      ],
      tls: [],
    };
  }

  return values;
};

/**
 * Generate values.yaml content for a webapp helm chart.
 */
export const generateWebappHelmValues = (
  chartName: string,
  helmSettings: HelmSettings & { deploy_type: 'webapp' }
): Record<string, unknown> => {
  const values: Record<string, unknown> = {
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
  if (helmSettings.ingress) {
    values['ingress'] = {
      enabled: true,
      className: 'nginx',
      hosts: [
        {
          host: `${chartName}.example.com`,
          paths: [{ path: '/', pathType: 'Prefix' }],
        },
      ],
      tls: [],
    };
  }

  return values;
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
