---
name: commit
description: Create a commit following repository guidelines with proper versioning and changelog updates.
---


# Commit Skill

Create commits that follow the repository's guidelines with proper versioning and changelog updates.

---

## Workflow

### Step 1: Analyze Changes

Run `git status` and `git diff` to understand:
- Which files have been modified
- Which plugins are affected
- Whether version files need updating
- Whether CHANGELOG needs updating

### Step 2: Version Check

For each affected plugin, check if version bump is needed:

**Files That REQUIRE Version Bump:**

| Directory/File | Description |
|----------------|-------------|
| `plugins/sdd/agents/` | All agent `.md` files |
| `plugins/sdd/commands/` | All command `.md` files |
| `plugins/sdd/skills/` | All skill `.md` files |
| `plugins/sdd/templates/` | All template files |
| `plugins/sdd/scripts/` | All script files |
| `plugins/sdd/.claude-plugin/` | Plugin manifest |
| `plugins/sdd/README.md` | Plugin documentation |
| `plugins/sdd/QUICKSTART.md` | Plugin getting started guide |
| `plugins/sdd/CLAUDE.md` | Plugin guidance for Claude |

**Files That Do NOT Require Version Bump (Marketplace-Level):**

- Root `README.md`
- Root `CLAUDE.md`
- Root `CONTRIBUTING.md`
- Root `CHANGELOG.md` (infrastructure entries only - versioned entries need version bump)
- `.claude/skills/` (marketplace-level skills)
- `.gitignore`
- `.claudeignore`
- `plugins/sdd/tests/` (test files)

If version bump is needed, prompt for type:
- **PATCH** (x.x.Z): Bug fixes, small improvements
- **MINOR** (x.Y.0): New features, backwards compatible
- **MAJOR** (X.0.0): Breaking changes

Update BOTH files:
- `plugins/sdd/.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`

### Step 3: Changelog Check

**Single consolidated CHANGELOG** (`CHANGELOG.md` at root):

- **Plugin changes**: Format `## [x.y.z] - YYYY-MM-DD` (versioned releases)
- **Infrastructure changes**: Format `## Infrastructure - YYYY-MM-DD` (date-based)

If plugin version was bumped, ensure CHANGELOG.md has a versioned entry:

```markdown
## [x.y.z] - YYYY-MM-DD

### [Category]

- **[component]**: Description of change
  - Detail 1
  - Detail 2

### Rationale

Why this change was made (for significant changes).
```

**Categories:**
- `Added` - New features
- `Changed` - Changes to existing functionality
- `Enhanced` - Improvements to existing features
- `Fixed` - Bug fixes
- `Removed` - Removed features

### Step 4: Generate Commit Message

Format:
```
[Action] [Component]: [Description], bump to [version]

[Optional detailed explanation]

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

**Actions:**
- **Add**: New feature or file
- **Fix**: Bug fix
- **Update**: Enhancement to existing feature
- **Remove**: Deletion
- **Refactor**: Code restructuring without behavior change
- **Docs**: Documentation only

### Step 5: Review and Confirm

Present to the user:
- Summary of files to be committed
- Proposed commit message
- Version changes (if any)
- Changelog additions (if any)

**Wait for user confirmation before proceeding.**

### Step 6: Execute Commit

After confirmation:
1. Stage all related files (code + version files + CHANGELOG)
2. Create the commit with the generated message
3. Display commit result

---

## Example

```
User: /commit

Agent: Analyzing changes...

Found changes in:
- plugins/sdd/agents/backend-dev.md

Detected plugin: plugins/sdd (current version: 1.10.19)

Version files need updating:
- plugins/sdd/.claude-plugin/plugin.json
- .claude-plugin/marketplace.json

What type of version bump?
1. PATCH (1.10.19 → 1.10.20) - Bug fixes, small improvements
2. MINOR (1.10.19 → 1.11.0) - New features
3. MAJOR (1.10.19 → 2.0.0) - Breaking changes

User: 1

Agent: Updating versions to 1.10.20...
✓ Updated plugin.json
✓ Updated marketplace.json

CHANGELOG.md needs an entry for 1.10.20.

Proposed entry:

## [1.10.20] - 2026-01-17

### Fixed

- Updated backend-dev agent with improved error handling

Should I add this entry? (yes/edit/no)

User: yes

Agent: ✓ Updated CHANGELOG.md

Proposed commit message:

---
Fix backend-dev agent: Improve error handling, bump to 1.10.20

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
---

Files to commit:
- plugins/sdd/agents/backend-dev.md
- plugins/sdd/.claude-plugin/plugin.json
- CHANGELOG.md
- .claude-plugin/marketplace.json

Proceed with commit? (yes/edit/no)

User: yes

Agent: ✓ Committed: abc1234 "Fix backend-dev agent: Improve error handling, bump to 1.10.20"
```

---

## Quick Reference

```
Plugin file changed? → Bump version → Add versioned entry to CHANGELOG.md → Stage all → Commit
Infrastructure file changed? → Add Infrastructure entry to CHANGELOG.md → Stage all → Commit
```

## Common Mistakes to Avoid

1. **Forgetting version bump** - Always bump version for plugin file changes
2. **Mismatched versions** - plugin.json and marketplace.json must match
3. **Missing CHANGELOG** - Every change needs a CHANGELOG entry (versioned or Infrastructure)
4. **Wrong entry format** - Plugin changes use `## [x.y.z] - YYYY-MM-DD`, infrastructure uses `## Infrastructure - YYYY-MM-DD`
5. **Wrong commit format** - Must include Co-Authored-By
6. **Staging incomplete** - Must include all version files in same commit
7. **Wrong date in CHANGELOG** - Use today's date

## Verification Commands

Run these before committing:

```bash
# Check versions match
echo "Plugin version:"
cat plugins/sdd/.claude-plugin/plugin.json | grep version

echo "Marketplace version:"
cat .claude-plugin/marketplace.json | grep version

# Check CHANGELOG has entry for new version
head -20 CHANGELOG.md

# Check staged files
git status
```
