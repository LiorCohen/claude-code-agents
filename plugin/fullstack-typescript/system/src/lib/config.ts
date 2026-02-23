/**
 * Configuration loading utilities for the CLI.
 */

import * as path from 'node:path';
import { readJson, exists } from './fs';

/**
 * SDD project configuration from sdd/sdd-settings.yaml or package.json.
 */
export type SddConfig = {
  readonly projectName: string;
  readonly specsDir: string;
  readonly componentsDir: string;
}

/**
 * Get the plugin root directory from environment or derive from current file.
 */
export const getPluginRoot = (): string => {
  // First check environment variable
  const envRoot = process.env['CLAUDE_PLUGIN_ROOT'];
  if (envRoot) {
    return envRoot;
  }

  // Derive from this file's location: plugin/system/src/lib/config.ts -> plugin/
  // In dist: plugin/system/dist/lib/config.js -> plugin/
  const currentDir = path.dirname(new URL(import.meta.url).pathname);

  // Go up from src/lib or dist/lib to plugin/
  return path.resolve(currentDir, '..', '..', '..');
};

/**
 * Get the skills directory.
 */
export const getSkillsDir = (): string => {
  return path.join(getPluginRoot(), 'skills');
};

/**
 * Load project configuration from the target directory.
 */
export type ConfigResult =
  | { readonly found: true; readonly config: SddConfig }
  | { readonly found: false };

export const loadProjectConfig = async (targetDir: string): Promise<ConfigResult> => {
  const packageJsonPath = path.join(targetDir, 'package.json');

  if (!(await exists(packageJsonPath))) {
    return { found: false };
  }

  try {
    const pkg = await readJson<{ name?: string }>(packageJsonPath);
    return {
      found: true,
      config: {
        projectName: pkg.name ?? path.basename(targetDir),
        specsDir: path.join(targetDir, 'specs'),
        componentsDir: path.join(targetDir, 'components'),
      },
    };
  } catch {
    return { found: false };
  }
};

/**
 * Find the project root by looking for package.json or sdd/sdd-settings.yaml.
 * Checks sdd/ first, then .sdd/ (legacy), then falls back to root-level sdd-settings.yaml.
 */
export type ProjectRootResult =
  | { readonly found: true; readonly path: string }
  | { readonly found: false };

export const findProjectRoot = async (startDir: string = process.cwd()): Promise<ProjectRootResult> => {
  const root = path.parse(startDir).root;

  const search = async (dir: string): Promise<ProjectRootResult> => {
    if (dir === root) return { found: false };

    const packageJsonPath = path.join(dir, 'package.json');
    const sddSettingsPath = path.join(dir, 'sdd', 'sdd-settings.yaml');
    const legacySddSettingsPath = path.join(dir, '.sdd', 'sdd-settings.yaml');
    const legacyRootSettingsPath = path.join(dir, 'sdd-settings.yaml');

    // Check package.json or sdd/ location
    if ((await exists(packageJsonPath)) || (await exists(sddSettingsPath))) {
      return { found: true, path: dir };
    }

    // Legacy fallback: .sdd/ directory (old hidden directory convention)
    if (await exists(legacySddSettingsPath)) {
      console.warn(
        '[SDD] Deprecation warning: .sdd/ directory is deprecated. ' +
          'Rename to sdd/: mv .sdd sdd'
      );
      return { found: true, path: dir };
    }

    // Legacy fallback: sdd-settings.yaml at project root
    if (await exists(legacyRootSettingsPath)) {
      console.warn(
        '[SDD] Deprecation warning: sdd-settings.yaml at project root is deprecated. ' +
          'Move it to sdd/sdd-settings.yaml: mkdir -p sdd && mv sdd-settings.yaml sdd/'
      );
      return { found: true, path: dir };
    }

    return search(path.dirname(dir));
  };

  return search(startDir);
};
