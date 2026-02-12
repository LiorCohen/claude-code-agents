# TanStack Ecosystem (Mandatory)

## TanStack Router

**Mandatory for all routing and navigation.**

```typescript
// src/routes/index.tsx
import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { UserProfile } from '../pages/user_profile';

const rootRoute = createRootRoute();

const userProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId',
  component: () => {
    const { userId } = userProfileRoute.useParams();
    return <UserProfile userId={userId} />;
  },
});

export const router = createRouter({
  routeTree: rootRoute.addChildren([userProfileRoute])
});
```

**Navigation in ViewModels:**
```typescript
import { useNavigate } from '@tanstack/react-router';

const navigate = useNavigate();
navigate({ to: '/users/$userId', params: { userId: '123' } });
```

## TanStack Query

**Mandatory for all server state.**

```typescript
// src/services/api/users.ts (Model layer)
import type { User } from '../../types/generated';

export const fetchUser = async (id: string): Promise<User> => {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
};

// src/pages/user_profile/use_user_profile_view_model.ts (ViewModel layer)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const { data: user, isLoading, error } = useQuery<User>({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
});

const updateMutation = useMutation({
  mutationFn: (updates: Partial<User>) => updateUser(userId, updates),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['user', userId] });
  },
});
```

## TanStack Table

**Mandatory for tabular data display.**

```typescript
import { useReactTable, getCoreRowModel, createColumnHelper } from '@tanstack/react-table';

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
