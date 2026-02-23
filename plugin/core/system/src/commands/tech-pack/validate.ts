/**
 * Tech pack validate command.
 *
 * Parses techpack.yaml, validates against the JSON Schema,
 * checks that referenced paths exist, and validates the dependency DAG.
 *
 * Usage:
 *   sdd-system tech-pack validate --path <tech-pack-dir>
 */

import * as path from 'node:path';
import { readText, exists } from '@/lib/fs';
import { validateAgainstSchema, type JsonSchema } from '@/lib/json-schema';
import { getSkillsDir } from '@/lib/config';
import type { CommandResult } from '@/lib/args';
import YAML from 'yaml';

/** Read and parse techpack.yaml from a directory. */
const readManifest = async (
  techPackDir: string
): Promise<{ readonly data: Record<string, unknown> } | { readonly error: string }> => {
  const manifestPath = path.join(techPackDir, 'techpack.yaml');
  if (!(await exists(manifestPath))) {
    return { error: `techpack.yaml not found at ${manifestPath}` };
  }
  const content = await readText(manifestPath);
  const data = YAML.parse(content) as Record<string, unknown>;
  return { data };
};

/** Read the techpack JSON schema from the core skills directory. */
const readTechpackSchema = async (): Promise<JsonSchema> => {
  const schemaPath = path.join(
    getSkillsDir(),
    'techpacks',
    'schemas',
    'techpack.schema.json'
  );
  const content = await readText(schemaPath);
  return JSON.parse(content) as JsonSchema;
};

/** Validate that all referenced paths in the manifest exist. */
const validatePaths = async (
  techPackDir: string,
  manifest: Record<string, unknown>
): Promise<readonly string[]> => {
  const errors: string[] = [];
  const paths: Array<{ readonly field: string; readonly relativePath: string }> = [];

  // system_path
  const techPack = manifest['techpack'] as Record<string, unknown> | undefined;
  if (techPack?.['system_path']) {
    paths.push({ field: 'techpack.system_path', relativePath: techPack['system_path'] as string });
  }

  // Component paths
  const components = manifest['components'] as Record<string, Record<string, unknown>> | undefined;
  if (components) {
    for (const [typeName, component] of Object.entries(components)) {
      if (component['scaffolding']) {
        paths.push({
          field: `components.${typeName}.scaffolding`,
          relativePath: component['scaffolding'] as string,
        });
      }
      const agent = component['agent'] as Record<string, unknown> | undefined;
      if (agent?.['path']) {
        paths.push({
          field: `components.${typeName}.agent.path`,
          relativePath: agent['path'] as string,
        });
      }
    }
  }

  // Commands router
  const commands = manifest['commands'] as Record<string, unknown> | undefined;
  if (commands?.['router']) {
    paths.push({ field: 'commands.router', relativePath: commands['router'] as string });
  }

  // Skills router
  const skills = manifest['skills'] as Record<string, unknown> | undefined;
  if (skills?.['router']) {
    paths.push({ field: 'skills.router', relativePath: skills['router'] as string });
  }

  // Lifecycle agents
  const lifecycle = manifest['lifecycle'] as Record<string, Record<string, unknown>> | undefined;
  if (lifecycle) {
    for (const [phaseName, phase] of Object.entries(lifecycle)) {
      const agent = phase['agent'] as Record<string, unknown> | undefined;
      if (agent?.['path']) {
        paths.push({
          field: `lifecycle.${phaseName}.agent.path`,
          relativePath: agent['path'] as string,
        });
      }
    }
  }

  // Documentation skills
  const documentation = manifest['documentation'] as Record<string, unknown> | undefined;
  if (documentation) {
    for (const [key, value] of Object.entries(documentation)) {
      if (typeof value === 'string') {
        paths.push({ field: `documentation.${key}`, relativePath: value });
      }
    }
  }

  // Check each path
  for (const { field, relativePath } of paths) {
    // Normalize ./relative paths
    const cleanPath = relativePath.startsWith('./') ? relativePath.slice(2) : relativePath;
    const fullPath = path.join(techPackDir, cleanPath);
    if (!(await exists(fullPath))) {
      errors.push(`${field}: path does not exist — ${cleanPath}`);
    }
  }

  return errors;
};

