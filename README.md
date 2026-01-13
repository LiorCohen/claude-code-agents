# Claude Code Plugin Marketplace

A collection of Claude Code plugins for spec-driven development and full-stack engineering workflows.

## What is Claude Code?

[Claude Code](https://claude.com/code) is an AI-powered coding assistant that helps developers with software engineering tasks. It supports a plugin system that extends its capabilities with custom commands, agents, and workflows.

## Available Plugins

### [Spec-Driven Development (SDD)](./full-stack-spec-driven-dev/)

**Version:** 1.9.0

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
- `/sdd-new-feature` - Create feature spec and plan
- `/sdd-implement-plan` - Execute implementation plan
- `/sdd-verify-spec` - Verify implementation matches spec
- `/sdd-generate-snapshot` - Regenerate product snapshot

**[Read full documentation →](./full-stack-spec-driven-dev/README.md)**

## Installation

### Local Marketplace

1. Clone this repository:
   ```bash
   git clone https://github.com/LiorCohen/claude-code-plugins.git
   cd claude-code-plugins
   ```

2. Configure Claude Code to use this marketplace:
   - Open Claude Code settings
   - Add this directory as a plugin marketplace source
   - Plugins will be automatically discovered

### Direct Plugin Installation

You can also install individual plugins by copying the plugin directory to your Claude Code plugins folder.

## Plugin Structure

```
.
├── .claude-plugin/
│   └── marketplace.json           # Marketplace manifest
└── full-stack-spec-driven-dev/    # SDD plugin directory
    ├── .claude-plugin/
    │   └── plugin.json            # Plugin manifest
    ├── agents/                    # Specialized agents
    ├── commands/                  # Slash commands
    ├── skills/                    # Reusable patterns
    ├── templates/                 # Project scaffolding
    ├── scripts/                   # Utility scripts
    ├── README.md                  # Plugin documentation
    ├── QUICKSTART.md             # Getting started
    └── CHANGELOG.md              # Version history
```

## Contributing

To add a new plugin to this marketplace:

1. Create a new directory under the root: `./your-plugin-name/`
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
      "source": "./your-plugin-directory",
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
