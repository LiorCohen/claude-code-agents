/**
 * Settings reconciliation for plugin version upgrades.
 *
 * Transforms older sdd-settings formats into the latest schema.
 * The output always conforms to the current schema — there is no
 * backward-compatible format accepted after reconciliation.
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { SettingsFile, ComponentType, LogLevel } from '../types/settings';
import { generateComponentPath } from './sync';
import { validateSettings } from './validate';

/** A single change made during reconciliation */
export interface ReconciliationChange {
  readonly type: 'migrated' | 'added' | 'removed';
  readonly field: string;
  readonly detail: string;
}

/** A warning about filesystem mismatches */
export interface ReconciliationWarning {
  readonly component?: string;
  readonly message: string;
}

/** Result of reconciliation */
export interface ReconciliationResult {
  readonly settings: SettingsFile;
  readonly changes: readonly ReconciliationChange[];
  readonly warnings: readonly ReconciliationWarning[];
  readonly valid: boolean;
  readonly validationErrors: readonly string[];
}

/** Format a Date as "YYYY-MM-DD HH:MM:SSZ" UTC string */
const formatUtcDatetime = (date: Date): string => {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}Z`;
};

/** Check if a string is a date-only format (YYYY-MM-DD) */
const isDateOnly = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value);

/** Convert date-only to full UTC datetime */
const dateOnlyToUtc = (dateStr: string): string => `${dateStr} 00:00:00Z`;

/**
 * Reconcile raw parsed YAML into a valid SettingsFile conforming to the latest schema.
 *
 * @param raw - Raw parsed YAML (unknown shape from YAML.parse)
 * @param currentPluginVersion - The current plugin version string
 * @param projectRoot - Absolute path to project root (for filesystem checks)
 * @param now - Optional Date for testing (defaults to current time)
 */
export const reconcileSettings = (
  raw: unknown,
  currentPluginVersion: string,
  projectRoot: string,
  now: Date = new Date(),
): ReconciliationResult => {
  const changes: ReconciliationChange[] = [];
  const warnings: ReconciliationWarning[] = [];

  const rawObj = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const rawSdd = (typeof rawObj.sdd === 'object' && rawObj.sdd !== null ? rawObj.sdd : {}) as Record<string, unknown>;
  const rawProject = (typeof rawObj.project === 'object' && rawObj.project !== null ? rawObj.project : {}) as Record<string, unknown>;
  const rawComponents = Array.isArray(rawObj.components) ? rawObj.components as readonly Record<string, unknown>[] : [];
  const rawSystem = typeof rawObj.system === 'object' && rawObj.system !== null ? rawObj.system as Record<string, unknown> : undefined;

  const nowUtc = formatUtcDatetime(now);

  // =========================================================================
  // 1. Migrate sdd metadata fields
  // =========================================================================

  // Handle plugin_version → split fields
  const legacyPluginVersion = rawSdd.plugin_version as string | undefined;
  const existingInitVersion = rawSdd.initialized_by_plugin_version as string | undefined;
  const existingUpdateVersion = rawSdd.updated_by_plugin_version as string | undefined;

  let initializedByPluginVersion: string;
  if (existingInitVersion) {
    initializedByPluginVersion = existingInitVersion;
  } else if (legacyPluginVersion) {
    initializedByPluginVersion = legacyPluginVersion;
    changes.push({
      type: 'migrated',
      field: 'sdd.initialized_by_plugin_version',
      detail: `Migrated from plugin_version: "${legacyPluginVersion}"`,
    });
  } else {
    initializedByPluginVersion = currentPluginVersion;
    changes.push({
      type: 'added',
      field: 'sdd.initialized_by_plugin_version',
      detail: `Set to current plugin version: "${currentPluginVersion}"`,
    });
  }

  const updatedByPluginVersion = currentPluginVersion;
  if (!existingUpdateVersion || existingUpdateVersion !== currentPluginVersion) {
    changes.push({
      type: 'migrated',
      field: 'sdd.updated_by_plugin_version',
      detail: `Set to current plugin version: "${currentPluginVersion}"`,
    });
  }

  // Handle initialized_at
  const rawInitializedAt = rawSdd.initialized_at as string | undefined;
  let initializedAt: string;
  if (rawInitializedAt && isDateOnly(rawInitializedAt)) {
    initializedAt = dateOnlyToUtc(rawInitializedAt);
    changes.push({
      type: 'migrated',
      field: 'sdd.initialized_at',
      detail: `Converted date-only "${rawInitializedAt}" to UTC datetime "${initializedAt}"`,
    });
  } else if (rawInitializedAt) {
    initializedAt = rawInitializedAt;
  } else {
    initializedAt = nowUtc;
    changes.push({
      type: 'added',
      field: 'sdd.initialized_at',
      detail: `Set to current datetime: "${nowUtc}"`,
    });
  }

  // Handle last_updated → updated_at
  const rawLastUpdated = rawSdd.last_updated as string | undefined;
  const rawUpdatedAt = rawSdd.updated_at as string | undefined;
  let updatedAt: string;
  if (rawLastUpdated) {
    // Discard old value, set to now
    updatedAt = nowUtc;
    changes.push({
      type: 'migrated',
      field: 'sdd.updated_at',
      detail: `Renamed from last_updated, set to current datetime: "${nowUtc}"`,
    });
  } else if (rawUpdatedAt) {
    // Update to now during reconciliation
    updatedAt = nowUtc;
  } else {
    updatedAt = nowUtc;
    changes.push({
      type: 'added',
      field: 'sdd.updated_at',
      detail: `Set to current datetime: "${nowUtc}"`,
    });
  }

  // Track removed legacy fields
  if (legacyPluginVersion) {
    changes.push({
      type: 'removed',
      field: 'sdd.plugin_version',
      detail: 'Replaced by initialized_by_plugin_version and updated_by_plugin_version',
    });
  }
  if (rawLastUpdated) {
    changes.push({
      type: 'removed',
      field: 'sdd.last_updated',
      detail: 'Renamed to updated_at',
    });
  }

  // =========================================================================
  // 2. Remove deprecated project fields
  // =========================================================================

  const projectName = rawProject.name as string | undefined ?? 'unnamed-project';
  const projectDescription = rawProject.description as string | undefined;

  if (rawProject.domain !== undefined) {
    changes.push({
      type: 'removed',
      field: 'project.domain',
      detail: 'Deprecated — domain inference moved to sdd-change',
    });
  }
  if (rawProject.type !== undefined) {
    changes.push({
      type: 'removed',
      field: 'project.type',
      detail: 'Deprecated — project type no longer tracked in settings',
    });
  }

  // =========================================================================
  // 3. Reconcile components — add missing path fields
  // =========================================================================

  const reconciledComponents = rawComponents.map((rawComp) => {
    const compName = rawComp.name as string;
    const compType = rawComp.type as ComponentType;
    const compPath = rawComp.path as string | undefined;
    const compSettings = rawComp.settings as Record<string, unknown> | undefined;

    let path: string;
    if (compPath) {
      path = compPath;
    } else {
      // Try to infer from filesystem
      const flatPath = `components/${compName}`;
      const flatAbsolute = join(projectRoot, flatPath);

      if (existsSync(flatAbsolute) && statSync(flatAbsolute).isDirectory()) {
        path = flatPath;
        changes.push({
          type: 'added',
          field: `components[${compName}].path`,
          detail: `Inferred flat path from filesystem: "${flatPath}"`,
        });
      } else {
        path = generateComponentPath(compType, compName);
        changes.push({
          type: 'added',
          field: `components[${compName}].path`,
          detail: `Generated type-based path: "${path}"`,
        });
      }
    }

    return {
      name: compName,
      type: compType,
      path,
      settings: compSettings ?? {},
    };
  });

  // =========================================================================
  // 4. Add system section if missing
  // =========================================================================

  let system: SettingsFile['system'];
  if (rawSystem) {
    const rawLogging = typeof rawSystem.logging === 'object' && rawSystem.logging !== null
      ? rawSystem.logging as Record<string, unknown>
      : undefined;

    if (rawLogging) {
      const validLevels: readonly string[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
      const rawLevel = typeof rawLogging.level === 'string' && validLevels.includes(rawLogging.level)
        ? rawLogging.level as LogLevel
        : 'info' as LogLevel;
      system = {
        logging: {
          enabled: typeof rawLogging.enabled === 'boolean' ? rawLogging.enabled : true,
          level: rawLevel,
        },
      };
    } else {
      system = { logging: { enabled: true, level: 'info' } };
      changes.push({
        type: 'added',
        field: 'system.logging',
        detail: 'Added logging defaults: {enabled: true, level: "info"}',
      });
    }
  } else {
    system = { logging: { enabled: true, level: 'info' } };
    changes.push({
      type: 'added',
      field: 'system',
      detail: 'Added system section with logging defaults',
    });
  }

  // =========================================================================
  // 5. Build reconciled settings
  // =========================================================================

  const project: SettingsFile['project'] = projectDescription !== undefined
    ? { name: projectName, description: projectDescription }
    : { name: projectName };

  const settings: SettingsFile = {
    sdd: {
      initialized_by_plugin_version: initializedByPluginVersion,
      updated_by_plugin_version: updatedByPluginVersion,
      initialized_at: initializedAt,
      updated_at: updatedAt,
    },
    project,
    components: reconciledComponents as unknown as SettingsFile['components'],
    system,
  };

  // =========================================================================
  // 6. Directory structure mismatch detection
  // =========================================================================

  // Check component paths that don't exist on disk
  for (const comp of reconciledComponents) {
    const absolutePath = join(projectRoot, comp.path);
    if (!existsSync(absolutePath)) {
      warnings.push({
        component: comp.name,
        message: `Component path "${comp.path}" does not exist on disk`,
      });
    }
  }

  // Check for untracked component directories
  const componentsDir = join(projectRoot, 'components');
  if (existsSync(componentsDir) && statSync(componentsDir).isDirectory()) {
    const trackedPaths = new Set(reconciledComponents.map((c) => c.path));
    const topLevelDirs = readdirSync(componentsDir).filter((entry) => {
      const entryPath = join(componentsDir, entry);
      return statSync(entryPath).isDirectory();
    });

    for (const dirName of topLevelDirs) {
      // Check flat layout: components/{name}/
      const flatPath = `components/${dirName}`;
      if (!trackedPaths.has(flatPath)) {
        // Check type-based layout: components/{type-plural}/{name}/
        const subDirs = readdirSync(join(componentsDir, dirName)).filter((entry) => {
          const entryPath = join(componentsDir, dirName, entry);
          return statSync(entryPath).isDirectory();
        });

        for (const subDir of subDirs) {
          const typePath = `components/${dirName}/${subDir}`;
          if (!trackedPaths.has(typePath)) {
            warnings.push({
              message: `Directory "${typePath}" exists on disk but is not tracked in sdd-settings`,
            });
          }
        }

        // If no subdirs, the flat directory itself is untracked
        if (subDirs.length === 0 && !trackedPaths.has(flatPath)) {
          warnings.push({
            message: `Directory "${flatPath}" exists on disk but is not tracked in sdd-settings`,
          });
        }
      }
    }
  }

  // =========================================================================
  // 7. Validate reconciled result
  // =========================================================================

  const validation = validateSettings(settings);
  const validationErrors = validation.errors.map((e) => {
    const prefix = e.component
      ? `[${e.component}${e.field ? `.${e.field}` : ''}]`
      : '';
    return `${prefix} ${e.message}`.trim();
  });

  return {
    settings,
    changes,
    warnings,
    valid: validation.valid,
    validationErrors,
  };
};
