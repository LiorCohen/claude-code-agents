#!/usr/bin/env npx ts-node --esm
/**
 * SDD Project Scaffolding Script
 *
 * Creates project structure from templates with variable substitution.
 * Called by Claude after user approves project configuration.
 *
 * Templates are colocated with their scaffolding skills:
 * - skills/project-scaffolding/templates/ - Root files, specs, config
 * - skills/backend-scaffolding/templates/ - Server components
 * - skills/frontend-scaffolding/templates/ - Webapp components
 * - skills/contract-scaffolding/templates/ - Contract component
 * - skills/database-scaffolding/templates/ - Database component
 *
 * Usage:
 *   npx ts-node --esm scaffolding.ts --config config.json
 *
 * Config JSON format:
 * {
 *   "project_name": "my-app",
 *   "project_description": "My application",
 *   "primary_domain": "E-commerce",
 *   "target_dir": "/path/to/output",
 *   "components": [{"type": "server", "name": "order-service"}],
 *   "skills_dir": "/path/to/skills"
 * }
 */

import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';

interface ComponentEntry {
  readonly type: string;
  readonly name: string;
  readonly depends_on?: readonly string[];
}

interface Config {
  readonly project_name: string;
  readonly project_description: string;
  readonly primary_domain: string;
  readonly target_dir: string;
  readonly components: readonly ComponentEntry[];
  readonly skills_dir: string;
}

interface ScaffoldingResult {
  readonly success: boolean;
  readonly target_dir: string;
  readonly created_dirs: number;
  readonly created_files: number;
  readonly files: readonly string[];
  readonly error?: string;
}

/**
 * Derive the directory name for a component.
 * When type = name: "components/{type}/"
 * When type ≠ name: "components/{type}-{name}/"
 */
const componentDirName = (component: ComponentEntry): string =>
  component.type === component.name ? component.type : `${component.type}-${component.name}`;

/**
 * Get all components of a specific type.
 */
const getComponentsByType = (
  components: readonly ComponentEntry[],
  componentType: string
): readonly ComponentEntry[] =>
  components.filter((c) => c.type === componentType);

/**
 * Replace template variables with config values.
 */
const substituteVariables = (content: string, config: Config, component?: ComponentEntry): string => {
  const replacements: Record<string, string> = {
    '{{PROJECT_NAME}}': config.project_name,
    '{{PROJECT_DESCRIPTION}}': config.project_description,
    '{{PRIMARY_DOMAIN}}': config.primary_domain,
  };

  if (component?.depends_on) {
    const contractPackages = component.depends_on.map((dep) => `@${config.project_name}/${dep}`);
    replacements['{{CONTRACT_PACKAGE}}'] = contractPackages[0] ?? '';
  }

  let result = content;
  for (const [variable, value] of Object.entries(replacements)) {
    result = result.replaceAll(variable, value);
  }
  return result;
};

const SUBSTITUTABLE_EXTENSIONS = ['.md', '.json', '.yaml', '.yml', '.ts', '.tsx', '.html', '.css', '.js'];

/**
 * Copy a template file, optionally substituting variables.
 */
const copyTemplateFile = async (
  src: string,
  dest: string,
  config: Config,
  component?: ComponentEntry,
  substitute = true
): Promise<void> => {
  await fsp.mkdir(path.dirname(dest), { recursive: true });

  const ext = path.extname(src);
  if (substitute && SUBSTITUTABLE_EXTENSIONS.includes(ext)) {
    const content = await fsp.readFile(src, 'utf-8');
    const substituted = substituteVariables(content, config, component);
    await fsp.writeFile(dest, substituted);
  } else {
    await fsp.copyFile(src, dest);
  }

  const relativePath = path.relative(config.target_dir, dest);
  console.log(`  Created: ${relativePath}`);
};

/**
 * Create a directory if it doesn't exist.
 */
const createDirectory = async (dirPath: string, config: Config): Promise<void> => {
  await fsp.mkdir(dirPath, { recursive: true });
  const relativePath = path.relative(config.target_dir, dirPath);
  console.log(`  Created: ${relativePath}/`);
};

