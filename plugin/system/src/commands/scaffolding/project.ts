/**
 * Project scaffolding command.
 *
 * Creates project structure from templates with variable substitution.
 * Builds a scaffold spec and delegates to the generic engine.
 *
 * Usage:
 *   sdd-system scaffolding project --config config.json
 */

import * as path from 'node:path';
import type { CommandResult } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { exists, readText } from '@/lib/fs';
import type { ScaffoldingConfig, ComponentEntry, ScaffoldingResult } from '@/types/component';
import { getSkillsDir } from '@/lib/config';
import { executeSpec } from './engine';
import type { ScaffoldSpec, ScaffoldOperation } from './engine';

/**
 * Pluralize a component type for directory naming.
 * e.g., "contract" → "contracts", "database" → "databases"
 */
const pluralizeType = (type: string): string => {
  const custom: Readonly<Record<string, string>> = {
    helm: 'helm-charts',
    testing: 'testing',
  };
  return custom[type] ?? `${type}s`;
};

/**
 * Derive the directory path for a component.
 * Format: <type>s/<name> (e.g., "contracts/public-api", "servers/main")
 */
const componentDirName = (component: ComponentEntry): string =>
  `${pluralizeType(component.type)}/${component.name}`;

/**
 * Get all components of a specific type.
 */
const getComponentsByType = (
  components: readonly ComponentEntry[],
  componentType: string
): readonly ComponentEntry[] => components.filter((c) => c.type === componentType);

/**
 * Generate per-component npm scripts.
 */
const generateComponentScripts = (
  components: readonly ComponentEntry[],
  projectName: string
): Readonly<Record<string, string>> => {
  const scripts: Record<string, string> = {};

  for (const component of components) {
    const workspace = `-w @${projectName}/${component.name}`;

    switch (component.type) {
      case 'contract':
        scripts[`${component.name}:generate`] = `npm run generate:types ${workspace}`;
        scripts[`${component.name}:validate`] = `npm run validate ${workspace}`;
        break;

      case 'server':
        scripts[`${component.name}:dev`] = `npm run dev ${workspace}`;
        scripts[`${component.name}:build`] = `npm run build ${workspace}`;
        scripts[`${component.name}:start`] = `npm run start ${workspace}`;
        scripts[`${component.name}:test`] = `npm run test ${workspace}`;
        break;

      case 'webapp':
        scripts[`${component.name}:dev`] = `npm run dev ${workspace}`;
        scripts[`${component.name}:build`] = `npm run build ${workspace}`;
        scripts[`${component.name}:preview`] = `npm run preview ${workspace}`;
        scripts[`${component.name}:test`] = `npm run test ${workspace}`;
        break;

      case 'database':
        scripts[`${component.name}:setup`] = `npm run setup ${workspace}`;
        scripts[`${component.name}:teardown`] = `npm run teardown ${workspace}`;
        scripts[`${component.name}:migrate`] = `npm run migrate ${workspace}`;
        scripts[`${component.name}:seed`] = `npm run seed ${workspace}`;
        scripts[`${component.name}:reset`] = `npm run reset ${workspace}`;
        scripts[`${component.name}:port-forward`] = `npm run port-forward ${workspace}`;
        scripts[`${component.name}:psql`] = `npm run psql ${workspace}`;
        break;

      case 'helm':
        scripts[`${component.name}:lint`] = `helm lint components/${componentDirName(component)}`;
        break;
    }
  }

  return scripts;
};

/**
 * Build the architecture overview content.
 */
const buildArchitectureContent = (
  config: ScaffoldingConfig
): string => {
  const typeDescriptions: Readonly<Record<string, string>> = {
    contract: 'OpenAPI specifications and type generation',
    server: 'Node.js/TypeScript backend with CMDO architecture',
    webapp: 'React/TypeScript frontend with MVVM pattern',
    database: 'PostgreSQL migrations, seeds, and management scripts',
    helm: 'Kubernetes deployment charts',
    testing: 'Testkube test definitions',
    cicd: 'CI/CD workflow definitions',
  };

  const componentLines = config.components.map((component) => {
    const dirName = componentDirName(component);
    const displayName = component.name.charAt(0).toUpperCase() + component.name.slice(1);
    const description = typeDescriptions[component.type] ?? component.type;
    return `- **${displayName}** (\`components/${dirName}/\`): ${description}`;
  });

  return `# Architecture Overview

This document describes the architecture of ${config.project_name}.

## Components

- **Config** (\`components/config/\`): YAML-based configuration management
${componentLines.join('\n')}
`;
};

