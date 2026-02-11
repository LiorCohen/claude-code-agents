/**
 * Settings sync functions.
 *
 * Internal functions for propagating settings changes to config, helm, etc.
 * These are called automatically by /sdd-settings after any setting modification.
 */

import type {
  Component,
  ComponentType,
  ServerSettings,
  WebappSettings,
  HelmSettings,
  SettingsFile,
} from '../types/settings';
import { isServerComponent, isHelmComponent } from '../types/settings';

/** Result of a sync operation */
export type SyncResult = {
  readonly success: boolean;
  readonly filesCreated: readonly string[];
  readonly filesUpdated: readonly string[];
  readonly errors: readonly string[];
};

/** Diff between old and new settings */
export type SettingsDiff = {
  readonly addedComponents: readonly Component[];
  readonly removedComponents: readonly Component[];
  readonly modifiedComponents: readonly {
    readonly name: string;
    readonly type: string;
    readonly changes: readonly string[];
  }[];
};

/**
 * Compare two settings files and return the differences.
 */
export const diffSettings = (
  oldSettings: SettingsFile,
  newSettings: SettingsFile
): SettingsDiff => {
  const oldByKey: ReadonlyMap<string, Component> = new Map(
    oldSettings.components.map((c) => [`${c.type}:${c.name}`, c])
  );
  const newByKey: ReadonlyMap<string, Component> = new Map(
    newSettings.components.map((c) => [`${c.type}:${c.name}`, c])
  );

  // Find added and modified components
  const { added, modified } = Array.from(newByKey).reduce<{
    readonly added: readonly Component[];
    readonly modified: readonly {
      readonly name: string;
      readonly type: string;
      readonly changes: readonly string[];
    }[];
  }>(
    (acc, [key, newComp]) => {
      const oldComp = oldByKey.get(key);
      if (!oldComp) {
        return { ...acc, added: [...acc.added, newComp] };
      }
      const changes = diffComponentSettings(oldComp, newComp);
      if (changes.length > 0) {
        return {
          ...acc,
          modified: [
            ...acc.modified,
            {
              name: newComp.name,
              type: newComp.type,
              changes,
            },
          ],
        };
      }
      return acc;
    },
    { added: [], modified: [] }
  );

  // Find removed components
  const removed = Array.from(oldByKey)
    .filter(([key]) => !newByKey.has(key))
    .map(([, oldComp]) => oldComp);

  return {
    addedComponents: added,
    removedComponents: removed,
    modifiedComponents: modified,
  };
};

/**
 * Compare settings of two components and return changed fields.
 */
const diffComponentSettings = (
  oldComp: Component,
  newComp: Component
): readonly string[] => {
  const oldSettings = oldComp.settings as Readonly<Record<string, unknown>>;
  const newSettings = newComp.settings as Readonly<Record<string, unknown>>;

  // Get all keys from both
  const allKeys: ReadonlySet<string> = new Set([
    ...Object.keys(oldSettings),
    ...Object.keys(newSettings),
  ]);

  return Array.from(allKeys).filter((key) => {
    const oldVal = JSON.stringify(oldSettings[key]);
    const newVal = JSON.stringify(newSettings[key]);
    return oldVal !== newVal;
  });
};

/**
 * Generate the conventional path for a component based on current standards.
 * Used when creating new components.
 *
 * Current convention:
 * - components/{type-plural}/{name} for most types
 * - components/config for singleton config component
 *
 * Previous versions used flat structure: components/{name}
 */
export const generateComponentPath = (
  type: ComponentType,
  name: string
): string => {
  const typeDirMap: Readonly<Record<ComponentType, string>> = {
    server: 'servers',
    webapp: 'webapps',
    helm: 'helm_charts',
    testing: 'testing',
    database: 'databases',
    contract: 'contracts',
    config: 'config',
    cicd: 'cicd',
  };

  const typeDir = typeDirMap[type];

  // Config is a singleton at components/config/
  if (type === 'config') {
    return 'components/config';
  }

  return `components/${typeDir}/${name}`;
};

/**
 * Get the directory path for a component.
 * Uses the path from settings for backwards compatibility with flat structures.
 */
