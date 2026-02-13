---
name: frontend-standards
description: MVVM architecture standards for React/TypeScript frontends with TanStack ecosystem, TailwindCSS, and Shadcn UI.
---


# Frontend Standards Skill

MVVM architecture for React/TypeScript frontends with strict separation between View, ViewModel, and Model layers.

---

## Architecture: MVVM (Model-View-ViewModel)

```text
View (React Components) → ViewModel (Hooks) → Model (Business Logic)
         ↓                       ↓                    ↓
    TailwindCSS            TanStack Query         Services/API
    Shadcn UI              useReducer+Context
```

### Key Distinction: UI vs Logic

| Layer | Knows About | Example |
|-------|-------------|---------|
| **View** | UI rendering only | "Display user name in a card with blue border" |
| **ViewModel** | State and handlers | "Fetch user, track loading, provide edit handler" |
| **Model** | Business rules | "Format display name, check edit permissions" |

**Key Principle:** Views never contain business logic. ViewModels connect Views to Models. Models are framework-agnostic.

---

## Directory Structure

```text
src/
├── components/               # Shared presentational components
│   ├── user_card/
│   │   ├── index.ts          # Barrel exports only
│   │   ├── user_card.tsx
│   │   └── user_card.test.tsx
│   └── ui/                   # Shadcn UI primitives (see shadcn.md)
│       ├── index.ts
│       ├── button.tsx
│       ├── dialog.tsx
│       └── ...
├── hooks/                    # Shared hooks (auth, user data, etc.)
│   ├── index.ts
│   ├── use_auth.ts
│   ├── use_user_data.ts
│   └── ...
├── lib/                      # Pure utilities and helpers
│   ├── index.ts
│   ├── cn.ts                 # cn() — clsx + tailwind-merge
│   └── ...
├── pages/                    # Page components (View + ViewModel + Model)
│   ├── home_page/
│   │   ├── index.ts
│   │   ├── home_page.tsx
│   │   ├── use_home_view_model.ts
│   │   ├── home_model.ts
│   │   └── home_page.test.tsx
│   └── user_profile/
│       ├── index.ts
│       ├── user_profile.tsx
│       ├── use_user_profile_view_model.ts
│       ├── user_profile_model.ts
│       └── user_profile.test.tsx
├── routes/                   # TanStack Router route definitions
│   ├── index.ts
│   └── routes.tsx            # createAppRouter() factory
├── services/                 # API clients and external services (flat)
│   ├── index.ts
│   ├── users.ts
│   ├── auth.ts
│   └── ...
├── types/                    # App-local type definitions
│   ├── index.ts
│   └── ...
└── index.ts                  # Entry point (only file with side-effects)
```

### Directory Allowlist (D18)

Only the following `src/` subdirectories are permitted:

- `components/` — shared presentational components
- `components/ui/` — Shadcn UI primitives
- `hooks/` — shared hooks (replaces `viewmodels/`)
- `lib/` — pure utilities and helpers
- `pages/` — page components (View + ViewModel + Model)
- `routes/` — TanStack Router route definitions
- `services/` — API clients and external services (flat, no subdirectories)
- `types/` — app-local type definitions

**No new top-level `src/` directories.** If something doesn't fit, it belongs in one of the above.

---

## Barrel-Only Index Files (D20)

All `index.ts` files must be **pure barrels** — imports and re-exports only. No logic, no side effects.

```typescript
// src/hooks/index.ts — GOOD: pure barrel
export { useAuth } from './use_auth';
export { useUserData } from './use_user_data';
```

- Always `.ts` (never `.tsx`) for index files
- No function definitions, no variable assignments, no conditional logic

---

## Barrel Imports Only (D23)

Every subdirectory has an `index.ts` barrel. All imports from outside a directory go through its barrel.

```typescript
// GOOD: barrel import
import { useAuth } from '@/hooks';
import { cn } from '@/lib';
import { fetchUser } from '@/services';

// BAD: deep import
import { useAuth } from '@/hooks/use_auth';
import { cn } from '@/lib/cn';
import { fetchUser } from '@/services/users';
```

**Exception:** Intra-directory imports (files within the same directory) use relative paths to siblings directly.

---

## No Side-Effects (D19)

Only `src/index.ts` (the app entry point) may have module-level side-effects (CSS import, `ReactDOM.render`, window assignment). All other files must be side-effect free.

```typescript
// src/index.ts — OK: entry point, side-effects allowed
import './index.css';
import { createRoot } from 'react-dom/client';
import { App } from '@/components';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

// src/lib/cn.ts — GOOD: no side-effects, exports only
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

---

## Hooks for Providers (D22)

`QueryClient` and router instances must be lazily created via `useState` hooks inside provider components. No direct instantiation at module scope.

```typescript
// GOOD: lazy creation inside component
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const AppQueryProvider = ({ children }: { readonly children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } },
  }));

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

// BAD: module-scope instantiation (side-effect)
const queryClient = new QueryClient();
```

---

## Factory Functions for Routes (D21)

Routes use a `createAppRouter()` factory exported from `routes/routes.tsx`. Type registration uses `ReturnType<typeof createAppRouter>`.

```typescript
// src/routes/routes.tsx
import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router';

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <HomePage />,
});

