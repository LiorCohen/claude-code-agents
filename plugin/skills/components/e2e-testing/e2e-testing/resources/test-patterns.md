# E2E Test Patterns

## Basic Test

```typescript
// components/<testing-component>/tests/e2e/tests/auth/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { DashboardPage } from '../../pages/dashboard.page';
import { testUsers } from '../../fixtures/users';

/**
 * @spec changes/authentication/SPEC.md
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

## Test with API Setup

```typescript
// components/<testing-component>/tests/e2e/tests/planning/create-plan.spec.ts
import { test, expect } from '@playwright/test';
import { TestAPI } from '../../helpers/api';
import { loginAs } from '../../helpers/auth';
import { DashboardPage } from '../../pages/dashboard.page';
import { PlanEditorPage } from '../../pages/plan-editor.page';
import { testUsers } from '../../fixtures/users';

/**
 * @spec changes/planning-workflow/SPEC.md
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
