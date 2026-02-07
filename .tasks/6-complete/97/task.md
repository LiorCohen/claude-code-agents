---
id: 97
title: Plugin quality issues — multiple bugs and DX problems
priority: high
status: complete
created: 2026-02-07
completed: 2026-02-07
depends_on: []
blocks: []
---

# Task 97: Plugin quality issues — multiple bugs and DX problems ✓

## Summary

Fixed 7 plugin quality issues discovered during real usage. Bumped to v6.3.1.

## Issues Fixed

1. **Root package.json** — Fixed workspace glob `components/*` → `components/*/*` for nested dirs
2. **External Specifications section** — Removed from changes/INDEX.md template
3. **Verification standards** — Added standards verification step to sdd-change verify
4. **External spec references** — Removed all archived-spec references from 10 downstream files
5. **Webapp config bloat** — Upgraded to Tailwind v4, reduced root configs from 8 to 5
6. **Agents ignoring skills** — Added `skills` frontmatter to all 7 agents (root cause: content not injected)
7. **settings.json format** — Fixed incorrect `.claude/settings.json` format in sdd-init
