---
title: Revisit frontend scaffold — add Radix/Shadcn, align with documented stack
created: 2026-02-13 14:00 UTC
---

# Plan: Revisit Frontend Scaffold — Add Radix/Shadcn, Align with Documented Stack

## Problem Summary

The frontend scaffold templates are outdated and misaligned with documented standards. Deps use loose ranges at old versions (React 18, Vite 5, ESLint 8). The scaffold ships directories the task decisions explicitly remove (`viewmodels/`, `models/`, `stores/`, `utils/`, `api/`). There's no Radix UI, Shadcn, TanStack Router, or TanStack Form in the template. The entry point architecture doesn't support config injection. No ESLint config is included. The frontend standards skill references patterns (`viewmodels/`, `stores/`, `types/generated.ts`) that contradict the task decisions.

A validated prototype exists at `.tasks/4-implementing/107/prototype/` — templates should match it, with known deviations corrected during implementation (see "Prototype Deviations" below).

## Files to Modify

### A. Scaffold Templates (`plugin/skills/components/frontend/frontend-scaffolding/templates/`)

| File | Action | What Changes |
|------|--------|--------------|
| `package.json` | Update | Pinned deps at current stable, add Radix/Shadcn/TanStack Router/Form/CVA/clsx/tailwind-merge/`@radix-ui/react-slot` (no Zustand — use `useReducer` + Context instead), replace split TS-ESLint packages with unified `typescript-eslint` v8 package, add `lint` and `lint:fix` scripts |
| `tsconfig.json` | Update | Verify strict mode and path aliases are correct (no structural changes needed — prototype matches current template) |
| `vite.config.ts` | Update | Add `root: 'src'`, add `resolve.alias` for `@/`, fix `__dirname` → `import.meta.dirname` |
| `index.html` | Delete | Moved to `src/index.html` |
| `src/index.html` | Create | Entry HTML with script pointing to `./index.ts` |
| `src/index.ts` | Create | CSS import, mount assignment to `window.__webapp_start__` |
| `src/main.tsx` | Update | Export `mount(elementId, config)` function, config validation, no side-effects |
| `src/app.tsx` | Update | Provider wiring only via hooks (`useAppQueryClient`, `useAppRouter`), receives config prop, wraps in `AppConfigProvider` |
| `src/index.css` | Keep | No changes |
| `src/vite-env.d.ts` | Create | Vite client type declarations |
| `components.json` | Create | Shadcn configuration |
| `.gitignore` | Create | Ignore `node_modules`, `dist`, `*.local` |
| `eslint.config.js` | Create | ESLint 9 flat config with `strictTypeChecked`, React/hooks plugins, custom rules (no let, no function keyword, no default exports, no classes, no any, barrel-only imports, allowed-structure) |
| `eslint-rules/allowed-structure.js` | Create | Custom local ESLint rule enforcing D18 directory allowlist — only permitted `src/` subdirectories and root-level files pass; anything else errors |
| `src/lib/utils.ts` | Create | `cn()` utility (clsx + tailwind-merge) |
| `src/lib/index.ts` | Create | Barrel for lib |
| `src/components/ui/button.tsx` | Create | Shadcn Button with cva variants |
| `src/components/ui/card.tsx` | Create | Shadcn Card components |
| `src/components/ui/index.ts` | Create | Barrel for Shadcn components |
| `src/components/sidebar.tsx` | Delete | Moved to `sidebar/sidebar.tsx` |
| `src/components/sidebar/sidebar.tsx` | Create | Updated sidebar using TanStack Router `Link`, `Button` component, `cn()` |
| `src/components/sidebar/index.ts` | Create | Barrel |
| `src/components/layout/layout.tsx` | Create | Layout with Sidebar + `Outlet` |
| `src/components/layout/index.ts` | Create | Barrel |
| `src/components/index.ts` | Update | Barrel exporting Layout, Sidebar, and re-exporting ui |
| `src/routes/routes.tsx` | Create | `createAppRouter()` factory, type registration via `declare module` |
| `src/routes/index.ts` | Create | Barrel |
| `src/hooks/use_query_client.ts` | Create | Lazy QueryClient via `useState` |
| `src/hooks/use_app_router.ts` | Create | Lazy router via `useState` |
| `src/hooks/use_app_config.ts` | Create | `AppConfigContext` + `useAppConfig()` hook |
| `src/hooks/index.ts` | Update | Barrel exporting all hooks |
| `src/pages/home.tsx` | Delete | Moved to `home_page/home_page.tsx` |
| `src/pages/home_page/home_page.tsx` | Create | Updated home page using Card/CardHeader/CardTitle/CardContent |
| `src/pages/home_page/index.ts` | Create | Barrel |
| `src/pages/index.ts` | Update | Barrel exporting HomePage |
| `src/services/index.ts` | Create | Placeholder barrel |
| `src/types/index.ts` | Create | Placeholder barrel |
| `src/api/` | Delete | Entire directory — only physical template directory being removed (replaced by `services/`) |

