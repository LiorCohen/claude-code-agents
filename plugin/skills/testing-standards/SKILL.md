---
name: testing-standards
description: Standards for test suites including unit, integration, and e2e tests with Testkube.
---

# Testing Standards Skill

Standards for testing components that define test suites for unit, integration, and end-to-end testing.

---

## Purpose

Testing components provide systematic quality assurance:

1. **Unit tests** - Test isolated functions and modules
2. **Integration tests** - Test component interactions
3. **End-to-end tests** - Test complete user workflows
4. **Testkube integration** - Run tests in Kubernetes

---

## Directory Structure

```text
components/testing[-{name}]/
├── package.json              # Test runner scripts
├── tsconfig.json             # TypeScript config
├── vitest.config.ts          # Vitest configuration (unit/integration)
├── playwright.config.ts      # Playwright configuration (e2e)
├── unit/                     # Unit tests
│   ├── model/
│   │   └── use_cases/
│   │       └── create_user.test.ts
│   └── utils/
│       └── format.test.ts
├── integration/              # Integration tests
│   ├── api/
│   │   └── users.test.ts
│   └── database/
│       └── user_queries.test.ts
└── e2e/                      # End-to-end tests
    ├── flows/
    │   └── user_registration.spec.ts
    └── fixtures/
        └── test_data.ts
```

---

## Config Schema

Testing components typically use environment variables or test configuration files rather than `components/config/`. Configuration is defined inline when scaffolding (testing components don't have a dedicated scaffolding skill).

---

## Test File Standards

### File Naming

| Test Type | Pattern | Example |
|-----------|---------|---------|
| Unit | `*.test.ts` | `create_user.test.ts` |
| Integration | `*.test.ts` | `users.test.ts` |
| E2E | `*.spec.ts` | `user_registration.spec.ts` |

**Rules:**
- Use `lowercase_with_underscores` for filenames
- Mirror source file structure in test directories
- Group by feature or module

### Test Structure (AAA Pattern)

```typescript
// unit/model/use_cases/create_user.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createUser } from '@project/server/model/use-cases';
import type { Dependencies } from '@project/server/model';

describe('createUser', () => {
  it('creates a user with valid email', async () => {
    // Arrange
    const mockDeps: Dependencies = {
      insertUser: vi.fn().mockResolvedValue({ id: '123', email: 'test@example.com' }),
      findUserByEmail: vi.fn().mockResolvedValue(null),
    };
    const args = { email: 'test@example.com', name: 'Test User' };

    // Act
    const result = await createUser(mockDeps, args);

    // Assert
    expect(result.success).toBe(true);
    expect(mockDeps.insertUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com' })
    );
  });

  it('fails when email already exists', async () => {
    // Arrange
    const mockDeps: Dependencies = {
      insertUser: vi.fn(),
      findUserByEmail: vi.fn().mockResolvedValue({ id: 'existing', email: 'test@example.com' }),
    };
    const args = { email: 'test@example.com', name: 'Test User' };

    // Act
    const result = await createUser(mockDeps, args);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('email_exists');
    expect(mockDeps.insertUser).not.toHaveBeenCalled();
  });
});
```

**Required Patterns:**

| Pattern | Why |
|---------|-----|
| AAA (Arrange-Act-Assert) | Clear test structure |
| One assertion focus | Tests one behavior |
| Descriptive `it` strings | Documents expected behavior |
| Mock dependencies | Isolates unit under test |

---

## Unit Testing Standards

### What to Unit Test

| Layer | What to Test | Example |
|-------|--------------|---------|
| Model | Use-cases, business logic | `createUser`, `calculateTotal` |
| Utils | Pure utility functions | `formatDate`, `slugify` |
| DAL | Query builders (not DB) | SQL generation logic |

### Mocking Strategy

```typescript
// Mock dependencies, not modules
const mockDeps: Dependencies = {
  userRepository: {
    findById: vi.fn().mockResolvedValue(testUser),
    save: vi.fn().mockResolvedValue(testUser),
  },
  emailService: {
    sendWelcome: vi.fn().mockResolvedValue(undefined),
  },
};

// Pass mocks explicitly
const result = await createUser(mockDeps, args);
```

**Rules:**
- Mock at dependency boundary
- Never mock internal implementation
- Use `vi.fn()` for function mocks
- Use factories for test data

---

## Integration Testing Standards

### What to Integration Test

| Scope | What to Test | Example |
|-------|--------------|---------|
| API | HTTP endpoints | Request/response cycle |
| Database | Queries against real DB | DAL functions with test DB |
| Services | External service integration | With mocked external APIs |

### API Integration Test Example

```typescript
// integration/api/users.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, TestApp } from '../helpers/test_app';

describe('Users API', () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /users', () => {
    it('creates a user and returns 201', async () => {
      const response = await app.request('/users', {
        method: 'POST',
        body: { email: 'new@example.com', name: 'New User' },
      });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        email: 'new@example.com',
      });
    });

    it('returns 400 for invalid email', async () => {
      const response = await app.request('/users', {
        method: 'POST',
        body: { email: 'invalid', name: 'Test' },
      });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

### Database Integration Test

```typescript
// integration/database/user_queries.test.ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createTestDatabase, TestDatabase } from '../helpers/test_database';
import { findUserByEmail, insertUser } from '@project/server/dal';

describe('User DAL', () => {
  let db: TestDatabase;

  beforeEach(async () => {
    db = await createTestDatabase();
    await db.reset(); // Clear and re-seed
  });

  afterAll(async () => {
    await db.close();
  });

  it('finds user by email', async () => {
    const user = await findUserByEmail(db.client, 'existing@example.com');
    expect(user).not.toBeNull();
    expect(user?.email).toBe('existing@example.com');
  });

  it('inserts new user', async () => {
    const user = await insertUser(db.client, {
      email: 'new@example.com',
      name: 'New User',
    });

    expect(user.id).toBeDefined();
    const found = await findUserByEmail(db.client, 'new@example.com');
    expect(found).toEqual(user);
  });
});
```

---

## E2E Testing Standards

### What to E2E Test

| Focus | What to Test | Example |
|-------|--------------|---------|
| Critical paths | Core user journeys | Registration, checkout |
| Happy paths | Success scenarios | Complete purchase flow |
| Error handling | User-facing errors | Form validation messages |

### E2E Test Example

```typescript
// e2e/flows/user_registration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
  test('completes registration flow', async ({ page }) => {
    // Navigate to registration
    await page.goto('/register');

    // Fill form
    await page.fill('[data-testid="email-input"]', 'new@example.com');
    await page.fill('[data-testid="name-input"]', 'New User');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');

    // Submit
    await page.click('[data-testid="register-button"]');

    // Verify success
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Welcome, New User');
  });

  test('shows validation error for invalid email', async ({ page }) => {
    await page.goto('/register');
    await page.fill('[data-testid="email-input"]', 'invalid');
    await page.click('[data-testid="register-button"]');

    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
  });
});
```

### E2E Best Practices

| Practice | Example |
|----------|---------|
| Use data-testid | `data-testid="submit-button"` |
| Avoid CSS selectors | Not `.btn-primary` |
| Test user journeys | Not component details |
| Keep tests independent | No test order dependency |

---

## Test Data Management

### Factories

```typescript
// fixtures/factories/user.ts
import type { User } from '@project/contract';