/** Validate the dependency DAG is acyclic. */
const validateDAG = (
  components: Record<string, Record<string, unknown>>
): readonly string[] => {
  const errors: string[] = [];
  const componentTypes = new Set(Object.keys(components));

  // Check all depends_on references are valid component types
  for (const [typeName, component] of Object.entries(components)) {
    const dependsOn = (component['depends_on'] as readonly string[]) ?? [];
    for (const dep of dependsOn) {
      if (!componentTypes.has(dep)) {
        errors.push(
          `components.${typeName}.depends_on: references unknown component type "${dep}"`
        );
      }
    }
  }

  // Check for cycles using topological sort (Kahn's algorithm)
  const inDegree: Record<string, number> = {};
  const adjacency: Record<string, readonly string[]> = {};

  for (const typeName of componentTypes) {
    inDegree[typeName] = 0;
    adjacency[typeName] = [];
  }

  for (const [typeName, component] of Object.entries(components)) {
    const dependsOn = (component['depends_on'] as readonly string[]) ?? [];
    for (const dep of dependsOn) {
      if (componentTypes.has(dep)) {
        adjacency[dep] = [...(adjacency[dep] ?? []), typeName];
        inDegree[typeName] = (inDegree[typeName] ?? 0) + 1;
      }
    }
  }

  const queue = Object.keys(inDegree).filter((k) => inDegree[k] === 0);
  let visited = 0;

  while (queue.length > 0) {
    const node = queue.shift()!;
    visited++;
    for (const neighbor of adjacency[node] ?? []) {
      inDegree[neighbor] = (inDegree[neighbor] ?? 1) - 1;
      if ((inDegree[neighbor] ?? 0) === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (visited !== componentTypes.size) {
    errors.push('Dependency graph contains a cycle');
  }

  return errors;
};

export const validateTechPack = async (techPackPath: string): Promise<CommandResult> => {
  const techPackDir = path.resolve(techPackPath);

  // Step 1: Read manifest
  const manifestResult = await readManifest(techPackDir);
  if ('error' in manifestResult) {
    return { success: false, error: manifestResult.error };
  }
  const manifest = manifestResult.data;

  // Step 2: Validate against JSON Schema
  const techpackSchema = await readTechpackSchema();
  const schemaResult = validateAgainstSchema(manifest, techpackSchema);

  const schemaErrors: readonly string[] = !schemaResult.valid
    ? schemaResult.errors.map(
        (e) => `${e.instancePath || '/'}: ${e.message ?? 'unknown error'}`
      )
    : [];

  // Step 3: Validate referenced paths exist
  const pathErrors = await validatePaths(techPackDir, manifest);

  // Step 4: Validate dependency DAG
  const components = manifest['components'] as Record<string, Record<string, unknown>> | undefined;
  const dagErrors = components ? validateDAG(components) : [];

  // Combine results
  const allErrors = [...schemaErrors, ...pathErrors, ...dagErrors];
  const techPack = manifest['techpack'] as Record<string, unknown> | undefined;
  const name = (techPack?.['name'] as string) ?? 'unknown';
  const namespace = (techPack?.['namespace'] as string) ?? 'unknown';

  if (allErrors.length > 0) {
    return {
      success: false,
      error: `Validation failed for tech pack "${name}" (${namespace}):\n${allErrors.map((e) => `  - ${e}`).join('\n')}`,
      data: { name, namespace, errors: allErrors },
    };
  }

  const componentCount = components ? Object.keys(components).length : 0;
  const commands = manifest['commands'] as Record<string, unknown> | undefined;
  const commandCount = Array.isArray(commands?.['available'])
    ? (commands['available'] as readonly unknown[]).length
    : 0;

  return {
    success: true,
    message: `Tech pack "${name}" (${namespace}) is valid — ${componentCount} component types, ${commandCount} commands`,
    data: {
      name,
      namespace,
      version: techPack?.['version'],
      component_types: componentCount,
      commands: commandCount,
    },
  };
};
