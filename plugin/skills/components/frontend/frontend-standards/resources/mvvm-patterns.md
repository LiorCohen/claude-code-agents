# MVVM Layer Patterns

Detailed patterns for each MVVM layer with code examples.

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
