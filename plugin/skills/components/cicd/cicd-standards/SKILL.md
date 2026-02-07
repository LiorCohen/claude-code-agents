---
name: cicd-standards
description: Standards for CI/CD pipelines using GitHub Actions workflows.
---

# CI/CD Standards Skill

Standards for CI/CD components using GitHub Actions for continuous integration and deployment.

---

## Purpose

CI/CD components automate the build, test, and deploy pipeline:

1. **Continuous Integration** - Build and test on every commit
2. **Continuous Deployment** - Deploy to environments automatically
3. **Quality Gates** - Enforce standards before merge
4. **Release Management** - Version and publish artifacts

---

## Directory Structure

```text
components/cicd[-{name}]/
├── package.json              # Scripts for local workflow testing
├── .github/
│   └── workflows/
│       ├── ci.yaml           # Main CI pipeline
│       ├── deploy.yaml       # Deployment pipeline
│       └── release.yaml      # Release pipeline
└── scripts/                  # Reusable shell scripts
    ├── build.sh
    ├── test.sh
    └── deploy.sh
```

---

## Config Schema

CI/CD components don't use `components/config/`. They use GitHub Secrets for credentials, GitHub Variables for environment-specific values, and workflow inputs for runtime parameters. Configuration is defined inline when scaffolding (cicd components don't have a dedicated scaffolding skill).

---

## Workflow Standards

### File Naming

| Workflow | Filename | Trigger |
|----------|----------|---------|
| CI | `ci.yaml` | Push, PR |
| Deploy | `deploy.yaml` | Push to main, manual |
| Release | `release.yaml` | Tag push, manual |

### CI Workflow Example

```yaml
# .github/workflows/ci.yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm typecheck

  test:
    name: Test
    runs-on: ubuntu-latest
    needs: [lint, typecheck]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        if: always()

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [test]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/
```

### Deploy Workflow Example

```yaml
# .github/workflows/deploy.yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  deploy:
    name: Deploy to ${{ inputs.environment || 'staging' }}
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment || 'staging' }}
    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        uses: azure/k8s-set-context@v4
        with:
          kubeconfig: ${{ secrets.KUBECONFIG }}

      - name: Deploy with Helm
        run: |
          helm upgrade --install ${{ github.event.repository.name }} \
            ./components/helm \
            -f ./components/helm/values-${{ inputs.environment || 'staging' }}.yaml \
            --namespace ${{ inputs.environment || 'staging' }} \
            --wait
```

---

## Job Structure Standards

### Job Naming

| Stage | Job Name | Description |
|-------|----------|-------------|
| Quality | `lint` | Code linting |
| Quality | `typecheck` | TypeScript type checking |
| Test | `test` | Unit and integration tests |
| Test | `test-e2e` | End-to-end tests |
| Build | `build` | Build artifacts |
| Build | `build-image` | Build container image |
| Deploy | `deploy-staging` | Deploy to staging |
| Deploy | `deploy-production` | Deploy to production |

### Job Dependencies

```yaml
jobs:
  lint:
    # No dependencies - runs first

  typecheck:
    # No dependencies - runs in parallel with lint

  test:
    needs: [lint, typecheck]
    # Runs after lint and typecheck pass

  build:
    needs: [test]
    # Runs after tests pass

  deploy:
    needs: [build]
    # Runs after build succeeds
```

### Concurrency Control

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true  # Cancel outdated runs on same branch
```

---

## Secret Management

### Secret Scopes

| Scope | Usage | Example |
|-------|-------|---------|
| Repository | All workflows | `${{ secrets.REGISTRY_TOKEN }}` |
| Environment | Deploy jobs only | Production credentials |
| Organization | Shared across repos | Shared signing keys |

### Environment Protection

```yaml
jobs:
  deploy-production:
    environment:
      name: production
      url: https://app.example.com
    # Requires manual approval (configured in repo settings)
```

---

## Artifact Management

### Upload Artifacts

```yaml
- name: Upload build artifacts
  uses: actions/upload-artifact@v4
  with:
    name: build-${{ github.sha }}
    path: dist/
    retention-days: 7
```

### Download Artifacts

```yaml
- name: Download build artifacts
  uses: actions/download-artifact@v4
  with:
    name: build-${{ github.sha }}
    path: dist/
```

---

## Container Image Building

### Build and Push

```yaml
jobs:
  build-image:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:${{ github.sha }}
            ghcr.io/${{ github.repository }}:latest
```

---

## Notification Patterns

### Slack Notification

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "CI failed on ${{ github.ref_name }}",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*CI Failed* :x:\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Run>"
            }
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Reusable Workflows

### Shared Setup

```yaml
# .github/workflows/setup.yaml
name: Setup
on:
  workflow_call:
    inputs:
      node-version:
        type: string
        default: '20'

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
      - uses: pnpm/action-setup@v3
        with:
          version: 8
      - run: pnpm install --frozen-lockfile
```

### Using Reusable Workflow

```yaml
jobs:
  setup:
    uses: ./.github/workflows/setup.yaml
    with:
      node-version: '20'

  test:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - run: pnpm test
```

---

## Local Testing

Test workflows locally before pushing:

```bash
# Using act (https://github.com/nektos/act)
act push --job lint
act pull_request --job test
```

---

## Summary Checklist

Before committing workflow changes:

- [ ] Workflow uses descriptive job names
- [ ] Jobs have appropriate dependencies (`needs:`)
- [ ] Concurrency configured to cancel outdated runs
- [ ] Secrets accessed via `${{ secrets.* }}`
- [ ] Environment protection for production deploys
- [ ] Artifacts uploaded with retention policy
- [ ] Failure notifications configured
- [ ] Tested locally with `act` if possible

---

## Input / Output

This skill defines no input parameters or structured output.


---

## Related Skills

- `helm-standards` — Delegate to this for Kubernetes deployment targets in CD pipelines. Defines Helm chart structure, `values.yaml` patterns, and release naming that CI/CD workflows deploy to.
- `testing-standards` — Delegate to this for test execution stages in CI. Defines test types (unit, integration, e2e), runner configuration, and Testkube patterns for in-cluster testing.
- `commit-standards` — Delegate to this for commit message validation in CI. Defines conventional commit format that CI pipelines can enforce via pre-commit hooks or PR checks.