/**
 * Check if a directory exists.
 */
const directoryExists = (dirPath: string): boolean => {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
};

/**
 * Recursively walk a directory and return all file paths.
 */
const walkDir = async (dir: string): Promise<readonly string[]> => {
  const files: string[] = [];
  const entries = await fsp.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await walkDir(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
};

/**
 * Create the complete project structure.
 */
const scaffoldProject = async (config: Config): Promise<ScaffoldingResult> => {
  const target = config.target_dir;
  const skillsDir = config.skills_dir;
  const components = config.components;

  // Template locations (colocated with skills)
  const projectTemplates = path.join(skillsDir, 'project-scaffolding', 'templates');
  const backendTemplates = path.join(skillsDir, 'backend-scaffolding', 'templates');
  const frontendTemplates = path.join(skillsDir, 'frontend-scaffolding', 'templates');
  const contractTemplates = path.join(skillsDir, 'contract-scaffolding', 'templates');
  const databaseTemplates = path.join(skillsDir, 'database-scaffolding', 'templates');

  // Group components by type
  const contractComponents = getComponentsByType(components, 'contract');
  const serverComponents = getComponentsByType(components, 'server');
  const webappComponents = getComponentsByType(components, 'webapp');
  const databaseComponents = getComponentsByType(components, 'database');
  const helmComponents = getComponentsByType(components, 'helm');
  const testingComponents = getComponentsByType(components, 'testing');
  const cicdComponents = getComponentsByType(components, 'cicd');

  const createdFiles: string[] = [];
  const createdDirs: string[] = [];

  // Create target directory
  await fsp.mkdir(target, { recursive: true });

  // Build display string for components
  const componentDisplay = components.map((c) =>
    c.type === c.name ? c.type : `${c.type}:${c.name}`
  );

  console.log(`\nScaffolding project: ${config.project_name}`);
  console.log(`Target: ${target}`);
  console.log(`Components: ${componentDisplay.join(', ')}`);
  console.log();

  // -------------------------------------------------------------------------
  // Step 1: Create root .gitignore
  // -------------------------------------------------------------------------
  console.log('Creating root files...');
  const gitignore = path.join(target, '.gitignore');
  await fsp.writeFile(
    gitignore,
    `node_modules/
.env
.DS_Store
dist/
*.log
`
  );
  createdFiles.push('.gitignore');
  console.log('  Created: .gitignore');

  // -------------------------------------------------------------------------
  // Step 2: Create directory structure
  // -------------------------------------------------------------------------
  console.log('\nCreating directory structure...');

  // Always create specs directories
  const specsDirs = [
    'specs',
    'specs/domain',
    'specs/domain/definitions',
    'specs/domain/use-cases',
    'specs/architecture',
    'specs/changes',
    'specs/external',
  ];
  for (const d of specsDirs) {
    await createDirectory(path.join(target, d), config);
    createdDirs.push(d);
  }

  // Config is always created at project root (not a component)
  const configDirs = ['config', 'config/schemas'];
  for (const d of configDirs) {
    await createDirectory(path.join(target, d), config);
    createdDirs.push(d);
  }

  // Contract components
  for (const contract of contractComponents) {
    const dirName = componentDirName(contract);
    await createDirectory(path.join(target, `components/${dirName}`), config);
    createdDirs.push(`components/${dirName}`);
  }

  // Server components
  for (const server of serverComponents) {
    const dirName = componentDirName(server);
    const serverSubdirs = [
      `components/${dirName}/src/operator`,
      `components/${dirName}/src/config`,
      `components/${dirName}/src/controller/http_handlers`,
      `components/${dirName}/src/model/definitions`,
      `components/${dirName}/src/model/use-cases`,
      `components/${dirName}/src/dal`,
    ];
    for (const d of serverSubdirs) {
      await createDirectory(path.join(target, d), config);
      createdDirs.push(d);
    }
  }

  // Webapp components
  for (const webapp of webappComponents) {
    const dirName = componentDirName(webapp);
    const webappSubdirs = [
      `components/${dirName}/src/pages`,
      `components/${dirName}/src/components`,
      `components/${dirName}/src/viewmodels`,
      `components/${dirName}/src/models`,
      `components/${dirName}/src/services`,
      `components/${dirName}/src/stores`,
      `components/${dirName}/src/types`,
      `components/${dirName}/src/utils`,
    ];
    for (const d of webappSubdirs) {
      await createDirectory(path.join(target, d), config);
      createdDirs.push(d);
    }
  }

  // Helm components
  for (const helm of helmComponents) {
    const dirName = componentDirName(helm);
    await createDirectory(path.join(target, `components/${dirName}`), config);
    createdDirs.push(`components/${dirName}`);
  }

  // Testing components
  for (const testing of testingComponents) {
    const dirName = componentDirName(testing);
    const testingDirs = [
      `components/${dirName}/tests/integration`,
      `components/${dirName}/tests/component`,
      `components/${dirName}/tests/e2e`,
      `components/${dirName}/testsuites`,
    ];
    for (const d of testingDirs) {
      await createDirectory(path.join(target, d), config);
      createdDirs.push(d);
    }
  }

  // CI/CD components
  for (const cicd of cicdComponents) {
    const dirName = componentDirName(cicd);
    await createDirectory(path.join(target, `components/${dirName}`), config);
    createdDirs.push(`components/${dirName}`);
    // Also create .github/workflows/ as deployment target
    await createDirectory(path.join(target, '.github/workflows'), config);
    createdDirs.push('.github/workflows');
  }

  // Database components
  for (const database of databaseComponents) {
    const dirName = componentDirName(database);
    const databaseDirs = [
      `components/${dirName}`,
      `components/${dirName}/migrations`,
      `components/${dirName}/seeds`,
      `components/${dirName}/scripts`,
    ];
    for (const d of databaseDirs) {
      await createDirectory(path.join(target, d), config);
      createdDirs.push(d);
    }
  }

  // -------------------------------------------------------------------------
  // Step 3: Copy and customize template files
  // -------------------------------------------------------------------------
  console.log('\nCopying template files...');

  // Root project files (from project-scaffolding skill)
  const projectFilesDir = path.join(projectTemplates, 'project');
  if (directoryExists(projectFilesDir)) {
    for (const templateFile of ['README.md', 'CLAUDE.md', 'package.json']) {
      const src = path.join(projectFilesDir, templateFile);
      if (fs.existsSync(src)) {
        await copyTemplateFile(src, path.join(target, templateFile), config);
        createdFiles.push(templateFile);
      }
    }
  }

  // Spec files (from project-scaffolding skill)
  const specsFilesDir = path.join(projectTemplates, 'specs');
  if (directoryExists(specsFilesDir)) {
    const specFiles: ReadonlyArray<readonly [string, string]> = [
      ['INDEX.md', 'specs/INDEX.md'],
      ['SNAPSHOT.md', 'specs/SNAPSHOT.md'],
      ['glossary.md', 'specs/domain/glossary.md'],
    ];
    for (const [srcName, destPath] of specFiles) {
      const src = path.join(specsFilesDir, srcName);
      if (fs.existsSync(src)) {
        await copyTemplateFile(src, path.join(target, destPath), config);
        createdFiles.push(destPath);
      }
    }
  }

  // Architecture overview (generate, not from template)
  const archOverview = path.join(target, 'specs/architecture/overview.md');
  let archContent = `# Architecture Overview

This document describes the architecture of ${config.project_name}.

## Components

- **Config** (\`config/\`): YAML-based configuration management
`;

  // Add all components dynamically
  const typeDescriptions: Record<string, string> = {
    contract: 'OpenAPI specifications and type generation',
    server: 'Node.js/TypeScript backend with CMDO architecture',
    webapp: 'React/TypeScript frontend with MVVM pattern',
    database: 'PostgreSQL migrations, seeds, and management scripts',
    helm: 'Kubernetes deployment charts',
    testing: 'Testkube test definitions',
    cicd: 'CI/CD workflow definitions',
  };

  for (const component of components) {
    const dirName = componentDirName(component);
    const displayName = component.name.charAt(0).toUpperCase() + component.name.slice(1);
    const description = typeDescriptions[component.type] ?? component.type;
    archContent += `- **${displayName}** (\`components/${dirName}/\`): ${description}\n`;
  }

  await fsp.writeFile(archOverview, archContent);
  createdFiles.push('specs/architecture/overview.md');
  console.log('  Created: specs/architecture/overview.md');

  // Config files (from project-scaffolding skill, always created at root config/)
  const configFilesDir = path.join(projectTemplates, 'config');
  if (directoryExists(configFilesDir)) {
    const configFilesList = [
      'config.yaml',
      'config-local.yaml',
      'config-testing.yaml',
      'config-production.yaml',
      'schemas/schema.json',
      'schemas/ops-schema.json',
      'schemas/app-schema.json',
    ];
    for (const cf of configFilesList) {
      const src = path.join(configFilesDir, cf);
      if (fs.existsSync(src)) {
        await copyTemplateFile(src, path.join(target, 'config', cf), config);
        createdFiles.push(`config/${cf}`);
      }
    }
  }

  // Contract components (from contract-scaffolding skill)
  if (directoryExists(contractTemplates)) {
    for (const contract of contractComponents) {
      const dirName = componentDirName(contract);
      const contractFiles = ['package.json', 'openapi.yaml'];
      for (const cf of contractFiles) {
        const src = path.join(contractTemplates, cf);
        if (fs.existsSync(src)) {
          await copyTemplateFile(src, path.join(target, `components/${dirName}`, cf), config, contract);
          createdFiles.push(`components/${dirName}/${cf}`);
        }
      }

      // Create contract .gitignore
      const contractGitignore = path.join(target, `components/${dirName}/.gitignore`);
      await fsp.writeFile(contractGitignore, 'node_modules/\ngenerated/\n');
      createdFiles.push(`components/${dirName}/.gitignore`);
      console.log(`  Created: components/${dirName}/.gitignore`);
    }
  }

  // Server components (from backend-scaffolding skill)
  if (directoryExists(backendTemplates)) {
    for (const server of serverComponents) {
      const dirName = componentDirName(server);

      // Walk through all server template files
      const srcFiles = await walkDir(backendTemplates);
      for (const srcFile of srcFiles) {
        const relPath = path.relative(backendTemplates, srcFile);
        const destFile = path.join(target, `components/${dirName}`, relPath);
        await copyTemplateFile(srcFile, destFile, config, server);
        createdFiles.push(`components/${dirName}/${relPath}`);
      }
    }
  }

  // Webapp components (from frontend-scaffolding skill)
  if (directoryExists(frontendTemplates)) {
    for (const webapp of webappComponents) {
      const dirName = componentDirName(webapp);

      // Walk through all webapp template files
      const srcFiles = await walkDir(frontendTemplates);
      for (const srcFile of srcFiles) {
        const relPath = path.relative(frontendTemplates, srcFile);
        const destFile = path.join(target, `components/${dirName}`, relPath);
        await copyTemplateFile(srcFile, destFile, config, webapp);
        createdFiles.push(`components/${dirName}/${relPath}`);
      }
    }
  }

  // Database components (from database-scaffolding skill)
  if (directoryExists(databaseTemplates)) {
    for (const database of databaseComponents) {
      const dirName = componentDirName(database);

      // Walk through all database template files
      const srcFiles = await walkDir(databaseTemplates);
      for (const srcFile of srcFiles) {
        const relPath = path.relative(databaseTemplates, srcFile);
        const destFile = path.join(target, `components/${dirName}`, relPath);
        await copyTemplateFile(srcFile, destFile, config);
        createdFiles.push(`components/${dirName}/${relPath}`);
      }
    }
  }

  // CI/CD workflows
  for (const cicd of cicdComponents) {
    const dirName = componentDirName(cicd);
    const ciWorkflow = path.join(target, `components/${dirName}/ci.yaml`);

    const ciContent = `name: CI

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
    await fsp.writeFile(ciWorkflow, ciContent);
    createdFiles.push(`components/${dirName}/ci.yaml`);
    console.log(`  Created: components/${dirName}/ci.yaml`);

    // Also copy to .github/workflows/ as deployment target
    const deployedWorkflow = path.join(target, '.github/workflows/ci.yaml');
    await fsp.writeFile(deployedWorkflow, ciContent);
    createdFiles.push('.github/workflows/ci.yaml');
    console.log('  Created: .github/workflows/ci.yaml');
  }

  // -------------------------------------------------------------------------
  // Step 4: Generate component-specific npm scripts in root package.json
  // -------------------------------------------------------------------------
  console.log('\nGenerating npm scripts...');

  const pkgPath = path.join(target, 'package.json');
  const pkgContent = await fsp.readFile(pkgPath, 'utf-8');
  const pkg = JSON.parse(pkgContent) as { scripts: Record<string, string> };

  const scripts: Record<string, string> = {};
  const contracts: string[] = [];
  const servers: string[] = [];
  const webapps: string[] = [];
  const databases: string[] = [];

  for (const component of components) {
    const workspace = `-w @${config.project_name}/${component.name}`;

    switch (component.type) {
      case 'contract':
        contracts.push(component.name);
        scripts[`${component.name}:generate`] = `npm run generate:types ${workspace}`;
        scripts[`${component.name}:validate`] = `npm run validate ${workspace}`;
        console.log(`  Added: ${component.name}:generate, ${component.name}:validate`);
        break;
      case 'server':
        servers.push(component.name);
        scripts[`${component.name}:dev`] = `npm run dev ${workspace}`;
        scripts[`${component.name}:build`] = `npm run build ${workspace}`;
        scripts[`${component.name}:start`] = `npm run start ${workspace}`;
        scripts[`${component.name}:test`] = `npm run test ${workspace}`;
        console.log(`  Added: ${component.name}:dev, ${component.name}:build, ${component.name}:start, ${component.name}:test`);
        break;
      case 'webapp':
        webapps.push(component.name);
        scripts[`${component.name}:dev`] = `npm run dev ${workspace}`;
        scripts[`${component.name}:build`] = `npm run build ${workspace}`;
        scripts[`${component.name}:preview`] = `npm run preview ${workspace}`;
        scripts[`${component.name}:test`] = `npm run test ${workspace}`;
        console.log(`  Added: ${component.name}:dev, ${component.name}:build, ${component.name}:preview, ${component.name}:test`);
        break;
      case 'database':
        databases.push(component.name);
        scripts[`${component.name}:setup`] = `npm run setup ${workspace}`;
        scripts[`${component.name}:teardown`] = `npm run teardown ${workspace}`;
        scripts[`${component.name}:migrate`] = `npm run migrate ${workspace}`;
        scripts[`${component.name}:seed`] = `npm run seed ${workspace}`;
        scripts[`${component.name}:reset`] = `npm run reset ${workspace}`;
        scripts[`${component.name}:port-forward`] = `npm run port-forward ${workspace}`;
        scripts[`${component.name}:psql`] = `npm run psql ${workspace}`;
        console.log(`  Added: ${component.name}:setup, ${component.name}:teardown, ${component.name}:migrate, ${component.name}:seed, ${component.name}:reset, ${component.name}:port-forward, ${component.name}:psql`);
        break;
      case 'helm': {
        const dirName = componentDirName(component);
        scripts[`${component.name}:lint`] = `helm lint components/${dirName}`;
        console.log(`  Added: ${component.name}:lint`);
        break;
      }
    }
  }

  // Meta-scripts: orchestration with dependency ordering
  if (contracts.length > 0 || servers.length > 0 || webapps.length > 0) {
    console.log('  Adding meta-scripts...');

    // Generate all contract types
    if (contracts.length > 0) {
      const generateAll = contracts.map((c) => `${c}:generate`).join(' ');
      scripts['generate'] = `npm-run-all ${generateAll}`;
    }

    // Dev: generate types first, then start servers/webapps in parallel
    const devTargets = [...servers, ...webapps].map((c) => `${c}:dev`);
    if (devTargets.length > 0) {
      if (contracts.length > 0) {
        scripts['dev'] = `npm-run-all generate --parallel ${devTargets.join(' ')}`;
      } else {
        scripts['dev'] = `npm-run-all --parallel ${devTargets.join(' ')}`;
      }
    }

    // Build: generate types first, then build all in parallel
    const buildTargets = [...servers, ...webapps].map((c) => `${c}:build`);
    if (buildTargets.length > 0) {
      if (contracts.length > 0) {
        scripts['build'] = `npm-run-all generate --parallel ${buildTargets.join(' ')}`;
      } else {
        scripts['build'] = `npm-run-all --parallel ${buildTargets.join(' ')}`;
      }
    }

    // Test: generate types first, then test all in parallel
    const testTargets = [...servers, ...webapps].map((c) => `${c}:test`);
    if (testTargets.length > 0) {
      if (contracts.length > 0) {
        scripts['test'] = `npm-run-all generate --parallel ${testTargets.join(' ')}`;
      } else {
        scripts['test'] = `npm-run-all --parallel ${testTargets.join(' ')}`;
      }
    }

    // Start: run production builds in parallel
    const startTargets = [
      ...servers.map((c) => `${c}:start`),
      ...webapps.map((c) => `${c}:preview`),
    ];
    if (startTargets.length > 0) {
      scripts['start'] = `npm-run-all --parallel ${startTargets.join(' ')}`;
    }

    console.log('  Added: generate, dev, build, test, start');
  }

  pkg.scripts = scripts;
  await fsp.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log(`\n${'='.repeat(60)}`);
  console.log('Scaffolding complete!');
  console.log(`${'='.repeat(60)}`);
  console.log(`Created ${createdDirs.length} directories`);
  console.log(`Created ${createdFiles.length} files`);
  console.log(`Location: ${target}`);

  return {
    success: true,
    target_dir: target,
    created_dirs: createdDirs.length,
    created_files: createdFiles.length,
    files: createdFiles,
  };
};

/**
 * Parse command line arguments.
 */
const parseArgs = (
  args: readonly string[]
): { configPath: string | null; jsonOutput: boolean } => {
  let configPath: string | null = null;
  let jsonOutput = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--config') {
      configPath = args[i + 1] ?? null;
      i++;
    } else if (arg === '--json-output') {
      jsonOutput = true;
    }
  }

  return { configPath, jsonOutput };
};

const main = async (): Promise<number> => {
  const args = parseArgs(process.argv.slice(2));

  if (!args.configPath) {
    console.error('Error: --config argument is required');
    return 1;
  }

  // Load config
  if (!fs.existsSync(args.configPath)) {
    console.error(`Error: Config file not found: ${args.configPath}`);
    return 1;
  }

  const configContent = await fsp.readFile(args.configPath, 'utf-8');
  const rawConfig = JSON.parse(configContent) as Record<string, unknown>;

  // Support both old template_dir and new skills_dir
  if (!rawConfig['skills_dir'] && rawConfig['template_dir']) {
    const templateDir = rawConfig['template_dir'] as string;
    rawConfig['skills_dir'] = path.join(path.dirname(templateDir), 'skills');
  }

  // Validate required fields
  const required = ['project_name', 'target_dir', 'components', 'skills_dir'];
  for (const field of required) {
    if (!(field in rawConfig)) {
      console.error(`Error: Missing required config field: ${field}`);
      return 1;
    }
  }

  // Set defaults
  const config: Config = {
    project_name: rawConfig['project_name'] as string,
    project_description:
      (rawConfig['project_description'] as string) ??
      `A ${rawConfig['project_name']} project`,
    primary_domain: (rawConfig['primary_domain'] as string) ?? 'General',
    target_dir: rawConfig['target_dir'] as string,
    components: rawConfig['components'] as ComponentEntry[],
    skills_dir: rawConfig['skills_dir'] as string,
  };

  // Run scaffolding
  try {
    const result = await scaffoldProject(config);

    if (args.jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    }

    return result.success ? 0 : 1;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${errorMessage}`);
    if (args.jsonOutput) {
      console.log(JSON.stringify({ success: false, error: errorMessage }));
    }
    return 1;
  }
};

main()
  .then(process.exit)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
