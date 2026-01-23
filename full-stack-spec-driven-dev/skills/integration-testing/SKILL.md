---
name: integration-testing
description: Integration testing patterns - database setup/teardown, API testing, contract testing, and Testkube execution.
---


# Integration Testing Skill

Tests that verify multiple components working together with real infrastructure. Integration tests run in Kubernetes via Testkube for environment parity.

---

## Overview

| Aspect | Details |
|--------|---------|
| Location | `components/testing/tests/integration/` |
| Framework | Vitest |
| Executor | Testkube |
| Runs In | Kubernetes cluster |
| Written By | Tester agent |

---

## Test Structure

### Directory Organization

```
components/testing/
├── tests/
│   └── integration/
│       ├── api/
│       │   ├── users.test.ts
│       │   ├── auth.test.ts
│       │   └── plans.test.ts
│       ├── db/
│       │   └── migrations.test.ts
│       └── helpers/
│           ├── client.ts
│           ├── database.ts
│           └── seed.ts
├── testsuites/
│   └── integration-suite.yaml
└── fixtures/
    └── seed-data.sql
```

---

## Database Setup and Teardown

### Test Database Initialization

```typescript
// components/testing/tests/integration/helpers/database.ts
import { Pool } from 'pg';

let pool: Pool | null = null;

export const getTestDatabase = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL,
      max: 5,
    });
  }
  return pool;
};

export const closeTestDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};
```

### Cleanup Strategies

#### Transaction Rollback (Fastest)

```typescript
import { describe, it, beforeEach, afterEach } from 'vitest';
import { getTestDatabase } from '../helpers/database';

describe('User API', () => {
  let client: PoolClient;

  beforeEach(async () => {
    const pool = getTestDatabase();
    client = await pool.connect();
    await client.query('BEGIN');
  });

  afterEach(async () => {
    await client.query('ROLLBACK');
    client.release();
  });

  it('creates user', async () => {
    // Test runs in transaction, rolled back after
  });
});
```

#### Truncate Tables (Clean State)

```typescript
// components/testing/tests/integration/helpers/cleanup.ts
const TABLES_TO_TRUNCATE = [
  'plan_items',
  'plans',
  'users',
  // Order matters - respect foreign keys
];

export const truncateTables = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const table of TABLES_TO_TRUNCATE) {
      await client.query(`TRUNCATE TABLE ${table} CASCADE`);
    }
    await client.query('COMMIT');
  } finally {
    client.release();
  }
};
```

#### Delete by Test Marker (Surgical)

```typescript
export const cleanupTestData = async (pool: Pool, testRunId: string): Promise<void> => {
  const client = await pool.connect();
  try {
    // Delete only data created by this test run
    await client.query(`DELETE FROM users WHERE metadata->>'testRunId' = $1`, [testRunId]);
  } finally {
    client.release();
  }
};
```

---

## API Testing

### HTTP Client Setup

```typescript
// components/testing/tests/integration/helpers/client.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface TestClient {
  get: <T>(url: string) => Promise<AxiosResponse<T>>;
  post: <T>(url: string, data: unknown) => Promise<AxiosResponse<T>>;
  put: <T>(url: string, data: unknown) => Promise<AxiosResponse<T>>;
  delete: <T>(url: string) => Promise<AxiosResponse<T>>;
  setAuthToken: (token: string) => void;
}

export const createTestClient = (): TestClient => {
  const instance: AxiosInstance = axios.create({
    baseURL: process.env.API_URL || 'http://server:3000',
    timeout: 10000,
    validateStatus: () => true, // Don't throw on non-2xx
  });

  return {
    get: <T>(url: string) => instance.get<T>(url),
    post: <T>(url: string, data: unknown) => instance.post<T>(url, data),
    put: <T>(url: string, data: unknown) => instance.put<T>(url, data),
    delete: <T>(url: string) => instance.delete<T>(url),
    setAuthToken: (token: string) => {
      instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },
  };
};
```

### API Test Pattern

