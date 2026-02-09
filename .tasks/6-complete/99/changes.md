# Task #99 — Change Report

**Branch:** `feature/task-99-settings-reconciliation`
**Commits:** 10
**Files changed:** 22 (+994 / -143 lines)

---

## 1. [`plugin/system/src/types/settings.ts`](plugin/system/src/types/settings.ts)

`SddMetadata` split `plugin_version` into `initialized_by_plugin_version` + `updated_by_plugin_version`, changed date fields to UTC datetime format. `ProjectMetadata` removed `domain` and `type`, made `description` optional.

```diff
 /** SDD metadata in settings file */
 export interface SddMetadata {
-  /** SDD plugin version that created this project */
-  readonly plugin_version: string;
-  /** Date project was initialized (YYYY-MM-DD) */
+  /** Plugin version that first created this project (immutable after init) */
+  readonly initialized_by_plugin_version: string;
+  /** Plugin version that last reconciled settings */
+  readonly updated_by_plugin_version: string;
+  /** UTC datetime project was initialized (YYYY-MM-DD HH:MM:SSZ) */
   readonly initialized_at: string;
-  /** Date settings were last modified (YYYY-MM-DD) */
-  readonly last_updated: string;
+  /** UTC datetime settings were last updated (YYYY-MM-DD HH:MM:SSZ) */
+  readonly updated_at: string;
 }

 /** Project metadata in settings file */
@@ -316,11 +318,7 @@ export interface ProjectMetadata {
   /** Project name (lowercase, hyphens) */
   readonly name: string;
   /** Project description */
-  readonly description: string;
-  /** Primary business domain */
-  readonly domain: string;
-  /** Project type */
-  readonly type: 'fullstack' | 'backend' | 'frontend' | 'custom';
+  readonly description?: string;
 }
```

---

## 2. [`plugin/system/src/settings/schema.ts`](plugin/system/src/settings/schema.ts)

Updated `sddMetadataSchema` to match new split fields with UTC datetime patterns. Updated `projectMetadataSchema` to remove `domain`/`type` and require only `name`.

```diff
 const sddMetadataSchema: JSONSchema7 = {
   type: 'object',
   properties: {
-    plugin_version: {
+    initialized_by_plugin_version: {
       type: 'string',
-      description: 'SDD plugin version that created this project',
+      description: 'Plugin version that first created this project',
+    },
+    updated_by_plugin_version: {
+      type: 'string',
+      description: 'Plugin version that last reconciled settings',
     },
     initialized_at: {
       type: 'string',
-      pattern: '^\\d{4}-\\d{2}-\\d{2}$',
-      description: 'Date project was initialized (YYYY-MM-DD)',
+      pattern: '^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}Z$',
+      description: 'UTC datetime project was initialized (YYYY-MM-DD HH:MM:SSZ)',
     },
-    last_updated: {
+    updated_at: {
       type: 'string',
-      pattern: '^\\d{4}-\\d{2}-\\d{2}$',
-      description: 'Date settings were last modified (YYYY-MM-DD)',
+      pattern: '^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}Z$',
+      description: 'UTC datetime settings were last updated (YYYY-MM-DD HH:MM:SSZ)',
     },
   },
-  required: ['plugin_version', 'initialized_at', 'last_updated'],
+  required: ['initialized_by_plugin_version', 'updated_by_plugin_version', 'initialized_at', 'updated_at'],
   additionalProperties: false,
 };

@@ -350,17 +354,8 @@ const projectMetadataSchema: JSONSchema7 = {
       type: 'string',
       description: 'Project description',
     },
-    domain: {
-      type: 'string',
-      description: 'Primary business domain',
-    },
-    type: {
-      type: 'string',
-      enum: ['fullstack', 'backend', 'frontend', 'custom'],
-      description: 'Project type',
-    },
   },
-  required: ['name', 'description', 'domain', 'type'],
+  required: ['name'],
   additionalProperties: false,
 };
```

---

## 3. [`plugin/system/src/settings/reconcile.ts`](plugin/system/src/settings/reconcile.ts)

New module (368 lines). Reconciles older sdd-settings formats into the latest schema during plugin upgrades. Handles metadata migration, deprecated field removal, component path inference, system section defaults, and directory mismatch detection.

```typescript
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
```

---

## 4. [`plugin/system/src/settings/index.ts`](plugin/system/src/settings/index.ts)

