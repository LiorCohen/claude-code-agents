---
generated: 2026-02-13 19:45 UTC
branch: feature/task-107-frontend-scaffold-radix-shadcn
commits: 8
---

# Changes — Task #107

## Summary

| File | Added | Removed |
|------|-------|---------|
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/package.json`](plugin/skills/components/frontend/frontend-scaffolding/templates/package.json) | +25 | -16 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/vite.config.ts`](plugin/skills/components/frontend/frontend-scaffolding/templates/vite.config.ts) | +7 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/eslint.config.js`](plugin/skills/components/frontend/frontend-scaffolding/templates/eslint.config.js) | +92 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/eslint-rules/allowed-structure.js`](plugin/skills/components/frontend/frontend-scaffolding/templates/eslint-rules/allowed-structure.js) | +55 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/components.json`](plugin/skills/components/frontend/frontend-scaffolding/templates/components.json) | +12 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/.gitignore`](plugin/skills/components/frontend/frontend-scaffolding/templates/.gitignore) | +3 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/index.html`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/index.html) | +1 | -1 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/index.ts`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/index.ts) | +4 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/main.tsx`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/main.tsx) | +17 | -8 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/app.tsx`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/app.tsx) | +14 | -29 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/vite-env.d.ts`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/vite-env.d.ts) | +1 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/lib/utils.ts`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/lib/utils.ts) | +5 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/lib/index.ts`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/lib/index.ts) | +1 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/ui/button.tsx`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/ui/button.tsx) | +51 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/ui/card.tsx`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/ui/card.tsx) | +43 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/ui/index.ts`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/ui/index.ts) | +2 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/layout/layout.tsx`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/layout/layout.tsx) | +13 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/layout/index.ts`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/layout/index.ts) | +1 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/sidebar/sidebar.tsx`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/sidebar/sidebar.tsx) | +41 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/sidebar/index.ts`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/sidebar/index.ts) | +1 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/index.ts`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/index.ts) | +2 | -1 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/sidebar.tsx`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/sidebar.tsx) | +0 | -47 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/routes/routes.tsx`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/routes/routes.tsx) | +29 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/routes/index.ts`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/routes/index.ts) | +1 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/hooks/use_app_config.tsx`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/hooks/use_app_config.tsx) | +21 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/hooks/use_app_router.ts`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/hooks/use_app_router.ts) | +8 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/hooks/use_query_client.ts`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/hooks/use_query_client.ts) | +18 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/hooks/index.ts`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/hooks/index.ts) | +3 | -3 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/pages/home_page/home_page.tsx`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/pages/home_page/home_page.tsx) | +26 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/pages/home_page/index.ts`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/pages/home_page/index.ts) | +1 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/pages/index.ts`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/pages/index.ts) | +1 | -4 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/pages/home.tsx`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/pages/home.tsx) | +0 | -22 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/services/index.ts`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/services/index.ts) | +1 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/types/index.ts`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/types/index.ts) | +1 | -0 |
| [`plugin/skills/components/frontend/frontend-scaffolding/templates/src/api/index.ts`](plugin/skills/components/frontend/frontend-scaffolding/templates/src/api/index.ts) | +0 | -3 |
| [`plugin/skills/components/frontend/frontend-scaffolding/SKILL.md`](plugin/skills/components/frontend/frontend-scaffolding/SKILL.md) | +77 | -33 |
| [`plugin/skills/components/frontend/frontend-scaffolding/schemas/input.schema.json`](plugin/skills/components/frontend/frontend-scaffolding/schemas/input.schema.json) | +9 | -1 |
| [`plugin/skills/components/frontend/frontend-standards/SKILL.md`](plugin/skills/components/frontend/frontend-standards/SKILL.md) | +223 | -77 |
| [`plugin/skills/components/frontend/frontend-standards/resources/mvvm-patterns.md`](plugin/skills/components/frontend/frontend-standards/resources/mvvm-patterns.md) | +92 | -25 |
| [`plugin/skills/components/frontend/frontend-standards/resources/shadcn.md`](plugin/skills/components/frontend/frontend-standards/resources/shadcn.md) | +197 | -0 |
| [`plugin/skills/components/frontend/frontend-standards/resources/tailwind.md`](plugin/skills/components/frontend/frontend-standards/resources/tailwind.md) | +88 | -14 |
| [`plugin/skills/components/frontend/frontend-standards/resources/tanstack.md`](plugin/skills/components/frontend/frontend-standards/resources/tanstack.md) | +69 | -19 |
| [`plugin/agents/frontend-dev.md`](plugin/agents/frontend-dev.md) | +1 | -1 |
| [`plugin/skills/project-scaffolding/templates/project/CLAUDE.md`](plugin/skills/project-scaffolding/templates/project/CLAUDE.md) | +1 | -1 |
| [`plugin/skills/typescript-standards/SKILL.md`](plugin/skills/typescript-standards/SKILL.md) | +1 | -1 |
| [`plugin/skills/typescript-standards/resources/module-system.md`](plugin/skills/typescript-standards/resources/module-system.md) | +30 | -0 |
| [`plugin/skills/components/backend/backend-standards/SKILL.md`](plugin/skills/components/backend/backend-standards/SKILL.md) | +27 | -0 |
| [`tests/src/tests/unit/skills/frontend-scaffold/templates.test.ts`](tests/src/tests/unit/skills/frontend-scaffold/templates.test.ts) | +301 | -0 |
| [`tests/src/tests/unit/skills/frontend-scaffold/standards.test.ts`](tests/src/tests/unit/skills/frontend-scaffold/standards.test.ts) | +283 | -0 |
