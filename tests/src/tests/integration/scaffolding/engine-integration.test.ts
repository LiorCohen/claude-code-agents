/**
 * Scaffolding Engine Integration Tests
 *
 * WHY: Tests the scaffolding engine through the CLI interface, verifying that
 * `scaffolding apply` correctly processes specs, creates files, substitutes
 * variables, evaluates conditions, and produces the expected output structure.
 */

import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import {
  PLUGIN_DIR,
  CORE_SKILLS_DIR,
  TECH_SKILLS_DIR,
  joinPath,
  fileExists,
  isDirectory,
  readFile,
  mkdtemp,
  rmdir,
  mkdir,
  writeFileAsync,
  runCommand,
} from '@/lib';

/** Run the scaffolding apply command via the built CLI. */
const runApply = async (
  specPath: string,
  cwd: string,
  dryRun = false
): Promise<{ exitCode: number; stdout: string; stderr: string }> => {
  const cliPath = joinPath(PLUGIN_DIR, 'core', 'system', 'dist', 'cli.js');
  const args = ['--enable-source-maps', cliPath, 'scaffolding', 'apply', '--spec', specPath];
  if (dryRun) args.push('--dry-run');
  return runCommand('node', args, { cwd, timeout: 60000 });
};

describe('Scaffolding Apply CLI', () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await mkdtemp('sdd-engine-integ-');
  });

  afterAll(async () => {
    if (tmpDir) await rmdir(tmpDir);
  });

  // -- Error handling --

  it('rejects missing --spec argument', async () => {
    const cliPath = joinPath(PLUGIN_DIR, 'core', 'system', 'dist', 'cli.js');
    const result = await runCommand('node', ['--enable-source-maps', cliPath, 'scaffolding', 'apply'], {
      cwd: tmpDir,
      timeout: 30000,
    });
    expect(result.stdout + result.stderr).toContain('Missing --spec');
  });

  it('rejects nonexistent spec file', async () => {
    const result = await runApply('/nonexistent/spec.json', tmpDir);
    expect(result.stdout + result.stderr).toContain('not found');
  });

  it('rejects malformed JSON', async () => {
    const specPath = joinPath(tmpDir, 'bad.json');
    await writeFileAsync(specPath, '{ invalid json }');
    const result = await runApply(specPath, tmpDir);
    expect(result.stdout + result.stderr).toContain('parse');
  });

  it('rejects spec missing required fields', async () => {
    const specPath = joinPath(tmpDir, 'incomplete.json');
    await writeFileAsync(specPath, JSON.stringify({ target_dir: '/tmp' }));
    const result = await runApply(specPath, tmpDir);
    expect(result.stdout + result.stderr).toContain('Missing required');
  });

  it('rejects nonexistent base_dir', async () => {
    const targetDir = joinPath(tmpDir, 'target-basedir-test');
    await mkdir(targetDir);
    const specPath = joinPath(tmpDir, 'bad-basedir.json');
    await writeFileAsync(
      specPath,
      JSON.stringify({
        target_dir: targetDir,
        base_dir: '/nonexistent/base',
        variables: {},
        operations: [],
      })
    );
    const result = await runApply(specPath, tmpDir);
    expect(result.stdout + result.stderr).toContain('base_dir not found');
  });

  it('rejects unknown operation type', async () => {
    const targetDir = joinPath(tmpDir, 'target-unknown-op-test');
    await mkdir(targetDir);
    const specPath = joinPath(tmpDir, 'unknown-op.json');
    await writeFileAsync(
      specPath,
      JSON.stringify({
        target_dir: targetDir,
        base_dir: TECH_SKILLS_DIR,
        variables: {},
        operations: [{ type: 'teleport', path: 'somewhere' }],
      })
    );
    const result = await runApply(specPath, tmpDir);
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout + result.stderr).toContain('unknown type');
  });

  it('rejects nonexistent target_dir', async () => {
    const specPath = joinPath(tmpDir, 'bad-targetdir.json');
    await writeFileAsync(
      specPath,
      JSON.stringify({
        target_dir: '/nonexistent/target',
        base_dir: TECH_SKILLS_DIR,
        variables: {},
        operations: [],
      })
    );
    const result = await runApply(specPath, tmpDir);
    expect(result.stdout + result.stderr).toContain('target_dir not found');
  });

  // -- Filesystem operations --

  it('creates files from write_file operations', async () => {
    const targetDir = joinPath(tmpDir, 'write-test');
    await mkdir(targetDir);

    const specPath = joinPath(tmpDir, 'write-spec.json');
    await writeFileAsync(
      specPath,
      JSON.stringify({
        target_dir: targetDir,
        base_dir: TECH_SKILLS_DIR,
        variables: { PROJECT_NAME: 'my-app' },
        operations: [
          {
            type: 'write_file',
            path: '.gitignore',
            content: 'node_modules/\ndist/\n',
          },
          {
            type: 'write_file',
            path: 'README.md',
            content: '# {{PROJECT_NAME}}\n',
          },
        ],
      })
    );

    const result = await runApply(specPath, tmpDir);
    expect(result.exitCode).toBe(0);
    expect(fileExists(joinPath(targetDir, '.gitignore'))).toBe(true);
    expect(readFile(joinPath(targetDir, '.gitignore'))).toBe('node_modules/\ndist/\n');
    expect(readFile(joinPath(targetDir, 'README.md'))).toContain('# my-app');
  });

  it('creates directories from mkdir operations', async () => {
    const targetDir = joinPath(tmpDir, 'mkdir-test');
    await mkdir(targetDir);

    const specPath = joinPath(tmpDir, 'mkdir-spec.json');
    await writeFileAsync(
      specPath,
      JSON.stringify({
        target_dir: targetDir,
        base_dir: TECH_SKILLS_DIR,
        variables: {},
        operations: [
          { type: 'mkdir', path: 'src/dal', gitkeep: true },
          { type: 'mkdir', path: 'src/model' },
        ],
      })
    );

    const result = await runApply(specPath, tmpDir);
    expect(result.exitCode).toBe(0);
    expect(isDirectory(joinPath(targetDir, 'src', 'dal'))).toBe(true);
    expect(fileExists(joinPath(targetDir, 'src', 'dal', '.gitkeep'))).toBe(true);
    expect(isDirectory(joinPath(targetDir, 'src', 'model'))).toBe(true);
  });

  it('copies template files with variable substitution', async () => {
    const targetDir = joinPath(tmpDir, 'template-file-test');
    await mkdir(targetDir);

    const specPath = joinPath(tmpDir, 'template-file-spec.json');
    await writeFileAsync(
      specPath,
      JSON.stringify({
        target_dir: targetDir,
        base_dir: CORE_SKILLS_DIR,
        variables: { PROJECT_NAME: 'my-app' },
        operations: [
          {
            type: 'template_file',
            source: 'project-scaffolding/templates/project/package.json',
            dest: 'package.json',
          },
        ],
      })
    );

    const result = await runApply(specPath, tmpDir);
    expect(result.exitCode).toBe(0);
    expect(fileExists(joinPath(targetDir, 'package.json'))).toBe(true);

    const content = readFile(joinPath(targetDir, 'package.json'));
    expect(content).toContain('my-app');
    expect(content).not.toContain('{{PROJECT_NAME}}');
  });

  it('copies template directories recursively', async () => {
    const targetDir = joinPath(tmpDir, 'template-dir-test');
    await mkdir(targetDir);

    const specPath = joinPath(tmpDir, 'template-dir-spec.json');
    await writeFileAsync(
      specPath,
      JSON.stringify({
        target_dir: targetDir,
        base_dir: TECH_SKILLS_DIR,
        variables: { PROJECT_NAME: 'my-app' },
        operations: [
          {
            type: 'template_dir',
            source: 'components/database/database-scaffolding/templates',
            dest: 'components/databases/primary-db',
          },
        ],
      })
    );

    const result = await runApply(specPath, tmpDir);
    expect(result.exitCode).toBe(0);
    expect(isDirectory(joinPath(targetDir, 'components', 'databases', 'primary-db'))).toBe(true);
  });

  it('merges package.json scripts', async () => {
    const targetDir = joinPath(tmpDir, 'scripts-test');
    await mkdir(targetDir);
    await writeFileAsync(
      joinPath(targetDir, 'package.json'),
      JSON.stringify({ name: 'test', scripts: { existing: 'keep' } }, null, 2) + '\n'
    );

    const specPath = joinPath(tmpDir, 'scripts-spec.json');
    await writeFileAsync(
      specPath,
      JSON.stringify({
        target_dir: targetDir,
        base_dir: TECH_SKILLS_DIR,
        variables: {},
        operations: [
          {
            type: 'package_json_scripts',
            scripts: {
              dev: 'npm run dev',
              existing: 'should-not-overwrite',
            },
          },
        ],
      })
    );

    const result = await runApply(specPath, tmpDir);
    expect(result.exitCode).toBe(0);

    const pkg = JSON.parse(readFile(joinPath(targetDir, 'package.json')));
    expect(pkg.scripts.dev).toBe('npm run dev');
    expect(pkg.scripts.existing).toBe('keep');
  });

  // -- Conditional operations --

  it('skips operations when condition is false', async () => {
    const targetDir = joinPath(tmpDir, 'condition-false-test');
    await mkdir(targetDir);

    const specPath = joinPath(tmpDir, 'condition-false-spec.json');
    await writeFileAsync(
      specPath,
      JSON.stringify({
        target_dir: targetDir,
        base_dir: TECH_SKILLS_DIR,
        variables: {},
        context: { has_databases: false },
        operations: [
          {
            type: 'mkdir',
            path: 'src/dal',
            when: { key: 'has_databases', equals: true },
          },
          {
            type: 'mkdir',
            path: 'src/model',
          },
        ],
      })
    );

    const result = await runApply(specPath, tmpDir);
    expect(result.exitCode).toBe(0);
    expect(isDirectory(joinPath(targetDir, 'src', 'dal'))).toBe(false);
    expect(isDirectory(joinPath(targetDir, 'src', 'model'))).toBe(true);
  });

  it('executes operations when condition is true', async () => {
    const targetDir = joinPath(tmpDir, 'condition-true-test');
    await mkdir(targetDir);

    const specPath = joinPath(tmpDir, 'condition-true-spec.json');
    await writeFileAsync(
      specPath,
      JSON.stringify({
        target_dir: targetDir,
        base_dir: TECH_SKILLS_DIR,
        variables: {},
        context: { has_databases: true },
        operations: [
          {
            type: 'mkdir',
            path: 'src/dal',
            when: { key: 'has_databases', equals: true },
          },
        ],
      })
    );

    const result = await runApply(specPath, tmpDir);
    expect(result.exitCode).toBe(0);
    expect(isDirectory(joinPath(targetDir, 'src', 'dal'))).toBe(true);
  });

  // -- Non-destructive behavior --

  it('skips existing files by default', async () => {
    const targetDir = joinPath(tmpDir, 'skip-test');
    await mkdir(targetDir);
    await writeFileAsync(joinPath(targetDir, 'README.md'), 'keep this');

    const specPath = joinPath(tmpDir, 'skip-spec.json');
    await writeFileAsync(
      specPath,
      JSON.stringify({
        target_dir: targetDir,
        base_dir: TECH_SKILLS_DIR,
        variables: {},
        operations: [
          { type: 'write_file', path: 'README.md', content: 'replace this' },
        ],
      })
    );

    const result = await runApply(specPath, tmpDir);
    expect(result.exitCode).toBe(0);
    expect(readFile(joinPath(targetDir, 'README.md'))).toBe('keep this');
  });

  it('overwrites with if_exists: overwrite', async () => {
    const targetDir = joinPath(tmpDir, 'overwrite-test');
    await mkdir(targetDir);
    await writeFileAsync(joinPath(targetDir, 'config.yaml'), 'old content');

    const specPath = joinPath(tmpDir, 'overwrite-spec.json');
    await writeFileAsync(
      specPath,
      JSON.stringify({
        target_dir: targetDir,
        base_dir: TECH_SKILLS_DIR,
        variables: {},
        operations: [
          {
            type: 'write_file',
            path: 'config.yaml',
            content: 'new content',
            if_exists: 'overwrite',
          },
        ],
      })
    );

    const result = await runApply(specPath, tmpDir);
    expect(result.exitCode).toBe(0);
    expect(readFile(joinPath(targetDir, 'config.yaml'))).toBe('new content');
  });

  // -- Dry run --

  it('dry run creates no files', async () => {
    const targetDir = joinPath(tmpDir, 'dryrun-test');
    await mkdir(targetDir);

    const specPath = joinPath(tmpDir, 'dryrun-spec.json');
    await writeFileAsync(
      specPath,
      JSON.stringify({
        target_dir: targetDir,
        base_dir: TECH_SKILLS_DIR,
        variables: {},
        operations: [
          { type: 'write_file', path: 'should-not-exist.txt', content: 'nope' },
          { type: 'mkdir', path: 'should-not-exist-dir' },
        ],
      })
    );

    const result = await runApply(specPath, tmpDir, true);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('dry-run');
    expect(fileExists(joinPath(targetDir, 'should-not-exist.txt'))).toBe(false);
    expect(isDirectory(joinPath(targetDir, 'should-not-exist-dir'))).toBe(false);
  });

  // -- Full spec with real templates --

  it('applies a frontend component spec using real templates', async () => {
    const targetDir = joinPath(tmpDir, 'frontend-test');
    await mkdir(targetDir);

    const specPath = joinPath(tmpDir, 'frontend-spec.json');
    await writeFileAsync(
      specPath,
      JSON.stringify({
        target_dir: targetDir,
        base_dir: TECH_SKILLS_DIR,
        variables: { PROJECT_NAME: 'my-app' },
        operations: [
          {
            type: 'template_dir',
            source: 'components/frontend/frontend-scaffolding/templates',
            dest: 'components/webapps/admin-dashboard',
          },
          {
            type: 'package_json_scripts',
            scripts: {
              'admin-dashboard:dev': 'npm run dev -w @my-app/admin-dashboard',
            },
          },
        ],
      })
    );

    // Need a package.json for the scripts merge
    await writeFileAsync(
      joinPath(targetDir, 'package.json'),
      JSON.stringify({ name: 'my-app', scripts: {} }, null, 2) + '\n'
    );

    const result = await runApply(specPath, tmpDir);
    expect(result.exitCode).toBe(0);
    expect(isDirectory(joinPath(targetDir, 'components', 'webapps', 'admin-dashboard'))).toBe(true);

    const pkg = JSON.parse(readFile(joinPath(targetDir, 'package.json')));
    expect(pkg.scripts['admin-dashboard:dev']).toBeDefined();
  });

  it('applies a backend component spec with conditional operations', async () => {
    const targetDir = joinPath(tmpDir, 'backend-test');
    await mkdir(targetDir);

    const specPath = joinPath(tmpDir, 'backend-spec.json');
    await writeFileAsync(
      specPath,
      JSON.stringify({
        target_dir: targetDir,
        base_dir: TECH_SKILLS_DIR,
        variables: { PROJECT_NAME: 'my-app', SERVER_NAME: 'task-service' },
        context: {
          has_databases: true,
          has_provides_contracts: false,
        },
        operations: [
          {
            type: 'template_dir',
            source: 'components/backend/backend-scaffolding/templates',
            dest: 'components/servers/task-service',
          },
          {
            type: 'write_file',
            path: 'components/servers/task-service/db-marker.txt',
            content: 'has databases',
            when: { key: 'has_databases', equals: true },
          },
          {
            type: 'write_file',
            path: 'components/servers/task-service/contract-marker.txt',
            content: 'has contracts',
            when: { key: 'has_provides_contracts', equals: true },
          },
        ],
      })
    );

    const result = await runApply(specPath, tmpDir);
    expect(result.exitCode).toBe(0);

    // Template dir should have created the server structure
    expect(isDirectory(joinPath(targetDir, 'components', 'servers', 'task-service'))).toBe(true);
    // db-marker should exist (has_databases: true)
    expect(fileExists(joinPath(targetDir, 'components', 'servers', 'task-service', 'db-marker.txt'))).toBe(true);
    // contract-marker should NOT exist (has_provides_contracts: false)
    expect(fileExists(joinPath(targetDir, 'components', 'servers', 'task-service', 'contract-marker.txt'))).toBe(false);
  });

  it('applies a project structure spec', async () => {
    const targetDir = joinPath(tmpDir, 'project-struct-test');
    await mkdir(targetDir);

    const specPath = joinPath(tmpDir, 'project-struct-spec.json');
    await writeFileAsync(
      specPath,
      JSON.stringify({
        target_dir: targetDir,
        base_dir: CORE_SKILLS_DIR,
        variables: {
          PROJECT_NAME: 'my-app',
          PROJECT_DESCRIPTION: 'My application',
          PRIMARY_DOMAIN: 'Task Management',
        },
        operations: [
          {
            type: 'template_file',
            source: 'project-scaffolding/templates/project/package.json',
            dest: 'package.json',
          },
          {
            type: 'template_file',
            source: 'project-scaffolding/templates/project/README.md',
            dest: 'README.md',
          },
          {
            type: 'write_file',
            path: '.gitignore',
            content: 'node_modules/\ndist/\n',
          },
          {
            type: 'mkdir',
            path: 'specs/domain/definitions',
            gitkeep: true,
          },
          {
            type: 'mkdir',
            path: 'specs/architecture',
            gitkeep: true,
          },
        ],
      })
    );

    const result = await runApply(specPath, tmpDir);
    expect(result.exitCode).toBe(0);

    expect(fileExists(joinPath(targetDir, 'package.json'))).toBe(true);
    expect(fileExists(joinPath(targetDir, 'README.md'))).toBe(true);
    expect(fileExists(joinPath(targetDir, '.gitignore'))).toBe(true);
    expect(isDirectory(joinPath(targetDir, 'specs', 'domain', 'definitions'))).toBe(true);
    expect(fileExists(joinPath(targetDir, 'specs', 'domain', 'definitions', '.gitkeep'))).toBe(true);

    const pkgContent = readFile(joinPath(targetDir, 'package.json'));
    expect(pkgContent).toContain('my-app');
    expect(pkgContent).not.toContain('{{PROJECT_NAME}}');
  });
});
