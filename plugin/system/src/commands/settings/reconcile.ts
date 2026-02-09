/**
 * Settings reconcile action.
 *
 * Reads .sdd/sdd-settings.yaml, runs reconciliation to migrate
 * older formats to the latest schema, and writes the result back.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { findProjectRoot } from '@/lib/config';
import { getPluginRoot } from '@/lib/config';
import { readJson } from '@/lib/fs';
import { reconcileSettings } from '@/settings/reconcile';
import type { ReconciliationChange, ReconciliationWarning } from '@/settings/reconcile';

/** Format changes for human-readable output */
const formatChanges = (changes: readonly ReconciliationChange[]): string => {
  if (changes.length === 0) return '  (no changes needed)';
  return changes
    .map((c) => {
      const icon = c.type === 'removed' ? '✗' : '✓';
      return `  ${icon} ${c.detail}`;
    })
    .join('\n');
};

/** Format warnings for human-readable output */
const formatWarnings = (warnings: readonly ReconciliationWarning[]): string => {
  if (warnings.length === 0) return '';
  const lines = warnings.map((w) => {
    const prefix = w.component ? `Component "${w.component}"` : 'Directory';
    return `  - ${prefix}: ${w.message}`;
  });
  return `\n⚠ Directory warnings:\n${lines.join('\n')}`;
};

export const reconcile = async (
  _args: readonly string[],
  options: GlobalOptions
): Promise<CommandResult> => {
  // Find project root
  const projectRoot = await findProjectRoot();
  if (!projectRoot) {
    return { success: false, error: 'Not in an SDD project (no .sdd/ or package.json found)' };
  }

  // Read settings file
  const settingsPath = join(projectRoot, '.sdd', 'sdd-settings.yaml');
  let rawContent: string;
  try {
    rawContent = readFileSync(settingsPath, 'utf-8');
  } catch {
    return { success: false, error: `Settings file not found: ${settingsPath}` };
  }

  const raw = YAML.parse(rawContent) as unknown;

  // Read current plugin version
  const pluginRoot = getPluginRoot();
  const pluginJsonPath = join(pluginRoot, '.claude-plugin', 'plugin.json');
  let pluginVersion: string;
  try {
    const pluginJson = await readJson<{ version: string }>(pluginJsonPath);
    pluginVersion = pluginJson.version;
  } catch {
    return { success: false, error: `Cannot read plugin version from: ${pluginJsonPath}` };
  }

  // Run reconciliation
  const result = reconcileSettings(raw, pluginVersion, projectRoot);

  if (!result.valid) {
    return {
      success: false,
      error: `Reconciliation produced invalid settings:\n${result.validationErrors.join('\n')}`,
      data: options.json ? { changes: result.changes, errors: result.validationErrors } : undefined,
    };
  }

  // Preserve header comments from original file
  const headerMatch = rawContent.match(/^((?:#[^\n]*\n)*)/);
  const headerComments = headerMatch?.[1] ?? '';

  // Write reconciled settings back
  const newYaml = YAML.stringify(result.settings, { lineWidth: 120 });
  writeFileSync(settingsPath, headerComments + newYaml);

  // Format output
  if (options.json) {
    return {
      success: true,
      data: {
        version: pluginVersion,
        changes: result.changes,
        warnings: result.warnings,
        valid: result.valid,
      },
    };
  }

  const message = [
    `Settings reconciled to v${pluginVersion}:`,
    formatChanges(result.changes),
    formatWarnings(result.warnings),
  ]
    .filter(Boolean)
    .join('\n');

  return { success: true, message };
};
