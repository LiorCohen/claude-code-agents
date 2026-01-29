#!/usr/bin/env npx ts-node --esm
/**
 * SDD Domain Population Script
 *
 * Populates domain specs (glossary, definitions, use-cases) from discovery results.
 * Called by Claude after project scaffolding is complete.
 *
 * Usage:
 *   npx ts-node --esm domain-population.ts --config config.json
 *
 * Config JSON format:
 * {
 *   "target_dir": "/path/to/project",
 *   "primary_domain": "Task Management",
 *   "product_description": "Task management for engineering teams",
 *   "user_personas": [{"type": "PM", "actions": "create tasks"}],
 *   "core_workflows": ["Create tasks", "Assign tasks"],
 *   "domain_entities": ["Task", "User", "Project"]
 * }
 */

import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';

interface UserPersona {
  readonly type: string;
  readonly actions: string;
}

interface Config {
  readonly target_dir: string;
  readonly primary_domain: string;
  readonly product_description: string;
  readonly user_personas: readonly UserPersona[];
  readonly core_workflows: readonly string[];
  readonly domain_entities: readonly string[];
}

interface PopulationResult {
  readonly success: boolean;
  readonly files_updated: readonly string[];
  readonly entity_definitions_created: number;
  readonly use_cases_created: number;
  readonly glossary_entries_added: number;
  readonly error?: string;
}

/**
 * Convert a string to a slug (lowercase, hyphens).
 */
const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Create an entity definition stub file.
 */
const createEntityDefinition = async (
  entity: string,
  domain: string,
  targetDir: string
): Promise<string> => {
  const slug = slugify(entity);
  const filePath = path.join(targetDir, 'specs/domain/definitions', `${slug}.md`);

  const content = `---
name: ${entity}
domain: ${domain}
status: draft
---

# ${entity}

## Description

A ${entity.toLowerCase()} in the ${domain.toLowerCase()} domain.

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| id | string | Unique identifier |
| (to be defined) | | |

## Relationships

- (to be defined based on domain model)

## States (if applicable)

(to be defined)
`;

  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, content);

  return `specs/domain/definitions/${slug}.md`;
};

/**
 * Create a use-case stub file.
 */
const createUseCaseStub = async (
  workflow: string,
  domain: string,
  personas: readonly UserPersona[],
  targetDir: string
): Promise<string> => {
  const slug = slugify(workflow);
  const filePath = path.join(targetDir, 'specs/domain/use-cases', `${slug}.md`);

  // Find relevant actors based on workflow keywords
  const actors = personas.length > 0 ? personas.map((p) => p.type).join(', ') : 'User';

  const content = `---
name: ${workflow}
domain: ${domain}
actors: ${actors}
status: draft
---

# ${workflow}

## Summary

Allows users to ${workflow.toLowerCase()}.

## Actors

${personas.length > 0 ? personas.map((p) => `- ${p.type}`).join('\n') : '- User'}

## Preconditions

- (to be defined)

## Main Flow

1. Actor initiates the action
2. (to be defined)
3. System confirms completion

## Postconditions

- (to be defined)

## Alternative Flows

(to be defined)

## Error Handling

(to be defined)
`;

  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, content);

  return `specs/domain/use-cases/${slug}.md`;
};

/**
 * Update the glossary with new entities.
 */
const updateGlossary = async (
  entities: readonly string[],
  domain: string,
  targetDir: string
): Promise<number> => {
  const glossaryPath = path.join(targetDir, 'specs/domain/glossary.md');

  // Read existing glossary or create new one
  const defaultContent = `# Domain Glossary

This glossary defines key terms and concepts in the ${domain} domain.

## Entities

| Term | Definition | Related Terms |
|------|------------|---------------|
`;

  const content = await fsp.readFile(glossaryPath, 'utf-8').catch(() => defaultContent);

  // Check which entities already exist using reduce to collect existing terms
  const lines = content.split('\n');
  const existingEntities: ReadonlySet<string> = lines
    .filter((line) => line.startsWith('|') && !line.includes('Term') && !line.includes('---'))
    .reduce((acc, line) => {
      const term = line.split('|')[1]?.trim().toLowerCase();
      return term ? new Set([...acc, term]) : acc;
    }, new Set<string>());

  // Filter to only new entities and create entries
  const newEntries: readonly string[] = entities
    .filter((entity) => !existingEntities.has(entity.toLowerCase()))
    .map(
      (entity) =>
        `| ${entity} | A ${entity.toLowerCase()} in the ${domain.toLowerCase()} domain. | (to be defined) |`
    );

  if (newEntries.length > 0) {
    // Find the table and append entries
    const tableEndIndex = content.lastIndexOf('|');
    const updatedContent =
      tableEndIndex !== -1
        ? (() => {
            const lastNewline = content.indexOf('\n', tableEndIndex);
            return lastNewline !== -1
              ? content.slice(0, lastNewline + 1) +
                  newEntries.join('\n') +
                  '\n' +
                  content.slice(lastNewline + 1)
              : content + '\n' + newEntries.join('\n') + '\n';
          })()
        : content + '\n' + newEntries.join('\n') + '\n';

    await fsp.writeFile(glossaryPath, updatedContent);
  }

  return newEntries.length;
};

