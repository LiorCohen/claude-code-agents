---
name: help-content
description: Tech pack description, available commands, and getting-started guide for fullstack-typescript.
user-invocable: false
---

# Help Content

Provides tech-pack-specific help content for the fullstack-typescript tech pack. This skill is loaded by the core help system to display tech-pack-aware guidance to the user.

## Tech Pack Description

The fullstack-typescript tech pack provides scaffolding, agents, and standards for building applications with Node.js/TypeScript backends (Express, CMDO architecture), React/TypeScript frontends (Vite, MVVM architecture), PostgreSQL databases, OpenAPI contracts, Helm charts, and CI/CD pipelines (GitHub Actions).

## Available Commands

| Command | Description |
|---------|-------------|
| `config generate` | Generate merged config file for a target environment |
| `config validate` | Validate config files against JSON schema |
| `config diff` | Show differences between two environment configs |
| `config add-env` | Add a new environment configuration |
| `local-env create` | Create local Kubernetes cluster for development |
| `local-env destroy` | Remove local Kubernetes cluster and all resources |
| `local-env start` | Start a stopped local Kubernetes cluster |
| `local-env stop` | Stop the local Kubernetes cluster without destroying it |
| `local-env deploy` | Deploy application to Kubernetes via Helm charts |
| `local-env undeploy` | Remove deployed application from Kubernetes |
| `local-env forward` | Forward local ports to running services |
| `database setup` | Initialize database schema, run migrations, and seed |
| `database teardown` | Remove database and all associated resources |
| `database migrate` | Run pending database migrations |
| `database seed` | Populate database with seed data |
| `database reset` | Drop and recreate database from scratch |
| `database port-forward` | Forward local port to database pod in Kubernetes |
| `database psql` | Open interactive PostgreSQL shell |
| `contract validate` | Validate OpenAPI spec for correctness |

## Getting Started

After initializing with `/sdd-run init`, try these capabilities:

1. **Create a feature** -- `/sdd I want to create a new feature` walks you through discovery, spec writing, planning, and implementation.
2. **Import an existing spec** -- `/sdd I want to import an external spec` if you have a PRD or design doc to import.
3. **Manage your local environment** -- Use `local-env create` to spin up a local Kubernetes cluster, then `local-env deploy` to deploy your application.
4. **Work with databases** -- Use `database setup` to initialize your database, and `database migrate` to apply schema changes.
5. **Validate contracts** -- Use `contract validate` to check your OpenAPI specifications for correctness.

## Component Types

The fullstack-typescript tech pack supports the following component types:

| Type | Description | Multiple Instances |
|------|-------------|--------------------|
| `config` | Centralized YAML configuration (mandatory singleton) | No |
| `contract` | OpenAPI 3.x API specifications | Yes |
| `database` | PostgreSQL databases with migrations and seed data | Yes |
| `server` | Node.js/TypeScript backends (CMDO architecture) | Yes |
| `webapp` | React/TypeScript frontends (MVVM architecture) | Yes |
| `helm` | Kubernetes Helm charts for deployment | Yes |
| `integration-testing` | Integration test suites against real dependencies | Yes |
| `e2e-testing` | End-to-end browser test suites via Playwright | Yes |
| `cicd` | CI/CD pipeline definitions for GitHub Actions | Yes |

## Input / Output

This skill defines no input parameters or structured output.
