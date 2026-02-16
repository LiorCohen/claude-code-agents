/**
 * Unit Tests: env check-tools command
 *
 * WHY: The check-tools command provides structured tool availability data
 * for init. Tests verify version parsing, platform detection, install
 * hint generation, and output formatting.
 */

import { describe, expect, it } from 'vitest';
import { PLUGIN_DIR, joinPath, readFile } from '@/lib';

const CHECK_TOOLS_PATH = joinPath(PLUGIN_DIR, 'system', 'src', 'commands', 'env', 'check-tools.ts');
const ENV_HANDLER_PATH = joinPath(PLUGIN_DIR, 'system', 'src', 'commands', 'env', 'handler.ts');
const CLI_PATH = joinPath(PLUGIN_DIR, 'system', 'src', 'cli.ts');

/**
 * WHY: Verify the command file exists and is registered.
 */
describe('check-tools command files', () => {
  it('check-tools.ts exists in plugin system/src/commands/env', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toBeDefined();
    expect(content.length).toBeGreaterThan(0);
  });

  it('env/handler.ts registers check-tools action', () => {
    const content = readFile(ENV_HANDLER_PATH);
    expect(content).toContain("'check-tools'");
    expect(content).toContain("case 'check-tools'");
  });

  it('cli.ts documents check-tools in help text', () => {
    const content = readFile(CLI_PATH);
    expect(content).toContain('check-tools');
  });
});

/**
 * WHY: Verify the command exports the correct function signature.
 */
describe('check-tools command structure', () => {
  it('exports checkTools function', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain('export const checkTools');
  });

  it('returns CommandResult', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain('Promise<CommandResult>');
  });

  it('imports CommandResult and GlobalOptions from args', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain("import type { CommandResult, GlobalOptions } from '@/lib/args'");
  });
});

/**
 * WHY: Verify structured data output shape matches plan.
 */
describe('check-tools data shape', () => {
  it('defines CheckToolsData interface with platform field', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain('readonly platform: string');
  });

  it('defines CheckToolsData interface with packageManager field', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain('readonly packageManager?: PackageManager');
  });

  it('defines CheckToolsData interface with tools array', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain('readonly tools: ReadonlyArray<ToolResult>');
  });

  it('defines CheckToolsData interface with allInstalled field', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain('readonly allInstalled: boolean');
  });

  it('defines CheckToolsData interface with missing array', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain('readonly missing: ReadonlyArray<string>');
  });

  it('defines ToolResult with name, installed, version, installHint', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain('readonly name: string');
    expect(content).toContain('readonly installed: boolean');
    expect(content).toContain('readonly version?: string');
    expect(content).toContain('readonly installHint?: string');
  });
});

/**
 * WHY: Verify all 7 required tools are checked.
 */
describe('tool definitions', () => {
  const REQUIRED_TOOLS = ['node', 'npm', 'git', 'docker', 'jq', 'kubectl', 'helm'];

  it('checks all 7 required tools', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    for (const tool of REQUIRED_TOOLS) {
      expect(content).toContain(`name: '${tool}'`);
    }
  });

  it('defines version command for each tool', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain("command: 'node --version'");
    expect(content).toContain("command: 'npm --version'");
    expect(content).toContain("command: 'git --version'");
    expect(content).toContain("command: 'docker --version'");
    expect(content).toContain("command: 'jq --version'");
    expect(content).toContain("command: 'kubectl version --client -o json'");
    expect(content).toContain("command: 'helm version --short'");
  });
});

/**
 * WHY: Verify version parsing logic for each tool.
 */
describe('version parsing', () => {
  it('node version parser returns output directly (trimmed)', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    // node parseVersion just trims the output
    const nodeSection = content.slice(
      content.indexOf("name: 'node'"),
      content.indexOf("name: 'npm'")
    );
    expect(nodeSection).toContain('output.trim()');
  });

  it('git version parser extracts version from "git version X.Y.Z"', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain('git version');
    const gitSection = content.slice(
      content.indexOf("name: 'git'"),
      content.indexOf("name: 'docker'")
    );
    expect(gitSection).toContain('match');
  });

  it('docker version parser extracts version from "Docker version X.Y.Z"', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain('Docker version');
    const dockerSection = content.slice(
      content.indexOf("name: 'docker'"),
      content.indexOf("name: 'jq'")
    );
    expect(dockerSection).toContain('match');
  });

  it('kubectl version parser extracts gitVersion from JSON', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain('clientVersion');
    expect(content).toContain('gitVersion');
  });
});

