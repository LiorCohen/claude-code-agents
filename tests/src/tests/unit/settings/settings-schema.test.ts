/**
 * Unit Tests: settings JSON schema
 *
 * WHY: The JSON schema validates settings files. Incorrect schema
 * would allow invalid settings or reject valid ones.
 */

import { describe, expect, it } from 'vitest';
import { PLUGIN_DIR, joinPath, readFile } from '@/lib';

const SCHEMA_PATH = joinPath(
  PLUGIN_DIR,
  'system',
  'src',
  'settings',
  'schema.ts'
);

/**
 * WHY: Verify the schema file exists and has expected structure.
 */
describe('schema.ts source file', () => {
  it('exists in plugin system/src/settings', () => {
    const content = readFile(SCHEMA_PATH);
    expect(content).toBeDefined();
    expect(content.length).toBeGreaterThan(0);
  });

  it('exports settingsFileSchema', () => {
    const content = readFile(SCHEMA_PATH);
    expect(content).toContain('export const settingsFileSchema');
  });

  it('exports schemas object', () => {
    const content = readFile(SCHEMA_PATH);
    expect(content).toContain('export const schemas');
  });
});

/**
 * WHY: Verify schema covers all required component types.
 */
describe('component type schemas', () => {
  const content = readFile(SCHEMA_PATH);

  it('defines serverSettingsSchema', () => {
    expect(content).toContain('serverSettingsSchema');
  });

  it('defines webappSettingsSchema', () => {
    expect(content).toContain('webappSettingsSchema');
  });

  it('defines helmServerSettingsSchema', () => {
    expect(content).toContain('helmServerSettingsSchema');
  });

  it('defines helmWebappSettingsSchema', () => {
    expect(content).toContain('helmWebappSettingsSchema');
  });

  it('defines databaseSettingsSchema', () => {
    expect(content).toContain('databaseSettingsSchema');
  });

  it('defines contractSettingsSchema', () => {
    expect(content).toContain('contractSettingsSchema');
  });

  it('defines configSettingsSchema', () => {
    expect(content).toContain('configSettingsSchema');
  });
});

/**
 * WHY: Verify server settings schema has required fields.
 */
describe('server settings schema', () => {
  const content = readFile(SCHEMA_PATH);

  it('requires server_type field', () => {
    expect(content).toContain("'server_type'");
  });

  it('validates server_type enum values', () => {
    expect(content).toContain("'api'");
    expect(content).toContain("'worker'");
    expect(content).toContain("'cron'");
    expect(content).toContain("'hybrid'");
  });

  it('requires modes for hybrid servers', () => {
    expect(content).toContain("const: 'hybrid'");
    expect(content).toContain("'modes'");
    expect(content).toContain('minItems: 2');
  });

  it('defines optional databases array', () => {
    expect(content).toContain('databases:');
    expect(content).toContain('default: []');
  });

  it('defines optional provides_contracts array', () => {
    expect(content).toContain('provides_contracts:');
    expect(content).toContain('default: []');
  });

  it('defines optional consumes_contracts array', () => {
    expect(content).toContain('consumes_contracts:');
    expect(content).toContain('default: []');
  });

  it('defines optional helm boolean', () => {
    expect(content).toContain('helm:');
    expect(content).toContain('default: false');
  });
});

/**
 * WHY: Verify helm settings schema has required fields.
 */
describe('helm settings schema', () => {
  const content = readFile(SCHEMA_PATH);

  it('requires deploys field', () => {
    expect(content).toContain("'deploys'");
  });

  it('requires deploy_type field', () => {
    expect(content).toContain("'deploy_type'");
  });

  it('requires ingress field', () => {
    expect(content).toContain("'ingress'");
  });

  it('defines deploy_modes for servers', () => {
    expect(content).toContain('deploy_modes:');
  });

  it('defines assets for webapps', () => {
    expect(content).toContain("'assets'");
    expect(content).toContain("'bundled'");
    expect(content).toContain("'entrypoint'");
  });
});

/**
 * WHY: Verify settings file schema structure.
 */
describe('settings file schema', () => {
  const content = readFile(SCHEMA_PATH);

  it('requires sdd metadata section', () => {
    expect(content).toContain('sddMetadataSchema');
    expect(content).toContain("'plugin_version'");
    expect(content).toContain("'initialized_at'");
    expect(content).toContain("'last_updated'");
  });

  it('requires project metadata section', () => {
    expect(content).toContain('projectMetadataSchema');
    expect(content).toContain("'name'");
    expect(content).toContain("'description'");
    expect(content).toContain("'domain'");
    expect(content).toContain("'type'");
  });

  it('validates project type enum', () => {
    expect(content).toContain("'fullstack'");
    expect(content).toContain("'backend'");
    expect(content).toContain("'frontend'");
    expect(content).toContain("'custom'");
  });

  it('requires components array', () => {
    expect(content).toContain("'components'");
    expect(content).toContain("type: 'array'");
  });

  it('validates component name pattern', () => {
    // Names should be lowercase with hyphens
    expect(content).toContain('pattern');
    expect(content).toContain('[a-z]');
  });
});
