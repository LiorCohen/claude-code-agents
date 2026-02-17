/**
 * Settings reconciliation for plugin version upgrades.
 *
 * Transforms older sdd-settings formats into the latest schema.
 * The output always conforms to the current schema — there is no
 * backward-compatible format accepted after reconciliation.
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { SettingsFile, ComponentType, LogLevel } from '@/types';
import { generateComponentPath } from './sync';
import { validateSettings } from './validate';

/** A single change made during reconciliation */
export type ReconciliationChange = {
  readonly type: 'migrated' | 'added' | 'removed';
  readonly field: string;
  readonly detail: string;
};

/** A warning about filesystem mismatches */
export type ReconciliationWarning = {
  readonly component?: string;
  readonly message: string;
};

/** Result of reconciliation */
export type ReconciliationResult = {
  readonly settings: SettingsFile;
  readonly changes: readonly ReconciliationChange[];
  readonly warnings: readonly ReconciliationWarning[];
  readonly valid: boolean;
  readonly validationErrors: readonly string[];
};

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
  const rawObj = (typeof raw === 'object' && raw !== null ? raw : {}) as Readonly<Record<string, unknown>>;
  const rawSdd = (typeof rawObj.sdd === 'object' && rawObj.sdd !== null ? rawObj.sdd : {}) as Readonly<Record<string, unknown>>;
  const rawProject = (typeof rawObj.project === 'object' && rawObj.project !== null ? rawObj.project : {}) as Readonly<Record<string, unknown>>;
  const rawComponents = Array.isArray(rawObj.components) ? rawObj.components as readonly Readonly<Record<string, unknown>>[] : [];
  const rawSystem = typeof rawObj.system === 'object' && rawObj.system !== null ? rawObj.system as Readonly<Record<string, unknown>> : undefined;

  const nowUtc = formatUtcDatetime(now);

  // =========================================================================
  // 1. Migrate sdd metadata fields
  // =========================================================================

  // Handle plugin_version → split fields
  const legacyPluginVersion = rawSdd.plugin_version as string | undefined;
  const existingInitVersion = rawSdd.initialized_by_plugin_version as string | undefined;
  const existingUpdateVersion = rawSdd.updated_by_plugin_version as string | undefined;

  const { initializedByPluginVersion, initVersionChanges } = existingInitVersion
    ? { initializedByPluginVersion: existingInitVersion, initVersionChanges: [] as readonly ReconciliationChange[] }
    : legacyPluginVersion
      ? {
          initializedByPluginVersion: legacyPluginVersion,
          initVersionChanges: [
            {
              type: 'migrated' as const,
              field: 'sdd.initialized_by_plugin_version',
              detail: `Migrated from plugin_version: "${legacyPluginVersion}"`,
            },
          ],
        }
      : {
          initializedByPluginVersion: currentPluginVersion,
          initVersionChanges: [
            {
              type: 'added' as const,
              field: 'sdd.initialized_by_plugin_version',
              detail: `Set to current plugin version: "${currentPluginVersion}"`,
            },
          ],
        };

  const updatedByPluginVersion = currentPluginVersion;
  const updateVersionChanges: readonly ReconciliationChange[] =
    !existingUpdateVersion || existingUpdateVersion !== currentPluginVersion
      ? [
          {
            type: 'migrated' as const,
            field: 'sdd.updated_by_plugin_version',
            detail: `Set to current plugin version: "${currentPluginVersion}"`,
          },
        ]
      : [];

  // Handle initialized_at
  const rawInitializedAt = rawSdd.initialized_at as string | undefined;
  const { initializedAt, initAtChanges } = rawInitializedAt && isDateOnly(rawInitializedAt)
    ? {
        initializedAt: dateOnlyToUtc(rawInitializedAt),
        initAtChanges: [
          {
            type: 'migrated' as const,
            field: 'sdd.initialized_at',
            detail: `Converted date-only "${rawInitializedAt}" to UTC datetime "${dateOnlyToUtc(rawInitializedAt)}"`,
          },
        ],
      }
    : rawInitializedAt
      ? { initializedAt: rawInitializedAt, initAtChanges: [] as readonly ReconciliationChange[] }
      : {
          initializedAt: nowUtc,
          initAtChanges: [
            {
              type: 'added' as const,
              field: 'sdd.initialized_at',
              detail: `Set to current datetime: "${nowUtc}"`,
            },
          ],
        };

  // Handle last_updated → updated_at
  const rawLastUpdated = rawSdd.last_updated as string | undefined;
  const rawUpdatedAt = rawSdd.updated_at as string | undefined;
  const { updatedAt, updatedAtChanges } = rawLastUpdated
    ? {
        updatedAt: nowUtc,
        updatedAtChanges: [
          {
            type: 'migrated' as const,
            field: 'sdd.updated_at',
            detail: `Renamed from last_updated, set to current datetime: "${nowUtc}"`,
          },
        ],
      }
    : rawUpdatedAt
      ? { updatedAt: nowUtc, updatedAtChanges: [] as readonly ReconciliationChange[] }
      : {
          updatedAt: nowUtc,
          updatedAtChanges: [
            {
              type: 'added' as const,
              field: 'sdd.updated_at',
              detail: `Set to current datetime: "${nowUtc}"`,
            },
          ],
        };

  // Track removed legacy fields
  const removedFieldChanges: readonly ReconciliationChange[] = [
    ...(legacyPluginVersion
      ? [
          {
            type: 'removed' as const,
            field: 'sdd.plugin_version',
            detail: 'Replaced by initialized_by_plugin_version and updated_by_plugin_version',
          },
        ]
      : []),
    ...(rawLastUpdated
      ? [
          {
            type: 'removed' as const,
            field: 'sdd.last_updated',
            detail: 'Renamed to updated_at',
          },
        ]
      : []),
  ];

  // =========================================================================
  // 2. Remove deprecated project fields
  // =========================================================================

  const projectName = rawProject.name as string | undefined ?? 'unnamed-project';
  const projectDescription = rawProject.description as string | undefined;

  const deprecatedProjectChanges: readonly ReconciliationChange[] = [
    ...(rawProject.domain !== undefined
      ? [
          {
            type: 'removed' as const,
            field: 'project.domain',
            detail: 'Deprecated — domain inference moved to change workflow',
          },
        ]
      : []),
  ];

  // =========================================================================
  // 3. Reconcile components — add missing path fields
  // =========================================================================

  const { reconciledComponents, componentChanges } = rawComponents.reduce<{
    readonly reconciledComponents: readonly {
      readonly name: string;
      readonly type: ComponentType;
      readonly path: string;
      readonly settings: Readonly<Record<string, unknown>>;
    }[];
    readonly componentChanges: readonly ReconciliationChange[];
  }>(
    (acc, rawComp) => {
      const compName = rawComp.name as string;
      const compType = rawComp.type as ComponentType;
      const compPath = rawComp.path as string | undefined;
      const compSettings = rawComp.settings as Readonly<Record<string, unknown>> | undefined;

      const { path, pathChanges } = compPath
        ? { path: compPath, pathChanges: [] as readonly ReconciliationChange[] }
        : (() => {
            const flatPath = `components/${compName}`;
            const flatAbsolute = join(projectRoot, flatPath);

            if (existsSync(flatAbsolute) && statSync(flatAbsolute).isDirectory()) {
              return {
                path: flatPath,
                pathChanges: [
                  {
                    type: 'added' as const,
                    field: `components[${compName}].path`,
                    detail: `Inferred flat path from filesystem: "${flatPath}"`,
                  },
                ],
              };
            }

            const generatedPath = generateComponentPath(compType, compName);
            return {
              path: generatedPath,
              pathChanges: [
                {
                  type: 'added' as const,
                  field: `components[${compName}].path`,
                  detail: `Generated type-based path: "${generatedPath}"`,
                },
              ],
            };
          })();

      return {
        reconciledComponents: [
          ...acc.reconciledComponents,
          {
            name: compName,
            type: compType,
            path,
            settings: compSettings ?? {},
          },
        ],
        componentChanges: [...acc.componentChanges, ...pathChanges],
      };
    },
    { reconciledComponents: [], componentChanges: [] }
  );

  // =========================================================================
  // 4. Add system section if missing
  // =========================================================================

  const { system, systemChanges } = rawSystem
    ? (() => {
        const rawLogging = typeof rawSystem.logging === 'object' && rawSystem.logging !== null
          ? rawSystem.logging as Readonly<Record<string, unknown>>
          : undefined;

        if (rawLogging) {
          const validLevels: readonly string[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
          const rawLevel = typeof rawLogging.level === 'string' && validLevels.includes(rawLogging.level)
            ? rawLogging.level as LogLevel
            : 'info' as LogLevel;
          return {
            system: {
              logging: {
                enabled: typeof rawLogging.enabled === 'boolean' ? rawLogging.enabled : true,
                level: rawLevel,
              },
            } satisfies SettingsFile['system'],
            systemChanges: [] as readonly ReconciliationChange[],
          };
        }

        return {
          system: { logging: { enabled: true, level: 'info' as LogLevel } } satisfies SettingsFile['system'],
          systemChanges: [
            {
              type: 'added' as const,
              field: 'system.logging',
              detail: 'Added logging defaults: {enabled: true, level: "info"}',
            },
          ],
        };
      })()
    : {
        system: { logging: { enabled: true, level: 'info' as LogLevel } } satisfies SettingsFile['system'],
        systemChanges: [
          {
            type: 'added' as const,
            field: 'system',
            detail: 'Added system section with logging defaults',
          },
        ],
      };

  // =========================================================================
  // 5. Build reconciled settings
  // =========================================================================

  const project: SettingsFile['project'] = projectDescription !== undefined
    ? { name: projectName, description: projectDescription }
    : { name: projectName };

  const changes: readonly ReconciliationChange[] = [
    ...initVersionChanges,
    ...updateVersionChanges,
    ...initAtChanges,
    ...updatedAtChanges,
    ...removedFieldChanges,
    ...deprecatedProjectChanges,
    ...componentChanges,
    ...systemChanges,
  ];

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
  const pathWarnings: readonly ReconciliationWarning[] = reconciledComponents
    .filter((comp) => !existsSync(join(projectRoot, comp.path)))
    .map((comp) => ({
      component: comp.name,
      message: `Component path "${comp.path}" does not exist on disk`,
    }));

  // Check for untracked component directories
  const componentsDir = join(projectRoot, 'components');
  const untrackedWarnings: readonly ReconciliationWarning[] =
    existsSync(componentsDir) && statSync(componentsDir).isDirectory()
      ? (() => {
          const trackedPaths: ReadonlySet<string> = new Set(reconciledComponents.map((c) => c.path));
          const topLevelDirs = readdirSync(componentsDir).filter((entry) => {
            const entryPath = join(componentsDir, entry);
            return statSync(entryPath).isDirectory();
          });

          return topLevelDirs.flatMap((dirName) => {
            const flatPath = `components/${dirName}`;
            if (trackedPaths.has(flatPath)) {
              return [];
            }

            const subDirs = readdirSync(join(componentsDir, dirName)).filter((entry) => {
              const entryPath = join(componentsDir, dirName, entry);
              return statSync(entryPath).isDirectory();
            });

            const subDirWarnings: readonly ReconciliationWarning[] = subDirs
              .filter((subDir) => !trackedPaths.has(`components/${dirName}/${subDir}`))
              .map((subDir) => ({
                message: `Directory "components/${dirName}/${subDir}" exists on disk but is not tracked in sdd-settings.yaml`,
              }));

            const flatWarning: readonly ReconciliationWarning[] =
              subDirs.length === 0 && !trackedPaths.has(flatPath)
                ? [{ message: `Directory "${flatPath}" exists on disk but is not tracked in sdd-settings.yaml` }]
                : [];

            return [...subDirWarnings, ...flatWarning];
          });
        })()
      : [];

  const warnings: readonly ReconciliationWarning[] = [...pathWarnings, ...untrackedWarnings];

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