**Note:** `viewmodels/`, `models/`, `stores/`, `utils/` appear in the scaffolding SKILL.md documentation but have no physical template files. They are removed from the SKILL.md listing only (see section C).

### B. Frontend Standards (`plugin/skills/components/frontend/frontend-standards/`)

| File | Action | What Changes |
|------|--------|--------------|
| `SKILL.md` | Update | New directory structure diagram, remove `viewmodels/`/`stores/`/`utils/` references, fix `types/generated.ts` → barrel import from workspace packages, replace Zustand state management guidance with `useReducer` + Context, fix `interface` → `type` in code examples, fix file naming examples (lines 189-190 reference `src/viewmodels/`/`src/stores/`), update resource file listing text (clsx → cn), add rules: directory allowlist (D18), barrel-only index files (D20), no side-effects except `src/index.ts` (D19), barrel imports only (D23), hooks for providers (D22), factory functions for routes (D21), `cn()` for class merging |
| `resources/mvvm-patterns.md` | Update | Remove `viewmodels/` from root structure, hooks replace shared viewmodels, replace Zustand store pattern with `useReducer` + Context pattern, update directory references, update import paths to use barrel imports, fix `interface` → `type` in code examples, fix `types/generated.ts` deep imports (3 occurrences) → barrel imports from workspace packages |
| `resources/tailwind.md` | Update | Replace raw `clsx` guidance with `cn()` pattern (clsx + tailwind-merge), add `cva` for component variants |
| `resources/tanstack.md` | Update | Add TanStack Router `createAppRouter()` factory pattern (D21), update version references, add type registration example, fix `interface` → `type` in code examples (line 62), fix `types/generated.ts` deep import (line 42) → barrel import, fix `services/api/` subdirectory reference → flat `services/` |
| `resources/shadcn.md` | Create | Shadcn component anatomy (forwardRef, className, cn, Radix), component catalog, cva for variants, `components/ui/` conventions, Radix vs Shadcn vs custom hierarchy (D6), TS standards exceptions for `components/ui/` (D24) |

### C. Scaffolding Skill Definition (`plugin/skills/components/frontend/frontend-scaffolding/`)

| File | Action | What Changes |
|------|--------|--------------|
| `SKILL.md` | Update | New directory structure listing (add `eslint-rules/` directory), updated tech stack versions, remove obsolete directories from listing, update MVVM Architecture table (remove `src/models/`/`src/viewmodels/`, add `src/lib/`/`src/services/`), add new files to listing, add `{{CONTRACT_PACKAGE}}` and `{{CONFIG_PACKAGE}}` to Template Variables table, update scaffold spec JSON `variables` array to include all three template variables |
| `schemas/input.schema.json` | Review | Verify whether `config_package` field is needed alongside existing `contracts` field — add if config is a separate workspace package requiring a template variable |

### D. Cross-Codebase Consistency (outside frontend directories)

| File | Action | What Changes |
|------|--------|--------------|
| `plugin/agents/frontend-dev.md` | Update | Remove "Zustand for global client state" (line 105) → replace with `useReducer` + Context; update state management guidance throughout |
| `plugin/skills/project-scaffolding/templates/project/CLAUDE.md` | Update | Fix "React 18, TypeScript 5" (line 8) → "React 19, TypeScript 5.9"; update MVVM label to reflect current architecture |

**Note (low-impact, not blocking):** `plugin/commands/reviewer.md`, `plugin/commands/sdd-change.md`, and `plugin/system/src/commands/scaffolding/project.ts` (line 116) also contain MVVM labels. These are low-risk cosmetic references that don't affect scaffold output — update opportunistically during implementation if touched for other reasons, but don't add scope specifically for them.

## Changes

### 1. Scaffold Template Overhaul

Replace the current template set with files matching the prototype. Key behavioral changes:

