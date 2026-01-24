# CLAUDE.md

Guidance for Claude Code when working with this repository.

## Git Rules

- **NEVER push to remote** without explicit user approval
- **NEVER commit** without first updating version and CHANGELOG when modifying plugin files
- After making changes, STOP and report what was done - wait for user to request commit/push

## Skills

Use the `commit` skill for ALL commits.

## Repository Structure

```
claude-code-plugins/
├── .claude/
│   └── skills/
│       ├── commit/                   # Commit workflow with version/changelog
│       └── typescript-standards/     # TypeScript coding standards
├── .claude-plugin/
│   └── marketplace.json              # Marketplace manifest
├── plugins/
│   └── sdd/                          # SDD plugin (see plugins/sdd/README.md)
├── tests/sdd/                        # Plugin tests
├── README.md                         # Overview
├── CLAUDE.md                         # This file
├── CHANGELOG.md                      # Marketplace changelog
└── CONTRIBUTING.md                   # Contribution guidelines
```

## Plugin Documentation

For SDD plugin details, see:
- [Plugin README](./plugins/sdd/README.md) - Complete documentation
- [Plugin CLAUDE.md](./plugins/sdd/CLAUDE.md) - Plugin-specific guidance
- [Plugin CHANGELOG](./plugins/sdd/CHANGELOG.md) - Version history

## Commit Workflow

**CRITICAL:** Before making ANY commit, follow the `commit` skill at `.claude/skills/commit/SKILL.md`.

Quick reference:
```
Plugin file changed? → Bump version → Update CHANGELOG → Stage all → Commit
```

Version must be updated in BOTH:
- `plugins/sdd/.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`

## Resources

- [Claude Code Documentation](https://docs.anthropic.com/claude/docs/claude-code)
