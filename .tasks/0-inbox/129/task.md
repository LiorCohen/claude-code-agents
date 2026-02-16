---
id: 129
title: Frontend workflow guidelines — step-by-step recipes for common coding tasks
status: inbox
priority: medium
created: 2026-02-13 16:00 UTC
depends_on: [107]
blocks: []
---

# Task 129: Frontend workflow guidelines — step-by-step recipes for common coding tasks

## Description

Create a frontend standards resource documenting step-by-step workflows for common coding tasks. These recipes teach Claude (and developers) the exact sequence of file changes needed for each operation, ensuring consistency with the scaffold structure and conventions established in Task #107.

### Workflows to document

1. **Adding a new page** — Create page component in `pages/{name}/`, add barrel, add route in `routes.tsx`, export from `pages/index.ts`, add nav item in Sidebar
2. **Adding a new Shadcn component** — Copy pattern from existing `components/ui/` component, add to barrel
3. **Adding a new custom component** — Create directory with barrel in `components/{name}/`, export from `components/index.ts`
4. **Adding an API service** — Create service file in `services/`, export from barrel, create React Query hook for data fetching
5. **Updating config** — How config flows from `mount()` → `App` → components via `useAppConfig()`, what to change when config shape changes
6. **Adding a Zustand store** — Create hook that manages store internally, export from `hooks/` barrel
7. **Adding a page-specific ViewModel** — Colocate in `pages/{name}/`, connect view to ViewModel via hook

### Output

New file: `plugin/skills/components/frontend/frontend-standards/resources/workflows.md`

## Open Questions

_(none yet)_

## Decisions

_(none yet)_
