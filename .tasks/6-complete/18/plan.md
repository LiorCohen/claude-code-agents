# Plan: Add Commit Standards Skill Inside Plugin (Task 18)

## Status: COMPLETED

**Completed: 2026-01-29**

---

## Problem Summary

SDD plugin users need commit guidance that helps them create consistent, well-documented commits within SDD-driven projects. Currently, the plugin doesn't provide any commit standards.

## Conventions (from marketplace commit skill)

The plugin skill will use the **same conventions** as the marketplace commit skill:

**Commit Message Format:**
```
[Action] [Component]: [Description]

[Optional detailed explanation]

Co-Authored-By: SDD Plugin vX.Y.Z
```

**Actions:** Add, Fix, Update, Remove, Refactor, Docs, Tasks

**Changelog Categories:** Added, Changed, Enhanced, Fixed, Removed

**Semver:**
- PATCH (x.x.Z): Bug fixes, small improvements
- MINOR (x.Y.0): New features, backwards compatible
- MAJOR (X.0.0): Breaking changes

## Files to Create

| File | Purpose |
|------|---------|
| `plugin/skills/commit-standards/SKILL.md` | Commit standards guide for SDD projects |

## Implementation

### Step 1: Create the commit-standards skill

Create `plugin/skills/commit-standards/SKILL.md` covering:

**0. When This Skill Applies**
- User explicitly asks to commit (e.g., "commit this", "let's commit", "/commit")
- After completing an SDD workflow that produces artifacts:
  - After `sdd-init` creates specs/plans
  - After `sdd-new-change` creates a change spec
  - After implementing a phase from a plan
  - After completing all phases of a change
- When Claude suggests committing work-in-progress

**1. Commit Message Format**
- Action prefixes: Add, Fix, Update, Remove, Refactor, Docs, Tasks
- Component naming (what was changed)
- Version bump suffix when applicable
- Co-Authored-By footer with SDD Plugin version (always verify plugin version with user before committing)
- Examples for each action type

**2. Changelog Standards**
- Directory structure: `changelog/` with per-major-version files (`v1.md`, `v2.md`, etc.)
- Root `CHANGELOG.md` as index with version history table + latest entries
- Entry format: `## [x.y.z] - YYYY-MM-DD`
- Categories: Added, Changed, Enhanced, Fixed, Removed
- Component notation: `**[component]**: Description`
- Rationale section for significant changes
- Update BOTH root `CHANGELOG.md` AND `changelog/vN.md` for each release
- **Commit body = Changelog body**: The detailed description in the commit message should be identical to the changelog entry body (write once, use for both)

**3. Version Bump Guidelines**
- PATCH: Bug fixes, small improvements
- MINOR: New features, backwards compatible
- MAJOR: Breaking changes
- When to bump (which files require version changes)

**4. SDD-Aware Practices**
- Reference change directories in commits when implementing specs
- Commit after spec/plan creation (preserve planning work)
- Commit after each implementation phase
- Update plan status in commits that complete work

**5. Best Practices**
- One commit = one changelog entry (split if needed)
- Atomic commits (one logical change)
- Imperative mood in subject
- Subject under 72 characters
- Body explains "why" not just "what"
- Never amend pushed commits

**6. Verification Checklist**
- Version files match (if applicable)
- Changelog entry exists in BOTH root `CHANGELOG.md` AND `changelog/vN.md`
- All related files staged
- Commit message follows format

## Verification

1. **Skill loads** - Verify skill appears in Claude Code when plugin is active
2. **Convention alignment** - Same actions, categories, format as marketplace skill
3. **SDD integration** - References specs/changes/plans appropriately
4. **Actionable** - Clear examples users can follow

## Notes

- Uses same conventions as marketplace commit skill for consistency
- Adapted for SDD project context (not marketplace infrastructure)
- Skill is documentation-only (no scripts)
