# Getting Started with SDD

<!--
This file is maintained by the docs-writer agent.
To update, invoke the docs-writer agent with your changes.
-->

> Tutorial: Create your first SDD project in 5 minutes.

## What You'll Accomplish

By the end of this guide, you'll have:
- A minimal project structure ready for change-driven development
- An understanding of how SDD organizes work
- Your first spec ready for implementation

## Prerequisites

- Claude Code CLI installed
- SDD plugin installed from the marketplace
- Node.js 18+, npm, git, and Docker installed

## Step 1: Create Project Directory

First, create and navigate to your project directory:

```bash
mkdir my-app
cd my-app
```

## Step 2: Initialize Your Project

Run the initialization command:

```
/sdd I want to initialize a new project
```

SDD will:
1. **Detect project name** from the current directory (`my-app`)
2. **Verify environment** - check that required tools are installed
3. **Check permissions** - offer to configure Claude Code permissions
4. **Ask about components** - what types of components you plan to build
5. **Create minimal structure** - just the essentials to get started

## Step 3: Review the Minimal Structure

After initialization, you'll have:

```
my-app/
├── .sdd/
│   └── sdd-settings.yaml    # Project configuration (config component only)
├── specs/
│   └── INDEX.md             # Empty spec registry
├── components/
│   └── config/              # Configuration component (only one scaffolded)
│       ├── package.json
│       ├── envs/
│       │   ├── default/config.yaml
│       │   └── local/config.yaml
│       └── schemas/
├── README.md
├── CLAUDE.md
└── .gitignore
```

**What's NOT created yet** (deferred until first change):
- `changes/` directory
- `specs/domain/` subdirectories
- Server, webapp, database, contract components

## Step 4: Create Your First Change

Ready to add a feature? Create a change spec:

```
/sdd I want to create a new feature
```

This is where the magic happens:

1. **Requirements gathering** - SDD guides you through a solicitation workflow
2. **Component detection** - Determines which components are affected
3. **On-demand scaffolding** - If a component doesn't exist yet, it's scaffolded now
4. **Domain updates** - Glossary updated with new terms from your feature
5. **Spec creation** - Creates SPEC.md with Domain Model and Specs Directory Changes sections

After your first feature change, you might have:

```
my-app/
├── .sdd/
│   └── sdd-settings.yaml    # Now includes server component
├── specs/
│   ├── INDEX.md             # Updated with your change
│   └── domain/
│       └── glossary.md      # New domain terms
├── changes/
│   └── 2026/01/21/user-login/
│       ├── SPEC.md
│       └── PLAN.md
├── components/
│   ├── config/              # Updated with server config sections
│   └── server/              # NEW - scaffolded on-demand
│       ├── package.json
│       ├── src/
│       └── ...
└── ...
```

## The Change-Driven Approach

SDD uses a **change-driven** approach:

1. **Start minimal** - Only config component during init
2. **Add as needed** - Components scaffolded when you create changes that need them
3. **Domain grows organically** - Glossary and definitions populated from your changes

This means:
- No upfront architecture decisions needed
- Each change adds exactly what it needs
- Your project structure reflects what you've actually built

## What's Next

After creating your change spec, review and approve it:

```
/sdd I want to approve the spec
/sdd I want to approve the plan
/sdd I want to start implementing
```

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Minimal init** | Only creates config component; everything else on-demand |
| **On-demand scaffolding** | Components created when first change needs them |
| **Change-driven** | Every feature, bugfix, or refactor starts as a change spec |
| **Component discovery** | Required components identified per change |

## Next Steps

- [Workflows](workflows.md) - Learn the feature, bugfix, and refactor workflows
- [Commands](commands.md) - Full command reference
- [Agents](agents.md) - Understand the specialized agents
- [Configuration Guide](config-guide.md) - How the config system works
