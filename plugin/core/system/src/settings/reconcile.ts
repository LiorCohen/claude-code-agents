/**
 * Settings reconciliation for plugin version upgrades.
 *
 * Transforms older sdd-settings formats into the latest schema.
 * The output always conforms to the current schema — there is no
 * backward-compatible format accepted after reconciliation.
 */

import type { SettingsFile, LogLevel, TechPackEntry, ComponentManifest } from '@/types';
import { validateSettings } from './validate';

/** A single change made during reconciliation */
export type ReconciliationChange = {
  readonly type: 'migrated' | 'added' | 'removed';
  readonly field: string;
  readonly detail: string;
};

/** Tech pack identity for legacy component migration */
export type DefaultTechPack = {
  readonly name: string;
  readonly namespace: string;
  readonly path: string;
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
 * Migrate tech packs and components to the latest format.
 *
 * Handles three migration paths:
 * 1. Legacy flat `components` array at root → techpacks + top-level components
 * 2. Old `tech_packs` key with nested `components` → `techpacks` + top-level `components`
 * 3. Already-migrated `techpacks` key → pass through
 */
const migrateTechPacksAndComponents = (
  rawObj: Readonly<Record<string, unknown>>,
  defaultTechPack?: DefaultTechPack,
): {
  readonly techPacks: Readonly<Record<string, TechPackEntry>>;
  readonly components: Readonly<Record<string, ComponentManifest>>;
  readonly changes: readonly ReconciliationChange[];
} => {
  // Path 3: Already in new format (techpacks key exists)
  const rawTechpacks = rawObj.techpacks as Readonly<Record<string, unknown>> | undefined;
  if (rawTechpacks && typeof rawTechpacks === 'object') {
    const rawComponents = rawObj.components as Readonly<Record<string, ComponentManifest>> | undefined;
    return {
      techPacks: rawTechpacks as unknown as Readonly<Record<string, TechPackEntry>>,
      components: rawComponents && typeof rawComponents === 'object' ? rawComponents : {},
      changes: [],
    };
  }

  // Path 2: Old tech_packs key with nested components
  const rawTechPacksOld = rawObj.tech_packs as Readonly<Record<string, Record<string, unknown>>> | undefined;
  if (rawTechPacksOld && typeof rawTechPacksOld === 'object') {
    const changes: ReconciliationChange[] = [
      { type: 'migrated', field: 'techpacks', detail: 'Renamed tech_packs → techpacks' },
    ];

    // Extract nested components into top-level map
    const topLevelComponents: Record<string, ComponentManifest> = {};
    const migratedTechPacks: Record<string, TechPackEntry> = {};

    for (const [ns, entry] of Object.entries(rawTechPacksOld)) {
      const nestedComponents = Array.isArray(entry.components)
        ? entry.components as readonly Readonly<Record<string, unknown>>[]
        : [];

      // Build tech pack entry without components
      migratedTechPacks[ns] = {
        name: (entry.name as string) ?? ns,
        namespace: (entry.namespace as string) ?? ns,
        version: (entry.version as string) ?? '1.0.0',
        mode: (entry.mode as TechPackEntry['mode']) ?? 'internal',
        path: (entry.path as string) ?? ns,
      };

      // Move nested components to top-level
      for (const comp of nestedComponents) {
        const name = comp.name as string;
        topLevelComponents[name] = {
          type: (comp.type as string) ?? 'unknown',
          techpack: ns,
          directory: (comp.directory as string) ?? `components/${name}`,
        };
      }

      if (nestedComponents.length > 0) {
        changes.push({
          type: 'migrated',
          field: 'components',
          detail: `Extracted ${nestedComponents.length} component(s) from techpacks.${ns}.components to top-level components`,
        });
      }
    }

    return { techPacks: migratedTechPacks, components: topLevelComponents, changes };
  }

  // Path 1: Legacy flat components array at root
  const rawComponents = Array.isArray(rawObj.components) ? rawObj.components as readonly Readonly<Record<string, unknown>>[] : [];
  if (rawComponents.length === 0) {
    return { techPacks: {}, components: {}, changes: [] };
  }

  const pack = defaultTechPack ?? { name: 'legacy', namespace: 'legacy', path: 'legacy' };

  const entry: TechPackEntry = {
    name: pack.name,
    namespace: pack.namespace,
    version: '1.0.0',
    mode: 'internal',
    path: pack.path,
  };

  const topLevelComponents: Record<string, ComponentManifest> = {};
  for (const raw of rawComponents) {
    const name = (raw.name as string) ?? 'unknown';
    topLevelComponents[name] = {
      type: (raw.type as string) ?? 'unknown',
      techpack: pack.namespace,
      directory: (raw.path as string) ?? (raw.directory as string) ?? `components/${name}`,
    };
  }

  return {
    techPacks: { [pack.namespace]: entry },
    components: topLevelComponents,
    changes: [
      {
        type: 'migrated',
        field: 'techpacks',
        detail: `Migrated ${rawComponents.length} component(s) from flat components array to techpacks.${pack.namespace} + top-level components`,
      },
    ],
  };
};

/**
 * Reconcile raw parsed YAML into a valid SettingsFile conforming to the latest schema.
 *
 * @param raw - Raw parsed YAML (unknown shape from YAML.parse)
 * @param currentPluginVersion - The current plugin version string
 * @param _projectRoot - Absolute path to project root (for filesystem checks)
 * @param now - Optional Date for testing (defaults to current time)
 * @param defaultTechPack - Tech pack identity for legacy component migration (discovered by caller)
 */
export const reconcileSettings = (
  raw: unknown,
  currentPluginVersion: string,
  _projectRoot: string,
  now: Date = new Date(),
  defaultTechPack?: DefaultTechPack,
): ReconciliationResult => {
  const rawObj = (typeof raw === 'object' && raw !== null ? raw : {}) as Readonly<Record<string, unknown>>;
  const rawSdd = (typeof rawObj.sdd === 'object' && rawObj.sdd !== null ? rawObj.sdd : {}) as Readonly<Record<string, unknown>>;
  const rawProject = (typeof rawObj.project === 'object' && rawObj.project !== null ? rawObj.project : {}) as Readonly<Record<string, unknown>>;
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
  // 3. Migrate tech packs and components
  // =========================================================================

  const { techPacks, components, changes: componentMigrationChanges } = migrateTechPacksAndComponents(rawObj, defaultTechPack);

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
    ...componentMigrationChanges,
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
    techpacks: Object.keys(techPacks).length > 0 ? techPacks : undefined,
    components: Object.keys(components).length > 0 ? components : undefined,
    system,
  };

  // =========================================================================
  // 6. Validate reconciled result
  // =========================================================================

  const validation = validateSettings(settings);
  const validationErrors = validation.errors.map((e) => {
    const prefix = e.component
      ? `[${e.component}${e.field ? `.${e.field}` : ''}]`
      : e.field
        ? `[${e.field}]`
        : '';
    return `${prefix} ${e.message}`.trim();
  });

  return {
    settings,
    changes,
    warnings: [],
    valid: validation.valid,
    validationErrors,
  };
};
