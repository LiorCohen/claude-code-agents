# Authentication

Login helpers and protected endpoint test patterns for integration tests.

---

## Login Helper

```typescript
// components/<testing-component>/tests/integration/helpers/auth.ts
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

---

## Protected Endpoint Tests

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
