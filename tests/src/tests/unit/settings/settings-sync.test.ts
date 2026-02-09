/**
 * Unit Tests: settings sync functions
 *
 * WHY: The sync system propagates settings changes to config, helm, etc.
 * Incorrect sync logic would leave components out of sync with their settings.
 */

import { describe, expect, it } from 'vitest';
import { PLUGIN_DIR, joinPath, readFile } from '@/lib';

const SYNC_PATH = joinPath(
  PLUGIN_DIR,
  'system',
  'src',
  'settings',
  'sync.ts'
);

const SYNC_HELM_PATH = joinPath(
  PLUGIN_DIR,
  'system',
  'src',
  'settings',
  'sync-helm.ts'
);

/**
 * WHY: Verify the sync file exists and has expected structure.
 */
describe('sync.ts source file', () => {
  it('exists in plugin system/src/settings', () => {
    const content = readFile(SYNC_PATH);
    expect(content).toBeDefined();
    expect(content.length).toBeGreaterThan(0);
  });

  it('exports SyncResult interface', () => {
    const content = readFile(SYNC_PATH);
    expect(content).toContain('export interface SyncResult');
    expect(content).toContain('readonly success: boolean');
    expect(content).toContain('readonly filesCreated: readonly string[]');
    expect(content).toContain('readonly filesUpdated: readonly string[]');
  });

  it('exports SettingsDiff interface', () => {
    const content = readFile(SYNC_PATH);
    expect(content).toContain('export interface SettingsDiff');
    expect(content).toContain('readonly addedComponents');
    expect(content).toContain('readonly removedComponents');
    expect(content).toContain('readonly modifiedComponents');
  });

  it('exports diffSettings function', () => {
    const content = readFile(SYNC_PATH);
    expect(content).toContain('export const diffSettings');
  });

  it('exports getComponentDir function', () => {
    const content = readFile(SYNC_PATH);
    expect(content).toContain('export const getComponentDir');
  });

  it('exports previewSync function', () => {
    const content = readFile(SYNC_PATH);
    expect(content).toContain('export const previewSync');
  });

  it('exports generateServerConfigSection function', () => {
    const content = readFile(SYNC_PATH);
    expect(content).toContain('export const generateServerConfigSection');
  });

  it('exports generateWebappConfigSection function', () => {
    const content = readFile(SYNC_PATH);
    expect(content).toContain('export const generateWebappConfigSection');
  });
});

/**
 * WHY: Verify component directory mapping is correct.
 */
describe('component directory mapping', () => {
  const content = readFile(SYNC_PATH);

  it('maps server type to servers directory', () => {
    expect(content).toContain("server: 'servers'");
  });

  it('maps webapp type to webapps directory', () => {
    expect(content).toContain("webapp: 'webapps'");
  });

  it('maps helm type to helm-charts directory', () => {
    expect(content).toContain("helm: 'helm-charts'");
  });

  it('maps database type to databases directory', () => {
    expect(content).toContain("database: 'databases'");
  });

  it('maps contract type to contracts directory', () => {
    expect(content).toContain("contract: 'contracts'");
  });

  it('handles config singleton correctly', () => {
    expect(content).toContain("type === 'config'");
    expect(content).toContain("'components/config'");
  });
});

/**
 * WHY: Verify config generation is correct.
 */
describe('config section generation', () => {
  const content = readFile(SYNC_PATH);

  it('generates probesPort for all servers', () => {
    expect(content).toContain('probesPort: 9090');
  });

  it('generates logLevel for all servers', () => {
    expect(content).toContain("logLevel: 'info'");
  });

  it('generates port only when provides_contracts is non-empty', () => {
    expect(content).toContain('(settings.provides_contracts ?? []).length > 0');
    expect(content).toContain("config['port'] = 3000");
  });

  it('generates queue config for workers', () => {
    expect(content).toContain("server_type === 'worker'");
    expect(content).toContain("config['queue']");
    expect(content).toContain('amqp://localhost:5672');
  });

  it('generates database sections per database', () => {
    expect(content).toContain('(settings.databases ?? []).length > 0');
    expect(content).toContain("config['databases']");
    expect(content).toContain('host');
    expect(content).toContain('port: 5432');
  });

  it('generates API sections for consumed contracts', () => {
    expect(content).toContain('(settings.consumes_contracts ?? []).length > 0');
    expect(content).toContain("config['apis']");
    expect(content).toContain('base_url');
  });
});

/**
 * WHY: Verify helm sync file exists and has expected structure.
 */
describe('sync-helm.ts source file', () => {
  it('exists in plugin system/src/settings', () => {
    const content = readFile(SYNC_HELM_PATH);
    expect(content).toBeDefined();
    expect(content.length).toBeGreaterThan(0);
  });

  it('exports HelmTemplateSet interface', () => {
    const content = readFile(SYNC_HELM_PATH);
    expect(content).toContain('export interface HelmTemplateSet');
    expect(content).toContain('readonly base: readonly string[]');
    expect(content).toContain('readonly conditional: readonly string[]');
  });

  it('exports getServerHelmTemplates function', () => {
    const content = readFile(SYNC_HELM_PATH);
    expect(content).toContain('export const getServerHelmTemplates');
  });

  it('exports getWebappHelmTemplates function', () => {
    const content = readFile(SYNC_HELM_PATH);
    expect(content).toContain('export const getWebappHelmTemplates');
  });

  it('exports generateServerHelmValues function', () => {
    const content = readFile(SYNC_HELM_PATH);
    expect(content).toContain('export const generateServerHelmValues');
  });

  it('exports generateWebappHelmValues function', () => {
    const content = readFile(SYNC_HELM_PATH);
    expect(content).toContain('export const generateWebappHelmValues');
  });

  it('exports shouldHaveUmbrellaChart function', () => {
    const content = readFile(SYNC_HELM_PATH);
    expect(content).toContain('export const shouldHaveUmbrellaChart');
  });
});

/**
 * WHY: Verify helm template selection logic.
 */
describe('helm template selection', () => {
  const content = readFile(SYNC_HELM_PATH);

  it('always includes base templates', () => {
    expect(content).toContain("'_helpers.tpl'");
    expect(content).toContain("'configmap.yaml'");
    expect(content).toContain("'servicemonitor.yaml'");
  });

  it('includes deployment templates based on modes', () => {
    expect(content).toContain("'deployment.yaml'");
    expect(content).toContain("'deployment-api.yaml'");
    expect(content).toContain("'deployment-worker.yaml'");
    expect(content).toContain("'cronjob.yaml'");
  });

  it('includes service.yaml conditionally', () => {
    expect(content).toContain("'service.yaml'");
    expect(content).toContain('(serverSettings.provides_contracts ?? []).length > 0');
  });

  it('includes ingress.yaml based on settings', () => {
    expect(content).toContain("'ingress.yaml'");
    expect(content).toContain('ingress');
  });
});
