---
generated: 2026-02-14 12:43 UTC
branch: feature/task-134-fix-cli-invocation
commits: 1
---

# Task #134 — Changes

**Files changed:** 32 (+368 / -88 lines)

| File | Added | Removed |
|------|------:|--------:|
| [`plugin/system/system-run.sh`](plugin/system/system-run.sh) | +3 | -1 |
| [`plugin/hooks/hook-runner.sh`](plugin/hooks/hook-runner.sh) | +3 | -1 |
| [`plugin/system/src/commands/permissions/configure.ts`](plugin/system/src/commands/permissions/configure.ts) | +1 | -8 |
| [`.claude/skills/system-cli-standards/skill.md`](.claude/skills/system-cli-standards/skill.md) | +19 | -6 |
| [`.claude/skills/commands-standards/SKILL.md`](.claude/skills/commands-standards/SKILL.md) | +1 | -1 |
| [`plugin/commands/sdd-init.md`](plugin/commands/sdd-init.md) | +11 | -11 |
| [`plugin/commands/sdd-version.md`](plugin/commands/sdd-version.md) | +2 | -2 |
| [`plugin/commands/sdd-run.md`](plugin/commands/sdd-run.md) | +2 | -2 |
| [`plugin/commands/sdd-config.md`](plugin/commands/sdd-config.md) | +4 | -4 |
| [`plugin/commands/sdd-change.md`](plugin/commands/sdd-change.md) | +2 | -2 |
| [`plugin/hooks/PERMISSIONS.md`](plugin/hooks/PERMISSIONS.md) | +2 | -2 |
| [`plugin/agents/api-designer.md`](plugin/agents/api-designer.md) | +1 | -1 |
| [`plugin/skills/components/backend/backend-scaffolding/SKILL.md`](plugin/skills/components/backend/backend-scaffolding/SKILL.md) | +1 | -1 |
| [`plugin/skills/components/config/config-scaffolding/SKILL.md`](plugin/skills/components/config/config-scaffolding/SKILL.md) | +1 | -1 |
| [`plugin/skills/components/contract/contract-scaffolding/SKILL.md`](plugin/skills/components/contract/contract-scaffolding/SKILL.md) | +3 | -3 |
| [`plugin/skills/components/contract/contract-standards/SKILL.md`](plugin/skills/components/contract/contract-standards/SKILL.md) | +4 | -4 |
| [`plugin/skills/components/database/database-scaffolding/SKILL.md`](plugin/skills/components/database/database-scaffolding/SKILL.md) | +8 | -8 |
| [`plugin/skills/components/database/database-standards/SKILL.md`](plugin/skills/components/database/database-standards/SKILL.md) | +9 | -9 |
| [`plugin/skills/components/frontend/frontend-scaffolding/SKILL.md`](plugin/skills/components/frontend/frontend-scaffolding/SKILL.md) | +1 | -1 |
| [`plugin/skills/components/helm/helm-scaffolding/SKILL.md`](plugin/skills/components/helm/helm-scaffolding/SKILL.md) | +2 | -2 |
| [`plugin/skills/components/helm/helm-standards/SKILL.md`](plugin/skills/components/helm/helm-standards/SKILL.md) | +1 | -1 |
| [`plugin/skills/domain-population/SKILL.md`](plugin/skills/domain-population/SKILL.md) | +1 | -1 |
| [`plugin/skills/external-spec-integration/resources/workflow-steps.md`](plugin/skills/external-spec-integration/resources/workflow-steps.md) | +1 | -1 |
| [`plugin/skills/scaffolding/SKILL.md`](plugin/skills/scaffolding/SKILL.md) | +3 | -3 |
| [`plugin/skills/spec-index/SKILL.md`](plugin/skills/spec-index/SKILL.md) | +7 | -7 |
| [`plugin/skills/spec-writing/resources/frontmatter-validation.md`](plugin/skills/spec-writing/resources/frontmatter-validation.md) | +1 | -1 |
| [`plugin/skills/workflow-state/resources/internal-api.md`](plugin/skills/workflow-state/resources/internal-api.md) | +2 | -2 |
| [`tests/src/tests/unit/standards/cli-invocation-audit.test.ts`](tests/src/tests/unit/standards/cli-invocation-audit.test.ts) | +155 | -0 |
| [`tests/src/tests/unit/commands/permissions/configure.test.ts`](tests/src/tests/unit/commands/permissions/configure.test.ts) | +94 | -0 |
| [`plugin/.claude-plugin/plugin.json`](plugin/.claude-plugin/plugin.json) | +1 | -1 |
| [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) | +1 | -1 |
| [`changelog/v6.md`](changelog/v6.md) | +21 | -0 |

