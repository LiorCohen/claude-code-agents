/**
 * Settings validation functions.
 *
 * Validates component settings and cross-references between components.
 */

import type {
  Component,
  ServerSettings,
  HelmSettings,
  SettingsFile,
  ServerMode,
} from '../types/settings';
import {
  isServerComponent,
  isWebappComponent,
  isHelmComponent,
  isDatabaseComponent,
  isContractComponent,
  isHelmServerSettings,
} from '../types/settings';

/** Validation error */
export interface SettingsValidationError {
  readonly component?: string;
  readonly field?: string;
  readonly message: string;
}

/** Validation result */
export interface SettingsValidationResult {
  readonly valid: boolean;
  readonly errors: readonly SettingsValidationError[];
  readonly warnings: readonly SettingsValidationError[];
}

/**
 * Validate hybrid server has valid modes.
 */
const validateHybridServer = (
  name: string,
  settings: ServerSettings
): readonly SettingsValidationError[] => {
  const errors: SettingsValidationError[] = [];

  if (settings.server_type === 'hybrid') {
    if (!settings.modes || settings.modes.length < 2) {
      errors.push({
        component: name,
        field: 'modes',
        message:
          'Hybrid server requires at least 2 modes (e.g., ["api", "worker"])',
      });
    }
  } else {
    // Non-hybrid should not have modes
    if (settings.modes && settings.modes.length > 0) {
      errors.push({
        component: name,
        field: 'modes',
        message: `Non-hybrid server (${settings.server_type}) should not have modes array. Remove modes or change server_type to "hybrid".`,
      });
    }
  }

  return errors;
};

/**
 * Validate component references exist.
 */
const validateReferences = (
  components: readonly Component[]
): readonly SettingsValidationError[] => {
  const errors: SettingsValidationError[] = [];

  // Build lookup maps
  const databaseNames = new Set(
    components.filter(isDatabaseComponent).map((c) => c.name)
  );
  const contractNames = new Set(
    components.filter(isContractComponent).map((c) => c.name)
  );
  const serverNames = new Set(
    components.filter(isServerComponent).map((c) => c.name)
  );
  const webappNames = new Set(
    components.filter(isWebappComponent).map((c) => c.name)
  );
  const serverSettings = new Map(
    components.filter(isServerComponent).map((c) => [c.name, c.settings])
  );
  const webappSettings = new Map(
    components.filter(isWebappComponent).map((c) => [c.name, c.settings])
  );

  // Validate server references
  for (const component of components.filter(isServerComponent)) {
    const { name, settings } = component;

    // Check database references
    for (const db of settings.databases ?? []) {
      if (!databaseNames.has(db)) {
        errors.push({
          component: name,
          field: 'databases',
          message: `References non-existent database component: "${db}"`,
        });
      }
    }

    // Check provides_contracts references
    for (const contract of settings.provides_contracts ?? []) {
      if (!contractNames.has(contract)) {
        errors.push({
          component: name,
          field: 'provides_contracts',
          message: `References non-existent contract component: "${contract}"`,
        });
      }
    }

    // Check consumes_contracts references
    for (const contract of settings.consumes_contracts ?? []) {
      if (!contractNames.has(contract)) {
        errors.push({
          component: name,
          field: 'consumes_contracts',
          message: `References non-existent contract component: "${contract}"`,
        });
      }
    }
  }

  // Validate webapp references
  for (const component of components.filter(isWebappComponent)) {
    const { name, settings } = component;

    // Check contracts references
    for (const contract of settings.contracts ?? []) {
      if (!contractNames.has(contract)) {
        errors.push({
          component: name,
          field: 'contracts',
          message: `References non-existent contract component: "${contract}"`,
        });
      }
    }
  }

  // Validate helm chart references
  for (const component of components.filter(isHelmComponent)) {
    const { name, settings } = component;

    if (isHelmServerSettings(settings)) {
      // Check deploys references a server
      if (!serverNames.has(settings.deploys)) {
        errors.push({
          component: name,
          field: 'deploys',
          message: `References non-existent server component: "${settings.deploys}"`,
        });
      } else {
        // Check the server has helm: true
        const server = serverSettings.get(settings.deploys);
        if (server && !server.helm) {
          errors.push({
            component: name,
            field: 'deploys',
            message: `Cannot deploy server "${settings.deploys}" which has helm: false. Set helm: true on the server to enable deployment.`,
          });
        }

        // Check deploy_modes is a subset of server's modes
        if (settings.deploy_modes && server) {
          const availableModes: readonly ServerMode[] =
            server.server_type === 'hybrid'
              ? server.modes ?? []
              : [server.server_type as ServerMode];

          for (const mode of settings.deploy_modes) {
            if (!availableModes.includes(mode)) {
              errors.push({
                component: name,
                field: 'deploy_modes',
                message: `Mode "${mode}" is not available on server "${settings.deploys}". Available modes: [${availableModes.join(', ')}]`,
              });
            }
          }
        }
      }
    } else {
      // Webapp deployment
      if (!webappNames.has(settings.deploys)) {
        errors.push({
          component: name,
          field: 'deploys',
          message: `References non-existent webapp component: "${settings.deploys}"`,
        });
      } else {
        // Check the webapp has helm: true
        const webapp = webappSettings.get(settings.deploys);
        if (webapp && !webapp.helm) {
          errors.push({
            component: name,
            field: 'deploys',
            message: `Cannot deploy webapp "${settings.deploys}" which has helm: false. Set helm: true on the webapp to enable deployment.`,
          });
        }
      }
    }
  }

  return errors;
};

