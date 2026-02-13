---
id: 107
title: Revisit frontend scaffold — add Radix/Shadcn, align with documented stack
status: reviewing
priority: high
created: 2026-02-08 14:32 UTC
depends_on: []
blocks: []
---

# Task 107: Revisit frontend scaffold — add Radix/Shadcn, align with documented stack

## Description

Revisit the frontend scaffold, directory structure, and standards to properly integrate Radix UI and Shadcn/ui, upgrade all deps to current stable versions, and align the scaffold with documented standards.

1. **Add Radix + Shadcn** — dependencies, config, directory conventions
2. **Upgrade all deps** — bump to highest stable versions (React 19, Vite 7, Vitest 4, ESLint 9, TypeScript 5.9, etc.)
3. **Align scaffold with documented stack** — fix gaps where documented dependencies are missing from template package.json
4. **Update directory structure** — accommodate Shadcn's `ui/` convention alongside custom components
5. **Update standards skills** — cover component library usage, `cn()` pattern, version bumps, when to use what

## Open Questions

_(All resolved)_

## Decisions

| # | Question | Answer |
|---|----------|--------|
| 1 | Where should Shadcn components live relative to custom components? | `components/ui/` for Shadcn components, `components/` for shared custom components, page-specific components stay colocated in `pages/{name}/`. |
| 2 | Should we use raw `clsx` or the Shadcn-standard `cn()` wrapper? | Adopt `cn()` (clsx + tailwind-merge) for intelligent Tailwind class merging. Scaffold includes `src/lib/utils.ts` with the function. Deps: `clsx` + `tailwind-merge`. |
| 3 | Should the scaffold ship with pre-built Shadcn components or leave `components/ui/` empty? | Include the Shadcn components the scaffold examples need (Button, Card). Devs won't run `npx shadcn` — Claude writes all webapp code directly. Standards docs teach Claude the Shadcn patterns for adding more components as needed. |
| 4 | The template package.json is missing deps documented in the frontend stack (TanStack Router, TanStack Table, TanStack Form). Should we fix this? | Yes. Fix all gaps as part of this task. Drop Zustand — use `useReducer` + Context for global client state instead (zero deps, explicit data flow, encapsulated behind hooks). |
| 5 | The current scaffold uses a `useState`-based PageRouter placeholder. Should we replace it with real routing? | Yes. Replace with proper TanStack Router setup. |
| 6 | When should Claude use Shadcn components vs raw Radix primitives vs fully custom? | Hierarchy: (1) Use a Shadcn component if one exists. (2) If no Shadcn component but a Radix primitive exists, build a custom component on top of it following Shadcn patterns, place in `components/ui/`. (3) If neither exists, build fully custom. |
| 7 | How does Claude learn to write Shadcn components correctly without the CLI? | New resource doc covering: `cn()` pattern, component anatomy (forwardRef, className prop, cn merging, Radix primitive usage), component catalog, `cva` for variants, `components/ui/` conventions. |
| 8 | Should scaffold deps use version ranges or exact versions? | Always pinned (e.g., `"5.0.11"`), never `"latest"` or loose ranges. |
| 9 | Several scaffold deps are outdated. Should we bump them? | Bump all to highest stable: React 18→19.2, Vite 5→7.3, Vitest 1→4.0, ESLint 8→9.21 (not 10 — typescript-eslint doesn't support it), TypeScript 5.3→5.9, Tailwind CSS 4.0→4.1. Pin `tailwindcss` and `@tailwindcss/vite` to latest stable (currently 4.1.18). |
| 10 | The current scaffold has both `hooks/` and `viewmodels/` at src root. Do we need both? | Drop `viewmodels/`. Keep `hooks/` for shared hooks. Page-specific ViewModels stay colocated inside `pages/{name}/`. |
| 11 | The scaffold has `api/`, `utils/`, `models/`, `stores/` directories that overlap with other patterns. Keep or remove? | Remove all four. `lib/utils.ts` covers utilities. Hooks manage state internally via `useReducer` + Context. API clients live in `services/`. |
| 12 | What goes in `types/`? Are types generated from OpenAPI? | Global webapp types only. Contract types come from workspace packages (imported like any npm dep), not generated locally. |
| 13 | Should Layout live in `app.tsx` alongside providers? | No. Layout is a reusable UI component, not provider wiring. Layout lives in `components/layout/layout.tsx` (with barrel). `app.tsx` only owns provider wiring. |
| 14 | How does the webapp boot? What is the entry point chain? | `src/index.html` loads `src/index.ts`. `index.ts` imports CSS, imports `mount` from `main.tsx`, and assigns it to `window.__webapp_start__`. No import side-effects in `main.tsx`. |
| 15 | What arguments does the mount function take? | `mount(elementId: string, config: WebappConfig)` — two args. Config type imported from workspace config package. |
| 16 | How should custom components be organized within `components/`? | Each gets its own directory with an `index.ts` barrel (e.g., `components/sidebar/sidebar.tsx` + `components/sidebar/index.ts`). Shadcn `components/ui/` stays flat. |
| 17 | Should `index.html` live at the project root (Vite default) or inside `src/`? | Inside `src/`. All source lives in `src/`. Vite config uses `root: 'src'`. |
| 18 | How do we prevent Claude from creating ad-hoc directories outside the scaffold structure? | Fixed allowlist: `components/`, `components/ui/`, `hooks/`, `lib/`, `pages/`, `routes/`, `services/`, `types/`. Standards docs must explicitly list allowed directories and state that no new top-level dirs should be added. |
| 19 | Which files are allowed to have module-level side-effects (CSS imports, `new` calls, window assignments)? | Only `src/index.ts`. All other files must be side-effect free. |
| 20 | Can index files contain logic, or should they be pure barrels? | Pure barrels only — imports and exports. No logic, no function calls, no variable declarations. Always `.ts` (never `.tsx`) since barrels never contain JSX. |
| 21 | Route setup calls (`createRootRoute`, `createRoute`, etc.) execute at module scope. How do we avoid that side-effect? | `routes.tsx` exports a `createAppRouter()` factory function instead. Type registration uses `ReturnType<typeof createAppRouter>`. |
| 22 | `new QueryClient()` and `createRouter()` at module scope are side-effects. Where should they be created? | `useAppQueryClient` and `useAppRouter` hooks lazily create instances via `useState`. `app.tsx` consumes these hooks — no direct instantiation. |
| 23 | Should every `src/` subdirectory have a barrel `index.ts`? Should imports always go through barrels? | Yes to both. Every subdirectory (`components/`, `hooks/`, `lib/`, `pages/`, `routes/`, `services/`, `types/`) must have an `index.ts` barrel. All imports go through barrels (e.g., `@/lib` not `@/lib/utils`). |
| 24 | Standard Shadcn components use `forwardRef`, `displayName` assignment, and `import * as React` which conflict with our TS standards. How do we reconcile? | Use `type` (not `interface`) for props. Arrow functions in `lib/`. `displayName` and `forwardRef` are acceptable exceptions for `components/ui/` only. |
| 25 | Should `main.tsx` validate the config it receives at runtime? | Yes. Simple hand-written checks — assert required keys exist and have expected types. No validation library needed. If validation fails, throw with a descriptive error instead of rendering a broken app. |
| 26 | Should the scaffold include an ESLint config? | Yes. Scaffold includes `eslint.config.js` using ESLint 9 flat config format. Uses `typescript-eslint` v8 `strictTypeChecked`, `eslint-plugin-react`, `eslint-plugin-react-hooks`. Enforces: no `let`, no `function` keyword, no default exports, no classes (except Error subclasses), no `any`, `consistent-type-imports`, `prefer-nullish-coalescing`, `explicit-module-boundary-types`, banned utility libraries (lodash/ramda/immer), barrel imports only via `no-restricted-imports` (ban deep `@/dir/file` imports — use `@/dir` instead) (D23). Includes a custom local rule (`local/allowed-structure`) that enforces D18 — only allowed `src/` subdirectories (`components`, `hooks`, `lib`, `pages`, `routes`, `services`, `types`) and root-level files (`index.ts`, `main.tsx`, `app.tsx`, `vite-env.d.ts`) pass; anything else errors. |
| 27 | How does the config received by `mount()` reach components? | `main.tsx` validates the config (D25), then passes it to `<App config={config} />`. `App` stores it in a React Context (`AppConfigProvider`). Components access it via `useAppConfig()` hook. Context + hook live in `hooks/use_app_config.ts`. |
| 28 | `declare module` in `routes.tsx` uses `interface` — doesn't that violate TS standards? | No. TypeScript module augmentation (`declare module`) requires `interface` — `type` cannot be used for merging. This is an unavoidable language constraint, not a style choice. Exception applies only to `declare module` blocks. |

## Implementation Changes

Reference prototype: `prototype/` (in this task folder)

### A. Scaffold templates (`plugin/skills/components/frontend/frontend-scaffolding/templates/`)

**Update existing files:**

| File | Changes |
|------|---------|
| `package.json` | Add radix-ui, cva, clsx, tailwind-merge, TanStack Router/Query/Table/Form, Zustand, typescript-eslint (unified v8 package, replaces separate `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser`), eslint-plugin-react, eslint-plugin-react-hooks. Bump all deps to pinned stable versions. Add `lint` and `lint:fix` scripts (D4, D8, D9, D26) |
| `vite.config.ts` | Add `root: 'src'`, add `resolve.alias` for `@/`, fix `__dirname` → `import.meta.dirname` (ESM compat) (D17) |
| `tsconfig.json` | Verify strict mode, path aliases |
| `src/main.tsx` | Export `mount(elementId, config)` function, no side-effects (D14, D15, D19) |
| `src/app.tsx` | Providers only via hooks (including AppConfigProvider), no Layout, no side-effects (D13, D19, D22, D27) |
| `src/index.css` | Keep as-is (Tailwind import) |
| `src/components/index.ts` | Barrel exporting Layout and Sidebar (D20, D23) |
| `src/hooks/index.ts` | Barrel exporting useAppQueryClient, useAppRouter, and useAppConfig (D20, D23, D27) |
| `src/pages/index.ts` | Barrel (currently `src/pages/home.tsx` — restructure below) |

**Move/rename existing files:**

| From | To | Reason |
|------|----|--------|
| `index.html` (root) | `src/index.html` | D17 |
| `src/components/sidebar.tsx` | `src/components/sidebar/sidebar.tsx` + `src/components/sidebar/index.ts` | D16 |
| `src/pages/home.tsx` | `src/pages/home_page/home_page.tsx` + `src/pages/home_page/index.ts` | D16 |

**Add new files:**

| File | Purpose |
|------|---------|
| `components.json` | Shadcn configuration (D7) |
| `src/index.ts` | Entry point — CSS import, mount to `window.__webapp_start__` (D14, D19) |
| `src/lib/utils.ts` | `cn()` utility (D2) |
| `src/lib/index.ts` | Barrel for lib (D23) |
| `src/components/ui/button.tsx` | Shadcn Button with cva variants (D3, D7) |
| `src/components/ui/card.tsx` | Shadcn Card components (D3, D7) |
| `src/components/ui/index.ts` | Barrel for Shadcn components (D23) |
| `src/components/layout/layout.tsx` | Layout component with Sidebar + Outlet (D13) |
| `src/components/layout/index.ts` | Barrel (D16, D23) |
| `src/routes/routes.tsx` | `createAppRouter()` factory function + type registration (D5, D21) |
| `src/routes/index.ts` | Barrel (D23) |
| `src/hooks/use_query_client.ts` | Lazy QueryClient via useState (D22) |
| `src/hooks/use_app_router.ts` | Lazy router via useState (D22) |
| `src/services/index.ts` | Placeholder barrel (D11, D18) |
| `src/types/index.ts` | Placeholder barrel (D12, D18) |
| `src/vite-env.d.ts` | Vite client type declarations (`/// <reference types="vite/client" />`) |
| `src/hooks/use_app_config.ts` | AppConfigContext + `useAppConfig()` hook for config access (D27) |
| `.gitignore` | Ignore `node_modules`, `dist`, `*.local` |
| `eslint.config.js` | ESLint 9 flat config enforcing TS + frontend standards (D26) |

**Delete existing files:**

| File | Reason |
|------|--------|
| `src/api/index.ts` | Replaced by `src/services/` (D11) |
| `src/viewmodels/` | Dropped; page-specific ViewModels colocate in `pages/{name}/` (D10) |
| `src/models/` | Dropped; overlap with services and page-colocated files (D11) |
| `src/stores/` | Dropped; hooks manage Zustand stores internally (D11) |
| `src/utils/` | Dropped; replaced by `src/lib/utils.ts` (D11) |

### B. Frontend standards (`plugin/skills/components/frontend/frontend-standards/`)

**Update existing files:**

| File | Changes |
|------|---------|
| `SKILL.md` | Update directory structure diagram, version numbers, fix `types/generated.ts` references — contract types come from workspace packages not local generation (D12), add rules: strict directory allowlist (D18), barrel-only index files (D20), no side-effects (D19), import through barrels (D23), hooks pattern for providers (D22), factory functions for routes (D21) |
| `resources/mvvm-patterns.md` | Drop viewmodels from root, hooks replace viewmodels at root level (D10), update directory structure |
| `resources/tailwind.md` | Add `cn()` pattern, replace raw clsx guidance (D2) |
| `resources/tanstack.md` | Add Router setup with `createAppRouter()` factory pattern (D5, D21), update version references (D9) |

**Add new files:**

| File | Purpose |
|------|---------|
| `resources/shadcn.md` | Shadcn component anatomy, forwardRef/cn/cva patterns, component catalog, Radix vs Shadcn guidance hierarchy, `components/ui/` conventions, TS standards exceptions (D6, D7, D24) |

### C. Scaffolding skill definition

**Update existing files:**

| File | Changes |
|------|---------|
| `frontend-scaffolding/SKILL.md` | Update file listing to match new structure, update template variable references |

## Acceptance Criteria

- [ ] Scaffold templates match prototype in `.tasks/4-implementing/107/prototype/`
- [ ] `components.json` included in scaffold
- [ ] All deps pinned to stable versions verified in build test
- [ ] `frontend-standards/SKILL.md` updated with directory structure, rules from D18–D23
- [ ] `resources/shadcn.md` created with component patterns and Radix/Shadcn guidance
- [ ] `resources/mvvm-patterns.md` updated (no root viewmodels)
- [ ] `resources/tailwind.md` updated with `cn()` pattern
- [ ] `resources/tanstack.md` updated with router factory pattern
- [ ] `frontend-scaffolding/SKILL.md` updated with new file listing
- [ ] `eslint.config.js` included in scaffold with flat config enforcing TS + frontend standards
- [ ] Build test passes: `tsc --noEmit`, `eslint src/`, and `vite build` on scaffolded output
