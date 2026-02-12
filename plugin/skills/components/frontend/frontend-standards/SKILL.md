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

## Resource Files

For detailed guidance, read these on-demand:
- [tanstack.md](resources/tanstack.md) — Router, Query, Table, Form patterns
- [mvvm-patterns.md](resources/mvvm-patterns.md) — Model, ViewModel, View with Zustand examples
- [tailwind.md](resources/tailwind.md) — Utility classes, responsive, dark mode, clsx

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
