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
export interface SyncResult {
  readonly success: boolean;
  readonly filesCreated: readonly string[];
  readonly filesUpdated: readonly string[];
  readonly errors: readonly string[];
}

/** Diff between old and new settings */
export interface SettingsDiff {
  readonly addedComponents: readonly Component[];
  readonly removedComponents: readonly Component[];
  readonly modifiedComponents: readonly {
    readonly name: string;
    readonly type: string;
    readonly changes: readonly string[];
  }[];
}

/**
 * Compare two settings files and return the differences.
 */
export const diffSettings = (
  oldSettings: SettingsFile,
  newSettings: SettingsFile
): SettingsDiff => {
  const oldByKey = new Map(
    oldSettings.components.map((c) => [`${c.type}:${c.name}`, c])
  );
  const newByKey = new Map(
    newSettings.components.map((c) => [`${c.type}:${c.name}`, c])
  );

  const addedComponents: Component[] = [];
  const removedComponents: Component[] = [];
  const modifiedComponents: Array<{
    readonly name: string;
    readonly type: string;
    readonly changes: readonly string[];
  }> = [];

  // Find added and modified components
  for (const [key, newComp] of newByKey) {
    const oldComp = oldByKey.get(key);
    if (!oldComp) {
      addedComponents.push(newComp);
    } else {
      const changes = diffComponentSettings(oldComp, newComp);
      if (changes.length > 0) {
        modifiedComponents.push({
          name: newComp.name,
          type: newComp.type,
          changes: changes as readonly string[],
        });
      }
    }
  }

  // Find removed components
  for (const [key, oldComp] of oldByKey) {
    if (!newByKey.has(key)) {
      removedComponents.push(oldComp);
    }
  }

  return {
    addedComponents: addedComponents as readonly Component[],
    removedComponents: removedComponents as readonly Component[],
    modifiedComponents: modifiedComponents as SettingsDiff['modifiedComponents'],
  };
};

/**
 * Compare settings of two components and return changed fields.
 */
