/**
 * Tech pack install command.
 *
 * Validates a tech pack manifest, builds its system CLI,
 * and adds it to sdd-settings.yaml.
 *
 * Usage:
 *   sdd-system tech-pack install --path <tech-pack-dir>
 */

import * as path from 'node:path';
import type { CommandResult } from '@/lib/args';
import { findProjectRoot } from '@/lib/config';
import { exists, readText } from '@/lib/fs';
import { join } from 'node:path';
import { writeFile } from 'node:fs/promises';
import YAML from 'yaml';
import { validateTechPack } from './validate';

export const installTechPack = async (techPackPath: string): Promise<CommandResult> => {
  const projectRootResult = await findProjectRoot();
  if (!projectRootResult.found) {
    return { success: false, error: 'Not in an SDD project (no sdd/ or package.json found)' };
  }
  const projectRoot = projectRootResult.path;

  const techPackDir = path.resolve(techPackPath);

  // Step 1: Validate the manifest
  const validationResult = await validateTechPack(techPackDir);
  if (!validationResult.success) {
    return {
      success: false,
      error: `Cannot install — validation failed:\n${validationResult.error}`,
    };
  }

  // Step 2: Read manifest for registration
  const manifestContent = await readText(join(techPackDir, 'techpack.yaml'));
  const manifest = YAML.parse(manifestContent) as Record<string, unknown>;
  const techPack = manifest['tech_pack'] as Record<string, unknown>;
  const name = techPack['name'] as string;
  const namespace = techPack['namespace'] as string;
  const version = techPack['version'] as string;

  // Step 3: Read existing settings
  let settingsPath = join(projectRoot, 'sdd', 'sdd-settings.yaml');
  if (!(await exists(settingsPath))) {
    settingsPath = join(projectRoot, '.sdd', 'sdd-settings.yaml');
  }

  if (!(await exists(settingsPath))) {
    return { success: false, error: 'sdd-settings.yaml not found — run init first' };
  }

  const settingsContent = await readText(settingsPath);
  const settings = YAML.parse(settingsContent) as Record<string, unknown>;

  // Step 4: Add tech pack to settings
  const techPacks = (settings['tech_packs'] as Record<string, unknown>) ?? {};

  if (namespace in techPacks) {
    return {
      success: false,
      error: `Tech pack "${namespace}" is already installed. Remove it first with: sdd-system tech-pack remove --namespace ${namespace}`,
    };
  }

  techPacks[namespace] = {
    name,
    namespace,
    version,
    mode: 'external',
    path: techPackDir,
    components: [],
  };

  settings['tech_packs'] = techPacks;

  // Step 5: Write updated settings
  await writeFile(settingsPath, YAML.stringify(settings), 'utf-8');

  return {
    success: true,
    message: `Installed tech pack "${name}" (${namespace}) v${version}`,
    data: { name, namespace, version, path: techPackDir },
  };
};
