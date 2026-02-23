---
name: capabilities
description: Intent-to-command mappings for fullstack-typescript tech pack features.
user-invocable: false
---

# Capabilities

Intent-to-command mappings for fullstack-typescript tech pack features. When core's `/sdd` command loads capabilities from tech packs, this skill provides the additional intent mappings for config management, local environment, database, and contract operations.

---

## Mappings

| User Says | Interpreted As |
|-----------|---------------|
| "I want to generate config for local" | `/sdd-run config generate --env local` |
| "I want to validate my config" | `/sdd-run config validate` |
| "I want to compare local and production config" | `/sdd-run config diff local production` |
| "I want to create a local environment" | `/sdd-run local-env create` |
| "I want to deploy to my local environment" | `/sdd-run local-env deploy` |
| "I want to set up my database" | `/sdd-run database setup {name} --env local` |
| "I want to run migrations" | `/sdd-run database migrate {name} --env local` |
| "I want to validate my contract" | `/sdd-run contract validate {name}` |
| "I want to generate TypeScript types" | `/sdd-run contract generate-types {name}` |

---

## Input / Output

This skill defines no input parameters or structured output.
