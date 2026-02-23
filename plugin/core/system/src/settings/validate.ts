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
} from '@/types';
import {
  isServerComponent,
  isWebappComponent,
  isHelmComponent,
  isDatabaseComponent,
  isContractComponent,
  isHelmServerSettings,
} from '@/types';

/** Validation error */
export type SettingsValidationError = {
  readonly component?: string;
  readonly field?: string;
  readonly message: string;
};

/** Validation result */
export type SettingsValidationResult = {
  readonly valid: boolean;
  readonly errors: readonly SettingsValidationError[];
  readonly warnings: readonly SettingsValidationError[];
};

/**
 * Validate hybrid server has valid modes.
 */
const validateHybridServer = (
  name: string,
  settings: ServerSettings
): readonly SettingsValidationError[] => {
  if (settings.server_type === 'hybrid') {
    if (!settings.modes || settings.modes.length < 2) {
      return [
        {
          component: name,
          field: 'modes',
          message:
            'Hybrid server requires at least 2 modes (e.g., ["api", "worker"])',
        },
      ];
    }
    return [];
  }

  // Non-hybrid should not have modes
  if (settings.modes && settings.modes.length > 0) {
    return [
      {
        component: name,
        field: 'modes',
        message: `Non-hybrid server (${settings.server_type}) should not have modes array. Remove modes or change server_type to "hybrid".`,
      },
    ];
  }

  return [];
};

/**
 * Validate component references exist.
 */
const validateReferences = (
  components: readonly Component[]
): readonly SettingsValidationError[] => {
  // Build lookup maps
  const databaseNames: ReadonlySet<string> = new Set(
    components.filter(isDatabaseComponent).map((c) => c.name)
  );
  const contractNames: ReadonlySet<string> = new Set(
    components.filter(isContractComponent).map((c) => c.name)
  );
  const serverNames: ReadonlySet<string> = new Set(
    components.filter(isServerComponent).map((c) => c.name)
  );
  const webappNames: ReadonlySet<string> = new Set(
    components.filter(isWebappComponent).map((c) => c.name)
  );
  const serverSettings: ReadonlyMap<string, ServerSettings> = new Map(
    components.filter(isServerComponent).map((c) => [c.name, c.settings as ServerSettings])
  );
  const webappSettings: ReadonlyMap<string, { readonly helm?: boolean }> = new Map(
    components.filter(isWebappComponent).map((c) => [c.name, c.settings as { readonly helm?: boolean }])
  );

  // Validate server references
  const serverErrors = components
    .filter(isServerComponent)
    .flatMap((component) => {
      const { name, settings } = component;

      const dbErrors = (settings.databases ?? [])
        .filter((db) => !databaseNames.has(db))
        .map((db) => ({
          component: name,
          field: 'databases',
          message: `References non-existent database component: "${db}"`,
        }));

      const providesErrors = (settings.provides_contracts ?? [])
        .filter((contract) => !contractNames.has(contract))
        .map((contract) => ({
          component: name,
          field: 'provides_contracts',
          message: `References non-existent contract component: "${contract}"`,
        }));

      const consumesErrors = (settings.consumes_contracts ?? [])
        .filter((contract) => !contractNames.has(contract))
        .map((contract) => ({
          component: name,
          field: 'consumes_contracts',
          message: `References non-existent contract component: "${contract}"`,
        }));

      return [...dbErrors, ...providesErrors, ...consumesErrors];
    });

  // Validate webapp references
  const webappErrors = components
    .filter(isWebappComponent)
    .flatMap((component) => {
      const { name, settings } = component;

      return (settings.contracts ?? [])
        .filter((contract) => !contractNames.has(contract))
        .map((contract) => ({
          component: name,
          field: 'contracts',
          message: `References non-existent contract component: "${contract}"`,
        }));
    });

  // Validate helm chart references
  const helmErrors = components.filter(isHelmComponent).flatMap((component) => {
    const { name, settings } = component;

    if (isHelmServerSettings(settings)) {
      if (!serverNames.has(settings.deploys)) {
        return [
          {
            component: name,
            field: 'deploys',
            message: `References non-existent server component: "${settings.deploys}"`,
          },
        ];
      }

      const server = serverSettings.get(settings.deploys);
      const helmFlagErrors =
        server && !server.helm
          ? [
              {
                component: name,
                field: 'deploys',
                message: `Cannot deploy server "${settings.deploys}" which has helm: false. Set helm: true on the server to enable deployment.`,
              },
            ]
          : [];

      const modeErrors =
        settings.deploy_modes && server
          ? (() => {
              const availableModes: readonly ServerMode[] =
                server.server_type === 'hybrid'
                  ? server.modes ?? []
                  : [server.server_type as ServerMode];

              return settings.deploy_modes
                .filter((mode) => !availableModes.includes(mode))
                .map((mode) => ({
                  component: name,
                  field: 'deploy_modes',
                  message: `Mode "${mode}" is not available on server "${settings.deploys}". Available modes: [${availableModes.join(', ')}]`,
                }));
            })()
          : [];

      return [...helmFlagErrors, ...modeErrors];
    }

    // Webapp deployment
    if (!webappNames.has(settings.deploys)) {
      return [
        {
          component: name,
          field: 'deploys',
          message: `References non-existent webapp component: "${settings.deploys}"`,
        },
      ];
    }

    const webapp = webappSettings.get(settings.deploys);
    if (webapp && !webapp.helm) {
      return [
        {
          component: name,
          field: 'deploys',
          message: `Cannot deploy webapp "${settings.deploys}" which has helm: false. Set helm: true on the webapp to enable deployment.`,
        },
      ];
    }

    return [];
  });

  return [...serverErrors, ...webappErrors, ...helmErrors];
};

