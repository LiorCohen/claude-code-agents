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

interface CreatedItems {
  readonly files: readonly string[];
  readonly dirs: readonly string[];
}

const mergeItems = (...items: readonly CreatedItems[]): CreatedItems => ({
  files: items.flatMap((i) => i.files),
  dirs: items.flatMap((i) => i.dirs),
});

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
): readonly ComponentEntry[] => components.filter((c) => c.type === componentType);

/**
 * Replace template variables with config values.
 */
const substituteVariables = (content: string, config: Config, component?: ComponentEntry): string => {
  const replacements: Readonly<Record<string, string>> = {
    '{{PROJECT_NAME}}': config.project_name,
    '{{PROJECT_DESCRIPTION}}': config.project_description,
    '{{PRIMARY_DOMAIN}}': config.primary_domain,
    ...(component?.depends_on
      ? { '{{CONTRACT_PACKAGE}}': `@${config.project_name}/${component.depends_on[0] ?? ''}` }
      : {}),
  };

  return Object.entries(replacements).reduce(
    (result, [variable, value]) => result.replaceAll(variable, value),
    content
  );
};

const SUBSTITUTABLE_EXTENSIONS = ['.md', '.json', '.yaml', '.yml', '.ts', '.tsx', '.html', '.css', '.js'] as const;

/**
 * Copy a template file, optionally substituting variables. Returns the relative path.
 */
const copyTemplateFile = async (
  src: string,
  dest: string,
  config: Config,
  component?: ComponentEntry,
  substitute = true
): Promise<string> => {
  await fsp.mkdir(path.dirname(dest), { recursive: true });

  const ext = path.extname(src);
  if (substitute && (SUBSTITUTABLE_EXTENSIONS as readonly string[]).includes(ext)) {
    const content = await fsp.readFile(src, 'utf-8');
    const substituted = substituteVariables(content, config, component);
    await fsp.writeFile(dest, substituted);
  } else {
    await fsp.copyFile(src, dest);
  }

  const relativePath = path.relative(config.target_dir, dest);
  console.log(`  Created: ${relativePath}`);
  return relativePath;
};

/**
 * Create a directory if it doesn't exist. Returns the relative path.
 */
const createDirectory = async (dirPath: string, config: Config): Promise<string> => {
  await fsp.mkdir(dirPath, { recursive: true });
  const relativePath = path.relative(config.target_dir, dirPath);
  console.log(`  Created: ${relativePath}/`);
  return relativePath;
};

/**
 * Create multiple directories. Returns created items.
 */
const createDirectories = async (
  dirs: readonly string[],
  target: string,
  config: Config
): Promise<CreatedItems> => {
  const created = await Promise.all(
    dirs.map(async (d) => createDirectory(path.join(target, d), config))
  );
  return { files: [], dirs: created };
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
  const entries = await fsp.readdir(dir, { withFileTypes: true });

  const results = await Promise.all(
    entries.map(async (entry): Promise<readonly string[]> => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return walkDir(fullPath);
      } else if (entry.isFile()) {
        return [fullPath];
      }
      return [];
    })
  );

  return results.flat();
};

/**
 * Copy template files from a directory if it exists.
 */
const copyTemplateDir = async (
  templatesDir: string,
  destDir: string,
  config: Config,
  component?: ComponentEntry
): Promise<readonly string[]> => {
  if (!directoryExists(templatesDir)) return [];

  const srcFiles = await walkDir(templatesDir);
  const results = await Promise.all(
    srcFiles.map(async (srcFile) => {
      const relPath = path.relative(templatesDir, srcFile);
      const destFile = path.join(destDir, relPath);
      await copyTemplateFile(srcFile, destFile, config, component);
      return path.relative(config.target_dir, destFile);
    })
  );

  return results;
};

/**
 * Generate component scripts and categorize components.
 */
interface ComponentScripts {
  readonly scripts: Readonly<Record<string, string>>;
  readonly contracts: readonly string[];
  readonly servers: readonly string[];
  readonly webapps: readonly string[];
  readonly databases: readonly string[];
}