/**
 * Build CI/CD workflow content.
 */
const CI_WORKFLOW_CONTENT = `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm install --workspaces

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm run test

      - name: Build
        run: npm run build
`;

/**
 * Build a scaffold spec from the existing project config.
 */
const buildProjectSpec = (config: ScaffoldingConfig): ScaffoldSpec => {
  const components = config.components;
  const operations: ScaffoldOperation[] = [];

  // -- Root files --
  operations.push({
    type: 'write_file',
    path: '.gitignore',
    content: 'node_modules/\n.env\n.DS_Store\ndist/\n*.log\n',
  });
  operations.push({
    type: 'write_file',
    path: '.claudeignore',
    content: 'archive/\n',
  });

  // -- Project template files --
  operations.push({
    type: 'template_file',
    source: 'project-scaffolding/templates/project/README.md',
    dest: 'README.md',
  });
  operations.push({
    type: 'template_file',
    source: 'project-scaffolding/templates/project/CLAUDE.md',
    dest: 'CLAUDE.md',
  });
  operations.push({
    type: 'template_file',
    source: 'project-scaffolding/templates/project/package.json',
    dest: 'package.json',
  });

  // -- Spec files --
  operations.push({
    type: 'template_file',
    source: 'project-scaffolding/templates/specs/SNAPSHOT.md',
    dest: 'specs/SNAPSHOT.md',
  });
  operations.push({
    type: 'template_file',
    source: 'project-scaffolding/templates/specs/glossary.md',
    dest: 'specs/domain/glossary.md',
  });
  operations.push({
    type: 'template_file',
    source: 'project-scaffolding/templates/changes/INDEX.md',
    dest: 'changes/INDEX.md',
  });

  // -- Specs directories with .gitkeep --
  const gitkeepDirs = [
    'specs/domain/definitions',
    'specs/domain/use-cases',
    'specs/architecture',
    'changes',
    'archive',
  ];
  for (const dir of gitkeepDirs) {
    operations.push({ type: 'mkdir', path: dir, gitkeep: true });
  }

  // -- Architecture overview (computed content) --
  operations.push({
    type: 'write_file',
    path: 'specs/architecture/overview.md',
    content: buildArchitectureContent(config),
  });

  // -- Config component (mandatory singleton) --
  operations.push({
    type: 'template_dir',
    source: 'components/config/config-scaffolding/templates',
    dest: 'components/config',
  });

  // -- Contract components --
  const contractComponents = getComponentsByType(components, 'contract');
  for (const contract of contractComponents) {
    const dirName = componentDirName(contract);
    operations.push({
      type: 'template_dir',
      source: 'components/contract/contract-scaffolding/templates',
      dest: `components/${dirName}`,
    });
    operations.push({
      type: 'write_file',
      path: `components/${dirName}/.gitignore`,
      content: 'node_modules/\ngenerated/\n',
    });
  }

  // -- Server components --
  const serverComponents = getComponentsByType(components, 'server');
  for (const server of serverComponents) {
    const dirName = componentDirName(server);
    operations.push({
      type: 'template_dir',
      source: 'components/backend/backend-scaffolding/templates',
      dest: `components/${dirName}`,
    });
  }

  // -- Webapp components --
  const webappComponents = getComponentsByType(components, 'webapp');
  for (const webapp of webappComponents) {
    const dirName = componentDirName(webapp);
    operations.push({
      type: 'template_dir',
      source: 'components/frontend/frontend-scaffolding/templates',
      dest: `components/${dirName}`,
    });
  }

  // -- Database components --
  const databaseComponents = getComponentsByType(components, 'database');
  for (const database of databaseComponents) {
    const dirName = componentDirName(database);
    operations.push({
      type: 'template_dir',
      source: 'components/database/database-scaffolding/templates',
      dest: `components/${dirName}`,
    });
    // Additional directories for database component
    operations.push({ type: 'mkdir', path: `components/${dirName}/migrations` });
    operations.push({ type: 'mkdir', path: `components/${dirName}/seeds` });
    operations.push({ type: 'mkdir', path: `components/${dirName}/scripts` });
  }

  // -- Helm component directories --
  const helmComponents = getComponentsByType(components, 'helm');
  for (const helm of helmComponents) {
    const dirName = componentDirName(helm);
    operations.push({ type: 'mkdir', path: `components/${dirName}` });
  }

  // -- Testing component directories --
  const testingComponents = getComponentsByType(components, 'testing');
  for (const testing of testingComponents) {
    const dirName = componentDirName(testing);
    operations.push({ type: 'mkdir', path: `components/${dirName}/tests/integration` });
    operations.push({ type: 'mkdir', path: `components/${dirName}/tests/component` });
    operations.push({ type: 'mkdir', path: `components/${dirName}/tests/e2e` });
    operations.push({ type: 'mkdir', path: `components/${dirName}/testsuites` });
  }

  // -- CI/CD components --
  const cicdComponents = getComponentsByType(components, 'cicd');
  for (const cicd of cicdComponents) {
    const dirName = componentDirName(cicd);
    operations.push({
      type: 'write_file',
      path: `components/${dirName}/ci.yaml`,
      content: CI_WORKFLOW_CONTENT,
    });
    operations.push({
      type: 'write_file',
      path: '.github/workflows/ci.yaml',
      content: CI_WORKFLOW_CONTENT,
    });
  }

  // -- Component scripts (no meta-scripts) --
  const scripts = generateComponentScripts(components, config.project_name);
  if (Object.keys(scripts).length > 0) {
    operations.push({ type: 'package_json_scripts', scripts });
  }

  // Build variables with per-component contract package support
  const variables: Record<string, string> = {
    PROJECT_NAME: config.project_name,
    PROJECT_DESCRIPTION: config.project_description,
    PRIMARY_DOMAIN: config.primary_domain,
  };

  return {
    target_dir: config.target_dir,
    base_dir: config.skills_dir,
    variables,
    operations,
  };
};

