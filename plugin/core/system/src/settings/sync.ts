/**
 * Settings sync functions.
 *
 * Core-level settings diff and preview utilities.
 * Tech-specific sync logic lives in each tech pack.
 */

import type { SettingsFile, ComponentManifest } from '@/types';

/** Component with name (reconstructed from map key) for diff display */
type NamedComponent = ComponentManifest & { readonly name: string };

/** Diff between old and new settings */
export type SettingsDiff = {
  readonly addedComponents: readonly NamedComponent[];
  readonly removedComponents: readonly NamedComponent[];
  readonly modifiedComponents: readonly {
    readonly name: string;
    readonly type: string;
    readonly changes: readonly string[];
  }[];
  readonly addedTechPacks: readonly string[];
  readonly removedTechPacks: readonly string[];
};

/**
 * Collect all components from the top-level components map, with name from key.
 */
const collectComponents = (settings: SettingsFile): readonly NamedComponent[] =>
  Object.entries(settings.components ?? {}).map(([name, c]) => ({ name, ...c }));

/**
 * Compare two settings files and return the differences.
 */
export const diffSettings = (
  oldSettings: SettingsFile,
  newSettings: SettingsFile
): SettingsDiff => {
  const oldComponents = collectComponents(oldSettings);
  const newComponents = collectComponents(newSettings);

  const oldByKey: ReadonlyMap<string, NamedComponent> = new Map(
    oldComponents.map((c) => [`${c.type}:${c.name}`, c])
  );
  const newByKey: ReadonlyMap<string, NamedComponent> = new Map(
    newComponents.map((c) => [`${c.type}:${c.name}`, c])
  );

  // Find added components
  const added = Array.from(newByKey)
    .filter(([key]) => !oldByKey.has(key))
    .map(([, comp]) => comp);

  // Find removed components
  const removed = Array.from(oldByKey)
    .filter(([key]) => !newByKey.has(key))
    .map(([, comp]) => comp);

  // Find modified components (directory changed)
  const modified = Array.from(newByKey)
    .filter(([key]) => oldByKey.has(key))
    .reduce<readonly { readonly name: string; readonly type: string; readonly changes: readonly string[] }[]>(
      (acc, [key, newComp]) => {
        const oldComp = oldByKey.get(key)!;
        const changes: string[] = [];
        if (oldComp.directory !== newComp.directory) {
          changes.push('directory');
        }
        return changes.length > 0
          ? [...acc, { name: newComp.name, type: newComp.type, changes }]
          : acc;
      },
      []
    );

  // Tech pack changes
  const oldTechPacks = new Set(Object.keys(oldSettings.techpacks ?? {}));
  const newTechPacks = new Set(Object.keys(newSettings.techpacks ?? {}));

  const addedTechPacks = [...newTechPacks].filter((ns) => !oldTechPacks.has(ns));
  const removedTechPacks = [...oldTechPacks].filter((ns) => !newTechPacks.has(ns));

  return {
    addedComponents: added,
    removedComponents: removed,
    modifiedComponents: modified,
    addedTechPacks,
    removedTechPacks,
  };
};

/**
 * Format sync preview for display.
 */
export const formatSyncPreview = (diff: SettingsDiff): string => {
  const lines: string[] = [];

  if (diff.addedTechPacks.length > 0) {
    lines.push(`Tech packs added: ${diff.addedTechPacks.join(', ')}`);
  }
  if (diff.removedTechPacks.length > 0) {
    lines.push(`Tech packs removed: ${diff.removedTechPacks.join(', ')}`);
  }
  if (diff.addedComponents.length > 0) {
    lines.push('Components added:');
    for (const c of diff.addedComponents) {
      lines.push(`  + ${c.type}: ${c.name} at ${c.directory}`);
    }
  }
  if (diff.removedComponents.length > 0) {
    lines.push('Components removed:');
    for (const c of diff.removedComponents) {
      lines.push(`  - ${c.type}: ${c.name} at ${c.directory}`);
    }
  }
  if (diff.modifiedComponents.length > 0) {
    lines.push('Components modified:');
    for (const c of diff.modifiedComponents) {
      lines.push(`  ~ ${c.type}: ${c.name} (${c.changes.join(', ')})`);
    }
  }

  return lines.length > 0 ? lines.join('\n') : 'No changes.';
};
