/**
 * Backend Config Integration Tests
 *
 * WHY: Validates that the backend scaffolding templates correctly
 * integrate with the SDD config system. The backend must load config
 * from SDD_CONFIG_PATH instead of environment variables.
 */

import { describe, expect, it } from 'vitest';
import { SKILLS_DIR, joinPath, fileExists, readFile } from '@/lib';

const BACKEND_TEMPLATES_DIR = joinPath(SKILLS_DIR, 'components', 'backend', 'backend-scaffolding', 'templates');

/**
 * WHY: load_config.ts is the entry point for configuration loading.
 * It must use the SDD config system instead of dotenv.
 */
describe('Backend load_config.ts Template', () => {
  const LOAD_CONFIG_PATH = joinPath(BACKEND_TEMPLATES_DIR, 'src', 'config', 'load_config.ts');

  it('load_config.ts exists', () => {
    expect(fileExists(LOAD_CONFIG_PATH)).toBe(true);
  });

  /**
   * WHY: SDD_CONFIG_PATH is the only environment variable used for config.
   * This simplifies deployment and avoids environment variable sprawl.
   */
  it('uses SDD_CONFIG_PATH environment variable', () => {
    const content = readFile(LOAD_CONFIG_PATH);
    expect(content).toContain('SDD_CONFIG_PATH');
    expect(content).toContain('process.env.SDD_CONFIG_PATH');
  });

  /**
   * WHY: dotenv is no longer used for config loading.
   * Config comes from YAML files, not .env files.
   */
  it('does not import dotenv', () => {
    const content = readFile(LOAD_CONFIG_PATH);
    expect(content).not.toContain("from 'dotenv'");
    expect(content).not.toContain("import dotenv");
  });

  /**
   * WHY: YAML parsing is required to read config files.
   * The yaml package provides correct YAML parsing.
   */
  it('imports yaml parser', () => {
    const content = readFile(LOAD_CONFIG_PATH);
    expect(content).toContain("from 'yaml'");
  });

  /**
   * WHY: JSON Schema validation catches config errors at startup.
   * Ajv is the standard JSON Schema validator.
   */
  it('imports ajv 2020-12 for schema validation', () => {
    const content = readFile(LOAD_CONFIG_PATH);
    expect(content).toContain("from 'ajv/dist/2020.js'");
    expect(content).toContain('Ajv2020');
  });

  /**
   * WHY: Config must be validated against schema if present.
   * This catches errors early instead of at runtime.
   */
  it('validates config against schema', () => {
    const content = readFile(LOAD_CONFIG_PATH);
    expect(content).toContain('schema');
    expect(content).toContain('validate');
  });

  /**
   * WHY: Missing SDD_CONFIG_PATH should fail fast with clear error.
   * Silent failures make debugging difficult.
   */
  it('throws error when SDD_CONFIG_PATH is missing', () => {
    const content = readFile(LOAD_CONFIG_PATH);
    expect(content).toContain('throw new Error');
    expect(content).toContain('SDD_CONFIG_PATH');
    expect(content).toContain('required');
  });

  /**
   * WHY: Missing config file should fail fast with clear error.
   * The error message should include the path for debugging.
   */
  it('checks if config file exists', () => {
    const content = readFile(LOAD_CONFIG_PATH);
    expect(content).toContain('existsSync');
    expect(content).toContain('not found');
  });

  /**
   * WHY: Config type should be exported for type safety.
   * Components using config need proper TypeScript types.
   */
  it('exports Config type', () => {
    const content = readFile(LOAD_CONFIG_PATH);
    expect(content).toContain('export type Config');
  });

  /**
   * WHY: loadConfig function should be exported for use by other modules.
   * This is the primary way to access configuration.
   */
  it('exports loadConfig function', () => {
    const content = readFile(LOAD_CONFIG_PATH);
    expect(content).toContain('export const loadConfig');
  });
});

/**
 * WHY: package.json must have the correct dependencies for config loading.
 */
describe('Backend package.json Config Dependencies', () => {
  const PACKAGE_JSON_PATH = joinPath(BACKEND_TEMPLATES_DIR, 'package.json');

  it('package.json exists', () => {
    expect(fileExists(PACKAGE_JSON_PATH)).toBe(true);
  });

  /**
   * WHY: dotenv should not be a dependency.
   * Config loading no longer uses dotenv.
   */
  it('does not have dotenv dependency', () => {
    const content = readFile(PACKAGE_JSON_PATH);
    expect(content).not.toContain('"dotenv"');
  });

  /**
   * WHY: yaml is required for parsing config files.
   */
  it('has yaml dependency', () => {
    const content = readFile(PACKAGE_JSON_PATH);
    expect(content).toContain('"yaml"');
  });

  /**
   * WHY: ajv is required for JSON Schema validation.
   */
  it('has ajv dependency', () => {
    const content = readFile(PACKAGE_JSON_PATH);
    expect(content).toContain('"ajv"');
  });

  /**
   * WHY: The config workspace package must be a dependency.
   * This enables importing types from @project/config/types.
   */
  it('has config workspace dependency', () => {
    const content = readFile(PACKAGE_JSON_PATH);
    expect(content).toContain('@{{PROJECT_NAME}}/config');
    expect(content).toContain('workspace:*');
  });
});
