---
name: e2e-testing
description: End-to-end testing with Playwright - browser automation, visual regression, test data management.
---


# E2E Testing Skill

Full browser automation tests that verify complete user journeys. E2E tests run in Kubernetes via Testkube with Playwright.

---

## Overview

| Aspect | Details |
|--------|---------|
| Location | `components/testing/tests/e2e/` and `e2e/` |
| Framework | Playwright |
| Executor | Testkube |
| Runs In | Kubernetes cluster |
| Written By | Tester agent |

---

## Test Structure

### Directory Organization

```
components/testing/tests/e2e/
├── tests/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── logout.spec.ts
│   ├── planning/
│   │   ├── create-plan.spec.ts
│   │   └── edit-plan.spec.ts
│   └── admin/
│       └── user-management.spec.ts
├── pages/
│   ├── login.page.ts
│   ├── dashboard.page.ts
│   └── plan-editor.page.ts
├── fixtures/
│   ├── users.ts
│   └── plans.ts
├── helpers/
│   ├── auth.ts
│   └── api.ts
└── playwright.config.ts
```

---

## Playwright Configuration

```typescript
// components/testing/tests/e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: process.env.APP_URL || 'http://webapp:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],
});
```

---

## Page Object Model

### Page Object Pattern

```typescript
// components/testing/tests/e2e/pages/login.page.ts
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.submitButton = page.locator('[data-testid="login-button"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectErrorMessage(message: string): Promise<void> {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectRedirectToDashboard(): Promise<void> {
    await expect(this.page).toHaveURL('/dashboard');
  }
}
```

### Dashboard Page Object

```typescript
// components/testing/tests/e2e/pages/dashboard.page.ts
import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly welcomeMessage: Locator;
  readonly createPlanButton: Locator;
  readonly plansList: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeMessage = page.locator('[data-testid="welcome-message"]');
    this.createPlanButton = page.locator('[data-testid="create-plan-button"]');
    this.plansList = page.locator('[data-testid="plans-list"]');
    this.userMenu = page.locator('[data-testid="user-menu"]');
    this.logoutButton = page.locator('[data-testid="logout-button"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
  }

  async expectWelcomeMessage(name: string): Promise<void> {
    await expect(this.welcomeMessage).toContainText(`Welcome, ${name}`);
  }

  async createNewPlan(): Promise<void> {
    await this.createPlanButton.click();
  }

  async logout(): Promise<void> {
    await this.userMenu.click();
    await this.logoutButton.click();
  }

  async getPlanCount(): Promise<number> {
    return this.plansList.locator('[data-testid="plan-item"]').count();
  }
}
```

---

## Test Data Management

### Fixtures for Test Data

```typescript
// components/testing/tests/e2e/fixtures/users.ts
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

### API Helper for Test Setup

```typescript
// components/testing/tests/e2e/helpers/api.ts
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

### Auth Helper

```typescript
// components/testing/tests/e2e/helpers/auth.ts
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

---

## E2E Test Patterns

### Basic Test

```typescript
// components/testing/tests/e2e/tests/auth/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { DashboardPage } from '../../pages/dashboard.page';
import { testUsers } from '../../fixtures/users';

/**
 * @spec specs/changes/authentication/SPEC.md
 * @issue PROJ-100
 */
test.describe('Feature: User Login', () => {
  test('AC1: User can login with valid credentials', async ({ page }) => {
    // Given: User is on login page
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // When: User submits valid credentials
    await loginPage.login(testUsers.planner.email, testUsers.planner.password);

    // Then: User is redirected to dashboard
    const dashboard = new DashboardPage(page);
    await dashboard.expectWelcomeMessage(testUsers.planner.name);
  });

  test('AC2: Login fails with invalid password', async ({ page }) => {
    // Given: User is on login page
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // When: User submits invalid password
    await loginPage.login(testUsers.planner.email, 'wrongpassword');

    // Then: Error message is displayed
    await loginPage.expectErrorMessage('Invalid email or password');
  });

  test('AC3: Login fails with non-existent email', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login('nonexistent@example.com', 'anypassword');

    await loginPage.expectErrorMessage('Invalid email or password');
  });
});
```

### Test with API Setup

```typescript
// components/testing/tests/e2e/tests/planning/create-plan.spec.ts
import { test, expect } from '@playwright/test';
import { TestAPI } from '../../helpers/api';
import { loginAs } from '../../helpers/auth';
import { DashboardPage } from '../../pages/dashboard.page';
import { PlanEditorPage } from '../../pages/plan-editor.page';
import { testUsers } from '../../fixtures/users';

/**
 * @spec specs/changes/planning-workflow/SPEC.md
 * @issue PROJ-200
 */
