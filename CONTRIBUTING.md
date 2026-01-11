# Contributing to SDD Plugin

## Version Management

**CRITICAL:** Before committing ANY changes to the plugin, you MUST bump the version.

### Quick Version Bump

Use the provided script to bump versions automatically:

```bash
# Bump patch version (bug fixes, small changes)
./scripts/bump-version.sh patch

# Bump minor version (new features, backwards compatible)
./scripts/bump-version.sh minor

# Bump major version (breaking changes)
./scripts/bump-version.sh major
```

The script will:
1. Update `plugin/.claude-plugin/plugin.json`
2. Update `.claude-plugin/marketplace.json`
3. Show you the next steps

### Manual Version Bump

If you need to bump versions manually:

1. Edit `plugin/.claude-plugin/plugin.json` - update the `version` field
2. Edit `.claude-plugin/marketplace.json` - update `plugins[0].version` field
3. Ensure all three versions match exactly

### Semantic Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.x.x → 2.0.0): Breaking changes that require user action
- **MINOR** (1.0.x → 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, documentation updates, small improvements

### Commit Workflow

```bash
# 1. Make your changes to the plugin
vim plugin/agents/some-agent.md

# 2. Bump the version
./scripts/bump-version.sh patch

# 3. Review all changes
git diff

# 4. Commit everything together
git add .
git commit -m "Your descriptive commit message

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

## Plugin Development

### Directory Structure

```
sdd/
├── plugin/                          # Main plugin directory
│   ├── .claude-plugin/
│   │   └── plugin.json             # Plugin metadata and version
│   ├── agents/                      # 10 specialized agents
│   ├── commands/                    # 5 slash commands
│   ├── skills/                      # 4 reusable skills
│   ├── templates/                   # Project scaffolding templates
│   ├── scripts/                     # Python validation utilities
│   └── TODO.md                      # Current tasks and version info
├── .claude-plugin/
│   └── marketplace.json             # Marketplace metadata and version
└── scripts/
    └── bump-version.sh              # Version management script
```

### Testing Changes

After making changes:

1. Reload the plugin in Claude Code
2. Test the affected commands/agents
3. Verify version numbers match across all files
4. Commit with bumped version

### Guidelines

1. **Always bump version before committing**
2. **Test your changes** before committing
3. **Document breaking changes** in commit messages
4. **Follow existing patterns** for agents, commands, and skills
5. **Update TODO.md** if adding new tasks or completing existing ones
