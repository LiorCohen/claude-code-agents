# TanStack Ecosystem (Mandatory)

## TanStack Router (1.x)

**Mandatory for all routing and navigation.**

### Route Factory Pattern

Routes are defined via a `createAppRouter()` factory function, not instantiated at module scope. This ensures no side-effects on import and supports lazy creation inside providers.

```typescript
// src/routes/routes.tsx
import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { UserProfile } from '@/pages';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- AppRouter derives via ReturnType<>; explicit annotation would be circular
export const createAppRouter = () => {
  const rootRoute = createRootRoute();

  const userProfileRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/users/$userId',
    component: () => {
      const { userId } = userProfileRoute.useParams();
      return <UserProfile userId={userId} />;
    },
  });

  const routeTree = rootRoute.addChildren([userProfileRoute]);

  return createRouter({ routeTree });
};
```

### Type Registration

Register the router type so `useNavigate`, `useParams`, etc. are fully typed throughout the app.

> **Exception:** `declare module` augmentation requires `interface` (not `type`) because TypeScript declaration merging only works with interfaces.

```typescript
// src/routes/routes.tsx (at bottom of file)
export type AppRouter = ReturnType<typeof createAppRouter>;

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter;
  }
}
```

### Using the Router in the App

The router is lazily instantiated via `useState` inside the provider component (see D22):

```typescript
// src/components/app.tsx
import { useState } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { createAppRouter } from '@/routes';

export const App = () => {
  const [router] = useState(() => createAppRouter());
  return <RouterProvider router={router} />;
};
```

### Navigation in ViewModels

```typescript
import { useNavigate } from '@tanstack/react-router';

const navigate = useNavigate();
navigate({ to: '/users/$userId', params: { userId: '123' } });
```

---

## TanStack Query (5.x)

**Mandatory for all server state.**

```typescript
// src/services/users.ts (Model layer)
import type { User } from '@my-org/api-types';

export const fetchUser = async (id: string): Promise<User> => {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
};

// src/pages/user_profile/use_user_profile_view_model.ts (ViewModel layer)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUser, updateUser } from '@/services';

const { data: user, isLoading, error } = useQuery<User>({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
});

const queryClient = useQueryClient();
const updateMutation = useMutation({
  mutationFn: (updates: Partial<User>) => updateUser(userId, updates),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['user', userId] });
  },
});
```

---

## TanStack Table

**Mandatory for tabular data display.**

```typescript
import { useReactTable, getCoreRowModel, createColumnHelper } from '@tanstack/react-table';
import type { User } from '@my-org/api-types';

const columnHelper = createColumnHelper<User>();
const columns = [
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor('email', { header: 'Email' }),
];

const table = useReactTable({
  data: users,
  columns,
  getCoreRowModel: getCoreRowModel(),
});
```

---

## TanStack Form

**Mandatory for complex forms with validation.**

```typescript
import { useForm } from '@tanstack/react-form';

const form = useForm({
  defaultValues: { name: '', email: '' },
  onSubmit: async ({ value }) => {
    await createUser(value);
  },
});
```
