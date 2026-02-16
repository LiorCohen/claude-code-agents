/**
 * Config Skills Tests
 *
 * WHY: Validates that the config-related skills exist and contain
 * the required documentation. Skills are the source of truth for
 * how Claude should handle configuration tasks.
 */

import { describe, expect, it } from 'vitest';
import { SKILLS_DIR, joinPath, fileExists, readFile } from '@/lib';

/**
 * WHY: config-scaffolding is the mandatory skill for creating config components.
 * Without it, init can't create the required config component.
 */
describe('config-scaffolding Skill', () => {
  const SKILL_PATH = joinPath(SKILLS_DIR, 'components', 'config', 'config-scaffolding', 'SKILL.md');

  it('SKILL.md exists', () => {
    expect(fileExists(SKILL_PATH)).toBe(true);
  });

  it('SKILL.md has correct frontmatter', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('name: config-scaffolding');
    expect(content).toContain('description:');
  });

  it('SKILL.md documents the output structure', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('components/config/');
    expect(content).toContain('envs/');
    expect(content).toContain('schemas/');
    expect(content).toContain('types/');
  });

  it('SKILL.md explains environment layering', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('default');
    expect(content).toContain('local');
    expect(content).toContain('Merge');
  });
});

/**
 * WHY: config-standards defines how configuration should be managed.
 * Without it, developers don't know the patterns to follow.
 */
describe('config-standards Skill', () => {
  const SKILL_PATH = joinPath(SKILLS_DIR, 'components', 'config', 'config-standards', 'SKILL.md');

  it('SKILL.md exists', () => {
    expect(fileExists(SKILL_PATH)).toBe(true);
  });

  it('SKILL.md has correct frontmatter', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('name: config-standards');
    expect(content).toContain('description:');
  });

  it('SKILL.md documents core principles', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('Single source of truth');
    expect(content).toContain('Environment layering');
    expect(content).toContain('SDD_CONFIG_PATH');
  });

  it('SKILL.md documents environment agnosticism', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('environment-agnostic');
  });

  it('SKILL.md documents secret handling', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('Secret');
    expect(content).toContain('references');
  });

  it('SKILL.md documents local development workflow', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('Local Development');
    expect(content).toContain('generate');
    expect(content).toContain('SDD_CONFIG_PATH');
  });
});

/**
 * WHY: helm-standards defines how Helm charts should integrate with config.
 * Without it, helm charts won't correctly mount and inject config.
 */
describe('helm-standards Skill', () => {
  const SKILL_PATH = joinPath(SKILLS_DIR, 'components', 'helm', 'helm-standards', 'SKILL.md');

  it('SKILL.md exists', () => {
    expect(fileExists(SKILL_PATH)).toBe(true);
  });

  it('SKILL.md has correct frontmatter', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('name: helm-standards');
    expect(content).toContain('description:');
  });

  it('SKILL.md documents values file conventions', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('values.yaml');
    expect(content).toContain('values-{env}.yaml');
  });

  it('SKILL.md documents required values', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('nodeEnv');
    expect(content).toContain('config:');
  });

  it('SKILL.md documents config injection pattern', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('ConfigMap');
    expect(content).toContain('toYaml');
    expect(content).toContain('.Values.config');
  });

  it('SKILL.md documents environment variable injection', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('NODE_ENV');
    expect(content).toContain('SDD_CONFIG_PATH');
    expect(content).toContain('/app/config/config.yaml');
  });

  it('SKILL.md documents secret references', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('secretKeyRef');
    expect(content).toContain('passwordSecret');
  });
});

/**
 * WHY: helm-scaffolding creates the Helm chart structure.
 * Without it, there's no automated way to create SDD-compliant charts.
 */
describe('helm-scaffolding Skill', () => {
  const SKILL_PATH = joinPath(SKILLS_DIR, 'components', 'helm', 'helm-scaffolding', 'SKILL.md');

  it('SKILL.md exists', () => {
    expect(fileExists(SKILL_PATH)).toBe(true);
  });

  it('SKILL.md has correct frontmatter', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('name: helm-scaffolding');
    expect(content).toContain('description:');
  });

  it('SKILL.md documents the output structure', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('Chart.yaml');
    expect(content).toContain('values.yaml');
    expect(content).toContain('templates/');
  });

  it('SKILL.md documents template variables', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('{{CHART_NAME}}');
    expect(content).toContain('{{CHART_DESCRIPTION}}');
  });

  it('SKILL.md documents config integration', () => {
    const content = readFile(SKILL_PATH);
    expect(content).toContain('SDD_CONFIG_PATH');
    expect(content).toContain('ConfigMap');
  });
});
