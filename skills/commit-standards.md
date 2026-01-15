---
name: commit-standards
description: MANDATORY skill for all commits. Ensures CONTRIBUTING.md guidelines are followed.
---

# Commit Standards Skill

**MANDATORY:** This skill MUST be followed for ALL commits in this repository. No exceptions.

---

## Pre-Commit Checklist

Before creating ANY commit, verify ALL of the following:

### 1. Version Bump Required

If changes affect a plugin (files under `full-stack-spec-driven-dev/` or any plugin directory):

- [ ] Version bumped in plugin's `plugin.json`
- [ ] Version bumped in `.claude-plugin/marketplace.json`
- [ ] Both versions match exactly

**Version Type (Semantic Versioning):**
- **PATCH** (x.y.Z): Bug fixes, documentation updates, small improvements
- **MINOR** (x.Y.0): New features, backwards compatible
- **MAJOR** (X.0.0): Breaking changes requiring user action

### 2. CHANGELOG Entry Required

If version was bumped:

- [ ] New entry added to plugin's `CHANGELOG.md`
- [ ] Entry includes version number and date: `## [x.y.z] - YYYY-MM-DD`
- [ ] Entry categorized correctly (Added, Changed, Enhanced, Fixed, Removed)
- [ ] Entry describes what changed and why (Rationale section if significant)

### 3. Commit Message Format

**Required format:**

```
[Action] [Component]: [Description], bump to x.y.z

Optional detailed explanation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <model> <noreply@anthropic.com>
```

**Components:**
- Use actual model name: `Claude Opus 4.5`, `Claude Sonnet 4`, etc.

**Examples:**
- `Enhance backend-dev agent: Add dotenv support, bump to 1.9.1`
- `Fix api-designer agent: Correct operationId generation, bump to 1.9.2`
- `Add new-plugin: Initial implementation v1.0.0`

---

## Commit Workflow

### Step 1: Identify Scope

Determine what's being changed:
- **Plugin files changed?** → Version bump required
- **Marketplace files only?** → No version bump needed (README.md, CLAUDE.md, CONTRIBUTING.md)

### Step 2: Bump Version (if required)

```bash
# Check current version
cat full-stack-spec-driven-dev/.claude-plugin/plugin.json | grep version
cat .claude-plugin/marketplace.json | grep version

# Update both files to new version
```

### Step 3: Update CHANGELOG (if version bumped)

Add entry at the TOP of `full-stack-spec-driven-dev/CHANGELOG.md`:

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
- `Deprecated` - Features marked for removal
- `Security` - Security fixes

### Step 4: Stage All Related Files

```bash
# Stage plugin files AND version files
git add full-stack-spec-driven-dev/ .claude-plugin/marketplace.json
```

### Step 5: Create Commit

```bash
git commit -m "$(cat <<'EOF'
[Action] [Component]: [Description], bump to x.y.z

[Optional details]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <model> <noreply@anthropic.com>
EOF
)"
```

---

## Files That Require Version Bump

Changes to ANY of these require version bump + CHANGELOG:

| Directory | Files |
|-----------|-------|
| `full-stack-spec-driven-dev/agents/` | All agent `.md` files |
| `full-stack-spec-driven-dev/commands/` | All command `.md` files |
| `full-stack-spec-driven-dev/skills/` | All skill `.md` files |
| `full-stack-spec-driven-dev/templates/` | All template files |
| `full-stack-spec-driven-dev/scripts/` | All script files |
| `full-stack-spec-driven-dev/.claude-plugin/` | Plugin manifest |

## Files That Do NOT Require Version Bump

- Root `README.md`
- Root `CLAUDE.md`
- Root `CONTRIBUTING.md`
- Root `skills/` (marketplace-level skills)
- `.gitignore`

---

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

---

## Common Mistakes to Avoid

1. **Forgetting version bump** - Always bump version for plugin file changes
2. **Mismatched versions** - plugin.json and marketplace.json must match
3. **Missing CHANGELOG** - Every version bump needs a CHANGELOG entry
4. **Wrong commit format** - Must include emoji and Co-Authored-By
5. **Staging incomplete** - Must include all version files in same commit
6. **Wrong date in CHANGELOG** - Use today's date, not past dates

---

## Quick Reference

```
Plugin change? → Bump version → Update CHANGELOG → Stage all → Commit with format
```

**Commit message template:**
```
<Action> <component>: <description>, bump to <version>

<details>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <model> <noreply@anthropic.com>
```