Added 7 missing type re-exports (`TestingComponent`, `CicdComponent`, `TestingSettings`, `CicdSettings`, `LogLevel`, `LoggingSettings`, `SystemSettings`) and re-exported the new reconciliation module.

```diff
 export type {
   DatabaseComponent,
   ContractComponent,
   ConfigComponent,
+  TestingComponent,
+  CicdComponent,
   Component,
+  TestingSettings,
+  CicdSettings,
+  LogLevel,
+  LoggingSettings,
+  SystemSettings,
   SddMetadata,
   ProjectMetadata,
   SettingsFile,
@@ -88,6 +95,14 @@ export {
   formatSyncPreview,
 } from './sync';

+// Re-export reconciliation
+export type {
+  ReconciliationChange,
+  ReconciliationWarning,
+  ReconciliationResult,
+} from './reconcile';
+export { reconcileSettings } from './reconcile';
+
 // Re-export helm sync utilities
 export type { HelmTemplateSet } from './sync-helm';
```

---

## 5. [`plugin/system/src/cli.ts`](plugin/system/src/cli.ts)

Replaced `loadSettings()` (which assumed full `SettingsFile` shape) with `loadLoggingConfig()` that safely extracts `system.logging` without assuming the file has been reconciled.

```diff
-import type { SettingsFile, LogLevel } from '@/types/settings';
+import type { LogLevel } from '@/types/settings';

+/** Logging config extracted from raw settings YAML (safe for pre-reconciled files) */
+interface RawLoggingConfig {
+  readonly enabled: boolean;
+  readonly level: LogLevel;
+}
+
 /**
- * Load settings from .sdd/sdd-settings.yaml if it exists.
- * Returns default settings if file doesn't exist or can't be loaded.
+ * Load logging config from .sdd/sdd-settings.yaml if it exists.
+ * Safely extracts system.logging without assuming the full SettingsFile shape,
+ * since the file may not yet be reconciled to the latest schema.
  */
-const loadSettings = (): SettingsFile | null => {
+const loadLoggingConfig = (): RawLoggingConfig | null => {
   try {
     const settingsPath = join(process.cwd(), '.sdd', 'sdd-settings.yaml');
     const content = readFileSync(settingsPath, 'utf-8');
-    return YAML.parse(content) as SettingsFile;
+    const raw = YAML.parse(content) as Record<string, unknown>;
+    const system = raw?.system as Record<string, unknown> | undefined;
+    const logging = system?.logging as Record<string, unknown> | undefined;
+    if (logging && typeof logging.enabled === 'boolean' && typeof logging.level === 'string') {
+      return { enabled: logging.enabled, level: logging.level as LogLevel };
+    }
+    return null;
   } catch {
     return null;
@@ -168,9 +181,8 @@ const main = async (): Promise<number> => {
   const projectRoot = await findProjectRoot();

-  // Load settings and initialize file logger
-  const settings = loadSettings();
-  const loggingConfig = settings?.system?.logging ?? {
+  // Load logging config from settings (safe for pre-reconciled files)
+  const loggingConfig = loadLoggingConfig() ?? {
     enabled: true,
     level: 'info' as LogLevel,
   };
```

---

## 6. [`plugin/skills/project-settings/SKILL.md`](plugin/skills/project-settings/SKILL.md)

Updated schema documentation, YAML examples, and minimal template to reflect new field names (`initialized_by_plugin_version`, `updated_by_plugin_version`, `initialized_at`, `updated_at`), removed deprecated `domain`/`type` fields, added `path` to component examples.

```diff
 sdd:
-  plugin_version: "6.2.1"
-  initialized_at: "2026-02-07"
-  last_updated: "2026-02-07"
+  initialized_by_plugin_version: "6.2.1"
+  updated_by_plugin_version: "6.4.0"
+  initialized_at: "2026-02-07 00:00:00Z"
+  updated_at: "2026-02-09 14:30:00Z"

 project:
   name: "my-app"
   description: "A task management SaaS application"
-  domain: "Task Management"
-  type: "fullstack"

 components:
   - name: config
     type: config
+    path: components/config
     settings: {}
```

---

## 7. [`plugin/skills/project-settings/schemas/sdd-settings.schema.json`](plugin/skills/project-settings/schemas/sdd-settings.schema.json)

Updated JSON Schema to match new field names, switched date format from `date` to UTC datetime pattern, removed `domain`/`type` from project, fixed `name` and `component_name` patterns to `^[a-z][a-z0-9-]*[a-z0-9]$`.

