---
name: testing
description: Testing overview and hierarchy. References unit-testing, integration-testing, and e2e-testing skills for detailed patterns.
---


# Testing Skill

Overview of the test hierarchy and execution strategy. For detailed patterns, see the specialized testing skills.

---

## Test Hierarchy

| Test Type | Location | Framework | Executor | Skill |
|-----------|----------|-----------|----------|-------|
| Unit | `components/*/src/**/*.test.ts` | Vitest | CI runner | `unit-testing` |
| Component | `components/testing/tests/component/` | Vitest | Testkube | `integration-testing` |
| Integration | `components/testing/tests/integration/` | Vitest | Testkube | `integration-testing` |
| E2E | `components/testing/tests/e2e/` | Playwright | Testkube | `e2e-testing` |

---

## Execution Strategy

### CI Runner (Fast Feedback)

Unit tests run in the CI runner for immediate feedback:

```bash
npm test                    # Run all unit tests
npm test -- --watch         # Watch mode
npm test -- --coverage      # With coverage report
```

### Testkube (Environment Parity)

Component, integration, and E2E tests run in Kubernetes via Testkube:

```bash
# Run integration tests
testkube run test api-integration-tests --watch

# Run E2E tests
testkube run test e2e-tests --watch

# Run full test suite
testkube run testsuite full-suite --watch
```

### Why Testkube?

- Tests run in same network as services
- No port-forwarding or external exposure needed
- Test artifacts stored in cluster
- Parallelization via Testkube
- Environment parity with production

---

## Specialized Skills

### Unit Testing (`unit-testing` skill)

Covers:
- Mocking strategies (dependency injection, vi.mock)
- Fixtures and factory functions
- Test isolation
- Async testing patterns
- Discriminated union testing
- Coverage guidelines

### Integration Testing (`integration-testing` skill)

Covers:
- Database setup and teardown
- Cleanup strategies (transaction rollback, truncate, surgical delete)
- API client setup
- Authentication in tests
- Seed data management
- Contract testing
- Testkube configuration

### E2E Testing (`e2e-testing` skill)

Covers:
- Playwright configuration
- Page Object Model
- Test data management via API
- Visual regression testing
- Handling async operations
- Test attributes (`data-testid`)
- Testkube configuration for E2E

---

## Common Rules (All Test Types)

- **Every AC = at least one test** - Map tests to acceptance criteria
- **Reference spec and issue** - Use `@spec` and `@issue` JSDoc tags
- **Given/When/Then structure** - Clear Arrange/Act/Assert sections
- **Test behavior, not implementation** - Focus on inputs/outputs
- **Independent tests** - Tests must not depend on each other
- **Idempotent tests** - Running twice produces same result
- **Cleanup after tests** - Leave environment in clean state

---

## Spec and Issue Reference

Every test file must reference its spec and issue:

```typescript
/**
 * @spec specs/changes/user-auth/SPEC.md
 * @issue PROJ-123
 */
describe('Feature: User Authentication', () => {
  // AC1: Given valid credentials...
  describe('AC1: Valid login', () => {
    it('creates session for valid credentials', async () => {
      // Given (Arrange)
      const credentials = { email: 'test@example.com', password: 'valid' };

      // When (Act)
      const result = await authService.login(credentials);

      // Then (Assert)
      expect(result.session).toBeDefined();
    });
  });
});
```

---

## Directory Structure

```
components/
├── server/src/
│   └── **/*.test.ts              # Unit tests (alongside code)
├── webapp/src/
│   └── **/*.test.ts              # Unit tests (alongside code)
└── testing/
    ├── tests/
    │   ├── component/            # Component tests
    │   ├── integration/          # Integration tests
    │   └── e2e/                  # E2E tests
    ├── testsuites/               # Testkube suite definitions
    └── fixtures/                 # Shared test data
```

---

## Test Ownership

| Test Type | Written By | When |
|-----------|------------|------|
| Unit | Implementor | Alongside code (TDD) |
| Component | Tester | After component complete |
| Integration | Tester | After API complete |
| E2E | Tester | After feature complete |