const generateComponentScripts = (
  components: readonly ComponentEntry[],
  config: Config
): ComponentScripts => {
  const initial: ComponentScripts = {
    scripts: {},
    contracts: [],
    servers: [],
    webapps: [],
    databases: [],
  };

  return components.reduce((acc, component) => {
    const workspace = `-w @${config.project_name}/${component.name}`;

    switch (component.type) {
      case 'contract':
        console.log(`  Added: ${component.name}:generate, ${component.name}:validate`);
        return {
          ...acc,
          contracts: [...acc.contracts, component.name],
          scripts: {
            ...acc.scripts,
            [`${component.name}:generate`]: `npm run generate:types ${workspace}`,
            [`${component.name}:validate`]: `npm run validate ${workspace}`,
          },
        };

      case 'server':
        console.log(`  Added: ${component.name}:dev, ${component.name}:build, ${component.name}:start, ${component.name}:test`);
        return {
          ...acc,
          servers: [...acc.servers, component.name],
          scripts: {
            ...acc.scripts,
            [`${component.name}:dev`]: `npm run dev ${workspace}`,
            [`${component.name}:build`]: `npm run build ${workspace}`,
            [`${component.name}:start`]: `npm run start ${workspace}`,
            [`${component.name}:test`]: `npm run test ${workspace}`,
          },
        };

      case 'webapp':
        console.log(`  Added: ${component.name}:dev, ${component.name}:build, ${component.name}:preview, ${component.name}:test`);
        return {
          ...acc,
          webapps: [...acc.webapps, component.name],
          scripts: {
            ...acc.scripts,
            [`${component.name}:dev`]: `npm run dev ${workspace}`,
            [`${component.name}:build`]: `npm run build ${workspace}`,
            [`${component.name}:preview`]: `npm run preview ${workspace}`,
            [`${component.name}:test`]: `npm run test ${workspace}`,
          },
        };

      case 'database':
        console.log(`  Added: ${component.name}:setup, ${component.name}:teardown, ${component.name}:migrate, ${component.name}:seed, ${component.name}:reset, ${component.name}:port-forward, ${component.name}:psql`);
        return {
          ...acc,
          databases: [...acc.databases, component.name],
          scripts: {
            ...acc.scripts,
            [`${component.name}:setup`]: `npm run setup ${workspace}`,
            [`${component.name}:teardown`]: `npm run teardown ${workspace}`,
            [`${component.name}:migrate`]: `npm run migrate ${workspace}`,
            [`${component.name}:seed`]: `npm run seed ${workspace}`,
            [`${component.name}:reset`]: `npm run reset ${workspace}`,
            [`${component.name}:port-forward`]: `npm run port-forward ${workspace}`,
            [`${component.name}:psql`]: `npm run psql ${workspace}`,
          },
        };

      case 'helm': {
        const dirName = componentDirName(component);
        console.log(`  Added: ${component.name}:lint`);
        return {
          ...acc,
          scripts: {
            ...acc.scripts,
            [`${component.name}:lint`]: `helm lint components/${dirName}`,
          },
        };
      }

      default:
        return acc;
    }
  }, initial);
};

/**
 * Generate meta-scripts for orchestration.
 */
