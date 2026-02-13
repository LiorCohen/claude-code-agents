/**
 * Frontend Scaffold Standards Tests
 *
 * WHY: Validates that scaffold templates implement the correct architecture
 * (config injection, provider wiring, barrel exports) and that standards
 * resources are aligned with task decisions (no interface keyword, no
 * types/generated imports, no Zustand, correct version references).
 */

import { describe, expect, it } from 'vitest';
import { SKILLS_DIR, PLUGIN_DIR, joinPath, fileExists, readFile } from '@/lib';

const TEMPLATES_DIR = joinPath(
  SKILLS_DIR,
  'components',
  'frontend',
  'frontend-scaffolding',
  'templates',
);
const STANDARDS_DIR = joinPath(
  SKILLS_DIR,
  'components',
  'frontend',
  'frontend-standards',
);

/**
 * WHY: The App component must receive config as a prop and wrap children
 * in AppConfigProvider so all downstream components can access config
 * via useAppConfig(). Without this, config injection is broken.
 */
describe('App receives config prop', () => {
  const APP_PATH = joinPath(TEMPLATES_DIR, 'src', 'app.tsx');

  /** WHY: The template file must exist for the scaffold to produce it. */
  it('app.tsx template exists', () => {
    expect(fileExists(APP_PATH)).toBe(true);
  });

  /** WHY: App must declare a config prop so the mount function can pass it in. */
  it('declares config in props type', () => {
    const content = readFile(APP_PATH);
    expect(content).toMatch(/config/);
  });

  /** WHY: AppConfigProvider must wrap children so hooks can access config. */
  it('uses AppConfigProvider', () => {
    const content = readFile(APP_PATH);
    expect(content).toContain('AppConfigProvider');
  });

  /** WHY: Config value must be threaded through the provider. */
  it('passes config to provider', () => {
    const content = readFile(APP_PATH);
    const hasConfigProp =
      content.includes('config={config}') || content.includes('config: WebappConfig');
    expect(hasConfigProp).toBe(true);
  });
});

/**
 * WHY: main.tsx must validate config and elementId at runtime before
 * calling React render. Without validation, the app silently fails
 * or produces cryptic errors when the host page misconfigures it.
 */
describe('Main validates config', () => {
  const MAIN_PATH = joinPath(TEMPLATES_DIR, 'src', 'main.tsx');

  /** WHY: The template file must exist for the scaffold to produce it. */
  it('main.tsx template exists', () => {
    expect(fileExists(MAIN_PATH)).toBe(true);
  });

  /** WHY: Runtime guard must throw on invalid config so failures are explicit. */
  it('throws on invalid config', () => {
    const content = readFile(MAIN_PATH);
    expect(content).toContain('throw new Error');
  });

  /** WHY: Error messages must mention what went wrong for debuggability. */
  it('has error messages for elementId and config', () => {
    const content = readFile(MAIN_PATH);
    const mentionsElementId = content.includes('elementId') || content.includes('element');
    const mentionsConfig = content.includes('config');
    expect(mentionsElementId).toBe(true);
    expect(mentionsConfig).toBe(true);
  });
});

/**
 * WHY: components/index.ts must re-export from ./ui so downstream code
 * can import UI components via the barrel (e.g., import { Button } from
 * '@/components') instead of deep imports that bypass the barrel (D23).
 */
describe('Components index re-exports UI', () => {
  const INDEX_PATH = joinPath(TEMPLATES_DIR, 'src', 'components', 'index.ts');

  /** WHY: The barrel file must exist for barrel-only imports to work. */
  it('components/index.ts exists', () => {
    expect(fileExists(INDEX_PATH)).toBe(true);
  });

  /** WHY: Without re-exporting ./ui, consumers must deep-import UI components. */
  it('re-exports from ./ui', () => {
    const content = readFile(INDEX_PATH);
    expect(content).toContain("'./ui'");
  });
});

/**
 * WHY: Frontend standards must use `type` instead of `interface` in all
 * code examples. The TypeScript standards mandate type aliases for object
 * shapes. If standards show interface, developers copy the wrong pattern.
 * Exception: `declare module` augmentation requires `interface` for
 * TypeScript declaration merging (e.g., TanStack Router's Register).
 */
describe('No interface keyword in standards', () => {
  const STANDARDS_FILES = [
    joinPath(STANDARDS_DIR, 'SKILL.md'),
    joinPath(STANDARDS_DIR, 'resources', 'mvvm-patterns.md'),
    joinPath(STANDARDS_DIR, 'resources', 'tailwind.md'),
    joinPath(STANDARDS_DIR, 'resources', 'tanstack.md'),
    joinPath(STANDARDS_DIR, 'resources', 'shadcn.md'),
  ];

  const interfacePattern = /\binterface\s+[A-Z]/;

  for (const filePath of STANDARDS_FILES) {
    const fileName = filePath.split('/').pop()!;

    /** WHY: Each standards file must exist to be checked. */
    it(`${fileName} exists`, () => {
      expect(fileExists(filePath)).toBe(true);
    });

    /**
     * WHY: interface keyword followed by a capital letter indicates a
     * TypeScript interface declaration. Standards must use type aliases.
     * Exception: interfaces inside `declare module` blocks are required
     * for TypeScript declaration merging and are excluded from this check.
     */
    it(`${fileName} has no interface declarations (except in declare module)`, () => {
      const content = readFile(filePath);
      const lines = content.split('\n');

      let inDeclareModule = false;
      const violations = lines
        .map((line, idx) => ({ line, num: idx + 1 }))
        .filter(({ line }) => {
          if (/declare\s+module\b/.test(line)) inDeclareModule = true;
          if (inDeclareModule && line.trim() === '}') inDeclareModule = false;
          if (inDeclareModule) return false;
          return interfacePattern.test(line);
        });

      expect(
        violations,
        `interface keyword found in ${fileName}:\n${violations.map((v) => `  L${v.num}: ${v.line.trim()}`).join('\n')}`,
      ).toHaveLength(0);
    });
  }
});

