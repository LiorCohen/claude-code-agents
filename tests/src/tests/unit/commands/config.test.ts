/**
 * /sdd-run config Command Tests
 *
 * WHY: Validates that the config command documentation exists
 * and contains the required operations. The command file is the
 * source of truth for how Claude handles config management.
 */

import { describe, expect, it } from 'vitest';
import { PLUGIN_DIR, joinPath, fileExists, readFile } from '@/lib';

const COMMAND_PATH = joinPath(PLUGIN_DIR, 'commands', 'sdd-run.md');

/**
 * WHY: The command file must exist for Claude to know how to handle /sdd-run config.
 */
describe('/sdd-run config Command File', () => {
  it('sdd-run.md exists', () => {
    expect(fileExists(COMMAND_PATH)).toBe(true);
  });

  it('has correct frontmatter', () => {
    const content = readFile(COMMAND_PATH);
    expect(content).toContain('name: sdd-run');
    expect(content).toContain('description:');
  });
});

/**
 * WHY: The generate operation is the primary way to create merged config files.
 * Without it, developers can't get config files for their environments.
 */
describe('/sdd-run config generate Operation', () => {
  it('documents generate operation', () => {
    const content = readFile(COMMAND_PATH);
    expect(content).toContain('### generate');
    expect(content).toContain('Generate');
  });

  it('documents --env argument', () => {
    const content = readFile(COMMAND_PATH);
    expect(content).toContain('--env');
    expect(content).toContain('local');
    expect(content).toContain('production');
  });

  it('documents --component argument', () => {
    const content = readFile(COMMAND_PATH);
    expect(content).toContain('--component');
  });

  it('documents --output argument', () => {
    const content = readFile(COMMAND_PATH);
    expect(content).toContain('--output');
  });

  it('explains merge behavior', () => {
    const content = readFile(COMMAND_PATH);
    expect(content).toContain('Merge');
    expect(content).toContain('default');
  });

  it('explains component extraction', () => {
    const content = readFile(COMMAND_PATH);
    expect(content).toContain('section');
    expect(content).toContain('wrapper');
  });
});

/**
 * WHY: The validate operation ensures config is correct before deployment.
 * Without it, invalid configs would only fail at runtime.
 */
describe('/sdd-run config validate Operation', () => {
  it('documents validate operation', () => {
    const content = readFile(COMMAND_PATH);
    expect(content).toContain('### validate');
    expect(content).toContain('Validate');
  });

  it('documents schema validation', () => {
    const content = readFile(COMMAND_PATH);
    expect(content).toContain('schema');
    expect(content).toContain('JSON');
  });
});

/**
 * WHY: The diff operation helps compare environments before deployment.
 * Without it, developers can't easily see what differs between envs.
 */
describe('/sdd-run config diff Operation', () => {
  it('documents diff operation', () => {
    const content = readFile(COMMAND_PATH);
    expect(content).toContain('### diff');
    expect(content).toContain('diff');
  });

  it('documents environment comparison', () => {
    const content = readFile(COMMAND_PATH);
    expect(content).toContain('env1');
    expect(content).toContain('env2');
  });
});

/**
 * WHY: The add-env operation creates new environment directories.
 * Without it, users would have to manually create env directories.
 */
describe('/sdd-run config add-env Operation', () => {
  it('documents add-env operation', () => {
    const content = readFile(COMMAND_PATH);
    expect(content).toContain('### add-env');
    expect(content).toContain('Add');
  });

  it('documents environment creation', () => {
    const content = readFile(COMMAND_PATH);
    expect(content).toContain('envs/');
    expect(content).toContain('directory');
  });
});

/**
 * WHY: The command must document the merge algorithm.
 * Users need to understand how config inheritance works.
 */
describe('/sdd-run config Merge Algorithm', () => {
  it('documents object merging', () => {
    const content = readFile(COMMAND_PATH);
    expect(content).toContain('Object');
    expect(content).toContain('merge');
  });

  it('documents array replacement', () => {
    const content = readFile(COMMAND_PATH);
    expect(content).toContain('Array');
    expect(content).toContain('Replaced');
  });

  it('documents null value handling', () => {
    const content = readFile(COMMAND_PATH);
    expect(content).toContain('null');
    expect(content).toContain('remove');
  });
});

/**
 * WHY: The command must document common workflows.
 * Users need examples of how to use config in practice.
 */
describe('/sdd-run config Workflow Documentation', () => {
  it('documents local development workflow', () => {
    const content = readFile(COMMAND_PATH);
    expect(content).toContain('Local Development');
    expect(content).toContain('SDD_CONFIG_PATH');
  });

  it('documents production deployment workflow', () => {
    const content = readFile(COMMAND_PATH);
    expect(content).toContain('Production');
    expect(content).toContain('Helm');
  });
});
