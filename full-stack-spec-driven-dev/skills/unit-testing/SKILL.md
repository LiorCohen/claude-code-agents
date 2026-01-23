---
name: unit-testing
description: Unit testing patterns with Vitest - mocking, fixtures, isolation, and fast feedback.
---


# Unit Testing Skill

Fast, isolated tests that verify individual functions and modules. Unit tests run in the CI runner (not Kubernetes) for rapid feedback.

---

## Overview

| Aspect | Details |
|--------|---------|
| Location | `components/*/src/**/*.test.ts` |
| Framework | Vitest |
| Runs In | CI runner (fast feedback) |
| Written By | Implementors (alongside their code) |

---

## Test Structure

### File Naming

Place test files next to the code they test:

```
src/model/use-cases/
├── create_user.ts
├── create_user.test.ts      # Unit test for create_user
├── update_user.ts
└── update_user.test.ts
```

### Basic Pattern

```typescript
// src/model/use-cases/create_user.test.ts
import { describe, it, expect } from 'vitest';
import { createUser } from './create_user';
import type { Dependencies } from '../dependencies';

/**
 * @spec specs/changes/user-management/SPEC.md
 * @issue PROJ-123
 */
describe('createUser', () => {
  describe('AC1: Valid user creation', () => {
    it('creates user when email is unique', async () => {
      // Arrange (Given)
      const mockDeps = createMockDependencies();
      const args = { email: 'test@example.com', name: 'Test User' };

      // Act (When)
      const result = await createUser(mockDeps, args);

      // Assert (Then)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user.email).toBe('test@example.com');
      }
    });
  });
});
```

---

## Mocking Strategies

### Dependency Injection Mocks

For functions that receive dependencies as the first argument (CMDO pattern):

```typescript
import type { Dependencies } from '../dependencies';

const createMockDependencies = (overrides?: Partial<Dependencies>): Dependencies => ({
  findUserByEmail: async () => null,
  findUserById: async () => null,
  insertUser: async (data) => ({ id: 'mock-id', ...data, createdAt: new Date() }),
  updateUser: async (id, data) => ({ id, ...data, updatedAt: new Date() }),
  ...overrides,
});

// Usage in tests
it('returns error when email exists', async () => {
  const deps = createMockDependencies({
    findUserByEmail: async () => ({ id: '123', email: 'exists@test.com', name: 'Existing' }),
  });

  const result = await createUser(deps, { email: 'exists@test.com', name: 'New' });

  expect(result.success).toBe(false);
});
```

### Vitest Mock Functions

For tracking calls and controlling return values:

```typescript
import { describe, it, expect, vi } from 'vitest';

it('calls insertUser with correct data', async () => {
  const insertUser = vi.fn().mockResolvedValue({ id: '123', email: 'test@example.com' });
  const deps = createMockDependencies({ insertUser });

  await createUser(deps, { email: 'test@example.com', name: 'Test' });

  expect(insertUser).toHaveBeenCalledOnce();
  expect(insertUser).toHaveBeenCalledWith(
    expect.objectContaining({ email: 'test@example.com' })
  );
});
```

### Module Mocks

For mocking entire modules (use sparingly):

```typescript
import { vi } from 'vitest';

vi.mock('../services/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ sent: true }),
}));

import { sendEmail } from '../services/email';

it('sends welcome email after user creation', async () => {
  await createUserWithWelcomeEmail(deps, { email: 'new@test.com' });

  expect(sendEmail).toHaveBeenCalledWith(
    expect.objectContaining({ to: 'new@test.com', template: 'welcome' })
  );
});
```

---

## Fixtures and Test Data

### Factory Functions

Create reusable factories for test data:

```typescript
// src/__tests__/fixtures/user.ts
import type { User } from '../../types/generated';

export const createTestUser = (overrides?: Partial<User>): User => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'planner',
  clientId: 'test-client',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

// Usage
it('formats user display name', () => {
  const user = createTestUser({ name: 'John Doe' });
  expect(formatDisplayName(user)).toBe('John Doe');
});

it('uses email when name is empty', () => {
  const user = createTestUser({ name: '', email: 'john@example.com' });
  expect(formatDisplayName(user)).toBe('john');
});
```

### Shared Test Constants

