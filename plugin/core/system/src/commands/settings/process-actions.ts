/**
 * Settings process-actions action.
 *
 * Processes declared actions from tech system responses.
 * Reads actions from stdin (JSON array) and applies them to sdd-settings.yaml.
 *
 * Supported actions:
 *   - register_component: adds a component to tech_packs.<namespace>.components
 *   - unregister_component: removes a component from tech_packs.<namespace>.components
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { findProjectRoot } from '@/lib/config';
import type { ProjectRootResult } from '@/lib/config';
import type { SettingsFile, TechPackEntry, ComponentManifest } from '@/types';

/** A declared action from the tech system */
type RegisterComponentAction = {
  readonly action: 'register_component';
  readonly name: string;
  readonly type: string;
  readonly directory: string;
};

type UnregisterComponentAction = {
  readonly action: 'unregister_component';
  readonly name: string;
};

type DeclaredAction = RegisterComponentAction | UnregisterComponentAction;

/** Result of processing a single action */
type ActionResult = {
  readonly action: string;
  readonly name: string;
  readonly success: boolean;
  readonly detail: string;
};

/** Validate a single action object */
const isValidAction = (obj: unknown): obj is DeclaredAction => {
  if (typeof obj !== 'object' || obj === null) return false;
  const record = obj as Readonly<Record<string, unknown>>;

  if (record.action === 'register_component') {
    return (
      typeof record.name === 'string' &&
      typeof record.type === 'string' &&
      typeof record.directory === 'string'
    );
  }

  if (record.action === 'unregister_component') {
    return typeof record.name === 'string';
  }

  return false;
};

/** Apply register_component action */
const applyRegister = (
  techPack: TechPackEntry,
  action: RegisterComponentAction
): { readonly entry: TechPackEntry; readonly result: ActionResult } => {
  const existing = techPack.components.find(
    (c) => c.name === action.name && c.type === action.type
  );

  if (existing) {
    // Update directory if changed
    if (existing.directory === action.directory) {
      return {
        entry: techPack,
        result: {
          action: 'register_component',
          name: action.name,
          success: true,
          detail: `Component "${action.name}" (${action.type}) already registered`,
        },
      };
    }

    const updatedComponents: readonly ComponentManifest[] = techPack.components.map((c) =>
      c.name === action.name && c.type === action.type
        ? { ...c, directory: action.directory }
        : c
    );

    return {
      entry: { ...techPack, components: updatedComponents },
      result: {
        action: 'register_component',
        name: action.name,
        success: true,
        detail: `Updated directory for "${action.name}" (${action.type}) to "${action.directory}"`,
      },
    };
  }

  // Add new component
  const newComponent: ComponentManifest = {
    name: action.name,
    type: action.type,
    directory: action.directory,
  };

  return {
    entry: { ...techPack, components: [...techPack.components, newComponent] },
    result: {
      action: 'register_component',
      name: action.name,
      success: true,
      detail: `Registered "${action.name}" (${action.type}) at "${action.directory}"`,
    },
  };
};

/** Apply unregister_component action */
const applyUnregister = (
  techPack: TechPackEntry,
  action: UnregisterComponentAction
): { readonly entry: TechPackEntry; readonly result: ActionResult } => {
  const existing = techPack.components.find((c) => c.name === action.name);

  if (!existing) {
    return {
      entry: techPack,
      result: {
        action: 'unregister_component',
        name: action.name,
        success: true,
        detail: `Component "${action.name}" not found (already removed)`,
      },
    };
  }

  const filteredComponents = techPack.components.filter((c) => c.name !== action.name);

  return {
    entry: { ...techPack, components: filteredComponents },
    result: {
      action: 'unregister_component',
      name: action.name,
      success: true,
      detail: `Unregistered "${action.name}" (${existing.type})`,
    },
  };
};

