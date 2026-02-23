# API Testing

HTTP client setup, test patterns, and examples for integration-level API tests.

---

## HTTP Client Setup

```typescript
// components/<testing-component>/tests/integration/helpers/client.ts
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

---

## API Test Pattern

```typescript
// components/<testing-component>/tests/integration/api/users.test.ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { createTestClient, TestClient } from '../helpers/client';
import { truncateTables, getTestDatabase } from '../helpers/database';

/**
 * @spec changes/user-management/SPEC.md
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
