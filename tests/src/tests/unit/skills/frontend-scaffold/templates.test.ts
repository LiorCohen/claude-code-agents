/**
 * Frontend Scaffold Template Tests
 *
 * WHY: Validates that frontend templates align with the documented
 * Radix/Shadcn stack, enforce pinned deps, and barrel-only index files.
 */

import { describe, expect, it } from 'vitest';
import { SKILLS_DIR, joinPath, fileExists, dirExists, readFile } from '@/lib';

const TEMPLATES_DIR = joinPath(SKILLS_DIR, 'components', 'frontend', 'frontend-scaffolding', 'templates');

/**
 * WHY: Unpinned dependency versions cause non-reproducible builds.
 * Every version string must be exact (no ^, ~, or "latest").
 */
describe('package.json all deps pinned', () => {
  it('has no ^, ~, or latest in any dependency version', () => {
    /** WHY: Floating versions let transitive breakage slip in silently. */
    const pkg = JSON.parse(readFile(joinPath(TEMPLATES_DIR, 'package.json'))) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const allDeps: Record<string, string> = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    for (const [name, version] of Object.entries(allDeps)) {
      if (version === 'workspace:*') continue;
      expect(version, `${name} has unpinned version "${version}"`).not.toMatch(/^[\^~]/);
      expect(version, `${name} uses "latest"`).not.toBe('latest');
    }
  });
});

/**
 * WHY: The documented stack mandates specific libraries. Missing any means
 * the scaffold is incomplete; having removed ones means legacy baggage.
 */
describe('package.json has required deps', () => {
  it('includes every required dependency', () => {
    /** WHY: Each library is part of the agreed Radix/TanStack/Tailwind stack. */
    const pkg = JSON.parse(readFile(joinPath(TEMPLATES_DIR, 'package.json'))) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const allDeps: Record<string, string> = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    const required = [
      '@radix-ui/react-slot',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      '@tanstack/react-query',
      '@tanstack/react-router',
      '@tanstack/react-form',
      '@tanstack/react-table',
      'react',
      'react-dom',
      'radix-ui',
      'eslint',
      'typescript-eslint',
      'typescript',
      'vite',
    ];

    for (const dep of required) {
      expect(allDeps, `missing required dependency: ${dep}`).toHaveProperty(dep);
    }
  });

  it('does not include removed dependencies', () => {
    /** WHY: Legacy deps conflict with the new unified typescript-eslint package. */
    const pkg = JSON.parse(readFile(joinPath(TEMPLATES_DIR, 'package.json'))) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const allDeps: Record<string, string> = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    const forbidden = ['zustand', '@typescript-eslint/eslint-plugin', '@typescript-eslint/parser'];

    for (const dep of forbidden) {
      expect(allDeps, `forbidden dependency present: ${dep}`).not.toHaveProperty(dep);
    }
  });
});

/**
 * WHY: The old split @typescript-eslint packages were replaced by the
 * unified typescript-eslint package. Keeping both causes conflicts.
 */
describe('package.json no removed deps', () => {
  it('does not contain legacy @typescript-eslint split packages', () => {
    /** WHY: Dual presence of old + new eslint packages causes rule collisions. */
    const pkg = JSON.parse(readFile(joinPath(TEMPLATES_DIR, 'package.json'))) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const allDeps: Record<string, string> = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    expect(allDeps).not.toHaveProperty('@typescript-eslint/eslint-plugin');
    expect(allDeps).not.toHaveProperty('@typescript-eslint/parser');
  });
});

/**
 * WHY: Vite must serve from src/ so index.html lives alongside app code.
 * Without root:'src', Vite looks for index.html in the wrong place.
 */
describe('vite config root is src', () => {
  it('contains root: "src"', () => {
    /** WHY: Ensures Vite resolves index.html from the src directory. */
    const content = readFile(joinPath(TEMPLATES_DIR, 'vite.config.ts'));
    expect(content).toContain("root: 'src'");
  });
});

/**
 * WHY: Path aliases let templates use @/ imports, keeping import paths
 * short and refactor-safe. import.meta.dirname replaces __dirname in ESM.
 */
describe('vite config has alias', () => {
  it('configures resolve alias with import.meta.dirname', () => {
    /** WHY: Without alias config, @/ imports fail at build time. */
    const content = readFile(joinPath(TEMPLATES_DIR, 'vite.config.ts'));
    expect(content).toContain('resolve');
    expect(content).toContain('alias');
    expect(content).toContain('import.meta.dirname');
  });
});

/**
 * WHY: The plan removed several legacy directories that no longer belong
 * in the frontend scaffold. Their presence means cleanup was incomplete.
 */
describe('no deleted directories', () => {
  it('does not contain removed directories', () => {
    /** WHY: Each of these was replaced by the new Radix/TanStack structure. */
    const removed = ['api', 'viewmodels', 'models', 'stores', 'utils'];

    for (const dir of removed) {
      const dirPath = joinPath(TEMPLATES_DIR, dir);
      expect(dirExists(dirPath), `deleted directory still exists: ${dir}/`).toBe(false);

      const srcDirPath = joinPath(TEMPLATES_DIR, 'src', dir);
      expect(dirExists(srcDirPath), `deleted directory still exists: src/${dir}/`).toBe(false);
    }
  });
});

