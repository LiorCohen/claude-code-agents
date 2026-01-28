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
| `plugin/agents/` | All agent `.md` files |
| `plugin/commands/` | All command `.md` files |
| `plugin/skills/` | All skill `.md` files |
| `plugin/templates/` | All template files |
| `plugin/scripts/` | All script files |
| `plugin/.claude-plugin/` | Plugin manifest |
| `plugin/README.md` | Plugin documentation |
| `plugin/QUICKSTART.md` | Plugin getting started guide |
| `plugin/CLAUDE.md` | Plugin guidance for Claude |

**Files That Do NOT Require Version Bump (Marketplace-Level):**

- Root `README.md`
- Root `CLAUDE.md`
- Root `CONTRIBUTING.md`
- Root `CHANGELOG.md` (infrastructure entries only - versioned entries need version bump)
- `.claude/skills/` (marketplace-level skills)
- `.gitignore`
- `.claudeignore`
- `plugin/tests/` (test files)

If version bump is needed, prompt for type:
- **PATCH** (x.x.Z): Bug fixes, small improvements
- **MINOR** (x.Y.0): New features, backwards compatible
- **MAJOR** (X.0.0): Breaking changes

Update BOTH files:
- `plugin/.claude-plugin/plugin.json`
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

### Step 4: Documentation Check

**When to run:** If changes affect plugin functionality (commands, agents, skills, directory structure, workflows).

**What to check:**
1. Invoke the `docs-writer` agent to audit documentation against current plugin state
2. Review any inconsistencies found
3. Fix documentation issues before proceeding to commit

**Documentation files to verify:**
- `README.md` - Quick start, project structure, permissions
- `docs/getting-started.md` - Tutorial and structure diagrams
- `docs/commands.md` - Command references and examples
- `docs/workflows.md` - Workflow examples
- `docs/agents.md` - Agent descriptions
- `docs/components.md` - Component types

**Skip conditions:**
- Changes only affect test files
- Changes only affect marketplace-level skills (`.claude/skills/`)
- Changes only affect task management (`tasks/`)
- Trivial changes (typos, formatting)

### Step 5: Tasks & Plans Check

**IMPORTANT:** Before committing, verify that tasks and plans are up to date.

**Check for task-related work:**

1. **Is this commit completing a task?**
   - Search `tasks/TASKS.md` for related task numbers
   - If completing a task, ensure it will be moved to `## Completed` with:
     - Completion date (`**Completed: YYYY-MM-DD**`)
     - Summary of what was accomplished
     - Link to plan if one exists (`**Plan:** [plans/PLAN-task-N-slug.md](...)`)

2. **Does a plan exist for this work?**
   - Check `tasks/plans/` directory for related `PLAN-task-N-*.md` files
   - If a plan exists and work is complete, update plan status to `## Status: COMPLETED ✓`
   - If a plan exists and work is partial, leave status as `IN PROGRESS`

3. **Should a new task be created?**
   - If this commit reveals follow-up work needed, prompt to add a new task
   - If this commit is part of ongoing work not yet tracked, prompt to add a task

**Verification checklist:**

```
□ If completing a task → tasks/TASKS.md updated (moved to Completed, date added)
□ If plan exists → Plan status updated (COMPLETED or still IN PROGRESS)
□ If follow-up needed → New task added to tasks/TASKS.md
□ If work not tracked → Consider adding a task for traceability
```

**Skip conditions:**
- Trivial changes (typos, formatting) don't need task tracking
- Changes already tracked in an existing task don't need new tasks

**If tasks/plans need updating:**
- Update them BEFORE proceeding to commit
- Include `tasks/TASKS.md` and/or `tasks/plans/*.md` in the staged files

### Step 6: Generate Commit Message

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
- **Tasks**: Task management changes (adding, completing, updating tasks in `tasks/`)

### Step 7: Review and Confirm

Present to the user:
- Summary of files to be committed
- Proposed commit message
- Version changes (if any)
- Changelog additions (if any)
- Task/plan updates (if any)

**Wait for user confirmation before proceeding.**

### Step 8: Execute Commit

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
- plugin/agents/backend-dev.md

Detected plugin: plugin (current version: 1.10.19)

Version files need updating:
- plugin/.claude-plugin/plugin.json
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
- plugin/agents/backend-dev.md
- plugin/.claude-plugin/plugin.json
- CHANGELOG.md
- .claude-plugin/marketplace.json

Proceed with commit? (yes/edit/no)

User: yes

Agent: ✓ Committed: abc1234 "Fix backend-dev agent: Improve error handling, bump to 1.10.20"
```

---

## Quick Reference

```
Plugin file changed? → Bump version → CHANGELOG → Check docs → Check tasks/ → Stage all → Commit
Infrastructure file changed? → CHANGELOG → Check tasks/ → Stage all → Commit
Completing a task? → Update tasks/TASKS.md → Update plan status → Stage all → Commit
```

## Common Mistakes to Avoid

1. **Forgetting version bump** - Always bump version for plugin file changes
2. **Mismatched versions** - plugin.json and marketplace.json must match
3. **Missing CHANGELOG** - Every change needs a CHANGELOG entry (versioned or Infrastructure)
4. **Wrong entry format** - Plugin changes use `## [x.y.z] - YYYY-MM-DD`, infrastructure uses `## Infrastructure - YYYY-MM-DD`
5. **Wrong commit format** - Must include Co-Authored-By
6. **Staging incomplete** - Must include all version files in same commit
7. **Wrong date in CHANGELOG** - Use today's date
8. **Amending pushed commits** - NEVER amend commits that have been pushed to remote
9. **Multiple changelog entries per commit** - Each commit = one changelog entry. Split if needed
10. **Forgetting to update tasks/TASKS.md** - When completing a task, move it to Completed section before committing
11. **Stale plan status** - Update plan status to COMPLETED when work is done
12. **Untracked work** - Significant work should have a corresponding task for traceability
13. **Outdated documentation** - Plugin changes may require docs updates; run docs-writer agent to check

## One Commit = One Changelog Entry

**CRITICAL:** If your changes would result in multiple changelog entries, split them into separate commits.

**Example - Wrong:**
```
git add file1.md file2.md file3.md
git commit -m "Add feature A, fix bug B, refactor C"
# Results in 3 changelog entries in one commit - BAD
```

**Example - Correct:**
```
git add file1.md && git commit -m "Add feature A"
git add file2.md && git commit -m "Fix bug B"
git add file3.md && git commit -m "Refactor C"
# Each commit has one changelog entry - GOOD
```

**Why:** Clean git history, easier rollbacks, clearer blame, simpler code review.

## Amending vs New Commit

**CRITICAL:** Before amending, check if the commit has been pushed:

```bash
git log origin/main..HEAD --oneline
```

- **If the commit appears in this list** → Safe to amend (not pushed yet)
- **If the commit does NOT appear** → It's been pushed, create a NEW commit instead

**When a pushed commit needs fixing:**
1. Do NOT use `git commit --amend`
2. Create a new commit with a clear message explaining it fixes the previous commit
3. Example: `Fix: Correct typo in previous commit (a3614c1)`

## Verification Commands

Run these before committing:

```bash
# Check versions match
echo "Plugin version:"
cat plugin/.claude-plugin/plugin.json | grep version

echo "Marketplace version:"
cat .claude-plugin/marketplace.json | grep version

# Check CHANGELOG has entry for new version
head -20 CHANGELOG.md

# Check staged files
git status
```
