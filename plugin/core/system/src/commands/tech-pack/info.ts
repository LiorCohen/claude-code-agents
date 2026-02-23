/**
 * Tech pack info command.
 *
 * Reads a tech pack's manifest and returns structured data.
 *
 * Usage:
 *   sdd-system tech-pack info --namespace <namespace>
 */

import * as path from 'node:path';
import type { CommandResult } from '@/lib/args';
import { findProjectRoot, getPluginRoot } from '@/lib/config';
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

/** Resolve the absolute path to a tech pack directory. */
const resolveTechPackDir = (entry: TechPackEntry, projectRoot: string): string => {
  if (entry.mode === 'internal') {
    return join(getPluginRoot(), entry.path);
  }
  if (entry.mode === 'git' && entry.install_path) {
    return join(projectRoot, entry.install_path);
  }
  return path.resolve(entry.path);
};

export const techPackInfo = async (namespace: string): Promise<CommandResult> => {
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

  const entry = techPacks[namespace];
  if (!entry) {
    return { success: false, error: `Tech pack "${namespace}" not found in settings` };
  }

  // Read the manifest
  const techPackDir = resolveTechPackDir(entry, projectRoot);
  const manifestPath = join(techPackDir, 'techpack.yaml');
  if (!(await exists(manifestPath))) {
    return { success: false, error: `techpack.yaml not found at ${manifestPath}` };
  }

  const manifestContent = await readText(manifestPath);
  const manifest = YAML.parse(manifestContent) as Record<string, unknown>;

  const techPack = manifest['techpack'] as Record<string, unknown>;
  const components = manifest['components'] as Record<string, Record<string, unknown>> | undefined;
  const commands = manifest['commands'] as Record<string, unknown> | undefined;
  const lifecycle = manifest['lifecycle'] as Record<string, unknown> | undefined;
  const documentation = manifest['documentation'] as Record<string, unknown> | undefined;

  const componentTypes = components ? Object.keys(components) : [];
  const commandList = Array.isArray(commands?.['available'])
    ? (commands['available'] as ReadonlyArray<Record<string, unknown>>).map((c) => c['name'] as string)
    : [];

  const data = {
    name: techPack['name'],
    namespace: techPack['namespace'],
    version: techPack['version'],
    description: techPack['description'],
    system_path: techPack['system_path'],
    component_types: componentTypes,
    commands: commandList,
    lifecycle: lifecycle ? Object.keys(lifecycle) : [],
    documentation: documentation ? Object.keys(documentation) : [],
    path: techPackDir,
  };

  return {
    success: true,
    message: `Tech pack: ${data.name} (${data.namespace}) v${data.version}\nComponents: ${componentTypes.join(', ')}\nCommands: ${commandList.length}`,
    data,
  };
};