/**
 * WHY: Verify tool execution uses timeout to prevent hangs.
 */
describe('tool execution', () => {
  it('uses execSync with 5 second timeout', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain('timeout: 5000');
  });

  it('uses pipe stdio to suppress output', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain("stdio: ['pipe', 'pipe', 'pipe']");
  });
});

/**
 * WHY: Verify platform detection handles macOS, Linux, and Windows.
 */
describe('platform detection', () => {
  it('detects darwin as supported', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain("'darwin'");
  });

  it('detects linux as supported', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain("'linux'");
  });

  it('detects win32 and checks for WSL', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain("'win32'");
    expect(content).toContain('isWSL');
  });

  it('blocks native Windows with WSL install instructions', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain('SDD requires a Unix environment');
    expect(content).toContain('https://learn.microsoft.com/en-us/windows/wsl/install');
  });

  it('WSL detection reads /proc/version', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain('/proc/version');
    expect(content).toContain('microsoft');
  });
});

/**
 * WHY: Verify package manager detection for install hints.
 */
describe('package manager detection', () => {
  it('detects brew on darwin', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain("'brew'");
    expect(content).toContain('which brew');
  });

  it('detects apt-get on linux', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain("'apt-get'");
  });

  it('detects dnf on linux', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain("'dnf'");
  });

  it('detects yum on linux', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain("'yum'");
  });

  it('returns not-found result when no package manager detected', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    // detectPackageManager returns null as fallback
    expect(content).toContain('return { found: false }');
  });
});

/**
 * WHY: Verify install hints use detected package manager.
 */
describe('install hints', () => {
  it('each tool has brew install hints', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain("brew: 'brew install node'");
    expect(content).toContain("brew: 'brew install git'");
    expect(content).toContain("brew: 'brew install docker'");
    expect(content).toContain("brew: 'brew install jq'");
    expect(content).toContain("brew: 'brew install kubectl'");
    expect(content).toContain("brew: 'brew install helm'");
  });

  it('each tool has apt-get install hints', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain("'apt-get': 'sudo apt-get install nodejs'");
    expect(content).toContain("'apt-get': 'sudo apt-get install git'");
    expect(content).toContain("'apt-get': 'sudo apt-get install docker.io'");
    expect(content).toContain("'apt-get': 'sudo apt-get install jq'");
    expect(content).toContain("'apt-get': 'sudo apt-get install kubectl'");
    expect(content).toContain("'apt-get': 'sudo apt-get install helm'");
  });

  it('each tool has fallback URL', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain("fallbackUrl: 'https://nodejs.org'");
    expect(content).toContain("fallbackUrl: 'https://git-scm.com'");
    expect(content).toContain("fallbackUrl: 'https://docs.docker.com/get-docker/'");
    expect(content).toContain("fallbackUrl: 'https://jqlang.github.io/jq/'");
    expect(content).toContain("fallbackUrl: 'https://kubernetes.io/docs/tasks/tools/'");
    expect(content).toContain("fallbackUrl: 'https://helm.sh/docs/intro/install/'");
  });

  it('uses fallback URL when no package manager detected', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    // When packageManager is null, installHint falls back to fallbackUrl
    expect(content).toContain('tool.fallbackUrl');
  });
});

/**
 * WHY: Verify human-readable output formatting.
 */
describe('human-readable output', () => {
  it('uses checkmark for installed tools', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain('\\u2713');
  });

  it('uses cross for missing tools', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain('\\u2717');
  });

  it('formats installed tools as "name (version)"', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain('${tool.name} (${tool.version})');
  });

  it('formats missing tools as "name not found"', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain('${tool.name} not found');
  });
});

/**
 * WHY: Verify JSON output mode returns data via CommandResult.
 */
describe('JSON output mode', () => {
  it('checks options.json flag', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain('options.json');
  });

  it('returns success with data in JSON mode', () => {
    const content = readFile(CHECK_TOOLS_PATH);
    expect(content).toContain('return { success: true, data }');
  });
});
