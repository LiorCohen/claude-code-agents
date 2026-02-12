# Page Object Model

## Page Object Pattern

```typescript
// components/<testing-component>/tests/e2e/pages/login.page.ts
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

## Dashboard Page Object

```typescript
// components/<testing-component>/tests/e2e/pages/dashboard.page.ts
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
