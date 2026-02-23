/**
 * Tech pack install command.
 *
 * Supports three modes:
 * 1. --path <dir>: Install from local directory (mode: external)
 * 2. --repo <url> [--ref <ref>]: Clone from git into sdd/.techpacks/ (mode: git)
 * 3. No args: Reinstall all mode:git entries from sdd-settings.yaml
 *
 * Usage:
 *   sdd-system tech-pack install --path <tech-pack-dir>
 *   sdd-system tech-pack install --repo <git-url> [--ref <ref>]
 *   sdd-system tech-pack install
 */

import * as path from 'node:path';
import type { CommandResult } from '@/lib/args';
import { findProjectRoot } from '@/lib/config';
import { exists, readText } from '@/lib/fs';
import { join } from 'node:path';
import { writeFile, mkdir, rename, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import YAML from 'yaml';
import { validateTechPack } from './validate';

const execFileAsync = promisify(execFile);

type TechPackSettingsEntry = {
  readonly name: string;
  readonly namespace: string;
  readonly version: string;
  readonly mode: string;
  readonly repo?: string;
  readonly ref?: string;
  readonly install_path?: string;
  readonly path?: string;
};

/**
 * Install a tech pack from a local directory path (mode: external).
 */
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
  const techPack = manifest['techpack'] as Record<string, unknown>;
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
  const techPacks = (settings['techpacks'] as Record<string, unknown>) ?? {};

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
  };

  settings['techpacks'] = techPacks;

  // Step 5: Write updated settings
  await writeFile(settingsPath, YAML.stringify(settings), 'utf-8');

  return {
    success: true,
    message: `Installed tech pack "${name}" (${namespace}) v${version}`,
    data: { name, namespace, version, path: techPackDir },
  };
};

/**
 * Install a tech pack from a git repository (mode: git).
 * Clones into sdd/.techpacks/<namespace>/ and registers with install_path.
 */
export const installTechPackFromRepo = async (
  repoUrl: string,
  ref?: string,
): Promise<CommandResult> => {
  const projectRootResult = await findProjectRoot();
  if (!projectRootResult.found) {
    return { success: false, error: 'Not in an SDD project (no sdd/ or package.json found)' };
  }
  const projectRoot = projectRootResult.path;

  const techpacksDir = join(projectRoot, 'sdd', '.techpacks');
  const tmpDir = join(techpacksDir, '.tmp');

  // Step 1: Clone to temp directory
  await mkdir(tmpDir, { recursive: true });
  const cloneTarget = join(tmpDir, `clone-${Date.now()}`);

  try {
    await execFileAsync('git', ['clone', repoUrl, cloneTarget]);
  } catch (err) {
    return { success: false, error: `Git clone failed: ${(err as Error).message}` };
  }

  // Step 2: Checkout ref if provided
  if (ref) {
    try {
      await execFileAsync('git', ['checkout', ref], { cwd: cloneTarget });
    } catch (err) {
      await rm(cloneTarget, { recursive: true, force: true });
      return { success: false, error: `Git checkout "${ref}" failed: ${(err as Error).message}` };
    }
  }

  // Step 3: Read and validate manifest
  const manifestPath = join(cloneTarget, 'techpack', 'techpack.yaml');
  if (!(await exists(manifestPath))) {
    await rm(cloneTarget, { recursive: true, force: true });
    return { success: false, error: 'techpack/techpack.yaml not found in cloned repository' };
  }

  const validationResult = await validateTechPack(join(cloneTarget, 'techpack'));
  if (!validationResult.success) {
    await rm(cloneTarget, { recursive: true, force: true });
    return {
      success: false,
      error: `Cannot install — validation failed:\n${validationResult.error}`,
    };
  }

  const manifestContent = await readText(manifestPath);
  const manifest = YAML.parse(manifestContent) as Record<string, unknown>;
  const techPack = manifest['techpack'] as Record<string, unknown>;
  const name = techPack['name'] as string;
  const namespace = techPack['namespace'] as string;
  const version = techPack['version'] as string;

  // Step 4: Read settings
  let settingsPath = join(projectRoot, 'sdd', 'sdd-settings.yaml');
  if (!(await exists(settingsPath))) {
    settingsPath = join(projectRoot, '.sdd', 'sdd-settings.yaml');
  }

  if (!(await exists(settingsPath))) {
    await rm(cloneTarget, { recursive: true, force: true });
    return { success: false, error: 'sdd-settings.yaml not found — run init first' };
  }

  const settingsContent = await readText(settingsPath);
  const settings = YAML.parse(settingsContent) as Record<string, unknown>;
  const techPacks = (settings['techpacks'] as Record<string, unknown>) ?? {};

  if (namespace in techPacks) {
    await rm(cloneTarget, { recursive: true, force: true });
    return {
      success: false,
      error: `Tech pack "${namespace}" is already installed. Remove it first with: sdd-system tech-pack remove --namespace ${namespace}`,
    };
  }

  // Step 5: Move from tmp to final location
  const finalDir = join(techpacksDir, namespace);
  await mkdir(path.dirname(finalDir), { recursive: true });
  await rename(cloneTarget, finalDir);

  // Clean up tmp dir if empty
  await rm(tmpDir, { recursive: true, force: true }).catch(() => {});

  // Step 6: Register in settings
  const installPath = `sdd/.techpacks/${namespace}/techpack`;
  techPacks[namespace] = {
    name,
    namespace,
    version,
    mode: 'git',
    repo: repoUrl,
    ...(ref ? { ref } : {}),
    install_path: installPath,
  };

  settings['techpacks'] = techPacks;
  await writeFile(settingsPath, YAML.stringify(settings), 'utf-8');

  return {
    success: true,
    message: `Installed tech pack "${name}" (${namespace}) v${version} from ${repoUrl}${ref ? ` @ ${ref}` : ''}`,
    data: { name, namespace, version, repo: repoUrl, ref, install_path: installPath },
  };
};

