# Components

<!--
This file is maintained by the docs-writer agent.
To update, invoke the docs-writer agent with your changes.
-->

> Reference for all SDD component types.

## Overview

Components are the building blocks of an SDD project. Each component lives under `components/` and is recommended during `/sdd-init` based on your project's needs.

## Available Components

| Component | Description | Multi-Instance |
|-----------|-------------|----------------|
| `contract` | OpenAPI specification | No |
| `server` | Node.js backend (CMDO pattern) | Yes |
| `webapp` | React frontend (MVVM pattern) | Yes |
| `database` | PostgreSQL migrations and seeds | No |
| `config` | YAML configuration schemas | No |
| `helm` | Kubernetes Helm charts | No |
| `testing` | Testkube test setup and definitions | No |
| `cicd` | GitHub Actions CI/CD workflows | No |

## Component Details

### Contract

API-first design using OpenAPI specifications. Defines the shared interface between server and client components. Generated TypeScript types ensure type safety across the stack.

**Directory:** `components/contract/`

### Server

Node.js/TypeScript backend following the CMDO (Controller, Model, Data, Operator) architecture pattern. Implements the API contract and contains business logic.

**Directory:** `components/server/` (or `components/server-{name}/` for multi-instance)

### Webapp

React/TypeScript frontend following the MVVM (Model-View-ViewModel) architecture pattern. Consumes the API contract for type-safe client calls.

**Directory:** `components/webapp/` (or `components/webapp-{name}/` for multi-instance)

### Database

PostgreSQL database component with migrations, seeds, and management scripts. Handles schema evolution and test data.

**Directory:** `components/database/`

### Config

YAML-based configuration management with validation schemas. Always included in every project.

**Directory:** `components/config/`

### Helm

Kubernetes Helm deployment charts and container definitions for production deployment.

**Directory:** `components/helm/`

### Testing

Testkube test setup and definitions for integration and end-to-end testing.

**Directory:** `components/testing/`

### CI/CD

GitHub Actions workflows for continuous integration and deployment, including PR checks and release pipelines.

**Directory:** `components/cicd/`

## Multi-Instance Components

Server and webapp components support multiple instances for projects that need separate backends or frontends. For example:

- `server-api` and `server-worker` for separate API and background processing services
- `webapp-admin` and `webapp-public` for separate admin and public-facing interfaces

When a component's name matches its type, the directory is `components/{type}/`. When the name differs, the directory is `components/{type}-{name}/`.

## Dependencies

| Component | Requires |
|-----------|----------|
| Contract | Server |
| Server | Contract |
| Webapp | - |
| Database | Server |
| Config | - |
| Helm | Server |
| Testing | Server or Webapp |
| CI/CD | Server or Webapp |

## Next Steps

- [Getting Started](getting-started.md) - Create your first project
- [Commands](commands.md) - Full command reference
- [Agents](agents.md) - Specialized agents that work with components
