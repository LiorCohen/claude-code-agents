/**
 * Tech pack list command.
 *
 * Reads sdd-settings.yaml and lists installed tech packs.
 *
 * Usage:
 *   sdd-system tech-pack list
 */

import type { CommandResult } from '@/lib/args';
import { findProjectRoot } from '@/lib/config';
import { exists, readText } from '@/lib/fs';
import { join } from 'node:path';
import YAML from 'yaml';

type TechPackEntry = {
  readonly name: string;
  readonly namespace: string;
  readonly version: string;
  readonly mode: string;
  readonly path: string;
  readonly install_path?: string;
  readonly repo?: string;
  readonly ref?: string;
};

export const listTechPacks = async (): Promise<CommandResult> => {
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

  const content = await readText(settingsPath);
  const settings = YAML.parse(content) as Record<string, unknown>;

  const techPacks = (settings['techpacks'] as Record<string, TechPackEntry> | undefined) ?? {};
  const entries = Object.values(techPacks);

  if (entries.length === 0) {
    return {
      success: true,
      message: 'No tech packs installed',
      data: { techpacks: [] },
    };
  }

  const lines = entries.map(
    (tp) => `  ${tp.namespace} — ${tp.name} v${tp.version} (${tp.mode})`
  );

  return {
    success: true,
    message: `Installed tech packs:\n${lines.join('\n')}`,
    data: { techpacks: entries },
  };
};