---

## 1. [`plugin/system/system-run.sh`](plugin/system/system-run.sh)

Self-locate plugin root from script path instead of relying on `CLAUDE_PLUGIN_ROOT` env var.

```diff
 #!/bin/bash
 # system-run.sh - Single entry point for all prompt-to-CLI invocations
 # Used by skills, agents, and commands. Hooks use hook-runner.sh instead.
-exec node --enable-source-maps "${CLAUDE_PLUGIN_ROOT}/system/dist/cli.js" "$@"
+SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
+PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
+exec node --enable-source-maps "$PLUGIN_ROOT/system/dist/cli.js" "$@"
```

---

## 2. [`plugin/hooks/hook-runner.sh`](plugin/hooks/hook-runner.sh)

Same self-location fix as system-run.sh.

```diff
 #!/bin/bash
 # hook-runner.sh - Single entry point for all SDD hooks
 # Passes hook name and stdin to the TypeScript CLI
-exec node --enable-source-maps "${CLAUDE_PLUGIN_ROOT}/system/dist/cli.js" hook "$@"
+SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
+PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
+exec node --enable-source-maps "$PLUGIN_ROOT/system/dist/cli.js" hook "$@"
```

---

## 3. [`plugin/system/src/commands/permissions/configure.ts`](plugin/system/src/commands/permissions/configure.ts)

Fall back to `process.cwd()` when `findProjectRoot()` returns not-found.

```diff
 export const configurePermissions = async (): Promise<CommandResult> => {
   // Find project root
   const projectRootResult: ProjectRootResult = await findProjectRoot();
-  if (!projectRootResult.found) {
-    return {
-      success: false,
-      error:
-        'No SDD project found. Run this command from within an SDD project directory, or run /sdd-init first.',
-    };
-  }
-  const projectRoot = projectRootResult.path;
+  const projectRoot = projectRootResult.found ? projectRootResult.path : process.cwd();
```

---

## 4. [`.claude/skills/system-cli-standards/skill.md`](.claude/skills/system-cli-standards/skill.md)

Update canonical invocation to `<plugin-root>` notation, add Command Existence Rule section.

```diff
-"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" <namespace> <action> [args] [options]
+<plugin-root>/system/system-run.sh <namespace> <action> [args] [options]

-- `CLAUDE_PLUGIN_ROOT` is set by Claude Code when the plugin loads. It is available in all bash commands executed during a plugin session.
-- Always quote the path: `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh"` — paths may contain spaces.
-- `system-run.sh` is the single entry point. It forwards to the compiled CLI via `exec`.
+- `<plugin-root>` is a placeholder that the agent resolves from its Claude Code plugin context. It is NOT shell syntax — the agent substitutes the actual absolute path before constructing the bash command.
+- `system-run.sh` is the single entry point. It self-locates the plugin root from its own filesystem path and forwards to the compiled CLI via `exec`.
```

New section added:

```diff
+## Command Existence Rule
+
+Every `system-run.sh <namespace> <action>` reference in a prompt file must correspond to a command that actually exists in the CLI registry.
+
+**Source of truth:** Each namespace has a `schema.ts` at `plugin/system/src/commands/<namespace>/schema.ts` exporting an `ACTIONS` array.
+
+**Enforcement:** The `cli-invocation-audit.test.ts` test scans all `.md` files under `plugin/` for `system-run.sh <namespace> <action>` patterns and validates each pair against the CLI's actual command registry.
```

---

## 5. [`.claude/skills/commands-standards/SKILL.md`](.claude/skills/commands-standards/SKILL.md)

Update execution wrapper reference.

```diff
-1. **Use `sdd-system` by name** — Always reference the CLI as `sdd-system`, not by its file path. The execution wrapper (`node --enable-source-maps "${CLAUDE_PLUGIN_ROOT}/system/dist/cli.js"`) should appear at most once in the command, in an `## Execution` section.
+1. **Use `sdd-system` by name** — Always reference the CLI as `sdd-system`, not by its file path. The execution wrapper (`node --enable-source-maps "<plugin-root>/system/dist/cli.js"`) should appear at most once in the command, in an `## Execution` section.
```

---

## 6. [`plugin/commands/sdd-init.md`](plugin/commands/sdd-init.md)

11 occurrences across 3 categories: CLI invocations (A), path references (B), and explanatory text rewrites (C).

```diff
-3. Read current plugin version from `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json` → `version` field
+3. Read current plugin version from `<plugin-root>/.claude-plugin/plugin.json` → `version` field
 4. If versions differ:
