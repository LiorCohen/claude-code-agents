/**
 * PreToolUse hook: validate-write
 *
 * Auto-approves writes to safe SDD directories, blocks sensitive paths.
 * Reads JSON input from stdin and outputs JSON decision.
 */

import type { CommandResult } from '@/lib/args';
import type { HookInput, PreToolUseHookOutput } from '@/types/config';

// Blocked patterns (security-sensitive)
const BLOCKED_PATTERNS = [
  '.env',
  'secrets/',
  '.git/',
  'node_modules/',
  'credentials',
  '*.pem',
  '*.key',
  'id_rsa',
  'id_ed25519',
] as const;

// Safe directories for SDD operations
const SAFE_DIRS = [
  '.sdd/',
  'changes/',
  'specs/',
  'components/',
  'config/',
  '.github/workflows/',
  'docs/',
  'tests/',
] as const;

// Safe root files
const SAFE_FILES = [
  'README.md',
  'CLAUDE.md',
  'package.json',
  '.gitignore',
  'tsconfig.json',
  'vitest.config.ts',
  'jest.config.js',
  'jest.config.ts',
] as const;

/**
 * Create an allow decision output.
 */
const allow = (): PreToolUseHookOutput => ({
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    decision: {
      behavior: 'allow',
    },
  },
});

/**
 * Create a block decision output.
 */
const block = (reason: string): PreToolUseHookOutput => ({
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    decision: {
      behavior: 'block',
      message: reason,
    },
  },
});

type BlockedPatternResult =
  | { readonly matched: true; readonly pattern: string }
  | { readonly matched: false };

/**
 * Check if a file path matches any blocked pattern.
 */
const matchesBlockedPattern = (filePath: string): BlockedPatternResult => {
  const match = BLOCKED_PATTERNS.find((pattern) => {
    if (pattern.startsWith('*')) {
      const suffix = pattern.slice(1);
      return filePath.endsWith(suffix);
    }
    return filePath.includes(pattern);
  });
  return match ? { matched: true, pattern: match } : { matched: false };
};

/**
 * Check if a file path is in a safe directory.
 */
const isInSafeDir = (filePath: string): boolean => {
  return SAFE_DIRS.some((dir) => filePath.startsWith(dir));
};

/**
 * Check if a file path is a safe root file.
 */
const isSafeRootFile = (filePath: string): boolean => {
  return (SAFE_FILES as readonly string[]).includes(filePath);
};

/**
 * Read all data from stdin as a string.
 * Collects chunks via event-based accumulation, joins at end.
 */
const readStdin = (): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: string[] = [];
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk: string) => { chunks.push(chunk); });
    process.stdin.on('end', () => { resolve(chunks.join('')); });
    process.stdin.on('error', reject);
  });

export const validateWrite = async (): Promise<CommandResult> => {
  try {
    // Read input from stdin
    const inputStr = await readStdin();
    if (!inputStr.trim()) {
      // No input, pass through
      return { success: true };
    }

    const input = JSON.parse(inputStr) as HookInput;

    // Extract tool and file path
    const tool = input.tool ?? '';
    const filePath = (input.tool_input?.file_path ?? input.tool_input?.path ?? '')
      .replace(/^\.\//, ''); // Normalize path - remove leading ./

    // Skip if not Write or Edit
    if (tool !== 'Write' && tool !== 'Edit') {
      return { success: true };
    }

    // Skip if no file path
    if (!filePath) {
      return { success: true };
    }

    // Check blocked patterns first (highest priority)
    const blockedResult = matchesBlockedPattern(filePath);
    if (blockedResult.matched) {
      const output = block(
        `SDD hook: Blocked write to sensitive path containing '${blockedResult.pattern}': ${filePath}`
      );
      console.log(JSON.stringify(output));
      return { success: true, data: output };
    }

    // Check safe directories
    if (isInSafeDir(filePath)) {
      const output = allow();
      console.log(JSON.stringify(output));
      return { success: true, data: output };
    }

    // Check safe root files
    if (isSafeRootFile(filePath)) {
      const output = allow();
      console.log(JSON.stringify(output));
      return { success: true, data: output };
    }

    // Not in safe list - let Claude's normal permission flow handle it
    return { success: true };
  } catch (err) {
    // On error, pass through to normal flow
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`Hook error: ${errorMessage}`);
    return { success: true };
  }
};
