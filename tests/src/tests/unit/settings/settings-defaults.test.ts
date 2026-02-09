/**
 * Unit Tests: settings defaults
 *
 * WHY: Default settings are used when creating new components. Incorrect
 * defaults would result in broken scaffolding or invalid configurations.
 */

import { describe, expect, it } from 'vitest';
import { PLUGIN_DIR, joinPath, readFile } from '@/lib';

const DEFAULTS_PATH = joinPath(
  PLUGIN_DIR,
  'system',
  'src',
  'settings',
  'defaults.ts'
);

/**
 * WHY: Verify the source file exists and exports expected defaults.
 */
describe('defaults.ts source file', () => {
  it('exists in plugin system/src/settings', () => {
    const content = readFile(DEFAULTS_PATH);
    expect(content).toBeDefined();
    expect(content.length).toBeGreaterThan(0);
  });

  it('exports DEFAULT_API_SERVER_SETTINGS', () => {
    const content = readFile(DEFAULTS_PATH);
    expect(content).toContain('export const DEFAULT_API_SERVER_SETTINGS');
    expect(content).toContain("server_type: 'api'");
  });

  it('exports DEFAULT_WORKER_SERVER_SETTINGS', () => {
    const content = readFile(DEFAULTS_PATH);
    expect(content).toContain('export const DEFAULT_WORKER_SERVER_SETTINGS');
    expect(content).toContain("server_type: 'worker'");
  });

  it('exports DEFAULT_HYBRID_SERVER_SETTINGS', () => {
    const content = readFile(DEFAULTS_PATH);
    expect(content).toContain('export const DEFAULT_HYBRID_SERVER_SETTINGS');
    expect(content).toContain("server_type: 'hybrid'");
    expect(content).toContain("modes: ['api', 'worker']");
  });

  it('exports DEFAULT_WEBAPP_SETTINGS', () => {
    const content = readFile(DEFAULTS_PATH);
    expect(content).toContain('export const DEFAULT_WEBAPP_SETTINGS');
    // WebappSettings is an empty object - optional fields are omitted
    expect(content).toContain('DEFAULT_WEBAPP_SETTINGS: WebappSettings = {}');
  });

  it('exports DEFAULT_HELM_SERVER_SETTINGS', () => {
    const content = readFile(DEFAULTS_PATH);
    expect(content).toContain('export const DEFAULT_HELM_SERVER_SETTINGS');
    expect(content).toContain("deploy_type: 'server'");
    expect(content).toContain('ingress: true');
  });

  it('exports DEFAULT_HELM_WEBAPP_SETTINGS', () => {
    const content = readFile(DEFAULTS_PATH);
    expect(content).toContain('export const DEFAULT_HELM_WEBAPP_SETTINGS');
    expect(content).toContain("deploy_type: 'webapp'");
    expect(content).toContain("assets: 'bundled'");
  });

  it('exports DEFAULT_DATABASE_SETTINGS', () => {
    const content = readFile(DEFAULTS_PATH);
    expect(content).toContain('export const DEFAULT_DATABASE_SETTINGS');
    expect(content).toContain("provider: 'postgresql'");
    expect(content).toContain('dedicated: false');
  });

  it('exports DEFAULT_CONTRACT_SETTINGS', () => {
    const content = readFile(DEFAULTS_PATH);
    expect(content).toContain('export const DEFAULT_CONTRACT_SETTINGS');
    expect(content).toContain("visibility: 'internal'");
  });

  it('exports getDefaultServerSettings function', () => {
    const content = readFile(DEFAULTS_PATH);
    expect(content).toContain('export const getDefaultServerSettings');
  });
});

/**
 * WHY: Verify default values are appropriate.
 */
describe('default value appropriateness', () => {
  const content = readFile(DEFAULTS_PATH);

  it('server defaults omit optional array fields (default to empty)', () => {
    // Optional fields (databases, provides_contracts, consumes_contracts) are omitted
    // They default to [] at runtime via ?? [] fallbacks
    expect(content).toContain('DEFAULT_API_SERVER_SETTINGS');
    expect(content).toContain("server_type: 'api'");
    // Should NOT contain empty array initializations
    expect(content).not.toContain('databases: []');
  });

  it('webapp defaults omit optional fields', () => {
    // contracts field is optional and omitted from defaults
    expect(content).toContain('DEFAULT_WEBAPP_SETTINGS: WebappSettings = {}');
  });

  it('deployable components omit helm field (defaults to false)', () => {
    // helm field is optional and defaults to false
    // Components that need deployment should explicitly set helm: true
    expect(content).toContain('DEFAULT_API_SERVER_SETTINGS');
    expect(content).toContain('DEFAULT_WEBAPP_SETTINGS');
  });

  it('database defaults to non-dedicated (shared in local dev)', () => {
    expect(content).toContain('dedicated: false');
  });

  it('contract defaults to internal visibility', () => {
    expect(content).toContain("visibility: 'internal'");
  });
});