const generateMetaScripts = (componentScripts: ComponentScripts): Readonly<Record<string, string>> => {
  const { contracts, servers, webapps } = componentScripts;

  if (contracts.length === 0 && servers.length === 0 && webapps.length === 0) {
    return {};
  }

  console.log('  Adding meta-scripts...');

  // Build scripts array with entries, then convert to object
  const scriptEntries: readonly (readonly [string, string])[] = [
    // Generate script for contracts
    ...(contracts.length > 0
      ? [[
          'generate',
          `npm-run-all ${contracts.map((c) => `${c}:generate`).join(' ')}`,
        ] as const]
      : []),

    // Dev script
    ...([...servers, ...webapps].length > 0
      ? [[
          'dev',
          contracts.length > 0
            ? `npm-run-all generate --parallel ${[...servers, ...webapps].map((c) => `${c}:dev`).join(' ')}`
            : `npm-run-all --parallel ${[...servers, ...webapps].map((c) => `${c}:dev`).join(' ')}`,
        ] as const]
      : []),

    // Build script
    ...([...servers, ...webapps].length > 0
      ? [[
          'build',
          contracts.length > 0
            ? `npm-run-all generate --parallel ${[...servers, ...webapps].map((c) => `${c}:build`).join(' ')}`
            : `npm-run-all --parallel ${[...servers, ...webapps].map((c) => `${c}:build`).join(' ')}`,
        ] as const]
      : []),

    // Test script
    ...([...servers, ...webapps].length > 0
      ? [[
          'test',
          contracts.length > 0
            ? `npm-run-all generate --parallel ${[...servers, ...webapps].map((c) => `${c}:test`).join(' ')}`
            : `npm-run-all --parallel ${[...servers, ...webapps].map((c) => `${c}:test`).join(' ')}`,
        ] as const]
      : []),

    // Start script
    ...(servers.length > 0 || webapps.length > 0
      ? [[
          'start',
          `npm-run-all --parallel ${[
            ...servers.map((c) => `${c}:start`),
            ...webapps.map((c) => `${c}:preview`),
          ].join(' ')}`,
        ] as const]
      : []),
  ];

  console.log('  Added: generate, dev, build, test, start');

  return Object.fromEntries(scriptEntries);
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
  console.log('  Created: .gitignore');
  const rootFilesCreated: CreatedItems = { files: ['.gitignore'], dirs: [] };

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
  ];
  const specsDirsCreated = await createDirectories(specsDirs, target, config);

  // Separate directories at project root
  const rootDirs = ['changes', 'archive'];
  const rootDirsCreated = await createDirectories(rootDirs, target, config);

  // Create .gitkeep files for empty directories
  const emptyDirs = [
    'specs/domain/definitions',
    'specs/domain/use-cases',
    'specs/architecture',
    'changes',
    'archive',
  ];
  const gitkeepFiles = await Promise.all(
    emptyDirs.map(async (dir) => {
      const gitkeepPath = path.join(target, dir, '.gitkeep');
      await fsp.writeFile(gitkeepPath, '# This file ensures the directory is tracked by git\n');
      console.log(`  Created: ${dir}/.gitkeep`);
      return `${dir}/.gitkeep`;
    })
  );
  const gitkeepCreated: CreatedItems = { files: gitkeepFiles, dirs: [] };

  // Create .claudeignore
  const claudeignore = path.join(target, '.claudeignore');
  await fsp.writeFile(claudeignore, 'archive/\n');
  console.log('  Created: .claudeignore');
  const claudeignoreCreated: CreatedItems = { files: ['.claudeignore'], dirs: [] };

  // Config directories
  const configDirs = ['config', 'config/schemas'];
  const configDirsCreated = await createDirectories(configDirs, target, config);

  // Contract component directories
  const contractDirs = contractComponents.map((c) => `components/${componentDirName(c)}`);
  const contractDirsCreated = await createDirectories(contractDirs, target, config);

  // Server component directories
  const serverDirs = serverComponents.flatMap((server) => {
    const dirName = componentDirName(server);
    return [
      `components/${dirName}/src/operator`,
      `components/${dirName}/src/config`,
      `components/${dirName}/src/controller/http_handlers`,
      `components/${dirName}/src/model/definitions`,
      `components/${dirName}/src/model/use-cases`,
      `components/${dirName}/src/dal`,
    ];
  });
  const serverDirsCreated = await createDirectories(serverDirs, target, config);

  // Webapp component directories
  const webappDirs = webappComponents.flatMap((webapp) => {
    const dirName = componentDirName(webapp);
    return [
      `components/${dirName}/src/pages`,
      `components/${dirName}/src/components`,
      `components/${dirName}/src/viewmodels`,
      `components/${dirName}/src/models`,
      `components/${dirName}/src/services`,
      `components/${dirName}/src/stores`,
      `components/${dirName}/src/types`,
      `components/${dirName}/src/utils`,
    ];
  });
  const webappDirsCreated = await createDirectories(webappDirs, target, config);

  // Helm component directories
  const helmDirs = helmComponents.map((c) => `components/${componentDirName(c)}`);
  const helmDirsCreated = await createDirectories(helmDirs, target, config);

  // Testing component directories
  const testingDirs = testingComponents.flatMap((testing) => {
    const dirName = componentDirName(testing);
    return [
      `components/${dirName}/tests/integration`,
      `components/${dirName}/tests/component`,
      `components/${dirName}/tests/e2e`,
      `components/${dirName}/testsuites`,
    ];
  });
  const testingDirsCreated = await createDirectories(testingDirs, target, config);

  // CI/CD component directories
  const cicdDirs = cicdComponents.flatMap((c) => [
    `components/${componentDirName(c)}`,
    '.github/workflows',
  ]);
  const cicdDirsCreated = await createDirectories(cicdDirs, target, config);

  // Database component directories
  const databaseDirs = databaseComponents.flatMap((database) => {
    const dirName = componentDirName(database);
    return [
      `components/${dirName}`,
      `components/${dirName}/migrations`,
      `components/${dirName}/seeds`,
      `components/${dirName}/scripts`,
    ];
  });
  const databaseDirsCreated = await createDirectories(databaseDirs, target, config);

  // -------------------------------------------------------------------------
  // Step 3: Copy and customize template files
  // -------------------------------------------------------------------------
  console.log('\nCopying template files...');

  // Root project files
  const projectFilesDir = path.join(projectTemplates, 'project');
  const projectFilesCreated = directoryExists(projectFilesDir)
    ? await Promise.all(
        ['README.md', 'CLAUDE.md', 'package.json']
          .filter((f) => fs.existsSync(path.join(projectFilesDir, f)))
          .map(async (f) => {
            await copyTemplateFile(
              path.join(projectFilesDir, f),
              path.join(target, f),
              config
            );
            return f;
          })
      )
    : [];

  // Spec files
  const specsFilesDir = path.join(projectTemplates, 'specs');
  const specFilesList: ReadonlyArray<readonly [string, string]> = [
    ['INDEX.md', 'specs/INDEX.md'],
    ['SNAPSHOT.md', 'specs/SNAPSHOT.md'],
    ['glossary.md', 'specs/domain/glossary.md'],
  ];
  const specFilesCreated = directoryExists(specsFilesDir)
    ? await Promise.all(
        specFilesList
          .filter(([srcName]) => fs.existsSync(path.join(specsFilesDir, srcName)))
          .map(async ([srcName, destPath]) => {
            await copyTemplateFile(
              path.join(specsFilesDir, srcName),
              path.join(target, destPath),
              config
            );
            return destPath;
          })
      )
    : [];

  // Architecture overview
  const typeDescriptions: Readonly<Record<string, string>> = {
    contract: 'OpenAPI specifications and type generation',
    server: 'Node.js/TypeScript backend with CMDO architecture',
    webapp: 'React/TypeScript frontend with MVVM pattern',
    database: 'PostgreSQL migrations, seeds, and management scripts',
    helm: 'Kubernetes deployment charts',
    testing: 'Testkube test definitions',
    cicd: 'CI/CD workflow definitions',
  };

  const componentLines = components.map((component) => {
    const dirName = componentDirName(component);
    const displayName = component.name.charAt(0).toUpperCase() + component.name.slice(1);
    const description = typeDescriptions[component.type] ?? component.type;
    return `- **${displayName}** (\`components/${dirName}/\`): ${description}`;
  });

  const archContent = `# Architecture Overview

This document describes the architecture of ${config.project_name}.

## Components

- **Config** (\`config/\`): YAML-based configuration management
${componentLines.join('\n')}
`;

  const archOverview = path.join(target, 'specs/architecture/overview.md');
  await fsp.writeFile(archOverview, archContent);
  console.log('  Created: specs/architecture/overview.md');

  // Config files
  const configFilesDir = path.join(projectTemplates, 'config');
  const configFilesList = [
    'config.yaml',
    'config-local.yaml',
    'config-testing.yaml',
    'config-production.yaml',
    'schemas/schema.json',
    'schemas/ops-schema.json',
    'schemas/app-schema.json',
  ];
  const configFilesCreated = directoryExists(configFilesDir)
    ? await Promise.all(
        configFilesList
          .filter((f) => fs.existsSync(path.join(configFilesDir, f)))
          .map(async (f) => {
            await copyTemplateFile(
              path.join(configFilesDir, f),
              path.join(target, 'config', f),
              config
            );
            return `config/${f}`;
          })
      )
    : [];

  // Contract component files
  const contractFilesCreated = directoryExists(contractTemplates)
    ? (
        await Promise.all(
          contractComponents.map(async (contract) => {
            const dirName = componentDirName(contract);
            const destDir = path.join(target, `components/${dirName}`);

            const templateFiles = await Promise.all(
              ['package.json', 'openapi.yaml']
                .filter((f) => fs.existsSync(path.join(contractTemplates, f)))
                .map(async (f) => {
                  await copyTemplateFile(
                    path.join(contractTemplates, f),
                    path.join(destDir, f),
                    config,
                    contract
                  );
                  return `components/${dirName}/${f}`;
                })
            );

            // Create contract .gitignore
            const contractGitignore = path.join(destDir, '.gitignore');
            await fsp.writeFile(contractGitignore, 'node_modules/\ngenerated/\n');
            console.log(`  Created: components/${dirName}/.gitignore`);

            return [...templateFiles, `components/${dirName}/.gitignore`];
          })
        )
      ).flat()
    : [];

  // Server component files
  const serverFilesCreated = directoryExists(backendTemplates)
    ? (
        await Promise.all(
          serverComponents.map(async (server) => {
            const dirName = componentDirName(server);
            return copyTemplateDir(
              backendTemplates,
              path.join(target, `components/${dirName}`),
              config,
              server
            );
          })
        )
      ).flat()
    : [];

  // Webapp component files
  const webappFilesCreated = directoryExists(frontendTemplates)
    ? (
        await Promise.all(
          webappComponents.map(async (webapp) => {
            const dirName = componentDirName(webapp);
            return copyTemplateDir(
              frontendTemplates,
              path.join(target, `components/${dirName}`),
              config,
              webapp
            );
          })
        )
      ).flat()
    : [];

  // Database component files
  const databaseFilesCreated = directoryExists(databaseTemplates)
    ? (
        await Promise.all(
          databaseComponents.map(async (database) => {
            const dirName = componentDirName(database);
            return copyTemplateDir(
              databaseTemplates,
              path.join(target, `components/${dirName}`),
              config
            );
          })
        )
      ).flat()
    : [];

  // CI/CD workflows
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

  const cicdFilesCreated = (
    await Promise.all(
      cicdComponents.map(async (cicd) => {
        const dirName = componentDirName(cicd);
        const ciWorkflow = path.join(target, `components/${dirName}/ci.yaml`);
        await fsp.writeFile(ciWorkflow, ciContent);
        console.log(`  Created: components/${dirName}/ci.yaml`);

        const deployedWorkflow = path.join(target, '.github/workflows/ci.yaml');
        await fsp.writeFile(deployedWorkflow, ciContent);
        console.log('  Created: .github/workflows/ci.yaml');

        return [`components/${dirName}/ci.yaml`, '.github/workflows/ci.yaml'];
      })
    )
  ).flat();

  // -------------------------------------------------------------------------
  // Step 4: Generate component-specific npm scripts in root package.json
  // -------------------------------------------------------------------------
  console.log('\nGenerating npm scripts...');

  const pkgPath = path.join(target, 'package.json');
  const pkgContent = await fsp.readFile(pkgPath, 'utf-8');
  const pkg = JSON.parse(pkgContent) as { scripts: Record<string, string> };

  const componentScripts = generateComponentScripts(components, config);
  const metaScripts = generateMetaScripts(componentScripts);

  pkg.scripts = { ...componentScripts.scripts, ...metaScripts };
  await fsp.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  // -------------------------------------------------------------------------
  // Collect all created items
  // -------------------------------------------------------------------------
  const allDirsCreated = mergeItems(
    specsDirsCreated,
    rootDirsCreated,
    configDirsCreated,
    contractDirsCreated,
    serverDirsCreated,
    webappDirsCreated,
    helmDirsCreated,
    testingDirsCreated,
    cicdDirsCreated,
    databaseDirsCreated
  );

  const allFilesCreated: readonly string[] = [
    ...rootFilesCreated.files,
    ...gitkeepCreated.files,
    ...claudeignoreCreated.files,
    ...projectFilesCreated,
    ...specFilesCreated,
    'specs/architecture/overview.md',
    ...configFilesCreated,
    ...contractFilesCreated,
    ...serverFilesCreated,
    ...webappFilesCreated,
    ...databaseFilesCreated,
    ...cicdFilesCreated,
  ];

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log(`\n${'='.repeat(60)}`);
  console.log('Scaffolding complete!');
  console.log(`${'='.repeat(60)}`);
  console.log(`Created ${allDirsCreated.dirs.length} directories`);
  console.log(`Created ${allFilesCreated.length} files`);
  console.log(`Location: ${target}`);

  return {
    success: true,
    target_dir: target,
    created_dirs: allDirsCreated.dirs.length,
    created_files: allFilesCreated.length,
    files: allFilesCreated,
  };
};

