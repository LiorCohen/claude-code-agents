---
name: commit
description: Create a commit following CONTRIBUTING.md guidelines with proper versioning and changelog updates.
---

**FIRST:** Print this banner exactly (including blank lines):

```
╔══════════════════════════════════════════════════════════════════╗
║  🔧 SKILL: commit                                                ║
║  📝 Create commit following CONTRIBUTING.md guidelines           ║
╚══════════════════════════════════════════════════════════════════╝
```

# /commit

Create a commit that follows the repository's CONTRIBUTING.md guidelines.

## Flow

### 1. Read CONTRIBUTING.md

Read `CONTRIBUTING.md` from the repository root to understand:
- Commit message format
- Co-author requirements
- Version bumping rules
- Changelog requirements
- File grouping rules

### 2. Analyze Changes

Run `git status` and `git diff` to understand:
- Which files have been modified
- Which plugins are affected
- Whether version files need updating
- Whether CHANGELOG needs updating

### 3. Version Check

For each affected plugin:
- Check `plugin.json` version
- Check `marketplace.json` version
- If versions don't match the changes, prompt for version bump:
  - **PATCH** (x.x.X): Bug fixes, small improvements
  - **MINOR** (x.X.0): New features, backwards compatible
  - **MAJOR** (X.0.0): Breaking changes

### 4. Changelog Check

For each affected plugin:
- Check if CHANGELOG.md has entry for the new version
- If not, create one based on staged changes
- Format: `## [version] - YYYY-MM-DD` with categorized changes

### 5. Generate Commit Message

Based on CONTRIBUTING.md format:

```
[Action] [Component]: [Description], bump to [version]

[Optional detailed explanation]

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

Actions:
- **Add**: New feature or file
- **Fix**: Bug fix
- **Update**: Enhancement to existing feature
- **Remove**: Deletion
- **Refactor**: Code restructuring without behavior change
- **Docs**: Documentation only

### 6. Review and Confirm

Present to the user:
- Summary of files to be committed
- Proposed commit message
- Version changes (if any)
- Changelog additions (if any)

Wait for user confirmation before proceeding.

### 7. Execute Commit

After confirmation:
1. Stage any additional files (version files, CHANGELOG)
2. Create the commit with the generated message
3. Display commit result

## Example

```
User: /commit

Agent: Analyzing changes...

Found changes in:
- full-stack-spec-driven-dev/agents/backend-dev.md

Detected plugin: full-stack-spec-driven-dev (current version: 1.10.14)

Version files need updating:
- full-stack-spec-driven-dev/.claude-plugin/plugin.json
- .claude-plugin/marketplace.json

What type of version bump?
1. PATCH (1.10.14 → 1.10.15) - Bug fixes, small improvements
2. MINOR (1.10.14 → 1.11.0) - New features
3. MAJOR (1.10.14 → 2.0.0) - Breaking changes

User: 1

Agent: Updating versions to 1.10.15...
✓ Updated plugin.json
✓ Updated marketplace.json

CHANGELOG.md needs an entry for 1.10.15.

Proposed entry:

## [1.10.15] - 2026-01-17

### Fixed

- Updated backend-dev agent with improved error handling

Should I add this entry? (yes/edit/no)

User: yes

Agent: ✓ Updated CHANGELOG.md

Proposed commit message:

---
Fix backend-dev agent: Improve error handling, bump to 1.10.15

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
---

Files to commit:
- full-stack-spec-driven-dev/agents/backend-dev.md
- full-stack-spec-driven-dev/.claude-plugin/plugin.json
- full-stack-spec-driven-dev/CHANGELOG.md
- .claude-plugin/marketplace.json

Proceed with commit? (yes/edit/no)

User: yes

Agent: ✓ Committed: abc1234 "Fix backend-dev agent: Improve error handling, bump to 1.10.15"
```

## Important Notes

- Always read CONTRIBUTING.md first
- Never skip version bumping for plugin changes
- Always ensure CHANGELOG entry exists for version changes
- Include Co-Authored-By attribution
- Commit related changes together (code + version + changelog)
- Both plugin.json AND marketplace.json versions must be updated
