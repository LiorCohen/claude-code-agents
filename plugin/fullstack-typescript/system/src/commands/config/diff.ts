/**
 * Config diff command.
 *
 * Show differences between two environments.
 *
 * Usage:
 *   sdd-system config diff <env1> <env2>
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';

type DiffEntry = {
  readonly path: string;
  readonly type: 'added' | 'removed' | 'changed';
  readonly env1Value?: unknown;
  readonly env2Value?: unknown;
};

type ConfigObject = Readonly<Record<string, unknown>>;

/**
 * Deep merge two objects (for generating merged configs).
 */
const deepMerge = (base: ConfigObject, override: ConfigObject): ConfigObject => {
  return Object.entries(override).reduce<ConfigObject>(
    (acc, [key, value]) => {
      if (value === null) {
        const { [key]: _, ...rest } = acc;
        return rest;
      } else if (
        typeof value === 'object' &&
        !Array.isArray(value) &&
        typeof acc[key] === 'object' &&
        !Array.isArray(acc[key]) &&
        acc[key] !== null
      ) {
        return {
          ...acc,
          [key]: deepMerge(
            acc[key] as ConfigObject,
            value as ConfigObject
          ),
        };
      } else {
        return { ...acc, [key]: value };
      }
    },
    { ...base }
  );
};

/**
 * Recursively compare two objects and collect differences.
 */
const compareObjects = (
  obj1: Readonly<Record<string, unknown>>,
  obj2: Readonly<Record<string, unknown>>,
  path: string = ''
): ReadonlyArray<DiffEntry> => {
  const allKeys: ReadonlySet<string> = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

  return [...allKeys].reduce<ReadonlyArray<DiffEntry>>((diffs, key) => {
    const currentPath = path ? `${path}.${key}` : key;
    const val1 = obj1[key];
    const val2 = obj2[key];

    if (!(key in obj1)) {
      return [...diffs, { path: currentPath, type: 'added' as const, env2Value: val2 }];
    } else if (!(key in obj2)) {
      return [...diffs, { path: currentPath, type: 'removed' as const, env1Value: val1 }];
    } else if (
      typeof val1 === 'object' &&
      typeof val2 === 'object' &&
      !Array.isArray(val1) &&
      !Array.isArray(val2) &&
      val1 !== null &&
      val2 !== null
    ) {
      // Recurse into nested objects
      return [
        ...diffs,
        ...compareObjects(
          val1 as Readonly<Record<string, unknown>>,
          val2 as Readonly<Record<string, unknown>>,
          currentPath
        ),
      ];
    } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      return [...diffs, { path: currentPath, type: 'changed' as const, env1Value: val1, env2Value: val2 }];
    }

    return diffs;
  }, []);
};

const formatValue = (value: unknown): string => {
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

export const diff = async (
  args: readonly string[],
  options: GlobalOptions
): Promise<CommandResult> => {
  const { positional, named } = parseNamedArgs(args);

  if (positional.length < 2) {
    return {
      success: false,
      error: 'Usage: sdd-system config diff <env1> <env2>',
    };
  }

  const env1 = positional[0]!;
  const env2 = positional[1]!;
  const configDir = named['config-dir'] ?? process.cwd();

  const envsDir = join(configDir, 'components', 'config', 'envs');
  const defaultConfigPath = join(envsDir, 'default', 'config.yaml');
  const env1ConfigPath = join(envsDir, env1, 'config.yaml');
  const env2ConfigPath = join(envsDir, env2, 'config.yaml');

  // Check files exist
  if (!existsSync(defaultConfigPath)) {
    return {
      success: false,
      error: `Default config not found: ${defaultConfigPath}`,
    };
  }

  if (!existsSync(env1ConfigPath)) {
    return {
      success: false,
      error: `Environment config not found: ${env1ConfigPath}`,
    };
  }

  if (!existsSync(env2ConfigPath)) {
    return {
      success: false,
      error: `Environment config not found: ${env2ConfigPath}`,
    };
  }

  try {
    // Load and merge configs
    const defaultConfig = parse(readFileSync(defaultConfigPath, 'utf-8')) ?? {};
    const env1Config = parse(readFileSync(env1ConfigPath, 'utf-8')) ?? {};
    const env2Config = parse(readFileSync(env2ConfigPath, 'utf-8')) ?? {};

    const merged1 = deepMerge(defaultConfig, env1Config);
    const merged2 = deepMerge(defaultConfig, env2Config);

    // Compare
    const diffs = compareObjects(merged1, merged2);

    if (options.json) {
      return {
        success: true,
        data: {
          env1,
          env2,
          differences: diffs,
          hasDifferences: diffs.length > 0,
        },
      };
    }

    // Text output
    console.log(`Config Diff: ${env1} vs ${env2}`);
    console.log('='.repeat(50));

    if (diffs.length === 0) {
      console.log('\nNo differences found.');
      return { success: true, message: 'No differences found' };
    }

    const added = diffs.filter((d) => d.type === 'added');
    const removed = diffs.filter((d) => d.type === 'removed');
    const changed = diffs.filter((d) => d.type === 'changed');

    if (added.length > 0) {
      console.log(`\nAdded in ${env2} (${added.length}):`);
      for (const d of added) {
        console.log(`  + ${d.path}: ${formatValue(d.env2Value)}`);
      }
    }

    if (removed.length > 0) {
      console.log(`\nRemoved in ${env2} (${removed.length}):`);
      for (const d of removed) {
        console.log(`  - ${d.path}: ${formatValue(d.env1Value)}`);
      }
    }

    if (changed.length > 0) {
      console.log(`\nChanged (${changed.length}):`);
      for (const d of changed) {
        console.log(`  ~ ${d.path}:`);
        console.log(`      ${env1}: ${formatValue(d.env1Value)}`);
        console.log(`      ${env2}: ${formatValue(d.env2Value)}`);
      }
    }

    console.log('');
    return {
      success: true,
      message: `Found ${diffs.length} difference(s)`,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Failed to diff configs: ${errorMessage}`,
    };
  }
};
