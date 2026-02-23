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
import type { User } from '@my-org/api-types';

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
- Import types from workspace packages via barrel imports

---

## Layer 2: ViewModel

React hooks that connect Model to View. State management and side effects live here.

**Page-Specific ViewModels** (`pages/<name>/use_<name>_view_model.ts`):
- One ViewModel hook per page
- Returns data and callbacks for View consumption
- All properties in return type are `readonly`

**Shared Hooks** (`hooks/`):
- Reusable across multiple pages
- Authentication, user data, etc.

```typescript
// src/pages/user_profile/use_user_profile_view_model.ts
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import type { User } from '@my-org/api-types';
import { fetchUser } from '@/services';
import { formatUserDisplayName, canEditProfile } from './user_profile_model';
import { useAuth } from '@/hooks';

type UserProfileViewModel = {
  readonly user: User | undefined;
  readonly displayName: string;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly canEdit: boolean;
  readonly handleEdit: () => void;
};

export const useUserProfileViewModel = (userId: string): UserProfileViewModel => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

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
- Return type with all `readonly` properties
- Use TanStack Query for server state
- Use `useReducer` + Context for global client state (encapsulated behind hooks)
- Call Model functions for business logic
- No JSX rendering

---

## State Management

| Type | Tool | Usage |
|------|------|-------|
| Server state | TanStack Query | All API data fetching |
| Global client state | `useReducer` + Context | Auth, theme, user preferences |
| Local client state | `useState` | Form inputs, UI toggles |
| URL state | TanStack Router | Pagination, filters, search |

### useReducer + Context Pattern

Global client state uses `useReducer` + Context, encapsulated behind custom hooks. Consumers never interact with the context or reducer directly.

```typescript
// src/hooks/use_auth.ts
import { useReducer, useContext, createContext, useCallback } from 'react';
import type { User } from '@my-org/api-types';

// --- State & Reducer (not exported) ---

type AuthState = {
  readonly user: User | null;
  readonly isAuthenticated: boolean;
};

type AuthAction =
  | { readonly type: 'LOGIN'; readonly user: User }
  | { readonly type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN':
      return { user: action.user, isAuthenticated: true };
    case 'LOGOUT':
      return { user: null, isAuthenticated: false };
    default:
      return state;
  }
};

// --- Context (not exported) ---

type AuthContextValue = {
  readonly state: AuthState;
  readonly dispatch: React.Dispatch<AuthAction>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// --- Provider (exported) ---

export const AuthProvider = ({ children }: { readonly children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Hook (exported) — the ONLY public API ---

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');

  const { state, dispatch } = context;

  const login = useCallback(
    (user: User) => dispatch({ type: 'LOGIN', user }),
    [dispatch],
  );

  const logout = useCallback(
    () => dispatch({ type: 'LOGOUT' }),
    [dispatch],
  );

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    login,
    logout,
  } as const;
};
```

**Key points:**
- The reducer, state type, action type, and context are **not exported** — they are implementation details
- Only the `AuthProvider` component and `useAuth` hook are exported
- Consumers call `useAuth()` and get a clean, readonly API
- This pattern is testable, tree-shakeable, and has no module-level side-effects
