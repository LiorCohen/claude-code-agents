/**
 * Unit Tests: settings types and type guards
 *
 * WHY: The settings type system is foundational to the entire component
 * settings system. Incorrect type guards would cause runtime errors
 * in scaffolding and sync operations.
 */

import { describe, expect, it } from 'vitest';
import { PLUGIN_DIR, joinPath, readFile } from '@/lib';

const SETTINGS_TYPES_PATH = joinPath(
  PLUGIN_DIR,
  'system',
  'src',
  'types',
  'settings.ts'
);

/**
 * WHY: Verify the source file exists and has expected structure.
 */
describe('settings.ts source file', () => {
  it('exists in plugin system/src/types', () => {
    const content = readFile(SETTINGS_TYPES_PATH);
    expect(content).toBeDefined();
    expect(content.length).toBeGreaterThan(0);
  });

  it('exports ServerMode type', () => {
    const content = readFile(SETTINGS_TYPES_PATH);
    expect(content).toContain("export type ServerMode = 'api' | 'worker' | 'cron'");
  });

  it('exports ServerType type', () => {
    const content = readFile(SETTINGS_TYPES_PATH);
    expect(content).toContain('export type ServerType = ServerMode | \'hybrid\'');
  });

  it('exports ServerSettings interface', () => {
    const content = readFile(SETTINGS_TYPES_PATH);
    expect(content).toContain('export interface ServerSettings');
    expect(content).toContain('readonly server_type: ServerType');
    expect(content).toContain('readonly databases?: readonly string[]');
    expect(content).toContain('readonly provides_contracts?: readonly string[]');
    expect(content).toContain('readonly consumes_contracts?: readonly string[]');
    expect(content).toContain('readonly helm?: boolean');
  });

  it('exports WebappSettings interface', () => {
    const content = readFile(SETTINGS_TYPES_PATH);
    expect(content).toContain('export interface WebappSettings');
    expect(content).toContain('readonly contracts?: readonly string[]');
  });

  it('exports HelmServerSettings interface', () => {
    const content = readFile(SETTINGS_TYPES_PATH);
    expect(content).toContain('export interface HelmServerSettings');
    expect(content).toContain('readonly deploys: string');
    expect(content).toContain("readonly deploy_type: 'server'");
    expect(content).toContain('readonly ingress: boolean');
  });

  it('exports HelmWebappSettings interface', () => {
    const content = readFile(SETTINGS_TYPES_PATH);
    expect(content).toContain('export interface HelmWebappSettings');
    expect(content).toContain("readonly deploy_type: 'webapp'");
    expect(content).toContain('readonly assets: HelmAssets');
  });

  it('exports DatabaseSettings interface', () => {
    const content = readFile(SETTINGS_TYPES_PATH);
    expect(content).toContain('export interface DatabaseSettings');
    expect(content).toContain('readonly provider: DatabaseProvider');
    expect(content).toContain('readonly dedicated: boolean');
  });

  it('exports ContractSettings interface', () => {
    const content = readFile(SETTINGS_TYPES_PATH);
    expect(content).toContain('export interface ContractSettings');
    expect(content).toContain('readonly visibility: ContractVisibility');
  });

  it('exports Component type union', () => {
    const content = readFile(SETTINGS_TYPES_PATH);
    expect(content).toContain('export type Component =');
    expect(content).toContain('| ServerComponent');
    expect(content).toContain('| WebappComponent');
    expect(content).toContain('| HelmComponent');
    expect(content).toContain('| DatabaseComponent');
    expect(content).toContain('| ContractComponent');
    expect(content).toContain('| ConfigComponent');
  });

  it('exports type guards for components', () => {
    const content = readFile(SETTINGS_TYPES_PATH);
    expect(content).toContain('export const isServerComponent');
    expect(content).toContain('export const isWebappComponent');
    expect(content).toContain('export const isHelmComponent');
    expect(content).toContain('export const isDatabaseComponent');
    expect(content).toContain('export const isContractComponent');
    expect(content).toContain('export const isConfigComponent');
  });

  it('exports type guards for helm settings', () => {
    const content = readFile(SETTINGS_TYPES_PATH);
    expect(content).toContain('export const isHelmServerSettings');
    expect(content).toContain('export const isHelmWebappSettings');
  });

  it('exports SddMetadata interface with split version fields', () => {
    const content = readFile(SETTINGS_TYPES_PATH);
    expect(content).toContain('export interface SddMetadata');
    expect(content).toContain('readonly initialized_by_plugin_version: string');
    expect(content).toContain('readonly updated_by_plugin_version: string');
    expect(content).toContain('readonly initialized_at: string');
    expect(content).toContain('readonly updated_at: string');
  });

  it('exports ProjectMetadata with name required and description optional', () => {
    const content = readFile(SETTINGS_TYPES_PATH);
    expect(content).toContain('export interface ProjectMetadata');
    expect(content).toContain('readonly name: string');
    expect(content).toContain('readonly description?: string');
  });

  it('exports SettingsFile interface', () => {
    const content = readFile(SETTINGS_TYPES_PATH);
    expect(content).toContain('export interface SettingsFile');
    expect(content).toContain('readonly sdd: SddMetadata');
    expect(content).toContain('readonly project: ProjectMetadata');
    expect(content).toContain('readonly components: readonly Component[]');
  });
});

/**
 * WHY: Verify type guard implementation is correct.
 */
describe('type guard implementations', () => {
  it('isServerComponent checks type field', () => {
    const content = readFile(SETTINGS_TYPES_PATH);
    expect(content).toContain("c.type === 'server'");
  });

  it('isHelmServerSettings checks deploy_type field', () => {
    const content = readFile(SETTINGS_TYPES_PATH);
    expect(content).toContain("s.deploy_type === 'server'");
  });

  it('isHelmWebappSettings checks deploy_type field', () => {
    const content = readFile(SETTINGS_TYPES_PATH);
    expect(content).toContain("s.deploy_type === 'webapp'");
  });
});
