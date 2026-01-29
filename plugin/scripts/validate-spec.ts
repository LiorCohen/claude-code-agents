#!/usr/bin/env npx ts-node --esm
/**
 * Validate spec files for required fields and format.
 *
 * Usage: npx ts-node --esm validate-spec.ts <path-to-spec.md>
 *        npx ts-node --esm validate-spec.ts --all --specs-dir specs/
 */

import * as fs from 'node:fs/promises';
import { parseFrontmatter } from './lib/frontmatter.js';
import { findSpecFiles, directoryExists } from './lib/spec-utils.js';

const REQUIRED_FIELDS = ['title', 'status', 'domain', 'issue', 'created', 'updated'] as const;
const VALID_STATUSES = ['active', 'deprecated', 'superseded', 'archived'] as const;
const PLACEHOLDER_ISSUES = ['PROJ-XXX', '[PROJ-XXX]', 'TODO', '', '{{ISSUE}}'] as const;

interface ValidationError {
  readonly file: string;
  readonly message: string;
}

/**
 * Validate a spec file. Returns list of errors.
 */
const validateSpec = async (specPath: string): Promise<readonly ValidationError[]> => {
  try {
    await fs.access(specPath);
  } catch {
    return [{ file: specPath, message: 'File not found' }];
  }

  const content = await fs.readFile(specPath, 'utf-8');
  const fm = parseFrontmatter(content);

  if (!fm) {
    return [{ file: specPath, message: 'Missing frontmatter' }];
  }

  // Check required fields
  const missingFieldErrors: readonly ValidationError[] = REQUIRED_FIELDS
    .filter((field) => !fm[field])
    .map((field) => ({ file: specPath, message: `Missing required field '${field}'` }));

  // Check status validity
  const status = fm['status'];
  const statusErrors: readonly ValidationError[] =
    status && !(VALID_STATUSES as readonly string[]).includes(status)
      ? [{ file: specPath, message: `Invalid status '${status}'. Must be one of: ${VALID_STATUSES.join(', ')}` }]
      : [];

  // Check issue placeholder
  const issue = fm['issue'];
  const issueErrors: readonly ValidationError[] =
    issue && (PLACEHOLDER_ISSUES as readonly string[]).includes(issue)
      ? [{ file: specPath, message: 'Issue field is placeholder. Must reference actual issue.' }]
      : [];

  return [...missingFieldErrors, ...statusErrors, ...issueErrors];
};

/**
 * Parse command line arguments.
 */
const parseArgs = (args: readonly string[]): { all: boolean; specsDir: string; path?: string } => {
  const all = args.includes('--all');
  const specsDirIndex = args.indexOf('--specs-dir');
  const specsDir = specsDirIndex !== -1 ? (args[specsDirIndex + 1] ?? 'specs/') : 'specs/';
  const specPath = args.find((arg) => !arg.startsWith('-') && arg !== args[specsDirIndex + 1]);

  return { all, specsDir, path: specPath };
};

const main = async (): Promise<number> => {
  const args = parseArgs(process.argv.slice(2));

  if (args.all) {
    if (!(await directoryExists(args.specsDir))) {
      console.error(`Error: Specs directory not found: ${args.specsDir}`);
      return 1;
    }

    const specs = await findSpecFiles(args.specsDir);

    // Validate all specs and collect errors
    const validationResults = await Promise.all(specs.map((spec) => validateSpec(spec.path)));
    const allErrors = validationResults.flat();

    if (allErrors.length > 0) {
      console.log('Validation errors:');
      allErrors.forEach((error) => {
        console.log(`  - ${error.file}: ${error.message}`);
      });
      return 1;
    }

    console.log(`✓ All ${specs.length} specs are valid`);
    return 0;
  }

  if (args.path) {
    const errors = await validateSpec(args.path);
    if (errors.length > 0) {
      console.log('Validation errors:');
      errors.forEach((error) => {
        console.log(`  - ${error.message}`);
      });
      return 1;
    }
    console.log(`✓ ${args.path} is valid`);
    return 0;
  }

  console.log('Usage: validate-spec.ts <path-to-spec.md>');
  console.log('       validate-spec.ts --all --specs-dir specs/');
  return 1;
};

main()
  .then(process.exit)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
