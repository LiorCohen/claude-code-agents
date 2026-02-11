/**
 * Version bump command.
 *
 * Bumps the version in plugin.json and marketplace.json.
 *
 * Usage:
 *   sdd-system version bump <major|minor|patch>
 */

import * as path from 'node:path';
import type { CommandResult } from '@/lib/args';
import { exists, readJson, writeJson } from '@/lib/fs';
import { getPluginRoot } from '@/lib/config';
import type { PluginJson, MarketplaceJson, VersionInfo } from '@/types/config';

const BUMP_TYPES = ['major', 'minor', 'patch'] as const;
type BumpType = (typeof BUMP_TYPES)[number];

/**
 * Parse a version string into components.
 */
type ParseVersionResult =
  | { readonly parsed: true; readonly version: VersionInfo }
  | { readonly parsed: false };

const parseVersion = (version: string): ParseVersionResult => {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return { parsed: false };

  return {
    parsed: true,
    version: {
      major: parseInt(match[1] ?? '0', 10),
      minor: parseInt(match[2] ?? '0', 10),
      patch: parseInt(match[3] ?? '0', 10),
    },
  };
};

/**
 * Format version components into a string.
 */
const formatVersion = (info: VersionInfo): string =>
  `${info.major}.${info.minor}.${info.patch}`;

/**
 * Calculate the new version based on bump type.
 */
const bumpVersionNumber = (current: VersionInfo, type: BumpType): VersionInfo => {
  switch (type) {
    case 'major':
      return { major: current.major + 1, minor: 0, patch: 0 };
    case 'minor':
      return { major: current.major, minor: current.minor + 1, patch: 0 };
    case 'patch':
      return { major: current.major, minor: current.minor, patch: current.patch + 1 };
  }
};

export const bumpVersion = async (args: readonly string[]): Promise<CommandResult> => {
  const bumpType = args[0] ?? 'patch';

  if (!BUMP_TYPES.includes(bumpType as BumpType)) {
    return {
      success: false,
      error: `Invalid bump type: ${bumpType}. Must be one of: ${BUMP_TYPES.join(', ')}`,
    };
  }

  // Determine paths relative to plugin root
  const pluginRoot = getPluginRoot();
  const repoRoot = path.resolve(pluginRoot, '..');

  const pluginJsonPath = path.join(pluginRoot, '.claude-plugin', 'plugin.json');
  const marketplaceJsonPath = path.join(repoRoot, '.claude-plugin', 'marketplace.json');

  // Verify files exist
  if (!(await exists(pluginJsonPath))) {
    return {
      success: false,
      error: `Plugin file not found: ${pluginJsonPath}`,
    };
  }

  if (!(await exists(marketplaceJsonPath))) {
    return {
      success: false,
      error: `Marketplace file not found: ${marketplaceJsonPath}`,
    };
  }

  // Read current version
  const pluginJson = await readJson<PluginJson>(pluginJsonPath);
  const currentVersion = pluginJson.version;

  if (!currentVersion) {
    return {
      success: false,
      error: 'Could not read current version from plugin.json',
    };
  }

  const parseResult = parseVersion(currentVersion);
  if (!parseResult.parsed) {
    return {
      success: false,
      error: `Invalid version format: ${currentVersion}`,
    };
  }

  // Calculate new version
  const newVersionInfo = bumpVersionNumber(parseResult.version, bumpType as BumpType);
  const newVersion = formatVersion(newVersionInfo);

  console.log(`Current version: ${currentVersion}`);
  console.log(`New version: ${newVersion}`);

  // Update plugin.json
  const updatedPluginJson = { ...pluginJson, version: newVersion };
  await writeJson(pluginJsonPath, updatedPluginJson);
  console.log(`Updated ${pluginJsonPath}`);

  // Update marketplace.json
  const marketplaceJson = await readJson<MarketplaceJson>(marketplaceJsonPath);
  const updatedMarketplaceJson = {
    ...marketplaceJson,
    plugins: marketplaceJson.plugins.map((plugin, index) =>
      index === 0 ? { ...plugin, version: newVersion } : plugin
    ),
  };
  await writeJson(marketplaceJsonPath, updatedMarketplaceJson);
  console.log(`Updated ${marketplaceJsonPath}`);

  return {
    success: true,
    message: `Version bump complete: ${currentVersion} -> ${newVersion}`,
    data: {
      previousVersion: currentVersion,
      newVersion,
      bumpType,
      updatedFiles: [pluginJsonPath, marketplaceJsonPath],
    },
  };
};
