/**
 * Settings validation functions.
 *
 * Validates the base settings structure: project metadata, SDD metadata,
 * tech pack entries, and component manifest entries (name, type, directory).
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
 * Validate component naming conventions.
 */
const validateNaming = (
  components: readonly ComponentManifest[]
): readonly SettingsValidationError[] => {
  const namePattern = /^[a-z][a-z0-9-]*[a-z0-9]$/;

  const basicErrors = components.flatMap((component) => {
    const patternError: readonly SettingsValidationError[] =
      component.name.length > 1 && !namePattern.test(component.name)
        ? [
            {
              component: component.name,
              message: 'Invalid name format. Names must be lowercase, start with a letter, and use hyphens only (not underscores).',
            },
          ]
        : [];

    return patternError;
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
        field: `tech_packs.${key}.namespace`,
        message: `Tech pack namespace "${entry.namespace}" does not match key "${key}"`,
      });
    }

    if (!entry.name) {
      errors.push({
        field: `tech_packs.${key}.name`,
        message: 'Tech pack name is required',
      });
    }

    if (!entry.version) {
      errors.push({
        field: `tech_packs.${key}.version`,
        message: 'Tech pack version is required',
      });
    }

    if (!entry.mode || (entry.mode !== 'internal' && entry.mode !== 'external')) {
      errors.push({
        field: `tech_packs.${key}.mode`,
        message: 'Tech pack mode must be "internal" or "external"',
      });
    }

    if (!entry.path) {
      errors.push({
        field: `tech_packs.${key}.path`,
        message: 'Tech pack path is required',
      });
    }

    // Validate component entries within the tech pack
    const componentErrors = validateNaming(entry.components);
    return [...errors, ...componentErrors];
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
  const techPackErrors = validateTechPacks(settings.tech_packs);

  // Validate all components across all tech packs
  const allComponents = Object.values(settings.tech_packs ?? {}).flatMap((tp) => tp.components);

  // Check for directory collisions across all tech packs
  const directoryMap = new Map<string, string>();
  const directoryErrors: SettingsValidationError[] = [];
  for (const comp of allComponents) {
    const existing = directoryMap.get(comp.directory);
    if (existing && existing !== comp.name) {
      directoryErrors.push({
        component: comp.name,
        field: 'directory',
        message: `Directory "${comp.directory}" collides with component "${existing}"`,
      });
    }
    directoryMap.set(comp.directory, comp.name);
  }

  const allErrors = [...errors, ...techPackErrors, ...directoryErrors];

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
