/**
 * Path constants for test infrastructure.
 */

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const LIB_DIR = __dirname;
export const SRC_DIR = path.resolve(LIB_DIR, '..');
export const TESTS_ROOT_DIR = path.resolve(SRC_DIR, '..');
export const REPO_ROOT = path.resolve(TESTS_ROOT_DIR, '..');
export const PLUGIN_DIR = path.join(REPO_ROOT, 'plugin');
export const CORE_SKILLS_DIR = path.join(PLUGIN_DIR, 'core', 'skills');
export const TECH_SKILLS_DIR = path.join(PLUGIN_DIR, 'fullstack-typescript', 'skills');
export const TECH_PACK_DIR = path.join(PLUGIN_DIR, 'fullstack-typescript');
export const TEST_OUTPUT_DIR = process.env['TEST_OUTPUT_DIR'] ?? '/tmp/sdd-tests';
