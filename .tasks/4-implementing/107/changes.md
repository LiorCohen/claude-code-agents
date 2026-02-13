
---

## Detailed Diffs

diff --git a/plugin/agents/frontend-dev.md b/plugin/agents/frontend-dev.md
index 1c271b3..75f01fe 100644
--- a/plugin/agents/frontend-dev.md
+++ b/plugin/agents/frontend-dev.md
@@ -102,7 +102,7 @@ Follow all rules defined in the `typescript-standards` and `frontend-standards`
 - TanStack Table for tabular data
 - TanStack Form for complex forms
 - TailwindCSS only for styling
-- Zustand for global client state
+- useReducer + Context for global client state, encapsulated behind hooks (no external state library)
 
 **Code Quality:**
 - All filenames use `lowercase_with_underscores`
diff --git a/plugin/skills/components/backend/backend-standards/SKILL.md b/plugin/skills/components/backend/backend-standards/SKILL.md
index 4b0a0fc..ef1de40 100644
--- a/plugin/skills/components/backend/backend-standards/SKILL.md
+++ b/plugin/skills/components/backend/backend-standards/SKILL.md
@@ -359,6 +359,33 @@ Wrap business operations with spans using `@opentelemetry/api`.
 
 ---
 
+## Intra-Module Imports
+
+**Inside a module, nothing should ever import from its own `index.ts`.** All imports within a module must use relative paths. The barrel is the module's public API for external consumers only. For nested modules, the same barrel rules apply.
+
+```typescript
+// Given this structure:
+// controllers/
+// ├── index.ts          ← barrel: re-exports all routers
+// ├── users/
+// │   ├── index.ts
+// │   └── users_router.ts
+// └── health/
+//     ├── index.ts
+//     └── health_router.ts
+
+// In controllers/users/users_router.ts:
+
+// GOOD: relative path to sibling sub-module barrel
+import { healthCheck } from '../health';
+
+// BAD: importing from own module's barrel
+import { healthCheck } from '@/controllers';
+import { healthCheck } from '@/controllers/health';
+```
+
+---
+
 ## Implementation Order
 
 When implementing a new feature, follow this order to minimize rework and ensure clean architecture:
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/SKILL.md b/plugin/skills/components/frontend/frontend-scaffolding/SKILL.md
index 8dc278b..918a709 100644
--- a/plugin/skills/components/frontend/frontend-scaffolding/SKILL.md
+++ b/plugin/skills/components/frontend/frontend-scaffolding/SKILL.md
@@ -16,53 +16,82 @@ Use when creating webapp components. Supports multiple named instances (e.g., `w
 
 ```text
 components/<webapp-name>/
+├── .gitignore
+├── components.json
+├── eslint.config.js
+├── eslint-rules/
+│   └── allowed-structure.js
 ├── package.json
 ├── tsconfig.json
 ├── vite.config.ts
-├── index.html
-├── .gitignore
 └── src/
+    ├── index.html
+    ├── index.ts
+    ├── index.css
     ├── main.tsx              # Entry point
     ├── app.tsx               # Root app component
-    ├── index.css             # Global styles (Tailwind)
-    ├── pages/
-    │   ├── index.ts          # Empty barrel (add pages as features are implemented)
-    │   └── home.tsx          # Home page
+    ├── vite-env.d.ts
     ├── components/
     │   ├── index.ts
-    │   └── sidebar.tsx       # Navigation sidebar
-    ├── viewmodels/           # ViewModel hooks (empty, for user)
-    ├── models/               # Domain models (empty, for user)
-    ├── services/             # API services (empty, for user)
-    ├── stores/               # State stores (empty, for user)
-    ├── types/                # Type definitions (empty, for user)
-    ├── utils/                # Utilities (empty, for user)
+    │   ├── layout/
+    │   │   ├── index.ts
+    │   │   └── layout.tsx
+    │   ├── sidebar/
+    │   │   ├── index.ts
+    │   │   └── sidebar.tsx
+    │   └── ui/
+    │       ├── index.ts
+    │       ├── button.tsx
+    │       └── card.tsx
     ├── hooks/
-    │   └── index.ts          # Empty barrel (add hooks as features are implemented)
-    └── api/
-        └── index.ts          # Empty barrel (add API clients as features are implemented)
+    │   ├── index.ts
+    │   ├── use_app_config.tsx
+    │   ├── use_app_router.ts
+    │   └── use_query_client.ts
+    ├── lib/
+    │   ├── index.ts
+    │   └── utils.ts
+    ├── pages/
+    │   ├── index.ts
+    │   └── home_page/
+    │       ├── index.ts
+    │       └── home_page.tsx
+    ├── routes/
+    │   ├── index.ts
+    │   └── routes.tsx
+    ├── services/
+    │   └── index.ts
+    └── types/
+        └── index.ts
 ```
 
 ## MVVM Architecture
 
 | Layer | Purpose | Location |
 |-------|---------|----------|
-| **M**odel | Domain types and business logic | `src/models/` |
-| **V**iew | React components (pages, components) | `src/pages/`, `src/components/` |
-| **V**iew**M**odel | State and logic hooks | `src/viewmodels/` |
-
-Plus supporting directories for services, stores, and API clients.
+| **V**iew | React components (pages, layout, UI primitives) | `src/pages/`, `src/components/` |
+| **V**iew**M**odel | State and logic hooks | `src/hooks/` |
+| **M**odel | API client services | `src/services/` |
+| Utilities | `cn()`, shared helpers | `src/lib/` |
+| Routes | TanStack Router route definitions | `src/routes/` |
+| Types | Shared type definitions | `src/types/` |
 
 ## Tech Stack
 
 | Technology | Purpose |
 |------------|---------|
-| React 18 | UI framework |
-| TypeScript | Type safety |
-| Vite | Build tool and dev server |
-| TailwindCSS v4 | Utility-first CSS (CSS-based config) |
+| React 19 | UI framework |
+| TypeScript 5.9 | Type safety |
+| Vite 7 | Build tool and dev server |
+| Vitest 4 | Unit testing framework |
+| ESLint 9 | Linting (flat config) |
+| Tailwind CSS 4 | Utility-first CSS (CSS-based config) |
 | TanStack Router | Type-safe routing |
 | TanStack Query | Server state management |
+| TanStack Table | Headless table primitives |
+| TanStack Form | Type-safe form management |
+| Radix UI / Shadcn | Accessible component primitives |
+| class-variance-authority, clsx, tailwind-merge | Style composition utilities |
 
 ## Multiple Instances
 
@@ -79,8 +108,8 @@ Supports multiple named frontend instances:
 | Variable | Description |
 |----------|-------------|
 | `{{PROJECT_NAME}}` | Project name |
-| `{{PROJECT_DESCRIPTION}}` | Project description |
-| `{{PRIMARY_DOMAIN}}` | Primary business domain |
+| `{{CONTRACT_PACKAGE}}` | Workspace package name for API contract types (e.g., `@my-project/api-types`) |
+| `{{CONFIG_PACKAGE}}` | Workspace package name for webapp configuration types (e.g., `@my-project/config`) |
 
 ## Usage
 
@@ -102,19 +131,32 @@ All templates are colocated in this skill's `templates/` directory:
 
 ```text
 skills/components/frontend/frontend-scaffolding/templates/
+├── .gitignore
+├── components.json
+├── eslint.config.js
+├── eslint-rules/
+│   └── allowed-structure.js
 ├── package.json
 ├── tsconfig.json
 ├── vite.config.ts
-├── index.html
-├── .gitignore
 └── src/
+    ├── index.html
+    ├── index.ts
+    ├── index.css
     ├── main.tsx
     ├── app.tsx
-    ├── index.css
-    ├── pages/
+    ├── vite-env.d.ts
     ├── components/
+    │   ├── index.ts
+    │   ├── layout/
+    │   ├── sidebar/
+    │   └── ui/
     ├── hooks/
-    └── api/
+    ├── lib/
+    ├── pages/
+    ├── routes/
+    ├── services/
+    └── types/
 ```
 
 ## Config Schema
@@ -177,6 +219,8 @@ To scaffold a frontend component, build a spec and invoke the engine:
 | Variable | Source |
 |----------|--------|
 | `PROJECT_NAME` | From `sdd-settings.yaml` project name |
+| `CONTRACT_PACKAGE` | Workspace package name for API contract types |
+| `CONFIG_PACKAGE` | Workspace package name for webapp configuration types |
 
 ### Operations
 
@@ -184,7 +228,7 @@ To scaffold a frontend component, build a spec and invoke the engine:
 {
   "target_dir": "<project-root>",
   "base_dir": "<plugin-root>/skills",
-  "variables": { "PROJECT_NAME": "<project-name>" },
+  "variables": { "PROJECT_NAME": "<project-name>", "CONTRACT_PACKAGE": "<contract-package>", "CONFIG_PACKAGE": "<config-package>" },
   "operations": [
     {
       "type": "template_dir",
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/schemas/input.schema.json b/plugin/skills/components/frontend/frontend-scaffolding/schemas/input.schema.json
index 7bd0a60..db45e60 100644
--- a/plugin/skills/components/frontend/frontend-scaffolding/schemas/input.schema.json
+++ b/plugin/skills/components/frontend/frontend-scaffolding/schemas/input.schema.json
@@ -27,7 +27,15 @@
         "type": "string",
         "description": "Contract name consumed by this webapp"
       }
+    },
+    "contract_package": {
+      "type": "string",
+      "description": "Workspace package name for API contract types (e.g., @my-project/api-types)"
+    },
+    "config_package": {
+      "type": "string",
+      "description": "Workspace package name for webapp configuration types (e.g., @my-project/config)"
     }
   },
-  "required": ["name"]
+  "required": ["name", "contract_package", "config_package"]
 }
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/.gitignore b/plugin/skills/components/frontend/frontend-scaffolding/templates/.gitignore
new file mode 100644
index 0000000..804bd4a
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/.gitignore
@@ -0,0 +1,3 @@
+node_modules
+dist
+*.local
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/components.json b/plugin/skills/components/frontend/frontend-scaffolding/templates/components.json
new file mode 100644
index 0000000..a8d7611
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/components.json
@@ -0,0 +1,12 @@
+{
+  "$schema": "https://ui.shadcn.com/schema.json",
+  "style": "new-york",
+  "tailwind": {},
+  "aliases": {
+    "components": "@/components",
+    "utils": "@/lib/utils",
+    "ui": "@/components/ui",
+    "lib": "@/lib",
+    "hooks": "@/hooks"
+  }
+}
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/eslint-rules/allowed-structure.js b/plugin/skills/components/frontend/frontend-scaffolding/templates/eslint-rules/allowed-structure.js
new file mode 100644
index 0000000..d47080e
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/eslint-rules/allowed-structure.js
@@ -0,0 +1,55 @@
+const allowedRootFiles = new Set([
+  'index.ts',
+  'main.tsx',
+  'app.tsx',
+  'vite-env.d.ts',
+  'index.css',
+]);
+
+const allowedDirs = new Set([
+  'components',
+  'hooks',
+  'lib',
+  'pages',
+  'routes',
+  'services',
+  'types',
+]);
+
+export default {
+  meta: {
+    type: 'problem',
+    docs: {
+      description: 'Enforce allowed src/ directory structure (D18)',
+    },
+    messages: {
+      disallowed:
+        'File is in a disallowed location. Allowed src/ subdirectories: components/, hooks/, lib/, pages/, routes/, services/, types/. Allowed root files: index.ts, main.tsx, app.tsx, vite-env.d.ts, index.css.',
+    },
+    schema: [],
+  },
+  create(context) {
+    const filename = context.filename ?? context.getFilename();
+    const srcIndex = filename.lastIndexOf('/src/');
+    if (srcIndex === -1) return {};
+
+    const relativePath = filename.slice(srcIndex + 5);
+
+    // Root-level file in src/?
+    if (!relativePath.includes('/') && allowedRootFiles.has(relativePath)) {
+      return {};
+    }
+
+    // In an allowed directory?
+    const topDir = relativePath.split('/')[0];
+    if (allowedDirs.has(topDir)) {
+      return {};
+    }
+
+    return {
+      Program(node) {
+        context.report({ node, messageId: 'disallowed' });
+      },
+    };
+  },
+};
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/eslint.config.js b/plugin/skills/components/frontend/frontend-scaffolding/templates/eslint.config.js
new file mode 100644
index 0000000..f5f7318
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/eslint.config.js
@@ -0,0 +1,92 @@
+import tseslint from 'typescript-eslint';
+import reactPlugin from 'eslint-plugin-react';
+import reactHooksPlugin from 'eslint-plugin-react-hooks';
+import allowedStructure from './eslint-rules/allowed-structure.js';
+
+export default tseslint.config(
+  ...tseslint.configs.strictTypeChecked,
+  {
+    languageOptions: {
+      parserOptions: {
+        projectService: true,
+        tsconfigRootDir: import.meta.dirname,
+      },
+    },
+    plugins: {
+      react: reactPlugin,
+      'react-hooks': reactHooksPlugin,
+      local: { rules: { 'allowed-structure': allowedStructure } },
+    },
+    settings: {
+      react: {
+        version: 'detect',
+      },
+    },
+    rules: {
+      // React
+      ...reactPlugin.configs.recommended.rules,
+      ...reactHooksPlugin.configs.recommended.rules,
+      'react/react-in-jsx-scope': 'off',
+      'react/prop-types': 'off',
+
+      // No let — use const
+      'prefer-const': 'error',
+      'no-var': 'error',
+
+      // No function keyword — use arrow functions
+      'func-style': ['error', 'expression'],
+
+      // No default exports, no classes (except Error subclasses)
+      'no-restricted-syntax': [
+        'error',
+        {
+          selector: 'ExportDefaultDeclaration',
+          message: 'Use named exports instead of default exports',
+        },
+        {
+          selector: 'ClassDeclaration:not([superClass.name="Error"])',
+          message: 'Use functions and types instead of classes',
+        },
+        {
+          selector: 'ClassExpression:not([superClass.name="Error"])',
+          message: 'Use functions and types instead of classes',
+        },
+      ],
+
+      // No any
+      '@typescript-eslint/no-explicit-any': 'error',
+      '@typescript-eslint/no-unsafe-assignment': 'error',
+      '@typescript-eslint/no-unsafe-call': 'error',
+      '@typescript-eslint/no-unsafe-member-access': 'error',
+      '@typescript-eslint/no-unsafe-return': 'error',
+
+      // Consistent type imports
+      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
+
+      // Prefer nullish coalescing
+      '@typescript-eslint/prefer-nullish-coalescing': 'error',
+
+      // Explicit module boundary types
+      '@typescript-eslint/explicit-module-boundary-types': 'error',
+
+      // Banned utility libraries + barrel imports enforcement
+      'no-restricted-imports': ['error', {
+        patterns: [
+          { group: ['lodash', 'lodash/*'], message: 'lodash is banned — use native methods' },
+          { group: ['ramda', 'ramda/*'], message: 'ramda is banned — use native methods' },
+          { group: ['immer'], message: 'immer is banned — use immutable patterns' },
+          { group: ['@/lib/*'], message: 'Import from @/lib barrel' },
+          { group: ['@/hooks/*'], message: 'Import from @/hooks barrel' },
+          { group: ['@/routes/*'], message: 'Import from @/routes barrel' },
+          { group: ['@/services/*'], message: 'Import from @/services barrel' },
+          { group: ['@/types/*'], message: 'Import from @/types barrel' },
+          { group: ['@/components/**'], message: 'Import from @/components barrel' },
+          { group: ['@/pages/**'], message: 'Import from @/pages barrel' },
+        ],
+      }],
+
+      // Custom: allowed directory structure
+      'local/allowed-structure': 'error',
+    },
+  },
+);
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/package.json b/plugin/skills/components/frontend/frontend-scaffolding/templates/package.json
index 41e86f5..99b5d2d 100644
--- a/plugin/skills/components/frontend/frontend-scaffolding/templates/package.json
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/package.json
@@ -9,27 +9,36 @@
     "preview": "vite preview",
     "test": "vitest",
     "lint": "eslint src/",
+    "lint:fix": "eslint src/ --fix",
     "typecheck": "tsc --noEmit"
   },
   "dependencies": {
     "{{CONTRACT_PACKAGE}}": "workspace:*",
-    "react": "^18.2.0",
-    "react-dom": "^18.2.0",
-    "@tanstack/react-query": "^5.8.0"
+    "{{CONFIG_PACKAGE}}": "workspace:*",
+    "@radix-ui/react-slot": "1.2.3",
+    "@tanstack/react-form": "1.28.0",
+    "@tanstack/react-query": "5.90.21",
+    "@tanstack/react-router": "1.159.5",
+    "@tanstack/react-table": "8.21.3",
+    "class-variance-authority": "0.7.1",
+    "clsx": "2.1.1",
+    "radix-ui": "1.4.3",
+    "react": "19.2.4",
+    "react-dom": "19.2.4",
+    "tailwind-merge": "3.4.0"
   },
   "devDependencies": {
-    "@tailwindcss/vite": "^4.0.0",
-    "@types/react": "^18.2.0",
-    "@types/react-dom": "^18.2.0",
-    "@vitejs/plugin-react": "^4.2.0",
-    "tailwindcss": "^4.0.0",
-    "typescript": "^5.3.0",
-    "vite": "^5.0.0",
-    "vitest": "^1.0.0",
-    "eslint": "^8.55.0",
-    "eslint-plugin-react": "^7.33.2",
-    "eslint-plugin-react-hooks": "^4.6.0",
-    "@typescript-eslint/eslint-plugin": "^6.15.0",
-    "@typescript-eslint/parser": "^6.15.0"
+    "@tailwindcss/vite": "4.1.18",
+    "@types/react": "19.2.14",
+    "@types/react-dom": "19.2.3",
+    "@vitejs/plugin-react": "5.1.4",
+    "eslint": "9.21.0",
+    "eslint-plugin-react": "7.37.4",
+    "eslint-plugin-react-hooks": "5.2.0",
+    "tailwindcss": "4.1.18",
+    "typescript": "5.9.3",
+    "typescript-eslint": "8.55.0",
+    "vite": "7.3.1",
+    "vitest": "4.0.18"
   }
 }
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/api/index.ts b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/api/index.ts
deleted file mode 100644
index b24e4e7..0000000
--- a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/api/index.ts
+++ /dev/null
@@ -1,3 +0,0 @@
-// API index
-// Add API client exports here as features are implemented
-// Example: export { usersApi } from './users';
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/app.tsx b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/app.tsx
index 22ae61e..b5386ac 100644
--- a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/app.tsx
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/app.tsx
@@ -1,36 +1,21 @@
-import { useState } from 'react';
-import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
-import { Sidebar } from './components';
-import { HomePage } from './pages';
+import { QueryClientProvider } from '@tanstack/react-query';
+import { RouterProvider } from '@tanstack/react-router';
+import { useAppQueryClient, useAppRouter, AppConfigProvider } from '@/hooks';
+import type { WebappConfig } from '{{CONFIG_PACKAGE}}';
 
-const queryClient = new QueryClient({
-  defaultOptions: {
-    queries: {
-      staleTime: 5 * 60 * 1000,
-      retry: 1,
-    },
-  },
-});
-
-const PageRouter = ({ currentPage }: { currentPage: string }): JSX.Element => {
-  switch (currentPage) {
-    case 'home':
-    default:
-      return <HomePage />;
-  }
+type AppProps = {
+  readonly config: WebappConfig;
 };
 
-export const App = (): JSX.Element => {
-  const [currentPage, setCurrentPage] = useState('home');
+export const App = ({ config }: AppProps): React.JSX.Element => {
+  const queryClient = useAppQueryClient();
+  const router = useAppRouter();
 
   return (
-    <QueryClientProvider client={queryClient}>
-      <div className="min-h-screen bg-gray-100 flex">
-        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
-        <main className="flex-1">
-          <PageRouter currentPage={currentPage} />
-        </main>
-      </div>
-    </QueryClientProvider>
+    <AppConfigProvider config={config}>
+      <QueryClientProvider client={queryClient}>
+        <RouterProvider router={router} />
+      </QueryClientProvider>
+    </AppConfigProvider>
   );
 };
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/index.ts b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/index.ts
index afbf681..2a703a7 100644
--- a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/index.ts
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/index.ts
@@ -1,2 +1,3 @@
-// Components index - exports only
+export { Layout } from './layout';
 export { Sidebar } from './sidebar';
+export * from './ui';
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/layout/index.ts b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/layout/index.ts
new file mode 100644
index 0000000..a101e27
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/layout/index.ts
@@ -0,0 +1 @@
+export { Layout } from './layout';
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/layout/layout.tsx b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/layout/layout.tsx
new file mode 100644
index 0000000..976e6b6
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/layout/layout.tsx
@@ -0,0 +1,13 @@
+import { Outlet } from '@tanstack/react-router';
+import { Sidebar } from '../sidebar';
+
+export const Layout = (): React.JSX.Element => {
+  return (
+    <div className="min-h-screen bg-background flex">
+      <Sidebar />
+      <main className="flex-1">
+        <Outlet />
+      </main>
+    </div>
+  );
+};
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/sidebar.tsx b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/sidebar.tsx
deleted file mode 100644
index 5d590d5..0000000
--- a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/sidebar.tsx
+++ /dev/null
@@ -1,47 +0,0 @@
-// Component: Sidebar
-// Navigation sidebar with page links
-type SidebarProps = {
-  readonly currentPage: string;
-  readonly onNavigate: (page: string) => void;
-};
-
-type NavItem = {
-  readonly id: string;
-  readonly label: string;
-  readonly icon: string;
-};
-
-const navItems: readonly NavItem[] = [
-  { id: 'home', label: 'Home', icon: '🏠' },
-  // Add navigation items here as pages are implemented
-  // Example: { id: 'users', label: 'Users', icon: '👥' },
-];
-
-export const Sidebar = ({ currentPage, onNavigate }: SidebarProps): JSX.Element => {
-  return (
-    <aside className="w-64 bg-gray-800 text-white min-h-screen p-4">
-      <div className="mb-8">
-        <h1 className="text-xl font-bold">{'{{PROJECT_NAME}}'}</h1>
-      </div>
-      <nav>
-        <ul className="space-y-2">
-          {navItems.map((item) => (
-            <li key={item.id}>
-              <button
-                onClick={() => onNavigate(item.id)}
-                className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
-                  currentPage === item.id
-                    ? 'bg-gray-700 text-white'
-                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
-                }`}
-              >
-                <span>{item.icon}</span>
-                <span>{item.label}</span>
-              </button>
-            </li>
-          ))}
-        </ul>
-      </nav>
-    </aside>
-  );
-};
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/sidebar/index.ts b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/sidebar/index.ts
new file mode 100644
index 0000000..bfed624
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/sidebar/index.ts
@@ -0,0 +1 @@
+export { Sidebar } from './sidebar';
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/sidebar/sidebar.tsx b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/sidebar/sidebar.tsx
new file mode 100644
index 0000000..d283ba0
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/sidebar/sidebar.tsx
@@ -0,0 +1,41 @@
+import { Link, useRouterState } from '@tanstack/react-router';
+import { Button } from '../ui';
+import { cn } from '@/lib';
+
+type NavItem = {
+  readonly path: string;
+  readonly label: string;
+};
+
+const navItems: readonly NavItem[] = [
+  { path: '/', label: 'Home' },
+  // Add navigation items here as pages are implemented
+];
+
+export const Sidebar = (): React.JSX.Element => {
+  const routerState = useRouterState();
+  const currentPath = routerState.location.pathname;
+
+  return (
+    <aside className="w-64 border-r bg-muted/40 min-h-screen p-4">
+      <div className="mb-8">
+        <h1 className="text-xl font-bold px-2">{'{{PROJECT_NAME}}'}</h1>
+      </div>
+      <nav>
+        <ul className="space-y-1">
+          {navItems.map((item) => (
+            <li key={item.path}>
+              <Button
+                variant={currentPath === item.path ? 'secondary' : 'ghost'}
+                className={cn('w-full justify-start')}
+                asChild
+              >
+                <Link to={item.path}>{item.label}</Link>
+              </Button>
+            </li>
+          ))}
+        </ul>
+      </nav>
+    </aside>
+  );
+};
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/ui/button.tsx b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/ui/button.tsx
new file mode 100644
index 0000000..8f07780
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/ui/button.tsx
@@ -0,0 +1,51 @@
+import * as React from 'react';
+import { Slot } from '@radix-ui/react-slot';
+import { cva, type VariantProps } from 'class-variance-authority';
+import { cn } from '@/lib';
+
+const buttonVariants = cva(
+  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
+  {
+    variants: {
+      variant: {
+        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
+        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
+        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
+        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
+        ghost: 'hover:bg-accent hover:text-accent-foreground',
+        link: 'text-primary underline-offset-4 hover:underline',
+      },
+      size: {
+        default: 'h-9 px-4 py-2',
+        sm: 'h-8 rounded-md px-3 text-xs',
+        lg: 'h-10 rounded-md px-8',
+        icon: 'h-9 w-9',
+      },
+    },
+    defaultVariants: {
+      variant: 'default',
+      size: 'default',
+    },
+  },
+);
+
+export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
+  VariantProps<typeof buttonVariants> & {
+    readonly asChild?: boolean;
+  };
+
+const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
+  ({ className, variant, size, asChild = false, ...props }, ref) => {
+    const Comp = asChild ? Slot : 'button';
+    return (
+      <Comp
+        className={cn(buttonVariants({ variant, size, className }))}
+        ref={ref}
+        {...props}
+      />
+    );
+  },
+);
+Button.displayName = 'Button';
+
+export { Button, buttonVariants };
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/ui/card.tsx b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/ui/card.tsx
new file mode 100644
index 0000000..9fb7425
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/ui/card.tsx
@@ -0,0 +1,43 @@
+import * as React from 'react';
+import { cn } from '@/lib';
+
+const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
+  ({ className, ...props }, ref) => (
+    <div
+      ref={ref}
+      className={cn('rounded-xl border bg-card text-card-foreground shadow', className)}
+      {...props}
+    />
+  ),
+);
+Card.displayName = 'Card';
+
+const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
+  ({ className, ...props }, ref) => (
+    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
+  ),
+);
+CardHeader.displayName = 'CardHeader';
+
+const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
+  ({ className, ...props }, ref) => (
+    <h3 ref={ref} className={cn('font-semibold leading-none tracking-tight', className)} {...props} />
+  ),
+);
+CardTitle.displayName = 'CardTitle';
+
+const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
+  ({ className, ...props }, ref) => (
+    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
+  ),
+);
+CardDescription.displayName = 'CardDescription';
+
+const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
+  ({ className, ...props }, ref) => (
+    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
+  ),
+);
+CardContent.displayName = 'CardContent';
+
+export { Card, CardHeader, CardTitle, CardDescription, CardContent };
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/ui/index.ts b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/ui/index.ts
new file mode 100644
index 0000000..a96ba82
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/components/ui/index.ts
@@ -0,0 +1,2 @@
+export { Button, buttonVariants, type ButtonProps } from './button';
+export { Card, CardHeader, CardTitle, CardDescription, CardContent } from './card';
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/hooks/index.ts b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/hooks/index.ts
index 4d58132..e0c8090 100644
--- a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/hooks/index.ts
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/hooks/index.ts
@@ -1,3 +1,3 @@
-// Hooks index
-// Add hook exports here as features are implemented
-// Example: export { useUser, useCreateUser } from './use-users';
+export { useAppQueryClient } from './use_query_client';
+export { useAppRouter } from './use_app_router';
+export { useAppConfig, AppConfigProvider } from './use_app_config';
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/hooks/use_app_config.tsx b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/hooks/use_app_config.tsx
new file mode 100644
index 0000000..d5964d9
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/hooks/use_app_config.tsx
@@ -0,0 +1,21 @@
+import { createContext, useContext, type ReactNode } from 'react';
+import type { WebappConfig } from '{{CONFIG_PACKAGE}}';
+
+const AppConfigContext = createContext<WebappConfig | null>(null);
+
+type AppConfigProviderProps = {
+  readonly config: WebappConfig;
+  readonly children: ReactNode;
+};
+
+export const AppConfigProvider = ({ config, children }: AppConfigProviderProps): React.JSX.Element => (
+  <AppConfigContext.Provider value={config}>{children}</AppConfigContext.Provider>
+);
+
+export const useAppConfig = (): WebappConfig => {
+  const config = useContext(AppConfigContext);
+  if (config === null) {
+    throw new Error('useAppConfig must be used within an AppConfigProvider');
+  }
+  return config;
+};
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/hooks/use_app_router.ts b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/hooks/use_app_router.ts
new file mode 100644
index 0000000..a21ccb7
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/hooks/use_app_router.ts
@@ -0,0 +1,8 @@
+import { useState } from 'react';
+import { createAppRouter, type AppRouter } from '@/routes';
+
+export const useAppRouter = (): AppRouter => {
+  const [router] = useState(createAppRouter);
+
+  return router;
+};
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/hooks/use_query_client.ts b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/hooks/use_query_client.ts
new file mode 100644
index 0000000..5e2fcb1
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/hooks/use_query_client.ts
@@ -0,0 +1,18 @@
+import { useState } from 'react';
+import { QueryClient } from '@tanstack/react-query';
+
+export const useAppQueryClient = (): QueryClient => {
+  const [queryClient] = useState(
+    () =>
+      new QueryClient({
+        defaultOptions: {
+          queries: {
+            staleTime: 5 * 60 * 1000,
+            retry: 1,
+          },
+        },
+      }),
+  );
+
+  return queryClient;
+};
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/index.html b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/index.html
similarity index 81%
rename from plugin/skills/components/frontend/frontend-scaffolding/templates/index.html
rename to plugin/skills/components/frontend/frontend-scaffolding/templates/src/index.html
index ad5b780..5958408 100644
--- a/plugin/skills/components/frontend/frontend-scaffolding/templates/index.html
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/index.html
@@ -7,6 +7,6 @@
   </head>
   <body>
     <div id="root"></div>