/**
 * Generate warnings for common issues.
 */
const generateWarnings = (
  components: readonly Component[]
): readonly SettingsValidationError[] => {
  const warnings: SettingsValidationError[] = [];

  // Get all components that have helm: true
  const serversWithHelm = components
    .filter(isServerComponent)
    .filter((c) => c.settings.helm);
  const webappsWithHelm = components
    .filter(isWebappComponent)
    .filter((c) => c.settings.helm);

  // Get all helm charts
  const helmCharts = components.filter(isHelmComponent);
  const deployedServers = new Set(
    helmCharts
      .filter((c) => isHelmServerSettings(c.settings))
      .map((c) => (c.settings as HelmSettings & { deploys: string }).deploys)
  );
  const deployedWebapps = new Set(
    helmCharts
      .filter((c) => !isHelmServerSettings(c.settings))
      .map((c) => (c.settings as HelmSettings & { deploys: string }).deploys)
  );

  // Warn about servers with helm: true but no helm chart
  for (const server of serversWithHelm) {
    if (!deployedServers.has(server.name)) {
      warnings.push({
        component: server.name,
        message: `Server has helm: true but no helm chart deploys it. Consider adding a helm chart or setting helm: false.`,
      });
    }
  }

  // Warn about webapps with helm: true but no helm chart
  for (const webapp of webappsWithHelm) {
    if (!deployedWebapps.has(webapp.name)) {
      warnings.push({
        component: webapp.name,
        message: `Webapp has helm: true but no helm chart deploys it. Consider adding a helm chart or setting helm: false.`,
      });
    }
  }

  return warnings;
};

/**
 * Validate naming conventions.
 */
const validateNaming = (
  components: readonly Component[]
): readonly SettingsValidationError[] => {
  const errors: SettingsValidationError[] = [];

  for (const component of components) {
    const { name, type } = component;

    // Config must be named "config"
    if (type === 'config' && name !== 'config') {
      errors.push({
        component: name,
        message: `Config component must be named "config", not "${name}"`,
      });
    }

    // Names should be multi-word (hyphenated) except config
    if (type !== 'config' && !name.includes('-')) {
      // This is a warning, not an error
      // Single-word names are allowed but discouraged
    }

    // Validate name pattern
    const namePattern = /^[a-z][a-z0-9-]*[a-z0-9]$/;
    if (name.length > 1 && !namePattern.test(name)) {
      errors.push({
        component: name,
        message: `Invalid name format. Names must be lowercase, start with a letter, and use hyphens only (not underscores).`,
      });
    }
  }

  // Check for duplicate names within same type
  const namesByType = new Map<string, string[]>();
  for (const component of components) {
    const existing = namesByType.get(component.type) ?? [];
    if (existing.includes(component.name)) {
      errors.push({
        component: component.name,
        message: `Duplicate ${component.type} component name: "${component.name}"`,
      });
    }
    namesByType.set(component.type, [...existing, component.name]);
  }

  return errors;
};

/**
 * Validate that config component exists.
 */
const validateConfigExists = (
  components: readonly Component[]
): readonly SettingsValidationError[] => {
  const hasConfig = components.some(
    (c) => c.type === 'config' && c.name === 'config'
  );

  if (!hasConfig) {
    return [
      {
        message:
          'Missing required "config" component. Every project must have a config component.',
      },
    ];
  }

  return [];
};

/**
 * Validate settings file.
 */
export const validateSettings = (
  settings: SettingsFile
): SettingsValidationResult => {
  const errors: SettingsValidationError[] = [];
  const warnings: SettingsValidationError[] = [];

  // Validate config component exists
  errors.push(...validateConfigExists(settings.components));

  // Validate naming
  errors.push(...validateNaming(settings.components));

  // Validate hybrid servers
  for (const component of settings.components.filter(isServerComponent)) {
    errors.push(...validateHybridServer(component.name, component.settings));
  }

  // Validate references
  errors.push(...validateReferences(settings.components));

  // Generate warnings
  warnings.push(...generateWarnings(settings.components));

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Format validation result for display.
 */
export const formatValidationResult = (
  result: SettingsValidationResult
): string => {
  const lines: string[] = [];

  if (result.errors.length > 0) {
    lines.push('Errors:');
    for (const error of result.errors) {
      const prefix = error.component
        ? `  [${error.component}${error.field ? `.${error.field}` : ''}]`
        : '  ';
      lines.push(`${prefix} ${error.message}`);
    }
  }

  if (result.warnings.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push('Warnings:');
    for (const warning of result.warnings) {
      const prefix = warning.component
        ? `  [${warning.component}${warning.field ? `.${warning.field}` : ''}]`
        : '  ';
      lines.push(`${prefix} ${warning.message}`);
    }
  }

  if (result.valid && result.warnings.length === 0) {
    lines.push('Settings validation passed.');
  }

  return lines.join('\n');
};
