---
name: integration-testing-scaffolding
description: Scaffolds integration test suite structure with database setup, API testing, and Testkube configuration.
user-invocable: false
---

# Integration Testing Scaffolding

Scaffolds an integration testing component with test infrastructure for verifying component interactions against real dependencies.

## Input

Invoked by the scaffolding orchestrator with:
- `component_name`: Name of the testing component
- `project_name`: Project name from settings
- `existing_components`: Currently configured components (servers, databases)

## Directory Structure

```
components/testing/integration/{name}/
├── src/
│   ├── setup/
│   │   ├── test-database.ts    # Test database lifecycle
│   │   └── test-server.ts      # Test server lifecycle
│   ├── helpers/
│   │   ├── api-client.ts       # HTTP client for API testing
│   │   └── fixtures.ts         # Test data factories
│   └── tests/
│       └── .gitkeep
├── vitest.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Workflow

1. Create the testing directory structure
2. Generate test setup files based on existing components:
   - For each server: create API client helper
   - For each database: create test database lifecycle (setup/teardown)
3. Configure Vitest for integration test patterns
4. Generate Testkube test suite definition (if helm components exist)
5. Create README with testing conventions

## Standards

Follow `integration-testing-standards` for test structure, database lifecycle, and naming conventions.

## Output

Returns a declared actions response with `register_component` action for the new integration testing component.