```typescript
// components/testing/tests/integration/api/users.test.ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { createTestClient, TestClient } from '../helpers/client';
import { truncateTables, getTestDatabase } from '../helpers/database';

/**
 * @spec specs/changes/user-management/SPEC.md
 * @issue PROJ-123
 */
describe('Feature: User Management API', () => {
  let client: TestClient;

  beforeAll(() => {
    client = createTestClient();
  });

  afterEach(async () => {
    await truncateTables(getTestDatabase());
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('POST /api/users', () => {
    describe('AC1: Create user with valid data', () => {
      it('returns 201 with created user', async () => {
        // Arrange
        const userData = {
          email: 'newuser@example.com',
          name: 'New User',
          role: 'planner',
        };

        // Act
        const response = await client.post('/api/users', userData);

        // Assert
        expect(response.status).toBe(201);
        expect(response.data).toMatchObject({
          data: {
            email: 'newuser@example.com',
            name: 'New User',
            role: 'planner',
          },
        });
        expect(response.data.data.id).toBeDefined();
      });
    });

    describe('AC2: Duplicate email rejection', () => {
      it('returns 409 when email exists', async () => {
        // Arrange
        const userData = { email: 'duplicate@example.com', name: 'First', role: 'planner' };
        await client.post('/api/users', userData);

        // Act
        const response = await client.post('/api/users', {
          ...userData,
          name: 'Second',
        });

        // Assert
        expect(response.status).toBe(409);
        expect(response.data.error.code).toBe('email_exists');
      });
    });

    describe('AC3: Validation errors', () => {
      it('returns 400 for invalid email format', async () => {
        const response = await client.post('/api/users', {
          email: 'not-an-email',
          name: 'Test',
          role: 'planner',
        });

        expect(response.status).toBe(400);
        expect(response.data.error.code).toBe('validation_error');
        expect(response.data.error.details).toContainEqual(
          expect.objectContaining({ field: 'email' })
        );
      });
    });
  });

  describe('GET /api/users/:id', () => {
    it('returns user when found', async () => {
      // Arrange
      const createResponse = await client.post('/api/users', {
        email: 'test@example.com',
        name: 'Test User',
        role: 'planner',
      });
      const userId = createResponse.data.data.id;

      // Act
      const response = await client.get(`/api/users/${userId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data.id).toBe(userId);
    });

    it('returns 404 when user not found', async () => {
      const response = await client.get('/api/users/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.data.error.code).toBe('not_found');
    });
  });
});
```

---

## Authentication in Tests

### Login Helper

```typescript
// components/testing/tests/integration/helpers/auth.ts
import { TestClient } from './client';

export interface AuthenticatedUser {
  token: string;
  user: { id: string; email: string; role: string };
}

export const loginAsTestUser = async (
  client: TestClient,
  credentials = { email: 'test@example.com', password: 'TestPass123!' }
): Promise<AuthenticatedUser> => {
  const response = await client.post('/api/auth/login', credentials);

  if (response.status !== 200) {
    throw new Error(`Login failed: ${JSON.stringify(response.data)}`);
  }

  client.setAuthToken(response.data.data.token);

  return {
    token: response.data.data.token,
    user: response.data.data.user,
  };
};

export const createAndLoginUser = async (
  client: TestClient,
  userData: { email: string; name: string; role: string; password: string }
): Promise<AuthenticatedUser> => {
  // Create user
  await client.post('/api/users', userData);

  // Login
  return loginAsTestUser(client, {
    email: userData.email,
    password: userData.password,
  });
};
```

### Protected Endpoint Tests

```typescript
describe('Protected endpoints', () => {
  it('returns 401 without authentication', async () => {
    const response = await client.get('/api/plans');

    expect(response.status).toBe(401);
    expect(response.data.error.code).toBe('unauthorized');
  });

  it('returns 403 for insufficient permissions', async () => {
    // Login as viewer (read-only role)
    await createAndLoginUser(client, {
      email: 'viewer@test.com',
      name: 'Viewer',
      role: 'viewer',
      password: 'ViewerPass123!',
    });

    // Try to create (requires planner role)
    const response = await client.post('/api/plans', { name: 'New Plan' });

    expect(response.status).toBe(403);
    expect(response.data.error.code).toBe('forbidden');
  });
});
```

---

## Seed Data

### SQL Seed Files

```sql
-- components/testing/fixtures/seed-data.sql
INSERT INTO users (id, email, name, role, client_id, password_hash, created_at)
VALUES
  ('seed-admin-1', 'admin@test.com', 'Test Admin', 'admin', 'test-client', '$2b$10$...', NOW()),
  ('seed-planner-1', 'planner@test.com', 'Test Planner', 'planner', 'test-client', '$2b$10$...', NOW());