/**
 * Update SNAPSHOT.md with product overview.
 */
const updateSnapshot = async (config: Config, targetDir: string): Promise<void> => {
  const snapshotPath = path.join(targetDir, 'specs/SNAPSHOT.md');

  const defaultContent = `# Project Snapshot

Current state of the project specifications.

`;

  const content = await fsp.readFile(snapshotPath, 'utf-8').catch(() => defaultContent);

  // Check if Product Overview already exists
  if (content.includes('## Product Overview')) {
    return;
  }

  // Build the overview section using array join
  const sections: readonly string[] = [
    '## Product Overview',
    '',
    `**Problem:** ${config.product_description}`,
    '',
    ...(config.user_personas.length > 0
      ? [
          '**Target Users:**',
          ...config.user_personas.map((persona) => `- ${persona.type}: ${persona.actions}`),
          '',
        ]
      : []),
    ...(config.core_workflows.length > 0
      ? ['**Core Capabilities:**', ...config.core_workflows.map((w) => `- ${w}`), '']
      : []),
    ...(config.domain_entities.length > 0
      ? [`**Key Entities:** ${config.domain_entities.join(', ')}`, '']
      : []),
  ];

  const updatedContent = content + sections.join('\n');
  await fsp.writeFile(snapshotPath, updatedContent);
};

/**
 * Populate all domain specs.
 */
const populateDomain = async (config: Config): Promise<PopulationResult> => {
  const targetDir = config.target_dir;

  console.log(`\nPopulating domain specs for: ${config.primary_domain}`);
  console.log(`Target: ${targetDir}`);
  console.log();

  // Create entity definitions
  console.log('Creating entity definitions...');
  const entityFiles = await Promise.all(
    config.domain_entities.map(async (entity) => {
      const filePath = await createEntityDefinition(entity, config.primary_domain, targetDir);
      console.log(`  Created: ${filePath}`);
      return filePath;
    })
  );

  // Create use-case stubs
  console.log('\nCreating use-case stubs...');
  const useCaseFiles = await Promise.all(
    config.core_workflows.map(async (workflow) => {
      const filePath = await createUseCaseStub(
        workflow,
        config.primary_domain,
        config.user_personas,
        targetDir
      );
      console.log(`  Created: ${filePath}`);
      return filePath;
    })
  );

  // Update glossary
  console.log('\nUpdating glossary...');
  const glossaryEntries = await updateGlossary(
    config.domain_entities,
    config.primary_domain,
    targetDir
  );
  const glossaryFile =
    glossaryEntries > 0
      ? (() => {
          console.log(`  Updated: specs/domain/glossary.md (${glossaryEntries} entries added)`);
          return ['specs/domain/glossary.md'];
        })()
      : (() => {
          console.log('  No new entries to add');
          return [];
        })();

  // Update SNAPSHOT
  console.log('\nUpdating SNAPSHOT...');
  await updateSnapshot(config, targetDir);
  console.log('  Updated: specs/SNAPSHOT.md');

  // Combine all updated files
  const filesUpdated: readonly string[] = [
    ...entityFiles,
    ...useCaseFiles,
    ...glossaryFile,
    'specs/SNAPSHOT.md',
  ];

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('Domain population complete!');
  console.log(`${'='.repeat(60)}`);
  console.log(`Created ${entityFiles.length} entity definitions`);
  console.log(`Created ${useCaseFiles.length} use-case stubs`);
  console.log(`Added ${glossaryEntries} glossary entries`);
  console.log('Updated SNAPSHOT with product overview');

  return {
    success: true,
    files_updated: filesUpdated,
    entity_definitions_created: entityFiles.length,
    use_cases_created: useCaseFiles.length,
    glossary_entries_added: glossaryEntries,
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
    console.error('Usage: npx ts-node --esm domain-population.ts --config config.json');
    return 1;
  }

  // Load config
  if (!fs.existsSync(args.configPath)) {
    console.error(`Error: Config file not found: ${args.configPath}`);
    return 1;
  }

  const configContent = await fsp.readFile(args.configPath, 'utf-8');
  const rawConfig = JSON.parse(configContent) as Record<string, unknown>;

  // Validate required fields
  const required = ['target_dir', 'primary_domain', 'product_description'];
  const missingFields = required.filter((field) => !(field in rawConfig));
  if (missingFields.length > 0) {
    console.error(`Error: Missing required config fields: ${missingFields.join(', ')}`);
    return 1;
  }

  // Set defaults
  const config: Config = {
    target_dir: rawConfig['target_dir'] as string,
    primary_domain: rawConfig['primary_domain'] as string,
    product_description: rawConfig['product_description'] as string,
    user_personas: (rawConfig['user_personas'] as readonly UserPersona[]) ?? [],
    core_workflows: (rawConfig['core_workflows'] as readonly string[]) ?? [],
    domain_entities: (rawConfig['domain_entities'] as readonly string[]) ?? [],
  };

  // Run population
  try {
    const result = await populateDomain(config);

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
