# Contributing to SDD Plugin

Guidelines for contributing to the Spec-Driven Development plugin.

## Repository Structure

```
claude-code-plugins/
├── .claude-plugin/
│   └── marketplace.json          # Marketplace manifest
├── .claude/
│   └── skills/                   # Marketplace-level skills
│       ├── commit/               # Commit workflow
│       └── typescript-standards/ # TypeScript coding standards
├── plugins/
│   └── sdd/                      # SDD plugin
│       ├── .claude-plugin/
│       │   └── plugin.json       # Plugin manifest
│       ├── agents/               # Specialized agents
│       ├── commands/             # Slash commands
│       ├── skills/               # Reusable patterns
│       ├── scripts/              # Utility scripts
│       ├── README.md             # Plugin documentation
│       ├── CHANGELOG.md          # Version history
│       └── CLAUDE.md             # Plugin guidance
├── tests/sdd/                    # Plugin tests
├── README.md                     # Marketplace overview
├── CLAUDE.md                     # Development guidance
└── CHANGELOG.md                  # Marketplace changelog
```

## Making Changes

1. **Make your changes** to plugin files (agents, commands, skills, etc.)

2. **Bump the version** in both locations:
   - `plugins/sdd/.claude-plugin/plugin.json`
   - `.claude-plugin/marketplace.json`

3. **Update CHANGELOG.md**:
   - Add a new version entry in `plugins/sdd/CHANGELOG.md`
   - Include version number, date, and clear description of changes
   - Categorize changes (Added, Enhanced, Fixed, Removed, etc.)

4. **Test your changes**:
   - Reload the plugin in Claude Code
   - Test affected commands/agents
   - Verify version numbers match

5. **Commit all changes together** using the `/commit` skill

## Semantic Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.x.x → 2.0.0): Breaking changes that require user action
- **MINOR** (1.0.x → 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, documentation updates, small improvements

## Changelogs

**Two separate changelogs:**

1. **Plugin CHANGELOG** (`plugins/sdd/CHANGELOG.md`):
   - Updated when plugin functionality changes
   - Tied to semantic version numbers
   - Covers: agents, commands, skills, templates, scripts

2. **Marketplace CHANGELOG** (`CHANGELOG.md` at root):
   - Updated when marketplace infrastructure changes
   - Date-based entries (no version numbers)
   - Covers: root docs, ignore files, marketplace skills, test infrastructure

## Testing

Before committing:
1. Test plugin functionality in Claude Code
2. Verify all documentation is updated
3. Check version numbers match across files
4. Ensure CHANGELOG entry is complete

## Resources

- [Claude Code Documentation](https://docs.anthropic.com/claude/docs/claude-code)
- [Semantic Versioning](https://semver.org/)