const diffComponentSettings = (
  oldComp: Component,
  newComp: Component
): readonly string[] => {
  const changes: string[] = [];
  const oldSettings = oldComp.settings as Record<string, unknown>;
  const newSettings = newComp.settings as Record<string, unknown>;

  // Get all keys from both
  const allKeys = new Set([
    ...Object.keys(oldSettings),
    ...Object.keys(newSettings),
  ]);

  for (const key of allKeys) {
    const oldVal = JSON.stringify(oldSettings[key]);
    const newVal = JSON.stringify(newSettings[key]);
    if (oldVal !== newVal) {
      changes.push(key);
    }
  }

  return changes;
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
  const typeDirMap: Record<ComponentType, string> = {
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
  const filesToCreate: string[] = [];
  const filesToUpdate: string[] = [];
  const descriptions: string[] = [];

  // Added components
  for (const comp of diff.addedComponents) {
    const dir = getComponentDir(comp);
    descriptions.push(`Add ${comp.type} component "${comp.name}" at ${dir}/`);

    if (comp.type === 'server') {
      filesToCreate.push(`${dir}/package.json`);
      filesToCreate.push(`${dir}/src/index.ts`);
      // Add config section
      filesToUpdate.push('components/config/envs/default/config.yaml');
    } else if (comp.type === 'webapp') {
      filesToCreate.push(`${dir}/package.json`);
      filesToCreate.push(`${dir}/src/main.tsx`);
      filesToUpdate.push('components/config/envs/default/config.yaml');
    } else if (comp.type === 'helm') {
      filesToCreate.push(`${dir}/Chart.yaml`);
      filesToCreate.push(`${dir}/values.yaml`);
      filesToCreate.push(`${dir}/templates/deployment.yaml`);
    }
  }

  // Modified components
  for (const mod of diff.modifiedComponents) {
    const comp = allComponents.find(
      (c) => c.type === mod.type && c.name === mod.name
    );
    if (!comp) continue;

    const dir = getComponentDir(comp);

    for (const change of mod.changes) {
      if (isServerComponent(comp)) {
        if (change === 'databases') {
          descriptions.push(
            `Update ${mod.name}: databases changed - will update DAL layer and config`
          );
          filesToUpdate.push('components/config/envs/default/config.yaml');
        }
        if (change === 'provides_contracts') {
          descriptions.push(
            `Update ${mod.name}: provides_contracts changed - will update routes`
          );
        }
        if (change === 'consumes_contracts') {
          descriptions.push(
            `Update ${mod.name}: consumes_contracts changed - will update API clients`
          );
          filesToUpdate.push('components/config/envs/default/config.yaml');
        }
      }

      if (isHelmComponent(comp)) {
        if (change === 'ingress') {
          const settings = comp.settings as HelmSettings;
          if (settings.ingress) {
            descriptions.push(
              `Update ${mod.name}: ingress enabled - will add ingress.yaml`
            );
            filesToCreate.push(`${dir}/templates/ingress.yaml`);
          } else {
            descriptions.push(
              `Update ${mod.name}: ingress disabled - ingress.yaml will be kept but disabled`
            );
          }
        }
      }
    }
  }

  return {
    description: descriptions.join('\n'),
    filesToCreate: [...new Set(filesToCreate)],
    filesToUpdate: [...new Set(filesToUpdate)],
  };
};

/**
 * Generate config section for a server component based on its settings.
 */
export const generateServerConfigSection = (
  name: string,
  settings: ServerSettings
): Record<string, unknown> => {
  const config: Record<string, unknown> = {
    probesPort: 9090,
    logLevel: 'info',
  };

  // Add port if provides contracts (API server)
  if ((settings.provides_contracts ?? []).length > 0) {
    config['port'] = 3000;
  }

  // Add queue config for worker
  if (
    settings.server_type === 'worker' ||
    (settings.server_type === 'hybrid' && settings.modes?.includes('worker'))
  ) {
    config['queue'] = {
      url: 'amqp://localhost:5672',
    };
  }

  // Add database sections
  if ((settings.databases ?? []).length > 0) {
    const databases: Record<string, unknown> = {};
    for (const db of settings.databases ?? []) {
      databases[db] = {
        host: 'localhost',
        port: 5432,
        name: name.replace(/-/g, '_'),
        ssl: false,
      };
    }
    config['databases'] = databases;
  }

  // Add API sections for consumed contracts
  if ((settings.consumes_contracts ?? []).length > 0) {
    const apis: Record<string, unknown> = {};
    for (const contract of settings.consumes_contracts ?? []) {
      apis[contract] = {
        base_url: `http://${contract}:3000`,
      };
    }
    config['apis'] = apis;
  }

  return config;
};

/**
 * Generate config section for a webapp component based on its settings.
 */
export const generateWebappConfigSection = (
  _name: string,
  settings: WebappSettings
): Record<string, unknown> => {
  const config: Record<string, unknown> = {};

  // Add API sections for consumed contracts
  if ((settings.contracts ?? []).length > 0) {
    const apis: Record<string, unknown> = {};
    for (const contract of settings.contracts ?? []) {
      apis[contract] = {
        base_url: `http://localhost:3000`,
      };
    }
    config['apis'] = apis;
  }

  return config;
};

/**
 * Format sync preview for display.
 */
export const formatSyncPreview = (preview: {
  readonly description: string;
  readonly filesToCreate: readonly string[];
  readonly filesToUpdate: readonly string[];
}): string => {
  const lines: string[] = [];

  if (preview.description) {
    lines.push('Changes:');
    lines.push(
      preview.description
        .split('\n')
        .map((l) => `  - ${l}`)
        .join('\n')
    );
    lines.push('');
  }

  if (preview.filesToCreate.length > 0) {
    lines.push('Files to create:');
    for (const file of preview.filesToCreate) {
      lines.push(`  + ${file}`);
    }
    lines.push('');
  }

  if (preview.filesToUpdate.length > 0) {
    lines.push('Files to update:');
    for (const file of preview.filesToUpdate) {
      lines.push(`  ~ ${file}`);
    }
  }

  return lines.join('\n');
};
