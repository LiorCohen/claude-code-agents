---
name: commit-standards
description: Guidelines for consistent, well-documented commits in SDD projects
---

# Commit Standards

Create consistent, well-documented commits that maintain a clear project history and changelog.

---

## When This Skill Applies

**CRITICAL:** Every filesystem change should be committed before continuing to prevent data loss, especially during iterative sessions.

- User explicitly asks to commit (e.g., "commit this", "let's commit", "/commit")
- **After any filesystem change** - files created, modified, or deleted
- After completing an SDD workflow that produces artifacts:
  - After `sdd-init` creates specs/plans
  - After `sdd-new-change` creates a change spec
  - After implementing a phase from a plan
  - After completing all phases of a change
- Before starting a new task or switching context

---

## Commit Message Format

```
[Action] [Component]: [Description], bump to [project version]

[Detailed explanation - same as changelog body]

Co-Authored-By: SDD Plugin vX.Y.Z
```

**IMPORTANT:** Always verify the **project version** with the user (appears in commit message and changelog).

### Actions

| Action | Use When |
|--------|----------|
| Add | New feature or file |
| Fix | Bug fix |
| Update | Enhancement to existing feature |
| Remove | Deletion |
| Refactor | Code restructuring without behavior change |
| Docs | Documentation only |
| Tasks | Task management changes |

### Examples

```
Add user-auth: Implement login and registration flow, bump to 1.2.0

- JWT-based authentication with refresh tokens
- Registration with email verification
- Password reset flow
- Session management utilities

Co-Authored-By: SDD Plugin v5.1.0
```

```
Fix api-gateway: Resolve timeout on large payloads, bump to 1.1.1

Increased default timeout from 30s to 120s for file upload endpoints.
Added chunked transfer encoding support.

Co-Authored-By: SDD Plugin v5.1.0
```

```
Docs specs: Add user-auth change spec and plan

Created change spec and implementation plan for user authentication feature.

Co-Authored-By: SDD Plugin v5.1.0
```

Note: The "bump to X.Y.Z" suffix is only included when a version bump occurs.

---

## Changelog Standards

### Directory Structure

```
changelog/
├── v1.md    # All 1.x releases
├── v2.md    # All 2.x releases
├── v3.md    # All 3.x releases
└── ...
```

All changelog entries go in the appropriate `changelog/vN.md` file based on major version.

### Entry Format

```markdown
## [x.y.z] - YYYY-MM-DD

### [Category]

- **[component]**: Description of change
  - Detail 1
  - Detail 2

### Rationale

Why this change was made (for significant changes).
```

### Categories

| Category | Use When |
|----------|----------|
| Added | New features |
| Changed | Changes to existing functionality |
| Enhanced | Improvements to existing features |
| Fixed | Bug fixes |
| Removed | Removed features |

### Single File Update

Add the changelog entry to `changelog/vN.md` (where N is the major version).

Example: Version `5.1.0` → add entry to `changelog/v5.md`

### Commit Body = Changelog Body

The detailed description in the commit message should be **identical** to the changelog entry body. Write once, use for both:

```
# Commit message body:
- JWT-based authentication with refresh tokens
- Registration with email verification
- Password reset flow

# Changelog entry body (same content):
- **[user-auth]**: Implement login and registration flow
  - JWT-based authentication with refresh tokens
  - Registration with email verification
  - Password reset flow
```

---

## Version Bump Guidelines

### Project Version Location

The project version is stored in `sdd-settings.yaml`:

```yaml
version: 1.2.0
```

This is the single source of truth for the project version.

### Semver

| Type | Version Change | Use When |
|------|----------------|----------|
| PATCH | x.x.Z | Bug fixes, small improvements |
| MINOR | x.Y.0 | New features, backwards compatible |
| MAJOR | X.0.0 | Breaking changes |

### When to Bump

Version bump is required when changing:
- Source code in `src/` or component directories
- Public API or contracts
- Configuration that affects behavior

Version bump is NOT required for:
- Documentation-only changes
- Test-only changes
- Development tooling changes
- Spec/plan creation (planning phase)

---

## SDD-Aware Practices

### Reference Change Directories

When implementing from a spec, reference the change directory:

```
Add user-auth: Implement login flow (changes/2026/01/user-auth)

Implements phase 1 of the user-auth change spec.
```

### Commit at Key Points

1. **After spec/plan creation** - Preserve planning work before implementation
2. **After each implementation phase** - Capture incremental progress
3. **After completing all phases** - Mark the change as complete

### Update Plan Status

When a commit completes work tracked in a plan, update the plan status:

```markdown
## Status: COMPLETED

**Completed: 2026-01-29**
```

---

## Best Practices

### One Commit = One Changelog Entry

If your changes would result in multiple changelog entries, split them into separate commits.

**Wrong:**
```
git add . && git commit -m "Add feature A, fix bug B, refactor C"
# Results in 3 changelog entries in one commit
```

**Correct:**
```
git add feature-files && git commit -m "Add feature A"
git add bugfix-files && git commit -m "Fix bug B"
git add refactor-files && git commit -m "Refactor C"
```

### Atomic Commits

Each commit should represent one logical change. If you can't describe the commit in one sentence, it's probably too big.

### Message Style

- **Imperative mood:** "Add feature" not "Added feature"
- **Subject under 72 characters**
- **Body explains "why"** not just "what"

### Never Amend Pushed Commits

Before amending, check if the commit has been pushed:

```bash
git log origin/main..HEAD --oneline
```

- If the commit appears → Safe to amend
- If NOT → Create a new commit instead

---

## Verification Checklist

Before committing, verify:

```
[ ] Version in sdd-settings.yaml updated (if version bump needed)
[ ] Changelog entry in changelog/vN.md
[ ] Commit body matches changelog body
[ ] All related files staged
[ ] Commit message follows format
[ ] Co-Authored-By includes SDD Plugin version
```

---

## Quick Reference

```
Any filesystem change? → Commit immediately to prevent data loss

Code change? → Version bump → Changelog (changelog/vN.md) → Commit
Docs only?   → Changelog (changelog/vN.md) → Commit
Spec/plan?   → Changelog (changelog/vN.md) → Commit

Always: Verify project version with user before committing
```
