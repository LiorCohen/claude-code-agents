/**
 * Check required development tools and report their installation status.
 *
 * Returns structured data about each tool's availability, version, and
 * install hints based on the detected platform/package manager.
 *
 * Usage:
 *   sdd-system env check-tools [--json]
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import type { CommandResult, GlobalOptions } from '@/lib/args';

type ToolCheck = {
  readonly name: string;
  readonly command: string;
  readonly parseVersion: (output: string) => string;
  readonly installHints: Readonly<Record<string, string>>;
  readonly fallbackUrl: string;
}

type ToolResult = {
  readonly name: string;
  readonly installed: boolean;
  readonly version?: string;
  readonly installHint?: string;
}

type CheckToolsData = {
  readonly platform: string;
  readonly packageManager?: PackageManager;
  readonly tools: ReadonlyArray<ToolResult>;
  readonly allInstalled: boolean;
  readonly missing: ReadonlyArray<string>;
}

type PackageManager = 'brew' | 'apt-get' | 'dnf' | 'yum';

type PackageManagerResult =
  | { readonly found: true; readonly manager: PackageManager }
  | { readonly found: false };

const TOOL_CHECKS: ReadonlyArray<ToolCheck> = [
  {
    name: 'node',
    command: 'node --version',
    parseVersion: (output) => output.trim(),
    installHints: {
      brew: 'brew install node',
      'apt-get': 'sudo apt-get install nodejs',
      dnf: 'sudo dnf install nodejs',
      yum: 'sudo yum install nodejs',
    },
    fallbackUrl: 'https://nodejs.org',
  },
  {
    name: 'npm',
    command: 'npm --version',
    parseVersion: (output) => output.trim(),
    installHints: {
      brew: 'Included with node',
      'apt-get': 'Included with nodejs',
      dnf: 'Included with nodejs',
      yum: 'Included with nodejs',
    },
    fallbackUrl: 'Included with node',
  },
  {
    name: 'git',
    command: 'git --version',
    parseVersion: (output) => {
      const match = output.match(/git version (\S+)/);
      return match?.[1] ?? output.trim();
    },
    installHints: {
      brew: 'brew install git',
      'apt-get': 'sudo apt-get install git',
      dnf: 'sudo dnf install git',
      yum: 'sudo yum install git',
    },
    fallbackUrl: 'https://git-scm.com',
  },
  {
    name: 'docker',
    command: 'docker --version',
    parseVersion: (output) => {
      const match = output.match(/Docker version (\S+?)(?:,|$)/);
      return match?.[1] ?? output.trim();
    },
    installHints: {
      brew: 'brew install docker',
      'apt-get': 'sudo apt-get install docker.io',
      dnf: 'sudo dnf install docker',
      yum: 'sudo yum install docker',
    },
    fallbackUrl: 'https://docs.docker.com/get-docker/',
  },
  {
    name: 'jq',
    command: 'jq --version',
    parseVersion: (output) => output.trim(),
    installHints: {
      brew: 'brew install jq',
      'apt-get': 'sudo apt-get install jq',
      dnf: 'sudo dnf install jq',
      yum: 'sudo yum install jq',
    },
    fallbackUrl: 'https://jqlang.github.io/jq/',
  },
  {
    name: 'kubectl',
    command: 'kubectl version --client -o json',
    parseVersion: (output) => {
      try {
        const parsed = JSON.parse(output) as { clientVersion?: { gitVersion?: string } };
        return parsed.clientVersion?.gitVersion ?? output.trim();
      } catch {
        return output.trim();
      }
    },
    installHints: {
      brew: 'brew install kubectl',
      'apt-get': 'sudo apt-get install kubectl',
      dnf: 'sudo dnf install kubectl',
      yum: 'sudo yum install kubectl',
    },
    fallbackUrl: 'https://kubernetes.io/docs/tasks/tools/',
  },
  {
    name: 'helm',
    command: 'helm version --short',
    parseVersion: (output) => output.trim(),
    installHints: {
      brew: 'brew install helm',
      'apt-get': 'sudo apt-get install helm',
      dnf: 'sudo dnf install helm',
      yum: 'sudo yum install helm',
    },
    fallbackUrl: 'https://helm.sh/docs/intro/install/',
  },
];

/**
 * Detect the system's package manager based on platform.
 */
