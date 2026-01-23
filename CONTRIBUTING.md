# Contributing to Claude Code Plugin Marketplace

This repository is a **Claude Code plugin marketplace** containing multiple plugins. Follow these guidelines when contributing.

## Repository Structure

This is a marketplace, not a single plugin:

```
claude-code-plugins/
├── .claude-plugin/
│   └── marketplace.json              # Marketplace manifest
├── .claude/
│   └── skills/                       # Marketplace-level skills (e.g., commit)
├── full-stack-spec-driven-dev/       # SDD plugin
│   ├── .claude-plugin/
│   │   └── plugin.json               # Plugin manifest
│   ├── agents/                       # Plugin agents
│   ├── commands/                     # Plugin commands
│   ├── skills/                       # Plugin skills
│   ├── templates/                    # Plugin templates
│   ├── scripts/                      # Plugin utilities
│   ├── tests/                        # Plugin tests
│   ├── README.md                     # Plugin documentation
│   ├── QUICKSTART.md                 # Plugin getting started
│   ├── CHANGELOG.md                  # Plugin version history
│   └── CLAUDE.md                     # Plugin-specific guidance
├── README.md                         # Marketplace overview
├── CLAUDE.md                         # Marketplace guidance
├── CHANGELOG.md                      # Marketplace changelog (infrastructure)
├── CONTRIBUTING.md                   # This file
├── .gitignore
└── .claudeignore
```

## Contributing to Existing Plugins

### Working on the SDD Plugin

When making changes to the `full-stack-spec-driven-dev` plugin:

1. **Make your changes** to plugin files (agents, commands, skills, etc.)

2. **Bump the version** in both locations:
   - `full-stack-spec-driven-dev/.claude-plugin/plugin.json`
   - `.claude-plugin/marketplace.json`

3. **Update CHANGELOG.md**:
   - Add a new version entry in `full-stack-spec-driven-dev/CHANGELOG.md`
   - Include version number, date, and clear description of changes
   - Categorize changes (Added, Enhanced, Fixed, Removed, etc.)

4. **Test your changes**:
   - Reload the plugin in Claude Code
   - Test affected commands/agents
   - Verify version numbers match

5. **Commit all changes together**:
   ```bash
   git add full-stack-spec-driven-dev/ .claude-plugin/marketplace.json
   git commit -m "Descriptive message about changes

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   ```

