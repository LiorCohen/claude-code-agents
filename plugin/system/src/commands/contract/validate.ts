/**
 * Contract validate command.
 *
 * Validate OpenAPI spec using Spectral.
 *
 * Usage:
 *   sdd-system contract validate <component-name>
 */

import { execSync } from 'node:child_process';
import * as path from 'node:path';
import type { CommandResult } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { exists } from '@/lib/fs';
import { findProjectRoot } from '@/lib/config';

export const validate = async (
  componentName: string,
  args: readonly string[]
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);

  // Find project root
  const projectRootResult = await findProjectRoot();
  if (!projectRootResult.found) {
    return {
      success: false,
      error: 'Could not find project root (no package.json found)',
    };
  }
  const projectRoot = projectRootResult.path;

  // Find component directory
  const componentDir = path.join(projectRoot, 'components', componentName);

  if (!(await exists(componentDir))) {
    return {
      success: false,
      error: `Component directory not found: ${componentDir}`,
    };
  }

  // Determine spec file location
  const specFile = named['spec'] ?? path.join(componentDir, 'openapi.yaml');
  if (!(await exists(specFile))) {
    return {
      success: false,
      error: `OpenAPI spec not found: ${specFile}`,
    };
  }

  console.log(`Validating OpenAPI spec: ${specFile}`);
  console.log('');

  try {
    // Run Spectral
    // This assumes @stoplight/spectral-cli is installed in the project
    execSync(`npx spectral lint "${specFile}"`, {
      stdio: 'inherit',
      cwd: projectRoot,
    });

    console.log('');
    console.log('Validation passed!');

    return {
      success: true,
      message: 'OpenAPI spec is valid',
      data: { specFile },
    };
  } catch (err) {
    // Spectral returns non-zero exit code on validation errors
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Check if it's a validation error (exit code 1) or execution error
    if (errorMessage.includes('exit code 1')) {
      return {
        success: false,
        error: 'OpenAPI spec validation failed (see errors above)',
        data: { specFile },
      };
    }

    return {
      success: false,
      error: `Validation failed: ${errorMessage}`,
    };
  }
};
