# Testkube

Test definition YAML, suite configuration, and commands for running integration tests in Kubernetes via Testkube.

---

## Test Definition

```yaml
# components/<testing-component>/tests/integration/integration-tests.yaml
apiVersion: tests.testkube.io/v3
kind: Test
metadata:
  name: api-integration-tests
  namespace: testkube
  labels:
    app: myapp
    type: integration
spec:
  type: vitest/test
  content:
    type: git
    repository:
      uri: https://github.com/org/repo
      branch: main
      path: components/<testing-component>/tests/integration
  executionRequest:
    envConfigMaps:
      - name: test-config
        mapToEnv: true
    envSecrets:
      - name: test-secrets
        mapToEnv: true
```

## Test Suite

```yaml
# components/<testing-component>/testsuites/integration-suite.yaml
apiVersion: tests.testkube.io/v3
kind: TestSuite
metadata:
  name: integration-tests
  namespace: testkube
spec:
  description: All integration tests
  steps:
    - stopOnFailure: true
      execute:
        - test: api-integration-tests
        - test: db-integration-tests
```

## Running Tests

```bash
# Run single test
testkube run test api-integration-tests --watch

# Run suite
testkube run testsuite integration-tests --watch

# Run with specific variables
testkube run test api-integration-tests \
  --variable API_URL=http://server:3000 \
  --variable TEST_DATABASE_URL=postgres://... \
  --watch

# Get results
testkube get execution <execution-id>
testkube get execution <execution-id> --output json
```