```diff
     "sdd": {
       "type": "object",
-      "required": ["plugin_version", "initialized_at", "last_updated"],
+      "required": ["initialized_by_plugin_version", "updated_by_plugin_version", "initialized_at", "updated_at"],
       "properties": {
-        "plugin_version": {
+        "initialized_by_plugin_version": {
+          "type": "string",
+          "description": "Plugin version that first created this project (immutable after init)."
+        },
+        "updated_by_plugin_version": {
           "type": "string",
-          "description": "SDD plugin version that created this project."
+          "description": "Plugin version that last reconciled settings."
         },
         "initialized_at": {
           "type": "string",
-          "format": "date",
-          "description": "Date project was initialized (YYYY-MM-DD)."
+          "pattern": "^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}Z$",
+          "description": "UTC datetime project was initialized (YYYY-MM-DD HH:MM:SSZ)."
         },
-        "last_updated": {
+        "updated_at": {
           "type": "string",
-          "format": "date",
-          "description": "Date settings were last modified (YYYY-MM-DD)."
+          "pattern": "^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}Z$",
+          "description": "UTC datetime settings were last updated (YYYY-MM-DD HH:MM:SSZ)."
         }
       }
     },
     "project": {
-      "required": ["name", "description", "domain", "type"],
+      "required": ["name"],
       "properties": {
         "name": {
-          "pattern": "^[a-z0-9-]+$",
+          "pattern": "^[a-z][a-z0-9-]*[a-z0-9]$",
         },
-        "domain": { ... },
-        "type": { ... },
       }
     },
   "$defs": {
     "component_name": {
-      "pattern": "^[a-z0-9-]+$",
+      "pattern": "^[a-z][a-z0-9-]*[a-z0-9]$",
     },
```

---

## 8. [`plugin/skills/project-settings/schemas/input.schema.json`](plugin/skills/project-settings/schemas/input.schema.json)

Removed `project_domain`, `project_type` parameters. Renamed `plugin_version` to `initialized_by_plugin_version`. Made `project_description` optional.

```diff
     "project_description": {
       "type": "string",
-      "description": "Project description (used for create operation)"
+      "description": "Project description (used for create operation, optional)"
     },
-    "project_domain": {
+    "initialized_by_plugin_version": {
       "type": "string",
-      "description": "Business domain (used for create operation)"
-    },
-    "project_type": {
-      "type": "string",
-      "enum": ["fullstack", "backend", "frontend", "custom"],
-      "description": "Project type classification"
-    },
-    "plugin_version": {
-      "type": "string",
-      "description": "SDD plugin version (used for create operation)"
+      "description": "Plugin version creating this project (used for create operation)"
     },
```

---

## 9. [`plugin/commands/sdd-init.md`](plugin/commands/sdd-init.md)

Added Phase 0 (version detection + plugin build), Phase 2.7 (settings reconciliation for existing projects). Updated Phase 1 to detect existing projects and skip name prompt. Phases 3/4 skip for existing projects.

```diff
 | Phase | Purpose |
 |-------|---------|
-| 1     | Detect project name from current directory |
+| 0     | Version detection + plugin build (if existing project with version mismatch) |
+| 1     | Detect project name from current directory (or load from existing settings) |
 | 2     | Environment verification (plugin, tools, settings, permissions) |
-| 3     | Create minimal structure (config component only) |
-| 4     | Git init + commit |
+| 2.7   | Settings reconciliation (if existing project with version mismatch) |
+| 3     | Create minimal structure (config component only) — skipped for existing projects |
+| 4     | Git init + commit — skipped for existing projects |
 | 5     | Completion message |
```

---

## 10. [`plugin/commands/sdd-version.md`](plugin/commands/sdd-version.md)

Updated to read from `updated_by_plugin_version` with legacy fallback. Added `Originally from:` line showing `initialized_by_plugin_version`. Updated messaging for outdated projects.

```diff
-3. If it exists, read the project plugin version from `sdd.plugin_version`
+3. If it exists, read the project plugin version from `sdd.updated_by_plugin_version` (with fallback to legacy `sdd.plugin_version`)
+4. Optionally read `sdd.initialized_by_plugin_version` for context

-  Installed:  6.5.0
-  Project:    6.5.0  ✓ match
+  Installed:       6.5.0
+  Project:         6.5.0  ✓ match
+  Originally from: 6.2.0

-The project was created with an older plugin version.
-Run /sdd-init to upgrade project settings and repair any drift.
+The project settings were last reconciled with an older plugin version.
+Run /sdd-init to reconcile settings with the current plugin.
```