export const createTestUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date().toISOString(),
  ...overrides,
});
```

### Fixtures

```typescript
// fixtures/test_data.ts
export const testUsers = {
  admin: createTestUser({ email: 'admin@example.com', role: 'admin' }),
  member: createTestUser({ email: 'member@example.com', role: 'member' }),
};
```

---

## Test Commands

```bash
# From components/testing/ (path depends on component name)
npm run test:unit         # Run unit tests
npm run test:integration  # Run integration tests
npm run test:e2e          # Run e2e tests
npm run test              # Run all tests
npm run test:coverage     # Run with coverage report
```

---

## Testkube Integration

For running tests in Kubernetes:

```yaml
# testkube/test-unit.yaml
apiVersion: tests.testkube.io/v3
kind: Test
metadata:
  name: unit-tests
spec:
  type: playwright/test
  content:
    type: git
    repository:
      uri: https://github.com/org/repo
      branch: main
      path: components/testing
  executionRequest:
    args:
      - run
      - test:unit
```

---

## Summary Checklist

Before committing test changes:

- [ ] Tests follow AAA pattern (Arrange-Act-Assert)
- [ ] Test files use correct naming (`.test.ts` or `.spec.ts`)
- [ ] Unit tests mock dependencies, not internals
- [ ] Integration tests use test database/fixtures
- [ ] E2E tests use `data-testid` selectors
- [ ] Tests are independent (no order dependency)
- [ ] Test data uses factories
- [ ] All tests pass locally

---

## Input / Output

This skill defines no input parameters or structured output.


---

## Related Skills

- `backend-standards` — Defines the CMDO architecture layers being tested. Understanding handler → orchestrator → repository separation determines test boundary decisions and mocking strategies.
- `frontend-standards` — Defines the MVVM architecture being tested. Understanding view → view-model → model separation determines component test strategies and TanStack Query mocking patterns.
