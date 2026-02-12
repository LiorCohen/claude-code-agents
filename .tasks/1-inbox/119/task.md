---
id: 119
title: Add session hook with blurb and plugin update check
status: inbox
priority: medium
created: 2026-02-10
tags: [enhancement, hooks, ux]
---

# Task 119: Add session hook with blurb and plugin update check

## Problem

Users should be greeted with helpful information when starting a new session, including:
1. A brief blurb about the SDD plugin and its purpose
2. A check for plugin updates to ensure they're using the latest version
3. Quick links to key commands and documentation

## Proposed Solution

Create a new session start hook that:
- Displays a concise welcome message explaining SDD's purpose
- Checks if a plugin update is available (compare installed vs latest)
- Shows quick reference to most important commands
- Only runs once per session (not on every message)

## Implementation Notes

- Hook should be lightweight and fast (< 1 second)
- Update check should be non-blocking
- Consider caching update check results to avoid rate limiting
- Should be configurable (user can disable if desired)

## Success Criteria

- Session hook displays on first interaction
- Update notification appears if newer version available
- Welcome message is clear and concise
- Performance impact is negligible
- Hook can be disabled via settings
