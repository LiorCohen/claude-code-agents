/**
 * Database Component Scaffolding Integration Tests
 *
 * WHY: Validates that the scaffolding script correctly generates database
 * components and that all plugin documentation references the database
 * component consistently. Integration failures here cause broken scaffolding.
 */

import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import {
  PLUGIN_DIR,
  SKILLS_DIR,
  joinPath,
  fileExists,
  isDirectory,
  readFile,
  mkdtemp,
  rmdir,
  mkdir,
  writeFileAsync,
  runScaffolding,
} from '../../../lib';

const SCAFFOLDING_SCRIPT = joinPath(SKILLS_DIR, 'scaffolding', 'scaffolding.ts');

/**
 * WHY: The scaffolding script is the actual implementation that generates
 * database components. If it doesn't reference database correctly, no
 * database components will be created.
 */
describe('Scaffolding Script Database Support', () => {
  /**
   * WHY: The scaffolding script must know about the database component
   * type. Without these references, 'database' won't be recognized as
   * a valid component during project generation.
   */
  it('scaffolding.ts references database component', () => {
    const content = readFile(SCAFFOLDING_SCRIPT);

    expect(content).toContain('database');
    expect(content).toContain('database-scaffolding');
  });

  /**
   * WHY: The scaffolding script must create the expected directory structure.
   * Without these paths, the generated database component won't have
   * migrations, seeds, or scripts directories.
   */
  it('scaffolding.ts creates database directories', () => {
    const content = readFile(SCAFFOLDING_SCRIPT);

    // Database directories are now dynamically generated from component name
    expect(content).toContain('databaseComponents');
    expect(content).toContain('migrations');
    expect(content).toContain('seeds');
    expect(content).toContain('scripts');
  });
});

/**
 * WHY: End-to-end scaffolding tests verify that the scaffolding script
 * actually produces working output. Unit tests on templates aren't enough -
 * we need to run the actual scaffolding to catch integration issues.
 */
describe('Scaffolding Integration', () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await mkdtemp('sdd-test-');
  });

  afterAll(async () => {
    if (tmpDir) {
      await rmdir(tmpDir);
    }
  });

  /**
   * WHY: This is the critical test - does scaffolding actually create
   * the expected file structure? Failures here mean users get incomplete
   * or broken database components.
   */
  it('creates correct database structure', async () => {
    const targetDir = joinPath(tmpDir, 'test-project');
    await mkdir(targetDir);

    const config = {
      project_name: 'test-project',
      project_description: 'Test project',
      primary_domain: 'Testing',
      target_dir: targetDir,
      components: [{ type: 'database', name: 'database' }],
      skills_dir: SKILLS_DIR,
    };

    const configFile = joinPath(tmpDir, 'config.json');
    await writeFileAsync(configFile, JSON.stringify(config));

    const result = await runScaffolding(configFile, tmpDir);

    expect(result.exitCode).toBe(0);

    // Verify database structure
    const dbDir = joinPath(targetDir, 'components', 'database');
    expect(fileExists(dbDir)).toBe(true);
    expect(fileExists(joinPath(dbDir, 'package.json'))).toBe(true);
    expect(fileExists(joinPath(dbDir, 'README.md'))).toBe(true);
    expect(isDirectory(joinPath(dbDir, 'migrations'))).toBe(true);
    expect(isDirectory(joinPath(dbDir, 'seeds'))).toBe(true);
    expect(isDirectory(joinPath(dbDir, 'scripts'))).toBe(true);
    expect(fileExists(joinPath(dbDir, 'scripts', 'migrate.sh'))).toBe(true);
    expect(fileExists(joinPath(dbDir, 'scripts', 'seed.sh'))).toBe(true);
    expect(fileExists(joinPath(dbDir, 'scripts', 'reset.sh'))).toBe(true);
  });

  /**
   * WHY: Variable substitution is critical for generating unique projects.
   * If {{PROJECT_NAME}} isn't replaced, package.json will have the literal
   * string, causing npm conflicts and confusion.
   */
  it('substitutes {{PROJECT_NAME}} in templates', async () => {
    const targetDir = joinPath(tmpDir, 'my-app');
    await mkdir(targetDir);

    const config = {
      project_name: 'my-app',
      project_description: 'My application',
      primary_domain: 'Testing',
      target_dir: targetDir,
      components: [{ type: 'database', name: 'database' }],
      skills_dir: SKILLS_DIR,
    };

    const configFile = joinPath(tmpDir, 'config2.json');
    await writeFileAsync(configFile, JSON.stringify(config));

    const result = await runScaffolding(configFile, tmpDir);

    expect(result.exitCode).toBe(0);

    // Check variable substitution
    const packageJson = joinPath(targetDir, 'components', 'database', 'package.json');
    const content = readFile(packageJson);

    expect(content).toContain('@my-app/database');
    expect(content).not.toContain('{{PROJECT_NAME}}');
  });
});

