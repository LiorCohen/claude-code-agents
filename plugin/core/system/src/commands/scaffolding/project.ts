/**
 * Project scaffolding command.
 *
 * Creates generic project structure from templates with variable substitution.
 * Builds a scaffold spec for core methodology files and delegates to the engine.
 * Component-type-specific scaffolding is handled by the tech pack's system.
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
 * Build the architecture overview content.
 * Lists components generically — type descriptions come from the tech pack.
 */
const buildArchitectureContent = (
  config: ScaffoldingConfig
): string => {
  const componentLines = config.components.map((component) => {
    const displayName = component.name.charAt(0).toUpperCase() + component.name.slice(1);
    return `- **${displayName}** (type: \`${component.type}\`)`;
  });

  return `# Architecture Overview

This document describes the architecture of ${config.project_name}.

## Components

${componentLines.join('\n')}
`;
};

/**
 * Build a scaffold spec from the existing project config.
 *
 * Core handles generic project structure only:
 * - Root files (.gitignore, .claudeignore)
 * - Project templates (from tech pack's templates/project/)
 * - Spec methodology files (SNAPSHOT.md, glossary.md, INDEX.md)
 * - Directory skeleton (specs/, changes/, sdd/archive/)
 * - Architecture overview (generic component listing)
 *
 * Component-specific operations (directories, templates, scripts)
 * are handled by the tech pack via separate scaffolding commands.
 */
const buildProjectSpec = (config: ScaffoldingConfig): ScaffoldSpec => {
  // -- Root files --
  const rootFileOps: ReadonlyArray<ScaffoldOperation> = [
    {
      type: 'write_file',
      path: '.gitignore',
      content: 'node_modules/\n.env\n.DS_Store\ndist/\n*.log\nsdd/.techpacks/\n',
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
      source: path.join(techPackTemplatesDir, 'project/README.md.tmpl'),
      dest: 'README.md',
    },
    {
      type: 'template_file',
      source: path.join(techPackTemplatesDir, 'project/CLAUDE.md.tmpl'),
      dest: 'CLAUDE.md',
    },
    {
      type: 'template_file',
      source: path.join(techPackTemplatesDir, 'project/package.json.tmpl'),
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

  // -- Architecture overview (generic component listing) --
  const architectureOps: ReadonlyArray<ScaffoldOperation> = [
    {
      type: 'write_file',
      path: 'specs/architecture/overview.md',
      content: buildArchitectureContent(config),
    },
  ];

  const operations: ReadonlyArray<ScaffoldOperation> = [
    ...rootFileOps,
    ...projectTemplateOps,
    ...specFileOps,
    ...gitkeepOps,
    ...architectureOps,
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
