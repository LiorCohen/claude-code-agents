---
name: frontend-standards
description: MVVM architecture standards for React/TypeScript frontends with TanStack ecosystem and TailwindCSS.
---


# Frontend Standards Skill

MVVM architecture for React/TypeScript frontends with strict separation between View, ViewModel, and Model layers.

---

## Architecture: MVVM (Model-View-ViewModel)

```text
View (React Components) → ViewModel (Hooks) → Model (Business Logic)
         ↓                       ↓                    ↓
    TailwindCSS            TanStack Query         Services/API
                           Zustand Stores
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
├── pages/                    # Page components (Views + ViewModels + Models)
│   ├── home_page/
│   │   ├── index.ts          # Exports only
│   │   ├── home_page.tsx     # View component
│   │   ├── use_home_view_model.ts  # ViewModel hook
│   │   ├── home_model.ts     # Page-specific model (business logic)
│   │   └── home_page.test.tsx
│   └── user_profile/
│       ├── index.ts
│       ├── user_profile.tsx
│       ├── use_user_profile_view_model.ts
│       ├── user_profile_model.ts
│       └── user_profile.test.tsx
├── components/               # Shared presentational components
│   ├── button/
│   │   ├── index.ts
│   │   ├── button.tsx
│   │   └── button.test.tsx
│   └── ...
├── viewmodels/               # Shared ViewModel hooks
│   ├── use_auth.ts
│   ├── use_user_data.ts
│   └── ...
├── services/                 # API clients and external services
│   ├── api/
│   │   ├── users.ts
│   │   └── auth.ts
│   └── ...
├── types/                    # Generated types from OpenAPI
│   └── generated.ts          # Auto-generated from contract
├── stores/                   # Global state (Zustand)
│   ├── auth_store.ts
│   └── ...
└── utils/                    # Pure utility functions
    └── ...
```

---

## Layer 1: Model

Business logic and domain rules. **No React dependencies.**

**Page-Specific Models** (`pages/<name>/<name>_model.ts`):
- Business logic specific to that page
- Data transformation and validation
- Pure functions, no side effects

**Shared Services** (`services/`):
- API communication
- External service clients
- Shared across pages

```typescript
// src/pages/user_profile/user_profile_model.ts
import type { User } from '../../types/generated';

export const formatUserDisplayName = (user: User): string => {
  return user.name || user.email.split('@')[0];
};

export const canEditProfile = (currentUserId: string, profileUserId: string): boolean => {
  return currentUserId === profileUserId;
};
```

**Model Rules:**
- No React imports
- No UI concerns
- Pure functions preferred
- Import only from `types/` and other models

---

## Layer 2: ViewModel

React hooks that connect Model to View. State management and side effects live here.

**Page-Specific ViewModels** (`pages/<name>/use_<name>_view_model.ts`):
- One ViewModel hook per page
- Returns data and callbacks for View consumption
- All properties in return type are `readonly`

**Shared ViewModels** (`viewmodels/`):
- Reusable across multiple pages
- Authentication, user data, etc.

```typescript
// src/pages/user_profile/use_user_profile_view_model.ts
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import type { User } from '../../types/generated';
import { fetchUser } from '../../services/api/users';
import { formatUserDisplayName, canEditProfile } from './user_profile_model';
import { useAuthStore } from '../../stores/auth_store';

interface UserProfileViewModel {
  readonly user: User | undefined;
  readonly displayName: string;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly canEdit: boolean;
  readonly handleEdit: () => void;
}

export const useUserProfileViewModel = (userId: string): UserProfileViewModel => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  const displayName = user ? formatUserDisplayName(user) : '';
  const canEdit = currentUser ? canEditProfile(currentUser.id, userId) : false;

  const handleEdit = () => {
    navigate({ to: '/users/$userId/edit', params: { userId } });
  };

  return {
    user,
    displayName,
    isLoading,
    error,
    canEdit,
    handleEdit,
  };
};
```

**ViewModel Rules:**
- Return interface with all `readonly` properties
- Use TanStack Query for server state
- Use Zustand for global client state
- Call Model functions for business logic
- No JSX rendering

---

## Layer 3: View

React components that render UI. **No business logic.**

