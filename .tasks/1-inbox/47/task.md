---
id: 47
title: Local environment create/start/stop workflow
priority: inbox
status: open
created: 2026-01-25
---

# Task 47: Local environment create/start/stop workflow

## Description

Missing a way to manage local development environments:
- Create a local environment (spin up k8s, databases, services)
- Start/stop the local environment
- Consistent commands across projects (e.g., `npm run env:up`, `npm run env:down`)
- Integrate with docker-compose or local k8s (minikube, kind, k3d)
- Handle dependencies between services
