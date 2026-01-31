---
id: 53
title: Missing helm-standards skill
priority: inbox
status: open
created: 2026-01-25
plan: ../../plans/new/PLAN-task-53-helm-standards-skill.md
---

# Task 53: Missing helm-standards skill

## Description

Add a `helm-standards` skill that provides guidance and standards for writing Helm charts:
- Chart structure and naming conventions
- Values file organization
- Template best practices
- Security considerations (RBAC, securityContext, etc.)
- Resource management (limits, requests)
- Health checks and probes
- ConfigMap and Secret handling
- **Readability first:** Prioritize simple, readable templates over clever solutions. Minimize use of special functions and Go template wizardry. Charts should be easy to understand at a glance.
