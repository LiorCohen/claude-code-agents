---
id: 51
title: GitHub Actions workflow for automated releases
priority: medium
status: complete
created: 2026-01-25
completed: 2026-01-29
plan: ../../plans/complete/PLAN-task-51-github-actions-releases.md
---

# Task 51: Add GitHub Actions workflow for automated releases ✓

## Summary

Added GitHub Actions workflow at `.github/workflows/release.yml` that automatically creates GitHub releases when plugin versions change:
- Triggers on push to main branch
- Compares current vs previous commit's version in `.claude-plugin/marketplace.json`
- Extracts changelog entry for the specific version from CHANGELOG.md using awk
- Creates GitHub release with `v{version}` tag and changelog as release notes
- Uses GitHub CLI (`gh release create`) - no third-party actions
- No release created for infrastructure-only commits (no version change)