test.describe('Feature: Plan Creation', () => {
  let api: TestAPI;
  let createdPlanIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    api = new TestAPI(request);
  });

  test.afterEach(async () => {
    // Cleanup created plans
    await api.cleanup({ planIds: createdPlanIds });
    createdPlanIds = [];
  });

  test('AC1: Planner can create a new plan', async ({ page }) => {
    // Given: Planner is logged in and on dashboard
    await loginAs(page, testUsers.planner);
    const dashboard = new DashboardPage(page);
    const initialCount = await dashboard.getPlanCount();

    // When: Planner creates a new plan
    await dashboard.createNewPlan();
    const editor = new PlanEditorPage(page);
    await editor.fillPlanName('Q1 2026 Assortment Plan');
    await editor.selectSeason('Spring/Summer 2026');
    await editor.savePlan();

    // Then: Plan appears in the list
    await dashboard.goto();
    const newCount = await dashboard.getPlanCount();
    expect(newCount).toBe(initialCount + 1);
  });

  test('AC2: Viewer cannot create plans', async ({ page }) => {
    // Given: Viewer is logged in
    await loginAs(page, testUsers.viewer);
    const dashboard = new DashboardPage(page);

    // Then: Create plan button is not visible
    await expect(dashboard.createPlanButton).not.toBeVisible();
  });
});
```

---

## Visual Regression Testing

### Snapshot Testing

```typescript
test('dashboard looks correct', async ({ page }) => {
  await loginAs(page, testUsers.planner);
  const dashboard = new DashboardPage(page);
  await dashboard.goto();

  // Wait for content to load
  await expect(dashboard.plansList).toBeVisible();

  // Take screenshot and compare
  await expect(page).toHaveScreenshot('dashboard.png', {
    maxDiffPixels: 100,
  });
});

test('login page is responsive', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  // Desktop screenshot
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page).toHaveScreenshot('login-desktop.png');

  // Mobile screenshot
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page).toHaveScreenshot('login-mobile.png');
});
```

### Component Visual Tests

```typescript
test('button states render correctly', async ({ page }) => {
  await page.goto('/storybook/button');

  // Default state
  await expect(page.locator('[data-state="default"]')).toHaveScreenshot('button-default.png');

  // Hover state
  await page.locator('[data-state="default"]').hover();
  await expect(page.locator('[data-state="default"]')).toHaveScreenshot('button-hover.png');

  // Disabled state
  await expect(page.locator('[data-state="disabled"]')).toHaveScreenshot('button-disabled.png');
});
```

---

## Handling Async Operations

### Waiting for Network

```typescript
test('submitting form waits for API response', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  // Wait for the API response
  const [response] = await Promise.all([
    page.waitForResponse('**/api/auth/login'),
    loginPage.login(testUsers.planner.email, testUsers.planner.password),
  ]);

  expect(response.status()).toBe(200);
});
```

### Waiting for Elements

```typescript
test('loading indicator disappears after data loads', async ({ page }) => {
  await loginAs(page, testUsers.planner);
  await page.goto('/plans');

  // Wait for loading to finish
  await expect(page.locator('[data-testid="loading-spinner"]')).toBeHidden();

  // Data should be visible
  await expect(page.locator('[data-testid="plans-table"]')).toBeVisible();
});
```

### Retry Flaky Operations

```typescript
test('eventually shows notification', async ({ page }) => {
  // Use Playwright's built-in retry
  await expect(async () => {
    const notification = page.locator('[data-testid="notification"]');
    await expect(notification).toBeVisible();
    await expect(notification).toContainText('Success');
  }).toPass({ timeout: 10000 });
});
```

---

## Testkube Configuration

### Test Definition

```yaml
# components/testing/tests/e2e/e2e-tests.yaml
apiVersion: tests.testkube.io/v3
kind: Test
metadata:
  name: e2e-tests
  namespace: testkube
  labels:
    app: myapp
    type: e2e
spec:
  type: playwright/test
  content:
    type: git
    repository:
      uri: https://github.com/org/repo
      branch: main
      path: components/testing/tests/e2e
  executionRequest:
    envConfigMaps:
      - name: test-config
        mapToEnv: true
    args:
      - "--project=chromium"
    artifactRequest:
      storageClassName: standard
      directories:
        - test-results
        - playwright-report
```

### Running E2E Tests

```bash
# Run all E2E tests
testkube run test e2e-tests --watch

# Run specific test file
testkube run test e2e-tests --args "--grep 'login'" --watch

# Run with specific browser
testkube run test e2e-tests --args "--project=firefox" --watch

# Download artifacts (screenshots, videos)
testkube download artifacts <execution-id>
```

---

## Test Attributes

Add `data-testid` attributes to components for reliable selectors:

```tsx
// Component with test attributes
export const LoginForm = () => {
  return (
    <form data-testid="login-form">
      <input data-testid="email-input" type="email" name="email" />
      <input data-testid="password-input" type="password" name="password" />
      <button data-testid="login-button" type="submit">
        Login
      </button>
      <div data-testid="error-message" className="error">
        {error}
      </div>
    </form>
  );
};
```

---

## Rules

- **User journey focus** - Test complete workflows, not isolated features
- **Page Object Model** - Encapsulate page interactions in page objects
- **Test isolation** - Each test must be independent
- **Cleanup after tests** - Remove created data via API
- **Avoid flaky tests** - Use proper waits, not arbitrary sleeps
- **Reference spec and issue** - Use `@spec` and `@issue` JSDoc tags
- **Given/When/Then structure** - Clear test organization
- **Use data-testid** - Reliable selectors that survive UI changes
- **Screenshot on failure** - Capture state for debugging
- **Reasonable timeouts** - Configure appropriate timeouts

---

## Summary Checklist

Before committing E2E tests, verify:

- [ ] Tests use Page Object Model
- [ ] `@spec` and `@issue` tags present in file header
- [ ] Each acceptance criterion has corresponding tests
- [ ] Tests follow Given/When/Then structure
- [ ] `data-testid` attributes used for selectors
- [ ] Test data created via API, not UI (faster)
- [ ] Cleanup happens in afterEach/afterAll
- [ ] No hardcoded waits (use Playwright's auto-waiting)
- [ ] Screenshots configured for failures
- [ ] Testkube YAML definition created/updated
- [ ] Tests run successfully via `testkube run test`
- [ ] Visual regression baselines committed if used
