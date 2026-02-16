# SDD Agents

<!--
This file is maintained by the docs-writer agent.
To update, invoke the docs-writer agent with your changes.
-->

> The specialized agents that power SDD.

## How Agents Work

SDD uses specialized agents instead of one general-purpose AI. Each agent has:
- A specific area of expertise
- Tools appropriate to its role
- Standards and patterns it follows

You can invoke agents in two ways:
1. **Via `/sdd`** - Commands like `/sdd I want to start implementing` automatically orchestrate agents based on the implementation plan
2. **Directly** - Ask Claude to use an agent (e.g., "Use the backend-dev agent to implement this endpoint")

## The Agents

### api-designer

Designs API contracts.

**When it's used:** During implementation when API changes are needed
**What it does:** Writes OpenAPI specs, generates TypeScript types for server and client

---

### backend-dev

Implements server-side code.

**When it's used:** During implementation for backend work
**What it does:** Writes Node.js/TypeScript code following CMDO architecture, writes unit tests

---

### frontend-dev

Implements client-side code.

**When it's used:** During implementation for frontend work
**What it does:** Writes React components following MVVM patterns, writes component tests

---

### db-advisor

Reviews database design.

**When it's used:** When database changes are proposed
**What it does:** Reviews schema and queries for performance, suggests optimizations

---

### tester

Writes integration and E2E tests.

**When it's used:** During implementation for non-unit tests
**What it does:** Creates Testkube test definitions, writes E2E scenarios

---

### devops

Handles infrastructure and CI/CD pipelines.

**When it's used:** When deployment configuration or build automation is needed
**What it does:** Writes Helm charts, Kubernetes configs, container definitions, GitHub Actions workflows, PR checks

---

### reviewer

Reviews code and specs.

**When it's used:** During verification (`/sdd I want to verify the implementation`)
**What it does:** Checks that implementation matches spec, reviews code quality

---

## Agent Models

Agents use different models based on their task complexity:

| Role | Model | Agents |
|------|-------|--------|
| Strategic | Opus | reviewer, db-advisor |
| Implementation | Sonnet | api-designer, backend-dev, frontend-dev, tester, devops |

Strategic agents handle decisions that require deep analysis and affect the whole project. Implementation agents execute defined tasks quickly and efficiently.

## Next Steps

- [Getting Started](getting-started.md) - See agents in action
- [Workflows](workflows.md) - How agents work together
- [Commands](commands.md) - Commands that orchestrate agents