- **Entry point chain**: `src/index.html` → `src/index.ts` (CSS + window mount) → `src/main.tsx` (config validation + React render). Config validation in `mount()`: assert `config` is a non-null object and `elementId` is a non-empty string, throw descriptive error on failure. Field-level validation is the config package's responsibility — TypeScript enforces the shape at compile time, `mount()` guards against runtime nulls/undefineds from the host page
- **Provider architecture**: `App` receives `config: WebappConfig` prop, uses `useAppQueryClient()` and `useAppRouter()` hooks for lazy instantiation — no module-level side-effects. Nesting order (outermost first): `AppConfigProvider` → `QueryClientProvider` → `RouterProvider`. Config wraps outermost so all providers and routes can access it via `useAppConfig()`
- **Config delivery**: `AppConfigProvider` context + `useAppConfig()` hook, created in `src/hooks/use_app_config.ts`, wired in `App`
- **Routing**: TanStack Router via `createAppRouter()` factory in `routes/routes.tsx`, Layout as root route component with `Outlet`
- **Component library**: Shadcn Button and Card in `components/ui/`, `cn()` utility in `lib/utils.ts`. Button must use `@radix-ui/react-slot` for `asChild` — destructure `asChild = false` from props, `const Comp = asChild ? Slot : "button"`, render `<Comp>` instead of `<button>`. Without this, sidebar's `<Button asChild><Link /></Button>` pattern is broken
- **State management**: Drop Zustand — use `useReducer` + Context for global client state, encapsulated behind hooks
- **Directory pruning**: Remove `api/`, `viewmodels/`, `models/`, `stores/`, `utils/` — replaced by `services/`, `lib/`, colocated page files, and hooks managing state internally
- **ESLint config**: Flat config enforcing TS standards, no-let, no-function-keyword, no-default-exports, barrel-only imports, custom `local/allowed-structure` rule for directory allowlist

Files not in the prototype that need authoring during implementation:
- `eslint.config.js` — ESLint 9 flat config (D26 specifies full rule set)
- `eslint-rules/allowed-structure.js` — custom local ESLint rule for D18 directory allowlist
- `src/hooks/use_app_config.ts` — AppConfigContext + useAppConfig hook (D27)
- `src/components/ui/index.ts` — barrel for Shadcn UI components
- `src/vite-env.d.ts` — Vite client type reference
- `src/pages/index.ts` — barrel for pages (exists in current templates, not in prototype)

### Prototype Deviations

The prototype at `.tasks/2-planning/107/prototype/` is the reference, with these known corrections to apply during implementation:

| Prototype File | Deviation | Correction |
|----------------|-----------|------------|
| `package.json` | Uses split `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser` | Replace with unified `typescript-eslint` v8 package per D26 |
| `package.json` | Missing `lint:fix` script | Add `"lint:fix": "eslint src/ --fix"` alongside `lint` per D26 |
| `package.json` | Missing `{{CONFIG_PACKAGE}}` dep for `use_app_config.ts` | Add `"{{CONFIG_PACKAGE}}": "workspace:*"` — required, prototype `main.tsx` already imports from it |
| `vite.config.ts` | Uses `__dirname` (CJS) in ESM context | Replace `__dirname` with `import.meta.dirname` per D17 |
| `package.json` | Includes `zustand` dependency | Remove — replaced by `useReducer` + Context |
| `package.json` | Missing `@radix-ui/react-slot` dependency | Add — required for Shadcn Button's `asChild` prop (renders as child element via Radix Slot) |
| `src/components/ui/button.tsx` | Declares `asChild` prop (line 33) but never destructures it (line 37) — spreads as spurious HTML attribute | Import `Slot` from `@radix-ui/react-slot`, destructure `asChild = false` from props, `const Comp = asChild ? Slot : "button"`, render `<Comp>` — standard Shadcn pattern |
| `src/app.tsx` | Missing `config` prop and `AppConfigProvider` wrapper | Add `config` prop to `App`, wrap children in `AppConfigProvider` passing config value |
| `src/main.tsx` | Missing config validation before render | Add runtime guard: assert `config` is non-null object, assert `elementId` is non-empty string — throw descriptive errors. Field-level type safety handled by TypeScript at compile time |
| `src/components/sidebar/sidebar.tsx` | Deep alias import `@/components/ui/button` bypasses `@/components` barrel (D23) | Replace with barrel import: `import { Button } from '@/components'` |
| `src/pages/home_page/home_page.tsx` | Deep alias import `@/components/ui/card` bypasses `@/components` barrel (D23) | Replace with barrel import: `import { Card, ... } from '@/components'` |
| `src/components/index.ts` | Missing re-export of `ui` barrel | Add `export * from './ui'` so downstream consumers can import UI components from `@/components` |

