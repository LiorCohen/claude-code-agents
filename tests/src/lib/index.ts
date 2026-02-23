/**
 * Test library exports.
 * Tests should import from this file instead of node:* modules.
 */

// Path constants
export {
  LIB_DIR,
  SRC_DIR,
  TESTS_ROOT_DIR,
  REPO_ROOT,
  PLUGIN_DIR,
  CORE_SKILLS_DIR,
  TECH_SKILLS_DIR,
  TECH_PACK_DIR,
  TEST_OUTPUT_DIR,
} from './paths';

// File system helpers
export type { DirEntry } from './fs';
export {
  joinPath,
  fileExists,
  dirExists,
  isFile,
  isDirectory,
  readFile,
  readFileAsync,
  writeFile,
  writeFileAsync,
  mkdir,
  rmdir,
  mkdtemp,
  listDir,
  listDirWithTypes,
  stat,
  statAsync,
} from './fs';

// Process execution
export type { RunResult, RunOptions } from './process';
export { runCommand, runScaffolding, runNpm, spawnBackground } from './process';

// Test project utilities
export type { TestProject } from './project';
export {
  createTestProject,
  cleanupTestProject,
  projectExists,
  projectIsDir,
  projectIsFile,
  projectFileDoesNotExist,
  projectFileContains,
  projectReadFile,
  projectFindDir,
} from './project';

// Claude CLI helpers
export type { ClaudeResult, ToolUse, ParsedOutput } from './claude';
export {
  runClaude,
  parseClaudeOutput,
  resultContains,
  resultMatches,
  agentWasUsed,
  agentOrder,
} from './claude';

// HTTP utilities
export type { HttpResponse } from './http';
export { waitForServer, httpGet, httpPost } from './http';
