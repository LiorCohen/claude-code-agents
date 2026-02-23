---
name: cicd-scaffolding
description: Scaffolds CI/CD pipeline definitions using GitHub Actions for build, test, lint, and deploy workflows.
user-invocable: false
---

# CI/CD Scaffolding

Scaffolds a CI/CD pipeline component using GitHub Actions.

## Input

Invoked by the scaffolding orchestrator with:
- `component_name`: Name of the CI/CD component (typically `cicd`)
- `project_name`: Project name from settings
- `existing_components`: Currently configured components

## Directory Structure

```
components/cicd/
├── .github/
│   └── workflows/
│       ├── ci.yaml           # Build + test + lint on PR
│       ├── cd.yaml           # Deploy on merge to main
│       └── release.yaml      # Release workflow
├── scripts/
│   ├── build.sh
│   └── deploy.sh
└── README.md
```

## Workflow

1. Create `components/cicd/` directory
2. Generate GitHub Actions workflow files based on existing components:
   - If servers exist: add build, test, Docker image steps
   - If webapps exist: add build, test steps
   - If helm charts exist: add deploy steps
   - If contracts exist: add validation steps
3. Create helper scripts in `scripts/`
4. Generate README with pipeline documentation

## Standards

Follow `cicd-standards` for workflow structure and naming conventions.

## Output

Returns a declared actions response with `register_component` action for the new CI/CD component.
