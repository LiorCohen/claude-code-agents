---
name: integration-testing-standards
description: Integration testing patterns - database setup/teardown, API testing, contract testing, and Testkube execution.
user-invocable: false
---


# Integration Testing Skill

> **Dynamic path:** All paths below use `components/<testing-component>/` as a placeholder. The actual directory depends on the testing component defined in `.sdd/sdd-settings.yaml`. Delegate to the `project-settings` skill for directory path resolution — it maps component type (`testing`) + name to a filesystem path (e.g., `type=testing, name=integration` → `components/testing-integration/`).

Tests that verify multiple components working together with real infrastructure. Integration tests run in Kubernetes via Testkube for environment parity.

---

## Overview

| Aspect | Details |
|--------|---------|
| Location | `components/<testing-component>/tests/integration/` |
| Framework | Vitest |
| Executor | Testkube |
| Runs In | Kubernetes cluster |
| Written By | Tester agent |

---

## Test Structure

### Directory Organization

```text
components/<testing-component>/
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

## Resource Files

For detailed guidance, read these on-demand:
- [database-strategies.md](resources/database-strategies.md) — Transaction rollback, truncate, cleanup
- [api-testing.md](resources/api-testing.md) — HTTP client, test patterns, examples
- [authentication.md](resources/authentication.md) — Login helpers, protected endpoint tests
- [testkube.md](resources/testkube.md) — Test definition YAML, suites, running tests

---

## Contract Testing

### Request/Response Validation

```typescript
import { describe, it, expect } from 'vitest';
import Ajv2020 from 'ajv/dist/2020.js';
import openApiSpec from '../../../../contract/openapi.json';

const ajv = new Ajv2020({ allErrors: true });

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

---

## Input / Output

This skill defines no input parameters or structured output.