/**
 * Run scaffolding by building a spec and executing it through the engine.
 */
const runScaffolding = async (config: ScaffoldingConfig): Promise<ScaffoldingResult> => {
  console.log(`\nScaffolding project: ${config.project_name}`);
  console.log(`Target: ${config.target_dir}`);
  console.log();

  const spec = buildProjectSpec(config);
  const result = await executeSpec(spec);

  console.log(`\n${'='.repeat(60)}`);
  console.log('Scaffolding complete!');
  console.log(`${'='.repeat(60)}`);
  console.log(result.summary);

  return {
    success: result.success,
    target_dir: config.target_dir,
    created_dirs: result.created.dirs.length,
    created_files: result.created.files.length,
    files: result.created.files,
    ...(result.errors.length > 0 ? { error: result.errors.join('; ') } : {}),
  };
};

export const scaffoldProject = async (args: readonly string[]): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);
  const configPath = named['config'];

  if (!configPath) {
    return {
      success: false,
      error: 'Missing --config argument. Usage: sdd-system scaffolding project --config config.json',
    };
  }

  if (!(await exists(configPath))) {
    return {
      success: false,
      error: `Config file not found: ${configPath}`,
    };
  }

  const configContent = await readText(configPath);
  const rawConfig = JSON.parse(configContent) as Record<string, unknown>;

  // Support both old template_dir and new skills_dir
  const skillsDir =
    (rawConfig['skills_dir'] as string | undefined) ??
    (rawConfig['template_dir']
      ? path.join(path.dirname(rawConfig['template_dir'] as string), 'skills')
      : getSkillsDir());

  // Validate required fields
  const required = ['project_name', 'target_dir', 'components'];
  const missingFields = required.filter((field) => !(field in rawConfig));
  if (missingFields.length > 0) {
    return {
      success: false,
      error: `Missing required config fields: ${missingFields.join(', ')}`,
    };
  }

  // Set defaults
  const config: ScaffoldingConfig = {
    project_name: rawConfig['project_name'] as string,
    project_description:
      (rawConfig['project_description'] as string) ?? `A ${rawConfig['project_name']} project`,
    primary_domain: (rawConfig['primary_domain'] as string) ?? 'General',
    target_dir: rawConfig['target_dir'] as string,
    components: rawConfig['components'] as readonly ComponentEntry[],
    skills_dir: skillsDir,
  };

  try {
    const result = await runScaffolding(config);

    return {
      success: result.success,
      message: result.success
        ? `Scaffolding complete: ${result.created_files} files, ${result.created_dirs} directories`
        : undefined,
      error: result.error,
      data: result,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: errorMessage,
    };
  }
};