/**
 * Parse command line arguments.
 */
const parseArgs = (
  args: readonly string[]
): { configPath: string | null; jsonOutput: boolean } => {
  const configIndex = args.indexOf('--config');
  const configPath = configIndex !== -1 ? (args[configIndex + 1] ?? null) : null;
  const jsonOutput = args.includes('--json-output');

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
  const skillsDir =
    (rawConfig['skills_dir'] as string | undefined) ??
    (rawConfig['template_dir']
      ? path.join(path.dirname(rawConfig['template_dir'] as string), 'skills')
      : undefined);

  // Validate required fields
  const required = ['project_name', 'target_dir', 'components'];
  const missingFields = required.filter((field) => !(field in rawConfig));
  if (missingFields.length > 0 || !skillsDir) {
    console.error(`Error: Missing required config fields: ${[...missingFields, ...(skillsDir ? [] : ['skills_dir'])].join(', ')}`);
    return 1;
  }

  // Set defaults
  const config: Config = {
    project_name: rawConfig['project_name'] as string,
    project_description:
      (rawConfig['project_description'] as string) ??
      `A ${rawConfig['project_name']} project`,
    primary_domain: (rawConfig['primary_domain'] as string) ?? 'General',
    target_dir: rawConfig['target_dir'] as string,
    components: rawConfig['components'] as readonly ComponentEntry[],
    skills_dir: skillsDir,
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