---

## 11. [`plugin/commands/sdd-change.md`](plugin/commands/sdd-change.md)

Removed `default_domain` from spec-decomposition skill invocation (domain is now inferred from spec content).

```diff
   spec_content: <full content>
   classified_transformation: <from step 5>
   discovered_components: <from step 6>
-  default_domain: <from sdd-settings.yaml>
```

---

## 12. [`docs/commands.md`](docs/commands.md)

Updated `/sdd-version` documentation to reflect new field names and output format, including `Originally from:` line.

```diff
-- The project's plugin version (from `.sdd/sdd-settings.yaml`)
+- The project's current plugin version (from `sdd.updated_by_plugin_version` in `.sdd/sdd-settings.yaml`)
+- The version that originally created the project (from `sdd.initialized_by_plugin_version`)

-  Installed:  6.5.0
-  Project:    6.5.0  ✓ match
+  Installed:       6.5.0
+  Project:         6.5.0  ✓ match
+  Originally from: 6.2.0

-The project was created with an older plugin version.
-Run /sdd-init to upgrade project settings and repair any drift.
+The project settings were last reconciled with an older plugin version.
+Run /sdd-init to reconcile settings with the current plugin.
```

---

## 13. [`tests/src/tests/unit/settings/settings-reconcile.test.ts`](tests/src/tests/unit/settings/settings-reconcile.test.ts)

New test file (229 lines). Comprehensive unit tests for the reconciliation module covering: source file structure, metadata migration, project field deprecation, component path reconciliation, system section handling, directory mismatch detection, and datetime formatting.

```typescript
/**
 * Unit Tests: settings reconciliation module
 *
 * WHY: The reconciliation module transforms older sdd-settings formats
 * into the latest schema during plugin upgrades. Incorrect reconciliation
 * would lose user data, break settings, or fail silently.
 */

import { describe, expect, it } from 'vitest';
import { PLUGIN_DIR, joinPath, readFile } from '@/lib';

// ... 229 lines of tests covering:
// - reconcile.ts source file existence and exports
// - sdd metadata migration (plugin_version split, date conversion)
// - project field deprecation (domain, type removal)
// - component path reconciliation (preserve, infer, generate)
// - system section reconciliation (add defaults, preserve existing)
// - directory mismatch detection (missing paths, untracked dirs)
// - datetime formatting (UTC format, date-only conversion)
```

---

## 14. [`tests/src/tests/unit/settings/settings-schema.test.ts`](tests/src/tests/unit/settings/settings-schema.test.ts)

Updated schema tests to reference new field names. Removed `project type enum` test. Updated project metadata test to check `required: ['name']`.

```diff
   it('requires sdd metadata section', () => {
-    expect(content).toContain("'plugin_version'");
+    expect(content).toContain("'initialized_by_plugin_version'");
+    expect(content).toContain("'updated_by_plugin_version'");
     expect(content).toContain("'initialized_at'");
-    expect(content).toContain("'last_updated'");
+    expect(content).toContain("'updated_at'");
   });

   it('requires project metadata section', () => {
     expect(content).toContain("'name'");
-    expect(content).toContain("'description'");
-    expect(content).toContain("'domain'");
-    expect(content).toContain("'type'");
+    expect(content).toContain("required: ['name']");
   });
-
-  it('validates project type enum', () => { ... });  // removed
```

---

## 15. [`tests/src/tests/unit/settings/settings-types.test.ts`](tests/src/tests/unit/settings/settings-types.test.ts)

Added tests verifying `SddMetadata` has split version fields and `ProjectMetadata` has optional `description`.

```diff
+  it('exports SddMetadata interface with split version fields', () => {
+    expect(content).toContain('readonly initialized_by_plugin_version: string');
+    expect(content).toContain('readonly updated_by_plugin_version: string');
+    expect(content).toContain('readonly initialized_at: string');
+    expect(content).toContain('readonly updated_at: string');
+  });
+
+  it('exports ProjectMetadata with name required and description optional', () => {
+    expect(content).toContain('readonly name: string');
+    expect(content).toContain('readonly description?: string');
+  });
```

---

## 16. [`tests/src/tests/workflows/sdd-init.test.ts`](tests/src/tests/workflows/sdd-init.test.ts)

