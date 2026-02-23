/**
 * Spec validation command.
 *
 * Usage:
 *   sdd-system spec validate <spec.md>
 *   sdd-system spec validate --all --specs-dir specs/
 */

import type { CommandResult } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { parseFrontmatter } from '@/lib/frontmatter';
import { findSpecFiles, directoryExists } from '@/lib/spec-utils';
import { exists, readText } from '@/lib/fs';
import {
  REQUIRED_FIELDS,
  PRODUCT_SPEC_REQUIRED_FIELDS,
  TECH_SPEC_REQUIRED_FIELDS,
  VALID_SPEC_TYPES,
  VALID_CHANGE_TYPES,
  VALID_STATUSES,
  PLACEHOLDER_ISSUES,
  type ValidationError,
  type SpecType,
} from '@/types/spec';

/**
 * Get required fields based on spec_type.
 * Falls back to legacy REQUIRED_FIELDS if spec_type is not specified.
 */
const getRequiredFields = (specType: SpecType | undefined): readonly string[] => {
  if (specType === 'product') {
    return PRODUCT_SPEC_REQUIRED_FIELDS;
  }
  if (specType === 'tech') {
    return TECH_SPEC_REQUIRED_FIELDS;
  }
  // Legacy: no spec_type specified, use old required fields
  return REQUIRED_FIELDS;
};

/**
 * Validate a single spec file. Returns list of errors.
 */
const validateSpecFile = async (specPath: string): Promise<ReadonlyArray<ValidationError>> => {
  if (!(await exists(specPath))) {
    return [{ file: specPath, message: 'File not found' }];
  }

  const content = await readText(specPath);
  const fmResult = parseFrontmatter(content);

  if (!fmResult.found) {
    return [{ file: specPath, message: 'Missing frontmatter' }];
  }

  const fm = fmResult.data;

  // Check spec_type validity if present
  const specType = fm['spec_type'] as SpecType | undefined;
  const specTypeErrors: ReadonlyArray<ValidationError> =
    specType && !(VALID_SPEC_TYPES as readonly string[]).includes(specType)
      ? [{
          file: specPath,
          message: `Invalid spec_type '${specType}'. Must be one of: ${VALID_SPEC_TYPES.join(', ')}`,
        }]
      : [];

  // Check required fields based on spec_type
  const requiredFields = getRequiredFields(specType);
  const missingFieldErrors: ReadonlyArray<ValidationError> = requiredFields
    .filter((field) => !fm[field])
    .map((field) => ({ file: specPath, message: `Missing required field '${field}'` }));

  // Check change type validity for tech specs
  const changeType = fm['type'];
  const changeTypeErrors: ReadonlyArray<ValidationError> =
    specType === 'tech' && changeType && !(VALID_CHANGE_TYPES as readonly string[]).includes(changeType)
      ? [{
          file: specPath,
          message: `Invalid type '${changeType}'. Must be one of: ${VALID_CHANGE_TYPES.join(', ')}`,
        }]
      : [];

  // Check status validity
  const status = fm['status'];
  const statusErrors: ReadonlyArray<ValidationError> =
    status && !(VALID_STATUSES as readonly string[]).includes(status)
      ? [{
          file: specPath,
          message: `Invalid status '${status}'. Must be one of: ${VALID_STATUSES.join(', ')}`,
        }]
      : [];

  // Check issue placeholder (only for tech specs or legacy specs with issue field)
  const issue = fm['issue'];
  const issueErrors: ReadonlyArray<ValidationError> =
    issue && (PLACEHOLDER_ISSUES as readonly string[]).includes(issue)
      ? [{
          file: specPath,
          message: 'Issue field is placeholder. Must reference actual issue.',
        }]
      : [];

  return [
    ...specTypeErrors,
    ...missingFieldErrors,
    ...changeTypeErrors,
    ...statusErrors,
    ...issueErrors,
  ];
};

export const validateSpec = async (args: readonly string[]): Promise<CommandResult> => {
  const { named, positional } = parseNamedArgs(args);

  const all = named['all'] === 'true';
  const specsDir = named['specs-dir'] ?? 'specs/';
  const specPath = positional[0];

  if (all) {
    if (!(await directoryExists(specsDir))) {
      return {
        success: false,
        error: `Specs directory not found: ${specsDir}`,
      };
    }

    const specs = await findSpecFiles(specsDir);
    const validationResults = await Promise.all(specs.map((spec) => validateSpecFile(spec.path)));
    const allErrors = validationResults.flat();

    if (allErrors.length > 0) {
      const errorMessages = allErrors
        .map((error) => `  - ${error.file}: ${error.message}`)
        .join('\n');

      return {
        success: false,
        error: `Validation errors:\n${errorMessages}`,
        data: { errors: allErrors, totalSpecs: specs.length },
      };
    }

    return {
      success: true,
      message: `All ${specs.length} specs are valid`,
      data: { validatedSpecs: specs.length },
    };
  }

  if (specPath) {
    const errors = await validateSpecFile(specPath);
    if (errors.length > 0) {
      const errorMessages = errors.map((error) => `  - ${error.message}`).join('\n');
      return {
        success: false,
        error: `Validation errors:\n${errorMessages}`,
        data: { errors },
      };
    }
    return {
      success: true,
      message: `${specPath} is valid`,
    };
  }

  return {
    success: false,
    error: 'Usage: sdd-system spec validate <path-to-spec.md>\n       sdd-system spec validate --all --specs-dir specs/',
  };
};