/**
 * Reinstall all mode:git tech packs from sdd-settings.yaml.
 * Clones missing ones; skips existing.
 */
export const installAllFromSettings = async (): Promise<CommandResult> => {
  const projectRootResult = await findProjectRoot();
  if (!projectRootResult.found) {
    return { success: false, error: 'Not in an SDD project (no sdd/ or package.json found)' };
  }
  const projectRoot = projectRootResult.path;

  let settingsPath = join(projectRoot, 'sdd', 'sdd-settings.yaml');
  if (!(await exists(settingsPath))) {
    settingsPath = join(projectRoot, '.sdd', 'sdd-settings.yaml');
  }

  if (!(await exists(settingsPath))) {
    return { success: false, error: 'sdd-settings.yaml not found — run init first' };
  }

  const settingsContent = await readText(settingsPath);
  const settings = YAML.parse(settingsContent) as Record<string, unknown>;
  const techPacks = (settings['techpacks'] as Record<string, TechPackSettingsEntry>) ?? {};

  const gitEntries = Object.values(techPacks).filter((tp) => tp.mode === 'git');

  if (gitEntries.length === 0) {
    return { success: true, message: 'No git-mode tech packs to install' };
  }

  const results: string[] = [];
  const techpacksDir = join(projectRoot, 'sdd', '.techpacks');

  for (const entry of gitEntries) {
    const entryDir = join(techpacksDir, entry.namespace);
    if (await exists(entryDir)) {
      results.push(`  ${entry.namespace} — already present, skipped`);
      continue;
    }

    if (!entry.repo) {
      results.push(`  ${entry.namespace} — no repo URL, skipped`);
      continue;
    }

    try {
      await mkdir(techpacksDir, { recursive: true });
      await execFileAsync('git', ['clone', entry.repo, entryDir]);

      if (entry.ref) {
        await execFileAsync('git', ['checkout', entry.ref], { cwd: entryDir });
      }

      // Validate after clone
      const techpackSubdir = join(entryDir, 'techpack');
      if (await exists(join(techpackSubdir, 'techpack.yaml'))) {
        const validation = await validateTechPack(techpackSubdir);
        if (!validation.success) {
          results.push(`  ${entry.namespace} — cloned but validation failed: ${validation.error}`);
          continue;
        }
      }

      results.push(`  ${entry.namespace} — installed from ${entry.repo}${entry.ref ? ` @ ${entry.ref}` : ''}`);
    } catch (err) {
      results.push(`  ${entry.namespace} — clone failed: ${(err as Error).message}`);
    }
  }

  return {
    success: true,
    message: `Tech pack install results:\n${results.join('\n')}`,
    data: { installed: results.length },
  };
};