### 2. Frontend Standards Updates

Align the standards skill and all resource docs with the new scaffold reality:

- **SKILL.md directory structure**: Replace the diagram to show the new allowlisted directories only. Fix `interface` → `type` in all code examples. Fix file naming examples that reference `src/viewmodels/`/`src/stores/`. Update resource file listing text (clsx → cn). Add rules for D18–D23 (directory allowlist, barrel-only index files, no side-effects, barrel imports, hooks for providers, factory routes)
- **mvvm-patterns.md**: Remove `viewmodels/` from root — shared hooks live in `hooks/`. Replace Zustand store pattern with `useReducer` + Context pattern (still encapsulated behind hooks). Remove `stores/` directory references. Update import examples to use barrel imports. Fix `interface` → `type` in code examples. Fix `types/generated.ts` deep imports (3 occurrences) → barrel imports from workspace packages
- **tailwind.md**: Replace `clsx` section with `cn()` pattern. Add `cva` for component variants section
- **tanstack.md**: Replace bare `createRouter()` at module scope with `createAppRouter()` factory pattern. Add `declare module` type registration. Update version references. Fix `interface` → `type` in code examples. Fix `types/generated.ts` deep import → barrel import. Fix `services/api/` subdirectory reference → flat `services/`
- **New shadcn.md**: Component anatomy (forwardRef + className + cn + Radix), component hierarchy (Shadcn → Radix → custom), cva for variants, `components/ui/` flat structure, TS standards exceptions (forwardRef/displayName allowed in ui/ only). **500-line constraint**: scope to patterns and rules only — no full component source listings. Reference the scaffold's `components/ui/` files as living examples instead of duplicating code in the resource doc

### 3. Scaffolding Skill Definition Update

Update `SKILL.md` to reflect the new file tree (including `eslint-rules/` directory), tech stack versions (React 19, Vite 7, TS 5.9, etc.), and remove references to deleted directories. Update the MVVM Architecture table (remove `src/models/`/`src/viewmodels/`, add `src/lib/`/`src/services/`). Update the scaffold spec JSON `variables` array to include `CONTRACT_PACKAGE` and `CONFIG_PACKAGE` alongside `PROJECT_NAME`. Review `schemas/input.schema.json` for whether a `config_package` input field is needed.

### 4. Cross-Codebase Consistency

Update files outside the frontend scaffold/standards directories that reference the old stack:

- **`plugin/agents/frontend-dev.md`**: Remove "Zustand for global client state" (line 105), replace with `useReducer` + Context guidance. Update any state management references throughout the agent prompt
- **`plugin/skills/project-scaffolding/templates/project/CLAUDE.md`**: Update "React 18, TypeScript 5" to "React 19, TypeScript 5.9" and adjust architecture description

## Implementation Strategy

Delegate each phase to a subagent to avoid context window exhaustion. The main context orchestrates — reads the plan, dispatches phases in order, commits after each.

| Phase | Subagent Scope | Inputs (subagent reads) | Commit After |
|-------|---------------|------------------------|--------------|
| 1. Templates | Section A — all scaffold template files | Plan (section A + Prototype Deviations), prototype files, current templates | Yes |
| 2. Standards | Section B — frontend-standards skill + resources | Plan (section B), current standards files | Yes |
| 3. Scaffolding SKILL | Section C — scaffolding skill definition + schema | Plan (section C), current SKILL.md + schema | Yes |
| 4. Cross-codebase | Section D — agent + project template | Plan (section D), target files | Yes |
| 5. Tests | Write all tests | Plan (Tests section), completed template + standards files | Yes |
| 6. Build verification | Run tsc, eslint, vite build on scaffolded output | Scaffolding engine, completed templates | Final commit |

Each subagent prompt includes: the relevant plan section verbatim, the list of files to read, and the expected output. Subagents write files; main context reviews and commits. If a subagent's work needs correction, fix in main context before dispatching the next phase.

## Dependencies

1. **Template files first** — all scaffold templates must be updated/created before standards docs can reference them accurately
2. **Standards updates second** — `SKILL.md` and resource docs updated to match new templates
3. **Scaffolding SKILL.md last** — references the template file listing, so update after templates are finalized
4. **ESLint config** — requires the custom `local/allowed-structure` rule file alongside `eslint.config.js`; both must be created together
5. **Cross-codebase files** — `frontend-dev.md` agent and project template `CLAUDE.md` can be updated at any point (no ordering dependency on templates/standards)

