/**
 * Structured log write command.
 *
 * Writes a structured log entry to sdd/system-logs/.
 * Used by prompt-layer operations (skills, agents) that need
 * to produce structured audit trails.
 *
 * Usage:
 *   sdd-system log write --level info --source techpacks.loadAgent --message "Loaded agent" [--data '{"agent":"my-agent"}']
 */

import type { CommandResult } from '@/lib/args';
import { findProjectRoot } from '@/lib/config';
import { exists } from '@/lib/fs';
import { join } from 'node:path';
import { mkdir, appendFile } from 'node:fs/promises';

export const writeLog = async (
  level: string,
  source: string,
  message: string,
  data?: string
): Promise<CommandResult> => {
  const projectRootResult = await findProjectRoot();
  if (!projectRootResult.found) {
    return { success: false, error: 'Not in an SDD project (no sdd/ or package.json found)' };
  }
  const projectRoot = projectRootResult.path;

  // Determine log directory — try sdd/ first, fall back to .sdd/
  let logDir = join(projectRoot, 'sdd', 'system-logs');
  if (!(await exists(join(projectRoot, 'sdd')))) {
    logDir = join(projectRoot, '.sdd', 'system-logs');
  }

  await mkdir(logDir, { recursive: true });

  // Parse optional data
  let parsedData: unknown;
  if (data) {
    try {
      parsedData = JSON.parse(data);
    } catch {
      return { success: false, error: `Invalid JSON in --data: ${data}` };
    }
  }

  // Build structured log entry
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    source,
    message,
    ...(parsedData !== undefined ? { data: parsedData } : {}),
  };

  // Write to daily log file
  const dateStr = new Date().toISOString().slice(0, 10);
  const logFile = join(logDir, `${dateStr}.jsonl`);
  await appendFile(logFile, JSON.stringify(entry) + '\n', 'utf-8');

  return {
    success: true,
    message: `Logged: [${level}] ${source} — ${message}`,
    data: entry,
  };
};
