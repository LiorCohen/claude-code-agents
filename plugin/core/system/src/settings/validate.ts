/**
 * Settings validation functions.
 *
 * Validates the base settings structure: project metadata, SDD metadata,
 * tech pack entries, and top-level component manifest entries (type, techpack, directory).
 * Tech-specific component settings are validated by each tech pack.
 */

import type { SettingsFile, TechPackEntry, ComponentManifest } from '@/types';

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
 * Validate tech pack entries.
 */
const validateTechPacks = (
  techPacks: Readonly<Record<string, TechPackEntry>> | undefined
): readonly SettingsValidationError[] => {
  if (!techPacks) return [];

  return Object.entries(techPacks).flatMap(([key, entry]) => {
    const errors: SettingsValidationError[] = [];

    if (entry.namespace !== key) {
      errors.push({
        field: `techpacks.${key}.namespace`,
        message: `Tech pack namespace "${entry.namespace}" does not match key "${key}"`,
      });
    }

    if (!entry.name) {
      errors.push({
        field: `techpacks.${key}.name`,
        message: 'Tech pack name is required',
      });
    }

    if (!entry.version) {
      errors.push({
        field: `techpacks.${key}.version`,
        message: 'Tech pack version is required',
      });
    }

    if (!entry.mode || (entry.mode !== 'internal' && entry.mode !== 'external' && entry.mode !== 'git')) {
      errors.push({
        field: `techpacks.${key}.mode`,
        message: 'Tech pack mode must be "internal", "external", or "git"',
      });
    }

    // path is required for internal/external, install_path for git
    if (entry.mode === 'git') {
      if (!entry.install_path) {
        errors.push({
          field: `techpacks.${key}.install_path`,
          message: 'install_path is required for git mode tech packs',
        });
      }
      if (!entry.repo) {
        errors.push({
          field: `techpacks.${key}.repo`,
          message: 'repo is required for git mode tech packs',
        });
      }
    } else if (!entry.path) {
      errors.push({
        field: `techpacks.${key}.path`,
        message: 'Tech pack path is required',
      });
    }

    return errors;
  });
};

/**
 * Validate top-level components map.
 */
const validateComponents = (
  components: Readonly<Record<string, ComponentManifest>> | undefined,
  techPacks: Readonly<Record<string, TechPackEntry>> | undefined
): readonly SettingsValidationError[] => {
  if (!components) return [];

  const namePattern = /^[a-z][a-z0-9-]*[a-z0-9]$/;

  return Object.entries(components).flatMap(([name, component]) => {
    const errors: SettingsValidationError[] = [];

    // Validate name format
    if (name.length > 1 && !namePattern.test(name)) {
      errors.push({
        component: name,
        message: 'Invalid name format. Names must be lowercase, start with a letter, and use hyphens only (not underscores).',
      });
    }

    // Validate techpack back-reference
    if (!component.techpack) {
      errors.push({
        component: name,
        field: 'techpack',
        message: 'Component must reference a tech pack namespace',
      });
    } else if (techPacks && !techPacks[component.techpack]) {
      errors.push({
        component: name,
        field: 'techpack',
        message: `Component references nonexistent tech pack namespace "${component.techpack}"`,
      });
    }

    // Validate required fields
    if (!component.type) {
      errors.push({
        component: name,
        field: 'type',
        message: 'Component type is required',
      });
    }

    if (!component.directory) {
      errors.push({
        component: name,
        field: 'directory',
        message: 'Component directory is required',
      });
    }

    return errors;
  });
};

/**
 * Validate settings file.
 */
export const validateSettings = (
  settings: SettingsFile
): SettingsValidationResult => {
  const errors: SettingsValidationError[] = [];

  // Validate project name
  if (!settings.project?.name) {
    errors.push({ field: 'project.name', message: 'Project name is required' });
  }

  // Validate tech pack entries
  const techPackErrors = validateTechPacks(settings.techpacks);

  // Validate top-level components
  const componentErrors = validateComponents(settings.components, settings.techpacks);

  // Check for directory collisions across all components
  const directoryMap = new Map<string, string>();
  const directoryErrors: SettingsValidationError[] = [];
  for (const [name, comp] of Object.entries(settings.components ?? {})) {
    const existing = directoryMap.get(comp.directory);
    if (existing && existing !== name) {
      directoryErrors.push({
        component: name,
        field: 'directory',
        message: `Directory "${comp.directory}" collides with component "${existing}"`,
      });
    }
    directoryMap.set(comp.directory, name);
  }

  const allErrors = [...errors, ...techPackErrors, ...componentErrors, ...directoryErrors];

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: [],
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
              : error.field
                ? `  [${error.field}]`
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