-   - Run `npm install` in `${CLAUDE_PLUGIN_ROOT}/system/`
-   - Run `npm run build` in `${CLAUDE_PLUGIN_ROOT}/system/`
+   - Run `npm install` in `<plugin-root>/system/`
+   - Run `npm run build` in `<plugin-root>/system/`

-This must pass before any other checks. The plugin's absolute path is available via `${CLAUDE_PLUGIN_ROOT}` (set by Claude when the plugin loads).
+This must pass before any other checks. The agent knows the plugin's absolute path from its Claude Code plugin context.

-1. Check `${CLAUDE_PLUGIN_ROOT}`. If set, use it as the plugin path. If not set, fall back to searching...
+1. Use the known plugin path from your plugin context. If the plugin path cannot be determined, fall back to searching...

-   - `${CLAUDE_PLUGIN_ROOT}/system/dist/` exists (plugin built)
-   - `${CLAUDE_PLUGIN_ROOT}/system/node_modules/` exists (dependencies installed)
+   - `<plugin-root>/system/dist/` exists (plugin built)
+   - `<plugin-root>/system/node_modules/` exists (dependencies installed)

-5. If `dist/` missing but `system/package.json` exists: run `npm install && npm run build` in `${CLAUDE_PLUGIN_ROOT}/system/`
+5. If `dist/` missing but `system/package.json` exists: run `npm install && npm run build` in `<plugin-root>/system/`

-Run `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" env check-tools --json`
+Run `<plugin-root>/system/system-run.sh env check-tools --json`

-Run `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" permissions configure`
+Run `<plugin-root>/system/system-run.sh permissions configure`

-1. Run `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" settings reconcile`
+1. Run `<plugin-root>/system/system-run.sh settings reconcile`
```

---

## 7. [`plugin/commands/sdd-version.md`](plugin/commands/sdd-version.md)

Precondition and path reference updates.

```diff
-- `${CLAUDE_PLUGIN_ROOT}` is set (plugin is loaded)
+- Plugin is loaded (agent has access to plugin root path)

-1. Read the installed plugin version from `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json` → `version` field
+1. Read the installed plugin version from `<plugin-root>/.claude-plugin/plugin.json` → `version` field
```

---

## 8. [`plugin/commands/sdd-run.md`](plugin/commands/sdd-run.md)

CLI invocation and explanatory text.

```diff
-"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" <namespace> <action> [args] [options]
+<plugin-root>/system/system-run.sh <namespace> <action> [args] [options]

-Where `CLAUDE_PLUGIN_ROOT` is the path to the SDD plugin directory.
+Where `<plugin-root>` is the plugin's absolute path, resolved by the agent from its Claude Code plugin context.
```

---

## 9. [`plugin/commands/sdd-config.md`](plugin/commands/sdd-config.md)

4 CLI invocation replacements (generate, validate, diff, add-env).

```diff
-"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" config generate --env <env> [--component <name>] [--output <path>]
-"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" config validate [--env <env>]
-"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" config diff <env1> <env2>
-"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" config add-env <env-name>
+<plugin-root>/system/system-run.sh config generate --env <env> [--component <name>] [--output <path>]
+<plugin-root>/system/system-run.sh config validate [--env <env>]
+<plugin-root>/system/system-run.sh config diff <env1> <env2>
+<plugin-root>/system/system-run.sh config add-env <env-name>
```

---

## 10. [`plugin/commands/sdd-change.md`](plugin/commands/sdd-change.md)

2 CLI invocation replacements (archive store, workflow regression).

```diff
-"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" archive store --source <spec-path> --type external-spec --json
+<plugin-root>/system/system-run.sh archive store --source <spec-path> --type external-spec --json

-"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" archive store --source <prepared-dir> --type workflow-regression --json
+<plugin-root>/system/system-run.sh archive store --source <prepared-dir> --type workflow-regression --json
```

---

## 11. [`plugin/hooks/PERMISSIONS.md`](plugin/hooks/PERMISSIONS.md)

2 hook testing example replacements.

```diff
-   echo '...' | ${CLAUDE_PLUGIN_ROOT}/hooks/validate-sdd-writes.sh
+   echo '...' | <plugin-root>/hooks/validate-sdd-writes.sh