/**
 * Generate warnings for common issues.
 */
const generateWarnings = (
  components: readonly Component[]
): readonly SettingsValidationError[] => {
  // Get all components that have helm: true
  const serversWithHelm = components
    .filter(isServerComponent)
    .filter((c) => c.settings.helm);
  const webappsWithHelm = components
    .filter(isWebappComponent)
    .filter((c) => c.settings.helm);

  // Get all helm charts
  const helmCharts = components.filter(isHelmComponent);
  const deployedServers: ReadonlySet<string> = new Set(
    helmCharts
      .filter((c) => isHelmServerSettings(c.settings))
      .map((c) => (c.settings as HelmSettings & { deploys: string }).deploys)
  );
  const deployedWebapps: ReadonlySet<string> = new Set(
    helmCharts
      .filter((c) => !isHelmServerSettings(c.settings))
      .map((c) => (c.settings as HelmSettings & { deploys: string }).deploys)
  );

  // Warn about servers with helm: true but no helm chart
  const serverWarnings = serversWithHelm
    .filter((server) => !deployedServers.has(server.name))
    .map((server) => ({
      component: server.name,
      message: `Server has helm: true but no helm chart deploys it. Consider adding a helm chart or setting helm: false.`,
    }));

  // Warn about webapps with helm: true but no helm chart
  const webappWarnings = webappsWithHelm
    .filter((webapp) => !deployedWebapps.has(webapp.name))
    .map((webapp) => ({
      component: webapp.name,
      message: `Webapp has helm: true but no helm chart deploys it. Consider adding a helm chart or setting helm: false.`,
    }));

  return [...serverWarnings, ...webappWarnings];
};

/**
 * Validate naming conventions.
 */
const validateNaming = (
  components: readonly Component[]
): readonly SettingsValidationError[] => {
  const namePattern = /^[a-z][a-z0-9-]*[a-z0-9]$/;

  const basicErrors = components.flatMap((component) => {
    const { name, type } = component;

    const configError: readonly SettingsValidationError[] =
      type === 'config' && name !== 'config'
        ? [
            {
              component: name,
              message: `Config component must be named "config", not "${name}"`,
            },
          ]
        : [];

    const patternError: readonly SettingsValidationError[] =
      name.length > 1 && !namePattern.test(name)
        ? [
            {
              component: name,
              message: `Invalid name format. Names must be lowercase, start with a letter, and use hyphens only (not underscores).`,
            },
          ]
        : [];

    return [...configError, ...patternError];
  });

  // Check for duplicate names within same type
  const duplicateErrors = components.reduce<{
    readonly seen: ReadonlyMap<string, readonly string[]>;
    readonly errors: readonly SettingsValidationError[];
  }>(
    (acc, component) => {
      const existing = acc.seen.get(component.type) ?? [];
      const isDuplicate = existing.includes(component.name);
      const newErrors: readonly SettingsValidationError[] = isDuplicate
        ? [
            ...acc.errors,
            {
              component: component.name,
              message: `Duplicate ${component.type} component name: "${component.name}"`,
            },
          ]
        : acc.errors;
      const newSeen = new Map([
        ...acc.seen,
        [component.type, [...existing, component.name]],
      ]);
      return { seen: newSeen, errors: newErrors };
    },
    { seen: new Map<string, readonly string[]>(), errors: [] }
  ).errors;

  return [...basicErrors, ...duplicateErrors];
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
  const configErrors = validateConfigExists(settings.components);
  const namingErrors = validateNaming(settings.components);
  const hybridErrors = settings.components
    .filter(isServerComponent)
    .flatMap((component) =>
      validateHybridServer(component.name, component.settings)
    );
  const referenceErrors = validateReferences(settings.components);
  const warnings = generateWarnings(settings.components);

  const errors = [
    ...configErrors,
    ...namingErrors,
    ...hybridErrors,
    ...referenceErrors,
  ];

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
  const errorLines =
    result.errors.length > 0
      ? [
          'Errors:',
          ...result.errors.map((error) => {
            const prefix = error.component
              ? `  [${error.component}${error.field ? `.${error.field}` : ''}]`
              : '  ';
            return `${prefix} ${error.message}`;
          }),
        ]
      : [];

  const warningLines =
    result.warnings.length > 0
      ? [
          ...(errorLines.length > 0 ? [''] : []),
          'Warnings:',
          ...result.warnings.map((warning) => {
            const prefix = warning.component
              ? `  [${warning.component}${warning.field ? `.${warning.field}` : ''}]`
              : '  ';
            return `${prefix} ${warning.message}`;
          }),
        ]
      : [];

  const passedLine =
    result.valid && result.warnings.length === 0
      ? ['Settings validation passed.']
      : [];

  return [...errorLines, ...warningLines, ...passedLine].join('\n');
};