-    <script type="module" src="/src/main.tsx"></script>
+    <script type="module" src="./index.ts"></script>
   </body>
 </html>
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/index.ts b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/index.ts
new file mode 100644
index 0000000..34f40c8
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/index.ts
@@ -0,0 +1,4 @@
+import './index.css';
+import { mount } from './main';
+
+(window as Record<string, unknown>).__webapp_start__ = mount;
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/lib/index.ts b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/lib/index.ts
new file mode 100644
index 0000000..f2d6c0c
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/lib/index.ts
@@ -0,0 +1 @@
+export { cn } from './utils';
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/lib/utils.ts b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/lib/utils.ts
new file mode 100644
index 0000000..3088358
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/lib/utils.ts
@@ -0,0 +1,5 @@
+import { clsx, type ClassValue } from 'clsx';
+import { twMerge } from 'tailwind-merge';
+
+export const cn = (...inputs: ReadonlyArray<ClassValue>): string =>
+  twMerge(clsx(inputs));
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/main.tsx b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/main.tsx
index 188bbe7..9ff91ab 100644
--- a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/main.tsx
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/main.tsx
@@ -1,13 +1,22 @@
 import { StrictMode } from 'react';
 import { createRoot } from 'react-dom/client';
 import { App } from './app';
-import './index.css';
+import type { WebappConfig } from '{{CONFIG_PACKAGE}}';
 