const detectPackageManager = (): PackageManagerResult => {
  const platform = process.platform;

  if (platform === 'darwin') {
    try {
      execSync('which brew', { timeout: 5000, stdio: 'pipe' });
      return { found: true, manager: 'brew' };
    } catch {
      return { found: false };
    }
  }

  if (platform === 'linux') {
    const managers: ReadonlyArray<PackageManager> = ['apt-get', 'dnf', 'yum'];
    for (const mgr of managers) {
      try {
        execSync(`which ${mgr}`, { timeout: 5000, stdio: 'pipe' });
        return { found: true, manager: mgr };
      } catch {
        // Try next
      }
    }
    return { found: false };
  }

  return { found: false };
};

/**
 * Check if running under WSL on Windows.
 */
const isWSL = (): boolean => {
  try {
    const procVersion = readFileSync('/proc/version', 'utf-8');
    return /microsoft|wsl/i.test(procVersion);
  } catch {
    return false;
  }
};

/**
 * Determine the effective platform, handling WSL detection.
 */
const getEffectivePlatform = (): { platform: string; supported: boolean } => {
  const raw = process.platform;

  if (raw === 'darwin' || raw === 'linux') {
    return { platform: raw, supported: true };
  }

  if (raw === 'win32') {
    if (isWSL()) {
      return { platform: 'linux', supported: true };
    }
    return { platform: 'win32', supported: false };
  }

  return { platform: raw, supported: false };
};

/**
 * Check a single tool's installation status.
 */
const checkTool = (tool: ToolCheck, packageManager: PackageManagerResult): ToolResult => {
  try {
    const output = execSync(tool.command, {
      timeout: 5000,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return {
      name: tool.name,
      installed: true,
      version: tool.parseVersion(output),
    };
  } catch {
    const installHint = packageManager.found
      ? (tool.installHints[packageManager.manager] ?? tool.fallbackUrl)
      : tool.fallbackUrl;

    return {
      name: tool.name,
      installed: false,
      installHint,
    };
  }
};

/**
 * Format tool results as human-readable output.
 */
const formatHumanReadable = (tools: ReadonlyArray<ToolResult>): string => {
  const lines = tools.map((tool) => {
    if (tool.installed) {
      return `  \u2713 ${tool.name} (${tool.version})`;
    }
    return `  \u2717 ${tool.name} not found`;
  });
  return lines.join('\n');
};

export const checkTools = async (
  _args: readonly string[],
  options: GlobalOptions
): Promise<CommandResult> => {
  const { platform, supported } = getEffectivePlatform();

  if (!supported) {
    const error = 'SDD requires a Unix environment (macOS or Linux).\n'
      + 'On Windows, use WSL (Windows Subsystem for Linux): '
      + 'https://learn.microsoft.com/en-us/windows/wsl/install';
    return { success: false, error };
  }

  const packageManagerResult = detectPackageManager();
  const toolResults = TOOL_CHECKS.map((tool) => checkTool(tool, packageManagerResult));
  const missing = toolResults.filter((t) => !t.installed).map((t) => t.name);
  const allInstalled = missing.length === 0;

  const data: CheckToolsData = {
    platform,
    ...(packageManagerResult.found ? { packageManager: packageManagerResult.manager } : {}),
    tools: toolResults,
    allInstalled,
    missing,
  };

  if (options.json) {
    return { success: true, data };
  }

  const message = formatHumanReadable(toolResults);
  return { success: allInstalled, message, data };
};
