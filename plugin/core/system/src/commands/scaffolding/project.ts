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
 * e.g., "contract" -> "contracts", "database" -> "databases"
 */
const pluralizeType = (type: string): string => {
  const custom: Readonly<Record<string, string>> = {
    helm: 'helm_charts',
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
): Readonly<Record<string, string>> =>
  components.reduce<Readonly<Record<string, string>>>((scripts, component) => {
    const workspace = `-w @${projectName}/${component.name}`;

    switch (component.type) {
      case 'contract':
        return {
          ...scripts,
          [`${component.name}:generate`]: `npm run generate:types ${workspace}`,
          [`${component.name}:validate`]: `npm run validate ${workspace}`,
        };

      case 'server':
        return {
          ...scripts,
          [`${component.name}:dev`]: `npm run dev ${workspace}`,
          [`${component.name}:build`]: `npm run build ${workspace}`,
          [`${component.name}:start`]: `npm run start ${workspace}`,
          [`${component.name}:test`]: `npm run test ${workspace}`,
        };

      case 'webapp':
        return {
          ...scripts,
          [`${component.name}:dev`]: `npm run dev ${workspace}`,
          [`${component.name}:build`]: `npm run build ${workspace}`,
          [`${component.name}:preview`]: `npm run preview ${workspace}`,
          [`${component.name}:test`]: `npm run test ${workspace}`,
        };

      case 'database':
        return {
          ...scripts,
          [`${component.name}:setup`]: `npm run setup ${workspace}`,
          [`${component.name}:teardown`]: `npm run teardown ${workspace}`,
          [`${component.name}:migrate`]: `npm run migrate ${workspace}`,
          [`${component.name}:seed`]: `npm run seed ${workspace}`,
          [`${component.name}:reset`]: `npm run reset ${workspace}`,
          [`${component.name}:port-forward`]: `npm run port-forward ${workspace}`,
          [`${component.name}:psql`]: `npm run psql ${workspace}`,
        };

      case 'helm':
        return {
          ...scripts,
          [`${component.name}:lint`]: `helm lint components/${componentDirName(component)}`,
        };

      default:
        return scripts;
    }
  }, {});

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

  // -- Root files --
  const rootFileOps: ReadonlyArray<ScaffoldOperation> = [
    {
      type: 'write_file',
      path: '.gitignore',
      content: 'node_modules/\n.env\n.DS_Store\ndist/\n*.log\n',
    },
    {
      type: 'write_file',
      path: '.claudeignore',
      content: 'sdd/archive/\n',
    },
  ];

  // -- Project template files --
  // Project templates live in the tech pack (one level above skills_dir)
  const techPackTemplatesDir = path.resolve(config.skills_dir, '..', 'templates');
  const projectTemplateOps: ReadonlyArray<ScaffoldOperation> = [
    {
      type: 'template_file',
      source: path.join(techPackTemplatesDir, 'project/README.md'),
      dest: 'README.md',
    },
    {
      type: 'template_file',
      source: path.join(techPackTemplatesDir, 'project/CLAUDE.md'),
      dest: 'CLAUDE.md',
    },
    {
      type: 'template_file',
      source: path.join(techPackTemplatesDir, 'project/package.json'),
      dest: 'package.json',
    },
  ];

  // -- Spec files (core methodology templates) --
  const coreSkillsDir = getSkillsDir();
  const specFileOps: ReadonlyArray<ScaffoldOperation> = [
    {
      type: 'template_file',
      source: path.join(coreSkillsDir, 'project-scaffolding/templates/specs/SNAPSHOT.md'),
      dest: 'specs/SNAPSHOT.md',
    },
    {
      type: 'template_file',
      source: path.join(coreSkillsDir, 'project-scaffolding/templates/specs/glossary.md'),
      dest: 'specs/domain/glossary.md',
    },
    {
      type: 'template_file',
      source: path.join(coreSkillsDir, 'project-scaffolding/templates/changes/INDEX.md'),
      dest: 'changes/INDEX.md',
    },
  ];

  // -- Specs directories with .gitkeep --
  const gitkeepDirs = [
    'specs/domain/definitions',
    'specs/domain/use-cases',
    'specs/architecture',
    'changes',
    'sdd/archive/external-specs',
    'sdd/archive/revised-specs',
    'sdd/archive/workflow-regressions',
  ];
  const gitkeepOps: ReadonlyArray<ScaffoldOperation> = gitkeepDirs.map((dir) => ({
    type: 'mkdir' as const,
    path: dir,
    gitkeep: true,
  }));

  // -- Architecture overview (computed content) --
  const architectureOps: ReadonlyArray<ScaffoldOperation> = [
    {
      type: 'write_file',
      path: 'specs/architecture/overview.md',
      content: buildArchitectureContent(config),
    },
  ];

  // -- Config component (mandatory singleton) --
  const configOps: ReadonlyArray<ScaffoldOperation> = [
    {
      type: 'template_dir',
      source: 'components/config/config-scaffolding/templates',
      dest: 'components/config',
    },
  ];

  // -- Contract components --
  const contractComponents = getComponentsByType(components, 'contract');
  const contractOps: ReadonlyArray<ScaffoldOperation> = contractComponents.flatMap((contract) => {
    const dirName = componentDirName(contract);
    return [
      {
        type: 'template_dir' as const,
        source: 'components/contract/contract-scaffolding/templates',
        dest: `components/${dirName}`,
      },
      {
        type: 'write_file' as const,
        path: `components/${dirName}/.gitignore`,
        content: 'node_modules/\ngenerated/\n',
      },
    ];
  });

  // -- Server components --
  const serverComponents = getComponentsByType(components, 'server');
  const serverOps: ReadonlyArray<ScaffoldOperation> = serverComponents.map((server) => {
    const dirName = componentDirName(server);
    return {
      type: 'template_dir' as const,
      source: 'components/backend/backend-scaffolding/templates',
      dest: `components/${dirName}`,
    };
  });

  // -- Webapp components --
  const webappComponents = getComponentsByType(components, 'webapp');
  const webappOps: ReadonlyArray<ScaffoldOperation> = webappComponents.map((webapp) => {
    const dirName = componentDirName(webapp);
    return {
      type: 'template_dir' as const,
      source: 'components/frontend/frontend-scaffolding/templates',
      dest: `components/${dirName}`,
    };
  });

  // -- Database components --
  const databaseComponents = getComponentsByType(components, 'database');
  const databaseOps: ReadonlyArray<ScaffoldOperation> = databaseComponents.flatMap((database) => {
    const dirName = componentDirName(database);
    return [
      {
        type: 'template_dir' as const,
        source: 'components/database/database-scaffolding/templates',
        dest: `components/${dirName}`,
      },
      { type: 'mkdir' as const, path: `components/${dirName}/migrations` },
      { type: 'mkdir' as const, path: `components/${dirName}/seeds` },
      { type: 'mkdir' as const, path: `components/${dirName}/scripts` },
    ];
  });

  // -- Helm component directories --
  const helmComponents = getComponentsByType(components, 'helm');
  const helmOps: ReadonlyArray<ScaffoldOperation> = helmComponents.map((helm) => {
    const dirName = componentDirName(helm);
    return { type: 'mkdir' as const, path: `components/${dirName}` };
  });

  // -- Testing component directories --
  const testingComponents = getComponentsByType(components, 'testing');
  const testingOps: ReadonlyArray<ScaffoldOperation> = testingComponents.flatMap((testing) => {
    const dirName = componentDirName(testing);
    return [
      { type: 'mkdir' as const, path: `components/${dirName}/tests/integration` },
      { type: 'mkdir' as const, path: `components/${dirName}/tests/component` },
      { type: 'mkdir' as const, path: `components/${dirName}/tests/e2e` },
      { type: 'mkdir' as const, path: `components/${dirName}/testsuites` },
    ];
  });

  // -- CI/CD components --
  const cicdComponents = getComponentsByType(components, 'cicd');
  const cicdOps: ReadonlyArray<ScaffoldOperation> = cicdComponents.flatMap((cicd) => {
    const dirName = componentDirName(cicd);
    return [
      {
        type: 'write_file' as const,
        path: `components/${dirName}/ci.yaml`,
        content: CI_WORKFLOW_CONTENT,
      },
      {
        type: 'write_file' as const,
        path: '.github/workflows/ci.yaml',
        content: CI_WORKFLOW_CONTENT,
      },
    ];
  });

  // -- Component scripts (no meta-scripts) --
  const scripts = generateComponentScripts(components, config.project_name);
  const scriptOps: ReadonlyArray<ScaffoldOperation> =
    Object.keys(scripts).length > 0
      ? [{ type: 'package_json_scripts' as const, scripts }]
      : [];

  const operations: ReadonlyArray<ScaffoldOperation> = [
    ...rootFileOps,
    ...projectTemplateOps,
    ...specFileOps,
    ...gitkeepOps,
    ...architectureOps,
    ...configOps,
    ...contractOps,
    ...serverOps,
    ...webappOps,
    ...databaseOps,
    ...helmOps,
    ...testingOps,
    ...cicdOps,
    ...scriptOps,
  ];

  // Build variables with per-component contract package support
  const variables: Readonly<Record<string, string>> = {
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
