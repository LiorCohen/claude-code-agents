---
generated: 2026-02-12 12:00 UTC
branch: feature/task-82-reorganize-archive-sdd
commits: 1
---

# Task #82 — Changes

**Files changed:** 16 (+579 / -33 lines)

| File | Added | Removed |
|------|------:|--------:|
| [plugin/system/src/commands/archive/store.ts](plugin/system/src/commands/archive/store.ts) | +142 | -0 |
| [plugin/system/src/commands/archive/schema.ts](plugin/system/src/commands/archive/schema.ts) | +48 | -0 |
| [plugin/system/src/commands/archive/handler.ts](plugin/system/src/commands/archive/handler.ts) | +43 | -0 |
| [plugin/system/src/commands/archive/index.ts](plugin/system/src/commands/archive/index.ts) | +2 | -0 |
| [plugin/system/src/cli.ts](plugin/system/src/cli.ts) | +7 | -1 |
| [plugin/system/src/commands/scaffolding/project.ts](plugin/system/src/commands/scaffolding/project.ts) | +4 | -2 |
| [plugin/skills/external-spec-integration/SKILL.md](plugin/skills/external-spec-integration/SKILL.md) | +10 | -10 |
| [plugin/skills/external-spec-integration/schemas/output.schema.json](plugin/skills/external-spec-integration/schemas/output.schema.json) | +5 | -0 |
| [plugin/skills/workflow-state/SKILL.md](plugin/skills/workflow-state/SKILL.md) | +11 | -11 |
| [plugin/commands/sdd-change.md](plugin/commands/sdd-change.md) | +8 | -4 |
| [docs/external-specs.md](docs/external-specs.md) | +2 | -2 |
| [tests/src/tests/unit/commands/archive/store.test.ts](tests/src/tests/unit/commands/archive/store.test.ts) | +260 | -0 |
| [tests/src/tests/workflows/sdd-change-new-external.test.ts](tests/src/tests/workflows/sdd-change-new-external.test.ts) | +10 | -1 |
| [changelog/v6.md](changelog/v6.md) | +25 | -0 |
| [plugin/.claude-plugin/plugin.json](plugin/.claude-plugin/plugin.json) | +1 | -1 |
| [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json) | +1 | -1 |

---

## Detailed Changes

### NEW: plugin/system/src/commands/archive/store.ts (+142)

Core archive implementation. Three functions:
- `resolveProjectRoot(rootOverride?)` — uses explicit `--root` or auto-detects via `findProjectRoot()`
- `datetimePrefix()` — generates UTC `yyyymmdd-HHmm` prefix
- `storeArchive(source, archiveType, rootOverride?)` — entry point that dispatches to `storeFile` or `storeDirectory`

File archiving: lowercases name, preserves extension, copies to `.sdd/archive/<type>/yyyymmdd-HHmm-name.ext`.
Directory archiving: lowercases dir name, walks source, copies all files preserving structure.

Returns `CommandResult` with `data.archived_path` (relative to project root).

```diff
+import * as path from 'node:path';
+import type { CommandResult } from '@/lib/args';
+import { exists, isDirectory, copyFile, ensureDir, walkDir, basename, extname, joinPath, relativePath } from '@/lib/fs';
+import { findProjectRoot } from '@/lib/config';
+import { ARCHIVE_TYPE_DIRS, type ArchiveType } from './schema';
+
+const resolveProjectRoot = async (rootOverride?: string): Promise<string | undefined> => {
+  if (rootOverride) {
+    const resolved = path.resolve(rootOverride);
+    if (await exists(resolved)) return resolved;
+    return undefined;
+  }
+  const result = await findProjectRoot();
+  return result.found ? result.path : undefined;
+};
+
+const datetimePrefix = (now: Date = new Date()): string => {
+  const yyyy = now.getUTCFullYear().toString();
+  const mm = (now.getUTCMonth() + 1).toString().padStart(2, '0');
+  const dd = now.getUTCDate().toString().padStart(2, '0');
+  const hh = now.getUTCHours().toString().padStart(2, '0');
+  const min = now.getUTCMinutes().toString().padStart(2, '0');
+  return `${yyyy}${mm}${dd}-${hh}${min}`;
+};
+
+export const storeArchive = async (source: string, archiveType: ArchiveType, rootOverride?: string): Promise<CommandResult> => {
+  // Validates source exists, resolves project root, dispatches to storeFile or storeDirectory
+};
```

---

### NEW: plugin/system/src/commands/archive/schema.ts (+48)

Defines archive types and command schema:
- `ACTIONS`: `['store']`
- `ARCHIVE_TYPES`: `['external-spec', 'revised-spec', 'workflow-regression']`
- `ARCHIVE_TYPE_DIRS`: Maps singular types to plural directory names
- Schema: `action` (required), `source` (required), `type` (required), `root` (optional)

```diff
+export const ARCHIVE_TYPE_DIRS: Readonly<Record<ArchiveType, string>> = {
+  'external-spec': 'external-specs',
+  'revised-spec': 'revised-specs',
+  'workflow-regression': 'workflow-regressions',
+};
```

---

### NEW: plugin/system/src/commands/archive/handler.ts (+43)

Standard namespace handler pattern: parses `--source`, `--type`, `--root` via `parseNamedArgs`, validates with schema, dispatches to `storeArchive` via dynamic import.

---

### NEW: plugin/system/src/commands/archive/index.ts (+2)

