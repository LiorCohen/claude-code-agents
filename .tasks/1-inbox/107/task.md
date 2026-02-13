---
id: 107
title: Revisit frontend scaffold — add Radix/Shadcn, align with documented stack
status: inbox
priority: high
created: 2026-02-08 14:32 UTC
depends_on: []
blocks: []
---

# Task 107: Revisit frontend scaffold — add Radix/Shadcn, align with documented stack

## Description

Revisit the frontend scaffold, directory structure, and standards to properly integrate Radix UI and Shadcn/ui, upgrade all deps to current stable versions, and align the scaffold with documented standards.

1. **Add Radix + Shadcn** — dependencies, config, directory conventions
2. **Upgrade all deps** — bump to highest stable versions (React 19, Vite 7, Vitest 4, ESLint 10, TypeScript 5.9, etc.)
3. **Align scaffold with documented stack** — fix gaps where documented dependencies are missing from template package.json
4. **Update directory structure** — accommodate Shadcn's `ui/` convention alongside custom components
5. **Update standards docs** — cover component library usage, `cn()` pattern, version bumps, when to use what

## Open Questions

_(All resolved)_

## Decisions

1. **Component directory structure** — Option C: `components/ui/` for Shadcn components, `components/` for shared custom components, page-specific components stay colocated in `pages/{name}/`. Fits the existing MVVM structure.

2. **cn() vs clsx** — Adopt `cn()` (clsx + tailwind-merge). Scaffold includes `src/lib/utils.ts` with the `cn()` function. Standards updated to use `cn()` instead of raw `clsx`. Deps: `clsx` + `tailwind-merge`.

3. **Base components in scaffold** — Include the Shadcn components needed to make the scaffold's existing examples (sidebar, home page) look decent. Claude writes Shadcn components directly as code (not via `npx shadcn` CLI) into `components/ui/`. Standards docs teach Claude the Shadcn patterns and component catalog for adding more as needed.

4. **Scaffold package.json sync** — Fix all missing deps as part of this task. Align template package.json with documented stack: add TanStack Router, Zustand, TanStack Table, TanStack Form, clsx, tailwind-merge, plus Radix/Shadcn deps.

5. **Placeholder routing** — Yes, replace the `useState`-based PageRouter with proper TanStack Router setup in the scaffold.

6. **Radix vs Shadcn guidance** — Hierarchy: (1) Use Shadcn component if one exists. (2) If no Shadcn component but a Radix primitive exists, build a custom component on top of it following Shadcn patterns, place in `components/ui/`. (3) If neither exists, build fully custom.

7. **Shadcn standards resource** — Resource doc covers: `cn()` pattern, Shadcn component anatomy (forwardRef, className prop, cn merging, Radix primitive usage), available Shadcn components with their Radix deps, how to extend/customize components, `components/ui/` conventions, and `cva` (class-variance-authority) for component variants. Include `cva` as a dependency.

8. **Pinned versions** — All deps in scaffold template package.json must use pinned versions (e.g., `"5.0.11"`), never `"latest"` or loose ranges.

9. **Version upgrades** — Bump all deps to highest stable versions. Key bumps: React 18→19.2, Vite 5→7.3, Vitest 1→4.0, ESLint 8→9.21 (not 10 — typescript-eslint doesn't support it yet), TypeScript 5.3→5.9. Standards docs updated to reflect new versions.

10. **hooks vs viewmodels** — Drop `viewmodels/` from src root. Keep `hooks/` for shared hooks. Page-specific ViewModels stay colocated inside `pages/{name}/`. Standards docs updated to reflect this.

11. **Drop unnecessary root dirs** — Remove `api/`, `utils/`, `models/`, `stores/` from scaffold. `lib/utils.ts` covers utilities. Hooks manage Zustand stores internally. API clients live in `services/`.

12. **types/** — For global webapp types only. Contract types come from workspace packages (imported like any npm dep), not generated locally.

13. **Layout is a component** — Layout lives in `components/layout/layout.tsx` (with barrel). `app.tsx` only owns provider wiring (QueryClientProvider, RouterProvider). `routes/` contains only route definitions.

14. **Entry point pattern** — `src/index.ts` imports `mount` from `main.tsx` and assigns it to `window.__webapp_start__`. `src/index.html` loads `index.ts`. No import side-effects in `main.tsx`.

15. **mount() signature** — `mount(elementId: string, config: WebappConfig)` — two args. Config type imported from workspace config package.

16. **Component subdirectories** — Custom components in `components/` each get their own directory with an `index.ts` barrel (e.g., `components/sidebar/sidebar.tsx` + `components/sidebar/index.ts`). Shadcn `components/ui/` stays flat.

17. **index.html in src/** — `index.html` lives inside `src/`, not project root. Vite config uses `root: 'src'`.

18. **Strict directory structure** — The scaffold defines a fixed set of `src/` directories and root files. Claude must not create additional root-level files or folders beyond what the scaffold specifies. All generated code must fit into the established structure: `components/`, `components/ui/`, `hooks/`, `lib/`, `pages/`, `routes/`, `services/`, `types/`. Standards docs must explicitly list the allowed directories and state that no new top-level dirs should be added.

19. **No import side-effects** — Only `src/index.ts` may have import side-effects (CSS import, window assignment). All other files must be side-effect free.

20. **Index files are barrels only** — All `index.ts` files must contain only imports and exports. No logic, no function calls, no variable declarations beyond re-exports. Always use `index.ts` (never `index.tsx`) since barrel files never contain JSX.

21. **Routes export a factory function** — `routes.tsx` exports `createAppRouter()` instead of executing route setup at module scope. Type registration uses `ReturnType<typeof createAppRouter>`.

22. **Provider setup via hooks** — `useAppQueryClient` and `useAppRouter` hooks lazily create instances via `useState`. `app.tsx` consumes these hooks — no direct instantiation in the component.

23. **All directories have barrel index.ts** — Every `src/` subdirectory (`components/`, `hooks/`, `lib/`, `pages/`, `routes/`, `services/`, `types/`) must have an `index.ts` barrel. All imports go through barrels — never bypass (e.g., `@/lib` not `@/lib/utils`).

24. **Shadcn components follow TS standards** — Use `type` (not `interface`) for component props. Arrow functions in `lib/`. `displayName` assignments and `forwardRef` are acceptable exceptions for `components/ui/`.

## Acceptance Criteria

- [ ] Radix and Shadcn added to scaffold template dependencies
- [ ] `components.json` included in scaffold
- [ ] Directory structure updated to accommodate Shadcn components
- [ ] Frontend standards docs updated (component library usage, cn() pattern)
- [ ] Scaffold package.json aligned with documented stack
- [ ] Clear guidance on Radix vs Shadcn vs custom components
- [ ] All deps bumped to highest stable versions (pinned)
- [ ] Standards docs reflect updated version numbers