-const root = document.getElementById('root');
-if (!root) throw new Error('Root element not found');
+export const mount = (elementId: string, config: WebappConfig): void => {
+  if (typeof elementId !== 'string' || elementId.length === 0) {
+    throw new Error('mount() requires a non-empty elementId string');
+  }
+  if (config == null || typeof config !== 'object') {
+    throw new Error('mount() requires a non-null config object');
+  }
 
-createRoot(root).render(
-  <StrictMode>
-    <App />
-  </StrictMode>
-);
+  const root = document.getElementById(elementId);
+  if (!root) throw new Error(`Element #${elementId} not found`);
+
+  createRoot(root).render(
+    <StrictMode>
+      <App config={config} />
+    </StrictMode>,
+  );
+};
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/pages/home.tsx b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/pages/home.tsx
deleted file mode 100644
index c10608c..0000000
--- a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/pages/home.tsx
+++ /dev/null
@@ -1,22 +0,0 @@
-// Page: Home
-// Welcome page with project overview
-export const HomePage = (): JSX.Element => {
-  return (
-    <div className="p-8">
-      <h2 className="text-2xl font-bold text-gray-800 mb-4">
-        Welcome to {'{{PROJECT_NAME}}'}
-      </h2>
-      <p className="text-gray-600 mb-4">
-        This is a full-stack application built with spec-driven development.
-      </p>
-      <div className="bg-white rounded-lg shadow p-6">
-        <h3 className="text-lg font-semibold mb-2">Architecture</h3>
-        <ul className="list-disc list-inside text-gray-600 space-y-1">
-          <li><strong>Contract:</strong> OpenAPI specification</li>
-          <li><strong>Server:</strong> Express with layered architecture (Controller → Model → DAL)</li>
-          <li><strong>Webapp:</strong> React with MVVM pattern (View → ViewModel → Model)</li>
-        </ul>
-      </div>
-    </div>
-  );
-};
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/pages/home_page/home_page.tsx b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/pages/home_page/home_page.tsx
new file mode 100644
index 0000000..8272d92
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/pages/home_page/home_page.tsx
@@ -0,0 +1,26 @@
+import { Card, CardHeader, CardTitle, CardContent } from '@/components';
+
+export const HomePage = (): React.JSX.Element => {
+  return (
+    <div className="p-8">
+      <h2 className="text-2xl font-bold mb-4">
+        Welcome to {'{{PROJECT_NAME}}'}
+      </h2>
+      <p className="text-muted-foreground mb-6">
+        This is a full-stack application built with spec-driven development.
+      </p>
+      <Card>
+        <CardHeader>
+          <CardTitle>Architecture</CardTitle>
+        </CardHeader>
+        <CardContent>
+          <ul className="list-disc list-inside text-muted-foreground space-y-1">
+            <li><strong>Contract:</strong> OpenAPI specification</li>
+            <li><strong>Server:</strong> Express with layered architecture (Controller → Model → DAL)</li>
+            <li><strong>Webapp:</strong> React with MVVM pattern (View → ViewModel → Model)</li>
+          </ul>
+        </CardContent>
+      </Card>
+    </div>
+  );
+};
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/pages/home_page/index.ts b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/pages/home_page/index.ts
new file mode 100644
index 0000000..61702de
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/pages/home_page/index.ts
@@ -0,0 +1 @@
+export { HomePage } from './home_page';
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/pages/index.ts b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/pages/index.ts
index 9119148..61702de 100644
--- a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/pages/index.ts
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/pages/index.ts
@@ -1,4 +1 @@
-// Pages index
-export { HomePage } from './home';
-// Add page exports here as features are implemented
-// Example: export { UsersPage } from './users';
+export { HomePage } from './home_page';
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/routes/index.ts b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/routes/index.ts
new file mode 100644
index 0000000..a4088b7
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/routes/index.ts
@@ -0,0 +1 @@
+export { createAppRouter, type AppRouter } from './routes';
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/routes/routes.tsx b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/routes/routes.tsx
new file mode 100644
index 0000000..50dfba8
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/routes/routes.tsx
@@ -0,0 +1,29 @@
+import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
+import { Layout } from '@/components';
+import { HomePage } from '@/pages';
+
+// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- AppRouter derives via ReturnType<>; explicit annotation would be circular
+export const createAppRouter = () => {
+  const rootRoute = createRootRoute({
+    component: Layout,
+  });
+
+  const homeRoute = createRoute({
+    getParentRoute: () => rootRoute,
+    path: '/',
+    component: HomePage,
+  });
+
+  const routeTree = rootRoute.addChildren([homeRoute]);
+
+  return createRouter({ routeTree });
+};
+
+export type AppRouter = ReturnType<typeof createAppRouter>;
+
+// Register the router for type-safe route paths in Link, useNavigate, useParams, etc.
+declare module '@tanstack/react-router' {
+  interface Register {
+    router: AppRouter;
+  }
+}
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/services/index.ts b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/services/index.ts
new file mode 100644
index 0000000..cb0ff5c
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/services/index.ts
@@ -0,0 +1 @@
+export {};
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/types/index.ts b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/types/index.ts
new file mode 100644
index 0000000..cb0ff5c
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/types/index.ts
@@ -0,0 +1 @@
+export {};
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/src/vite-env.d.ts b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/vite-env.d.ts
new file mode 100644
index 0000000..11f02fe
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/src/vite-env.d.ts
@@ -0,0 +1 @@
+/// <reference types="vite/client" />
diff --git a/plugin/skills/components/frontend/frontend-scaffolding/templates/vite.config.ts b/plugin/skills/components/frontend/frontend-scaffolding/templates/vite.config.ts
index 75560f3..d6ade1b 100644
--- a/plugin/skills/components/frontend/frontend-scaffolding/templates/vite.config.ts
+++ b/plugin/skills/components/frontend/frontend-scaffolding/templates/vite.config.ts
@@ -1,9 +1,16 @@
+import { resolve } from 'node:path';
 import { defineConfig } from 'vite';
 import react from '@vitejs/plugin-react';
 import tailwindcss from '@tailwindcss/vite';
 
 export default defineConfig({
+  root: 'src',
   plugins: [react(), tailwindcss()],
+  resolve: {
+    alias: {
+      '@': resolve(import.meta.dirname, 'src'),
+    },
+  },
   server: {
     port: 5173,
     proxy: {
diff --git a/plugin/skills/components/frontend/frontend-standards/SKILL.md b/plugin/skills/components/frontend/frontend-standards/SKILL.md
index e67b4c7..2628482 100644
--- a/plugin/skills/components/frontend/frontend-standards/SKILL.md
+++ b/plugin/skills/components/frontend/frontend-standards/SKILL.md
@@ -1,6 +1,6 @@
 ---
 name: frontend-standards
-description: MVVM architecture standards for React/TypeScript frontends with TanStack ecosystem and TailwindCSS.
+description: MVVM architecture standards for React/TypeScript frontends with TanStack ecosystem, TailwindCSS, and Shadcn UI.
 ---
 
 
@@ -16,7 +16,7 @@ MVVM architecture for React/TypeScript frontends with strict separation between
 View (React Components) → ViewModel (Hooks) → Model (Business Logic)
          ↓                       ↓                    ↓
     TailwindCSS            TanStack Query         Services/API
-                           Zustand Stores
+    Shadcn UI              useReducer+Context
 ```
 
 ### Key Distinction: UI vs Logic
@@ -35,12 +35,31 @@ View (React Components) → ViewModel (Hooks) → Model (Business Logic)
 
 ```text
 src/
-├── pages/                    # Page components (Views + ViewModels + Models)
+├── components/               # Shared presentational components
+│   ├── user_card/
+│   │   ├── index.ts          # Barrel exports only
+│   │   ├── user_card.tsx
+│   │   └── user_card.test.tsx
+│   └── ui/                   # Shadcn UI primitives (see shadcn.md)
+│       ├── index.ts
+│       ├── button.tsx
+│       ├── dialog.tsx
+│       └── ...
+├── hooks/                    # Shared hooks (auth, user data, etc.)
+│   ├── index.ts
+│   ├── use_auth.ts
+│   ├── use_user_data.ts
+│   └── ...
+├── lib/                      # Pure utilities and helpers
+│   ├── index.ts
+│   ├── utils.ts              # cn() — clsx + tailwind-merge
+│   └── ...
+├── pages/                    # Page components (View + ViewModel + Model)
 │   ├── home_page/
-│   │   ├── index.ts          # Exports only
-│   │   ├── home_page.tsx     # View component
-│   │   ├── use_home_view_model.ts  # ViewModel hook
-│   │   ├── home_model.ts     # Page-specific model (business logic)
+│   │   ├── index.ts
+│   │   ├── home_page.tsx
+│   │   ├── use_home_view_model.ts
+│   │   ├── home_model.ts
 │   │   └── home_page.test.tsx
 │   └── user_profile/
 │       ├── index.ts
@@ -48,28 +67,178 @@ src/
 │       ├── use_user_profile_view_model.ts
 │       ├── user_profile_model.ts
 │       └── user_profile.test.tsx
-├── components/               # Shared presentational components
-│   ├── button/
-│   │   ├── index.ts
-│   │   ├── button.tsx
-│   │   └── button.test.tsx
-│   └── ...
-├── viewmodels/               # Shared ViewModel hooks
-│   ├── use_auth.ts
-│   ├── use_user_data.ts
-│   └── ...
-├── services/                 # API clients and external services
-│   ├── api/
-│   │   ├── users.ts
-│   │   └── auth.ts
+├── routes/                   # TanStack Router route definitions
+│   ├── index.ts
+│   └── routes.tsx            # createAppRouter() factory
+├── services/                 # API clients and external services (flat)
+│   ├── index.ts
+│   ├── users.ts
+│   ├── auth.ts
 │   └── ...
-├── types/                    # Generated types from OpenAPI
-│   └── generated.ts          # Auto-generated from contract
-├── stores/                   # Global state (Zustand)
-│   ├── auth_store.ts
+├── types/                    # App-local type definitions
+│   ├── index.ts
 │   └── ...
-└── utils/                    # Pure utility functions
-    └── ...
+└── index.ts                  # Entry point (only file with side-effects)
+```
+
+### Directory Allowlist (D18)
+
+Only the following `src/` subdirectories are permitted:
+
+- `components/` — shared presentational components
+- `components/ui/` — Shadcn UI primitives
+- `hooks/` — shared hooks (replaces `viewmodels/`)
+- `lib/` — pure utilities and helpers
+- `pages/` — page components (View + ViewModel + Model)
+- `routes/` — TanStack Router route definitions
+- `services/` — API clients and external services (flat, no subdirectories)
+- `types/` — app-local type definitions
+
+**No new top-level `src/` directories.** If something doesn't fit, it belongs in one of the above.
+
+---
+
+## Barrel-Only Index Files (D20)
+
+All `index.ts` files must be **pure barrels** — imports and re-exports only. No logic, no side effects.
+
+```typescript
+// src/hooks/index.ts — GOOD: pure barrel
+export { useAuth } from './use_auth';
+export { useUserData } from './use_user_data';
+```
+
+- Always `.ts` (never `.tsx`) for index files
+- No function definitions, no variable assignments, no conditional logic
+
+---
+
+## Barrel Imports Only (D23)
+
+Every subdirectory has an `index.ts` barrel. All imports from outside a directory go through its barrel.
+
+```typescript
+// GOOD: barrel import
+import { useAuth } from '@/hooks';
+import { cn } from '@/lib';
+import { fetchUser } from '@/services';
+
+// BAD: deep import
+import { useAuth } from '@/hooks/use_auth';
+import { cn } from '@/lib/cn';
+import { fetchUser } from '@/services/users';
+```
+
+**Inside a module, nothing should ever import from its own `index.ts`.** All imports within a module must use relative paths. The barrel is the module's public API for external consumers only. For nested modules, the same barrel rules apply.
+
+```typescript
+// In components/layout/layout.tsx:
+
+// GOOD: relative path to sibling sub-module barrel
+import { Sidebar } from '../sidebar';
+import { Button } from '../ui';
+
+// BAD: importing from own module's barrel — circular dependency
+import { Sidebar } from '@/components';
+import { Sidebar } from '@/components/sidebar';
+```
+
+---
+
+## No Side-Effects (D19)
+
+Only `src/index.ts` (the app entry point) may have module-level side-effects (CSS import, `ReactDOM.render`, window assignment). All other files must be side-effect free.
+
+```typescript
+// src/index.ts — OK: entry point, side-effects allowed
+import './index.css';
+import { createRoot } from 'react-dom/client';
+import { App } from '@/components';
+
+const root = createRoot(document.getElementById('root')!);
+root.render(<App />);
+
+// src/lib/utils.ts — GOOD: no side-effects, exports only
+import { clsx, type ClassValue } from 'clsx';
+import { twMerge } from 'tailwind-merge';
+
+export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
+```
+
+---
+
+## Hooks for Providers (D22)
+
+`QueryClient` and router instances must be lazily created via `useState` hooks inside provider components. No direct instantiation at module scope.
+
+```typescript
+// GOOD: lazy creation inside component
+import { useState } from 'react';
+import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
+
+export const AppQueryProvider = ({ children }: { readonly children: React.ReactNode }) => {
+  const [queryClient] = useState(() => new QueryClient({
+    defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } },
+  }));
+
+  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
+};
+
+// BAD: module-scope instantiation (side-effect)
+const queryClient = new QueryClient();
+```
+
+---
+
+## Factory Functions for Routes (D21)
+
+Routes use a `createAppRouter()` factory exported from `routes/routes.tsx`. Type registration uses `ReturnType<typeof createAppRouter>`.
+
+```typescript
+// src/routes/routes.tsx
+import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
+import { HomePage } from '@/pages';
+
+// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- AppRouter derives via ReturnType<>; explicit annotation would be circular
+export const createAppRouter = () => {
+  const rootRoute = createRootRoute();
+
+  const indexRoute = createRoute({
+    getParentRoute: () => rootRoute,
+    path: '/',
+    component: HomePage,
+  });
+
+  const routeTree = rootRoute.addChildren([indexRoute]);
+
+  return createRouter({ routeTree });
+};
+
+export type AppRouter = ReturnType<typeof createAppRouter>;
+
+// Exception: declare module augmentation requires `interface` (not `type`)
+// because TypeScript declaration merging only works with interfaces.
+declare module '@tanstack/react-router' {
+  interface Register {
+    router: AppRouter;
+  }
+}
+```
+
+---
+
+## `cn()` for Class Merging
+
+Use `cn()` from `@/lib` (clsx + tailwind-merge) instead of raw `clsx`. This correctly handles Tailwind class conflicts.
+
+```typescript
+import { cn } from '@/lib';
+
+export const Card = ({ className, children }: CardProps) => (
+  <div className={cn('rounded-lg border p-4', className)}>
+    {children}
+  </div>
+);
 ```
 
 ---
@@ -82,9 +251,9 @@ React components that render UI. **No business logic.**
 // src/pages/user_profile/user_profile.tsx
 import { useUserProfileViewModel } from './use_user_profile_view_model';
 
-interface UserProfileProps {
+type UserProfileProps = {
   readonly userId: string;
-}
+};
 
 export const UserProfile = ({ userId }: UserProfileProps) => {
   const { user, displayName, isLoading, error, canEdit, handleEdit } = useUserProfileViewModel(userId);
@@ -123,50 +292,21 @@ export const UserProfile = ({ userId }: UserProfileProps) => {
 
 For detailed guidance, read these on-demand:
 - [tanstack.md](resources/tanstack.md) — Router, Query, Table, Form patterns
-- [mvvm-patterns.md](resources/mvvm-patterns.md) — Model, ViewModel, View with Zustand examples
-- [tailwind.md](resources/tailwind.md) — Utility classes, responsive, dark mode, clsx
+- [mvvm-patterns.md](resources/mvvm-patterns.md) — Model, ViewModel, View with useReducer+Context examples
+- [tailwind.md](resources/tailwind.md) — Utility classes, responsive, dark mode, cn()
+- [shadcn.md](resources/shadcn.md) — Shadcn UI component anatomy, cva variants, Radix primitives
 
 ---
 
 ## Type Consumption
 
-**Always consume generated types from contract:**
-
-```typescript
-import type { User, CreateUserRequest, ApiError } from '../../types/generated';
-```
-
-Never hand-write API types—they are generated from the contract component's `openapi.yaml` at `components/contracts/{name}/openapi.yaml`.
-
----
-
-## No Implicit Global Code
-
-All code must be explicitly invoked—no side effects on module import.
+**Always consume shared API types from workspace packages via barrel imports:**
 
 ```typescript
-// GOOD: Explicit function calls
-export const initializeApp = () => {
-  // Setup code here
-};
-
-export const App = () => {
-  return <div>...</div>;
-};
-
-// Entry point explicitly calls init
-initializeApp();
-ReactDOM.render(<App />, root);
-
-// BAD: Code runs on import
-const analytics = new Analytics(); // Runs immediately
-analytics.track('module_loaded'); // Side effect on import
+import type { User, CreateUserRequest, ApiError } from '@my-org/api-types';
 ```
 
-This ensures:
-- Code is testable
-- Tree-shaking works correctly
-- No hidden dependencies or execution order issues
+Never hand-write API types — they are generated from the contract component's `openapi.yaml` at `components/contracts/{name}/openapi.yaml`.
 
 ---
 
@@ -186,8 +326,8 @@ This ensures:
 - `src/pages/user_profile/use_user_profile_view_model.ts`
 - `src/pages/user_profile/user_profile_model.ts`
 - `src/components/button/button.tsx`
-- `src/viewmodels/use_auth.ts`
-- `src/stores/auth_store.ts`
+- `src/hooks/use_auth.ts`
+- `src/services/users.ts`
 
 **Note:** Component names in code remain PascalCase (e.g., `export const UserProfile = ...`).
 
@@ -199,16 +339,18 @@ Shared components go in `src/components/`:
 
 ```typescript
 // src/components/user_card/user_card.tsx
-import type { User } from '../../types/generated';
+import type { User } from '@my-org/api-types';
+import { cn } from '@/lib';
 
-interface UserCardProps {
+type UserCardProps = {
   readonly user: User;
   readonly onEdit: (id: string) => void;
-}
+  readonly className?: string;
+};
 
-export const UserCard = ({ user, onEdit }: UserCardProps) => {
+export const UserCard = ({ user, onEdit, className }: UserCardProps) => {
   return (
-    <div className="p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
+    <div className={cn('p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow', className)}>
       <h2 className="text-xl font-semibold mb-2">{user.name}</h2>
       <p className="text-gray-600 mb-4">{user.email}</p>
       <button
@@ -236,16 +378,20 @@ Before committing frontend code, verify:
 
 - [ ] Page follows MVVM structure (View + ViewModel + Model files)
 - [ ] View contains no business logic
-- [ ] ViewModel returns interface with all `readonly` properties
+- [ ] ViewModel returns type with all `readonly` properties
 - [ ] Model has no React dependencies
-- [ ] TanStack Router used for all navigation
+- [ ] TanStack Router used for all navigation (factory pattern)
 - [ ] TanStack Query used for all server state
 - [ ] TailwindCSS used for all styling (no CSS files, no inline styles)
+- [ ] `cn()` used for class merging (not raw `clsx`)
 - [ ] All filenames use `lowercase_with_underscores`
-- [ ] Generated types consumed from `types/generated.ts`
-- [ ] No implicit global code (all code explicitly invoked)
-- [ ] Zustand stores follow readonly pattern
-- [ ] Props interfaces use `readonly` modifier
+- [ ] Types consumed from workspace packages via barrel imports
+- [ ] No module-level side-effects (except `src/index.ts`)
+- [ ] All `index.ts` files are pure barrels
+- [ ] All imports go through barrels (no deep imports)
+- [ ] Only allowlisted directories exist in `src/`
+- [ ] Props types use `readonly` modifier
+- [ ] `useReducer` + Context for global client state (no Zustand)
 
 ---
 
diff --git a/plugin/skills/components/frontend/frontend-standards/resources/mvvm-patterns.md b/plugin/skills/components/frontend/frontend-standards/resources/mvvm-patterns.md
index 8de2296..e6eaea5 100644
--- a/plugin/skills/components/frontend/frontend-standards/resources/mvvm-patterns.md
+++ b/plugin/skills/components/frontend/frontend-standards/resources/mvvm-patterns.md
@@ -18,7 +18,7 @@ Business logic and domain rules. **No React dependencies.**
 
 ```typescript
 // src/pages/user_profile/user_profile_model.ts
-import type { User } from '../../types/generated';
+import type { User } from '@my-org/api-types';
 
 export const formatUserDisplayName = (user: User): string => {
   return user.name || user.email.split('@')[0];
@@ -33,7 +33,7 @@ export const canEditProfile = (currentUserId: string, profileUserId: string): bo
 - No React imports
 - No UI concerns
 - Pure functions preferred
-- Import only from `types/` and other models
+- Import types from workspace packages via barrel imports
 
 ---
 
@@ -46,7 +46,7 @@ React hooks that connect Model to View. State management and side effects live h
 - Returns data and callbacks for View consumption
 - All properties in return type are `readonly`
 
-**Shared ViewModels** (`viewmodels/`):
+**Shared Hooks** (`hooks/`):
 - Reusable across multiple pages
 - Authentication, user data, etc.
 
@@ -54,23 +54,23 @@ React hooks that connect Model to View. State management and side effects live h
 // src/pages/user_profile/use_user_profile_view_model.ts
 import { useQuery } from '@tanstack/react-query';
 import { useNavigate } from '@tanstack/react-router';
-import type { User } from '../../types/generated';
-import { fetchUser } from '../../services/api/users';
+import type { User } from '@my-org/api-types';
+import { fetchUser } from '@/services';
 import { formatUserDisplayName, canEditProfile } from './user_profile_model';
-import { useAuthStore } from '../../stores/auth_store';
+import { useAuth } from '@/hooks';
 
-interface UserProfileViewModel {
+type UserProfileViewModel = {
   readonly user: User | undefined;
   readonly displayName: string;
   readonly isLoading: boolean;
   readonly error: Error | null;
   readonly canEdit: boolean;
   readonly handleEdit: () => void;
-}
+};
 
 export const useUserProfileViewModel = (userId: string): UserProfileViewModel => {
   const navigate = useNavigate();
-  const currentUser = useAuthStore((state) => state.user);
+  const { user: currentUser } = useAuth();
 
   const { data: user, isLoading, error } = useQuery<User>({
     queryKey: ['user', userId],
@@ -96,9 +96,9 @@ export const useUserProfileViewModel = (userId: string): UserProfileViewModel =>
 ```
 
 **ViewModel Rules:**
-- Return interface with all `readonly` properties
+- Return type with all `readonly` properties
 - Use TanStack Query for server state
-- Use Zustand for global client state
+- Use `useReducer` + Context for global client state (encapsulated behind hooks)
 - Call Model functions for business logic
 - No JSX rendering
 
@@ -109,28 +109,95 @@ export const useUserProfileViewModel = (userId: string): UserProfileViewModel =>
 | Type | Tool | Usage |
 |------|------|-------|
 | Server state | TanStack Query | All API data fetching |
-| Global client state | Zustand | Auth, theme, user preferences |
-| Local client state | useState | Form inputs, UI toggles |
+| Global client state | `useReducer` + Context | Auth, theme, user preferences |
+| Local client state | `useState` | Form inputs, UI toggles |
 | URL state | TanStack Router | Pagination, filters, search |
 
-### Zustand Store Pattern
+### useReducer + Context Pattern
+
+Global client state uses `useReducer` + Context, encapsulated behind custom hooks. Consumers never interact with the context or reducer directly.
 
 ```typescript
-// src/stores/auth_store.ts
-import { create } from 'zustand';
-import type { User } from '../types/generated';
+// src/hooks/use_auth.ts
+import { useReducer, useContext, createContext, useCallback } from 'react';
+import type { User } from '@my-org/api-types';
+
+// --- State & Reducer (not exported) ---
 
-interface AuthState {
+type AuthState = {
   readonly user: User | null;
   readonly isAuthenticated: boolean;
-  readonly login: (user: User) => void;
-  readonly logout: () => void;
-}
+};
+
+type AuthAction =
+  | { readonly type: 'LOGIN'; readonly user: User }
+  | { readonly type: 'LOGOUT' };
 
-export const useAuthStore = create<AuthState>((set) => ({
+const initialState: AuthState = {
   user: null,
   isAuthenticated: false,
-  login: (user) => set({ user, isAuthenticated: true }),
-  logout: () => set({ user: null, isAuthenticated: false }),
-}));
+};
+
+const authReducer = (state: AuthState, action: AuthAction): AuthState => {
+  switch (action.type) {
+    case 'LOGIN':
+      return { user: action.user, isAuthenticated: true };
+    case 'LOGOUT':
+      return { user: null, isAuthenticated: false };
+    default:
+      return state;
+  }
+};
+
+// --- Context (not exported) ---
+
+type AuthContextValue = {
+  readonly state: AuthState;
+  readonly dispatch: React.Dispatch<AuthAction>;
+};
+
+const AuthContext = createContext<AuthContextValue | null>(null);
+
+// --- Provider (exported) ---
+
+export const AuthProvider = ({ children }: { readonly children: React.ReactNode }) => {
+  const [state, dispatch] = useReducer(authReducer, initialState);
+  return (
+    <AuthContext.Provider value={{ state, dispatch }}>
+      {children}
+    </AuthContext.Provider>
+  );
+};
+
+// --- Hook (exported) — the ONLY public API ---
+
+export const useAuth = () => {
+  const context = useContext(AuthContext);
+  if (!context) throw new Error('useAuth must be used within AuthProvider');
+
+  const { state, dispatch } = context;
+
+  const login = useCallback(
+    (user: User) => dispatch({ type: 'LOGIN', user }),
+    [dispatch],
+  );
+
+  const logout = useCallback(
+    () => dispatch({ type: 'LOGOUT' }),
+    [dispatch],
+  );
+
+  return {
+    user: state.user,
+    isAuthenticated: state.isAuthenticated,
+    login,
+    logout,
+  } as const;
+};
 ```
+
+**Key points:**
+- The reducer, state type, action type, and context are **not exported** — they are implementation details
+- Only the `AuthProvider` component and `useAuth` hook are exported
+- Consumers call `useAuth()` and get a clean, readonly API
+- This pattern is testable, tree-shakeable, and has no module-level side-effects
diff --git a/plugin/skills/components/frontend/frontend-standards/resources/shadcn.md b/plugin/skills/components/frontend/frontend-standards/resources/shadcn.md
new file mode 100644
index 0000000..e797f10
--- /dev/null
+++ b/plugin/skills/components/frontend/frontend-standards/resources/shadcn.md
@@ -0,0 +1,197 @@
+# Shadcn UI
+
+Shadcn UI provides copy-paste React components built on Radix UI primitives, styled with TailwindCSS and `cva`. Components live in `src/components/ui/` and are owned by the project (not an npm dependency).
+
+---
+
+## Component Hierarchy (D6)
+
+When building UI, follow this decision order:
+
+1. **Use Shadcn component if it exists** — check `components/ui/` first
+2. **Build on a Radix primitive following Shadcn patterns** — if Shadcn doesn't have it but Radix does
+3. **Fully custom component** — only when no Radix primitive applies
+
+Never re-implement what Shadcn or Radix already provides.
+
+---
+
+## Component Anatomy
+
+Every `components/ui/` file follows this structure:
+
+```typescript
+import * as React from 'react';
+import * as DialogPrimitive from '@radix-ui/react-dialog';
+import { cn } from '@/lib';
+
+const Dialog = DialogPrimitive.Root;
+const DialogTrigger = DialogPrimitive.Trigger;
+
+const DialogContent = React.forwardRef<
+  React.ComponentRef<typeof DialogPrimitive.Content>,
+  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
+>(({ className, children, ...props }, ref) => (
+  <DialogPrimitive.Portal>
+    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
+    <DialogPrimitive.Content
+      ref={ref}
+      className={cn(
+        'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
+        'w-full max-w-lg rounded-lg bg-background p-6 shadow-lg',
+        className,
+      )}
+      {...props}
+    >
+      {children}
+    </DialogPrimitive.Content>
+  </DialogPrimitive.Portal>
+));
+DialogContent.displayName = DialogPrimitive.Content.displayName;
+
+export { Dialog, DialogTrigger, DialogContent };
+```
+
+### Key patterns
+
+- **`forwardRef`** — all components forward refs for composition
+- **`className` prop** — always accepted, always merged via `cn()`
+- **Spread `...props`** — remaining props passed through to the primitive
+- **`displayName`** — set for DevTools (mirrors the primitive name)
+- **`cn()` merging** — base styles + external `className` merged with tailwind-merge
+
+---
+
+## TS Standards Exceptions for `components/ui/` (D24)
+
+The following patterns are **allowed only in `components/ui/` files** and forbidden elsewhere:
+
+| Pattern | Why allowed in `ui/` |
+|---------|----------------------|
+| `React.forwardRef` | Required by Radix composition model |
+| `ComponentName.displayName = ...` | Required for DevTools with forwardRef |
+| `import * as React from 'react'` | Needed for `React.forwardRef`, `React.ComponentRef` etc. |
+
+Outside `components/ui/`, these patterns remain forbidden per TypeScript standards.
+
+---
+
+## `cva` for Variants
+
+Use `cva` (class-variance-authority) to define variant styles. This is the standard pattern for Shadcn-style components.
+
+```typescript
+import { cva, type VariantProps } from 'class-variance-authority';
+import { cn } from '@/lib';
+
+const badgeVariants = cva(
+  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
+  {
+    variants: {
+      variant: {
+        default: 'border-transparent bg-primary text-primary-foreground',
+        secondary: 'border-transparent bg-secondary text-secondary-foreground',
+        destructive: 'border-transparent bg-destructive text-destructive-foreground',
+        outline: 'text-foreground',
+      },
+    },
+    defaultVariants: {
+      variant: 'default',
+    },
+  },
+);
+
+type BadgeProps = React.HTMLAttributes<HTMLDivElement> &
+  VariantProps<typeof badgeVariants>;
+
+export const Badge = ({ className, variant, ...props }: BadgeProps) => (
+  <div className={cn(badgeVariants({ variant }), className)} {...props} />
+);
+```
+
+### `cva` rules
+
+- Define a `*Variants` const with `cva(baseClasses, { variants, defaultVariants })`
+- Derive the props type with `VariantProps<typeof *Variants>`
+- Always merge with `cn(variantsFn({ ...variantProps }), className)`
+- Export the variants const if consumers need to reuse the styles (e.g., `buttonVariants` for link-styled buttons)
+
+---
+
+## `components/ui/` Structure
+
+Shadcn components live in a **flat** directory — no subdirectories:
+
+```text
+src/components/ui/
+├── index.ts          # Barrel: re-exports all ui components
+├── button.tsx
+├── card.tsx
+├── dialog.tsx
+├── dropdown_menu.tsx
+├── input.tsx
+├── label.tsx
+├── select.tsx
+├── sheet.tsx
+├── table.tsx
+└── tooltip.tsx
+```
+
+- File names use `lowercase_with_underscores` (e.g., `dropdown_menu.tsx`, not `dropdown-menu.tsx`)
+- One component family per file (a file may export multiple related parts like `Dialog`, `DialogContent`, `DialogTrigger`)
+- The `index.ts` barrel re-exports everything so consumers import from `@/components` (the top-level barrel re-exports `./ui`)
+
+---
+
+## Radix vs Shadcn vs Custom Decision Tree
+
+```text
+Need a UI element?
+│
+├─ Does Shadcn have it? (check components/ui/)
+│  └─ YES → Use it directly. Customize via className/variants.
+│
+├─ Does Radix have a primitive? (e.g., Popover, Tooltip, Accordion)
+│  └─ YES → Build a Shadcn-style wrapper:
+│           - forwardRef
+│           - className + cn() merging
+│           - cva if multiple variants
+│           - Place in components/ui/
+│
+└─ Neither?
+   └─ Build a fully custom component.
+      - Still use forwardRef + className + cn() if it's a ui/ primitive.
+      - If it's a domain component, put it in components/<name>/ instead.
+```
+
+---
+
+## Usage in Application Components
+
+Application components consume Shadcn primitives from the barrel:
+
+```typescript
+// src/pages/settings/settings_page.tsx
+import { Button, Card } from '@/components';
+import { useSettingsViewModel } from './use_settings_view_model';
+
+export const SettingsPage = () => {
+  const { settings, handleSave, isSaving } = useSettingsViewModel();
+
+  return (
+    <Card className="max-w-2xl mx-auto mt-8 p-6">
+      <h1 className="text-2xl font-bold mb-4">Settings</h1>
+      {/* ... form fields ... */}
+      <Button onClick={handleSave} disabled={isSaving}>
+        {isSaving ? 'Saving...' : 'Save Changes'}
+      </Button>
+    </Card>
+  );
+};
+```
+
+---
+
+## Living Examples
+
+The scaffold's `components/ui/` files are the canonical reference for Shadcn patterns. When in doubt about anatomy, naming, or style conventions, refer to those files directly rather than external documentation.
diff --git a/plugin/skills/components/frontend/frontend-standards/resources/tailwind.md b/plugin/skills/components/frontend/frontend-standards/resources/tailwind.md
index 63ce270..8b53893 100644
--- a/plugin/skills/components/frontend/frontend-standards/resources/tailwind.md
+++ b/plugin/skills/components/frontend/frontend-standards/resources/tailwind.md
@@ -33,36 +33,110 @@ export const Button = ({ children, onClick }: ButtonProps) => {
 </div>
 ```
 
-## Component Variants with clsx
+## Class Merging with `cn()`
+
+Use `cn()` from `@/lib` for all conditional or merged class names. `cn()` wraps `clsx` + `tailwind-merge`, so Tailwind class conflicts are resolved correctly.
 
 ```typescript
-import clsx from 'clsx';
+import { cn } from '@/lib';
 
-interface ButtonProps {
-  readonly variant?: 'primary' | 'secondary' | 'danger';
-}
+type CardProps = {
+  readonly variant?: 'default' | 'outlined';
+  readonly className?: string;
+  readonly children: React.ReactNode;
+};
 
-export const Button = ({ variant = 'primary', children }: ButtonProps) => {
+export const Card = ({ variant = 'default', className, children }: CardProps) => {
   return (
-    <button
-      className={clsx(
-        'px-4 py-2 rounded-lg transition-colors',
-        variant === 'primary' && 'bg-blue-500 hover:bg-blue-600 text-white',
-        variant === 'secondary' && 'bg-gray-200 hover:bg-gray-300 text-gray-900',
-        variant === 'danger' && 'bg-red-500 hover:bg-red-600 text-white'
+    <div
+      className={cn(
+        'rounded-lg p-4 transition-shadow',
+        variant === 'default' && 'bg-white shadow-sm hover:shadow-md',
+        variant === 'outlined' && 'border border-gray-200',
+        className,
       )}
     >
       {children}
-    </button>
+    </div>
+  );
+};
+```
+
+**Why `cn()` instead of raw `clsx`:** Raw `clsx` concatenates classes but does not resolve conflicts. `cn()` uses `tailwind-merge` under the hood, so `cn('p-4', 'p-2')` correctly resolves to `'p-2'` instead of keeping both.
+
+### `cn()` implementation
+
+```typescript
+// src/lib/cn.ts
+import { clsx, type ClassValue } from 'clsx';
+import { twMerge } from 'tailwind-merge';
+
+export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
+```
+
+## Component Variants with `cva`
+
+Use `cva` (class-variance-authority) for components with multiple variant axes. This replaces manual conditional class logic.
+
+```typescript
+import { cva, type VariantProps } from 'class-variance-authority';
+import { cn } from '@/lib';
+
+const buttonVariants = cva(
+  // Base classes (always applied)
+  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
+  {
+    variants: {
+      variant: {
+        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
+        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
+        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
+        ghost: 'hover:bg-accent hover:text-accent-foreground',
+      },
+      size: {
+        default: 'h-10 px-4 py-2',
+        sm: 'h-9 rounded-md px-3',
+        lg: 'h-11 rounded-md px-8',
+        icon: 'h-10 w-10',
+      },
+    },
+    defaultVariants: {
+      variant: 'default',
+      size: 'default',
+    },
+  },
+);
+
+type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
+  VariantProps<typeof buttonVariants> & {
+    readonly className?: string;
+  };
+
+export const Button = ({ className, variant, size, ...props }: ButtonProps) => {
+  return (
+    <button
+      className={cn(buttonVariants({ variant, size }), className)}
+      {...props}
+    />
   );
 };
 ```
 
+**When to use `cva` vs `cn()`:**
+
+| Scenario | Use |
+|----------|-----|
+| Simple conditional class (1-2 conditions) | `cn()` |
+| Component with multiple variant axes | `cva` |
+| Merging external `className` prop | `cn()` (always) |
+| Shadcn-style component definitions | `cva` + `cn()` together |
+
 ## Styling Rules
 
 - **NO inline styles** (`style={{ ... }}` is forbidden)
 - **NO CSS files** (no .css, .scss, .less files except for global Tailwind setup)
 - **NO CSS-in-JS libraries** (no styled-components, emotion, etc.)
 - Use Tailwind utility classes only
-- Use `clsx` for conditional classes
+- Use `cn()` for conditional/merged classes (not raw `clsx`)
+- Use `cva` for multi-variant component definitions
 - Extract repeated patterns into reusable components, not CSS classes
diff --git a/plugin/skills/components/frontend/frontend-standards/resources/tanstack.md b/plugin/skills/components/frontend/frontend-standards/resources/tanstack.md
index 853c942..1e2b501 100644
--- a/plugin/skills/components/frontend/frontend-standards/resources/tanstack.md
+++ b/plugin/skills/components/frontend/frontend-standards/resources/tanstack.md
@@ -1,31 +1,72 @@
 # TanStack Ecosystem (Mandatory)
 
-## TanStack Router
+## TanStack Router (1.x)
 
 **Mandatory for all routing and navigation.**
 
+### Route Factory Pattern
+
+Routes are defined via a `createAppRouter()` factory function, not instantiated at module scope. This ensures no side-effects on import and supports lazy creation inside providers.
+
 ```typescript
-// src/routes/index.tsx
+// src/routes/routes.tsx
 import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
-import { UserProfile } from '../pages/user_profile';
+import { UserProfile } from '@/pages';
 
-const rootRoute = createRootRoute();
+// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- AppRouter derives via ReturnType<>; explicit annotation would be circular
+export const createAppRouter = () => {
+  const rootRoute = createRootRoute();
 
-const userProfileRoute = createRoute({
-  getParentRoute: () => rootRoute,
-  path: '/users/$userId',
-  component: () => {
-    const { userId } = userProfileRoute.useParams();
-    return <UserProfile userId={userId} />;
-  },
-});
+  const userProfileRoute = createRoute({
+    getParentRoute: () => rootRoute,
+    path: '/users/$userId',
+    component: () => {
+      const { userId } = userProfileRoute.useParams();
+      return <UserProfile userId={userId} />;
+    },
+  });
 
-export const router = createRouter({
-  routeTree: rootRoute.addChildren([userProfileRoute])
-});
+  const routeTree = rootRoute.addChildren([userProfileRoute]);
+
+  return createRouter({ routeTree });
+};
 ```
 
-**Navigation in ViewModels:**
+### Type Registration
+
+Register the router type so `useNavigate`, `useParams`, etc. are fully typed throughout the app.
+
+> **Exception:** `declare module` augmentation requires `interface` (not `type`) because TypeScript declaration merging only works with interfaces.
+
+```typescript
+// src/routes/routes.tsx (at bottom of file)
+export type AppRouter = ReturnType<typeof createAppRouter>;
+
+declare module '@tanstack/react-router' {
+  interface Register {
+    router: AppRouter;
+  }
+}
+```
+
+### Using the Router in the App
+
+The router is lazily instantiated via `useState` inside the provider component (see D22):
+
+```typescript
+// src/components/app.tsx
+import { useState } from 'react';
+import { RouterProvider } from '@tanstack/react-router';
+import { createAppRouter } from '@/routes';
+
+export const App = () => {
+  const [router] = useState(() => createAppRouter());
+  return <RouterProvider router={router} />;
+};
+```
+
+### Navigation in ViewModels
+
 ```typescript
 import { useNavigate } from '@tanstack/react-router';
 
@@ -33,13 +74,15 @@ const navigate = useNavigate();
 navigate({ to: '/users/$userId', params: { userId: '123' } });
 ```
 
-## TanStack Query
+---
+
+## TanStack Query (5.x)
 
 **Mandatory for all server state.**
 
 ```typescript
-// src/services/api/users.ts (Model layer)
-import type { User } from '../../types/generated';
+// src/services/users.ts (Model layer)
+import type { User } from '@my-org/api-types';
 
 export const fetchUser = async (id: string): Promise<User> => {
   const response = await fetch(`/api/users/${id}`);
@@ -49,12 +92,14 @@ export const fetchUser = async (id: string): Promise<User> => {
 
 // src/pages/user_profile/use_user_profile_view_model.ts (ViewModel layer)
 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
+import { fetchUser, updateUser } from '@/services';
 
 const { data: user, isLoading, error } = useQuery<User>({
   queryKey: ['user', userId],
   queryFn: () => fetchUser(userId),
 });
 
+const queryClient = useQueryClient();
 const updateMutation = useMutation({
   mutationFn: (updates: Partial<User>) => updateUser(userId, updates),
   onSuccess: () => {
@@ -63,12 +108,15 @@ const updateMutation = useMutation({
 });
 ```
 
+---
+
 ## TanStack Table
 
 **Mandatory for tabular data display.**
 
 ```typescript
 import { useReactTable, getCoreRowModel, createColumnHelper } from '@tanstack/react-table';
+import type { User } from '@my-org/api-types';
 
 const columnHelper = createColumnHelper<User>();
 const columns = [
@@ -83,6 +131,8 @@ const table = useReactTable({
 });
 ```
 
+---
+
 ## TanStack Form
 
 **Mandatory for complex forms with validation.**
diff --git a/plugin/skills/project-scaffolding/templates/project/CLAUDE.md b/plugin/skills/project-scaffolding/templates/project/CLAUDE.md
index 830544d..5d41036 100644
--- a/plugin/skills/project-scaffolding/templates/project/CLAUDE.md
+++ b/plugin/skills/project-scaffolding/templates/project/CLAUDE.md
@@ -4,7 +4,7 @@
 
 - **API Contract:** OpenAPI 3.x (path depends on contract component name in `.sdd/sdd-settings.yaml`)
 - **Backend:** Node.js 20, TypeScript 5, Express (CMDO architecture)
-- **Frontend:** React 18, TypeScript 5, Vite (MVVM architecture)
+- **Frontend:** React 19, TypeScript 5.9, Vite (MVVM architecture)
 - **Database:** PostgreSQL 15
 - **Testing:** Vitest (unit), Testkube (integration/E2E)
 - **Deployment:** Kubernetes, Helm
diff --git a/plugin/skills/typescript-standards/SKILL.md b/plugin/skills/typescript-standards/SKILL.md
index 52a4d47..76cdb66 100644
--- a/plugin/skills/typescript-standards/SKILL.md
+++ b/plugin/skills/typescript-standards/SKILL.md
@@ -169,7 +169,7 @@ import * as R from 'ramda';        // Never
 
 ## Module System Rules
 
-Named exports only (never default exports). ES modules only (never CommonJS). `index.ts` files contain only imports/exports (no logic). Always import through `index.ts` (never bypass to implementation files). No file extensions in imports. Use `@/` path alias for deep imports (2+ directory levels). Use `import type` for type-only imports.
+Named exports only (never default exports). ES modules only (never CommonJS). `index.ts` files contain only imports/exports (no logic). Always import through `index.ts` (never bypass to implementation files). Inside a module, never import from its own `index.ts` — use relative paths to siblings. No file extensions in imports. Use `@/` path alias for deep imports (2+ directory levels). Use `import type` for type-only imports.
 
 See [module-system.md](resources/module-system.md) for full rules with examples.
 
diff --git a/plugin/skills/typescript-standards/resources/module-system.md b/plugin/skills/typescript-standards/resources/module-system.md
index d71c079..045a949 100644
--- a/plugin/skills/typescript-standards/resources/module-system.md
+++ b/plugin/skills/typescript-standards/resources/module-system.md
@@ -107,6 +107,36 @@ user/
     └── validator.ts
 ```
 
+## Intra-Module Imports
+
+**CRITICAL:** Inside a module, nothing should ever import from its own `index.ts`. All imports within a module must use relative paths. The barrel is the module's public API for *external* consumers only. For nested modules, the same barrel rules apply.
+
+```typescript
+// Given this structure:
+// user/
+// ├── index.ts          ← barrel for external consumers
+// ├── create_user.ts
+// ├── update_user.ts
+// ├── types.ts
+// └── validation/
+//     ├── index.ts
+//     └── validate_email.ts
+
+// In user/create_user.ts:
+
+// GOOD: relative path to sibling file
+import type { User } from './types';
+
+// GOOD: relative path to nested sub-module barrel
+import { validateEmail } from './validation';
+
+// BAD: importing from own module's barrel
+import type { User } from '.';              // circular
+import { validateEmail } from './index';    // circular
+```
+
+**Why:** Importing from the module's own `index.ts` creates circular dependencies and defeats the purpose of the barrel (which is the module's public contract for external consumers, not internal wiring).
+
 ## No File Extensions in Imports
 
 **CRITICAL:** Never include file extensions in import statements.
diff --git a/tests/src/tests/unit/skills/frontend-scaffold/standards.test.ts b/tests/src/tests/unit/skills/frontend-scaffold/standards.test.ts
new file mode 100644
index 0000000..ebf79ff
--- /dev/null
+++ b/tests/src/tests/unit/skills/frontend-scaffold/standards.test.ts
@@ -0,0 +1,283 @@
+/**
+ * Frontend Scaffold Standards Tests
+ *
+ * WHY: Validates that scaffold templates implement the correct architecture
+ * (config injection, provider wiring, barrel exports) and that standards
+ * resources are aligned with task decisions (no interface keyword, no
+ * types/generated imports, no Zustand, correct version references).
+ */
+
+import { describe, expect, it } from 'vitest';
+import { SKILLS_DIR, PLUGIN_DIR, joinPath, fileExists, readFile } from '@/lib';
+
+const TEMPLATES_DIR = joinPath(
+  SKILLS_DIR,
+  'components',
+  'frontend',
+  'frontend-scaffolding',
+  'templates',
+);
+const STANDARDS_DIR = joinPath(
+  SKILLS_DIR,
+  'components',
+  'frontend',
+  'frontend-standards',
+);
+
+/**
+ * WHY: The App component must receive config as a prop and wrap children
+ * in AppConfigProvider so all downstream components can access config
+ * via useAppConfig(). Without this, config injection is broken.
+ */
+describe('App receives config prop', () => {
+  const APP_PATH = joinPath(TEMPLATES_DIR, 'src', 'app.tsx');
+
+  /** WHY: The template file must exist for the scaffold to produce it. */
+  it('app.tsx template exists', () => {
+    expect(fileExists(APP_PATH)).toBe(true);
+  });
+
+  /** WHY: App must declare a config prop so the mount function can pass it in. */
+  it('declares config in props type', () => {
+    const content = readFile(APP_PATH);
+    expect(content).toMatch(/config/);
+  });
+
+  /** WHY: AppConfigProvider must wrap children so hooks can access config. */
+  it('uses AppConfigProvider', () => {
+    const content = readFile(APP_PATH);
+    expect(content).toContain('AppConfigProvider');
+  });
+
+  /** WHY: Config value must be threaded through the provider. */
+  it('passes config to provider', () => {
+    const content = readFile(APP_PATH);
+    const hasConfigProp =
+      content.includes('config={config}') || content.includes('config: WebappConfig');
+    expect(hasConfigProp).toBe(true);
+  });
+});
+
+/**
+ * WHY: main.tsx must validate config and elementId at runtime before
+ * calling React render. Without validation, the app silently fails
+ * or produces cryptic errors when the host page misconfigures it.
+ */
+describe('Main validates config', () => {
+  const MAIN_PATH = joinPath(TEMPLATES_DIR, 'src', 'main.tsx');
+
+  /** WHY: The template file must exist for the scaffold to produce it. */
+  it('main.tsx template exists', () => {
+    expect(fileExists(MAIN_PATH)).toBe(true);
+  });
+
+  /** WHY: Runtime guard must throw on invalid config so failures are explicit. */
+  it('throws on invalid config', () => {
+    const content = readFile(MAIN_PATH);
+    expect(content).toContain('throw new Error');
+  });
+
+  /** WHY: Error messages must mention what went wrong for debuggability. */
+  it('has error messages for elementId and config', () => {
+    const content = readFile(MAIN_PATH);
+    const mentionsElementId = content.includes('elementId') || content.includes('element');
+    const mentionsConfig = content.includes('config');
+    expect(mentionsElementId).toBe(true);
+    expect(mentionsConfig).toBe(true);
+  });
+});
+
+/**
+ * WHY: components/index.ts must re-export from ./ui so downstream code
+ * can import UI components via the barrel (e.g., import { Button } from
+ * '@/components') instead of deep imports that bypass the barrel (D23).
+ */
+describe('Components index re-exports UI', () => {
+  const INDEX_PATH = joinPath(TEMPLATES_DIR, 'src', 'components', 'index.ts');
+
+  /** WHY: The barrel file must exist for barrel-only imports to work. */
+  it('components/index.ts exists', () => {
+    expect(fileExists(INDEX_PATH)).toBe(true);
+  });
+
+  /** WHY: Without re-exporting ./ui, consumers must deep-import UI components. */
+  it('re-exports from ./ui', () => {
+    const content = readFile(INDEX_PATH);
+    expect(content).toContain("'./ui'");
+  });
+});
+
+/**
+ * WHY: Frontend standards must use `type` instead of `interface` in all
+ * code examples. The TypeScript standards mandate type aliases for object
+ * shapes. If standards show interface, developers copy the wrong pattern.
+ * Exception: `declare module` augmentation requires `interface` for
+ * TypeScript declaration merging (e.g., TanStack Router's Register).
+ */
+describe('No interface keyword in standards', () => {
+  const STANDARDS_FILES = [
+    joinPath(STANDARDS_DIR, 'SKILL.md'),
+    joinPath(STANDARDS_DIR, 'resources', 'mvvm-patterns.md'),
+    joinPath(STANDARDS_DIR, 'resources', 'tailwind.md'),
+    joinPath(STANDARDS_DIR, 'resources', 'tanstack.md'),
+    joinPath(STANDARDS_DIR, 'resources', 'shadcn.md'),
+  ];
+
+  const interfacePattern = /\binterface\s+[A-Z]/;
+
+  for (const filePath of STANDARDS_FILES) {
+    const fileName = filePath.split('/').pop()!;
+
+    /** WHY: Each standards file must exist to be checked. */
+    it(`${fileName} exists`, () => {
+      expect(fileExists(filePath)).toBe(true);
+    });
+
+    /**
+     * WHY: interface keyword followed by a capital letter indicates a
+     * TypeScript interface declaration. Standards must use type aliases.
+     * Exception: interfaces inside `declare module` blocks are required
+     * for TypeScript declaration merging and are excluded from this check.
+     */
+    it(`${fileName} has no interface declarations (except in declare module)`, () => {
+      const content = readFile(filePath);
+      const lines = content.split('\n');
+
+      let inDeclareModule = false;
+      const violations = lines
+        .map((line, idx) => ({ line, num: idx + 1 }))
+        .filter(({ line }) => {
+          if (/declare\s+module\b/.test(line)) inDeclareModule = true;
+          if (inDeclareModule && line.trim() === '}') inDeclareModule = false;
+          if (inDeclareModule) return false;
+          return interfacePattern.test(line);
+        });
+
+      expect(
+        violations,
+        `interface keyword found in ${fileName}:\n${violations.map((v) => `  L${v.num}: ${v.line.trim()}`).join('\n')}`,
+      ).toHaveLength(0);
+    });
+  }
+});
+
+/**
+ * WHY: Standards must not reference types/generated.ts as a deep import.
+ * The architecture uses barrel imports from workspace packages. Deep imports
+ * to types/generated.ts couple consumers to internal file structure.
+ */
+describe('No types/generated imports in standards', () => {
+  const STANDARDS_FILES = [
+    joinPath(STANDARDS_DIR, 'SKILL.md'),
+    joinPath(STANDARDS_DIR, 'resources', 'mvvm-patterns.md'),
+    joinPath(STANDARDS_DIR, 'resources', 'tailwind.md'),
+    joinPath(STANDARDS_DIR, 'resources', 'tanstack.md'),
+    joinPath(STANDARDS_DIR, 'resources', 'shadcn.md'),
+  ];
+
+  for (const filePath of STANDARDS_FILES) {
+    const fileName = filePath.split('/').pop()!;
+
+    /**
+     * WHY: types/generated deep imports bypass barrel exports and couple
+     * code to internal file structure of the contracts package.
+     */
+    it(`${fileName} has no types/generated references`, () => {
+      if (!fileExists(filePath)) {
+        expect.fail(`${fileName} does not exist`);
+      }
+      const content = readFile(filePath);
+      expect(content).not.toContain('types/generated');
+    });
+  }
+});
+
+/**
+ * WHY: The frontend-dev agent must not reference Zustand. Task decisions
+ * replaced Zustand with useReducer + Context. If the agent still mentions
+ * Zustand, Claude will suggest it to users during frontend development.
+ */
+describe('Frontend dev agent has no Zustand', () => {
+  const AGENT_PATH = joinPath(PLUGIN_DIR, 'agents', 'frontend-dev.md');
+
+  /** WHY: The agent file must exist for the check to be meaningful. */
+  it('frontend-dev.md exists', () => {
+    expect(fileExists(AGENT_PATH)).toBe(true);
+  });
+
+  /** WHY: Any case variation of "zustand" indicates a stale reference. */
+  it('does not mention Zustand', () => {
+    const content = readFile(AGENT_PATH);
+    const lower = content.toLowerCase();
+    expect(lower).not.toContain('zustand');
+  });
+});
+
+/**
+ * WHY: The project template CLAUDE.md is the source of truth for version
+ * references in scaffolded projects. It must reference React 19 and
+ * TypeScript 5.9, not outdated React 18 or ambiguous TypeScript 5.
+ */
+describe('Project template CLAUDE.md versions', () => {
+  const CLAUDE_MD_PATH = joinPath(
+    SKILLS_DIR,
+    'project-scaffolding',
+    'templates',
+    'project',
+    'CLAUDE.md',
+  );
+
+  /** WHY: The template must exist for scaffolded projects to include it. */
+  it('CLAUDE.md template exists', () => {
+    expect(fileExists(CLAUDE_MD_PATH)).toBe(true);
+  });
+
+  /** WHY: React 19 is the current stable version used by the scaffold. */
+  it('references React 19', () => {
+    const content = readFile(CLAUDE_MD_PATH);
+    expect(content).toContain('React 19');
+  });
+
+  /** WHY: React 18 is outdated and must not appear. */
+  it('does not reference React 18', () => {
+    const content = readFile(CLAUDE_MD_PATH);
+    expect(content).not.toContain('React 18');
+  });
+
+  /** WHY: TypeScript 5.9 is the pinned version in the scaffold deps. */
+  it('references TypeScript 5.9', () => {
+    const content = readFile(CLAUDE_MD_PATH);
+    expect(content).toContain('TypeScript 5.9');
+  });
+});
+
+/**
+ * WHY: Template files must use the correct template variables so the
+ * scaffolding engine can substitute project-specific values. Missing
+ * variables produce broken output with literal {{VARIABLE}} strings.
+ */
+describe('Scaffold template variables', () => {
+  const PKG_PATH = joinPath(TEMPLATES_DIR, 'package.json');
+  const APP_PATH = joinPath(TEMPLATES_DIR, 'src', 'app.tsx');
+  const MAIN_PATH = joinPath(TEMPLATES_DIR, 'src', 'main.tsx');
+
+  /** WHY: package.json needs all three variables for name and workspace deps. */
+  it('package.json contains all template variables', () => {
+    const content = readFile(PKG_PATH);
+    expect(content).toContain('{{PROJECT_NAME}}');
+    expect(content).toContain('{{CONTRACT_PACKAGE}}');
+    expect(content).toContain('{{CONFIG_PACKAGE}}');
+  });
+
+  /** WHY: app.tsx imports config types from the config workspace package. */
+  it('app.tsx contains CONFIG_PACKAGE variable', () => {
+    const content = readFile(APP_PATH);
+    expect(content).toContain('{{CONFIG_PACKAGE}}');
+  });
+
+  /** WHY: main.tsx imports config types from the config workspace package. */
+  it('main.tsx contains CONFIG_PACKAGE variable', () => {
+    const content = readFile(MAIN_PATH);
+    expect(content).toContain('{{CONFIG_PACKAGE}}');
+  });
+});
diff --git a/tests/src/tests/unit/skills/frontend-scaffold/templates.test.ts b/tests/src/tests/unit/skills/frontend-scaffold/templates.test.ts
new file mode 100644
index 0000000..d685858
--- /dev/null
+++ b/tests/src/tests/unit/skills/frontend-scaffold/templates.test.ts
@@ -0,0 +1,301 @@
+/**
+ * Frontend Scaffold Template Tests
+ *
+ * WHY: Validates that frontend templates align with the documented
+ * Radix/Shadcn stack, enforce pinned deps, and barrel-only index files.
+ */
+
+import { describe, expect, it } from 'vitest';
+import { SKILLS_DIR, joinPath, fileExists, dirExists, readFile } from '@/lib';
+
+const TEMPLATES_DIR = joinPath(SKILLS_DIR, 'components', 'frontend', 'frontend-scaffolding', 'templates');
+
+/**
+ * WHY: Unpinned dependency versions cause non-reproducible builds.
+ * Every version string must be exact (no ^, ~, or "latest").
+ */
+describe('package.json all deps pinned', () => {
+  it('has no ^, ~, or latest in any dependency version', () => {
+    /** WHY: Floating versions let transitive breakage slip in silently. */
+    const pkg = JSON.parse(readFile(joinPath(TEMPLATES_DIR, 'package.json'))) as {
+      dependencies?: Record<string, string>;
+      devDependencies?: Record<string, string>;
+    };
+
+    const allDeps: Record<string, string> = {
+      ...pkg.dependencies,
+      ...pkg.devDependencies,
+    };
+
+    for (const [name, version] of Object.entries(allDeps)) {
+      if (version === 'workspace:*') continue;
+      expect(version, `${name} has unpinned version "${version}"`).not.toMatch(/^[\^~]/);
+      expect(version, `${name} uses "latest"`).not.toBe('latest');
+    }
+  });
+});
+
+/**
+ * WHY: The documented stack mandates specific libraries. Missing any means
+ * the scaffold is incomplete; having removed ones means legacy baggage.
+ */
+describe('package.json has required deps', () => {
+  it('includes every required dependency', () => {
+    /** WHY: Each library is part of the agreed Radix/TanStack/Tailwind stack. */
+    const pkg = JSON.parse(readFile(joinPath(TEMPLATES_DIR, 'package.json'))) as {
+      dependencies?: Record<string, string>;
+      devDependencies?: Record<string, string>;
+    };
+
+    const allDeps: Record<string, string> = {
+      ...pkg.dependencies,
+      ...pkg.devDependencies,
+    };
+
+    const required = [
+      '@radix-ui/react-slot',
+      'class-variance-authority',
+      'clsx',
+      'tailwind-merge',
+      '@tanstack/react-query',
+      '@tanstack/react-router',
+      '@tanstack/react-form',
+      '@tanstack/react-table',
+      'react',
+      'react-dom',
+      'radix-ui',
+      'eslint',
+      'typescript-eslint',
+      'typescript',
+      'vite',
+    ];
+
+    for (const dep of required) {
+      expect(allDeps, `missing required dependency: ${dep}`).toHaveProperty(dep);
+    }
+  });
+
+  it('does not include removed dependencies', () => {
+    /** WHY: Legacy deps conflict with the new unified typescript-eslint package. */
+    const pkg = JSON.parse(readFile(joinPath(TEMPLATES_DIR, 'package.json'))) as {
+      dependencies?: Record<string, string>;
+      devDependencies?: Record<string, string>;
+    };
+
+    const allDeps: Record<string, string> = {
+      ...pkg.dependencies,
+      ...pkg.devDependencies,
+    };
+
+    const forbidden = ['zustand', '@typescript-eslint/eslint-plugin', '@typescript-eslint/parser'];
+
+    for (const dep of forbidden) {
+      expect(allDeps, `forbidden dependency present: ${dep}`).not.toHaveProperty(dep);
+    }
+  });
+});
+
+/**
+ * WHY: The old split @typescript-eslint packages were replaced by the
+ * unified typescript-eslint package. Keeping both causes conflicts.
+ */
+describe('package.json no removed deps', () => {
+  it('does not contain legacy @typescript-eslint split packages', () => {
+    /** WHY: Dual presence of old + new eslint packages causes rule collisions. */
+    const pkg = JSON.parse(readFile(joinPath(TEMPLATES_DIR, 'package.json'))) as {
+      dependencies?: Record<string, string>;
+      devDependencies?: Record<string, string>;
+    };
+
+    const allDeps: Record<string, string> = {
+      ...pkg.dependencies,
+      ...pkg.devDependencies,
+    };
+
+    expect(allDeps).not.toHaveProperty('@typescript-eslint/eslint-plugin');
+    expect(allDeps).not.toHaveProperty('@typescript-eslint/parser');
+  });
+});
+
+/**
+ * WHY: Vite must serve from src/ so index.html lives alongside app code.
+ * Without root:'src', Vite looks for index.html in the wrong place.
+ */
+describe('vite config root is src', () => {
+  it('contains root: "src"', () => {
+    /** WHY: Ensures Vite resolves index.html from the src directory. */
+    const content = readFile(joinPath(TEMPLATES_DIR, 'vite.config.ts'));
+    expect(content).toContain("root: 'src'");
+  });
+});
+
+/**
+ * WHY: Path aliases let templates use @/ imports, keeping import paths
+ * short and refactor-safe. import.meta.dirname replaces __dirname in ESM.
+ */
+describe('vite config has alias', () => {
+  it('configures resolve alias with import.meta.dirname', () => {
+    /** WHY: Without alias config, @/ imports fail at build time. */
+    const content = readFile(joinPath(TEMPLATES_DIR, 'vite.config.ts'));
+    expect(content).toContain('resolve');
+    expect(content).toContain('alias');
+    expect(content).toContain('import.meta.dirname');
+  });
+});
+
+/**
+ * WHY: The plan removed several legacy directories that no longer belong
+ * in the frontend scaffold. Their presence means cleanup was incomplete.
+ */
+describe('no deleted directories', () => {
+  it('does not contain removed directories', () => {
+    /** WHY: Each of these was replaced by the new Radix/TanStack structure. */
+    const removed = ['api', 'viewmodels', 'models', 'stores', 'utils'];
+
+    for (const dir of removed) {
+      const dirPath = joinPath(TEMPLATES_DIR, dir);
+      expect(dirExists(dirPath), `deleted directory still exists: ${dir}/`).toBe(false);
+
+      const srcDirPath = joinPath(TEMPLATES_DIR, 'src', dir);
+      expect(dirExists(srcDirPath), `deleted directory still exists: src/${dir}/`).toBe(false);
+    }
+  });
+});
+
+/**
+ * WHY: Barrel files must re-export only. Executable code in barrels
+ * causes side-effects on import and defeats tree-shaking.
+ */
+describe('barrel files are pure exports', () => {
+  it('every index.ts contains only import/export statements', () => {
+    /** WHY: Side-effects in barrels break tree-shaking and cause hidden init bugs. */
+    const barrelFiles = [
+      'src/components/index.ts',
+      'src/components/layout/index.ts',
+      'src/components/sidebar/index.ts',
+      'src/components/ui/index.ts',
+      'src/hooks/index.ts',
+      'src/lib/index.ts',
+      'src/pages/index.ts',
+      'src/pages/home_page/index.ts',
+      'src/routes/index.ts',
+      'src/services/index.ts',
+      'src/types/index.ts',
+    ];
+
+    for (const relPath of barrelFiles) {
+      const fullPath = joinPath(TEMPLATES_DIR, relPath);
+      expect(fileExists(fullPath), `barrel file missing: ${relPath}`).toBe(true);
+
+      const content = readFile(fullPath);
+      const lines = content.split('\n');
+
+      for (const line of lines) {
+        const trimmed = line.trim();
+        if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
+          continue;
+        }
+        const isImportOrExport = trimmed.startsWith('import ') || trimmed.startsWith('export ');
+        expect(isImportOrExport, `${relPath} has non-export line: "${trimmed}"`).toBe(true);
+      }
+    }
+  });
+});
+
+/**
+ * WHY: ESLint config is required for the flat-config format used by
+ * eslint 9+ and typescript-eslint. Without it, linting does not work.
+ */
+describe('eslint config exists', () => {
+  it('eslint.config.js exists in templates dir', () => {
+    /** WHY: eslint 9 requires eslint.config.js (flat config). */
+    expect(fileExists(joinPath(TEMPLATES_DIR, 'eslint.config.js'))).toBe(true);
+  });
+});
+
+/**
+ * WHY: components.json is the Shadcn/ui configuration file that tells
+ * the CLI where to put generated components and how to resolve aliases.
+ */
+describe('components.json exists', () => {
+  it('components.json exists in templates dir', () => {
+    /** WHY: Without components.json, shadcn CLI cannot add new components. */
+    expect(fileExists(joinPath(TEMPLATES_DIR, 'components.json'))).toBe(true);
+  });
+});
+
+/**
+ * WHY: index.html must live in src/ (not root) because vite is
+ * configured with root:'src'. A root-level index.html would be stale.
+ */
+describe('index.html in src', () => {
+  it('src/index.html exists', () => {
+    /** WHY: Vite root is src/, so the entry HTML must be there. */
+    expect(fileExists(joinPath(TEMPLATES_DIR, 'src', 'index.html'))).toBe(true);
+  });
+
+  it('root-level index.html does NOT exist', () => {
+    /** WHY: A root index.html would shadow the real one and confuse Vite. */
+    expect(fileExists(joinPath(TEMPLATES_DIR, 'index.html'))).toBe(false);
+  });
+});
+
+/**
+ * WHY: The Button component is the canonical Shadcn/ui primitive. It must
+ * use Radix Slot for asChild composition to validate real Radix integration.
+ */
+describe('button uses Radix Slot', () => {
+  it('imports Slot from @radix-ui/react-slot and uses asChild pattern', () => {
+    /** WHY: asChild via Slot is the Radix composition model Shadcn depends on. */
+    const buttonPath = joinPath(TEMPLATES_DIR, 'src', 'components', 'ui', 'button.tsx');
+    const content = readFile(buttonPath);
+
+    expect(content).toContain("from '@radix-ui/react-slot'");
+    expect(content).toMatch(/Slot/);
+    expect(content).toContain('asChild ? Slot');
+  });
+});
+
+/**
+ * WHY: All cross-group imports must use top-level barrel imports
+ * (e.g. @/components, @/hooks, @/pages) — single segment after @/.
+ * Sub-barrel imports like @/components/sidebar bypass the top-level
+ * barrel and create tighter coupling between groups.
+ */
+describe('no deep imports', () => {
+  it('every @/ import uses only the top-level barrel (1 segment)', () => {
+    /** WHY: Barrel-only imports keep refactoring local to each directory group. */
+    const sourceFiles = [
+      'src/app.tsx',
+      'src/main.tsx',
+      'src/components/ui/button.tsx',
+      'src/components/sidebar/sidebar.tsx',
+      'src/components/layout/layout.tsx',
+      'src/pages/home_page/home_page.tsx',
+      'src/hooks/use_query_client.ts',
+      'src/hooks/use_app_router.ts',
+      'src/hooks/use_app_config.tsx',
+      'src/routes/routes.tsx',
+      'src/lib/utils.ts',
+    ];
+
+    const deepImportPattern = /from\s+['"]@\/([^'"]+)['"]/g;
+
+    for (const relPath of sourceFiles) {
+      const fullPath = joinPath(TEMPLATES_DIR, relPath);
+      if (!fileExists(fullPath)) continue;
+
+      const content = readFile(fullPath);
+      let match: RegExpExecArray | null;
+
+      while ((match = deepImportPattern.exec(content)) !== null) {
+        const importPath = match[1]!;
+        const segments = importPath.split('/');
+        expect(
+          segments.length,
+          `${relPath} has deep import "@/${importPath}" (${segments.length} segments, max 1)`
+        ).toBeLessThanOrEqual(1);
+      }
+    }
+  });
+});
