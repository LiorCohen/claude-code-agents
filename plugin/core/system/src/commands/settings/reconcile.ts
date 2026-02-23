/**
 * Settings reconcile action.
 *
 * Reads sdd/sdd-settings.yaml, runs reconciliation to migrate
 * older formats to the latest schema, and writes the result back.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { findProjectRoot } from '@/lib/config';
import type { ProjectRootResult } from '@/lib/config';
import { getPluginRoot } from '@/lib/config';
import { readJson } from '@/lib/fs';
import { reconcileSettings } from '@/settings/reconcile';
import type { ReconciliationChange, ReconciliationWarning, DefaultTechPack } from '@/settings/reconcile';

/** Format changes for human-readable output */
const formatChanges = (changes: readonly ReconciliationChange[]): string => {
  if (changes.length === 0) return '  (no changes needed)';
  return changes
    .map((c) => {
      const icon = c.type === 'removed' ? '\u2717' : '\u2713';
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
  return `\nDirectory warnings:\n${lines.join('\n')}`;
};

export const reconcile = async (
  _args: readonly string[],
  options: GlobalOptions
): Promise<CommandResult> => {
  // Find project root
  const projectRootResult: ProjectRootResult = await findProjectRoot();
  if (!projectRootResult.found) {
    return { success: false, error: 'Not in an SDD project (no sdd/ or package.json found)' };
  }
  const projectRoot = projectRootResult.path;

  // Read settings file (try sdd/ first, fall back to .sdd/ for legacy projects)
  const settingsPath = join(projectRoot, 'sdd', 'sdd-settings.yaml');
  const legacySettingsPath = join(projectRoot, '.sdd', 'sdd-settings.yaml');
  const rawContentResult = (() => {
    try {
      return { ok: true as const, content: readFileSync(settingsPath, 'utf-8'), path: settingsPath };
    } catch {
      // Fall back to legacy .sdd/ location
      try {
        return { ok: true as const, content: readFileSync(legacySettingsPath, 'utf-8'), path: legacySettingsPath };
      } catch {
        return { ok: false as const, path: settingsPath };
      }
    }
  })();

  if (!rawContentResult.ok) {
    return { success: false, error: `Settings file not found: ${settingsPath}` };
  }

  const rawContent = rawContentResult.content;
  const raw = YAML.parse(rawContent) as unknown;

  // Read current plugin version
  const pluginRoot = getPluginRoot();
  const pluginJsonPath = join(pluginRoot, '.claude-plugin', 'plugin.json');
  const pluginVersionResult = await (async () => {
    try {
      const pluginJson = await readJson<{ version: string }>(pluginJsonPath);
      return { ok: true as const, version: pluginJson.version };
    } catch {
      return { ok: false as const };
    }
  })();

  if (!pluginVersionResult.ok) {
    return { success: false, error: `Cannot read plugin version from: ${pluginJsonPath}` };
  }

  const pluginVersion = pluginVersionResult.version;

  // Discover installed tech pack for legacy component migration
  const defaultTechPack: DefaultTechPack | undefined = (() => {
    try {
      const entries = readdirSync(pluginRoot, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name === 'core' || entry.name.startsWith('.')) continue;
        const manifestPath = join(pluginRoot, entry.name, 'techpack.yaml');
        if (existsSync(manifestPath)) {
          const manifest = YAML.parse(readFileSync(manifestPath, 'utf-8')) as Record<string, unknown>;
          const ns = manifest.namespace as string | undefined;
          const name = manifest.name as string | undefined;
          if (ns && name) {
            return { name, namespace: ns, path: entry.name };
          }
        }
      }
    } catch { /* no tech pack found — use generic fallback */ }
    return undefined;
  })();

  // Run reconciliation
  const result = reconcileSettings(raw, pluginVersion, projectRoot, new Date(), defaultTechPack);

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

  // Write reconciled settings back (to the same path it was read from)
  const newYaml = YAML.stringify(result.settings, { lineWidth: 120 });
  writeFileSync(rawContentResult.path, headerComments + newYaml);

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
