/**
 * Scaffolding Config Integration Tests
 *
 * WHY: Validates that the scaffolding skills correctly integrate
 * the config component as a mandatory singleton.
 */

import { describe, expect, it } from 'vitest';
import { SKILLS_DIR, joinPath, fileExists, readFile } from '@/lib';

/**
 * WHY: The main scaffolding skill must include config-scaffolding.
 * Config is mandatory for all SDD projects.
 */
describe('Scaffolding Skill Config Integration', () => {
  const SKILL_PATH = joinPath(SKILLS_DIR, 'scaffolding', 'SKILL.md');

  it('SKILL.md exists', () => {
    expect(fileExists(SKILL_PATH)).toBe(true);
  });

  /**
   * WHY: Config-scaffolding must be listed in the architecture table.
   * This documents that config is a supported component type.
   */
  it('includes config-scaffolding in architecture table', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('config-scaffolding');
  });

  /**
   * WHY: Config must be shown in the component format examples.
   * Users need to see how to include config in their component list.
   */
  it('includes config in component format examples', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('type: config');
    expect(content).toContain('name: config');
  });

  /**
   * WHY: Config must be in the available components table.
   * This documents config as a recognized component type.
   */
  it('lists config in available components table', () => {
    const content = readFile(SKILL_PATH);
    // Check for config in the table
    expect(content).toMatch(/\|\s*`config`\s*\|.*`config-scaffolding`/);
  });

  /**
   * WHY: Config must be marked as mandatory singleton.
   * Users need to know they can't have multiple config components.
   */
  it('documents config as mandatory singleton', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('mandatory');
    expect(content).toContain('singleton');
  });

  /**
   * WHY: Scaffolding order must show config early in the process.
   * Config needs to be available before other components are scaffolded.
   */
  it('shows config scaffolding early in execution order', () => {
    const content = readFile(SKILL_PATH);
    // Config should be second (after project scaffolding)
    expect(content).toContain('2. **Config scaffolding**');
  });


});

/**
 * WHY: Project-scaffolding must no longer create config/ in root.
 * Config is now a component at components/config/.
 */
describe('Project Scaffolding Config Removal', () => {
  const SKILL_PATH = joinPath(SKILLS_DIR, 'project-scaffolding', 'SKILL.md');

  it('SKILL.md exists', () => {
    expect(fileExists(SKILL_PATH)).toBe(true);
  });

  /**
   * WHY: The skill should not document creating a root config/ directory.
   * Config is now handled by config-scaffolding.
   */
  it('does not document root config/ directory', () => {
    const content = readFile(SKILL_PATH);
    // Should not have config/ as a top-level directory it creates
    expect(content).not.toMatch(/^config\/$/m);
    expect(content).not.toContain('config/config.yaml');
    expect(content).not.toContain('config/schemas/');
  });

  /**
   * WHY: The skill should reference config-scaffolding for config.
   * Users need to know where config handling moved to.
   */
  it('references config-scaffolding skill', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('config-scaffolding');
  });

  /**
   * WHY: The templates directory should not have config/ folder.
   * Legacy config templates should be removed.
   */
  it('does not have config templates directory', () => {
    const configTemplatesDir = joinPath(SKILLS_DIR, 'project-scaffolding', 'templates', 'config');
    expect(fileExists(configTemplatesDir)).toBe(false);
  });
});

/**
 * WHY: Project-settings must support config as a component type.
 * .sdd/sdd-settings.yaml needs to track the config component.
 */
describe('Project Settings Config Support', () => {
  const SKILL_PATH = joinPath(SKILLS_DIR, 'project-settings', 'SKILL.md');

  it('SKILL.md exists', () => {
    expect(fileExists(SKILL_PATH)).toBe(true);
  });

  /**
   * WHY: Config must be listed as a valid component type.
   * The validation rules must accept config as a type.
   */
  it('lists config as valid component type', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('`config`');
  });

  /**
   * WHY: The schema example should show config in components list.
   * Users need to see where config goes in .sdd/sdd-settings.yaml.
   */
  it('shows config in schema example', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('type: config');
    expect(content).toContain('name: config');
  });

  /**
   * WHY: The skill must document config as mandatory singleton.
   * Users need to understand the constraint.
   */
  it('documents config as mandatory singleton', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('mandatory');
    expect(content).toContain('components/config/');
  });
});
