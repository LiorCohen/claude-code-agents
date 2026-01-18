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

| Directory | Files |
|-----------|-------|
| `full-stack-spec-driven-dev/agents/` | All agent `.md` files |
| `full-stack-spec-driven-dev/commands/` | All command `.md` files |
| `full-stack-spec-driven-dev/skills/` | All skill `.md` files |
| `full-stack-spec-driven-dev/templates/` | All template files |
| `full-stack-spec-driven-dev/scripts/` | All script files |
| `full-stack-spec-driven-dev/.claude-plugin/` | Plugin manifest |

**Files That Do NOT Require Version Bump:**

- Root `README.md`
- Root `CLAUDE.md`
- Root `CONTRIBUTING.md`
- `.claude/skills/` (marketplace-level skills)
- `.gitignore`

If version bump is needed, prompt for type:
- **PATCH** (x.x.Z): Bug fixes, small improvements
- **MINOR** (x.Y.0): New features, backwards compatible
- **MAJOR** (X.0.0): Breaking changes

Update BOTH files:
- `full-stack-spec-driven-dev/.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`

### Step 3: Changelog Check

If version was bumped, ensure CHANGELOG.md has an entry:

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
- full-stack-spec-driven-dev/agents/backend-dev.md

Detected plugin: full-stack-spec-driven-dev (current version: 1.10.19)

Version files need updating:
- full-stack-spec-driven-dev/.claude-plugin/plugin.json
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
- full-stack-spec-driven-dev/agents/backend-dev.md
- full-stack-spec-driven-dev/.claude-plugin/plugin.json
- full-stack-spec-driven-dev/CHANGELOG.md
- .claude-plugin/marketplace.json

Proceed with commit? (yes/edit/no)

User: yes

Agent: ✓ Committed: abc1234 "Fix backend-dev agent: Improve error handling, bump to 1.10.20"
```

---

## Quick Reference

```
Plugin file changed? → Bump version → Update CHANGELOG → Stage all → Commit
```

## Common Mistakes to Avoid

1. **Forgetting version bump** - Always bump version for plugin file changes
2. **Mismatched versions** - plugin.json and marketplace.json must match
3. **Missing CHANGELOG** - Every version bump needs a CHANGELOG entry
4. **Wrong commit format** - Must include Co-Authored-By
5. **Staging incomplete** - Must include all version files in same commit
6. **Wrong date in CHANGELOG** - Use today's date

## Verification Commands

Run these before committing:

```bash
# Check versions match
echo "Plugin version:"
cat full-stack-spec-driven-dev/.claude-plugin/plugin.json | grep version

echo "Marketplace version:"
cat .claude-plugin/marketplace.json | grep version

# Check CHANGELOG has entry for new version
head -20 full-stack-spec-driven-dev/CHANGELOG.md

# Check staged files
git status
```
