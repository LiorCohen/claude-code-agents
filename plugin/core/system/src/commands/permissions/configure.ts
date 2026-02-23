/**
 * Permissions configure command.
 *
 * Merges SDD recommended permissions into the project's .claude/settings.local.json.
 *
 * Usage:
 *   sdd-system permissions configure
 */

import * as path from 'node:path';
import type { CommandResult } from '@/lib/args';
import { exists, readJson, writeJson, copyFile, ensureDir } from '@/lib/fs';
import { getPluginRoot, findProjectRoot } from '@/lib/config';
import type { ProjectRootResult } from '@/lib/config';

/**
 * Permission settings structure.
 */
type PermissionSettings = {
  readonly permissions?: {
    readonly allow?: readonly string[];
    readonly deny?: readonly string[];
  };
};

/**
 * Deep merge permission arrays, deduplicating entries.
 */
const mergePermissionArrays = (
  existing: readonly string[] | undefined,
  incoming: readonly string[] | undefined
): readonly string[] => {
  const existingItems = existing ?? [];
  const incomingItems = incoming ?? [];
  return [...new Set([...existingItems, ...incomingItems])];
};

/**
 * Merge two permission settings objects.
 * Arrays are concatenated and deduplicated.
 * User settings are preserved, SDD permissions are added.
 */
const mergePermissions = (
  existing: PermissionSettings,
  sddRecommended: PermissionSettings
): PermissionSettings => {
  const existingPerms = existing.permissions ?? {};
  const sddPerms = sddRecommended.permissions ?? {};

  return {
    ...existing,
    permissions: {
      allow: mergePermissionArrays(existingPerms.allow, sddPerms.allow),
      deny: mergePermissionArrays(existingPerms.deny, sddPerms.deny),
    },
  };
};

export const configurePermissions = async (): Promise<CommandResult> => {
  // Find project root
  const projectRootResult: ProjectRootResult = await findProjectRoot();
  const projectRoot = projectRootResult.found ? projectRootResult.path : process.cwd();

  // Paths
  const claudeDir = path.join(projectRoot, '.claude');
  const settingsPath = path.join(claudeDir, 'settings.local.json');
  const backupPath = path.join(claudeDir, 'settings.local.json.backup');

  // Get plugin root to find recommended permissions
  const pluginRoot = getPluginRoot();
  const recommendedPermissionsPath = path.join(pluginRoot, 'permissions', 'recommended-permissions.json');

  // Verify recommended permissions exist
  if (!(await exists(recommendedPermissionsPath))) {
    return {
      success: false,
      error: `Recommended permissions file not found: ${recommendedPermissionsPath}`,
    };
  }

  // Read SDD recommended permissions
  const sddPermissionsResult = await (async (): Promise<
    { readonly ok: true; readonly value: PermissionSettings } | { readonly ok: false; readonly error: string }
  > => {
    try {
      const value = await readJson<PermissionSettings>(recommendedPermissionsPath);
      return { ok: true, value };
    } catch (err) {
      return { ok: false, error: `Failed to read recommended permissions: ${err instanceof Error ? err.message : String(err)}` };
    }
  })();

  if (!sddPermissionsResult.ok) {
    return { success: false, error: sddPermissionsResult.error };
  }

  const sddPermissions = sddPermissionsResult.value;

  // Ensure .claude directory exists
  await ensureDir(claudeDir);

  // Read existing settings or create empty object
  const existingSettingsResult = await (async (): Promise<
    { readonly ok: true; readonly value: PermissionSettings } | { readonly ok: false; readonly error: string }
  > => {
    if (await exists(settingsPath)) {
      try {
        // Backup existing file first
        await copyFile(settingsPath, backupPath);
        console.log(`Backed up existing settings to ${backupPath}`);
        const value = await readJson<PermissionSettings>(settingsPath);
        return { ok: true, value };
      } catch (err) {
        return { ok: false, error: `Failed to read existing settings: ${err instanceof Error ? err.message : String(err)}` };
      }
    }
    return { ok: true, value: {} };
  })();

  if (!existingSettingsResult.ok) {
    return { success: false, error: existingSettingsResult.error };
  }

  const existingSettings = existingSettingsResult.value;

  // Merge permissions
  const mergedSettings = mergePermissions(existingSettings, sddPermissions);

  // Write merged settings
  try {
    await writeJson(settingsPath, mergedSettings);
  } catch (err) {
    return {
      success: false,
      error: `Failed to write settings: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const backupNote = (await exists(backupPath)) ? ' (backup saved)' : '';

  return {
    success: true,
    message: `Permissions configured in .claude/settings.local.json${backupNote}`,
    data: {
      settingsPath,
      backupPath: (await exists(backupPath)) ? backupPath : null,
      permissionsAdded: sddPermissions.permissions?.allow?.length ?? 0,
    },
  };
};
