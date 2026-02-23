/**
 * Process execution helpers for tests.
 * Tests should use these instead of importing node:child_process directly.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { PLUGIN_DIR } from './paths';

export interface RunResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface RunOptions {
  readonly cwd?: string;
  readonly timeout?: number;
  readonly input?: string;
  readonly env?: Readonly<Record<string, string | undefined>>;
}

/**
 * Collect chunks from a stream into an array.
 * Note: Uses internal mutation for stream accumulation, returns immutable result.
 */
const createChunkCollector = (): {
  add: (chunk: Buffer) => void;
  getResult: () => readonly Buffer[];
} => {
  const chunks: Buffer[] = [];
  return {
    add: (chunk: Buffer) => {
      chunks[chunks.length] = chunk;
    },
    getResult: () => chunks,
  };
};

/**
 * Run a command and return the result.
 */
export const runCommand = async (
  cmd: string,
  args: readonly string[],
  options: RunOptions = {}
): Promise<RunResult> => {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, [...args], {
      cwd: options.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: options.env ? { ...process.env, ...options.env } : process.env,
    });

    const stdoutCollector = createChunkCollector();
    const stderrCollector = createChunkCollector();
    const timeout = options.timeout ?? 120000;

    const timeoutId = setTimeout(() => {
      proc.kill();
      reject(new Error(`Command timed out after ${timeout}ms`));
    }, timeout);

    if (options.input) {
      proc.stdin?.write(options.input);
      proc.stdin?.end();
    }

    proc.stdout?.on('data', stdoutCollector.add);
    proc.stderr?.on('data', stderrCollector.add);

    proc.on('close', (code) => {
      clearTimeout(timeoutId);
      const stdout = Buffer.concat([...stdoutCollector.getResult()]).toString();
      const stderr = Buffer.concat([...stderrCollector.getResult()]).toString();
      resolve({ exitCode: code ?? 0, stdout, stderr });
    });

    proc.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });
};

/**
 * Run the scaffolding command via the sdd-system CLI.
 */
export const runScaffolding = async (configPath: string, cwd: string): Promise<RunResult> => {
  const cliPath = `${PLUGIN_DIR}/core/system/dist/cli.js`;
  return runCommand('node', ['--enable-source-maps', cliPath, 'scaffolding', 'project', '--config', configPath], {
    cwd,
    timeout: 60000,
  });
};

/**
 * Run npm command in the given directory.
 */
export const runNpm = async (
  command: string,
  cwd: string,
  timeoutMs = 300000
): Promise<RunResult> => {
  const args = command.split(' ');
  return runCommand('npm', args, { cwd, timeout: timeoutMs });
};

/**
 * Spawn a background process (returns the process handle for cleanup).
 */
export const spawnBackground = (
  cmd: string,
  args: readonly string[],
  cwd: string
): ChildProcess => {
  return spawn(cmd, [...args], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });
};