-   echo '...' | ${CLAUDE_PLUGIN_ROOT}/hooks/prompt-commit-after-write.sh
+   echo '...' | <plugin-root>/hooks/prompt-commit-after-write.sh
```

---

## 12. [`plugin/agents/api-designer.md`](plugin/agents/api-designer.md)

1 CLI invocation replacement.

```diff
-"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" contract generate-types <component-name>
+<plugin-root>/system/system-run.sh contract generate-types <component-name>
```

---

## 13-27. Skill files (15 files — mechanical Category A replacement)

All 15 skill files had identical `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh"` → `<plugin-root>/system/system-run.sh` replacements. Each file's diff shows only this pattern change. Files:

- `plugin/skills/components/backend/backend-scaffolding/SKILL.md` (1 occurrence)
- `plugin/skills/components/config/config-scaffolding/SKILL.md` (1)
- `plugin/skills/components/contract/contract-scaffolding/SKILL.md` (3)
- `plugin/skills/components/contract/contract-standards/SKILL.md` (4)
- `plugin/skills/components/database/database-scaffolding/SKILL.md` (8)
- `plugin/skills/components/database/database-standards/SKILL.md` (9)
- `plugin/skills/components/frontend/frontend-scaffolding/SKILL.md` (1)
- `plugin/skills/components/helm/helm-scaffolding/SKILL.md` (2)
- `plugin/skills/components/helm/helm-standards/SKILL.md` (1)
- `plugin/skills/domain-population/SKILL.md` (1)
- `plugin/skills/external-spec-integration/resources/workflow-steps.md` (1)
- `plugin/skills/scaffolding/SKILL.md` (3)
- `plugin/skills/spec-index/SKILL.md` (7)
- `plugin/skills/spec-writing/resources/frontmatter-validation.md` (1)
- `plugin/skills/workflow-state/resources/internal-api.md` (2)

Representative diff (all follow this pattern):

```diff
-"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding apply --spec spec.json
+<plugin-root>/system/system-run.sh scaffolding apply --spec spec.json
```

---

## 28. [`tests/src/tests/unit/standards/cli-invocation-audit.test.ts`](tests/src/tests/unit/standards/cli-invocation-audit.test.ts)

New test file — validates all CLI references in prompt files against the actual command registry, plus regression tests for `${CLAUDE_PLUGIN_ROOT}` and shell script self-location.

```typescript
/**
 * Unit Tests: CLI Invocation Audit
 *
 * WHY: Ensures all prompt files (.md) under plugin/ reference CLI commands
 * that actually exist, and that no prompt files use the broken
 * ${CLAUDE_PLUGIN_ROOT} notation (replaced with <plugin-root>).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { PLUGIN_DIR, REPO_ROOT } from '@/lib';

const SYSTEM_SRC = join(PLUGIN_DIR, 'system', 'src');
const COMMANDS_DIR = join(SYSTEM_SRC, 'commands');

const walkFiles = (dir: string, predicate: (name: string) => boolean): readonly string[] => {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      return walkFiles(fullPath, predicate);
    }
    if (entry.isFile() && predicate(entry.name)) {
      return [fullPath];
    }
    return [];
  });
};

const buildCommandRegistry = (): ReadonlyMap<string, readonly string[]> => {
  const namespaces = readdirSync(COMMANDS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const registry = new Map<string, readonly string[]>();

  for (const ns of namespaces) {
    const schemaPath = join(COMMANDS_DIR, ns, 'schema.ts');
    try {
      const content = readFileSync(schemaPath, 'utf-8');
      const match = content.match(/ACTIONS\s*=\s*\[([^\]]+)\]/);
      if (match) {
        const actions = match[1]
          .split(',')
          .map((s) => s.trim().replace(/['"]/g, ''))
          .filter((s) => s.length > 0);
        registry.set(ns, actions);
      }
    } catch {
      // No schema.ts for this namespace — skip
    }
  }

  return registry;
};

const findCliReferences = (
  mdFiles: readonly string[]
): readonly { readonly file: string; readonly line: number; readonly namespace: string; readonly action: string }[] => {
  const references: { readonly file: string; readonly line: number; readonly namespace: string; readonly action: string }[] = [];
  const pattern = /system-run\.sh\s+(\w+)\s+(\w[\w-]*)/g;

  for (const file of mdFiles) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((lineContent, idx) => {
      let match: RegExpExecArray | null;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(lineContent)) !== null) {
        references.push({
          file: relative(REPO_ROOT, file),
          line: idx + 1,
          namespace: match[1],
          action: match[2],
        });
      }
    });
  }

  return references;
};

describe('CLI Invocation Audit', () => {
  const allMdFiles = walkFiles(PLUGIN_DIR, (name) => name.endsWith('.md'));
  const registry = buildCommandRegistry();

  it('all prompt CLI references match existing commands', () => { /* ... */ });
  it('no prompt files use ${CLAUDE_PLUGIN_ROOT} in invocation or path contexts', () => { /* ... */ });
  it('system-run.sh does not reference CLAUDE_PLUGIN_ROOT', () => { /* ... */ });
  it('hook-runner.sh does not reference CLAUDE_PLUGIN_ROOT', () => { /* ... */ });
});
```

