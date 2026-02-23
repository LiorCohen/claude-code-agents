# Testkube Configuration

## Test Definition

```yaml
# components/<testing-component>/tests/e2e/e2e-tests.yaml
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
      path: components/<testing-component>/tests/e2e
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

## Running E2E Tests

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
