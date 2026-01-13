# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **Claude Code plugin marketplace** that contains a collection of plugins for spec-driven development and full-stack engineering workflows. The marketplace organizes and distributes Claude Code plugins.

## Marketplace Structure

```
claude-code-plugins/
├── .claude-plugin/
│   └── marketplace.json           # Marketplace manifest
├── full-stack-spec-driven-dev/    # SDD plugin (v1.9.0)
├── README.md                      # Marketplace overview
└── CLAUDE.md                      # This file
```

## What is a Marketplace?

A Claude Code marketplace is a directory structure that:
- Contains multiple plugins organized in subdirectories
- Has a `marketplace.json` manifest listing all plugins
- Allows Claude Code to discover and load plugins automatically
- Provides a centralized location for related plugins

## Available Plugins

### Spec-Driven Development (SDD) - v1.9.0
**Directory:** `full-stack-spec-driven-dev/`
**Description:** Comprehensive plugin for spec-driven development with React, Node.js, and TypeScript

**For detailed information about this plugin, see:**
- [Plugin README](./full-stack-spec-driven-dev/README.md) - Complete documentation
- [Plugin QUICKSTART](./full-stack-spec-driven-dev/QUICKSTART.md) - Getting started
- [Plugin CHANGELOG](./full-stack-spec-driven-dev/CHANGELOG.md) - Version history

## Working with This Marketplace

### Adding a New Plugin

When adding a new plugin to this marketplace:

1. **Create plugin directory** under root:
   ```
   mkdir your-plugin-name
   ```

2. **Create plugin structure**:
   ```
   your-plugin-name/
   ├── .claude-plugin/
   │   └── plugin.json       # Required manifest
   ├── agents/               # Optional: agent definitions
   ├── commands/             # Optional: slash commands
   ├── skills/               # Optional: reusable patterns
   ├── README.md            # Required: plugin documentation
   └── CHANGELOG.md         # Required: version history
   ```

3. **Update marketplace.json**:
   ```json
   {
     "name": "lior-cohen-cc-plugins",
     "owner": {
       "name": "Lior Cohen"
     },
     "plugins": [
       {
         "name": "existing-plugin",
         "source": "./full-stack-spec-driven-dev",
         "description": "...",
         "version": "1.9.0"
       },
       {
         "name": "your-plugin-name",
         "source": "./your-plugin-name",
         "description": "Brief description",
         "version": "1.0.0"
       }
     ]
   }
   ```

4. **Update root README.md** to list the new plugin

5. **Commit all changes together**

### Plugin Version Management

Each plugin manages its own version independently:
- Plugin version is stored in its `plugin.json` and the marketplace `marketplace.json`
- Each plugin should maintain its own `CHANGELOG.md`
- Version bumps should include corresponding changelog entries

**Important:** Root marketplace files (like this CLAUDE.md) should NOT contain plugin-specific implementation details. Those belong in the plugin's own directory.

### File Organization Rules

**Root Level (Marketplace):**
- `README.md` - Marketplace overview, plugin listing
- `CLAUDE.md` - This file, marketplace structure guidance
- `.claude-plugin/marketplace.json` - Marketplace manifest
- Plugin directories (one per plugin)

**Plugin Level:**
- Each plugin directory contains all plugin-specific files
- Plugin README.md contains comprehensive plugin documentation
- Plugin CHANGELOG.md tracks plugin version history
- Plugin CLAUDE.md (optional) can provide plugin-specific guidance

## Notes for Claude Code

- This repository contains a **marketplace**, not individual plugins
- When referencing a specific plugin, always look in its directory
- Each plugin is independent and self-contained
- Marketplace-level files should remain generic and not contain plugin implementation details
- Plugin-specific documentation lives in plugin directories

## Resources

- [Claude Code Documentation](https://docs.anthropic.com/claude/docs/claude-code)
- [Plugin Development Guide](https://docs.anthropic.com/claude/docs/claude-code-plugins)
- [Claude Agent SDK](https://github.com/anthropics/anthropic-sdk-typescript)

## Contributing

When contributing to this marketplace:
1. Follow the "Adding a New Plugin" section above
2. Ensure plugin-specific content stays in plugin directories
3. Keep root files focused on marketplace organization
4. Update all relevant documentation (marketplace + plugin)
5. Test plugin discovery and loading
6. Submit pull request with clear description