## Tests

### Unit Tests

- `test_scaffold_template_files_match_prototype` — every file in the prototype has a corresponding template
- `test_package_json_all_deps_pinned` — no `^`, `~`, or `latest` in version strings
- `test_package_json_has_required_deps` — radix-ui, `@radix-ui/react-slot`, cva, clsx, tailwind-merge, all TanStack packages, eslint 9, typescript-eslint v8 (no zustand)
- `test_package_json_no_removed_deps` — old split TS-ESLint packages (`@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`) absent
- `test_vite_config_root_is_src` — `root: 'src'` present
- `test_vite_config_has_alias` — `resolve.alias` for `@/` present
- `test_no_deleted_directories` — `api/`, `viewmodels/`, `models/`, `stores/`, `utils/` absent from templates
- `test_barrel_files_are_pure_exports` — all `index.ts` files contain only import/export statements
- `test_eslint_config_exists` — `eslint.config.js` present in templates
- `test_components_json_exists` — `components.json` present in templates
- `test_index_html_in_src` — `src/index.html` exists, root-level `index.html` absent
- `test_button_uses_radix_slot` — `button.tsx` imports `Slot` from `@radix-ui/react-slot` and uses it when `asChild` is true
- `test_no_deep_imports` — no template file imports bypass barrels (e.g., `@/components/ui/button` instead of `@/components`) — all use top-level barrel imports only
- `test_app_receives_config_prop` — `app.tsx` accepts config prop and wraps in `AppConfigProvider`
- `test_main_validates_config` — `main.tsx` validates config before rendering
- `test_components_index_reexports_ui` — `components/index.ts` re-exports from `./ui`
- `test_no_interface_keyword_in_standards` — no `interface` keyword in frontend-standards resource code examples (use `type` instead)
- `test_no_types_generated_imports` — no `types/generated.ts` deep imports in standards resource files
- `test_frontend_dev_agent_no_zustand` — `frontend-dev.md` does not reference Zustand
- `test_project_template_claude_md_versions` — project template `CLAUDE.md` references React 19, not React 18

### Integration Tests

- `test_scaffold_output_structure` — run the scaffolding engine with task-107 templates and verify the output directory tree matches expected structure
- `test_scaffold_template_variables_replaced` — all `{{PROJECT_NAME}}`, `{{CONTRACT_PACKAGE}}`, and `{{CONFIG_PACKAGE}}` placeholders are replaced in scaffold output

### Build Verification Tests

- `test_scaffold_tsc_no_emit` — `tsc --noEmit` passes on scaffolded output (install deps, run typecheck)
- `test_scaffold_eslint_passes` — `eslint src/` passes on scaffolded output
- `test_scaffold_vite_build` — `vite build` succeeds on scaffolded output

## Verification

- [ ] All scaffold template files match the prototype (file-for-file comparison)
- [ ] No deleted directories (`api/`, `viewmodels/`, `models/`, `stores/`, `utils/`) remain in templates
- [ ] `components.json` included in scaffold
- [ ] All deps pinned (no `^`, `~`, `latest`)
- [ ] `eslint.config.js` included with flat config format
- [ ] `frontend-standards/SKILL.md` updated with new directory structure and rules D18–D23
- [ ] `resources/shadcn.md` created with component patterns and hierarchy
- [ ] `resources/mvvm-patterns.md` updated (no root viewmodels)
- [ ] `resources/tailwind.md` updated with `cn()` pattern
- [ ] `resources/tanstack.md` updated with router factory pattern
- [ ] `frontend-scaffolding/SKILL.md` updated with new file listing
- [ ] No `interface` keyword in frontend-standards code examples (all `type`)
- [ ] No `types/generated.ts` deep imports in resource files
- [ ] `button.tsx` uses `@radix-ui/react-slot` `Slot` for `asChild` prop
- [ ] No deep relative imports in template files (all use `@/` barrel imports)
- [ ] `app.tsx` receives config prop and wraps in `AppConfigProvider`
- [ ] `main.tsx` validates config before rendering
- [ ] `frontend-dev.md` agent has no Zustand references
- [ ] Project template `CLAUDE.md` references React 19, TypeScript 5.9
- [ ] Scaffold spec JSON in `SKILL.md` includes all template variables
- [ ] Build test passes: `tsc --noEmit`, `eslint src/`, `vite build` on scaffolded output
