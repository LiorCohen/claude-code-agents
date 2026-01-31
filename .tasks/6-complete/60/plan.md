---
task_id: 60
title: Standardize TypeScript imports and tsconfig
status: complete
created: 2026-01-30
completed: 2026-01-30
version: v5.4.0
---

# Plan: Standardize TypeScript Imports and tsconfig (Task 60) ✓

## Problem Summary

1. Plugin system uses `NodeNext` with `.js` extensions; user wants no extensions ever
2. Long relative imports (`../../../lib/foo`) are hard to read and maintain
3. Two typescript-standards files exist and are out of sync
4. No automated test to enforce TypeScript standards compliance

## Research: Import Alias Options

Two main approaches exist for project-root-relative imports:

### Option A: TypeScript `paths` (tsconfig.json)
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```
- **Prefix**: `@/`, `~/`, or custom
- **Extensions**: Not needed with `moduleResolution: "Bundler"`
- **Runtime**: Requires tooling support (tsx ✓, vitest ✓, Vite ✓)
- **Caveat**: Only affects type resolution; runtime tools must also support it

### Option B: Node.js Subpath Imports (package.json)
```json
{
  "imports": {
    "#lib/*": "./src/lib/*.js"
  }
}
```
- **Prefix**: `#` (required by Node.js spec)
- **Extensions**: Technically needed in mapped paths for strict ESM
- **Runtime**: Native Node.js 12.19+, TypeScript 5.4+
- **Caveat**: Less flexible, requires `#` prefix

### Decision: TypeScript `paths` with `@/` prefix

This project uses `tsx` and `vitest`, both of which natively respect tsconfig.json `paths`. The `@/` prefix is the most common convention and doesn't require extensions.

**Import style:**
```typescript
// Before
import { createLogger } from '../../../lib/logger.js';

// After
import { createLogger } from '@/lib/logger';
```

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/system/tsconfig.json` | Change to `Bundler`, add `paths` |
| `plugin/system/src/**/*.ts` | Remove `.js`, use `@/` aliases |
| `tests/tsconfig.json` | Add `paths` |
| `tests/src/**/*.ts` | Use `@/` aliases |
| `plugin/skills/typescript-standards/SKILL.md` | Add import rules |
| `.claude/skills/typescript-standards/SKILL.md` | Sync with plugin version |
| `plugin/skills/frontend-scaffolding/templates/tsconfig.json` | Standardize settings |
| `tests/src/tests/unit/standards/typescript-standards.test.ts` | NEW: Conformance test |

## Implementation

### Phase 1: Update Plugin System tsconfig

Update `plugin/system/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "lib": ["ES2022"],
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### Phase 2: Update Tests tsconfig

Update `tests/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    // ... rest stays the same
  }
}
```

### Phase 3: Update Plugin System Imports

For each file in `plugin/system/src/`:
1. Remove `.js` extensions from all imports
2. Replace deep relative imports with `@/` aliases

**Rules:**
- Same directory: `./validate` (relative)
- Parent directory: `../types` (relative)
- 2+ levels up: `@/lib/logger` (alias)

**Examples:**
```typescript
// cli.ts
// Before
import { parseArgs } from './lib/args.js';
import { createLogger } from './lib/logger.js';

// After
import { parseArgs } from '@/lib/args';
import { createLogger } from '@/lib/logger';

// commands/spec/generate.ts
// Before
import { loadConfig } from '../../lib/config.js';

// After
import { loadConfig } from '@/lib/config';
```

### Phase 4: Update Test Imports

For each file in `tests/src/`:
```typescript
// Before
import { readFile, writeFile } from '../../../lib';

// After
import { readFile, writeFile } from '@/lib';
```

### Phase 5: Update typescript-standards Skill

Add to `plugin/skills/typescript-standards/SKILL.md` after "Import Through index.ts Only":

```markdown
### No File Extensions in Imports

**CRITICAL:** Never include file extensions in import statements.

```typescript
// ✅ GOOD: No extensions
import { createUser } from './user';
import { config } from '@/lib/config';

// ❌ BAD: Extensions in imports
import { createUser } from './user.js';    // NEVER
import { Component } from './Component.tsx'; // NEVER
```

### Path Aliases for Deep Imports

**CRITICAL:** Use `@/` path alias instead of long relative paths.

```typescript
// ✅ GOOD: Path alias for deep imports
import { createLogger } from '@/lib/logger';
import { parseArgs } from '@/lib/args';
import { handleSpec } from '@/commands/spec';

// ❌ BAD: Deep relative imports
import { createLogger } from '../../../lib/logger';  // NEVER
import { parseArgs } from '../../lib/args';          // NEVER
```

**When to use path aliases:**
- Crossing 2+ directory levels → use `@/`
- Same directory or parent → relative is fine

```typescript
// ✅ GOOD: Relative for nearby files
import { validate } from './validate';
import { types } from '../types';