export const getComponentDir = (component: Component): string => {
  return component.path;
};

/**
 * Preview what changes would be made by a settings sync.
 * Does not modify any files.
 */
export const previewSync = (
  diff: SettingsDiff,
  allComponents: readonly Component[]
): {
  readonly description: string;
  readonly filesToCreate: readonly string[];
  readonly filesToUpdate: readonly string[];
} => {
  // Added components
  const addedResult = diff.addedComponents.reduce<{
    readonly filesToCreate: readonly string[];
    readonly filesToUpdate: readonly string[];
    readonly descriptions: readonly string[];
  }>(
    (acc, comp) => {
      const dir = getComponentDir(comp);
      const desc = `Add ${comp.type} component "${comp.name}" at ${dir}/`;

      if (comp.type === 'server') {
        return {
          descriptions: [...acc.descriptions, desc],
          filesToCreate: [
            ...acc.filesToCreate,
            `${dir}/package.json`,
            `${dir}/src/index.ts`,
          ],
          filesToUpdate: [
            ...acc.filesToUpdate,
            'components/config/envs/default/config.yaml',
          ],
        };
      }

      if (comp.type === 'webapp') {
        return {
          descriptions: [...acc.descriptions, desc],
          filesToCreate: [
            ...acc.filesToCreate,
            `${dir}/package.json`,
            `${dir}/src/main.tsx`,
          ],
          filesToUpdate: [
            ...acc.filesToUpdate,
            'components/config/envs/default/config.yaml',
          ],
        };
      }

      if (comp.type === 'helm') {
        return {
          descriptions: [...acc.descriptions, desc],
          filesToCreate: [
            ...acc.filesToCreate,
            `${dir}/Chart.yaml`,
            `${dir}/values.yaml`,
            `${dir}/templates/deployment.yaml`,
          ],
          filesToUpdate: acc.filesToUpdate,
        };
      }

      return { ...acc, descriptions: [...acc.descriptions, desc] };
    },
    { filesToCreate: [], filesToUpdate: [], descriptions: [] }
  );

  // Modified components
  const modifiedResult = diff.modifiedComponents.reduce<{
    readonly filesToCreate: readonly string[];
    readonly filesToUpdate: readonly string[];
    readonly descriptions: readonly string[];
  }>(
    (acc, mod) => {
      const comp = allComponents.find(
        (c) => c.type === mod.type && c.name === mod.name
      );
      if (!comp) return acc;

      const dir = getComponentDir(comp);

      return mod.changes.reduce<{
        readonly filesToCreate: readonly string[];
        readonly filesToUpdate: readonly string[];
        readonly descriptions: readonly string[];
      }>((innerAcc, change) => {
        if (isServerComponent(comp)) {
          if (change === 'databases') {
            return {
              ...innerAcc,
              descriptions: [
                ...innerAcc.descriptions,
                `Update ${mod.name}: databases changed - will update DAL layer and config`,
              ],
              filesToUpdate: [
                ...innerAcc.filesToUpdate,
                'components/config/envs/default/config.yaml',
              ],
            };
          }
          if (change === 'provides_contracts') {
            return {
              ...innerAcc,
              descriptions: [
                ...innerAcc.descriptions,
                `Update ${mod.name}: provides_contracts changed - will update routes`,
              ],
            };
          }
          if (change === 'consumes_contracts') {
            return {
              ...innerAcc,
              descriptions: [
                ...innerAcc.descriptions,
                `Update ${mod.name}: consumes_contracts changed - will update API clients`,
              ],
              filesToUpdate: [
                ...innerAcc.filesToUpdate,
                'components/config/envs/default/config.yaml',
              ],
            };
          }
        }

        if (isHelmComponent(comp)) {
          if (change === 'ingress') {
            const helmSettings = comp.settings as HelmSettings;
            if (helmSettings.ingress) {
              return {
                ...innerAcc,
                descriptions: [
                  ...innerAcc.descriptions,
                  `Update ${mod.name}: ingress enabled - will add ingress.yaml`,
                ],
                filesToCreate: [
                  ...innerAcc.filesToCreate,
                  `${dir}/templates/ingress.yaml`,
                ],
              };
            }
            return {
              ...innerAcc,
              descriptions: [
                ...innerAcc.descriptions,
                `Update ${mod.name}: ingress disabled - ingress.yaml will be kept but disabled`,
              ],
            };
          }
        }

        return innerAcc;
      }, acc);
    },
    {
      filesToCreate: addedResult.filesToCreate,
      filesToUpdate: addedResult.filesToUpdate,
      descriptions: addedResult.descriptions,
    }
  );

  return {
    description: modifiedResult.descriptions.join('\n'),
    filesToCreate: [...new Set(modifiedResult.filesToCreate)],
    filesToUpdate: [...new Set(modifiedResult.filesToUpdate)],
  };
};

