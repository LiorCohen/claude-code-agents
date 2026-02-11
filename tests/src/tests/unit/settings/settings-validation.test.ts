/**
 * Unit Tests: settings validation
 *
 * WHY: The validation system prevents invalid settings from being applied.
 * Incorrect validation would allow broken configurations that cause
 * scaffolding or runtime failures.
 */

import { describe, expect, it } from 'vitest';
import { PLUGIN_DIR, joinPath, readFile } from '@/lib';

const VALIDATE_PATH = joinPath(
  PLUGIN_DIR,
  'system',
  'src',
  'settings',
  'validate.ts'
);

/**
 * WHY: Verify the validation file exists and has expected structure.
 */
describe('validate.ts source file', () => {
  it('exists in plugin system/src/settings', () => {
    const content = readFile(VALIDATE_PATH);
    expect(content).toBeDefined();
    expect(content.length).toBeGreaterThan(0);
  });

  it('exports SettingsValidationError type', () => {
    const content = readFile(VALIDATE_PATH);
    expect(content).toContain('export type SettingsValidationError =');
    expect(content).toContain('readonly component?: string');
    expect(content).toContain('readonly field?: string');
    expect(content).toContain('readonly message: string');
  });

  it('exports SettingsValidationResult type', () => {
    const content = readFile(VALIDATE_PATH);
    expect(content).toContain('export type SettingsValidationResult =');
    expect(content).toContain('readonly valid: boolean');
    expect(content).toContain('readonly errors: readonly SettingsValidationError[]');
    expect(content).toContain('readonly warnings: readonly SettingsValidationError[]');
  });

  it('exports validateSettings function', () => {
    const content = readFile(VALIDATE_PATH);
    expect(content).toContain('export const validateSettings');
  });

  it('exports formatValidationResult function', () => {
    const content = readFile(VALIDATE_PATH);
    expect(content).toContain('export const formatValidationResult');
  });
});

/**
 * WHY: Verify validation covers required checks.
 */
describe('validation checks', () => {
  const content = readFile(VALIDATE_PATH);

  it('validates hybrid server modes', () => {
    // Hybrid servers must have 2+ modes
    expect(content).toContain('validateHybridServer');
    expect(content).toContain("server_type === 'hybrid'");
    expect(content).toContain('modes.length < 2');
  });

  it('validates database references', () => {
    // databases array must reference existing database components
    expect(content).toContain('databaseNames');
    expect(content).toContain('References non-existent database component');
  });

  it('validates contract references for servers', () => {
    // provides_contracts and consumes_contracts must reference existing contracts
    expect(content).toContain('contractNames');
    expect(content).toContain('provides_contracts');
    expect(content).toContain('consumes_contracts');
  });

  it('validates contract references for webapps', () => {
    // contracts array must reference existing contract components
    expect(content).toContain('isWebappComponent');
    expect(content).toContain('contracts');
  });

  it('validates helm chart references', () => {
    // deploys must reference an existing server/webapp
    expect(content).toContain('deploys');
    expect(content).toContain('serverNames');
    expect(content).toContain('webappNames');
  });

  it('validates helm chart can only deploy components with helm: true', () => {
    // Components with helm: false cannot be deployed
    expect(content).toContain('helm: false');
    expect(content).toContain('helm: true');
  });

  it('validates deploy_modes is subset of server modes', () => {
    // deploy_modes must be valid for the server being deployed
    expect(content).toContain('deploy_modes');
    expect(content).toContain('availableModes');
  });

  it('validates config component exists', () => {
    // Every project must have a config component
    expect(content).toContain('validateConfigExists');
    expect(content).toContain("type === 'config'");
  });

  it('validates naming conventions', () => {
    // Names must follow lowercase hyphenated pattern
    expect(content).toContain('validateNaming');
  });
});

/**
 * WHY: Verify warnings are generated for common issues.
 */
describe('validation warnings', () => {
  const content = readFile(VALIDATE_PATH);

  it('warns about servers with helm: true but no helm chart', () => {
    expect(content).toContain('generateWarnings');
    expect(content).toContain('serversWithHelm');
    expect(content).toContain('deployedServers');
    expect(content).toContain('no helm chart deploys it');
  });

  it('warns about webapps with helm: true but no helm chart', () => {
    expect(content).toContain('webappsWithHelm');
    expect(content).toContain('deployedWebapps');
  });
});