export const processActions = async (
  args: readonly string[],
  options: GlobalOptions
): Promise<CommandResult> => {
  // Parse --namespace and --actions from args
  const namespaceIdx = args.indexOf('--namespace');
  const actionsIdx = args.indexOf('--actions');

  if (namespaceIdx === -1 || namespaceIdx + 1 >= args.length) {
    return { success: false, error: 'Missing required --namespace argument' };
  }

  if (actionsIdx === -1 || actionsIdx + 1 >= args.length) {
    return { success: false, error: 'Missing required --actions argument (JSON array)' };
  }

  const namespace = args[namespaceIdx + 1]!;
  const actionsJson = args[actionsIdx + 1]!;

  // Parse actions JSON
  let rawActions: readonly unknown[];
  try {
    const parsed = JSON.parse(actionsJson);
    if (!Array.isArray(parsed)) {
      return { success: false, error: 'Actions must be a JSON array' };
    }
    rawActions = parsed as readonly unknown[];
  } catch {
    return { success: false, error: 'Invalid JSON in --actions argument' };
  }

  // Validate all actions
  const invalidIdx = rawActions.findIndex((a) => !isValidAction(a));
  if (invalidIdx !== -1) {
    return {
      success: false,
      error: `Invalid action at index ${invalidIdx}: must have "action" field ("register_component" or "unregister_component")`,
    };
  }

  const actions = rawActions as readonly DeclaredAction[];

  if (actions.length === 0) {
    return {
      success: true,
      message: 'No actions to process.',
      data: options.json ? { results: [] } : undefined,
    };
  }

  // Find project root
  const projectRootResult: ProjectRootResult = await findProjectRoot();
  if (!projectRootResult.found) {
    return { success: false, error: 'Not in an SDD project (no sdd/ or package.json found)' };
  }
  const projectRoot = projectRootResult.path;

  // Read settings file
  const settingsPath = join(projectRoot, 'sdd', 'sdd-settings.yaml');
  const legacySettingsPath = join(projectRoot, '.sdd', 'sdd-settings.yaml');
  const rawContentResult = (() => {
    try {
      return { ok: true as const, content: readFileSync(settingsPath, 'utf-8'), path: settingsPath };
    } catch {
      try {
        return { ok: true as const, content: readFileSync(legacySettingsPath, 'utf-8'), path: legacySettingsPath };
      } catch {
        return { ok: false as const, path: settingsPath };
      }
    }
  })();

  if (!rawContentResult.ok) {
    return { success: false, error: `Settings file not found: ${settingsPath}` };
  }

  const settings = YAML.parse(rawContentResult.content) as SettingsFile;

  // Get or create tech pack entry
  const techPacks = { ...(settings.tech_packs ?? {}) };
  const existingEntry = techPacks[namespace];

  if (!existingEntry) {
    return {
      success: false,
      error: `Tech pack namespace "${namespace}" not found in settings. Install the tech pack first.`,
    };
  }

  // Process actions sequentially
  let currentEntry: TechPackEntry = existingEntry;
  const results: ActionResult[] = [];

  for (const action of actions) {
    if (action.action === 'register_component') {
      const { entry, result } = applyRegister(currentEntry, action);
      currentEntry = entry;
      results.push(result);
    } else {
      const { entry, result } = applyUnregister(currentEntry, action);
      currentEntry = entry;
      results.push(result);
    }
  }

  // Write updated settings
  const updatedSettings: SettingsFile = {
    ...settings,
    tech_packs: { ...techPacks, [namespace]: currentEntry },
  };

  // Preserve header comments
  const headerMatch = rawContentResult.content.match(/^((?:#[^\n]*\n)*)/);
  const headerComments = headerMatch?.[1] ?? '';

  const newYaml = YAML.stringify(updatedSettings, { lineWidth: 120 });
  writeFileSync(rawContentResult.path, headerComments + newYaml);

  // Format output
  if (options.json) {
    return { success: true, data: { namespace, results } };
  }

  const lines = results.map((r) => `  ${r.success ? '\u2713' : '\u2717'} ${r.detail}`);
  return {
    success: true,
    message: `Processed ${actions.length} action(s) for tech pack "${namespace}":\n${lines.join('\n')}`,
  };
};
