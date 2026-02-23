---
name: e2e-testing-scaffolding
description: Scaffolds E2E test suite structure with Playwright configuration and Testkube integration.
user-invocable: false
---

# E2E Testing Scaffolding

Scaffolds an end-to-end testing component with Playwright for browser automation and Testkube for Kubernetes-native test execution.

## Input

Invoked by the scaffolding orchestrator with:
- `component_name`: Name of the testing component
- `project_name`: Project name from settings
- `existing_components`: Currently configured components (servers, webapps)

## Directory Structure

```
components/testing/e2e/{name}/
├── src/
│   ├── fixtures/
│   │   ├── auth.fixture.ts     # Authentication helpers
│   │   └── page.fixture.ts     # Page object base
│   ├── pages/
│   │   └── .gitkeep            # Page objects go here
│   ├── tests/
│   │   └── .gitkeep            # Test files go here
│   └── helpers/
│       ├── test-data.ts        # Test data management
│       └── selectors.ts        # data-testid selectors
├── playwright.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Workflow

1. Create the testing directory structure
2. Generate Playwright configuration:
   - Configure browsers (chromium by default)
   - Set base URL from webapp config
   - Configure test timeouts and retries
3. Create fixture files for authentication and page objects
4. Generate Testkube test suite definition (if helm components exist)
5. Create README with E2E testing conventions

## Standards

Follow `e2e-testing-standards` for test structure, page object patterns, and selector conventions.

## Output

Returns a declared actions response with `register_component` action for the new E2E testing component.
