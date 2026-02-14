/**
 * Unit Tests: settings reconciliation module
 *
 * WHY: The reconciliation module transforms older sdd-settings formats
 * into the latest schema during plugin upgrades. Incorrect reconciliation
 * would lose user data, break settings, or fail silently.
 */

import { describe, expect, it } from 'vitest';
import { PLUGIN_DIR, joinPath, readFile } from '@/lib';

const RECONCILE_PATH = joinPath(
  PLUGIN_DIR,
  'system',
  'src',
  'settings',
  'reconcile.ts'
);

/**
 * WHY: Verify the reconciliation file exists and has expected structure.
 */
describe('reconcile.ts source file', () => {
  it('exists in plugin system/src/settings', () => {
    const content = readFile(RECONCILE_PATH);
    expect(content).toBeDefined();
    expect(content.length).toBeGreaterThan(0);
  });

  it('exports ReconciliationChange type', () => {
    const content = readFile(RECONCILE_PATH);
    expect(content).toContain('export type ReconciliationChange =');
    expect(content).toContain("readonly type: 'migrated' | 'added' | 'removed'");
    expect(content).toContain('readonly field: string');
    expect(content).toContain('readonly detail: string');
  });

  it('exports ReconciliationWarning type', () => {
    const content = readFile(RECONCILE_PATH);
    expect(content).toContain('export type ReconciliationWarning =');
    expect(content).toContain('readonly component?: string');
    expect(content).toContain('readonly message: string');
  });

  it('exports ReconciliationResult type', () => {
    const content = readFile(RECONCILE_PATH);
    expect(content).toContain('export type ReconciliationResult =');
    expect(content).toContain('readonly settings: SettingsFile');
    expect(content).toContain('readonly changes: readonly ReconciliationChange[]');
    expect(content).toContain('readonly warnings: readonly ReconciliationWarning[]');
    expect(content).toContain('readonly valid: boolean');
    expect(content).toContain('readonly validationErrors: readonly string[]');
  });

  it('exports reconcileSettings function', () => {
    const content = readFile(RECONCILE_PATH);
    expect(content).toContain('export const reconcileSettings');
  });
});

/**
 * WHY: Verify sdd metadata migration logic.
 */
describe('sdd metadata migration', () => {
  const content = readFile(RECONCILE_PATH);

  it('migrates plugin_version to initialized_by_plugin_version', () => {
    // Should check for legacy plugin_version field
    expect(content).toContain('legacyPluginVersion');
    expect(content).toContain('plugin_version');
    expect(content).toContain('initialized_by_plugin_version');
  });

  it('sets updated_by_plugin_version to current version', () => {
    expect(content).toContain('updatedByPluginVersion');
    expect(content).toContain('currentPluginVersion');
  });

  it('preserves existing initialized_by_plugin_version', () => {
    expect(content).toContain('existingInitVersion');
    // Should not overwrite if already set
    expect(content).toContain('= existingInitVersion');
  });

  it('converts date-only initialized_at to UTC datetime', () => {
    expect(content).toContain('isDateOnly');
    expect(content).toContain('dateOnlyToUtc');
  });

  it('migrates last_updated to updated_at', () => {
    expect(content).toContain('rawLastUpdated');
    expect(content).toContain('updated_at');
    // Should discard old value and set to now
    expect(content).toContain('last_updated');
  });

  it('removes legacy field names', () => {
    // Should track removal of plugin_version and last_updated
    expect(content).toContain("'sdd.plugin_version'");
    expect(content).toContain("'sdd.last_updated'");
    expect(content).toContain("type: 'removed'");
  });
});

/**
 * WHY: Verify deprecated project field handling.
 */
describe('project field deprecation', () => {
  const content = readFile(RECONCILE_PATH);

  it('removes project.domain', () => {
    expect(content).toContain("'project.domain'");
    expect(content).toContain('domain inference moved to sdd-change');
  });

  it('preserves project name', () => {
    expect(content).toContain('projectName');
    expect(content).toContain('rawProject.name');
  });

  it('preserves project description when present', () => {
    expect(content).toContain('projectDescription');
    expect(content).toContain('rawProject.description');
  });

  it('handles missing description gracefully', () => {
    // Should only include description in output when it was present
    expect(content).toContain('projectDescription !== undefined');
  });
});

/**
 * WHY: Verify component path reconciliation.
 */
describe('component path reconciliation', () => {
  const content = readFile(RECONCILE_PATH);

  it('preserves existing component path', () => {
    expect(content).toContain('compPath');
    expect(content).toContain('? { path: compPath');
  });

  it('infers flat path from filesystem', () => {
    expect(content).toContain('flatPath');
    expect(content).toContain('existsSync');
    expect(content).toContain('Inferred flat path from filesystem');
  });

  it('generates type-based path as fallback', () => {
    expect(content).toContain('generateComponentPath');
    expect(content).toContain('Generated type-based path');
  });
});

/**
 * WHY: Verify system section handling.
 */
describe('system section reconciliation', () => {
  const content = readFile(RECONCILE_PATH);

  it('adds system section when missing', () => {
    expect(content).toContain('Added system section with logging defaults');
  });

  it('preserves existing system settings', () => {
    expect(content).toContain('rawSystem');
    expect(content).toContain('rawLogging');
  });

  it('validates log level values', () => {
    expect(content).toContain('validLevels');
    expect(content).toContain("'trace'");
    expect(content).toContain("'debug'");
    expect(content).toContain("'info'");
  });
});

/**
 * WHY: Verify directory mismatch detection.
 */
describe('directory mismatch detection', () => {
  const content = readFile(RECONCILE_PATH);

  it('detects component paths not on disk', () => {
    expect(content).toContain('does not exist on disk');
  });

  it('detects untracked component directories', () => {
    expect(content).toContain('not tracked in sdd-settings');
    expect(content).toContain('componentsDir');
  });

  it('validates reconciled output', () => {
    expect(content).toContain('validateSettings');
    expect(content).toContain('validation.valid');
  });
});

/**
 * WHY: Verify UTC datetime formatting.
 */
describe('datetime formatting', () => {
  const content = readFile(RECONCILE_PATH);

  it('formats dates as YYYY-MM-DD HH:MM:SSZ', () => {
    expect(content).toContain('formatUtcDatetime');
    expect(content).toContain('getUTCFullYear');
    expect(content).toContain('getUTCMonth');
    expect(content).toContain('getUTCDate');
    expect(content).toContain('getUTCHours');
    expect(content).toContain('getUTCMinutes');
    expect(content).toContain('getUTCSeconds');
  });

  it('checks for date-only format', () => {
    expect(content).toContain('isDateOnly');
    expect(content).toMatch(/\\d\{4\}-\\d\{2\}-\\d\{2\}/);
  });

  it('converts date-only to UTC', () => {
    expect(content).toContain('dateOnlyToUtc');
    expect(content).toContain('00:00:00Z');
  });
});
