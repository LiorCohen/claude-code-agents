# Claude Code Plugin Marketplace

A collection of Claude Code plugins for spec-driven development and full-stack engineering workflows.

## What is Claude Code?

[Claude Code](https://claude.com/code) is an AI-powered coding assistant that helps developers with software engineering tasks. It supports a plugin system that extends its capabilities with custom commands, agents, and workflows.

## Available Plugins

### [Spec-Driven Development (SDD)](./plugins/sdd/)

A comprehensive plugin for spec-driven development with React, Node.js, and TypeScript.

**Key Features:**
- 10 specialized agents (spec-writer, planner, backend-dev, frontend-dev, etc.)
- 5 slash commands for project lifecycle management
- 5-layer backend architecture with strict patterns
- MVVM frontend architecture with TanStack ecosystem
- Contract-first API development with OpenAPI
- Built-in observability with OpenTelemetry

**Commands:**
- `/sdd-init` - Initialize new project
- `/sdd-new-change` - Create change spec and plan
- `/sdd-implement-change` - Execute implementation plan
- `/sdd-verify-change` - Verify implementation matches spec
- `/sdd-generate-snapshot` - Regenerate product snapshot

**[Read full documentation →](./plugins/sdd/README.md)**

## Installation

### Using Claude CLI

Add the marketplace and install the SDD plugin:

```bash
claude plugin marketplace add https://github.com/LiorCohen/claude-code-plugins
claude plugin install sdd
```

### Inside Claude Code

You can also use the `/plugin` command:

```
/plugin marketplace add https://github.com/LiorCohen/claude-code-plugins
/plugin install sdd
```

Once installed, all commands, agents, and skills will be available immediately.

## Plugin Structure

```
.
├── .claude/
│   └── skills/                    # Marketplace-level skills
│       ├── commit/                # Commit workflow
│       └── typescript-standards/  # TypeScript coding standards
├── .claude-plugin/
│   └── marketplace.json           # Marketplace manifest
├── plugins/
│   └── sdd/                       # SDD plugin directory
│       ├── .claude-plugin/
│       │   └── plugin.json        # Plugin manifest
│       ├── agents/                # Specialized agents
│       ├── commands/              # Slash commands
│       ├── skills/                # Reusable patterns
│       ├── scripts/               # Utility scripts
│       ├── README.md              # Plugin documentation
│       └── CHANGELOG.md           # Plugin version history
├── CHANGELOG.md                   # Marketplace changelog
└── CONTRIBUTING.md                # Contribution guidelines
```

## Contributing

To add a new plugin to this marketplace:

1. Create a new directory under `plugins/`: `./plugins/your-plugin-name/`
2. Add required plugin structure (agents, commands, etc.)
3. Create `plugin.json` manifest in `.claude-plugin/` subdirectory
4. Update root `marketplace.json` to include your plugin
5. Submit a pull request

## Plugin Development

Each plugin follows Claude Code's plugin specification:

### Plugin Manifest (`plugin.json`)
```json
{
  "name": "plugin-name",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": {
    "name": "Author Name"
  },
  "commands": [
    "./commands/command1.md",
    "./commands/command2.md"
  ]
}
```

### Marketplace Manifest (`marketplace.json`)
```json
{
  "name": "marketplace-name",
  "owner": {
    "name": "Owner Name"
  },
  "plugins": [
    {
      "name": "plugin-name",
      "source": "./plugins/your-plugin-name",
      "description": "Plugin description",
      "version": "1.0.0"
    }
  ]
}
```

## Resources

- [Claude Code Documentation](https://docs.anthropic.com/claude/docs/claude-code)
- [Plugin Development Guide](https://docs.anthropic.com/claude/docs/claude-code-plugins)
- [Claude Agent SDK](https://github.com/anthropics/anthropic-sdk-typescript)

## License

See individual plugin directories for licensing information.