/**
 * WHY: Documentation consistency ensures that all plugin docs reference
 * the database component correctly. Inconsistent docs confuse users and
 * indicate potential feature gaps.
 */
describe('Documentation Consistency', () => {
  /**
   * WHY: The scaffolding skill doc must list database as a component type.
   * Without this, users won't know database is an option during sdd-init.
   */
  it('scaffolding SKILL.md lists database component', () => {
    const skillMd = joinPath(SKILLS_DIR, 'scaffolding', 'SKILL.md');
    const content = readFile(skillMd);

    expect(content.toLowerCase()).toContain('database');
    expect(content).toContain('database-scaffolding');
  });

  /**
   * WHY: Project settings must include database as a component option.
   * This controls whether database appears in project configuration.
   */
  it('project-settings SKILL.md includes database in schema', () => {
    const skillMd = joinPath(SKILLS_DIR, 'project-settings', 'SKILL.md');
    const content = readFile(skillMd);

    expect(content).toContain('database');
    // Components now use list-of-objects format: [{type, name}]
    expect(content).toContain('type');
    expect(content).toContain('name');
  });

  /**
   * WHY: sdd-init is the user-facing command for project creation.
   * It must list database as an option and show its dependencies.
   */
  it('sdd-init command includes database option', () => {
    const commandMd = joinPath(PLUGIN_DIR, 'commands', 'sdd-init.md');
    const content = readFile(commandMd);

    // Verify database is mentioned as a component option
    expect(content).toContain('Database');
    // Verify database is mentioned as a component option
    expect(content.toLowerCase()).toContain('database');
  });

  /**
   * WHY: The planner agent designs project structure. It must know
   * about database components to include them in project plans.
   */
  it('planner agent knows about database', () => {
    const agentMd = joinPath(PLUGIN_DIR, 'agents', 'planner.md');
    const content = readFile(agentMd);

    expect(content).toContain('Database');
    expect(content.toLowerCase()).toContain('database');
  });

  /**
   * WHY: The docs/components.md reference lists database as a component type.
   * SKIPPED: docs/components.md doesn't exist yet - tracked in TASKS.md
   */
  it.skip('docs/components.md shows database', () => {
    const docsDir = joinPath(PLUGIN_DIR, '..', '..', 'docs');
    const componentsDoc = joinPath(docsDir, 'components.md');
    const content = readFile(componentsDoc);

    expect(content.toLowerCase()).toContain('database');
  });
});

/**
 * WHY: Agent integration tests verify that agents know how to work with
 * database components. Agents without database knowledge can't help users
 * with database-related tasks.
 */
describe('Agent Integration', () => {
  /**
   * WHY: backend-dev is the primary agent for server-side work.
   * It must understand the database component structure to provide
   * useful guidance on migrations, seeds, and queries.
   */
  it('backend-dev.md references database component', () => {
    const agentMd = joinPath(PLUGIN_DIR, 'agents', 'backend-dev.md');
    const content = readFile(agentMd);

    expect(content.toLowerCase()).toContain('database');
    expect(content).toContain('migrations');
    expect(content).toContain('seeds');
  });

  /**
   * WHY: backend-dev should know about the postgresql skill for
   * database-specific operations. This enables proper PostgreSQL guidance.
   */
  it('backend-dev.md references postgresql skill', () => {
    const agentMd = joinPath(PLUGIN_DIR, 'agents', 'backend-dev.md');
    const content = readFile(agentMd);

    expect(content.toLowerCase()).toContain('postgresql');
  });

  /**
   * WHY: devops handles deployment and infrastructure. It must know
   * about database components to properly deploy and manage them.
   */
  it('devops.md references database component', () => {
    const agentMd = joinPath(PLUGIN_DIR, 'agents', 'devops.md');
    const content = readFile(agentMd);

    expect(content.toLowerCase()).toContain('database');
  });

  /**
   * WHY: DevOps needs to know database deployment strategies like
   * StatefulSets, migration handling, or PostgreSQL-specific concerns.
   */
  it('devops.md mentions database deployment strategies', () => {
    const agentMd = joinPath(PLUGIN_DIR, 'agents', 'devops.md');
    const content = readFile(agentMd);

    const hasDeploymentPattern =
      content.includes('StatefulSet') ||
      content.toLowerCase().includes('migrations') ||
      content.includes('PostgreSQL');

    expect(hasDeploymentPattern).toBe(true);
  });
});
