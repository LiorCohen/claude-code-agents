# TODO

- [ ] Need to figure out whether to keep type generation as part of the contract or move it to the frontend and backend agents

## Version Management

**CRITICAL:** Before committing ANY changes to the plugin:

1. Bump the version in `plugin/.claude-plugin/plugin.json`
2. Bump the version in `.claude-plugin/marketplace.json`
3. Both versions MUST match
4. Use semantic versioning (MAJOR.MINOR.PATCH)

Current version: 1.1.0

### Quick version bump command:

```bash
# Bump patch version (1.0.4 -> 1.0.5)
./scripts/bump-version.sh patch

# Bump minor version (1.0.4 -> 1.1.0)
./scripts/bump-version.sh minor

# Bump major version (1.0.4 -> 2.0.0)
./scripts/bump-version.sh major
```