/**
 * WHY: Standards must not reference types/generated.ts as a deep import.
 * The architecture uses barrel imports from workspace packages. Deep imports
 * to types/generated.ts couple consumers to internal file structure.
 */
describe('No types/generated imports in standards', () => {
  const STANDARDS_FILES = [
    joinPath(STANDARDS_DIR, 'SKILL.md'),
    joinPath(STANDARDS_DIR, 'resources', 'mvvm-patterns.md'),
    joinPath(STANDARDS_DIR, 'resources', 'tailwind.md'),
    joinPath(STANDARDS_DIR, 'resources', 'tanstack.md'),
    joinPath(STANDARDS_DIR, 'resources', 'shadcn.md'),
  ];

  for (const filePath of STANDARDS_FILES) {
    const fileName = filePath.split('/').pop()!;

    /**
     * WHY: types/generated deep imports bypass barrel exports and couple
     * code to internal file structure of the contracts package.
     */
    it(`${fileName} has no types/generated references`, () => {
      if (!fileExists(filePath)) {
        expect.fail(`${fileName} does not exist`);
      }
      const content = readFile(filePath);
      expect(content).not.toContain('types/generated');
    });
  }
});

/**
 * WHY: The frontend-dev agent must not reference Zustand. Task decisions
 * replaced Zustand with useReducer + Context. If the agent still mentions
 * Zustand, Claude will suggest it to users during frontend development.
 */
describe('Frontend dev agent has no Zustand', () => {
  const AGENT_PATH = joinPath(PLUGIN_DIR, 'agents', 'frontend-dev.md');

  /** WHY: The agent file must exist for the check to be meaningful. */
  it('frontend-dev.md exists', () => {
    expect(fileExists(AGENT_PATH)).toBe(true);
  });

  /** WHY: Any case variation of "zustand" indicates a stale reference. */
  it('does not mention Zustand', () => {
    const content = readFile(AGENT_PATH);
    const lower = content.toLowerCase();
    expect(lower).not.toContain('zustand');
  });
});

/**
 * WHY: The project template CLAUDE.md is the source of truth for version
 * references in scaffolded projects. It must reference React 19 and
 * TypeScript 5.9, not outdated React 18 or ambiguous TypeScript 5.
 */
describe('Project template CLAUDE.md versions', () => {
  const CLAUDE_MD_PATH = joinPath(
    SKILLS_DIR,
    'project-scaffolding',
    'templates',
    'project',
    'CLAUDE.md',
  );

  /** WHY: The template must exist for scaffolded projects to include it. */
  it('CLAUDE.md template exists', () => {
    expect(fileExists(CLAUDE_MD_PATH)).toBe(true);
  });

  /** WHY: React 19 is the current stable version used by the scaffold. */
  it('references React 19', () => {
    const content = readFile(CLAUDE_MD_PATH);
    expect(content).toContain('React 19');
  });

  /** WHY: React 18 is outdated and must not appear. */
  it('does not reference React 18', () => {
    const content = readFile(CLAUDE_MD_PATH);
    expect(content).not.toContain('React 18');
  });

  /** WHY: TypeScript 5.9 is the pinned version in the scaffold deps. */
  it('references TypeScript 5.9', () => {
    const content = readFile(CLAUDE_MD_PATH);
    expect(content).toContain('TypeScript 5.9');
  });
});

/**
 * WHY: Template files must use the correct template variables so the
 * scaffolding engine can substitute project-specific values. Missing
 * variables produce broken output with literal {{VARIABLE}} strings.
 */
describe('Scaffold template variables', () => {
  const PKG_PATH = joinPath(TEMPLATES_DIR, 'package.json');
  const APP_PATH = joinPath(TEMPLATES_DIR, 'src', 'app.tsx');
  const MAIN_PATH = joinPath(TEMPLATES_DIR, 'src', 'main.tsx');

  /** WHY: package.json needs all three variables for name and workspace deps. */
  it('package.json contains all template variables', () => {
    const content = readFile(PKG_PATH);
    expect(content).toContain('{{PROJECT_NAME}}');
    expect(content).toContain('{{CONTRACT_PACKAGE}}');
    expect(content).toContain('{{CONFIG_PACKAGE}}');
  });

  /** WHY: app.tsx imports config types from the config workspace package. */
  it('app.tsx contains CONFIG_PACKAGE variable', () => {
    const content = readFile(APP_PATH);
    expect(content).toContain('{{CONFIG_PACKAGE}}');
  });

  /** WHY: main.tsx imports config types from the config workspace package. */
  it('main.tsx contains CONFIG_PACKAGE variable', () => {
    const content = readFile(MAIN_PATH);
    expect(content).toContain('{{CONFIG_PACKAGE}}');
  });
});
