/**
 * Tech pack remove command.
 *
 * Removes a tech pack from sdd-settings.yaml.
 * Warns if there are configured components using the tech pack.
 *
 * Usage:
 *   sdd-system tech-pack remove --namespace <namespace>
 */

import type { CommandResult } from '@/lib/args';
import { findProjectRoot } from '@/lib/config';
import { exists, readText } from '@/lib/fs';
import { join } from 'node:path';
import { writeFile } from 'node:fs/promises';
import YAML from 'yaml';

type TechPackEntry = {
  readonly name: string;
  readonly namespace: string;
  readonly version: string;
  readonly mode: string;
  readonly path: string;
};

type ComponentEntry = {
  readonly type: string;
  readonly techpack: string;
  readonly directory: string;
};

export const removeTechPack = async (namespace: string): Promise<CommandResult> => {
  const projectRootResult = await findProjectRoot();
  if (!projectRootResult.found) {
    return { success: false, error: 'Not in an SDD project (no sdd/ or package.json found)' };
  }
  const projectRoot = projectRootResult.path;

  // Try new sdd/ location first, fall back to .sdd/
  let settingsPath = join(projectRoot, 'sdd', 'sdd-settings.yaml');
  if (!(await exists(settingsPath))) {
    settingsPath = join(projectRoot, '.sdd', 'sdd-settings.yaml');
  }

  if (!(await exists(settingsPath))) {
    return { success: false, error: 'sdd-settings.yaml not found' };
  }

  const settingsContent = await readText(settingsPath);
  const settings = YAML.parse(settingsContent) as Record<string, unknown>;
  const techPacks = (settings['techpacks'] as Record<string, TechPackEntry>) ?? {};

  const entry = techPacks[namespace];
  if (!entry) {
    return { success: false, error: `Tech pack "${namespace}" is not installed` };
  }

  // Count components belonging to this tech pack from top-level components map
  const components = (settings['components'] as Record<string, ComponentEntry>) ?? {};
  const componentCount = Object.values(components).filter((c) => c.techpack === namespace).length;

  const warnings: string[] = [];
  if (componentCount > 0) {
    warnings.push(
      `Warning: ${componentCount} component(s) are configured using this tech pack. ` +
      `They will remain in the project but will no longer be managed.`
    );
  }

  // Remove from settings
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete (techPacks as Record<string, unknown>)[namespace];
  settings['techpacks'] = techPacks;

  await writeFile(settingsPath, YAML.stringify(settings), 'utf-8');

  const warningText = warnings.length > 0 ? `\n${warnings.join('\n')}` : '';

  return {
    success: true,
    message: `Removed tech pack "${entry.name}" (${namespace})${warningText}`,
    data: { name: entry.name, namespace, removed_components: componentCount },
  };
};