INSERT INTO plans (id, name, owner_id, status, created_at)
VALUES
  ('seed-plan-1', 'Test Plan', 'seed-planner-1', 'draft', NOW());
```

### Programmatic Seeding

```typescript
// components/testing/tests/integration/helpers/seed.ts
import { Pool } from 'pg';
import { hashPassword } from './auth';

export const seedTestUsers = async (pool: Pool): Promise<void> => {
  const passwordHash = await hashPassword('TestPass123!');

  await pool.query(`
    INSERT INTO users (id, email, name, role, client_id, password_hash, created_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, NOW())
    ON CONFLICT (id) DO NOTHING
  `, ['seed-user-1', 'test@example.com', 'Test User', 'planner', 'test-client', passwordHash]);
};
```

---

## Testkube Configuration

### Test Definition

```yaml
# components/testing/tests/integration/integration-tests.yaml
apiVersion: tests.testkube.io/v3
kind: Test
metadata:
  name: api-integration-tests
  namespace: testkube
  labels:
    app: myapp
    type: integration
spec:
  type: vitest/test
  content:
    type: git
    repository:
      uri: https://github.com/org/repo
      branch: main
      path: components/testing/tests/integration
  executionRequest:
    envConfigMaps:
      - name: test-config
        mapToEnv: true
    envSecrets:
      - name: test-secrets
        mapToEnv: true
```

### Test Suite

```yaml
# components/testing/testsuites/integration-suite.yaml
apiVersion: tests.testkube.io/v3
kind: TestSuite
metadata:
  name: integration-tests
  namespace: testkube
spec:
  description: All integration tests
  steps:
    - stopOnFailure: true
      execute:
        - test: api-integration-tests
        - test: db-integration-tests
```

### Running Tests

```bash
# Run single test
testkube run test api-integration-tests --watch

# Run suite
testkube run testsuite integration-tests --watch

# Run with specific variables
testkube run test api-integration-tests \
  --variable API_URL=http://server:3000 \
  --variable TEST_DATABASE_URL=postgres://... \
  --watch

# Get results
testkube get execution <execution-id>
testkube get execution <execution-id> --output json
```

---

## Contract Testing

### Request/Response Validation

```typescript
import { describe, it, expect } from 'vitest';
import Ajv from 'ajv';
import openApiSpec from '../../../../contract/openapi.json';

const ajv = new Ajv({ allErrors: true });

describe('API Contract Compliance', () => {
  describe('POST /api/users', () => {
    it('response matches OpenAPI schema', async () => {
      const response = await client.post('/api/users', validUserData);

      const schema = openApiSpec.paths['/api/users'].post.responses['201'].content['application/json'].schema;
      const validate = ajv.compile(schema);
      const valid = validate(response.data);

      expect(valid).toBe(true);
      if (!valid) {
        console.error('Schema validation errors:', validate.errors);
      }
    });
  });
});
```

---

## Rules

- **Real infrastructure** - Use actual database, no mocks for I/O
- **Environment parity** - Tests run in Kubernetes like production
- **Cleanup after each test** - Leave database in clean state
- **Independent tests** - Tests must not depend on each other
- **Idempotent tests** - Running twice produces same result
- **Reference spec and issue** - Use `@spec` and `@issue` JSDoc tags
- **Given/When/Then structure** - Clear test organization
- **Handle async properly** - Await all database and HTTP operations
- **Reasonable timeouts** - Set appropriate timeouts for network operations

---

## Summary Checklist

Before committing integration tests, verify:

- [ ] Tests use real database (not mocked)
- [ ] Database cleanup happens after each test
- [ ] `@spec` and `@issue` tags present in file header
- [ ] Each acceptance criterion has corresponding tests
- [ ] Tests follow Given/When/Then structure
- [ ] HTTP client properly configured for test environment
- [ ] Authentication helpers used for protected endpoints
- [ ] Error scenarios tested (400, 401, 403, 404, 409, 500)
- [ ] Testkube YAML definition created/updated
- [ ] Tests run successfully via `testkube run test`
