# Getting Started with SDD

<!--
This file is maintained by the docs-writer agent.
To update, invoke the docs-writer agent with your changes.
-->

> Tutorial: Create your first SDD project in 5 minutes.

## What You'll Accomplish

By the end of this guide, you'll have:
- A fully structured project with specs, components, and configuration
- An understanding of how SDD organizes work
- Your first spec ready for implementation

## Prerequisites

- Claude Code CLI installed
- SDD plugin installed from the marketplace

## Step 1: Initialize Your Project

Run the initialization command:

```
/sdd-init --name my-app
```

You'll be guided through an interactive product discovery process. Answer the questions about your application - what it does, who it's for, and what components you need.

## Step 2: Review the Generated Structure

After initialization, you'll have:

```
my-app/
├── specs/                    # All specifications live here
│   ├── INDEX.md             # Registry of all specs
│   ├── SNAPSHOT.md          # Current product state
│   ├── domain/              # Business terminology and definitions
│   └── architecture/        # Architecture decisions
├── components/              # Your application code
│   ├── contract/            # API definitions (OpenAPI)
│   ├── server/              # Backend code
│   ├── webapp/              # Frontend code
│   ├── database/            # Database migrations and seeds
│   ├── config/              # YAML configuration
│   ├── helm/                # Kubernetes Helm charts
│   ├── testing/             # Test setup and definitions
│   └── cicd/                # CI/CD workflows
└── sdd-settings.yaml        # Project configuration
```

## Step 3: Create Your First Change

Ready to add a feature? Create a change spec:

```
/sdd-new-change --type feature --name user-login
```

This creates a spec and implementation plan. Review them before proceeding.

## What You Have Now

- A project structure designed for AI-assisted development
- Clear separation between specs (what to build) and code (how it's built)
- A workflow that ensures every change is specified before implemented

## Next Steps

- [Workflows](workflows.md) - Learn the feature, bugfix, and refactor workflows
- [Commands](commands.md) - Full command reference
- [Agents](agents.md) - Understand the specialized agents