```typescript
// src/__tests__/fixtures/constants.ts
export const TEST_USER_ID = 'test-user-123';
export const TEST_CLIENT_ID = 'test-client-456';
export const TEST_EMAIL = 'test@example.com';

export const VALID_CREDENTIALS = {
  email: TEST_EMAIL,
  password: 'ValidPass123!',
};

export const INVALID_CREDENTIALS = {
  email: TEST_EMAIL,
  password: 'wrong',
};
```

---

## Isolation Strategies

### Reset State Between Tests

```typescript
import { describe, it, beforeEach, afterEach, vi } from 'vitest';

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Tests run in isolation
});
```

### Avoid Shared Mutable State

```typescript
// BAD: Shared mutable state
let testUser = { id: '1', name: 'Test' };

it('test 1', () => {
  testUser.name = 'Modified'; // Affects other tests!
});

// GOOD: Create fresh data per test
it('test 1', () => {
  const testUser = createTestUser();
  // Modifications don't affect other tests
});
```

### Time Mocking

```typescript
import { vi, beforeEach, afterEach } from 'vitest';

describe('time-dependent tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calculates expiration correctly', () => {
    const token = createToken({ expiresIn: '1h' });
    expect(token.expiresAt).toEqual(new Date('2026-01-15T11:00:00Z'));
  });
});
```

---

## Testing Async Code

### Promises

```typescript
it('handles async operations', async () => {
  const result = await createUser(deps, validArgs);
  expect(result.success).toBe(true);
});

it('handles rejected promises', async () => {
  const deps = createMockDependencies({
    insertUser: async () => { throw new Error('DB connection failed'); },
  });

  await expect(createUser(deps, validArgs)).rejects.toThrow('DB connection failed');
});
```

### Testing Error Scenarios

```typescript
it('returns error result for validation failure', async () => {
  const result = await createUser(deps, { email: 'invalid-email', name: '' });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error).toBe('invalid_email');
  }
});

it('handles database errors gracefully', async () => {
  const deps = createMockDependencies({
    insertUser: async () => { throw new Error('Connection timeout'); },
  });

  const result = await createUser(deps, validArgs);

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error).toBe('database_error');
  }
});
```

---

## Testing Discriminated Unions

For functions returning discriminated union results:

```typescript
type CreateUserResult =
  | { readonly success: true; readonly user: User }
  | { readonly success: false; readonly error: 'email_exists' | 'invalid_email' };

it('returns success with user data', async () => {
  const result = await createUser(deps, validArgs);

  // Type narrowing via discriminant
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.id).toBeDefined();
  }
});

it('returns specific error code', async () => {
  const deps = createMockDependencies({
    findUserByEmail: async () => existingUser,
  });

  const result = await createUser(deps, { email: existingUser.email, name: 'New' });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error).toBe('email_exists');
  }
});
```

---

## Coverage Guidelines

### What to Cover

- All public functions
- All code paths (success, error, edge cases)
- All acceptance criteria from specs
- Boundary conditions

### What NOT to Cover

- Private implementation details
- Framework code
- Generated types
- Simple getters/setters

### Coverage Targets

| Metric | Target |
|--------|--------|
| Line coverage | ≥80% |
| Branch coverage | ≥75% |
| Function coverage | ≥90% |

---

## Rules

- **One test file per source file** - `create_user.ts` → `create_user.test.ts`
- **Test behavior, not implementation** - Focus on inputs/outputs, not internal details
- **Each AC = at least one test** - Map tests to acceptance criteria
- **Reference spec and issue** - Use `@spec` and `@issue` JSDoc tags
- **Given/When/Then structure** - Clear Arrange/Act/Assert sections
- **Fast execution** - Unit tests should complete in milliseconds
- **No external dependencies** - Mock all I/O (DB, HTTP, filesystem)
- **Isolated tests** - Tests must not depend on each other
- **Descriptive names** - Test names should describe the scenario

---

## Summary Checklist

Before committing unit tests, verify:

- [ ] Test file is next to source file with `.test.ts` suffix
- [ ] `@spec` and `@issue` tags present in file header
- [ ] Each acceptance criterion has corresponding tests
- [ ] Dependencies are mocked (no real I/O)
- [ ] Tests follow Given/When/Then structure
- [ ] Tests are isolated (no shared mutable state)
- [ ] All async operations properly awaited
- [ ] Error scenarios tested
- [ ] Tests run fast (< 100ms per test)