Re-exports: `handleArchive`, `schema`, `ACTIONS`, `ARCHIVE_TYPE_DIRS`, `ArchiveArgs`, `ArchiveType`.

---

### plugin/system/src/cli.ts (+7 / -1)

Registered `archive` namespace:

```diff
+import { handleArchive } from '@/commands/archive';

-const NAMESPACES = ['scaffolding', 'spec', 'version', 'hook', 'database', 'contract', 'config', 'env', 'permissions', 'workflow', 'settings'] as const;
+const NAMESPACES = ['scaffolding', 'spec', 'version', 'hook', 'database', 'contract', 'config', 'env', 'permissions', 'workflow', 'settings', 'archive'] as const;

+  archive       Archive file management
+    store       Archive a file or directory to .sdd/archive/<type>/

+  archive: handleArchive,
```

---

### plugin/system/src/commands/scaffolding/project.ts (+4 / -2)

Updated `.claudeignore` and `gitkeepDirs` for `.sdd/archive/` structure:

```diff
-      content: 'archive/\n',
+      content: '.sdd/archive/\n',

-    'archive',
+    '.sdd/archive/external-specs',
+    '.sdd/archive/revised-specs',
+    '.sdd/archive/workflow-regressions',
```

---

### plugin/skills/external-spec-integration/SKILL.md (+10 / -10)

Replaced manual file copy instructions with system CLI invocation:

```diff
-1. Create archive directory: `.sdd/archive/external-specs/`
-2. Generate filename: `yyyymmdd-lowercased-original-name.md`
-3. Copy external spec to archive location
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" archive store --source <external-spec-path> --type external-spec --json
+The CLI handles datetime-prefix naming, directory creation, and lowercasing automatically.
```

Updated format references: `yyyymmdd-filename` → `yyyymmdd-HHmm-filename`.

---

### plugin/skills/external-spec-integration/schemas/output.schema.json (+5)

Added `archived_path` field to output schema:

```diff
+    "archived_path": {
+      "type": "string",
+      "description": "Relative path to the archived external spec in .sdd/archive/external-specs/"
+    },
```

Added to `required` array.

---

### plugin/skills/workflow-state/SKILL.md (+11 / -11)

Standardized all archive paths to datetime-prefix format and renamed `regressions/` → `workflow-regressions/`:

```diff
-│   │   └── 20260205-feature-spec.md  # yyyymmdd-lowercased-filename.md
+│   │   └── 20260205-1430-feature-spec.md  # yyyymmdd-HHmm-lowercased-filename.md

-│   └── regressions/            # Work archived during phase regression
-│       └── a1b2-1-impl-20260205/
+│   └── workflow-regressions/   # Work archived during phase regression
+│       └── 20260205-1430-a1b2-1-impl/

-# .sdd/archive/regressions/a1b2-1-impl-20260205/metadata.yaml
+# .sdd/archive/workflow-regressions/20260205-1430-a1b2-1-impl/metadata.yaml
```

Updated 6 additional path references throughout the file to use `workflow-regressions/` and datetime-prefix format. Replaced manual archive instructions with CLI invocation:

```diff
-Archives implementation to `.sdd/archive/regressions/`
+Archives implementation via system CLI: `archive store --source <prepared-dir> --type workflow-regression`
```

---

### plugin/commands/sdd-change.md (+8 / -4)

Updated Step 4 (archive external spec) and regression flow to use CLI:

```diff
-Copy to `.sdd/archive/external-specs/` with format: `yyyymmdd-lowercased-filename.md`
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" archive store --source <spec-path> --type external-spec --json

-2. Archive current state to `.sdd/archive/regressions/`
+2. Archive current state via system CLI: `archive store --source <prepared-dir> --type workflow-regression`
```

Standardized example paths to datetime-prefix format.

---

### docs/external-specs.md (+2 / -2)

Updated archive example to include time component:

```diff
-.sdd/archive/external-specs/20260205-feature-requirements.md
+.sdd/archive/external-specs/20260205-1430-feature-requirements.md
```

---

### NEW: tests/src/tests/unit/commands/archive/store.test.ts (+260)

11 unit tests covering:
- **File archiving** (5 tests): datetime prefix + lowercase, extension preservation, mixed-case lowering, directory auto-creation, result data structure
- **Directory archiving** (1 test): structure preservation, file count, lowercased dir name
- **Type mapping** (3 tests): `external-spec` → `external-specs/`, `revised-spec` → `revised-specs/`, `workflow-regression` → `workflow-regressions/`
- **Error handling** (2 tests): missing source path, invalid archive type

All tests use `--root` flag with temp directories for isolation from the main project.

---

### tests/src/tests/workflows/sdd-change-new-external.test.ts (+10 / -1)

Added archive file naming assertion after the `findFiles` helper declaration:

```diff
+    const archiveDir = joinPath(testProject.path, '.sdd', 'archive', 'external-specs');
+    const archiveFiles = await findFiles(archiveDir, '*.md');
+    if (archiveFiles.length > 0) {
+      const archivedName = archiveFiles[0]!.split('/').pop() ?? '';
+      expect(archivedName).toMatch(/^\d{8}-\d{4}-[a-z0-9-]+\.md$/);
+    }
```

---

### changelog/v6.md (+25)

Added `[6.8.0] - 2026-02-12` entry with Added (archive namespace) and Changed (scaffolding, skills, commands) sections.

---

### plugin/.claude-plugin/plugin.json, .claude-plugin/marketplace.json (+1 / -1 each)

Version bump: `6.7.4` → `6.8.0`
