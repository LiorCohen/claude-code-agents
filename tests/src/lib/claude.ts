/**
 * Claude CLI helpers for tests.
 * Utilities for running Claude and parsing output.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { MARKETPLACE_DIR, TEST_OUTPUT_DIR } from './paths';
import { mkdir, writeFile, joinPath } from './fs';

export interface ClaudeResult {
  readonly output: string;
  readonly exitCode: number;
  readonly elapsedSeconds: number;
}

export interface ToolUse {
  readonly name: string;
  readonly input: Record<string, unknown>;
  readonly id: string;
}

export interface ParsedOutput {
  readonly toolUses: readonly ToolUse[];
  readonly skillInvocations: readonly string[];
  readonly agentInvocations: readonly string[];
}

/**
 * Collect string chunks from a stream.
 * Note: Uses internal mutation for stream accumulation, returns immutable result.
 */
const createStringCollector = (): {
  add: (chunk: string) => void;
  getResult: () => readonly string[];
} => {
  const chunks: string[] = [];
  return {
    add: (chunk: string) => {
      chunks[chunks.length] = chunk;
    },
    getResult: () => chunks,
  };
};

/**
 * Run Claude CLI with the SDD plugin loaded.
 */
export const runClaude = async (
  prompt: string,
  workingDir: string,
  timeoutSeconds = 120,
  verbose = false
): Promise<ClaudeResult> => {
  await mkdir(TEST_OUTPUT_DIR);
  const outputFile = joinPath(TEST_OUTPUT_DIR, `output-${Date.now()}.json`);

  const cmd = 'claude';
  const args = [
    '-p',
    prompt,
    '--add-dir',
    MARKETPLACE_DIR,
    '--permission-mode',
    'bypassPermissions',
    '--output-format',
    'stream-json',
  ];

  if (verbose) {
    console.log(
      `\x1b[1;33mRunning Claude with timeout ${timeoutSeconds}s in ${workingDir}...\x1b[0m`
    );
  }

  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const proc: ChildProcess = spawn(cmd, args, {
      cwd: workingDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const outputCollector = createStringCollector();

    // State tracking - mutations confined to this closure
    let toolCount = 0;
    let lastTool = '';
    let timeoutId: NodeJS.Timeout | null = null;

    const cleanup = (): void => {
      if (timeoutId) clearTimeout(timeoutId);
    };

    const checkTimeout = (): void => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (elapsed > timeoutSeconds) {
        cleanup();
        proc.kill();
        reject(new Error(`Claude timed out after ${timeoutSeconds}s`));
      } else {
        timeoutId = setTimeout(checkTimeout, 1000);
      }
    };

    timeoutId = setTimeout(checkTimeout, 1000);

    proc.stdout?.on('data', (data: Buffer) => {
      const line = data.toString();
      outputCollector.add(line);

      const elapsed = Math.floor((Date.now() - startTime) / 1000);

      // Check for tool calls
      const toolMatch = /"name":"([^"]+)"/.exec(line);
      if (toolMatch?.[1] && toolMatch[1] !== lastTool) {
        toolCount = toolCount + 1;
        lastTool = toolMatch[1];
        if (verbose) {
          console.log(`  \x1b[1;33m[${elapsed}s]\x1b[0m Tool #${toolCount}: ${lastTool}`);
        }
      }

      // Check for agent invocations
      const agentMatch = /"subagent_type":"([^"]+)"/.exec(line);
      if (agentMatch?.[1] && verbose) {
        console.log(`  \x1b[0;32m[${elapsed}s]\x1b[0m Agent invoked: ${agentMatch[1]}`);
      }
    });

    proc.stderr?.on('data', (data: Buffer) => {
      outputCollector.add(data.toString());
    });

    proc.on('close', (code) => {
      cleanup();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const output = outputCollector.getResult().join('');

      // Save output for debugging
      writeFile(outputFile, output);

      if (verbose) {
        if (code === 0) {
          console.log(`\x1b[0;32mClaude completed in ${elapsed}s\x1b[0m`);
        } else {
          console.log(`\x1b[0;31mClaude exited with code ${code} after ${elapsed}s\x1b[0m`);
        }
      }

      resolve({
        output,
        exitCode: code ?? 0,
        elapsedSeconds: elapsed,
      });
    });

    proc.on('error', (err) => {
      cleanup();
      reject(err);
    });
  });
};

/**
 * Parse Claude's stream-json output into structured data.
 */
export const parseClaudeOutput = (output: string): ParsedOutput => {
  const lines = output.split('\n').filter((line) => line.trim());

  const results = lines.reduce(
    (acc, line) => {
      try {
        const event = JSON.parse(line) as {
          type?: string;
          message?: {
            content?: readonly {
              type?: string;
              name?: string;
              input?: Record<string, unknown>;
              id?: string;
            }[];
          };
        };

        if (event.type === 'assistant' && event.message?.content) {
          const lineResults = event.message.content.reduce(
            (contentAcc, content) => {
              if (content.type === 'tool_use' && content.name && content.id) {
                const toolUse: ToolUse = {
                  name: content.name,
                  input: content.input ?? {},
                  id: content.id,
                };

                const skill =
                  content.name === 'Skill' && content.input?.['skill']
                    ? [content.input['skill'] as string]
                    : [];

                const agent =
                  content.name === 'Task' && content.input?.['subagent_type']
                    ? [content.input['subagent_type'] as string]
                    : [];

                return {
                  toolUses: [...contentAcc.toolUses, toolUse],
                  skillInvocations: [...contentAcc.skillInvocations, ...skill],
                  agentInvocations: [...contentAcc.agentInvocations, ...agent],
                };
              }
              return contentAcc;
            },
            { toolUses: [] as readonly ToolUse[], skillInvocations: [] as readonly string[], agentInvocations: [] as readonly string[] }
          );

          return {
            toolUses: [...acc.toolUses, ...lineResults.toolUses],
            skillInvocations: [...acc.skillInvocations, ...lineResults.skillInvocations],
            agentInvocations: [...acc.agentInvocations, ...lineResults.agentInvocations],
          };
        }
      } catch {
        // Skip non-JSON lines
      }
      return acc;
    },
    { toolUses: [] as readonly ToolUse[], skillInvocations: [] as readonly string[], agentInvocations: [] as readonly string[] }
  );

  return results;
};

/**
 * Check if output contains a pattern.
 */
export const resultContains = (result: ClaudeResult, pattern: string): boolean =>
  result.output.includes(pattern);

/**
 * Check if output matches a regex pattern.
 */
export const resultMatches = (result: ClaudeResult, pattern: string): boolean =>
  new RegExp(pattern).test(result.output);

/**
 * Check if a specific agent was invoked via Task tool.
 */
export const agentWasUsed = (result: ClaudeResult, agentName: string): boolean => {
  const pattern = new RegExp(`"subagent_type"\\s*:\\s*"${agentName}"`);
  return pattern.test(result.output);
};

/**
 * Check if agents were used in a specific order.
 */
export const agentOrder = (result: ClaudeResult, first: string, second: string): boolean => {
  const firstPattern = new RegExp(`"subagent_type"\\s*:\\s*"${first}"`);
  const secondPattern = new RegExp(`"subagent_type"\\s*:\\s*"${second}"`);

  const firstMatch = firstPattern.exec(result.output);
  const secondMatch = secondPattern.exec(result.output);

  if (!firstMatch || !secondMatch) return false;
  return firstMatch.index < secondMatch.index;
};
