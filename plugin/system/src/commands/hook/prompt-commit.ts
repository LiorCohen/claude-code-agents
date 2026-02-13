/**
 * PostToolUse hook: prompt-commit
 *
 * Prompts to commit after writes to SDD-managed directories.
 * Reads JSON input from stdin and outputs JSON message.
 */

import { text } from 'node:stream/consumers';
import type { CommandResult } from '@/lib/args';
import type { HookInput, PostToolUseHookOutput } from '@/types/config';

// SDD-managed directories that should trigger commit prompts
const SDD_DIRS = ['changes/', 'specs/', 'components/', 'config/', 'tests/'] as const;

/**
 * Create a commit prompt output.
 */
const createOutput = (tool: string, fileName: string, contextDir: string): PostToolUseHookOutput => {
  const action = tool === 'Write' ? 'Created' : 'Modified';
  return {
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      message: `${action} ${fileName} in ${contextDir}. Consider committing to prevent data loss.`,
    },
  };
};

type MatchingDirResult =
  | { readonly found: true; readonly dir: string }
  | { readonly found: false };

/**
 * Check if a file path is in an SDD-managed directory.
 */
const findMatchingDir = (filePath: string): MatchingDirResult => {
  const matched = SDD_DIRS.find((dir) => filePath.startsWith(dir));
  return matched ? { found: true, dir: matched } : { found: false };
};

/**
 * Determine the context directory for the commit message.
 */
const getContextDir = (filePath: string, matchedDir: string): string => {
  if (filePath.startsWith('changes/')) {
    // Extract change directory: changes/YYYY/MM/DD/name/file -> changes/YYYY/MM/DD/name
    const parts = filePath.split('/');
    if (parts.length >= 5) {
      return parts.slice(0, 5).join('/');
    }
  }
  // Use the matched directory prefix without trailing slash
  return matchedDir.replace(/\/$/, '');
};

/**
 * Get the base name from a path.
 */
const basename = (filePath: string): string => {
  const parts = filePath.split('/');
  return parts[parts.length - 1] ?? filePath;
};

const readStdin = (): Promise<string> => text(process.stdin);

export const promptCommit = async (): Promise<CommandResult> => {
  try {
    // Read input from stdin
    const inputStr = await readStdin();
    if (!inputStr.trim()) {
      // No input, exit silently
      return { success: true };
    }

    const input = JSON.parse(inputStr) as HookInput;

    // Extract tool and file path
    const tool = input.tool ?? '';
    const filePath = (input.tool_input?.file_path ?? input.tool_input?.path ?? '')
      .replace(/^\.\//, ''); // Normalize path - remove leading ./

    // Only trigger for Write or Edit tools
    if (tool !== 'Write' && tool !== 'Edit') {
      return { success: true };
    }

    // Check if file is in an SDD-managed directory
    const matchResult = findMatchingDir(filePath);
    if (!matchResult.found) {
      // Exit silently if not an SDD-managed file
      return { success: true };
    }

    // Determine context directory
    const contextDir = getContextDir(filePath, matchResult.dir);

    // Output message to Claude
    const output = createOutput(tool, basename(filePath), contextDir);
    console.log(JSON.stringify(output));

    return { success: true, data: output };
  } catch (err) {
    // On error, exit silently
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`Hook error: ${errorMessage}`);
    return { success: true };
  }
};