---

## 29. [`tests/src/tests/unit/commands/permissions/configure.test.ts`](tests/src/tests/unit/commands/permissions/configure.test.ts)

New test file — verifies permissions configure works in empty directories (cwd fallback), with project root markers, and creates `.claude` directory when missing.

```typescript
/**
 * Unit Tests: Permissions Configure Command
 *
 * WHY: The permissions configure command must work in directories without
 * an existing SDD project (e.g., during sdd-init before structure is created).
 * It should fall back to cwd when no project root markers are found.
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rmdir, fileExists, PLUGIN_DIR } from '@/lib';
import { runCommand } from '@/lib';
import { join } from 'node:path';

const CLI_PATH = join(PLUGIN_DIR, 'system', 'dist', 'cli.js');

type ConfigureResult = {
  readonly success: boolean;
  readonly message?: string;
  readonly error?: string;
  readonly data?: {
    readonly settingsPath: string;
    readonly backupPath: string | null;
    readonly permissionsAdded: number;
  };
};

const runPermissionsConfigure = async (
  cwd: string,
): Promise<{ readonly result: ConfigureResult; readonly code: number }> => {
  const cmdResult = await runCommand('node', ['--enable-source-maps', CLI_PATH, 'permissions', 'configure', '--json'], {
    cwd,
    timeout: 30000,
  });
  const result = (() => {
    try {
      return JSON.parse(cmdResult.stdout) as ConfigureResult;
    } catch {
      return { success: false, error: cmdResult.stderr || cmdResult.stdout } as ConfigureResult;
    }
  })();
  return { result, code: cmdResult.exitCode };
};

describe('Permissions Configure Command', () => {
  let testDir: string;

  beforeEach(async () => { testDir = await mkdtemp('sdd-permissions-configure-'); });
  afterEach(async () => { await rmdir(testDir, { recursive: true }); });

  it('falls back to cwd when no project root markers exist', async () => { /* ... */ });
  it('still uses project root when found', async () => { /* ... */ });
  it('creates .claude directory when missing', async () => { /* ... */ });
});
```

---

## 30. [`plugin/.claude-plugin/plugin.json`](plugin/.claude-plugin/plugin.json)

Version bump 6.9.2 → 6.9.3.

```diff
-  "version": "6.9.2",
+  "version": "6.9.3",
```

---

## 31. [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json)

Version bump 6.9.2 → 6.9.3.

```diff
-      "version": "6.9.2"
+      "version": "6.9.3"
```

---

## 32. [`changelog/v6.md`](changelog/v6.md)

Added 6.9.3 entry with Fixed, Added, and Rationale sections.

```diff
+## [6.9.3] - 2026-02-14
+
+### Fixed
+
+- **system-cli**: Shell scripts (`system-run.sh`, `hook-runner.sh`) self-locate plugin root from filesystem path instead of relying on `CLAUDE_PLUGIN_ROOT` env var
+- **prompt-files**: Replace `${CLAUDE_PLUGIN_ROOT}` notation with `<plugin-root>` across 22 prompt files — prevents agent from passing unresolved Bash variable to shell
+- **permissions**: `configurePermissions()` falls back to `cwd` when no SDD project root found, fixing failure during `sdd-init` before project structure exists
+- **standards**: Add Command Existence Rule to `system-cli-standards` requiring all CLI references in prompt files to match actual commands
+
+### Added
+
+- **tests**: CLI invocation audit test validates all `system-run.sh` references against actual command registry
+- **tests**: Regression test prevents re-introduction of `${CLAUDE_PLUGIN_ROOT}` in prompt files
+- **tests**: Permissions configure fallback tests for empty directories
+
+### Rationale
+
+The `${CLAUDE_PLUGIN_ROOT}` notation in prompt files caused the agent to treat it as a Bash variable and pass it literally to the shell, where it was unset. The agent would self-recover but wasted tool calls. The `<plugin-root>` angle-bracket notation signals to the agent that it must resolve the placeholder itself from its plugin context.
```