/**
 * Generate config section for a server component based on its settings.
 */
export const generateServerConfigSection = (
  name: string,
  settings: ServerSettings
): Readonly<Record<string, unknown>> => {
  const baseConfig: Readonly<Record<string, unknown>> = {
    probesPort: 9090,
    logLevel: 'info',
  };

  // Add port if provides contracts (API server)
  const portConfig: Readonly<Record<string, unknown>> =
    (settings.provides_contracts ?? []).length > 0
      ? { port: 3000 }
      : {};

  // Add queue config for worker
  const queueConfig: Readonly<Record<string, unknown>> =
    settings.server_type === 'worker' ||
    (settings.server_type === 'hybrid' && settings.modes?.includes('worker'))
      ? { queue: { url: 'amqp://localhost:5672' } }
      : {};

  // Add database sections
  const databasesConfig: Readonly<Record<string, unknown>> =
    (settings.databases ?? []).length > 0
      ? {
          databases: (settings.databases ?? []).reduce<Readonly<Record<string, unknown>>>(
            (acc, db) => ({
              ...acc,
              [db]: {
                host: 'localhost',
                port: 5432,
                name: name.replace(/-/g, '_'),
                ssl: false,
              },
            }),
            {}
          ),
        }
      : {};

  // Add API sections for consumed contracts
  const apisConfig: Readonly<Record<string, unknown>> =
    (settings.consumes_contracts ?? []).length > 0
      ? {
          apis: (settings.consumes_contracts ?? []).reduce<Readonly<Record<string, unknown>>>(
            (acc, contract) => ({
              ...acc,
              [contract]: {
                base_url: `http://${contract}:3000`,
              },
            }),
            {}
          ),
        }
      : {};

  return { ...baseConfig, ...portConfig, ...queueConfig, ...databasesConfig, ...apisConfig };
};

/**
 * Generate config section for a webapp component based on its settings.
 */
export const generateWebappConfigSection = (
  _name: string,
  settings: WebappSettings
): Readonly<Record<string, unknown>> => {
  // Add API sections for consumed contracts
  const apisConfig: Readonly<Record<string, unknown>> =
    (settings.contracts ?? []).length > 0
      ? {
          apis: (settings.contracts ?? []).reduce<Readonly<Record<string, unknown>>>(
            (acc, contract) => ({
              ...acc,
              [contract]: {
                base_url: `http://localhost:3000`,
              },
            }),
            {}
          ),
        }
      : {};

  return { ...apisConfig };
};

/**
 * Format sync preview for display.
 */
export const formatSyncPreview = (preview: {
  readonly description: string;
  readonly filesToCreate: readonly string[];
  readonly filesToUpdate: readonly string[];
}): string => {
  const changeLines: readonly string[] = preview.description
    ? [
        'Changes:',
        preview.description
          .split('\n')
          .map((l) => `  - ${l}`)
          .join('\n'),
        '',
      ]
    : [];

  const createLines: readonly string[] =
    preview.filesToCreate.length > 0
      ? [
          'Files to create:',
          ...preview.filesToCreate.map((file) => `  + ${file}`),
          '',
        ]
      : [];

  const updateLines: readonly string[] =
    preview.filesToUpdate.length > 0
      ? [
          'Files to update:',
          ...preview.filesToUpdate.map((file) => `  ~ ${file}`),
        ]
      : [];

  return [...changeLines, ...createLines, ...updateLines].join('\n');
};
