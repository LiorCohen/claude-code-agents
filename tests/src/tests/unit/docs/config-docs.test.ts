/**
 * Config Documentation Tests
 *
 * WHY: Validates that all documentation correctly reflects the new
 * config component architecture. Users rely on docs to understand
 * how to use the config system.
 */

import { describe, expect, it } from 'vitest';
import { REPO_ROOT, joinPath, fileExists, readFile } from '@/lib';

/**
 * WHY: config-guide.md is the primary documentation for the config system.
 * Users need a comprehensive guide to understand configuration management.
 */
describe('Config Guide Documentation', () => {
  const DOC_PATH = joinPath(REPO_ROOT, 'docs', 'config-guide.md');

  it('config-guide.md exists', () => {
    expect(fileExists(DOC_PATH)).toBe(true);
  });

  it('has overview section', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('## Overview');
  });

  it('documents directory structure', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('components/config/');
    expect(content).toContain('envs/');
    expect(content).toContain('schemas/');
    expect(content).toContain('types/');
  });

  it('documents environment layering', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('Environment Layering');
    expect(content).toContain('default');
    expect(content).toContain('local');
    expect(content).toContain('Merge');
  });

  it('documents type safety', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('Type');
    expect(content).toContain('TypeScript');
    expect(content).toContain('import');
  });

  it('documents local development workflow', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('Local Development');
    expect(content).toContain('generate');
    expect(content).toContain('SDD_CONFIG_PATH');
  });

  it('documents production deployment', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('Production');
    expect(content).toContain('Helm');
  });

  it('documents troubleshooting', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('Troubleshooting');
  });
});

/**
 * WHY: components.md must document config as a component type.
 * Users need to know config is a mandatory singleton.
 */
describe('Components Documentation Config Section', () => {
  const DOC_PATH = joinPath(REPO_ROOT, 'docs', 'components.md');

  it('components.md exists', () => {
    expect(fileExists(DOC_PATH)).toBe(true);
  });

  it('lists config in available components', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('`config`');
  });

  it('documents config as mandatory singleton', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('mandatory');
    expect(content).toContain('singleton');
  });

  it('documents config directory location', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('components/config/');
  });

  it('links to config guide', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('config-guide.md');
  });
});

/**
 * WHY: commands.md must document /sdd-run config.
 * Users need to know the config command exists and how to use it.
 */
describe('Commands Documentation Config Section', () => {
  const DOC_PATH = joinPath(REPO_ROOT, 'docs', 'commands.md');

  it('commands.md exists', () => {
    expect(fileExists(DOC_PATH)).toBe(true);
  });

  it('documents /sdd-run config command', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('/sdd-run config');
  });

  it('documents generate operation', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('generate');
  });

  it('documents validate operation', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('validate');
  });

  it('documents diff operation', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('diff');
  });

  it('links to config guide', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('config-guide.md');
  });
});

/**
 * WHY: getting-started.md must show the updated project structure.
 * New users need to see config in components/.
 */
describe('Getting Started Documentation', () => {
  const DOC_PATH = joinPath(REPO_ROOT, 'docs', 'getting-started.md');

  it('getting-started.md exists', () => {
    expect(fileExists(DOC_PATH)).toBe(true);
  });

  it('shows config in components/ directory', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('config/');
    expect(content).toContain('components/');
  });

  it('does not show root config/ directory', () => {
    const content = readFile(DOC_PATH);
    // Should not have config/ as sibling to components/
    expect(content).not.toMatch(/components\/\s*\n.*config\/\s*#.*YAML/);
  });

  it('links to config guide', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('config-guide.md');
  });
});

/**
 * WHY: workflows.md must document config workflows.
 * Users need to know how to add and modify configuration.
 */
describe('Workflows Documentation Config Section', () => {
  const DOC_PATH = joinPath(REPO_ROOT, 'docs', 'workflows.md');

  it('workflows.md exists', () => {
    expect(fileExists(DOC_PATH)).toBe(true);
  });

  it('documents configuration workflow', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('Configuration');
  });

  it('links to config guide', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('config-guide.md');
  });
});

/**
 * WHY: README.md must show the updated structure and commands.
 * The README is often the first thing users see.
 */
describe('README Documentation', () => {
  const DOC_PATH = joinPath(REPO_ROOT, 'README.md');

  it('README.md exists', () => {
    expect(fileExists(DOC_PATH)).toBe(true);
  });

  it('lists /sdd-run in commands table', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('/sdd-run');
  });

  it('shows config in project structure', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('config/');
    expect(content).toContain('components/');
  });

  it('links to config guide in documentation section', () => {
    const content = readFile(DOC_PATH);
    expect(content).toContain('config-guide.md');
  });

  it('does not have root config/ in permissions example', () => {
    const content = readFile(DOC_PATH);
    // Should not have Write(config/**) since config is now in components/
    expect(content).not.toContain('Write(config/**)');
  });
});
