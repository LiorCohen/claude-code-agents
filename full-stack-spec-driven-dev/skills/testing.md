---
name: testing
description: Test patterns and references for spec verification. See tester agent for Testkube execution details.
---

**FIRST:** Print this banner exactly (including blank lines):

```
╔══════════════════════════════════════════════════════════════════╗
║  🔧 SKILL: testing                                               ║
║  📋 Test patterns and references for spec verification           ║
╚══════════════════════════════════════════════════════════════════╝
```

# Testing Skill

## Test Execution

All tests except unit tests run in Kubernetes via Testkube for environment parity.

### Test Hierarchy

| Test Type | Location | Executor | Runs In |
|-----------|----------|----------|---------|
| Unit | `components/*/src/**/*.test.ts` | Vitest | CI runner |
| Component | `components/testing/tests/component/` | Testkube + Vitest | Kubernetes |
| Integration | `components/testing/tests/integration/` | Testkube + Vitest | Kubernetes |
| E2E | `components/testing/tests/e2e/` | Testkube + Playwright | Kubernetes |

### Why Testkube?

- Tests run in same network as services
- No port-forwarding or external exposure needed
- Test artifacts stored in cluster
- Parallelization via Testkube
- Environment parity with production

## Testkube Setup and Usage

### Installation

```bash
# Install Testkube in cluster
helm repo add kubeshop https://kubeshop.github.io/helm-charts
helm install testkube kubeshop/testkube --namespace testkube --create-namespace
```

### Directory Structure

```
components/testing/
├── tests/
│   ├── integration/
│   │   └── api-tests.yaml       # Test definitions
│   ├── component/
│   │   └── webapp-tests.yaml
│   └── e2e/
│       └── playwright-tests.yaml
└── testsuites/
    ├── integration-suite.yaml
    └── e2e-suite.yaml
```

### Test Definition Example

```yaml
# components/testing/tests/integration/api-tests.yaml
apiVersion: tests.testkube.io/v3
kind: Test
metadata:
  name: api-integration-tests
  namespace: testkube
spec:
  type: vitest
  content:
    type: git
    repository:
      uri: https://github.com/org/repo
      branch: main
      path: components/server/src/__tests__/integration
```

### Running Tests

```bash
# Run single test
testkube run test api-integration-tests --watch

# Run test suite
testkube run testsuite integration-tests --watch

# Get test results
testkube get execution <id>
```

## Spec and Issue Reference

Every test file must reference its spec and issue:

```typescript
/**
 * @spec specs/features/user-auth/SPEC.md
 * @issue PROJ-123
 */
describe('Feature: User Authentication', () => {
  // AC1: Given valid credentials...
  describe('AC1: Valid login', () => {
    it('creates session for valid credentials', async () => {
      // Arrange (Given)
      const credentials = { email: 'test@example.com', password: 'valid' };

      // Act (When)
      const result = await authService.login(credentials);

      // Assert (Then)
      expect(result.session).toBeDefined();
    });
  });
});
```

---

## Test Patterns

### Unit Test Pattern

```typescript
// components/server/src/model/use-cases/__tests__/createUser.test.ts
import { describe, it, expect } from 'vitest';
import { createUser } from '../createUser';
import type { Dependencies } from '../../dependencies';

/**
 * @spec specs/features/user-management/SPEC.md
 * @issue PROJ-123
 */
describe('createUser', () => {
  describe('AC1: Valid user creation', () => {
    it('creates user when email is unique', async () => {
      // Arrange
      const mockDeps: Dependencies = {
        findUserByEmail: async () => null,
        insertUser: async (data) => ({ id: '123', ...data }),
      };
      const args = { email: 'test@example.com', name: 'Test User' };

      // Act
      const result = await createUser(mockDeps, args);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user.email).toBe('test@example.com');
      }
    });
  });

  describe('AC2: Duplicate email handling', () => {
    it('returns error when email exists', async () => {
      // Arrange
      const mockDeps: Dependencies = {
        findUserByEmail: async () => ({ id: '456', email: 'test@example.com', name: 'Existing' }),
        insertUser: async (data) => ({ id: '123', ...data }),
      };
      const args = { email: 'test@example.com', name: 'Test User' };

      // Act
      const result = await createUser(mockDeps, args);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('email_exists');
      }
    });
  });
});
```

### Integration Test Pattern

```typescript
// e2e/integration/api/users.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestClient, cleanupDatabase } from '../helpers';

/**
 * @spec specs/features/user-management/SPEC.md
 * @issue PROJ-123
 */
describe('Feature: User Management API', () => {
  const client = createTestClient();

  afterAll(async () => {
    await cleanupDatabase();
  });

  describe('AC1: Create user', () => {
    it('creates user with valid data', async () => {
      // Arrange
      const userData = { email: 'new@example.com', name: 'New User' };

      // Act
      const response = await client.post('/api/users', userData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.data.data.email).toBe('new@example.com');
    });
  });

  describe('AC2: Duplicate email', () => {
    it('returns 409 for duplicate email', async () => {
      // Arrange
      const userData = { email: 'duplicate@example.com', name: 'User One' };
      await client.post('/api/users', userData);

      // Act
      const response = await client.post('/api/users', userData);

      // Assert
      expect(response.status).toBe(409);
      expect(response.data.error.code).toBe('email_exists');
    });
  });
});
```

### E2E Test Pattern

```typescript
// e2e/tests/user-registration.spec.ts
import { test, expect } from '@playwright/test';

/**
 * @spec specs/features/user-registration/SPEC.md
 * @issue PROJ-456
 */
test.describe('Feature: User Registration', () => {
  test('AC1: User can register with valid credentials', async ({ page }) => {
    // Given: User is on registration page
    await page.goto('/register');

    // When: User submits valid registration form
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="name"]', 'New User');
    await page.click('button[type="submit"]');

    // Then: User is redirected to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome');
  });

  test('AC2: Registration fails with duplicate email', async ({ page }) => {
    // Given: An existing user
    // (assume seed data or setup)

    // When: User tries to register with existing email
    await page.goto('/register');
    await page.fill('[name="email"]', 'existing@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="name"]', 'Another User');
    await page.click('button[type="submit"]');

    // Then: Error message is displayed
    await expect(page.locator('.error')).toContainText('Email already exists');
  });
});
```

---

## Rules

- Every AC = at least one test
- Reference spec and issue in every test file
- Use Given/When/Then structure in test descriptions
- Tests verify behavior, not implementation
- Integration/E2E tests clean up after themselves
- Tests are independent and idempotent