export const createAppRouter = () =>
  createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
  });

// Type registration
declare module '@tanstack/react-router' {
  type Register = {
    router: ReturnType<typeof createAppRouter>;
  };
}
```

---

## `cn()` for Class Merging

Use `cn()` from `@/lib` (clsx + tailwind-merge) instead of raw `clsx`. This correctly handles Tailwind class conflicts.

```typescript
import { cn } from '@/lib';

export const Card = ({ className, children }: CardProps) => (
  <div className={cn('rounded-lg border p-4', className)}>
    {children}
  </div>
);
```

---

## Layer 3: View

React components that render UI. **No business logic.**

```typescript
// src/pages/user_profile/user_profile.tsx
import { useUserProfileViewModel } from './use_user_profile_view_model';

type UserProfileProps = {
  readonly userId: string;
};

export const UserProfile = ({ userId }: UserProfileProps) => {
  const { user, displayName, isLoading, error, canEdit, handleEdit } = useUserProfileViewModel(userId);

  if (isLoading) return <div className="flex items-center justify-center">Loading...</div>;
  if (error) return <div className="text-red-600">Error: {error.message}</div>;
  if (!user) return <div className="text-gray-500">User not found</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{displayName}</h1>
      <p className="text-gray-600">{user.email}</p>
      {canEdit && (
        <button
          onClick={handleEdit}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Edit Profile
        </button>
      )}
    </div>
  );
};
```

**View Rules:**
- Only render data from ViewModel
- Only call ViewModel handlers
- No direct API calls
- No business logic calculations
- TailwindCSS for all styling

---

## Resource Files

For detailed guidance, read these on-demand:
- [tanstack.md](resources/tanstack.md) — Router, Query, Table, Form patterns
- [mvvm-patterns.md](resources/mvvm-patterns.md) — Model, ViewModel, View with useReducer+Context examples
- [tailwind.md](resources/tailwind.md) — Utility classes, responsive, dark mode, cn()
- [shadcn.md](resources/shadcn.md) — Shadcn UI component anatomy, cva variants, Radix primitives

---

## Type Consumption

**Always consume shared API types from workspace packages via barrel imports:**

```typescript
import type { User, CreateUserRequest, ApiError } from '@my-org/api-types';
```

Never hand-write API types — they are generated from the contract component's `openapi.yaml` at `components/contracts/{name}/openapi.yaml`.

---

## File Naming

**CRITICAL: Use `lowercase_with_underscores` for ALL filenames**

| Pattern | Example | Status |
|---------|---------|--------|
| `lowercase_with_underscores` | `user_profile.tsx` | CORRECT |
| PascalCase | `UserProfile.tsx` | WRONG |
| camelCase | `userProfile.tsx` | WRONG |
| kebab-case | `user-profile.tsx` | WRONG |

**Examples:**
- `src/pages/user_profile/user_profile.tsx`
- `src/pages/user_profile/use_user_profile_view_model.ts`
- `src/pages/user_profile/user_profile_model.ts`
- `src/components/button/button.tsx`
- `src/hooks/use_auth.ts`
- `src/services/users.ts`

**Note:** Component names in code remain PascalCase (e.g., `export const UserProfile = ...`).

---

## Presentational Components

Shared components go in `src/components/`:

```typescript
// src/components/user_card/user_card.tsx
import type { User } from '@my-org/api-types';
import { cn } from '@/lib';

type UserCardProps = {
  readonly user: User;
  readonly onEdit: (id: string) => void;
  readonly className?: string;
};

export const UserCard = ({ user, onEdit, className }: UserCardProps) => {
  return (
    <div className={cn('p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow', className)}>
      <h2 className="text-xl font-semibold mb-2">{user.name}</h2>
      <p className="text-gray-600 mb-4">{user.email}</p>
      <button
        onClick={() => onEdit(user.id)}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Edit
      </button>
    </div>
  );
};
```

**Presentational Component Rules:**
- Receive data and callbacks as props
- No data fetching
- No business logic
- All props use `readonly`

---

## Summary Checklist

Before committing frontend code, verify:

- [ ] Page follows MVVM structure (View + ViewModel + Model files)
- [ ] View contains no business logic
- [ ] ViewModel returns type with all `readonly` properties
- [ ] Model has no React dependencies
- [ ] TanStack Router used for all navigation (factory pattern)
- [ ] TanStack Query used for all server state
- [ ] TailwindCSS used for all styling (no CSS files, no inline styles)
- [ ] `cn()` used for class merging (not raw `clsx`)
- [ ] All filenames use `lowercase_with_underscores`
- [ ] Types consumed from workspace packages via barrel imports
- [ ] No module-level side-effects (except `src/index.ts`)
- [ ] All `index.ts` files are pure barrels
- [ ] All imports go through barrels (no deep imports)
- [ ] Only allowlisted directories exist in `src/`
- [ ] Props types use `readonly` modifier
- [ ] `useReducer` + Context for global client state (no Zustand)

---

## Input / Output

This skill defines no input parameters or structured output.