```typescript
// src/pages/user_profile/user_profile.tsx
import { useUserProfileViewModel } from './use_user_profile_view_model';

interface UserProfileProps {
  readonly userId: string;
}

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

## TanStack Ecosystem (Mandatory)

### TanStack Router

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

### TanStack Query

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

### TanStack Table

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

### TanStack Form

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

---

## TailwindCSS (Mandatory)

**All styling MUST use TailwindCSS utility classes.**

### Basic Usage

```typescript
export const Button = ({ children, onClick }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors duration-200"
    >
      {children}
    </button>
  );
};
```

### Responsive Design

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

### Dark Mode Support

```typescript
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  {/* Automatic dark mode */}
</div>
```

### Component Variants with clsx

```typescript
import clsx from 'clsx';

interface ButtonProps {
  readonly variant?: 'primary' | 'secondary' | 'danger';
}

export const Button = ({ variant = 'primary', children }: ButtonProps) => {
  return (
    <button
      className={clsx(
        'px-4 py-2 rounded-lg transition-colors',
        variant === 'primary' && 'bg-blue-500 hover:bg-blue-600 text-white',
        variant === 'secondary' && 'bg-gray-200 hover:bg-gray-300 text-gray-900',
        variant === 'danger' && 'bg-red-500 hover:bg-red-600 text-white'
      )}
    >
      {children}
    </button>
  );
};
```

### Styling Rules

- **NO inline styles** (`style={{ ... }}` is forbidden)
- **NO CSS files** (no .css, .scss, .less files except for global Tailwind setup)
- **NO CSS-in-JS libraries** (no styled-components, emotion, etc.)
- Use Tailwind utility classes only
- Use `clsx` for conditional classes
- Extract repeated patterns into reusable components, not CSS classes

---

## State Management

| Type | Tool | Usage |
|------|------|-------|
| Server state | TanStack Query | All API data fetching |
| Global client state | Zustand | Auth, theme, user preferences |
| Local client state | useState | Form inputs, UI toggles |
| URL state | TanStack Router | Pagination, filters, search |

### Zustand Store Pattern

```typescript
// src/stores/auth_store.ts
import { create } from 'zustand';
import type { User } from '../types/generated';

interface AuthState {
  readonly user: User | null;
  readonly isAuthenticated: boolean;
  readonly login: (user: User) => void;
  readonly logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

---

## Type Consumption

**Always consume generated types from contract:**

```typescript
import type { User, CreateUserRequest, ApiError } from '../../types/generated';
```

Never hand-write API types—they are generated from the contract component's `openapi.yaml` at `components/contracts/{name}/openapi.yaml`.

---

## No Implicit Global Code

All code must be explicitly invoked—no side effects on module import.

```typescript
// GOOD: Explicit function calls
export const initializeApp = () => {
  // Setup code here
};

export const App = () => {
  return <div>...</div>;
};

// Entry point explicitly calls init
initializeApp();
ReactDOM.render(<App />, root);

// BAD: Code runs on import
const analytics = new Analytics(); // Runs immediately
analytics.track('module_loaded'); // Side effect on import
```

This ensures:
- Code is testable
- Tree-shaking works correctly
- No hidden dependencies or execution order issues

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
- `src/viewmodels/use_auth.ts`
- `src/stores/auth_store.ts`

**Note:** Component names in code remain PascalCase (e.g., `export const UserProfile = ...`).

---

## Presentational Components

Shared components go in `src/components/`:

```typescript
// src/components/user_card/user_card.tsx
import type { User } from '../../types/generated';

interface UserCardProps {
  readonly user: User;
  readonly onEdit: (id: string) => void;
}

export const UserCard = ({ user, onEdit }: UserCardProps) => {
  return (
    <div className="p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
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
- [ ] ViewModel returns interface with all `readonly` properties
- [ ] Model has no React dependencies
- [ ] TanStack Router used for all navigation
- [ ] TanStack Query used for all server state
- [ ] TailwindCSS used for all styling (no CSS files, no inline styles)
- [ ] All filenames use `lowercase_with_underscores`
- [ ] Generated types consumed from `types/generated.ts`
- [ ] No implicit global code (all code explicitly invoked)
- [ ] Zustand stores follow readonly pattern
- [ ] Props interfaces use `readonly` modifier

---

## Input / Output

This skill defines no input parameters or structured output.
