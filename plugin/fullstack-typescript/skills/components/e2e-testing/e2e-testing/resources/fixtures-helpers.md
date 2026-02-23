# Test Data Fixtures and Helpers

## Fixtures for Test Data

```typescript
// components/<testing-component>/tests/e2e/fixtures/users.ts
export const testUsers = {
  admin: {
    email: 'e2e-admin@test.com',
    password: 'E2EAdminPass123!',
    name: 'E2E Admin',
    role: 'admin',
  },
  planner: {
    email: 'e2e-planner@test.com',
    password: 'E2EPlannerPass123!',
    name: 'E2E Planner',
    role: 'planner',
  },
  viewer: {
    email: 'e2e-viewer@test.com',
    password: 'E2EViewerPass123!',
    name: 'E2E Viewer',
    role: 'viewer',
  },
};
```

## API Helper for Test Setup

```typescript
// components/<testing-component>/tests/e2e/helpers/api.ts
import { APIRequestContext } from '@playwright/test';

export class TestAPI {
  constructor(private request: APIRequestContext) {}

  async createUser(userData: {
    email: string;
    name: string;
    password: string;
    role: string;
  }): Promise<{ id: string }> {
    const response = await this.request.post('/api/users', {
      data: userData,
    });
    const body = await response.json();
    return body.data;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.request.delete(`/api/users/${userId}`);
  }

  async createPlan(planData: { name: string; ownerId: string }): Promise<{ id: string }> {
    const response = await this.request.post('/api/plans', {
      data: planData,
    });
    const body = await response.json();
    return body.data;
  }

  async cleanup(options: { userIds?: string[]; planIds?: string[] }): Promise<void> {
    for (const planId of options.planIds || []) {
      await this.request.delete(`/api/plans/${planId}`);
    }
    for (const userId of options.userIds || []) {
      await this.request.delete(`/api/users/${userId}`);
    }
  }
}
```

## Auth Helper

```typescript
// components/<testing-component>/tests/e2e/helpers/auth.ts
import { Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

export const loginAs = async (
  page: Page,
  credentials: { email: string; password: string }
): Promise<void> => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credentials.email, credentials.password);
  await loginPage.expectRedirectToDashboard();
};

export const loginWithStorageState = async (
  page: Page,
  storageStatePath: string
): Promise<void> => {
  // Use saved authentication state for faster tests
  await page.context().addCookies(require(storageStatePath).cookies);
};
```