### Semantic Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.x.x → 2.0.0): Breaking changes that require user action
- **MINOR** (1.0.x → 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, documentation updates, small improvements

### Example Workflow

```bash
# 1. Make your changes
vim full-stack-spec-driven-dev/agents/backend-dev.md

# 2. Update version in both locations
# - full-stack-spec-driven-dev/.claude-plugin/plugin.json: 1.9.0 → 1.9.1
# - .claude-plugin/marketplace.json: 1.9.0 → 1.9.1

# 3. Update CHANGELOG.md
vim full-stack-spec-driven-dev/CHANGELOG.md
# Add [1.9.1] entry with description

# 4. Test changes
# Reload plugin in Claude Code and test

# 5. Commit everything together
git add full-stack-spec-driven-dev/ .claude-plugin/marketplace.json
git commit -m "Enhance backend-dev agent with X feature, bump to 1.9.1

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

## Adding a New Plugin

To add a new plugin to this marketplace:

### 1. Create Plugin Directory

```bash
mkdir your-plugin-name
cd your-plugin-name
```

### 2. Create Plugin Structure

Required files:
```
your-plugin-name/
├── .claude-plugin/
│   └── plugin.json          # Required: plugin manifest
├── README.md               # Required: plugin documentation
├── CHANGELOG.md            # Required: version history
└── CLAUDE.md               # Optional: plugin-specific guidance
```

Optional directories (as needed):
```
your-plugin-name/
├── agents/                 # Specialized agents
├── commands/               # Slash commands
├── skills/                 # Reusable patterns
├── templates/              # Project scaffolding
└── scripts/                # Utility scripts
```

### 3. Create Plugin Manifest

Create `.claude-plugin/plugin.json`:

```json
{
  "name": "your-plugin-name",
  "version": "1.0.0",
  "description": "Brief description of your plugin",
  "author": {
    "name": "Your Name"
  },
  "commands": [
    "./commands/command1.md",
    "./commands/command2.md"
  ]
}
```

### 4. Update Marketplace Manifest

Add your plugin to `.claude-plugin/marketplace.json`:

```json
{
  "name": "lior-cohen-cc-plugins",
  "owner": {
    "name": "Lior Cohen"
  },
  "plugins": [
    {
      "name": "sdd",
      "source": "./full-stack-spec-driven-dev",
      "description": "Spec-driven development methodology for full-stack teams",
      "version": "1.9.0"
    },
    {
      "name": "your-plugin-name",
      "source": "./your-plugin-name",
      "description": "Brief description of your plugin",
      "version": "1.0.0"
    }
  ]
}
```

### 5. Update Marketplace README

Add your plugin to the root `README.md` under "Available Plugins":

```markdown
### [Your Plugin Name](./your-plugin-name/)

**Version:** 1.0.0

Brief description and key features.

**[Read full documentation →](./your-plugin-name/README.md)**
```

### 6. Commit and Submit

```bash
git add .
git commit -m "Add your-plugin-name plugin v1.0.0

Description of what the plugin does.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Your Name <your-email>"

# Push and create pull request
git push origin your-branch-name
```

## Guidelines

### Version Management

- **Each plugin manages its own version** independently
- Plugin version must be updated in TWO places:
  1. Plugin's own `plugin.json`
  2. Marketplace's `marketplace.json`
- Both versions must match exactly
- Every plugin version bump requires a plugin CHANGELOG entry

### Changelog Management

**Two separate changelogs:**

1. **Plugin CHANGELOG** (`full-stack-spec-driven-dev/CHANGELOG.md`):
   - Updated when plugin functionality changes
   - Tied to semantic version numbers
   - Covers: agents, commands, skills, templates, scripts

2. **Marketplace CHANGELOG** (`CHANGELOG.md` at root):
   - Updated when marketplace infrastructure changes
   - Date-based entries (no version numbers)
   - Covers: root docs, ignore files, marketplace skills, test infrastructure

### File Organization

**Root Level (Marketplace):**
- Only marketplace-wide files (README, CLAUDE.md, marketplace.json)
- No plugin-specific implementation details
- Focus on marketplace organization and plugin discovery

**Plugin Level:**
- All plugin-specific content in plugin directory
- Each plugin is self-contained
- Plugin README contains comprehensive documentation
- Plugin CHANGELOG tracks version history

### Documentation

- **Root README**: Marketplace overview and plugin listing
- **Root CHANGELOG**: Marketplace infrastructure changes
- **Root CLAUDE.md**: Marketplace structure guidance
- **Plugin README**: Comprehensive plugin documentation
- **Plugin CHANGELOG**: Plugin version history
- **Plugin CLAUDE.md**: Plugin-specific guidance for Claude Code

### Testing

Before committing:
1. Test plugin functionality in Claude Code
2. Verify all documentation is updated
3. Check version numbers match across files
4. Ensure CHANGELOG entry is complete

### Commit Messages

Use descriptive commit messages:

```
[Action] [Component]: [Description]

Detailed explanation if needed.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: [Name] <[email]>
```

Examples:
- `Enhance backend-dev agent: Add dotenv support, bump to 1.9.1`
- `Add new-plugin: Initial implementation v1.0.0`
- `Fix api-designer agent: Correct operationId generation, bump to 1.9.2`
- `Update marketplace README: Add installation instructions`

## Getting Help

- Check plugin-specific `README.md` for plugin documentation
- Check `CLAUDE.md` files for guidance (root and plugin-level)
- Review existing plugins for examples
- Open an issue for questions or problems

## Resources

- [Claude Code Documentation](https://docs.anthropic.com/claude/docs/claude-code)
- [Plugin Development Guide](https://docs.anthropic.com/claude/docs/claude-code-plugins)
- [Claude Agent SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- [Semantic Versioning](https://semver.org/)