/**
 * WHY: Barrel files must re-export only. Executable code in barrels
 * causes side-effects on import and defeats tree-shaking.
 */
describe('barrel files are pure exports', () => {
  it('every index.ts contains only import/export statements', () => {
    /** WHY: Side-effects in barrels break tree-shaking and cause hidden init bugs. */
    const barrelFiles = [
      'src/components/index.ts',
      'src/components/layout/index.ts',
      'src/components/sidebar/index.ts',
      'src/components/ui/index.ts',
      'src/hooks/index.ts',
      'src/lib/index.ts',
      'src/pages/index.ts',
      'src/pages/home_page/index.ts',
      'src/routes/index.ts',
      'src/services/index.ts',
      'src/types/index.ts',
    ];

    for (const relPath of barrelFiles) {
      const fullPath = joinPath(TEMPLATES_DIR, relPath);
      expect(fileExists(fullPath), `barrel file missing: ${relPath}`).toBe(true);

      const content = readFile(fullPath);
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          continue;
        }
        const isImportOrExport = trimmed.startsWith('import ') || trimmed.startsWith('export ');
        expect(isImportOrExport, `${relPath} has non-export line: "${trimmed}"`).toBe(true);
      }
    }
  });
});

/**
 * WHY: ESLint config is required for the flat-config format used by
 * eslint 9+ and typescript-eslint. Without it, linting does not work.
 */
describe('eslint config exists', () => {
  it('eslint.config.js exists in templates dir', () => {
    /** WHY: eslint 9 requires eslint.config.js (flat config). */
    expect(fileExists(joinPath(TEMPLATES_DIR, 'eslint.config.js'))).toBe(true);
  });
});

/**
 * WHY: components.json is the Shadcn/ui configuration file that tells
 * the CLI where to put generated components and how to resolve aliases.
 */
describe('components.json exists', () => {
  it('components.json exists in templates dir', () => {
    /** WHY: Without components.json, shadcn CLI cannot add new components. */
    expect(fileExists(joinPath(TEMPLATES_DIR, 'components.json'))).toBe(true);
  });
});

/**
 * WHY: index.html must live in src/ (not root) because vite is
 * configured with root:'src'. A root-level index.html would be stale.
 */
describe('index.html in src', () => {
  it('src/index.html exists', () => {
    /** WHY: Vite root is src/, so the entry HTML must be there. */
    expect(fileExists(joinPath(TEMPLATES_DIR, 'src', 'index.html'))).toBe(true);
  });

  it('root-level index.html does NOT exist', () => {
    /** WHY: A root index.html would shadow the real one and confuse Vite. */
    expect(fileExists(joinPath(TEMPLATES_DIR, 'index.html'))).toBe(false);
  });
});

/**
 * WHY: The Button component is the canonical Shadcn/ui primitive. It must
 * use Radix Slot for asChild composition to validate real Radix integration.
 */
describe('button uses Radix Slot', () => {
  it('imports Slot from @radix-ui/react-slot and uses asChild pattern', () => {
    /** WHY: asChild via Slot is the Radix composition model Shadcn depends on. */
    const buttonPath = joinPath(TEMPLATES_DIR, 'src', 'components', 'ui', 'button.tsx');
    const content = readFile(buttonPath);

    expect(content).toContain("from '@radix-ui/react-slot'");
    expect(content).toMatch(/Slot/);
    expect(content).toContain('asChild ? Slot');
  });
});

/**
 * WHY: Deep imports (e.g. @/components/ui/button) bypass barrels and
 * create tight coupling. Sub-barrel imports like @/components/sidebar
 * (2 segments) are fine — they resolve to a barrel index.ts. Only 3+
 * segments indicate a deep file import.
 */
describe('no deep imports', () => {
  it('no template file imports a deep @/ path (3+ segments)', () => {
    /** WHY: Barrel-only imports keep refactoring local to each directory group. */
    const sourceFiles = [
      'src/app.tsx',
      'src/main.tsx',
      'src/components/ui/button.tsx',
      'src/components/sidebar/sidebar.tsx',
      'src/components/layout/layout.tsx',
      'src/pages/home_page/home_page.tsx',
      'src/hooks/use_query_client.ts',
      'src/hooks/use_app_router.ts',
      'src/hooks/use_app_config.tsx',
      'src/routes/routes.tsx',
      'src/lib/utils.ts',
    ];

    const deepImportPattern = /from\s+['"]@\/([^'"]+)['"]/g;

    for (const relPath of sourceFiles) {
      const fullPath = joinPath(TEMPLATES_DIR, relPath);
      if (!fileExists(fullPath)) continue;

      const content = readFile(fullPath);
      let match: RegExpExecArray | null;

      while ((match = deepImportPattern.exec(content)) !== null) {
        const importPath = match[1]!;
        const segments = importPath.split('/');
        expect(
          segments.length,
          `${relPath} has deep import "@/${importPath}" (${segments.length} segments, max 2)`
        ).toBeLessThanOrEqual(2);
      }
    }
  });
});