// ✅ GOOD: Alias for distant files
import { logger } from '@/lib/logger';
```

**tsconfig.json setup:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```
```

Update Summary Checklist:
```markdown
- [ ] **No file extensions in imports** - never `.js`, `.ts`, `.tsx`
- [ ] **Path aliases for deep imports** - use `@/` instead of `../../../`
```

### Phase 6: Sync .claude/skills with Plugin Version

Copy `plugin/skills/typescript-standards/SKILL.md` → `.claude/skills/typescript-standards/SKILL.md`

Both files must be identical. The plugin version is canonical.

### Phase 7: Standardize Frontend Template tsconfig

Update `plugin/skills/frontend-scaffolding/templates/tsconfig.json`:
- Change target `ES2020` → `ES2022`
- Add explicit strict sub-options
- Add `@/` path alias pattern

### Phase 8: Add TypeScript Standards Conformance Test

Create `tests/src/tests/unit/standards/typescript-standards.test.ts`:

```typescript
/**
 * Unit Tests: TypeScript Standards Conformance
 *
 * WHY: Ensures all TypeScript code in the repo follows the documented
 * typescript-standards skill. Catches violations before they're committed.
 */

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT_DIR = join(__dirname, '../../../../..');
const PLUGIN_SRC = join(ROOT_DIR, 'plugin/system/src');
const TESTS_SRC = join(ROOT_DIR, 'tests/src');

const walkTs = (dir: string): readonly string[] => {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      return walkTs(fullPath);
    }
    if (entry.isFile() && entry.name.endsWith('.ts')) {
      return [fullPath];
    }
    return [];
  });
};

describe('TypeScript Standards Conformance', () => {
  const allTsFiles = [...walkTs(PLUGIN_SRC), ...walkTs(TESTS_SRC)];

  describe('No file extensions in imports', () => {
    it('no .js extensions in import statements', () => {
      const violations: readonly string[] = [];

      for (const file of allTsFiles) {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (line.match(/^\s*(import|export).*from\s+['"].*\.js['"]/)) {
            violations.push(`${relative(ROOT_DIR, file)}:${idx + 1}`);
          }
        });
      }

      expect(violations, `Files with .js imports:\n${violations.join('\n')}`).toHaveLength(0);
    });

    it('no .ts extensions in import statements', () => {
      const violations: readonly string[] = [];

      for (const file of allTsFiles) {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (line.match(/^\s*(import|export).*from\s+['"].*\.ts['"]/)) {
            violations.push(`${relative(ROOT_DIR, file)}:${idx + 1}`);
          }
        });
      }

      expect(violations, `Files with .ts imports:\n${violations.join('\n')}`).toHaveLength(0);
    });
  });

  describe('No deep relative imports', () => {
    it('no imports with 3+ levels of ../)', () => {
      const violations: readonly string[] = [];

      for (const file of allTsFiles) {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          // Match imports with 3 or more ../
          if (line.match(/^\s*(import|export).*from\s+['"]\.\.\/\.\.\/\.\.\//)) {
            violations.push(`${relative(ROOT_DIR, file)}:${idx + 1}: ${line.trim()}`);
          }
        });
      }

      expect(violations, `Deep relative imports (use @/ alias):\n${violations.join('\n')}`).toHaveLength(0);
    });
  });

  describe('typescript-standards skill sync', () => {
    it('.claude and plugin versions are identical', () => {
      const claudeVersion = readFileSync(
        join(ROOT_DIR, '.claude/skills/typescript-standards/SKILL.md'),
        'utf-8'
      );
      const pluginVersion = readFileSync(
        join(ROOT_DIR, 'plugin/skills/typescript-standards/SKILL.md'),
        'utf-8'
      );

      expect(claudeVersion).toBe(pluginVersion);
    });
  });

  describe('No default exports', () => {
    it('no export default statements', () => {
      const violations: readonly string[] = [];

      for (const file of allTsFiles) {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (line.match(/^\s*export\s+default\b/)) {
            violations.push(`${relative(ROOT_DIR, file)}:${idx + 1}`);
          }
        });
      }

      expect(violations, `Files with default exports:\n${violations.join('\n')}`).toHaveLength(0);
    });
  });

  describe('No CommonJS', () => {
    it('no require() calls', () => {
      const violations: readonly string[] = [];

      for (const file of allTsFiles) {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (line.match(/[^\/]\brequire\s*\(/) && !line.trim().startsWith('//')) {
            violations.push(`${relative(ROOT_DIR, file)}:${idx + 1}`);
          }
        });
      }

      expect(violations, `Files with require():\n${violations.join('\n')}`).toHaveLength(0);
    });

    it('no module.exports', () => {
      const violations: readonly string[] = [];

      for (const file of allTsFiles) {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (line.match(/\bmodule\.exports\b/) && !line.trim().startsWith('//')) {
            violations.push(`${relative(ROOT_DIR, file)}:${idx + 1}`);
          }
        });
      }

      expect(violations, `Files with module.exports:\n${violations.join('\n')}`).toHaveLength(0);
    });
  });
});
```

## Verification

1. **Phase 1-2:** `npx tsc --noEmit` in both dirs - should compile
2. **Phase 3-4:** Grep for `.js'` and `../../../` - should find nothing
3. **Phase 5-6:** Diff skill files - should be identical
4. **Phase 7:** Validate frontend template compiles
5. **Phase 8:** Run conformance test - all pass

## Sources

- [TypeScript TSConfig paths](https://www.typescriptlang.org/tsconfig/paths.html)
- [TypeScript moduleResolution: bundler](https://www.typescriptlang.org/tsconfig/moduleResolution.html)
- [Using subpath imports and path aliases](https://webpro.nl/articles/using-subpath-imports-and-path-aliases)
- [Node.js Packages Documentation](https://nodejs.org/api/packages.html)
