---
name: e2e-testing-standards
description: End-to-end testing with Playwright - browser automation, visual regression, test data management.
user-invocable: false
---


# E2E Testing Skill

> **Dynamic path:** All paths below use `components/<testing-component>/` as a placeholder. The actual directory depends on the testing component defined in `.sdd/sdd-settings.yaml`. Delegate to the `project-settings` skill for directory path resolution — it maps component type (`testing`) + name to a filesystem path (e.g., `type=testing, name=e2e` → `components/testing-e2e/`).

Full browser automation tests that verify complete user journeys. E2E tests run in Kubernetes via Testkube with Playwright.

---

## Overview

| Aspect | Details |
|--------|---------|
| Location | `components/<testing-component>/tests/e2e/` and `e2e/` |
| Framework | Playwright |
| Executor | Testkube |
| Runs In | Kubernetes cluster |
| Written By | Tester agent |

---

## Test Structure

### Directory Organization

```text
components/<testing-component>/tests/e2e/
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
// components/<testing-component>/tests/e2e/playwright.config.ts
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

## Resource Files

For detailed guidance, read these on-demand:
- [page-objects.md](resources/page-objects.md) — Page Object Model examples
- [test-patterns.md](resources/test-patterns.md) — Basic tests, API setup, async operations
- [fixtures-helpers.md](resources/fixtures-helpers.md) — Test data fixtures, API helpers, auth helpers
- [testkube.md](resources/testkube.md) — Testkube YAML configuration

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

---

## Input / Output

This skill defines no input parameters or structured output.