Added new test suite `sdd-init existing project detection` that creates a pre-existing project with old-format settings and verifies `/sdd-init` detects it without prompting for project name.

```diff
+const EXISTING_PROJECT_PROMPT = `Run /sdd-init on this existing project.
+...
+5. Complete the workflow without stopping`;
+
+describe('sdd-init existing project detection', () => {
+  // Sets up project with old-format settings (plugin_version, last_updated, domain, type)
+  // Runs /sdd-init and verifies:
+  //   - Settings file still exists
+  //   - Project name preserved (not overwritten)
+});
```

---

## 17. [`tests/src/tests/workflows/sdd-change-new-external.test.ts`](tests/src/tests/workflows/sdd-change-new-external.test.ts)

Updated test fixture settings from old format (flat `plugin_version`, `domain`, `type`) to new format (`initialized_by_plugin_version`, `updated_by_plugin_version`, UTC datetimes, `components: []`).

```diff
-      `plugin_version: "5.0.0"
+      `sdd:
+  initialized_by_plugin_version: "5.0.0"
+  updated_by_plugin_version: "5.0.0"
+  initialized_at: "2026-01-01 00:00:00Z"
+  updated_at: "2026-01-01 00:00:00Z"
 project:
   name: test-external-spec
   description: Test project for external spec import
-  domain: User Management
-  type: fullstack
+components: []
```

---

## 18. [`plugin/.claude-plugin/plugin.json`](plugin/.claude-plugin/plugin.json)

Version bump 6.5.0 → 6.6.0.

```diff
-  "version": "6.5.0",
+  "version": "6.6.0",
```

---

## 19. [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json)

Version bump 6.5.0 → 6.6.0.

```diff
-      "version": "6.5.0"
+      "version": "6.6.0"
```

---

## 20. [`changelog/v6.md`](changelog/v6.md)

Added changelog entry for 6.6.0 covering the settings reconciliation feature, metadata migration, schema changes, and command updates.

```diff
+## [6.6.0] - 2026-02-09
+
+### Added
+
+- **settings**: New `reconcileSettings()` module for automatic settings migration
+- **sdd-init**: Phase 0 (version detection) and Phase 2.7 (settings reconciliation)
+
+### Changed
+
+- **types**: `SddMetadata` split version fields, UTC datetime format
+- **types**: `ProjectMetadata` simplified — `domain`/`type` removed
+- **schema**: Both schema.ts and JSON Schema updated to latest format
+- **sdd-version**: Reads from `updated_by_plugin_version` with legacy fallback
+- **sdd-change**: Removed `default_domain` from spec-decomposition
+- **cli**: Safe `loadLoggingConfig()` replaces `loadSettings()`
+- **project-settings skill**: Updated docs, examples, and templates
+
+### Rationale
+
+Settings reconciliation for plugin upgrades — read any older format,
+produce output conforming to current schema.
```

---

## 21. [`.claude/skills/tasks/SKILL.md`](.claude/skills/tasks/SKILL.md)

Added `changes.md` to task folder contents. Updated review workflow to ask user about generating a change report before moving to review.

```diff
 Each task is a folder named by its ID containing:
 - `task.md` - the task description and metadata
 - `plan.md` - the implementation plan (created during planning phase)
+- `changes.md` - change report (optional, generated when moving to review)

-1. Move to `5-reviewing/`
-2. Update status
-3. Update INDEX.md
-4. Use commit skill
+1. **Ask the user** if they want a change report generated
+2. If yes, generate `changes.md` in the task folder
+3. Move to `5-reviewing/`
+4. Update status
+5. Update INDEX.md
+6. Use commit skill
```

---

## 22. [`.claude/skills/tasks/workflows.md`](.claude/skills/tasks/workflows.md)

Added full Change Report Format section with template, generation instructions, and formatting rules (clickable file links, `diff` syntax highlighting, file-language highlighting for new files).

```diff
+### Change Report Format
+
+The change report is saved as `changes.md` in the task folder.
+It documents every file changed on the feature branch vs main.
+
+**Template:**
+## 1. [`<file-path>`](<file-path>)
+<One-line description of what changed.>
+```diff
+<actual diff for this file>
+```
+
+**Rules:**
+- One section per changed file, numbered sequentially
+- Each heading is a clickable markdown link to the file
+- Use `diff` for diffs, file's language for new files showing full content
+- Order files logically (core types → modules → commands → tests → version/changelog)
```
